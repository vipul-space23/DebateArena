// frontend/src/components/Header.jsx
import React from 'react';

function Header({ roomName, roomId }) {
  return (
    <header className="flex-shrink-0 px-4 py-3 md:px-6 md:py-3 border-b border-slate-700/50 flex justify-between items-center bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 shadow-sm z-10">
      {/* Left Side - Room Title */}
      <div className="flex items-center">
        <h1 className="text-lg md:text-xl font-semibold text-white truncate pr-4">
          {roomName || "Debate Room"} {/* Display current room name */}
        </h1>
      </div>

      {/* Right Side - Room ID */}
      <div className="flex items-center">
        <span className="text-xs md:text-sm text-slate-400 font-mono bg-slate-700/50 px-2.5 py-1 rounded-md">
           ID: {roomId || '------'} {/* Display current room ID */}
        </span>
         {/* Optional: Add settings or other icons here */}
         {/* <button className="ml-3 text-slate-400 hover:text-white">
              <i className="fas fa-cog"></i>
         </button> */}
      </div>
    </header>
  );
}

export default Header;  