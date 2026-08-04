import React from 'react';
import { BatchJob } from '../../types';
import {
  Layers,
  Play,
  Pause,
  Trash2,
  ArrowUp,
  ArrowDown,
  Cpu,
  Clock,
  Plus
} from 'lucide-react';

interface BatchQueuePanelProps {
  jobs: BatchJob[];
  setJobs: React.Dispatch<React.SetStateAction<BatchJob[]>>;
  onAddJob: () => void;
}

export const BatchQueuePanel: React.FC<BatchQueuePanelProps> = ({
  jobs,
  setJobs,
  onAddJob
}) => {
  const handleTogglePause = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? { ...j, status: j.status === 'processing' ? 'paused' : 'processing' }
          : j
      )
    );
  };

  const handleRemove = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleMovePriority = (index: number, direction: 'up' | 'down') => {
    const next = [...jobs];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= next.length) return;

    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setJobs(next);
  };

  return (
    <div className="w-full h-full bg-[#232323] border-t border-[#111] flex flex-col select-none text-xs text-gray-300 overflow-hidden">
      {/* Header */}
      <div className="bg-[#2d2d2d] px-3 py-1.5 text-[10px] uppercase font-semibold text-gray-300 border-b border-[#111] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#3d85c6]" />
          <span className="tracking-wide">Batch Queue Manager</span>
          <span className="bg-[#181818] border border-[#333] text-gray-400 px-1.5 py-0.2 rounded-sm text-[9px] lowercase font-mono">
            {jobs.length} active jobs
          </span>
        </div>

        <button
          onClick={onAddJob}
          className="flex items-center gap-1 bg-[#3d85c6] hover:bg-[#3472ab] text-white px-2.5 py-0.5 rounded-sm text-[10px] font-medium transition"
        >
          <Plus className="w-3 h-3" />
          <span>Queue Photo Set</span>
        </button>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[#1a1a1a]">
        {jobs.map((job, idx) => (
          <div
            key={job.id}
            className="bg-[#232323] border border-[#333] hover:border-gray-500 rounded-sm p-2 flex items-center justify-between gap-3 transition"
          >
            {/* Priority & Reorder Controls */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleMovePriority(idx, 'up')}
                disabled={idx === 0}
                className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleMovePriority(idx, 'down')}
                disabled={idx === jobs.length - 1}
                className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>

            {/* Info & Progress */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="font-semibold text-gray-200 text-[11px]">{job.projectName}</span>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>{job.imageCount} Photos</span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Cpu className="w-3 h-3" /> GPU: {job.gpuUsage}%
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" /> {job.estimatedTime}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#181818] rounded-sm overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      job.status === 'processing'
                        ? 'bg-[#3d85c6]'
                        : job.status === 'paused'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-[#3d85c6] font-bold w-10 text-right">
                  {job.progress}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleTogglePause(job.id)}
                className="p-1 bg-[#181818] hover:bg-[#2d2d2d] text-gray-300 rounded-sm border border-[#333] transition"
                title={job.status === 'processing' ? 'Pause' : 'Resume'}
              >
                {job.status === 'processing' ? (
                  <Pause className="w-3 h-3 text-amber-400" />
                ) : (
                  <Play className="w-3 h-3 text-emerald-400" />
                )}
              </button>
              <button
                onClick={() => handleRemove(job.id)}
                className="p-1 bg-[#181818] hover:bg-red-950/60 text-gray-400 hover:text-red-400 rounded-sm border border-[#333] transition"
                title="Cancel Job"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
