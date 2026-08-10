import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface NPCAsset {
  id: string;
  name: string;
  description: string;
  type: 'humanoid' | 'creature' | 'vehicle' | 'prop';
  personality: string[];
  thumbnail: string;
  tags: string[];
}

const npcAssets: NPCAsset[] = [
  {
    id: 'guardian',
    name: 'Guardian Knight',
    description: 'A loyal protector with tactical combat AI. Patrols areas, defends allies, and engages threats intelligently.',
    type: 'humanoid',
    personality: ['Brave', 'Loyal', 'Tactical', 'Protective'],
    thumbnail: '🛡️',
    tags: ['Combat', 'Patrol', 'Teamplay']
  },
  {
    id: 'merchant',
    name: 'Wandering Merchant',
    description: 'An intelligent trader who evaluates player inventory, offers dynamic pricing, and remembers past transactions.',
    type: 'humanoid',
    personality: ['Cunning', 'Friendly', 'Opportunistic', 'Memorable'],
    thumbnail: '🏪',
    tags: ['Trading', 'Economy', 'Dialogue']
  },
  {
    id: 'beast',
    name: 'Shadow Beast',
    description: 'A territorial predator with pack hunting AI. Coordinates with allies, flanks prey, and adapts to player tactics.',
    type: 'creature',
    personality: ['Aggressive', 'Cunning', 'Territorial', 'Pack-oriented'],
    thumbnail: '🐺',
    tags: ['Combat', 'Hunting', 'Stealth']
  },
  {
    id: 'drone',
    name: 'Scout Drone',
    description: 'Autonomous aerial unit with computer vision. Surveys areas, detects threats, and relays tactical data.',
    type: 'vehicle',
    personality: ['Vigilant', 'Precise', 'Relentless', 'Efficient'],
    thumbnail: '🚁',
    tags: ['Recon', 'Vision', 'Support']
  },
  {
    id: 'villager',
    name: 'Village Elder',
    description: 'Wise NPC with dynamic dialogue system. Offers quests, shares lore, and reacts to world state changes.',
    type: 'humanoid',
    personality: ['Wise', 'Compassionate', 'Knowledgeable', 'Patient'],
    thumbnail: '👴',
    tags: ['Quest', 'Dialogue', 'Lore']
  },
  {
    id: 'sentry',
    name: 'Automated Sentry',
    description: 'Stationary defense unit with threat assessment AI. Identifies targets, prioritizes threats, and coordinates with network.',
    type: 'prop',
    personality: ['Vigilant', 'Ruthless', 'Calculating', 'Networked'],
    thumbnail: '🔫',
    tags: ['Defense', 'Surveillance', 'Automation']
  }
];

type FilterType = 'all' | 'humanoid' | 'creature' | 'vehicle' | 'prop';

const LibraryPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filteredAssets = npcAssets.filter(asset => {
    const matchesFilter = filter === 'all' || asset.type === filter;
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) ||
                         asset.description.toLowerCase().includes(search.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const filters: { value: FilterType; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '📦' },
    { value: 'humanoid', label: 'Humanoids', icon: '🧍' },
    { value: 'creature', label: 'Creatures', icon: '🐺' },
    { value: 'vehicle', label: 'Vehicles', icon: '🚁' },
    { value: 'prop', label: 'Props', icon: '🔫' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl">🎮</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">WonderPlay 3D</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <span className="text-gray-600 font-medium">Library</span>
            <span className="text-gray-400 font-medium">Builder</span>
            <span className="text-gray-400 font-medium">API Docs</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
              Sign In
            </button>
            <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg">
              Launch Builder
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            {npcAssets.length} NPC Templates Ready — Drag & Drop into Builder
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 leading-tight mb-6">
            <span className="block">NPC Asset</span>
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Library
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Browse, customize, and deploy intelligent NPCs powered by Google Gemini AI. 
            Each template comes with pre-configured behaviors, perception systems, and personality traits.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/builder"
              className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>Open Builder →</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
            <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold text-lg rounded-xl hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all">
              Create Custom NPC
            </button>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search NPCs by name, type, or capability..."
                className="w-full px-6 py-4 pl-12 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center" role="tablist">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.value
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
                }`}
                role="tab"
                aria-selected={filter === f.value}
              >
                <span className="flex items-center gap-1.5">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* NPC Grid */}
      <section className="py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="group bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="relative mb-4">
                  <div className="w-full aspect-square bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl flex items-center justify-center text-6xl mb-4 group-hover:scale-105 transition-transform">
                    {asset.thumbnail}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 capitalize">
                      {asset.type}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{asset.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{asset.description}</p>
                
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {asset.personality.slice(0, 3).map((trait) => (
                    <span key={trait} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                      {trait}
                    </span>
                  ))}
                  {asset.personality.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                      +{asset.personality.length - 3}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <Link
                    to={`/builder?template=${asset.id}`}
                    className="flex-1 text-center py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    Open in Builder
                  </Link>
                  <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all" title="Duplicate">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredAssets.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No NPCs found</h3>
              <p className="text-gray-600">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build Your World?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Select an NPC template above, customize its AI behavior, perception, and personality, 
            then deploy it into your 3D environment instantly.
          </p>
          <Link
            to="/builder"
            className="inline-block px-10 py-4 bg-white text-indigo-600 font-semibold text-lg rounded-xl hover:bg-gray-100 transition-all shadow-2xl transform hover:-translate-y-0.5"
          >
            Launch Builder Now →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl">🎮</span>
              </div>
              <span className="text-xl font-bold text-white">WonderPlay 3D</span>
            </div>
            <p className="text-sm">
              Powered by Google Gemini AI • Built with React & Three.js
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LibraryPage;