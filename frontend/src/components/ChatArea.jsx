// frontend/src/components/ChatArea.jsx
import React, { useEffect, useRef } from 'react';

// Displays manually typed chat messages
function ChatArea({ chatMessages, localUserName }) {
    const logRef = useRef(null);

    useEffect(() => {
        // Auto-scroll to bottom
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [chatMessages]); // Scroll when chat messages update

    // Bubble styles (can reuse from TranscriptArea or define separately)
     const getBubbleClasses = (isLocal) => {
        let base = "max-w-[85%] md:max-w-[75%] px-3 py-2 rounded-lg shadow";
        if (isLocal) {
            return `${base} bg-blue-600 text-white`; // Different color for chat?
        } else {
            return `${base} bg-slate-600 text-gray-100`;
        }
    };

    const getContainerClasses = (isLocal) => {
        return `flex ${isLocal ? 'justify-end' : 'justify-start'} mb-2`;
    };

    return (
        <div id="chat-log-content" ref={logRef} className="h-full overflow-y-auto space-y-2">
            {chatMessages.length === 0 && (
                 <p className="text-center text-slate-400 italic mt-4 text-sm">
                     No chat messages yet...
                 </p>
            )}
            {chatMessages.map((msg, index) => {
                const isLocalUser = msg.speaker === localUserName;
                return (
                    <div key={msg.id || index} className={getContainerClasses(isLocalUser)}>
                         <div className={getBubbleClasses(isLocalUser)}>
                            {/* Only show speaker name for remote messages */}
                            {!isLocalUser && (
                                <span className="block text-xs font-semibold text-blue-300 mb-0.5">
                                    {msg.speaker || 'Remote'}
                                </span>
                            )}
                            <span className="block text-sm text-white leading-snug break-words">
                                {msg.text}
                            </span>
                             {/* No reason span needed for chat */}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ChatArea;