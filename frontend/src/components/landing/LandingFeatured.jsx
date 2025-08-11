// frontend/src/components/landing/LandingFeatured.jsx
import React, { useState } from 'react';

// Placeholder Data (Replace with actual data fetching later)
const debates = [
  { id: 1, category: 'Technology', title: 'Should Artificial Intelligence Be Regulated by Governments?', description: 'As AI continues to advance, the question of governance becomes ever more important. Join this debate to discuss the balance between innovation and control.', img: '/images/ai_debate.jpg', comments: 24, views: 138 },
  { id: 2, category: 'Politics', title: 'Is Democracy Still the Best Political System?', description: 'In a world facing complex global challenges, is the democratic model still the most effective form of governance? Explore arguments for and against.', img: '/images/politics_debate.jpg', comments: 32, views: 215 },
  { id: 3, category: 'Economics', title: 'Universal Basic Income: Necessary or Harmful?', description: 'With automation threatening jobs and economic inequality rising, is UBI a necessary solution or a harmful policy? Join the discussion.', img: '/images/ubi_debate.jpg', comments: 19, views: 87 },
  { id: 4, category: 'Ethics', title: 'Should Gene Editing in Humans Be Permitted?', description: 'With CRISPR and other gene editing technologies becoming reality, should we allow the editing of human genes? What are the ethical boundaries?', img: '/images/ethics_debate.jpg', comments: 28, views: 162 },
  { id: 5, category: 'Science', title: 'Is Climate Change Primarily Human-Caused?', description: 'Examining the evidence for and against anthropogenic global warming. What does the scientific consensus really tell us?', img: '/images/science_debate.jpg', comments: 42, views: 231 },
  { id: 6, category: 'Society', title: 'Social Media: Net Positive or Negative for Society?', description: 'Has social media improved human connection and information sharing, or has it created more division and misinformation?', img: '/images/social_media_debate.jpg', comments: 31, views: 194 },
];
const categories = ['All', 'Technology', 'Politics', 'Economics', 'Ethics', 'Science', 'Society', 'Philosophy'];


function LandingFeatured() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredDebates = activeCategory === 'All'
    ? debates
    : debates.filter(debate => debate.category === activeCategory);

  const categoryColors = { // For tags
    Technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Politics: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Economics: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Ethics: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    Science: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    Society: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Philosophy: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50 dark:bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center md:text-left md:flex md:justify-between md:items-center mb-10 lg:mb-12">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Featured Debates
            </h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 sm:mt-4">
              Join the conversation on trending topics and pressing issues.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <a
              href="#" // Link to full debates page
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Browse All Debates <i className="fas fa-arrow-right ml-2 text-xs"></i>
            </a>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-10 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex space-x-2 sm:space-x-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                  activeCategory === category
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Debate Cards Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredDebates.map((debate) => (
            <div key={debate.id} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 transform transition hover:scale-[1.02] hover:shadow-xl">
              <div className="flex-shrink-0">
                 {/* Use placeholder or actual image */}
                <img className="h-48 w-full object-cover" src={debate.img || `https://via.placeholder.com/400x240/cccccc/969696?text=${debate.category}`} alt={debate.title} />
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium mb-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full ${categoryColors[debate.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {debate.category}
                    </span>
                  </p>
                  <a href="#" className="block mt-2">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white hover:underline">
                      {debate.title}
                    </p>
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                      {debate.description}
                    </p>
                  </a>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex space-x-3">
                    <span><i className="fas fa-comments mr-1 opacity-70"></i>{debate.comments}</span>
                    <span><i className="fas fa-eye mr-1 opacity-70"></i>{debate.views}</span>
                  </div>
                   <a href="#" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                    View Debate <span aria-hidden="true">→</span>
                   </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LandingFeatured;