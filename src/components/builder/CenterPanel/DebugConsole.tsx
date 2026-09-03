import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Layers,
  Mic,
  Terminal,
  Trash2,
  Wifi,
} from 'lucide-react';
import type { ConsoleLogEntry, NpcMotionPreset } from '../types';

interface DebugConsoleProps {
  logs: ConsoleLogEntry[];
  onClearLogs: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  motionPreset: NpcMotionPreset;
  onSelectMotionPreset: (preset: NpcMotionPreset) => void;
  playbackSpeed: number;
  onSelectPlaybackSpeed: (speed: number) => void;
}

const LEVEL_COLORS: Record<ConsoleLogEntry['level'], string> = {
  INFO: 'text-sky-400',
  WARN: 'text-amber-400',
  DEBUG: 'text-zinc-400',
  NEURAL: 'text-purple-400',
  WEBRTC: 'text-emerald-400',
  DECISION: 'text-cyan-400',
  SHADERS: 'text-amber-300',
  AUDIO: 'text-emerald-300',
  SUCCESS: 'text-emerald-400',
  ERROR: 'text-rose-400',
};

const LEVEL_ICONS: Record<ConsoleLogEntry['level'], React.ReactNode> = {
  INFO: <Database className="w-3 h-3" />,
  WARN: <AlertCircle className="w-3 h-3" />,
  DEBUG: <Terminal className="w-3 h-3" />,
  NEURAL: <Cpu className="w-3 h-3" />,
  WEBRTC: <Wifi className="w-3 h-3" />,
  DECISION: <Layers className="w-3 h-3" />,
  SHADERS: <Cpu className="w-3 h-3" />,
  AUDIO: <Mic className="w-3 h-3" />,
  SUCCESS: <CheckCircle2 className="w-3 h-3" />,
  ERROR: <AlertCircle className="w-3 h-3" />,
};

export const DebugConsole: React.FC<DebugConsoleProps> = ({
  logs,
  onClearLogs,
  isOpen,
  onToggleOpen,
  motionPreset,
  onSelectMotionPreset,
  playbackSpeed,
  onSelectPlaybackSpeed,
}) => {
  const [filterLevel, setFilterLevel] = useState<'all' | ConsoleLogEntry['level']>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = filterLevel === 'all' ? logs : logs.filter((log) => log.level === filterLevel);

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="h-full w-full bg-[#141417] border-t border-zinc-800 px-3 flex items-center gap-2 text-[10px] text-zinc-400 hover:text-white"
      >
        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-mono font-semibold">DEBUG CONSOLE</span>
        <span className="ml-auto">{logs.length} logs</span>
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#09090b] border-t border-zinc-800">
      <div className="h-8 shrink-0 px-3 flex items-center gap-2 bg-[#141417] border-b border-zinc-800">
        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-mono font-semibold text-zinc-200">DEBUG CONSOLE</span>

        <select
          value={filterLevel}
          onChange={(event) => setFilterLevel(event.target.value as typeof filterLevel)}
          className="ml-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[9px] text-zinc-300"
        >
          <option value="all">All levels</option>
          {Object.keys(LEVEL_COLORS).map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>

        <span className="text-[9px] text-zinc-500">Motion</span>
        <select
          value={motionPreset}
          onChange={(event) => onSelectMotionPreset(event.target.value as NpcMotionPreset)}
          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[9px] text-zinc-300"
        >
          <option value="idle">Idle</option>
          <option value="walk-in-place">Walk</option>
          <option value="combat">Combat</option>
          <option value="dialogue">Dialogue</option>
        </select>

        <span className="text-[9px] text-zinc-500">Speed</span>
        <select
          value={playbackSpeed}
          onChange={(event) => onSelectPlaybackSpeed(Number(event.target.value))}
          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[9px] text-zinc-300"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>

        <label className="ml-auto flex items-center gap-1 text-[9px] text-zinc-500">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(event) => setAutoScroll(event.target.checked)}
            className="accent-sky-500"
          />
          Auto-scroll
        </label>

        <button onClick={onClearLogs} className="p-1 text-zinc-500 hover:text-rose-400" title="Clear console">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onToggleOpen} className="p-1 text-zinc-500 hover:text-white" title="Collapse console">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div ref={logContainerRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-0.5 font-mono">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] text-zinc-600">No logs for this filter.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="grid grid-cols-[64px_70px_1fr] gap-2 px-1.5 py-0.5 rounded hover:bg-zinc-900/70 text-[9px]">
              <span className="text-zinc-600">{log.timestamp}</span>
              <span className={`flex items-center gap-1 ${LEVEL_COLORS[log.level]}`}>
                {LEVEL_ICONS[log.level]}
                {log.level}
              </span>
              <span className="text-zinc-300 break-words">
                {log.nodeSource && <span className="text-zinc-600">[{log.nodeSource}] </span>}
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
