import React, { useState } from 'react';
import LandingPage from './components/LandingPage.js';
import { Scene3D } from './components/Scene3D.js';

function App() {
  const [view, setView] = useState<'landing' | '3d'>('landing');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNavigateTo3D = () => {
    setView('3d');
  };

  const handleBackToLanding = () => {
    setView('landing');
    setIsSubscribed(false);
  };

  const handleSubscribe = () => {
    setIsSubscribed(true);
  };

  if (view === '3d') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="fixed top-4 left-4 right-4 z-10 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm">🎮</span>
            </div>
            <span className="text-white font-bold text-lg">WonderPlay 3D</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToLanding}
              className="px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              ← Back
            </button>
            {!isSubscribed && (
              <button
                onClick={handleSubscribe}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Unlock Full Access
              </button>
            )}
          </div>
        </div>
        <Scene3D isSubscribed={isSubscribed} onSubscribe={handleSubscribe} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <LandingPage onNavigateTo3D={handleNavigateTo3D} />
    </div>
  );
}

export default App;