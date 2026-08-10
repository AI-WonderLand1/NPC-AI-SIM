import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import LibraryPage from './components/LibraryPage.js';
import { BuilderPage } from './components/BuilderPage.js';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/library" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xl">🎮</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">WonderPlay 3D</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/library"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/library'
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Library
          </Link>
          <Link
            to="/builder"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/builder'
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Builder
          </Link>
          <Link
            to="/docs"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/docs'
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            API Docs
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
            Sign In
          </button>
          <Link
            to="/builder"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Launch Builder
          </Link>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = () => {
    setIsSubscribed(true);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        <Routes>
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/builder" element={<BuilderPage isSubscribed={isSubscribed} onSubscribe={handleSubscribe} />} />
          <Route path="/builder/:templateId" element={<BuilderPage isSubscribed={isSubscribed} onSubscribe={handleSubscribe} />} />
          <Route path="/docs" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold text-gray-900 mb-4">API Documentation</h1><p className="text-gray-600">Coming soon...</p></div></div>} />
          <Route path="/" element={<LibraryPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;