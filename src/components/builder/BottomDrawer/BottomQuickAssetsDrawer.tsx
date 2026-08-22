import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Box, Package, Trash2, Plus, Grid, List } from 'lucide-react';
import { QuickActionAsset, SceneSpawnedObject } from '../types';

interface BottomQuickAssetsDrawerProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onSpawnAsset: (asset: QuickActionAsset) => void;
  spawnedCount: number;
  onClearSpawned: () => void;
}

const QUICK_ASSETS: QuickActionAsset[] = [
  { id: 'crate', name: 'Wooden Crate', category: 'prop', icon: '📦', polyCount: '1.2k tris', color: '#d97706', description: 'Basic wooden crate prop', defaultScale: 1 },
  { id: 'barrel', name: 'Metal Barrel', category: 'prop', icon: '🛢️', polyCount: '800 tris', color: '#71717a', description: 'Industrial metal barrel', defaultScale: 1 },
  { id: 'rock', name: 'Granite Rock', category: 'prop', icon: '🪨', polyCount: '3.6k tris', color: '#52525b', description: 'Natural rock formation', defaultScale: 1.2 },
  { id: 'tree', name: 'Pine Tree', category: 'foliage', icon: '🌲', polyCount: '8.2k tris', color: '#16a34a', description: 'Large pine tree', defaultScale: 1.4 },
  { id: 'bush', name: 'Bush', category: 'foliage', icon: '🌿', polyCount: '2.1k tris', color: '#22c55e', description: 'Decorative bush', defaultScale: 0.8 },
  { id: 'car', name: 'Sedan Car', category: 'vehicle', icon: '🚗', polyCount: '12k tris', color: '#3b82f6', description: 'Modern sedan vehicle', defaultScale: 1 },
  { id: 'lamp', name: 'Street Lamp', category: 'lighting', icon: '💡', polyCount: '1.5k tris', color: '#fbbf24', description: 'Street lighting prop', defaultScale: 1 },
  { id: 'bench', name: 'Park Bench', category: 'structure', icon: '🪑', polyCount: '2.4k tris', color: '#78716c', description: 'Wooden park bench', defaultScale: 1 },
];

export const BottomQuickAssetsDrawer: React.FC<BottomQuickAssetsDrawerProps> = ({
  isOpen,
  onToggleOpen,
  onSpawnAsset,
  spawnedCount,
  onClearSpawned,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = QUICK_ASSETS.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[--color-bg-elevated] border border-[--color-border-default] rounded-lg text-zinc-300 hover:bg-[--color-bg-hover] hover:text-white transition-all shadow-xl flex items-center space-x-2"
      >
        <Package className="w-4 h-4" />
        <span className="text-sm font-medium">Quick Assets ({spawnedCount} placed)</span>
        <ChevronUp className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-[--color-bg-surface] border-t border-[--color-border-default] rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="p-3 border-b border-[--color-border-default] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleOpen}
              className="p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-semibold text-white text-sm">Quick Assets & Props</h3>
              <p className="text-[11px] text-zinc-500 font-mono">{filteredAssets.length} assets available • {spawnedCount} placed in scene</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assets..."
              className="bg-[--color-bg-input] border border-[--color-border-default] rounded px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 w-48"
            />
            <div className="flex items-center space-x-1 bg-zinc-800/50 rounded p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {spawnedCount > 0 && (
              <button
                onClick={onClearSpawned}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-3 custom-scrollbar">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => onSpawnAsset(asset)}
                  className="p-3 bg-[--color-bg-input] border border-[--color-border-default] rounded-xl hover:border-[--color-accent-blue] hover:bg-zinc-800/50 transition-all group flex flex-col items-center space-y-2"
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {asset.icon}
                  </div>
                  <div className="text-center w-full">
                    <p className="text-white text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-[10px] text-zinc-500 capitalize">{asset.category}</p>
                    <p className="text-[9px] text-zinc-600 font-mono">{asset.polyCount}</p>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: '100%', backgroundColor: asset.color }}
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => onSpawnAsset(asset)}
                  className="w-full p-3 bg-[--color-bg-input] border border-[--color-border-default] rounded-xl hover:border-[--color-accent-blue] hover:bg-zinc-800/50 transition-all flex items-center space-x-3"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-2xl">
                    {asset.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-[10px] text-zinc-500 capitalize">{asset.category} • {asset.polyCount}</p>
                  </div>
                  <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: '100%', backgroundColor: asset.color }}
                    />
                  </div>
                  <Plus className="w-5 h-5 text-zinc-500 group-hover:text-sky-400 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};