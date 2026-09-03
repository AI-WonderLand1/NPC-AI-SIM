import React, { useState } from 'react';
import {
  FolderTree,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Camera,
  Activity,
} from 'lucide-react';
import { AssetBrowser } from './LeftPanel/AssetBrowser';
import { DetailsPanel } from './LeftPanel/DetailsPanel';
import { RealityCapturePipelinePanel } from './Pipeline/RealityCapturePipelinePanel';
import { WonderCanvasStats } from './Pipeline/WonderCanvasStats';
import { TreeItem, TransformState, PBRMaterial, DrawerTab } from './types';

interface LeftDrawerProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  isPinned: boolean;
  onTogglePinned: () => void;
  selectedAsset: string;
  assetTree: TreeItem[];
  onSelectAsset: (id: string, name: string) => void;
  onToggleFolder: (id: string) => void;
  transform: TransformState;
  onTransformChange: (key: keyof TransformState, value: number) => void;
  materials: PBRMaterial[];
  onMaterialUpdate: (id: string, roughness: number, metallic: number) => void;
}

export const LeftDrawer: React.FC<LeftDrawerProps> = ({
  isOpen,
  onToggleOpen,
  isPinned,
  onTogglePinned,
  selectedAsset,
  assetTree,
  onSelectAsset,
  onToggleFolder,
  transform,
  onTransformChange,
  materials,
  onMaterialUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('both');
  const [drawerWidth, setDrawerWidth] = useState<'standard' | 'wide'>('standard');

  const widthClass = drawerWidth === 'wide' ? 'w-96' : 'w-80';

  return (
    <>
      {!isOpen && (
        <div className="w-11 shrink-0 h-full bg-[--color-bg-surface] border-r border-[--color-border-default] flex flex-col items-center justify-between py-2 z-30 select-none">
          <div className="flex flex-col items-center space-y-3 w-full">
            <button
              onClick={onToggleOpen}
              title="Open Content & Details Drawer (Ctrl+B)"
              aria-label="Open Left Drawer"
              className="p-2 rounded-md bg-zinc-800/80 hover:bg-sky-600 text-sky-400 hover:text-white transition-all shadow-sm group relative"
            >
              <PanelLeftOpen className="w-4 h-4" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] rounded font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                Expand Drawer (Ctrl+B)
              </span>
            </button>

            <div className="w-6 h-[1px] bg-[--color-border-default]" />

            <button
              onClick={() => { setActiveTab('assets'); onToggleOpen(); }}
              title="Open Asset Browser"
              aria-label="Open Asset Browser Tab"
              className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60 rounded-md transition-colors group relative"
            >
              <FolderTree className="w-4 h-4" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] rounded font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                Asset Browser
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('details'); onToggleOpen(); }}
              title="Open Details Inspector"
              aria-label="Open Details Inspector Tab"
              className="p-2 text-zinc-400 hover:text-sky-400 hover:bg-zinc-800/60 rounded-md transition-colors group relative"
            >
              <Sliders className="w-4 h-4" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] rounded font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                Details Inspector
              </span>
            </button>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-[1px] bg-[--color-border-default]" />
            <div
              onClick={onToggleOpen}
              className="cursor-pointer text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest py-3 [writing-mode:vertical-lr] rotate-180 flex items-center space-x-1"
            >
              <span>CONTENT DRAWER</span>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className={`${widthClass} shrink-0 h-full flex flex-col border-r border-[--color-border-default] bg-[--color-bg-surface] z-30 transition-all duration-150 ${
            !isPinned
              ? 'absolute top-10 bottom-6 left-0 shadow-[10px_0_30px_rgba(0,0,0,0.85)] z-40'
              : 'relative'
          }`}
        >
          <div className="h-8 bg-[--color-bg-elevated] border-b border-[--color-border-default] px-2.5 flex items-center justify-between text-xs select-none">
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeTab === 'both'
                    ? 'bg-[--color-bg-elevated] text-white border border-[--color-border-strong]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[--color-bg-hover]'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeTab === 'assets'
                    ? 'bg-[--color-bg-elevated] text-amber-300 border border-amber-600/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[--color-bg-hover]'
                }`}
              >
                Assets
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'bg-[--color-bg-elevated] text-sky-300 border border-sky-600/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[--color-bg-hover]'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center space-x-0.5 ${
                  activeTab === 'pipeline'
                    ? 'bg-sky-950/80 text-sky-300 border border-sky-600/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[--color-bg-hover]'
                }`}
              >
                <Camera className="w-2.5 h-2.5 text-sky-400" />
                <span>Pipeline</span>
              </button>
              <button
                onClick={() => setActiveTab('wondercanvas')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center space-x-0.5 ${
                  activeTab === 'wondercanvas'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[--color-bg-hover]'
                }`}
              >
                <Activity className="w-2.5 h-2.5 text-emerald-400" />
                <span>WonderCanvas</span>
              </button>
            </div>

            <div className="flex items-center space-x-1 text-zinc-400">
              <button
                onClick={() => setDrawerWidth((w) => (w === 'standard' ? 'wide' : 'standard'))}
                title={drawerWidth === 'standard' ? 'Expand Width' : 'Standard Width'}
                aria-label="Toggle Drawer Width"
                className="p-1 hover:bg-zinc-800 hover:text-zinc-200 rounded"
              >
                {drawerWidth === 'standard' ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>

              <button
                onClick={onTogglePinned}
                title={isPinned ? 'Unpin (Float Drawer over Viewport)' : 'Pin (Dock to layout)'}
                aria-label={isPinned ? 'Unpin Drawer' : 'Pin Drawer'}
                className={`p-1 rounded transition-colors ${
                  isPinned
                    ? 'bg-sky-950/80 text-sky-400 border border-sky-600/40'
                    : 'hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
              </button>

              <button
                onClick={onToggleOpen}
                title="Collapse Drawer (Ctrl+B)"
                aria-label="Close Left Drawer"
                className="p-1 hover:bg-rose-950/80 hover:text-rose-300 rounded transition-colors"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'both' && (
              <>
                <div className="h-[46%] flex flex-col overflow-hidden">
                  <AssetBrowser
                    treeData={assetTree}
                    selectedItem={selectedAsset}
                    onSelectItem={onSelectAsset}
                    onToggleFolder={onToggleFolder}
                  />
                </div>
                <div className="h-[54%] flex flex-col overflow-hidden">
                  <DetailsPanel
                    selectedAsset={selectedAsset}
                    transform={transform}
                    onTransformChange={onTransformChange}
                    materials={materials}
                    onMaterialUpdate={onMaterialUpdate}
                  />
                </div>
              </>
            )}

            {activeTab === 'assets' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <AssetBrowser
                  treeData={assetTree}
                  selectedItem={selectedAsset}
                  onSelectItem={onSelectAsset}
                  onToggleFolder={onToggleFolder}
                />
              </div>
            )}

            {activeTab === 'details' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <DetailsPanel
                  selectedAsset={selectedAsset}
                  transform={transform}
                  onTransformChange={onTransformChange}
                  materials={materials}
                  onMaterialUpdate={onMaterialUpdate}
                />
              </div>
            )}

            {activeTab === 'pipeline' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <RealityCapturePipelinePanel />
              </div>
            )}

            {activeTab === 'wondercanvas' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <WonderCanvasStats isPlaying={true} />
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && !isPinned && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-20"
        />
      )}
    </>
  );
};