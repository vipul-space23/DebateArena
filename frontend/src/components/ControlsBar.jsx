// frontend/src/components/ControlsBar.jsx
import React, { useState } from 'react';

function ControlsBar({
    roomId,
    isMicEnabled,
    isCameraEnabled,
    onToggleMic,
    onToggleCamera,
    onHangUp,
    isCreator
}) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!roomId || isCopied) return;
        try {
            await navigator.clipboard.writeText(roomId);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 1500);
        } catch (err) { console.error('Failed to copy:', err); alert('Could not copy code.'); }
    };

     const handleShare = async () => {
         if (!roomId) return;
         if (navigator.share) {
            try {
                await navigator.share({ title: `Join Debate Room: ${roomId}`, text: `Join using code: ${roomId}` });
            } catch (err) { if (err.name !== 'AbortError') console.error('Share failed:', err); }
        } else { handleCopy(); alert('Sharing not supported. Code copied (if possible).'); }
     };

    // Base classes for the circular control buttons
    const baseButtonClass = "flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black focus:ring-indigo-500 transition-all duration-150 ease-in-out shadow-lg";
    const iconClass = "text-xl"; // Consistent icon size

    // Dynamic classes for mic button state
    const micButtonClass = isMicEnabled
        ? "bg-slate-600 hover:bg-slate-500 text-white"
        : "bg-red-600 hover:bg-red-500 text-white";

    // Dynamic classes for camera button state
    const camButtonClass = isCameraEnabled
         ? "bg-slate-600 hover:bg-slate-500 text-white"
        : "bg-red-600 hover:bg-red-500 text-white";

    // Dynamic classes for copy button state
    const copyButtonClass = isCopied
        ? 'bg-emerald-500 text-white cursor-default'
        : 'bg-slate-600 text-slate-300 hover:bg-slate-500 hover:text-white';

    return (
        // Sticky footer bar styling
        <footer className="flex-shrink-0 bg-gradient-to-r from-slate-900/80 via-indigo-950/70 to-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 p-3 z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.2)]">
            <div className="max-w-5xl mx-auto flex justify-between items-center">

                 {/* Left Placeholder */}
                 <div className="w-1/4">
                 </div>

                {/* Center Controls */}
                <div className="flex items-center justify-center space-x-3 sm:space-x-4 flex-grow">
                    {/* Mic Button */}
                    <button
                        className={`${baseButtonClass} ${micButtonClass}`}
                        title={isMicEnabled ? "Mute Mic" : "Unmute Mic"}
                        onClick={onToggleMic}
                        aria-label={isMicEnabled ? "Mute Mic" : "Unmute Mic"}
                        aria-pressed={!isMicEnabled}
                    >
                        <i className={`fas ${isMicEnabled ? 'fa-microphone' : 'fa-microphone-slash'} ${iconClass}`}></i>
                    </button>

                    {/* Camera Button */}
                    <button
                         className={`${baseButtonClass} ${camButtonClass}`}
                        title={isCameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
                        onClick={onToggleCamera}
                        aria-label={isCameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
                        aria-pressed={!isCameraEnabled}
                    >
                       <i className={`fas ${isCameraEnabled ? 'fa-video' : 'fa-video-slash'} ${iconClass}`}></i>
                    </button>

                    {/* --- Screen Share Button REMOVED --- */}
                    {/*
                      <button
                        className={`${baseButtonClass} bg-slate-600 hover:bg-slate-500 text-white disabled:opacity-50 cursor-not-allowed`}
                        title="Screen Share (Coming Soon)"
                        disabled
                        aria-label="Share Screen (Not Implemented)"
                      >
                       <i className={`fas fa-desktop ${iconClass}`}></i>
                    </button>
                    */}
                    {/* --- End of REMOVED Section --- */}

                    {/* Leave/End Button */}
                     <button
                        className="px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black focus:ring-red-500 transition duration-150 ease-in-out shadow-lg ml-2 sm:ml-4"
                        onClick={onHangUp}
                        aria-label={isCreator ? "End Room" : "Leave Room"}
                     >
                       {isCreator ? "Leave" : "Leave"}
                    </button>
                </div>

                {/* Right Side - Room Code/Share */}
                 <div className="w-1/4 flex justify-end items-center space-x-2">
                     <span className="font-mono text-xs text-slate-400 hidden md:inline">CODE:</span>
                     <span className="font-mono font-bold text-slate-100 mr-1">{roomId || '------'}</span>

                     {/* Copy Button */}
                     <button
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 dark:focus:ring-offset-black focus:ring-indigo-400 ${copyButtonClass}`}
                        title="Copy Room Code"
                        onClick={handleCopy}
                        disabled={isCopied}
                        aria-label={isCopied ? "Code Copied" : "Copy Room Code"}
                    >
                        <i className={`fas ${isCopied ? 'fa-check' : 'fa-copy'} text-sm`}></i>
                    </button>

                    {/* Share Button (only if navigator.share exists) */}
                    {navigator.share && (
                        <button
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 dark:focus:ring-offset-black focus:ring-indigo-400"
                            title="Share Room Code"
                            onClick={handleShare}
                            aria-label="Share Room Code"
                        >
                            <i className="fas fa-share-alt text-sm"></i>
                        </button>
                     )}
                 </div>
            </div>
        </footer>
    );
}

export default ControlsBar;