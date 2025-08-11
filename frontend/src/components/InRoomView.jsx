import React, { useState, useEffect, useRef, useCallback } from 'react';
import { firestore } from '../firebaseConfig'; // Assuming correct path
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  Timestamp, // Import Timestamp
  writeBatch,
  limit,
  serverTimestamp, // Use server timestamp
} from 'firebase/firestore';

import TranscriptLog from './TranscriptArea';
import Controls from './Controls';

// Web Speech API Polyfill
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

function InRoomView({ roomId, roomName, userName, isCaller, onLeaveRoom }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [peerConnectionStatus, setPeerConnectionStatus] = useState('new'); // Or 'connecting', 'connected', 'disconnected', 'failed', 'closed'
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Refs for objects that shouldn't trigger re-renders on change
  const peerConnectionRef = useRef(null);
  const recognitionRef = useRef(null);
  const roomRef = useRef(null); // Store Firebase doc ref

  // Refs for unsubscribing listeners
  const unsubscribeRoomRef = useRef(null);
  const unsubscribeMessagesRef = useRef(null);
  const unsubscribeCallerCandidatesRef = useRef(null);
  const unsubscribeCalleeCandidatesRef = useRef(null);

  // --- Initialization and Cleanup Effects ---

  // Initialize Media and Recognition
  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setIsMicEnabled(stream.getAudioTracks().some(t => t.enabled));
        setIsCameraEnabled(stream.getVideoTracks().some(t => t.enabled));
        setRemoteStream(new MediaStream()); // Initialize remote stream
      } catch (error) {
        console.error("Error accessing media devices.", error);
        alert("Could not access camera/microphone. Please check permissions.");
        onLeaveRoom(); // Go back if media fails
      }
    }

    function setupRecognition() {
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = handleRecognitionResult;
            recognitionRef.current.onerror = handleRecognitionError;
            recognitionRef.current.onend = handleRecognitionEnd;
            console.log("Speech Recognition ready.");
        } else {
            console.warn("Speech Recognition not supported.");
        }
    }

    if (!firestore) {
        console.error("Firestore not available!");
        alert("Error connecting to backend. Cannot proceed.");
        onLeaveRoom();
        return;
    }

    roomRef.current = doc(firestore, 'rooms', roomId); // Set the roomRef

    setupMedia();
    setupRecognition();

    // Cleanup function: stops media tracks when component unmounts
    return () => {
      console.log("Cleaning up media streams...");
      localStream?.getTracks().forEach(track => track.stop());
      remoteStream?.getTracks().forEach(track => track.stop()); // Also stop remote tracks if any exist
      stopSpeechRecognition(); // Ensure recognition stops
      // Firebase cleanup happens in hangUp -> onLeaveRoom effect
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, onLeaveRoom]); // Run only when roomId changes or onLeaveRoom changes (unlikely)

  // --- WebRTC and Firebase Signaling Effect ---
  useEffect(() => {
    if (!localStream || !roomRef.current) {
        console.log("WebRTC setup waiting for local stream or roomRef...");
      return; // Wait for local stream and roomRef
    }

    console.log("Setting up PeerConnection and Firebase listeners...");
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    const pc = peerConnectionRef.current; // Alias for easier use

    // Add local tracks
    localStream.getTracks().forEach(track => {
      try { pc.addTrack(track, localStream); } catch (e) { console.error("Error adding track:", e); }
    });

    // Setup PeerConnection event listeners
    pc.ontrack = event => {
      console.log("Remote track received:", event.track.kind);
      event.streams[0].getTracks().forEach(track => {
          // Use functional update for remoteStream state if needed
          setRemoteStream(prevStream => {
              if (!prevStream.getTrackById(track.id)) {
                  prevStream.addTrack(track);
              }
              return prevStream; // Must return the stream
          });
      });
    };

    pc.onicecandidate = event => {
      if (event.candidate && roomRef.current) {
          const candidatesCollection = collection(roomRef.current, isCaller ? 'callerCandidates' : 'calleeCandidates');
          addDoc(candidatesCollection, event.candidate.toJSON()).catch(e => console.error("ICE send error:", e));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc) {
          setPeerConnectionStatus(pc.connectionState);
          console.log(`Peer Connection state: ${pc.connectionState}`);
          if (pc.connectionState === 'connected') {
               console.log("Peers connected! Starting transcript listener.");
               listenForTranscriptMessages();
               // Start STT if mic is enabled after connection
               if (isMicEnabled) startSpeechRecognition();
          } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
               console.warn("Peer Connection lost or failed.");
               stopListeningForMessages(); // Stop message listener on disconnect
               stopSpeechRecognition();
          }
      }
    };

    // --- Signaling Logic ---
    async function setupSignaling() {
      const callerCandidatesCollection = collection(roomRef.current, 'callerCandidates');
      const calleeCandidatesCollection = collection(roomRef.current, 'calleeCandidates');

      if (isCaller) {
          // Create Offer
          try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              const roomWithOffer = {
                  name: roomName,
                  offer: { type: offer.type, sdp: offer.sdp },
                  createdAt: serverTimestamp() // Use server timestamp
              };
              await setDoc(roomRef.current, roomWithOffer); // Use setDoc to create/overwrite
              console.log("Offer saved.");
          } catch (e) { console.error("Error creating/saving offer:", e); return; } // Exit if offer fails

          // Listen for Answer
          unsubscribeRoomRef.current = onSnapshot(roomRef.current, async (snapshot) => {
              const data = snapshot.data();
              if (pc && !pc.currentRemoteDescription && data?.answer) {
                  console.log("Received answer.");
                  try {
                      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                      console.log("Remote description (answer) set.");
                  } catch (e) { console.error("Error setting answer:", e); }
              }
          }, e => { console.error("Room listener error:", e); });

          // Listen for Callee's ICE candidates
          unsubscribeCalleeCandidatesRef.current = onSnapshot(calleeCandidatesCollection, (snapshot) => {
               snapshot.docChanges().forEach(async (change) => {
                   if (change.type === 'added' && pc?.currentRemoteDescription) { // Ensure remote desc is set
                       try { await pc.addIceCandidate(new RTCIceCandidate(change.doc.data())); }
                       catch (e) { if (!e.message.includes("transceiver-inactive")) console.warn("Error adding callee ICE:", e); }
                   }
               });
           }, e => console.error("Callee candidate listener error:", e));

      } else { // Joiner
          try {
              const roomSnapshot = await getDoc(roomRef.current);
              if (!roomSnapshot.exists()) throw new Error("Room not found");
              const roomData = roomSnapshot.data();
              if (!roomData?.offer) throw new Error("Offer missing in room.");

              await pc.setRemoteDescription(new RTCSessionDescription(roomData.offer));
              console.log("Remote description (offer) set.");

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              const answerData = { answer: { type: answer.type, sdp: answer.sdp } };
              await updateDoc(roomRef.current, answerData); // Use updateDoc to add answer
              console.log("Answer saved.");

          } catch (e) { console.error("Error joining/answering:", e); onLeaveRoom(); return; } // Leave if join fails

           // Listen for Caller's ICE candidates
           unsubscribeCallerCandidatesRef.current = onSnapshot(callerCandidatesCollection, (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === 'added' && pc) { // Check pc exists
                        try { await pc.addIceCandidate(new RTCIceCandidate(change.doc.data())); }
                        catch (e) { if (!e.message.includes("transceiver-inactive")) console.warn("Error adding caller ICE:", e); }
                    }
                });
            }, e => console.error("Caller candidate listener error:", e));
      }
    }

    setupSignaling();

    // Cleanup function for THIS effect
    return () => {
      console.log("Cleaning up PeerConnection and Firebase listeners...");
      // Unsubscribe from all listeners
      unsubscribeRoomRef.current?.();
      unsubscribeMessagesRef.current?.();
      unsubscribeCallerCandidatesRef.current?.();
      unsubscribeCalleeCandidatesRef.current?.();
      unsubscribeRoomRef.current = null;
      unsubscribeMessagesRef.current = null;
      unsubscribeCallerCandidatesRef.current = null;
      unsubscribeCalleeCandidatesRef.current = null;


      // Close Peer Connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setPeerConnectionStatus('closed'); // Update status on cleanup
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, roomId, isCaller, roomName]); // Dependencies that trigger re-setup

  // --- Transcript Message Listener ---
  const listenForTranscriptMessages = useCallback(() => {
      if (!roomRef.current || unsubscribeMessagesRef.current) return; // Already listening or no roomRef

      console.log("Setting up listener for transcript messages...");
      const messagesCollection = collection(roomRef.current, 'messages');
      const q = query(messagesCollection, orderBy('timestamp', 'asc')); // Order messages

      unsubscribeMessagesRef.current = onSnapshot(q, (snapshot) => {
          const newMessages = [];
          snapshot.docChanges().forEach(change => {
              if (change.type === 'added') {
                  const msgData = change.doc.data();
                  // Convert Firestore Timestamp to JS Date if needed, or just store
                  newMessages.push({
                      id: change.doc.id, // Add message ID
                      ...msgData,
                      // timestamp: msgData.timestamp?.toDate() // Optional: convert
                  });
              }
              // Handle modifications/deletions if necessary
          });

          // Update transcript state functionally to append new messages
          if (newMessages.length > 0) {
             setTranscriptMessages(prevMessages => [...prevMessages, ...newMessages]);
          }

      }, error => {
          console.error("Error listening to messages:", error);
          unsubscribeMessagesRef.current = null; // Reset on error
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Dependency: roomId (via roomRef.current)

  const stopListeningForMessages = useCallback(() => {
        if (unsubscribeMessagesRef.current) {
            console.log("Stopping message listener.");
            unsubscribeMessagesRef.current();
            unsubscribeMessagesRef.current = null;
        }
  }, []);

  // --- Speech Recognition Handlers ---
  const startSpeechRecognition = useCallback(() => {
      if (!recognitionRef.current || isRecognizing) return;
      if (!localStream || !localStream.getAudioTracks().some(track => track.enabled && !track.muted)) {
          console.log("STT not started: Mic muted/unavailable.");
          return;
      }
      try {
          console.log("Starting STT...");
          recognitionRef.current.start();
          setIsRecognizing(true);
      } catch (e) { console.error("Error starting STT:", e); setIsRecognizing(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, isRecognizing]); // Depend on stream and recognizing state

  const stopSpeechRecognition = useCallback(() => {
      if (!recognitionRef.current || !isRecognizing) return;
      console.log("Stopping STT...");
      recognitionRef.current.stop();
      setIsRecognizing(false); // State update handled by onend
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecognizing]);

  const handleRecognitionResult = useCallback(async (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
          }
      }
      finalTranscript = finalTranscript.trim();
      if (finalTranscript && roomRef.current) {
          console.log("STT Final:", finalTranscript);
          // --- Fact-Checking Call REMOVED ---
          // Display locally (no pending state needed now)
          // We rely on the Firebase listener to eventually show our own message too,
          // OR we could add it directly here AND filter it out in the listener.
          // Let's send it to Firebase and let the listener handle display for consistency.

          // Send transcript WITHOUT fact-check result
          try {
              const messagesCollection = collection(roomRef.current, 'messages');
              await addDoc(messagesCollection, {
                  speaker: userName,
                  text: finalTranscript,
                  timestamp: serverTimestamp() // Use server time
              });
          } catch (error) {
              console.error("Error sending transcript to Firestore:", error);
          }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]); // Depend on userName

  const handleRecognitionError = useCallback((event) => {
      console.error('STT error:', event.error, event.message);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          alert("Speech recognition permission denied or service unavailable.");
          stopSpeechRecognition(); // Stop trying if not allowed
      }
      setIsRecognizing(false);
  }, [stopSpeechRecognition]);

  const handleRecognitionEnd = useCallback(() => {
      console.log("STT ended.");
      setIsRecognizing(false);
      // Auto-restart logic
      if (peerConnectionRef.current?.connectionState === 'connected' &&
          localStream?.getAudioTracks().some(track => track.enabled && !track.muted))
      {
          console.log("Attempting STT restart...");
          setTimeout(() => {
              if (peerConnectionRef.current?.connectionState === 'connected' &&
                  localStream?.getAudioTracks().some(track => track.enabled && !track.muted))
              { startSpeechRecognition(); }
          }, 500);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, startSpeechRecognition]);


  // --- Control Handlers ---
  const toggleMic = useCallback(() => {
      if (!localStream) return;
      let enabled = false;
      localStream.getAudioTracks().forEach(track => {
          track.enabled = !track.enabled;
          enabled = track.enabled;
      });
      setIsMicEnabled(enabled);
      if (enabled) startSpeechRecognition(); else stopSpeechRecognition();
  }, [localStream, startSpeechRecognition, stopSpeechRecognition]);

  const toggleCamera = useCallback(() => {
      if (!localStream) return;
      let enabled = false;
      localStream.getVideoTracks().forEach(track => {
          track.enabled = !track.enabled;
          enabled = track.enabled;
      });
      setIsCameraEnabled(enabled);
  }, [localStream]);

  // --- Hang Up Logic (calls parent) ---
  const hangUp = useCallback(async () => {
      console.log("Hangup initiated by user...");
      stopSpeechRecognition(); // Stop STT

      // Stop listeners (redundant with useEffect cleanup but safe)
      unsubscribeRoomRef.current?.();
      unsubscribeMessagesRef.current?.();
      unsubscribeCallerCandidatesRef.current?.();
      unsubscribeCalleeCandidatesRef.current?.();
      unsubscribeRoomRef.current = null;
      unsubscribeMessagesRef.current = null;
      unsubscribeCallerCandidatesRef.current = null;
      unsubscribeCalleeCandidatesRef.current = null;


      // Close connection
      if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
      }
      setPeerConnectionStatus('closed');


      // Optional: Firebase Cleanup (Creator deletes room)
      if (isCaller && roomRef.current) {
          console.log("Creator leaving, deleting room data...");
          try {
              const batch = writeBatch(firestore);
              const collectionsToDelete = ['callerCandidates', 'calleeCandidates', 'messages'];
              for (const collName of collectionsToDelete) {
                  const q = query(collection(roomRef.current, collName), limit(50)); // Batch limit
                  const snapshot = await getDocs(q);
                  snapshot.docs.forEach(doc => batch.delete(doc.ref));
              }
              batch.delete(roomRef.current); // Delete room doc itself
              await batch.commit();
              console.log("Room deleted.");
          } catch (error) {
              console.error("Error deleting room data:", error);
          }
      }

      onLeaveRoom(); // Trigger state change in App component

  }, [isCaller, onLeaveRoom]); // Dependencies for hangUp

  return (
    <div className="container in-room-layout">
      <header className="room-header">
        <h1 id="room-title-display">{roomName}</h1>
        <span id="room-id-header-display">Room ID: {roomId}</span>
      </header>

      <main className="main-content">
        <div id="video-grid">
          <VideoPlayer stream={localStream} isMuted={true} name={userName} id="localVideo" />
          <VideoPlayer stream={remoteStream} name="Remote" id="remoteVideo" />
          {/* Placeholder */}
           <div className="video-participant-container placeholder">
               <i className="fas fa-user placeholder-icon"></i>
                <div className="participant-info">
                   <span className="name-label">Waiting...</span>
               </div>
           </div>
        </div>
        <TranscriptLog messages={transcriptMessages} />
      </main>

      <Controls
        isMicEnabled={isMicEnabled}
        isCameraEnabled={isCameraEnabled}
        roomId={roomId}
        roomName={roomName}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onHangUp={hangUp}
        isCaller={isCaller}
      />
    </div>
  );
}

export default InRoomView;

// Helper function to get docs for batch delete (not strictly necessary for limit(50))
// async function getDocsToDelete(collectionRef) {
//     const snapshot = await getDocs(query(collectionRef, limit(50))); // Limit batch size
//     return snapshot.docs;
// }