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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="fixed top-4 left-4 z-10">
          <button
            onClick={handleBackToLanding}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Landing
          </button>
        </div>
        <Scene3D isSubscribed={isSubscribed} onSubscribe={handleSubscribe} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <LandingPage onNavigateTo3D={handleNavigateTo3D} />
    </div>
  );
}

export default App;