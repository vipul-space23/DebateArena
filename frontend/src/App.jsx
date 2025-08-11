// frontend/src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Landing Page Components --- (Ensuring all are imported)
import LandingNavbar from './components/landing/LandingNavbar';        // Assuming path is correct
import LandingHero from './components/landing/LandingHero';          // Assuming path is correct
import LandingFeatured from './components/landing/LandingFeatured';    // Assuming path is correct
import LandingHowItWorks from './components/landing/LandingHowItWorks'; // Assuming path is correct
import LandingCTA from './components/landing/LandingCTA';            // Assuming path is correct
import LandingFooter from './components/landing/LandingFooter';        // Assuming path is correct

// --- In-Room App Components ---
import InitialForms from './components/InitialForms';
import VideoGrid from './components/Videogrid';
import Sidebar from './components/Sidebar';
import ControlsBar from './components/ControlsBar';
import Header from './components/Header'; // Assuming Header component exists

// --- Hooks and Firebase ---
import { useWebRTC } from './hooks/useWebRTC';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { db } from './firebaseConfig';
import {
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
    doc, updateDoc, getDoc, writeBatch, getDocs
} from 'firebase/firestore';

// --- Backend API URL ---
const FACT_CHECK_API_URL = 'http://localhost:3000/api/fact-check'; // Ensure Port is Correct

