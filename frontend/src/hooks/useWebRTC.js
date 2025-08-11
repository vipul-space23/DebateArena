// // frontend/src/hooks/useWebRTC.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebaseConfig'; // Adjust path if needed
import {
    collection, doc, addDoc, setDoc, getDoc, updateDoc, onSnapshot,
    query, // Keep query if needed elsewhere or for specific listeners
    writeBatch, deleteDoc, // Keep if cleanup uses them
    serverTimestamp, getDocs // Import getDocs for cleanup logic
} from 'firebase/firestore';

// WebRTC configuration (STUN servers)
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers here for production for better reliability
    ]
};

export function useWebRTC() {
    // --- State Variables ---
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [roomId, setRoomId] = useState(null); // Set via setRoomId from App.jsx
    const [isMicEnabled, setIsMicEnabled] = useState(false); // Start muted
    const [isCameraEnabled, setIsCameraEnabled] = useState(true); // Start camera on
    const [isConnected, setIsConnected] = useState(false); // Track peer connection status
    const [isCreator, setIsCreator] = useState(false); // Track user role

    // --- Refs ---
    const pcRef = useRef(null); // Stores the RTCPeerConnection instance
    const roomRefRef = useRef(null); // Stores the Firestore document reference for the current room
    const localStreamRef = useRef(null); // Stores the actual MediaStream object
    const unsubscribersRef = useRef([]); // Stores Firestore listener cleanup functions

    // --- Cleanup Function ---
    const cleanup = useCallback(async (deleteRoomData = false) => {
        console.log('[WebRTC Cleanup] Starting cleanup. Delete Room Data:', deleteRoomData);

        // 1. Detach Firestore listeners
        console.log(`[WebRTC Cleanup] Unsubscribing ${unsubscribersRef.current.length} listeners.`);
        unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
        unsubscribersRef.current = []; // Clear the array

        // 2. Close PeerConnection
        if (pcRef.current) {
            // Remove event listeners first to prevent errors during closing
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.onconnectionstatechange = null;

            // Stop all tracks being sent
            pcRef.current.getSenders().forEach(sender => {
                sender.track?.stop(); // Stop track if it exists
            });

            pcRef.current.close(); // Close the connection
            pcRef.current = null; // Nullify the ref
            console.log('[WebRTC Cleanup] Peer connection closed.');
        } else {
             console.log('[WebRTC Cleanup] No active peer connection to close.');
        }

        // 3. Stop local media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            console.log('[WebRTC Cleanup] Local media tracks stopped.');
            localStreamRef.current = null; // Nullify the ref
        } else {
            console.log('[WebRTC Cleanup] No local stream to stop.');
        }


        // 4. Reset State Variables
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnected(false);
        setIsMicEnabled(false); // Reset to default muted
        setIsCameraEnabled(true); // Reset to default on
        // Keep roomId and isCreator state for potential deletion logic if needed immediately after
        console.log('[WebRTC Cleanup] React state reset.');


        // 5. Optional Firestore Deletion (Only if creator and flag is true)
        if (deleteRoomData && isCreator && roomRefRef.current) { // Added isCreator check
            console.log(`[WebRTC Cleanup] Creator hanging up - attempting to delete room data for ${roomRefRef.current.id}...`);
             try {
                const collectionsToDelete = ['callerCandidates', 'calleeCandidates', 'messages'];
                const batch = writeBatch(db);

                // Delete subcollection documents (consider batching limitations for large numbers)
                for (const collName of collectionsToDelete) {
                    const collRef = collection(db, roomRefRef.current.path, collName);
                    // Fetch docs before deleting in a batch
                    const snapshot = await getDocs(query(collRef)); // Fetch all docs in subcollection
                    if (!snapshot.empty) {
                         console.log(`[WebRTC Cleanup] Deleting ${snapshot.size} docs from subcollection: ${collName}`);
                         snapshot.docs.forEach(docSnapshot => batch.delete(docSnapshot.ref));
                    }
                }

                 // Delete the main room document
                console.log(`[WebRTC Cleanup] Deleting main room document: ${roomRefRef.current.id}`);
                batch.delete(roomRefRef.current);

                await batch.commit(); // Execute the batch delete
                console.log("[WebRTC Cleanup] Room data deleted successfully from Firestore.");
             } catch (error) {
                 console.error("[WebRTC Cleanup] Error deleting room data:", error);
             }
        } else if (deleteRoomData && !isCreator) {
             console.log("[WebRTC Cleanup] Joiner hanging up - not deleting room data.");
        }

        // 6. Reset Refs (Room ID reset should happen in App.jsx)
        roomRefRef.current = null; // Reset Firestore room reference

         console.log('[WebRTC Cleanup] Finished.');

    }, [isCreator]); // Include isCreator dependency for cleanup logic

    // --- Get User Media ---
    const openUserMedia = useCallback(async () => {
        console.log("[WebRTC Action] Requesting user media (camera, microphone)...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            // Mute audio tracks by default
            let initialMicEnabled = false; // Start assuming false
            stream.getAudioTracks().forEach(track => {
                track.enabled = false; // Mute the track
                 console.log("[WebRTC Action] Audio track initially MUTED.");
            });
            setIsMicEnabled(false); // Set state to reflect muted state

            // Check initial camera state (usually true unless blocked)
            let initialCamEnabled = stream.getVideoTracks().some(track => track.enabled);
            setIsCameraEnabled(initialCamEnabled);
             console.log(`[WebRTC Action] Camera track initially ENABLED: ${initialCamEnabled}`);

            setLocalStream(stream); // Update state for UI
            localStreamRef.current = stream; // Store ref for internal use
            console.log("[WebRTC Action] Local stream acquired.");
            setRemoteStream(new MediaStream()); // Initialize empty remote stream
            return stream; // Return the stream object
        } catch (error) {
            console.error("[WebRTC Action] ERROR accessing media devices:", error);
            alert(`Could not access camera/microphone: ${error.message}. Please check browser permissions.`);
            throw error; // Propagate error up
        }
    }, []); // No dependencies needed

    // --- Setup Peer Connection and Signaling ---
    const setupPeerConnection = useCallback(async (currentRoomId, isCallerFlag) => {
        console.log(`[WebRTC Signaling] START setupPeerConnection. Room: ${currentRoomId}, Is Caller: ${isCallerFlag}`);

        // Pre-checks
        if (!localStreamRef.current) {
             console.error("[WebRTC Signaling] ERROR: Local stream not available before setupPeerConnection.");
             throw new Error("Local stream required.");
        }
        if (pcRef.current) { // Avoid creating multiple connections for the same session
             console.warn("[WebRTC Signaling] WARNING: PeerConnection already exists. Cleaning up previous one.");
             unsubscribersRef.current.forEach(unsub => unsub());
             unsubscribersRef.current = [];
             pcRef.current.close();
             pcRef.current = null;
        }

         // Set role and room ref
         setIsCreator(isCallerFlag);
         roomRefRef.current = doc(db, 'rooms', currentRoomId); // Set Firestore reference

         // Create Peer Connection
         const pc = new RTCPeerConnection(configuration);
         pcRef.current = pc; // Store reference
         console.log("[WebRTC Signaling] RTCPeerConnection created.");

        // Add local tracks to the connection
        localStreamRef.current.getTracks().forEach(track => {
             try {
                pc.addTrack(track, localStreamRef.current);
                console.log(`[WebRTC Signaling] Added local track: ${track.kind}`);
             } catch(e) { console.error("[WebRTC Signaling] ERROR adding local track:", e); }
        });

         // --- Shared Event Handlers for the Peer Connection ---

         // Handle receiving remote tracks
         pc.ontrack = (event) => {
            console.log(`[WebRTC Event] pc.ontrack - Received remote track kind: ${event.track.kind}`);
            setRemoteStream(prevRemoteStream => {
                // Ensure we have a valid stream to add to
                const stream = (prevRemoteStream && prevRemoteStream.active) ? prevRemoteStream : new MediaStream();
                event.streams[0].getTracks().forEach((track) => {
                    if (!stream.getTrackById(track.id)) { // Avoid duplicates
                        console.log(`[WebRTC Event] pc.ontrack - Adding track ID ${track.id} kind ${track.kind} to remote stream.`);
                        stream.addTrack(track);
                    } else {
                         console.log(`[WebRTC Event] pc.ontrack - Track ID ${track.id} already exists in remote stream.`);
                    }
                });
                return stream; // Return the updated or new stream
            });
         };

         // Handle generating local ICE candidates
         pc.onicecandidate = (event) => {
             if (event.candidate && roomRefRef.current) {
                 // console.log(`[WebRTC Event] pc.onicecandidate - Generated local ICE candidate.`); // Less verbose log
                 const candidatesCollection = collection(db, roomRefRef.current.path, isCallerFlag ? 'callerCandidates' : 'calleeCandidates');
                 // console.log(`[WebRTC Signaling] Saving local ICE candidate to Firestore collection: ${isCallerFlag ? 'callerCandidates' : 'calleeCandidates'}`); // Less verbose log
                 addDoc(candidatesCollection, event.candidate.toJSON())
                    // .then(() => console.log(`[WebRTC Signaling] Saved local ICE candidate.`)) // Less verbose log
                    .catch(e=>console.error("[WebRTC Signaling] ERROR saving local ICE candidate:",e));
             } else if (!event.candidate) {
                  // console.log("[WebRTC Event] pc.onicecandidate - All local ICE candidates generated."); // Less verbose log
             }
         };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            if (pcRef.current) {
               const currentState = pcRef.current.connectionState;
               console.log(`[WebRTC Event] pc.onconnectionstatechange - Current State: ${currentState}`); // Log state change
               const shouldBeConnected = currentState === 'connected';
               // Log *before* setting React state
               console.log(`[WebRTC State] Calling setIsConnected with value: ${shouldBeConnected}`);
               setIsConnected(shouldBeConnected); // Update React state
               if (shouldBeConnected) {
                    console.log("[WebRTC State] **** CONNECTION ESTABLISHED (isConnected set to true) ****"); // Highlight success
               }
                if (currentState === 'failed' || currentState === 'disconnected' || currentState === 'closed') {
                    console.warn(`[WebRTC State] Connection state problematic: ${currentState}`);
                    // Could trigger cleanup or UI notification here
                }
            } else {
                console.log("[WebRTC Event] onconnectionstatechange called but pcRef is null.");
            }
        };

         // --- Signaling Logic (Offer/Answer and ICE Exchange via Firestore) ---
         let newUnsubscribers = []; // Store cleanup functions for this specific setup

         if (isCallerFlag) {
            // --- CALLER LOGIC ---
             console.log("[WebRTC Signaling] Starting Caller Logic...");
             const remoteCandidatesCollection = collection(db, roomRefRef.current.path, 'calleeCandidates');
             try {
                 console.log("[WebRTC Signaling] Caller: Creating Offer...");
                 const offer = await pc.createOffer();
                 console.log("[WebRTC Signaling] Caller: Setting Local Description (Offer)...");
                 await pc.setLocalDescription(offer);
                 console.log("[WebRTC Signaling] Caller: Local Description (Offer) SET.");

                 const roomWithOffer = {
                     offer: { type: offer.type, sdp: offer.sdp },
                     createdAt: serverTimestamp()
                     // Consider adding creator's name here if needed by joiner immediately
                 };
                 console.log("[WebRTC Signaling] Caller: Saving Offer to Firestore...");
                 await setDoc(roomRefRef.current, roomWithOffer); // Create/overwrite document with offer
                 console.log("[WebRTC Signaling] Caller: Offer SAVED to Firestore.");

                 // Listen for the Answer
                 console.log("[WebRTC Signaling] Caller: Setting up Firestore listener for Answer...");
                 const roomUnsub = onSnapshot(roomRefRef.current, async (snapshot) => {
                     const data = snapshot.data();
                      console.log("[WebRTC Signaling] Caller: Room Snapshot Received. Has Answer:", !!data?.answer);
                     if (pcRef.current && !pcRef.current.currentRemoteDescription && data?.answer) {
                         console.log("[WebRTC Signaling] Caller: Received Answer from Firestore!");
                         const answerDescription = new RTCSessionDescription(data.answer);
                         console.log("[WebRTC Signaling] Caller: Setting Remote Description (Answer)...");
                         try {
                             await pcRef.current.setRemoteDescription(answerDescription);
                             console.log("[WebRTC Signaling] Caller: Remote Description (Answer) SET.");
                         } catch (e) { console.error("[WebRTC Signaling] Caller: ERROR setting Remote Description (Answer):", e); }
                     }
                 }, error => console.error("[WebRTC Signaling] Caller: Room snapshot error:", error));
                 newUnsubscribers.push(roomUnsub);

                  // Listen for Callee Candidates
                  console.log("[WebRTC Signaling] Caller: Setting up Firestore listener for Callee ICE Candidates...");
                  const calleeUnsub = onSnapshot(remoteCandidatesCollection, (snapshot) => {
                     snapshot.docChanges().forEach(async (change) => {
                         if (change.type === 'added') {
                             const candidateData = change.doc.data();
                             console.log("[WebRTC Signaling] Caller: Received Callee ICE Candidate data from Firestore.");
                            if (pcRef.current?.currentRemoteDescription) {
                                console.log("[WebRTC Signaling] Caller: Adding Callee ICE Candidate...");
                                try {
                                     await pcRef.current.addIceCandidate(new RTCIceCandidate(candidateData));
                                     console.log("[WebRTC Signaling] Caller: Added Callee ICE Candidate SUCCEEDED.");
                                } catch (e) {
                                     // Log only significant errors
                                     if (!e.message.includes("inactive") && !e.message.includes("pending remote description")) {
                                         console.warn("[WebRTC Signaling] Caller: WARN adding Callee ICE candidate:", e);
                                     }
                                }
                            } else {
                                 console.log("[WebRTC Signaling] Caller: Deferred adding Callee ICE (Remote Desc not set yet).");
                            }
                         }
                     });
                 }, error => console.error("[WebRTC Signaling] Caller: Callee candidates snapshot error:", error));
                 newUnsubscribers.push(calleeUnsub);

             } catch (error) {
                  console.error("[WebRTC Signaling] ERROR during Caller setup:", error);
                  cleanup(true); // Attempt cleanup and delete room data
                  throw error; // Propagate error
             }

         } else {
            // --- CALLEE LOGIC ---
             console.log("[WebRTC Signaling] Starting Callee Logic...");
             const remoteCandidatesCollection = collection(db, roomRefRef.current.path, 'callerCandidates');
             try {
                 console.log("[WebRTC Signaling] Callee: Fetching Room document from Firestore...");
                 const roomSnapshot = await getDoc(roomRefRef.current);
                 if (!roomSnapshot.exists() || !roomSnapshot.data()?.offer) {
                     console.error("[WebRTC Signaling] Callee: ERROR - Room document or Offer field not found.");
                     throw new Error("Room or offer not found.");
                 }
                 const roomData = roomSnapshot.data();
                 console.log("[WebRTC Signaling] Callee: Room document fetched successfully.");

                 const offerDescription = new RTCSessionDescription(roomData.offer);
                 console.log("[WebRTC Signaling] Callee: Setting Remote Description (Offer)...");
                 await pc.setRemoteDescription(offerDescription);
                 console.log("[WebRTC Signaling] Callee: Remote Description (Offer) SET.");

                 console.log("[WebRTC Signaling] Callee: Creating Answer...");
                 const answer = await pc.createAnswer();
                 console.log("[WebRTC Signaling] Callee: Setting Local Description (Answer)...");
                 await pc.setLocalDescription(answer);
                 console.log("[WebRTC Signaling] Callee: Local Description (Answer) SET.");

                 const answerData = { answer: { type: answer.type, sdp: answer.sdp } };
                 // Consider adding joiner's name here: answerData.joinerName = userName (need userName passed in)
                 console.log("[WebRTC Signaling] Callee: Saving Answer to Firestore...");
                 await updateDoc(roomRefRef.current, answerData); // Use updateDoc to add answer field
                 console.log("[WebRTC Signaling] Callee: Answer SAVED to Firestore.");

                 // Listen for Caller Candidates
                 console.log("[WebRTC Signaling] Callee: Setting up Firestore listener for Caller ICE Candidates...");
                 const callerUnsub = onSnapshot(remoteCandidatesCollection, (snapshot) => {
                     snapshot.docChanges().forEach(async (change) => {
                         if (change.type === 'added' && pcRef.current) { // Check pcRef just in case
                             const candidateData = change.doc.data();
                             console.log("[WebRTC Signaling] Callee: Received Caller ICE Candidate data from Firestore.");
                             console.log("[WebRTC Signaling] Callee: Adding Caller ICE Candidate...");
                             try {
                                 await pcRef.current.addIceCandidate(new RTCIceCandidate(candidateData));
                                  console.log("[WebRTC Signaling] Callee: Added Caller ICE Candidate SUCCEEDED.");
                             } catch (e) {
                                 if (!e.message.includes("inactive") && !e.message.includes("pending remote description")) {
                                     console.warn("[WebRTC Signaling] Callee: WARN adding Caller ICE candidate:", e);
                                 }
                             }
                         }
                     });
                 }, error => console.error("[WebRTC Signaling] Callee: Caller candidates snapshot error:", error));
                 newUnsubscribers.push(callerUnsub);

             } catch (error) {
                 console.error("[WebRTC Signaling] ERROR during Callee setup:", error);
                 cleanup(false); // Callee cleanup doesn't delete room data
                 throw error; // Propagate error
             }
         }
         unsubscribersRef.current = newUnsubscribers; // Store cleanup functions
         console.log(`[WebRTC Signaling] END setupPeerConnection. Listeners set up: ${newUnsubscribers.length}`); // Log End

    }, [cleanup]); // Keep cleanup dependency, maybe add db if strictly needed?

    // --- Control Functions ---
     const toggleMic = useCallback(() => {
         if (!localStreamRef.current) { console.warn("toggleMic called but no local stream."); return; }
         let enabled = false;
         localStreamRef.current.getAudioTracks().forEach(track => {
             track.enabled = !track.enabled; // Toggle
             enabled = track.enabled;       // Get the new state
         });
         setIsMicEnabled(enabled); // Update the state
         console.log("[WebRTC Action] Mic toggled via hook:", enabled);
     }, []); // No dependencies needed

     const toggleCamera = useCallback(() => {
         if (!localStreamRef.current) { console.warn("toggleCamera called but no local stream."); return; }
         let enabled = false;
         localStreamRef.current.getVideoTracks().forEach(track => {
             track.enabled = !track.enabled;
             enabled = track.enabled;
         });
         setIsCameraEnabled(enabled); // Update state
         console.log("[WebRTC Action] Camera toggled via hook:", enabled);
     }, []); // No dependencies needed

    // --- Public API of the Hook ---
    return {
        // State
        localStream,
        remoteStream,
        roomId, // Expose roomId managed by hook
        isMicEnabled,
        isCameraEnabled,
        isConnected,
        isCreator,
        // Functions
        openUserMedia,
        setupPeerConnection,
        setRoomId, // Allow App to set RoomId before setup
        hangUp: cleanup, // Expose cleanup function as hangUp
        toggleMic,
        toggleCamera,
    };
} // End of useWebRTC hook