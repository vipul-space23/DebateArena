// import React, { useEffect, useRef, useState } from 'react';

// function TranscriptArea({ transcriptMessages, onSendMessage }) {
//     const logEndRef = useRef(null);
//     const [chatInput, setChatInput] = useState('');

//     useEffect(() => {
//         logEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [transcriptMessages]);

//     const handleSendMessage = (e) => {
//         e.preventDefault();
//         const trimmed = chatInput.trim();
//         if (trimmed) {
//             onSendMessage(trimmed); // Callback to send via WebRTC/WebSocket
//             setChatInput('');
//         }
//     };

//     const getBorderColor = (isFact) => {
//         if (isFact === true) return 'border-green-500 dark:border-green-400';
//         if (isFact === false) return 'border-red-500 dark:border-red-400';
//         if (isFact === 'error') return 'border-yellow-500 dark:border-yellow-400';
//         return 'border-slate-400 dark:border-slate-500';
//     };

//     const getBackgroundColor = (isFact) => {
//         if (isFact === true) return 'bg-green-50 dark:bg-green-900/30';
//         if (isFact === false) return 'bg-red-50 dark:bg-red-900/30';
//         if (isFact === 'error') return 'bg-yellow-50 dark:bg-yellow-900/30';
//         return 'bg-slate-100 dark:bg-slate-700/60';
//     };

//     const getReasonColor = (isFact) => {
//         if (isFact === true) return 'text-green-700 dark:text-green-300';
//         if (isFact === false) return 'text-red-700 dark:text-red-300';
//         if (isFact === 'error') return 'text-yellow-700 dark:text-yellow-300 font-semibold';
//         return 'text-gray-500 dark:text-gray-400';
//     };

//     return (
//         <aside className="flex flex-col bg-white dark:bg-slate-800 shadow-lg rounded-lg w-full md:w-[340px] lg:w-[400px] shrink-0 h-full overflow-hidden border border-gray-200 dark:border-slate-700">
//             <h2 className="text-lg font-semibold p-4 pb-3 border-b border-gray-200 dark:border-slate-700 text-slate-800 dark:text-gray-100 shrink-0">
//                 Transcript & Chat
//             </h2>

//             {/* Chat Messages */}
//             <div id="transcript-log" className="flex-grow overflow-y-auto p-4 space-y-3">
//                 {transcriptMessages.length === 0 ? (
//                     <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4"><em>Transcript will appear here...</em></p>
//                 ) : (
//                     transcriptMessages.map((msg, index) => (
//                         <div
//                             key={msg.id || `msg-${index}`}
//                             className={`p-2.5 rounded text-sm border-l-4 transition-colors duration-200 ${getBackgroundColor(msg.isFact)} ${getBorderColor(msg.isFact)}`}
//                         >
//                             <span className="font-semibold text-indigo-700 dark:text-indigo-400 mr-1.5">
//                                 {msg.speaker || 'Unknown'}:
//                             </span>
//                             <span className="text-gray-800 dark:text-gray-200">
//                                 {msg.text}
//                             </span>
//                             {msg.reason && (
//                                 <span className={`block text-xs mt-1 pl-1 italic ${getReasonColor(msg.isFact)}`}>
//                                     ({msg.reason})
//                                 </span>
//                             )}
//                         </div>
//                     ))
//                 )}
//                 <div ref={logEndRef} />
//             </div>

//             {/* Chat Input Box */}
//             <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-slate-700 flex items-center gap-2 bg-slate-100 dark:bg-slate-700/60">
//                 <input
//                     type="text"
//                     value={chatInput}
//                     onChange={(e) => setChatInput(e.target.value)}
//                     placeholder="Type a message..."
//                     className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//                 <button
//                     type="submit"
//                     className="px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
//                 >
//                     Send
//                 </button>
//             </form>
//         </aside>
//     );
// }

// export default TranscriptArea;

// frontend/src/components/TranscriptArea.jsx
import React, { useEffect, useRef } from 'react';

// Displays ONLY STT messages with fact-checking
function TranscriptArea({ transcriptMessages, localUserName }) { // Receives pre-filtered STT messages
    const logRef = useRef(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [transcriptMessages]);

    // --- Bubble Styles WITH Fact-Check ---
     const getEntryClasses = (isFact) => {
        let base = 'px-3 py-2 rounded-md border-l-4 mb-3 transition-colors duration-200 break-words'; // Added break-words
        if (isFact === true) return `${base} bg-green-900/30 border-green-500`;
        if (isFact === false) return `${base} bg-red-900/30 border-red-500`;
        if (isFact === 'error') return `${base} bg-yellow-900/30 border-yellow-500`;
        return `${base} bg-slate-700/80 border-slate-500`; // Default/pending
    };

    const getReasonClasses = (isFact) => {
        let base = "block text-xs italic mt-1";
        if (isFact === true) return `${base} text-green-300`;
        if (isFact === false) return `${base} text-red-300`;
        if (isFact === 'error') return `${base} text-yellow-300 font-medium`;
        return `${base} text-slate-400`;
    };


    return (
        // Container for the transcript log itself
        <div id="transcript-log-content" ref={logRef} className="h-full overflow-y-auto space-y-2">
            {transcriptMessages.length === 0 && (
                 <p className="text-center text-slate-400 italic mt-4 text-sm">
                     Mic transcript will appear here...
                 </p>
            )}
            {transcriptMessages.map((msg, index) => {
                // No need to check local user here unless specific styling is needed
                return (
                    // Removed alignment container, just list entries
                     <div key={msg.id || index} className={getEntryClasses(msg.isFact)}>
                        <span className="block text-sm font-semibold text-indigo-300 mb-0.5">
                            {msg.speaker || 'Unknown'}:
                        </span>
                        <span className="block text-sm text-gray-200 leading-snug">
                            {msg.text}
                        </span>
                        {/* Display reason only if it exists */}
                        {msg.reason && (
                            <span className={getReasonClasses(msg.isFact)}>
                                ({msg.reason})
                            </span>
                        )}
                    </div>
                );
            })}
             {/* NO CHAT INPUT FORM HERE */}
        </div>
    );
}

export default TranscriptArea;
