// frontend/src/components/landing/LandingHero.jsx
import React from 'react';

function LandingHero({ onJoinDebateClick, onHowItWorksClick }) {
  const stats = [
    { value: '500+', label: 'Active Debates' },
    { value: '12k+', label: 'Community Members' },
    { value: '85%', label: 'Report Learning' }, // Placeholder stat
    { value: '24/7', label: 'Global Access' },
  ];

  return (
    <section className="relative py-20 md:py-28 lg:py-32 bg-gradient-to-b from-white via-purple-50 to-gray-100 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 overflow-hidden">
       {/* Background Blobs/Elements (Optional - requires more complex SVG/CSS) */}
       <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob"></div>
       <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-indigo-300 dark:bg-indigo-700 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Where <span className="text-purple-600 dark:text-purple-400">Great Minds</span> Debate<br className="hidden sm:block" /> Great Ideas
        </h1>
        {/* Subheading */}
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Join our community of critical thinkers and passionate debaters. Engage in thoughtful discourse, challenge perspectives, and expand your intellectual horizons.
        </p>
        {/* Action Buttons */}
        <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-10 space-y-3 sm:space-y-0 sm:space-x-4">
          <button
             onClick={onJoinDebateClick} // Use the prop function
             className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-3 md:text-lg md:px-10 shadow-lg transform transition hover:scale-105"
          >
            Join a Debate
          </button>
          <button
            onClick={onHowItWorksClick} // Use the prop function
             className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-slate-700 dark:text-indigo-300 dark:hover:bg-slate-600 md:py-3 md:text-lg md:px-10 shadow transform transition hover:scale-105"
          >
            How It Works
          </button>
        </div>

        {/* Stats Section */}
        <div className="mt-16 md:mt-20 lg:mt-24">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-4xl lg:text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-sm lg:text-base font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">
                  {stat.label}
                </dd>
              </div>
            ))}
          </div>
        </div>
      </div>
       {/* Animation CSS (add to index.css or a style block if preferred) */}
       <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 10s infinite ease-in-out;
        }
        .animation-delay-2000 { animation-delay: -2s; }
        .animation-delay-4000 { animation-delay: -4s; }
       `}</style>
    </section>
  );
}

export default LandingHero;