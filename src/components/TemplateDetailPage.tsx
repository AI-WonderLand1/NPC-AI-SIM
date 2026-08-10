import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { npcAssets } from './LibraryPage.js';

interface NPCAsset {
  id: string;
  name: string;
  description: string;
  type: 'humanoid' | 'creature' | 'vehicle' | 'prop';
  personality: string[];
  thumbnail: string;
  tags: string[];
  previewImages: string[];
  stats: {
    health: number;
    speed: number;
    intelligence: number;
    combat: number;
  };
  aiConfig: {
    behaviorTree: string;
    perceptionRange: number;
    decisionInterval: number;
  };
}

const TemplateDetailPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<NPCAsset | null>(null);
  const [activePreview, setActivePreview] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (templateId) {
      const found = npcAssets.find(a => a.id === templateId);
      if (found) {
        setAsset(found);
        setActivePreview(0);
      } else {
        navigate('/library');
      }
    }
  }, [templateId, navigate]);

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h2>
          <Link to="/library" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const getTypeColor = (type: NPCAsset['type']) => {
    switch (type) {
      case 'humanoid': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'creature': return 'bg-red-100 text-red-700 border-red-200';
      case 'vehicle': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'prop': return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatColor = (value: number) => {
    if (value >= 8) return 'bg-green-500';
    if (value >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleImportToBuilder = () => {
    setIsImporting(true);
    navigate(`/builder/${asset.id}`);
  };

  const handleDownload = () => {
    const data = JSON.stringify(asset, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.id}-template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/library" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl">🎮</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">WonderPlay 3D</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/library" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">
              Library
            </Link>
            <Link to="/builder" className="text-gray-400 font-medium hover:text-gray-900 transition-colors">
              Builder
            </Link>
            <Link to="/docs" className="text-gray-400 font-medium hover:text-gray-900 transition-colors">
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

      <main className="pt-16 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link to="/library" className="text-gray-500 hover:text-gray-700">Library</Link>
              </li>
              <li className="text-gray-300">/</li>
              <li>
                <span className="text-gray-900 font-medium capitalize">{asset.type}s</span>
              </li>
              <li className="text-gray-300">/</li>
              <li className="text-indigo-600 font-medium">{asset.name}</li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Main Image & Gallery */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Preview */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="aspect-video relative bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                  <img
                    src={asset.previewImages[activePreview] || asset.thumbnail}
                    alt={`${asset.name} preview ${activePreview + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  {asset.previewImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActivePreview(p => (p - 1 + asset.previewImages.length) % asset.previewImages.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                        aria-label="Previous image"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setActivePreview(p => (p + 1) % asset.previewImages.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                        aria-label="Next image"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                {/* Thumbnail strip */}
                {asset.previewImages.length > 1 && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {asset.previewImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePreview(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            activePreview === idx
                              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          aria-label={`Preview ${idx + 1}`}
                          aria-current={activePreview === idx ? 'true' : 'false'}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{asset.description}</p>
              </div>

              {/* AI Configuration */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm">🧠</span>
                  AI Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Behavior Tree</p>
                    <p className="font-mono text-gray-900">{asset.aiConfig.behaviorTree}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Perception Range</p>
                    <p className="font-mono text-gray-900">{asset.aiConfig.perceptionRange}m</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Decision Interval</p>
                    <p className="font-mono text-gray-900">{asset.aiConfig.decisionInterval}ms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Info Panel & Actions */}
            <div className="space-y-6">
              {/* Info Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-900 truncate">{asset.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(asset.type)} capitalize`}>
                        {asset.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Base Stats</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Health', value: asset.stats.health, max: 120 },
                      { label: 'Speed', value: asset.stats.speed, max: 15 },
                      { label: 'Intelligence', value: asset.stats.intelligence, max: 10 },
                      { label: 'Combat', value: asset.stats.combat, max: 10 }
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-gray-600 font-medium">{stat.label}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStatColor(stat.value)} rounded-full transition-all duration-500`}
                            style={{ width: `${(stat.value / stat.max) * 100}%` }}
                          />
                        </div>
                        <span className="w-10 text-sm font-mono text-gray-900 text-right">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {asset.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Personality */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Personality Traits</h3>
                  <div className="flex flex-wrap gap-2">
                    {asset.personality.map((trait) => (
                      <span key={trait} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleImportToBuilder}
                    disabled={isImporting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Importing to Builder...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Import to Canvas
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Template (JSON)
                  </button>
                  <Link
                    to="/library"
                    className="w-full py-3 px-4 text-center text-gray-600 font-medium rounded-xl hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Library
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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

export default TemplateDetailPage;