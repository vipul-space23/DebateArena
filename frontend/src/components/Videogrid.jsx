
import React, { useEffect, useRef } from 'react';

function VideoGrid({ localStream, remoteStream, localUserName, remoteUserName = "Remote" }) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        } else if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null; // Clear if stream removed
        }
    }, [remoteStream]);

    const hasRemoteStream = remoteStream && remoteStream.active && remoteStream.getTracks().length > 0;

    return (
        // Changed grid layout to better match example
        <div id="video-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow p-1 md:p-4 bg-slate-950/50 rounded-lg overflow-y-auto">
            {/* Local Video */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-lg">
                <video
                    ref={localVideoRef}
                    className={`w-full h-full object-cover ${!localStream ? 'hidden' : ''}`} // Hide if no stream
                    muted
                    autoPlay
                    playsInline
                ></video>
                {/* Show placeholder if no local stream */}
                {!localStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                        <i className="fas fa-video-slash text-4xl"></i>
                    </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    <span id="local-user-name" className="font-medium">{localUserName} (You)</span>
                </div>
            </div>

            {/* Remote Video */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-lg">
                <video
                    ref={remoteVideoRef}
                    className={`w-full h-full object-cover ${!hasRemoteStream ? 'hidden' : ''}`} // Hide if no remote stream
                    autoPlay
                    playsInline
                ></video>
                 {/* Show placeholder if no remote stream */}
                 {!hasRemoteStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                         <i className="fas fa-user text-4xl mb-2"></i>
                         <span>Waiting...</span>
                    </div>
                 )}
                 {hasRemoteStream && (
                     <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        <span id="remote-user-name" className="font-medium">{remoteUserName}</span>
                    </div>
                 )}
            </div>

             {/* Static Placeholder (Optional - shows an empty slot) */}
             <div className="hidden md:flex relative aspect-video bg-slate-800/50 rounded-lg overflow-hidden border border-dashed border-slate-600 items-center justify-center shadow-lg">
                  <div className="text-center text-slate-500">
                     <i className="fas fa-user-plus text-4xl mb-2"></i>
                     <span className="block text-sm">Empty Slot</span>
                  </div>
              </div>
              <div className="hidden md:flex relative aspect-video bg-slate-800/50 rounded-lg overflow-hidden border border-dashed border-slate-600 items-center justify-center shadow-lg">
                   <div className="text-center text-slate-500">
                      <i className="fas fa-user-plus text-4xl mb-2"></i>
                      <span className="block text-sm">Empty Slot</span>
                   </div>
               </div>

        </div>
    );
}

export default VideoGrid;