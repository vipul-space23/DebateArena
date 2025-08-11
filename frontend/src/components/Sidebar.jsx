// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Import Tab Components
import TranscriptArea from './TranscriptArea';
import ChatArea from './ChatArea'; // Make sure this component exists

// Tab constants
const TABS = {
    TRANSCRIPT: 'transcript',
    CHAT: 'chat',
};

function Sidebar({
    activeTab,
    setActiveTab,
    // Receive FILTERED messages
    sttMessages,    // Pass ONLY STT messages
    chatMessages, // Pass ONLY Chat messages
    localUserName,
    roomId,
    currentRoomName, // Keep if Chatbot (now Chat tab context?) needs it
    onSendMessage   // The handler function from App.jsx
}) {
    const [newMessage, setNewMessage] = useState('');

    // Handler for form submission (remains the same)
    const handleSendMessageSubmit = (e) => {
        e.preventDefault();
        const text = newMessage.trim();
        if(text && onSendMessage){ // Ensure handler exists
            onSendMessage(text); // Call the function passed from App.jsx
            setNewMessage('');
        }
    };

    // Tab Button Styling (remains the same)
    const getButtonClass = (tabName) => {
        return `px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 flex items-center gap-1.5 ${ activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }`;
    };

    return (
        <aside id="sidebar-area" className="flex flex-col w-full bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-700 h-full"> {/* Added h-full */}

            {/* Tab Buttons Header */}
            <div className="flex items-center p-1.5 border-b border-slate-700 bg-slate-900/50 space-x-1.5 flex-shrink-0"> {/* Added flex-shrink-0 */}
                <button
                    className={getButtonClass(TABS.TRANSCRIPT)}
                    onClick={() => setActiveTab(TABS.TRANSCRIPT)}
                    aria-label="Show Transcript"
                >
                    <i className="fas fa-stream text-xs"></i> Transcript
                </button>
                <button
                    className={getButtonClass(TABS.CHAT)}
                    onClick={() => setActiveTab(TABS.CHAT)}
                    aria-label="Open Chat"
                >
                    <i className="fas fa-comments text-xs"></i> Chat
                </button>
            </div>

            {/* Tab Content Area */}
            {/* Ensure this div correctly takes up remaining space and scrolls */}
            <div className="flex-grow overflow-y-auto p-3 md:p-4">
                 {activeTab === TABS.TRANSCRIPT && (
                     <TranscriptArea
                        transcriptMessages={sttMessages} // Pass only STT
                        localUserName={localUserName}
                    />
                 )}
                 {activeTab === TABS.CHAT && (
                      <ChatArea
                         chatMessages={chatMessages} // Pass only Chat
                         localUserName={localUserName}
                     />
                 )}
                 {![TABS.TRANSCRIPT, TABS.CHAT].includes(activeTab) && (
                      <p className="text-slate-400 text-center mt-4">Select a tab.</p>
                 )}
            </div>

            {/* Manual Chat Input Area - CONDITIONALLY RENDERED */}
            {activeTab === TABS.CHAT && ( // <-- RENDER ONLY IF CHAT TAB IS ACTIVE
                 <div className="p-2 border-t border-slate-700 bg-slate-900/50 flex-shrink-0"> {/* Added flex-shrink-0 */}
                     <form onSubmit={handleSendMessageSubmit} className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a chat message..."
                            className="flex-grow rounded-md border-0 bg-slate-700 px-3 py-1.5 text-white placeholder-slate-400 focus:ring-1 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            aria-label="Chat message input"
                        />
                         <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Send chat message"
                        >
                           <i className="fas fa-paper-plane"></i>
                        </button>
                     </form>
                 </div>
            )}
        </aside>
    );
}

export default Sidebar;