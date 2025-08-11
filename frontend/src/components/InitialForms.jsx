import React, { useState } from 'react';

function InitialForms({ onCreateRoom, onJoinRoom, onBack }) {
    const [createRoomName, setCreateRoomName] = useState('');
    const [creatorName, setCreatorName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [joinerName, setJoinerName] = useState('');

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (!creatorName.trim()) {
            alert("Please enter your name to create a room.");
            return;
        }
        onCreateRoom(createRoomName.trim() || "Untitled Debate", creatorName.trim());
    };

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        if (!joinCode.trim()) {
            alert("Please enter a room code to join.");
            return;
        }
        if (!joinerName.trim()) {
            alert("Please enter your name to join.");
            return;
        }
        onJoinRoom(joinCode.trim().toUpperCase(), joinerName.trim());
    };

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-black text-slate-100">

            {/* Optional Back Button */}
            {/* {onBack && (
                <button onClick={onBack} className="absolute top-6 left-6 text-sm text-indigo-400 hover:text-indigo-300">
                    ← Back to Home
                </button>
            )} */}

            {/* Header */}
            <div className="text-center mb-8 px-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Welcome to Debate Arena</h1>
                <p className="text-base text-gray-400 max-w-xl mx-auto">
                    Engage in structured debates with real-time transcription and AI-powered insights. Create a room or join one below.
                </p>
            </div>

            {/* Form Card */}
            <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/50 backdrop-blur-lg shadow-2xl rounded-2xl p-8 border border-slate-700/30">

                {/* Create Room */}
                <form className="flex flex-col space-y-5" onSubmit={handleCreateSubmit}>
                    <h2 className="text-2xl font-semibold text-white mb-2 border-b border-slate-600 pb-2">Create Room</h2>

                    <div>
                        <label htmlFor="room-name-input-form" className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Room Name</label>
                        <input
                            type="text"
                            id="room-name-input-form"
                            placeholder="e.g., Future of AI Ethics"
                            className="w-full h-10 px-3 rounded-lg bg-slate-700/40 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={createRoomName}
                            onChange={(e) => setCreateRoomName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="creator-name-input-form" className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Your Name</label>
                        <input
                            type="text"
                            id="creator-name-input-form"
                            placeholder="Your display name"
                            required
                            className="w-full h-10 px-3 rounded-lg bg-slate-700/40 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={creatorName}
                            onChange={(e) => setCreatorName(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="py-2.5 px-5 rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-medium transition hover:scale-[1.03]"
                    >
                        Create & Start
                    </button>
                </form>

                {/* Join Room */}
                <form className="flex flex-col space-y-5" onSubmit={handleJoinSubmit}>
                    <h2 className="text-2xl font-semibold text-white mb-2 border-b border-slate-600 pb-2">Join Room</h2>

                    <div>
                        <label htmlFor="join-code-input-form" className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Room Code</label>
                        <input
                            type="text"
                            id="join-code-input-form"
                            placeholder="ENTER CODE"
                            maxLength={6}
                            required
                            className="w-full h-10 px-3 text-center uppercase font-mono tracking-widest rounded-lg bg-slate-700/40 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        />
                    </div>

                    <div>
                        <label htmlFor="joiner-name-input-form" className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Your Name</label>
                        <input
                            type="text"
                            id="joiner-name-input-form"
                            placeholder="Your display name"
                            required
                            className="w-full h-10 px-3 rounded-lg bg-slate-700/40 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            value={joinerName}
                            onChange={(e) => setJoinerName(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="py-2.5 px-5 rounded-lg text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 font-medium transition hover:scale-[1.03]"
                    >
                        Join Debate
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p className="mt-8 text-xs text-gray-500">
  Powered by <a href="https://github.com/vipul-space23" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">vipul.space</a>
</p>

        </div>
    );
}

export default InitialForms;
