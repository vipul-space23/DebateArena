// frontend/src/components/landing/LandingHowItWorks.jsx
import React from 'react';

function LandingHowItWorks() {
  const steps = [
    { id: 1, title: 'Choose a Topic', description: 'Browse our extensive catalog of debate topics or propose your own discussion point.', icon: 'fa-search' },
    { id: 2, title: 'Present Your Case', description: 'Make your argument with evidence, logic, and persuasive reasoning in our structured format.', icon: 'fa-gavel' }, // Changed icon
    { id: 3, title: 'Engage & Grow', description: 'Respond to counterpoints, receive feedback, and expand your perspective.', icon: 'fa-comments' }, // Changed icon
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">How DebateVerse Works</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Our platform makes it easy to engage in meaningful debates and discussions
          </p>
        </div>

        <div className="mt-12 lg:mt-16">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {steps.map((step) => (
              <div key={step.id} className="relative text-center md:text-left">
                <dt>
                   <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-purple-500 to-indigo-600 text-white mb-4 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0">
                     {/* <i className={`fas ${step.icon} text-xl`}></i> */}
                     <span className="text-xl font-bold">{step.id}</span>
                   </div>
                  <p className="mt-16 md:mt-0 md:ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">{step.title}</p>
                </dt>
                <dd className="mt-2 md:ml-16 text-base text-gray-500 dark:text-gray-400">
                  {step.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export default LandingHowItWorks;