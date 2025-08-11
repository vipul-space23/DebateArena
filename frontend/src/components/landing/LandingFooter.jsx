// frontend/src/components/landing/LandingFooter.jsx
import React from 'react';

function LandingFooter() {
  const quickLinks = [ { name: 'Home', href: '#' }, { name: 'Debates', href: '#' }, { name: 'Tournaments', href: '#' }, { name: 'Leaderboard', href: '#' }, { name: 'About Us', href: '#' } ];
  const resources = [ { name: 'FAQ', href: '#' }, { name: 'Community Guidelines', href: '#' }, { name: 'Privacy Policy', href: '#' }, { name: 'Terms of Service', href: '#' }, { name: 'Contact Us', href: '#' } ];
  const social = [
    { name: 'Twitter', href: '#', icon: 'fab fa-twitter' },
    { name: 'Instagram', href: '#', icon: 'fab fa-instagram' },
    { name: 'LinkedIn', href: '#', icon: 'fab fa-linkedin' },
  ];

  return (
    <footer className="bg-gray-100 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700/50" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Logo & Description */}
          <div className="space-y-4 xl:col-span-1">
             <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
               DebateVerse
             </span>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              A platform dedicated to fostering thoughtful discussion and intellectual growth through structured debates on important topics.
            </p>
            <div className="flex space-x-4">
              {social.map((item) => (
                <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <span className="sr-only">{item.name}</span>
                  <i className={`${item.icon} text-lg`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Quick Links</h3>
                <ul role="list" className="mt-4 space-y-2">
                  {quickLinks.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Resources</h3>
                <ul role="list" className="mt-4 space-y-2">
                  {resources.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Add more link columns if needed */}
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 border-t border-gray-200 dark:border-slate-700/50 pt-8">
          <p className="text-base text-gray-400 dark:text-gray-500 xl:text-center">© {new Date().getFullYear()} DebateVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;