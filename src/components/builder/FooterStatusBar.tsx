import React from 'react';
import { Play, Pause, Stop, RotateCcw, FolderTree, Package, Terminal, Cpu, Sparkles, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Settings, HelpCircle, Wifi, Database, Zap, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FooterStatusBarProps {
  isPlaying: boolean;
  totalLogs: number;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  isQuickAssetsDrawerOpen: boolean;
  onToggleQuickAssetsDrawer: () => void;
  placedPropsCount: number;
  isDebugConsoleOpen: boolean;
  onToggleDebugConsole: () => void;
}

export const FooterStatusBar: React.FC<FooterStatusBarProps> = ({
  isPlaying,
  totalLogs,
  isDrawerOpen,
  onToggleDrawer,
  isQuickAssetsDrawerOpen,
  onToggleQuickAssetsDrawer,
  placedPropsCount,
  isDebugConsoleOpen,
  onToggleDebugConsole,
}) => {
  return (
    <footer className="h-10 bg-[--color-bg-elevated] border-t border-[--color-border-default] px-4 flex items-center justify-between text-xs text-zinc-400 shrink-0 z-40">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : (
            <Play className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="font-mono text-white">
            {isPlaying ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}
          </span>
          <span className="text-zinc-600">|</span>
          <span className="font-mono">60 FPS</span>
        </div>

        <div className="w-px h-5 bg-zinc-800" />

        <div className="flex items-center space-x-1.5">
          <FolderTree className="w-3.5 h-3.5" />
          <span className="font-mono">Content Drawer</span>
          <button
            onClick={onToggleDrawer}
            className={`p-1 rounded transition-colors ${
              isDrawerOpen ? 'bg-sky-950/80 text-sky-400' : 'hover:bg-zinc-800 hover:text-white'
            }`}
            title={isDrawerOpen ? 'Close Content Drawer' : 'Open Content Drawer'}
          >
            {isDrawerOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          <Package className="w-3.5 h-3.5" />
          <span className="font-mono">Quick Props</span>
          <button
            onClick={onToggleQuickAssetsDrawer}
            className={`p-1 rounded transition-colors ${
              isQuickAssetsDrawerOpen ? 'bg-amber-950/80 text-amber-400' : 'hover:bg-zinc-800 hover:text-white'
            }`}
            title={isQuickAssetsDrawerOpen ? 'Close Quick Props' : 'Open Quick Props'}
          >
            {isQuickAssetsDrawerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <span className="px-2 py-0.5 bg-zinc-800 rounded text-white font-mono text-[10px]">{placedPropsCount}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-mono">Debug Console</span>
          <button
            onClick={onToggleDebugConsole}
            className={`p-1 rounded transition-colors ${
              isDebugConsoleOpen ? 'bg-emerald-950/80 text-emerald-400' : 'hover:bg-zinc-800 hover:text-white'
            }`}
            title={isDebugConsoleOpen ? 'Close Debug Console' : 'Open Debug Console'}
          >
            {isDebugConsoleOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <span className="px-2 py-0.5 bg-zinc-800 rounded text-white font-mono text-[10px]">{totalLogs}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <div className="flex items-center space-x-1">
            <Wifi className="w-3 h-3 text-sky-400" />
            <span className="text-sky-400">WS Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400">Synced</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400">GPU: WebGPU</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white" title="Help">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};