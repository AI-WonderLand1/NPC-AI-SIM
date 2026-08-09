import React, { useState } from 'react';

interface LandingPageProps {
  onNavigateTo3D?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateTo3D }) => {
  const [showFeatures, setShowFeatures] = useState(false);

  const features = [
    {
      icon: '🧠',
      title: 'Intelligent Reasoning',
      desc: 'NPCs analyze environments, make tactical decisions, and adapt behaviors using Google Gemini AI.'
    },
    {
      icon: '👁️',
      title: 'Visual Perception',
      desc: 'Process images and video feeds to detect threats, identify objects, and understand surroundings.'
    },
    {
      icon: '🎯',
      title: 'Behavior Control',
      desc: 'Seamlessly integrate with behavior trees to trigger animations, commands, and state changes.'
    },
    {
      icon: '🌐',
      title: 'Web-Native',
      desc: 'Runs entirely in the browser with Three.js — no downloads, no plugins, instant access.'
    },
    {
      icon: '⚡',
      title: 'Real-Time',
      desc: 'Sub-100ms latency for NPC decision-making in dynamic 3D environments.'
    },
    {
      icon: '🔧',
      title: 'Extensible API',
      desc: 'REST and WebSocket endpoints for intelligence, vision, and video analysis integration.'
    }
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
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              How It Works
            </a>
            <a href="#api" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              API Docs
            </a>
          </div>
          {onNavigateTo3D && (
            <button
              onClick={onNavigateTo3D}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Enter 3D World
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-32 overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          {/* Main Hero Content */}
          <div className="text-center mb-16" style={{ animationDelay: '0ms' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Live Demo Available — No Signup Required
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 leading-tight mb-6">
              <span className="block">WonderPlay</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                3D NPC Engine
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Create intelligent NPCs that perceive, reason, and act in 3D environments — 
              powered by Google Gemini AI, running entirely in your browser.
            </p>
            
            {/* Primary CTA */}
            {onNavigateTo3D && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onNavigateTo3D}
                  className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Launch 3D Experience</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold text-lg rounded-xl hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
                >
                  View Documentation
                </button>
              </div>
            )}
          </div>

          {/* 3D Preview Window */}
          <div className="relative" style={{ animationDelay: '200ms' }}>
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
              <div className="bg-gray-800/50 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-4 text-xs text-gray-400 font-mono">scene://wonderplay-3d.demo</div>
              </div>
              <div className="aspect-video bg-gradient-to-br from-gray-900 via-indigo-900/30 to-purple-900/30 relative overflow-hidden">
                {/* Simulated 3D Scene Preview */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 relative">
                      <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-ping delay-700"></div>
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/25">
                        <span className="text-4xl">🤖</span>
                      </div>
                    </div>
                    <h3 className="text-white text-xl font-semibold mb-2">Live 3D Environment</h3>
                    <p className="text-gray-400 text-sm">Click "Launch 3D Experience" to enter</p>
                  </div>
                </div>
                
                {/* Floating UI Elements */}
                <div className="absolute top-6 right-6 flex flex-col gap-2">
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span>AI Active</span>
                    </div>
                  </div>
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <span className="font-mono text-xs">FPS: 60</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 flex gap-2">
                  <button className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700 text-white text-sm hover:bg-gray-800 transition-colors">
                    🎮 Controls
                  </button>
                  <button className="bg-indigo-600 rounded-lg px-4 py-2 border border-indigo-500 text-white text-sm hover:bg-indigo-700 transition-colors">
                    👁️ Vision
                  </button>
                  <button className="bg-purple-600 rounded-lg px-4 py-2 border border-purple-500 text-white text-sm hover:bg-purple-700 transition-colors">
                    🧠 Think
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Core Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to build intelligent, responsive NPCs for your 3D worlds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Build your first AI-powered NPC in 5 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { step: '01', title: 'Define State', desc: 'Set initial NPC properties — health, AI mode, speed, personality traits.' },
              { step: '02', title: 'Add Perception', desc: 'Configure camera feeds, audio inputs, and sensor systems for awareness.' },
              { step: '03', title: 'Connect AI', desc: 'Link to WonderPlay API endpoints for intelligence, vision, and analysis.' },
              { step: '04', title: 'Trigger Behaviors', desc: 'Map AI responses to behavior tree events, animations, and commands.' },
              { step: '05', title: 'Iterate & Scale', desc: 'Continuously update state based on environmental changes and feedback.' }
            ].map((item, index) => (
              <div
                key={item.step}
                className="relative text-center group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  {index < 4 && (
                    <div className="hidden lg:block absolute top-10 left-1/2 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 -translate-x-1/2" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-24 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Developer API
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              REST and WebSocket endpoints for seamless integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Intelligence API', endpoint: 'POST /api/npc/think', desc: 'Send environment state, receive reasoned decisions from Gemini AI.', color: 'from-indigo-500 to-purple-500' },
              { title: 'Vision API', endpoint: 'POST /api/npc/see', desc: 'Upload images/frames for object detection, threat assessment, scene understanding.', color: 'from-purple-500 to-pink-500' },
              { title: 'Video API', endpoint: 'POST /api/npc/watch', desc: 'Stream video for continuous perception and temporal reasoning.', color: 'from-pink-500 to-red-500' }
            ].map((api, index) => (
              <div
                key={api.title}
                className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br {api.color} flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{api.title}</h3>
                <code className="text-sm bg-gray-900 px-3 py-1 rounded font-mono text-indigo-300 block mb-3">{api.endpoint}</code>
                <p className="text-gray-400 text-sm">{api.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build Intelligent NPCs?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join developers creating the next generation of AI-powered 3D experiences. 
            Launch the demo and see WonderPlay 3D in action.
          </p>
          {onNavigateTo3D && (
            <button
              onClick={onNavigateTo3D}
              className="px-10 py-4 bg-white text-indigo-600 font-semibold text-lg rounded-xl hover:bg-gray-100 transition-all shadow-2xl transform hover:-translate-y-0.5"
            >
              Enter 3D World Now →
            </button>
          )}
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

export default LandingPage;