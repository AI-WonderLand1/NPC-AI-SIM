import React, { useRef, useEffect } from 'react';
import { X, Terminal, Filter, Trash2, Copy, ChevronDown, ChevronUp, Footprints, RotateCcw, RotateCw, FastForward, Clock, Zap, Cpu, Database, Mic, MessageSquare, Eye, Layers, Settings, Download } from 'lucide-react';
import { ConsoleLogEntry, NpcMotionPreset } from '../types';

interface DebugConsoleProps {
  logs: ConsoleLogEntry[];
  onClearLogs: () => void;
  onAddLog: (level: ConsoleLogEntry['level'], message: string) => void;
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
  WARN: <Zap className="w-3 h-3" />,
  DEBUG: <Terminal className="w-3 h-3" />,
  NEURAL: <Cpu className="w-3 h-3" />,
  WEBRTC: <Wifi className="w-3 h-3" />,
  DECISION: <Layers className="w-3 h-3" />,
  SHADERS: <Zap className="w-3 h-3" />,
  AUDIO: <Mic className="w-3 h-3" />,
  SUCCESS: <CheckCircle2 className="w-3 h-3" />,
  ERROR: <AlertCircle className="w-3 h-3" />,
};

export const DebugConsole: React.FC<DebugConsoleProps> = ({
  logs,
  onClearLogs,
  onAddLog,
  isOpen,
  onToggleOpen,
  motionPreset,
  onSelectMotionPreset,
  playbackSpeed,
  onSelectPlaybackSpeed,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | ConsoleLogEntry['level']>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = filterLevel === 'all' ? logs : logs.filter(l => l.level === filterLevel);

  return (
    <div className="h-full flex flex-col bg-[--color-bg-surface] border-t border-[--color-border-default]">
      <div className="h-8 bg-[--color-bg-elevated] border-b border-[--color-border-default] px-3 flex items-center justify-between text-xs text-zinc-300 z-20 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-[#1f1f23] px-2 py-1 rounded-t border-t-2 border-emerald-500 text-emerald-400 font-medium font-mono text-xs">
            <Terminal className="w-3.5 h-3.5" />
            <span>DEBUG CONSOLE</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-zinc-400">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as typeof filterLevel)}
            className="bg-[--color-bg-input] border border-[--color-border-default] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="NEURAL">NEURAL</option>
            <option value="DECISION">DECISION</option>
            <option value="DEBUG">DEBUG</option>
            <option value="WEBRTC">WEBRTC</option>
            <option value="AUDIO">AUDIO</option>
            <option value="SHADERS">SHADERS</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="SUCCESS">SUCCESS</option>
          </select>

          <button
            onClick={() => { onClearLogs(); onAddLog('INFO', 'Console cleared'); }}
            className="p-1 hover:bg-zinc-800 hover:text-zinc-200 rounded"
            title="Clear Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleOpen}
            className="p-1 hover:bg-rose-950/80 hover:text-rose-300 rounded transition-colors"
            title="Close Console"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-2 bg-[--color-bg-input] border-b border-[--color-border-default] space-y-2">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-400">Motion:</span>
            <select
              value={motionPreset}
              onChange={(e) => onSelectMotionPreset(e.target.value as NpcMotionPreset)}
              className="bg-[--color-bg-surface] border border-[--color-border-default] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="walk-in-place">Step In-Place</option>
              <option value="idle">Idle Breathe</option>
              <option value="combat">Combat Stance</option>
              <option value="dialogue">Dialogue Gestures</option>
            </select>

            <span className="text-zinc-400">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => onSelectPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-[--color-bg-surface] border border-[--color-border-default] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value={0.5}>0.5x</option>
              <option value={1.0}>1.0x</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2.0x</option>
            </select>

            <label className="flex items-center space-x-1 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded accent-sky-500 bg-zinc-900"
              />
              <span className="text-xs">Auto-scroll</span>
            </label>
          </div>
        </div>

        <div ref={logContainerRef} className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-[--color-bg-deep]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No logs</p>
              <p className="text-xs text-zinc-600">Start simulation to see output</p>
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-2 px-2 py-1 hover:bg-zinc-900/50 rounded transition-colors border-l-2 border-transparent hover:border-sky-500/30"
              >
                <span className={`flex-shrink-0 mt-0.5 ${LEVEL_COLORS[log.level]}`}>
                  {LEVEL_ICONS[log.level]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-[10px] font-mono">
                    <span className="text-zinc-500">{log.timestamp}</span>
                    <span className={`font-medium ${LEVEL_COLORS[log.level]}`}>{log.level}</span>
                    {log.nodeSource && (
                      <span className="text-zinc-500">[{log.nodeSource}]</span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-300 font-sans whitespace-pre-wrap break-all mt-0.5">
                    {log.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};