import React, { useState } from 'react';
import { Checkpoint } from '../../types';
import {
  History,
  RotateCcw,
  Plus,
  Bookmark,
  CheckCircle2,
  Layers,
  Sparkles,
  Save,
  GitCommit
} from 'lucide-react';

interface CheckpointsPanelProps {
  checkpoints: Checkpoint[];
  onRollback: (checkpoint: Checkpoint) => void;
  onCreateCheckpoint: (name: string) => void;
}

export const CheckpointsPanel: React.FC<CheckpointsPanelProps> = ({
  checkpoints,
  onRollback,
  onCreateCheckpoint
}) => {
  const [newCheckpointName, setNewCheckpointName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!newCheckpointName.trim()) return;
    onCreateCheckpoint(newCheckpointName.trim());
    setNewCheckpointName('');
    setIsCreating(false);
  };

  return (
    <div className="w-full h-full bg-[#232323] border-l border-[#111] flex flex-col select-none text-xs text-gray-300 overflow-hidden">
      {/* Header */}
      <div className="bg-[#2d2d2d] px-3 py-1.5 text-[10px] uppercase font-semibold text-gray-300 border-b border-[#111] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-emerald-400" />
          <span className="tracking-wide">Version Checkpoints</span>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 bg-[#3d85c6] hover:bg-[#3472ab] text-white px-2 py-0.5 rounded-sm text-[10px] font-medium transition"
        >
          <Plus className="w-3 h-3" />
          <span>Save Checkpoint</span>
        </button>
      </div>

      {/* Manual Checkpoint Form input */}
      {isCreating && (
        <div className="p-2 bg-[#181818] border-b border-[#111] flex items-center gap-2">
          <input
            type="text"
            placeholder="Checkpoint Name (e.g. Pre-Sculpt Backup)..."
            value={newCheckpointName}
            onChange={(e) => setNewCheckpointName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            className="flex-1 bg-[#232323] border border-[#3d85c6] text-white px-2.5 py-1 rounded-sm outline-none text-[11px]"
          />
          <button
            onClick={handleCreate}
            className="bg-[#3d85c6] hover:bg-[#3472ab] text-white font-medium px-3 py-1 rounded-sm text-[11px] transition"
          >
            Save
          </button>
          <button
            onClick={() => setIsCreating(false)}
            className="text-gray-400 hover:text-white px-2 py-1 text-[11px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Checkpoints Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#1a1a1a]">
        {checkpoints.map((chk, index) => (
          <div
            key={chk.id}
            className="relative pl-5 border-l-2 border-[#2d2d2d] hover:border-[#3d85c6] transition group"
          >
            {/* Timeline Dot Indicator */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#232323] border-2 border-[#3d85c6] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3d85c6]" />
            </div>

            {/* Checkpoint Card */}
            <div className="bg-[#232323] border border-[#333] group-hover:border-gray-500 rounded-sm p-2.5 space-y-1.5 transition">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-200 text-[11px]">
                  {chk.name}
                </span>
                <span className="text-[9px] font-mono text-gray-400">
                  {chk.timestamp}
                </span>
              </div>

              {/* Stage Badge & Diff summary */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-[#181818] border border-[#333] text-emerald-400 font-mono px-1.5 py-0.2 rounded-sm">
                  {chk.stage}
                </span>
                <span className="text-[10px] text-gray-300 font-mono">
                  {chk.diffSummary}
                </span>
              </div>

              {/* Polygon & Vertex Delta Info */}
              <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono pt-1 border-t border-[#2d2d2d]">
                <div>
                  Verts: <span className="text-gray-200">{chk.vertexCount.toLocaleString()}</span> | Tris:{' '}
                  <span className="text-gray-200">{chk.faceCount.toLocaleString()}</span>
                </div>

                {/* Rollback Trigger */}
                <button
                  onClick={() => onRollback(chk)}
                  className="flex items-center gap-1 text-[#3d85c6] hover:text-[#5299dc] transition font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Rollback</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
