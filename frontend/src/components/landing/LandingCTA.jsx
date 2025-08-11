// frontend/src/components/landing/LandingCTA.jsx
import React from 'react';

function LandingCTA() {
  return (
    <section className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 dark:from-purple-800 dark:via-indigo-900 dark:to-slate-900">
      <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          <span className="block">Ready to Join the Conversation?</span>
        </h2>
        <p className="mt-4 text-lg leading-6 text-indigo-100 dark:text-indigo-200">
          Create your account today and become part of our vibrant community of critical thinkers and passionate debaters.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <a
            href="#" // Link to Sign Up
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-indigo-700 bg-white hover:bg-indigo-50"
          >
            Sign Up Now
          </a>
          <a
            href="#" // Link to Explore Topics/Debates
            className="inline-flex items-center justify-center px-6 py-3 border border-indigo-400/50 rounded-md shadow-sm text-base font-medium text-white bg-white/10 hover:bg-white/20"
          >
            Explore Topics
          </a>
        </div>
      </div>
    </section>
  );
}

export default LandingCTA;