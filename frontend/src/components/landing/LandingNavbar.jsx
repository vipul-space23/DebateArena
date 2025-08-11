// frontend/src/components/landing/LandingNavbar.jsx
import React from 'react';

function LandingNavbar({ onAuthClick }) { // Pass function to handle auth button clicks if needed later
  return (
    <nav className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900/70 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
             {/* Replace with your actual Logo */}
             <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
               DebateVerse
             </span>
          </div>
          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-6 lg:space-x-8">
            {['Home', 'Debates', 'Tournaments', 'Leaderboard'].map((item) => (
              <a
                key={item}
                href="#" // Replace with actual paths later if using routing
                className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onAuthClick('login')} // Example handler
              className="hidden sm:inline-block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => onAuthClick('signup')} // Example handler
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default LandingNavbar;