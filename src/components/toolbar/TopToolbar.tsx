import React, { useState } from 'react';
import { AppMode } from '../../types';
import {
  Camera,
  GitBranch,
  Edit3,
  Bot,
  Download,
  RotateCcw,
  RotateCw,
  Save,
  CheckCircle2,
  Sliders,
  Cpu,
  Layers,
  Sparkles,
  Puzzle
} from 'lucide-react';

interface TopToolbarProps {
  activeMode: AppMode;
  setActiveMode: (mode: AppMode) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  onOpenExport: () => void;
  onOpenPlugins: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSaveProject: () => void;
  isSaving: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  activeMode,
  setActiveMode,
  projectName,
  setProjectName,
  onOpenExport,
  onOpenPlugins,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSaveProject,
  isSaving
}) => {
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <header className="h-10 bg-[#232323] border-b border-[#111] px-4 flex items-center justify-between select-none text-xs text-gray-200 z-30">
      {/* Left Section: Brand Logo & Project Title */}
      <div className="flex items-center gap-3">
        {/* Brand Badge */}
        <div className="flex items-center gap-1.5 bg-[#3d85c6] text-white font-bold px-2 py-0.5 rounded-sm tracking-wider text-[10px]">
          <Layers className="w-3.5 h-3.5 text-white" />
          <span className="font-mono">VOID_STUDIO</span>
        </div>
        <span className="text-gray-500">/</span>

        {/* Project Name & Save State Indicator */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              className="bg-[#181818] border border-[#3d85c6] text-white px-2 py-0.5 rounded-sm outline-none font-mono text-xs w-52"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="font-semibold text-gray-300 hover:text-white transition flex items-center gap-1 group"
              title="Click to rename project"
            >
              <span>{projectName}</span>
              <Edit3 className="w-3 h-3 text-gray-500 group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition" />
            </button>
          )}

          <button
            onClick={onSaveProject}
            disabled={isSaving}
            className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-sm transition"
            title="Save Checkpoint (Ctrl+S)"
          >
            {isSaving ? (
              <Save className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            )}
            <span>{isSaving ? 'Saving...' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* Center Section: Mode Switcher Pills */}
      <nav className="flex items-center bg-[#181818] p-1 rounded-sm border border-[#333] gap-1">
        <button
          onClick={() => setActiveMode('capture')}
          className={`px-3 py-1 rounded-sm flex items-center gap-1.5 font-medium text-[11px] transition ${
            activeMode === 'capture'
              ? 'bg-[#3d85c6] text-white font-semibold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>1. Capture</span>
        </button>

        <button
          onClick={() => setActiveMode('reconstruct')}
          className={`px-3 py-1 rounded-sm flex items-center gap-1.5 font-medium text-[11px] transition ${
            activeMode === 'reconstruct'
              ? 'bg-[#3d85c6] text-white font-semibold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>2. Reconstruct</span>
        </button>

        <button
          onClick={() => setActiveMode('edit')}
          className={`px-3 py-1 rounded-sm flex items-center gap-1.5 font-medium text-[11px] transition ${
            activeMode === 'edit'
              ? 'bg-[#3d85c6] text-white font-semibold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>3. Edit (Blender)</span>
        </button>

        <button
          onClick={() => setActiveMode('npc')}
          className={`px-3 py-1 rounded-sm flex items-center gap-1.5 font-medium text-[11px] transition ${
            activeMode === 'npc'
              ? 'bg-[#3d85c6] text-white font-semibold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-amber-300" />
          <span>4. NPC Plugin</span>
        </button>
      </nav>

      {/* Right Section: Undo/Redo, Plugin Manager, Export Button */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center border border-[#333] rounded-sm bg-[#181818] p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Plugin Manager Trigger */}
        <button
          onClick={onOpenPlugins}
          className="flex items-center gap-1.5 bg-[#353535] hover:bg-[#404040] text-gray-200 border border-[#444] px-2.5 py-1 rounded-sm text-[11px] transition"
          title="Plugin Manager"
        >
          <Puzzle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Plugins</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 bg-[#3d85c6] hover:bg-[#3472ab] text-white font-medium px-3 py-1 rounded-sm text-[11px] transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export 3D Asset</span>
        </button>
      </div>
    </header>
  );
};
