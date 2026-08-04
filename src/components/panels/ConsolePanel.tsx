import React, { useState } from 'react';
import { ConsoleLog } from '../../types';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ConsolePanelProps {
  logs: ConsoleLog[];
  onClearLogs: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  logs,
  onClearLogs
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterSource, setFilterSource] = useState<
    'All' | 'Meshroom' | 'Blender' | 'NPC Plugin' | 'Capture' | 'System'
  >('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesSource = filterSource === 'All' || log.source === filterSource;
    const matchesQuery =
      !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesQuery;
  });

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.source}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`w-full bg-[#232323] border-t border-[#111] flex flex-col select-none text-xs text-gray-300 transition-all duration-200 ${
        isCollapsed ? 'h-7' : 'h-40'
      }`}
    >
      {/* Header Bar */}
      <div className="bg-[#2d2d2d] border-b border-[#111] px-3 py-1 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-0.5 hover:text-white transition"
          >
            {isCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>

          <div className="flex items-center gap-1.5 font-mono text-gray-200">
            <Terminal className="w-3.5 h-3.5 text-[#3d85c6]" />
            <span className="font-semibold text-[11px] uppercase tracking-wide">Console Output</span>
            <span className="bg-[#181818] border border-[#333] text-gray-400 px-1.5 py-0.2 rounded-sm text-[9px]">
              {filteredLogs.length} events
            </span>
          </div>
        </div>

        {/* Source Filter Tabs & Controls */}
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center bg-[#181818] p-0.5 rounded-sm border border-[#333] gap-0.5 text-[9px] font-mono">
              {(['All', 'Meshroom', 'Blender', 'NPC Plugin', 'Capture', 'System'] as const).map(
                (src) => (
                  <button
                    key={src}
                    onClick={() => setFilterSource(src)}
                    className={`px-2 py-0.5 rounded-sm transition ${
                      filterSource === src
                        ? 'bg-[#3d85c6] text-white font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {src}
                  </button>
                )
              )}
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3 h-3 absolute left-2 text-gray-500" />
              <input
                type="text"
                placeholder="Filter logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#181818] border border-[#333] text-white pl-6 pr-2 py-0.5 rounded-sm text-[10px] font-mono outline-none w-32 focus:border-[#3d85c6]"
              />
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-[#353535] text-gray-400 hover:text-white rounded-sm transition"
              title="Copy filtered logs"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Clear Button */}
            <button
              onClick={onClearLogs}
              className="p-1 hover:bg-[#353535] text-gray-400 hover:text-red-400 rounded-sm transition"
              title="Clear Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Log Feed Canvas */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 bg-[#181818]">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 hover:bg-[#232323] p-1 rounded-sm transition"
            >
              <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
              <span
                className={`font-bold shrink-0 px-1 py-0.2 rounded-sm text-[9px] ${
                  log.source === 'Meshroom'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    : log.source === 'Blender'
                    ? 'bg-[#3d85c6]/20 text-[#3d85c6] border border-[#3d85c6]/40'
                    : log.source === 'NPC Plugin'
                    ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
                    : 'bg-[#333] text-gray-300'
                }`}
              >
                {log.source}
              </span>

              <span
                className={`flex-1 ${
                  log.type === 'error'
                    ? 'text-red-400 font-bold'
                    : log.type === 'warn'
                    ? 'text-amber-400'
                    : log.type === 'success'
                    ? 'text-emerald-400 font-medium'
                    : 'text-gray-300'
                }`}
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