// --- Helper function for STT check ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// --- Main App Component ---
function App() {
    // --- State ---
    const [view, setView] = useState('landing');
    const [userName, setUserName] = useState("");
    const [currentRoomName, setCurrentRoomName] = useState("Debate Room");
    const [allMessages, setAllMessages] = useState([]);
    const messagesUnsubscribeRef = useRef(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState('transcript');

    // --- WebRTC Hook ---
    const {
        localStream, remoteStream, roomId, isMicEnabled, isCameraEnabled,
        isConnected, isCreator, openUserMedia, setupPeerConnection, setRoomId,
        hangUp: webRTCHangUp, toggleMic: webRTCToggleMic, toggleCamera,
    } = useWebRTC();

    // --- Speech Recognition Hook Callback ---
    const handleTranscript = useCallback(async (transcript) => {
        if (!roomId || !db || !userName || !currentRoomName) return;
        let factCheckResult = { isFact: null, reason: "Checking..." };
        const pendingMessageId = `local-stt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const pendingMessage = { id: pendingMessageId, type: 'stt', speaker: userName, text: transcript, isFact: null, reason: factCheckResult.reason, timestamp: new Date() };
        setAllMessages(prev => [...prev, pendingMessage]);
        try {
            const response = await fetch(FACT_CHECK_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: transcript, roomName: currentRoomName }), });
            if (!response.ok) { const errorData = await response.json().catch(() => ({ error: `Backend error: ${response.status}` })); throw new Error(errorData.error || `Backend error: ${response.status}`); }
            factCheckResult = await response.json();
        } catch (error) {
            console.error("[Transcript Handling] Backend fetch FAILED:", error);
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) { alert(`Error: Could not connect to the fact-checking service (${FACT_CHECK_API_URL}). Please ensure the backend is running.`); factCheckResult = { isFact: 'error', reason: `Check Failed: Connection Error` }; }
            else { factCheckResult = { isFact: 'error', reason: `Check Failed: ${error.message}` }; }
        } finally { setAllMessages(prev => prev.map(msg => msg.id === pendingMessageId ? { ...msg, isFact: factCheckResult.isFact, reason: factCheckResult.reason } : msg )); }
        try { const messagesCollection = collection(db, 'rooms', roomId, 'messages'); await addDoc(messagesCollection, { type: 'stt', speaker: userName, text: transcript, isFact: factCheckResult.isFact === 'error' ? null : factCheckResult.isFact, reason: factCheckResult.isFact === 'error' ? null : factCheckResult.reason, timestamp: serverTimestamp() }); }
        catch (error) { console.error("[Transcript Handling] Firestore addDoc FAILED:", error); }
    }, [roomId, userName, currentRoomName]);

    // --- Speech Recognition Hook ---
    const { startListening, stopListening } = useSpeechRecognition(handleTranscript);

    // --- Manual Chat Message Handler ---
    const handleSendChatMessage = useCallback(async (text) => {
        if (!text || !roomId || !userName || !db) return;
        const optimisticMessage = { id: `local-chat-${Date.now()}-${Math.random().toString(16).slice(2)}`, type: 'chat', speaker: userName, text: text, isFact: null, reason: null, timestamp: new Date() };
        setAllMessages(prev => [...prev, optimisticMessage]);
        try { const messagesCollection = collection(db, 'rooms', roomId, 'messages'); await addDoc(messagesCollection, { type: 'chat', speaker: userName, text: text, isFact: null, reason: null, timestamp: serverTimestamp() }); }
        catch (error) { console.error("Error sending manual chat message:", error); alert("Failed to send message."); }
    }, [roomId, userName]);

    // --- Firestore Listener Effect ---
    useEffect(() => {
        if (!isConnected || !roomId || !db || !userName) { if (messagesUnsubscribeRef.current) { messagesUnsubscribeRef.current(); messagesUnsubscribeRef.current = null; } return; }
        if (!messagesUnsubscribeRef.current) { const messagesCollection = collection(db, 'rooms', roomId, 'messages'); const q = query(messagesCollection, orderBy('timestamp', 'asc')); messagesUnsubscribeRef.current = onSnapshot(q, (snapshot) => { const incomingMessages = []; snapshot.docChanges().forEach((change) => { if (change.type === 'added') { const msgData = change.doc.data(); if (msgData.speaker !== userName && msgData.timestamp) { const timestamp = msgData.timestamp?.toDate ? msgData.timestamp.toDate() : new Date(); incomingMessages.push({ id: change.doc.id, ...msgData, timestamp }); } } }); if (incomingMessages.length > 0) { setAllMessages(prev => { const existingIds = new Set(prev.map(m => m.id)); const newUniqueMessages = incomingMessages.filter(m => !existingIds.has(m.id)); const combined = [...prev, ...newUniqueMessages]; combined.sort((a, b) => (a.timestamp?.getTime?.() || 0) - (b.timestamp?.getTime?.() || 0)); return combined; }); } }, (error) => { console.error("Error listening to all messages:", error); messagesUnsubscribeRef.current = null; }); }
        return () => { if (messagesUnsubscribeRef.current) { messagesUnsubscribeRef.current(); messagesUnsubscribeRef.current = null; } };
    }, [isConnected, roomId, userName]);

    // Filter messages
    const sttMessages = allMessages.filter(m => m.type === 'stt');
    const chatMessages = allMessages.filter(m => m.type === 'chat');

    // --- View Transition Handlers ---
    const goToFormsView = useCallback(() => { setView('forms'); if (roomId) setRoomId(null); setAllMessages([]); setUserName(''); setCurrentRoomName("Debate Room"); setActiveSidebarTab('transcript'); }, [setRoomId]);

    // --- Room Creation/Joining Handlers ---
    const handleCreateRoom = useCallback(async (roomNameValue, creatorName) => { if (!db) return; setUserName(creatorName); setCurrentRoomName(roomNameValue); const newRoomId = generateRoomIdReact(); setRoomId(newRoomId); try { await openUserMedia(); await setupPeerConnection(newRoomId, true); const roomRef = doc(db, 'rooms', newRoomId); await updateDoc(roomRef, { name: roomNameValue }); setView('inRoom'); setAllMessages([]); } catch (error) { console.error("Create failed:", error); alert(`Create failed: ${error.message}`); await webRTCHangUp(true); setView('landing'); setRoomId(null); setUserName(''); } }, [openUserMedia, setupPeerConnection, setRoomId, webRTCHangUp]);
    const handleJoinRoom = useCallback(async (roomCode, joinerName) => { if (!db) return; setUserName(joinerName); setRoomId(roomCode); try { const roomRefCheck = doc(db, 'rooms', roomCode); const roomSnap = await getDoc(roomRefCheck); if (!roomSnap.exists()) { alert(`Room ${roomCode} not found.`); setRoomId(null); setUserName(''); return; } setCurrentRoomName(roomSnap.data()?.name || `Room ${roomCode}`); await openUserMedia(); await setupPeerConnection(roomCode, false); setView('inRoom'); setAllMessages([]); } catch (error) { console.error("Join failed:", error); alert(`Join failed: ${error.message}`); await webRTCHangUp(false); setView('landing'); setRoomId(null); setUserName(''); } }, [openUserMedia, setupPeerConnection, setRoomId, webRTCHangUp]);

    // --- Hangup Handler ---
     const handleHangUp = useCallback(async () => { await webRTCHangUp(isCreator); setView('landing'); setAllMessages([]); setRoomId(null); setCurrentRoomName("Debate Room"); setUserName(""); setActiveSidebarTab('transcript'); }, [webRTCHangUp, isCreator]);

    // --- Helper ---
     const generateRoomIdReact = (length = 6) => { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let result = ''; for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length)); return result; };

     // --- Speech Recognition Start/Stop Effect ---
     useEffect(() => { if (!SpeechRecognition) return; if (view === 'inRoom' && isConnected && isMicEnabled) { startListening(); } else { stopListening(); } }, [view, isConnected, isMicEnabled, startListening, stopListening]);


    // --- Render Logic based on 'view' state ---
    const renderContent = () => {
        switch(view) {
            case 'landing':
                // --- RENDER ACTUAL LANDING PAGE --- (Includes Added Sections)
                return (
                    <div className="flex flex-col min-h-screen overflow-y-auto bg-gray-50 dark:bg-slate-950">
                         {/* Ensure LandingNavbar is correctly implemented */}
                         <LandingNavbar onAuthClick={(type) => console.log(`${type} clicked`)} />
                         <main className="flex-grow">
                            {/* Ensure LandingHero is correctly implemented */}
                            <LandingHero
                                onJoinDebateClick={goToFormsView} // Connects button to change view
                                onHowItWorksClick={() => {/* Add scroll logic if needed */}}
                            />
                            {/* *** ADDING OTHER LANDING SECTIONS HERE *** */}
                            {/* Ensure these components exist and are imported */}
                            <LandingFeatured />
                            <LandingHowItWorks />
                            <LandingCTA />
                         </main>
                         {/* Ensure LandingFooter is correctly implemented */}
                        <LandingFooter />
                    </div>
                );
            case 'forms':
                // --- RENDER FORMS VIEW ---
                return (
                    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                         <InitialForms
                            onCreateRoom={handleCreateRoom}
                            onJoinRoom={handleJoinRoom}
                        />
                    </div>
                );
            case 'inRoom':
                 // --- RENDER IN-ROOM VIEW ---
                 if (!db) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: Database connection failed.</div>;
                return (
                     <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-black text-slate-100">
                         <Header roomName={currentRoomName} roomId={roomId} />
                         <main className="flex flex-grow overflow-hidden p-3 md:p-4 gap-3 md:gap-4">
                            <div className="flex-grow lg:w-2/3 overflow-hidden">
                                <VideoGrid
                                    localStream={localStream}
                                    remoteStream={remoteStream}
                                    localUserName={userName}
                                    isCameraEnabled={isCameraEnabled}
                                />
                            </div>
                            <div className="hidden lg:flex lg:flex-shrink-0 lg:w-1/3 lg:max-w-xs xl:max-w-sm">
                                <Sidebar
                                    activeTab={activeSidebarTab}
                                    setActiveTab={setActiveSidebarTab}
                                    sttMessages={sttMessages}
                                    chatMessages={chatMessages}
                                    localUserName={userName}
                                    roomId={roomId}
                                    currentRoomName={currentRoomName}
                                    onSendMessage={handleSendChatMessage}
                                />
                            </div>
                        </main>
                         <ControlsBar
                             roomId={roomId}
                             isMicEnabled={isMicEnabled}
                             isCameraEnabled={isCameraEnabled}
                             onToggleMic={webRTCToggleMic}
                             onToggleCamera={toggleCamera}
                             onHangUp={handleHangUp}
                             isCreator={isCreator}
                         />
                    </div>
                );
            default:
                return <div className="min-h-screen flex items-center justify-center">Error: Invalid view state.</div>;
        }
    };

    return renderContent();
}

export default App;