import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Gauge,
  Layers,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
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
  aiCommand?: string;
  onAiCommandChange?: (value: string) => void;
  onRunAiCommand?: () => void;
  provider?: string;
  model?: string;
}

type ConsoleTab = 'Console' | 'AI Assistant' | 'Validation' | 'Performance';

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
  INFO: <Layers className="h-3 w-3" />,
  WARN: <AlertCircle className="h-3 w-3" />,
  DEBUG: <Terminal className="h-3 w-3" />,
  NEURAL: <Cpu className="h-3 w-3" />,
  WEBRTC: <Wifi className="h-3 w-3" />,
  DECISION: <Layers className="h-3 w-3" />,
  SHADERS: <Cpu className="h-3 w-3" />,
  AUDIO: <Mic className="h-3 w-3" />,
  SUCCESS: <CheckCircle2 className="h-3 w-3" />,
  ERROR: <AlertCircle className="h-3 w-3" />,
};

const TABS: Array<{ id: ConsoleTab; icon: React.ReactNode }> = [
  { id: 'Console', icon: <Terminal className="h-3 w-3" /> },
  { id: 'AI Assistant', icon: <Sparkles className="h-3 w-3" /> },
  { id: 'Validation', icon: <ShieldCheck className="h-3 w-3" /> },
  { id: 'Performance', icon: <Gauge className="h-3 w-3" /> },
];

export const DebugConsole: React.FC<DebugConsoleProps> = ({
  logs,
  onClearLogs,
  isOpen,
  onToggleOpen,
  motionPreset,
  onSelectMotionPreset,
  playbackSpeed,
  onSelectPlaybackSpeed,
  aiCommand = '',
  onAiCommandChange,
  onRunAiCommand,
  provider = 'AIW Gateway',
  model = 'Auto',
}) => {
  const [filterLevel, setFilterLevel] = useState<'all' | ConsoleLogEntry['level']>('all');
  const [activeTab, setActiveTab] = useState<ConsoleTab>('Console');
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
        className="flex h-full w-full items-center gap-2 border-t border-[#1d2a3e] bg-[#07101a] px-3 text-[9px] text-zinc-500 hover:text-white"
      >
        <Terminal className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-mono font-semibold">CONSOLE</span>
        <span className="ml-auto">{logs.length} logs</span>
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#050a11]">
      <div className="flex h-8 shrink-0 items-center border-b border-[#1d2a3e] bg-[#081321] px-2">
        <div className="flex h-full items-center">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex h-full items-center gap-1.5 px-3 text-[8px] font-medium transition ${
                activeTab === tab.id ? 'text-blue-200' : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              {tab.icon}
              {tab.id}
              {activeTab === tab.id && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-blue-500" />}
            </button>
          ))}
        </div>

        {activeTab === 'Console' && (
          <select
            value={filterLevel}
            onChange={(event) => setFilterLevel(event.target.value as typeof filterLevel)}
            className="ml-auto rounded-md border border-[#26364d] bg-[#0a1420] px-2 py-1 text-[8px] text-zinc-400 outline-none"
          >
            <option value="all">All Logs</option>
            {Object.keys(LEVEL_COLORS).map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        )}

        <button onClick={onClearLogs} className="ml-2 rounded p-1.5 text-zinc-600 hover:bg-white/5 hover:text-rose-300" title="Clear console">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={onToggleOpen} className="rounded p-1.5 text-zinc-600 hover:bg-white/5 hover:text-white" title="Collapse console">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'Console' && (
          <div ref={logContainerRef} className="h-full overflow-y-auto custom-scrollbar px-2 py-1.5 font-mono">
            {filteredLogs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[9px] text-zinc-700">No logs for this filter.</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="grid grid-cols-[60px_64px_1fr] gap-2 rounded px-1.5 py-0.5 text-[8px] hover:bg-white/[0.025]">
                  <span className="text-zinc-700">[{log.timestamp}]</span>
                  <span className={`flex items-center gap-1 ${LEVEL_COLORS[log.level]}`}>
                    {LEVEL_ICONS[log.level]}
                    {log.level}
                  </span>
                  <span className="break-words text-zinc-400">
                    {log.nodeSource && <span className="text-zinc-700">[{log.nodeSource}] </span>}
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'AI Assistant' && (
          <div className="grid h-full grid-cols-[1fr_270px] gap-3 p-3">
            <div className="rounded-lg border border-blue-900/40 bg-blue-950/10 p-3">
              <div className="flex items-center gap-2 text-[9px] font-semibold text-blue-200"><Sparkles className="h-3.5 w-3.5" />AI editor command center</div>
              <p className="mt-2 max-w-2xl text-[8px] leading-4 text-zinc-600">Describe the NPC or a change in plain English. Commands are kept inside the same editor so users do not have to leave the viewport or behavior graph.</p>
              <div className="mt-3 rounded-md border border-[#26364d] bg-[#07101a] p-2 font-mono text-[8px] text-zinc-500">Try: “Give this character patrol behavior, a calmer voice, and a suspicious reaction to strangers.”</div>
            </div>
            <div className="rounded-lg border border-[#223047] bg-[#07101a] p-3 text-[8px]">
              <div className="text-zinc-600">Current brain</div>
              <div className="mt-1 font-semibold text-zinc-300">{provider}</div>
              <div className="mt-0.5 truncate text-zinc-600">{model}</div>
              <div className="mt-3 text-zinc-600">Motion</div>
              <div className="mt-1 text-zinc-300">{motionPreset} • {playbackSpeed}x</div>
            </div>
          </div>
        )}

        {activeTab === 'Validation' && (
          <div className="grid h-full grid-cols-3 gap-3 p-3 text-[8px]">
            {[
              ['Character asset', 'Ready', 'text-emerald-300'],
              ['Behavior graph', 'Valid', 'text-emerald-300'],
              ['AI configuration', 'Gateway reference', 'text-sky-300'],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-lg border border-[#223047] bg-[#07101a] p-3">
                <div className="text-zinc-600">{label}</div>
                <div className={`mt-2 text-[10px] font-semibold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Performance' && (
          <div className="grid h-full grid-cols-4 gap-3 p-3 text-[8px]">
            {[
              ['Renderer', 'WebGL / PBR'],
              ['Motion', `${motionPreset} @ ${playbackSpeed}x`],
              ['Logs', `${logs.length}`],
              ['AI route', provider],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#223047] bg-[#07101a] p-3">
                <div className="text-zinc-600">{label}</div>
                <div className="mt-2 text-[10px] font-semibold text-zinc-300">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex h-9 shrink-0 items-center gap-2 border-t border-[#1d2a3e] bg-[#07101a] px-2">
        <Sparkles className="h-3.5 w-3.5 text-sky-400" />
        <input
          value={aiCommand}
          onChange={(event) => onAiCommandChange?.(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onRunAiCommand?.()}
          placeholder="Type a command or ask AI to create/change anything..."
          className="min-w-0 flex-1 bg-transparent text-[9px] text-zinc-300 outline-none placeholder:text-zinc-700"
        />
        <span className="hidden max-w-44 truncate text-[7px] text-zinc-700 xl:block">{provider} • {model}</span>
        <button onClick={onRunAiCommand} className="flex h-7 w-8 items-center justify-center rounded-md border border-blue-500/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40" title="Run AI command">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
