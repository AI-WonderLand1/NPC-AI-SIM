import React, { useState, useRef } from 'react';
import {
  GitBranch,
  Plus,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  Cpu,
  Layers,
  Circle,
} from 'lucide-react';
import { BehaviorNode, GraphConnection, NodePin } from '../types';

interface BehaviorGraphEditorProps {
  nodes: BehaviorNode[];
  connections: GraphConnection[];
  onNodeMove: (nodeId: string, deltaX: number, deltaY: number) => void;
  isPlaying: boolean;
  onAddNode: (title: string, category: string) => void;
}

export const BehaviorGraphEditor: React.FC<BehaviorGraphEditorProps> = ({
  nodes,
  connections,
  onNodeMove,
  isPlaying,
  onAddNode,
}) => {
  const [zoom, setZoom] = useState(1);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const deltaX = (e.clientX - dragStartPos.current.x) / zoom;
    const deltaY = (e.clientY - dragStartPos.current.y) / zoom;
    onNodeMove(draggingNodeId, deltaX, deltaY);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const getPinCoordinate = (nodeId: string, pinId: string, isOutput: boolean) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const nodeWidth = node.width || 210;
    const headerHeight = 36;
    const pinHeight = 22;

    const pinIndex = isOutput
      ? node.outputs.findIndex((p) => p.id === pinId)
      : node.inputs.findIndex((p) => p.id === pinId);

    const pinY = node.y + headerHeight + (pinIndex >= 0 ? pinIndex : 0) * pinHeight + 16;
    const pinX = isOutput ? node.x + nodeWidth : node.x;

    return { x: pinX, y: pinY };
  };

  const createBezierPath = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = Math.max(Math.abs(p2.x - p1.x) * 0.5, 40);
    return `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
  };

  const getPinIcon = (pin: NodePin) => {
    if (pin.type === 'exec') {
      return (
        <span className="w-2.5 h-2.5 border-2 border-white bg-white/20 transform rotate-45 inline-block shrink-0" />
      );
    }
    return (
      <span
        className="w-2.5 h-2.5 rounded-full border border-zinc-900 inline-block shrink-0"
        style={{ backgroundColor: pin.color || '#38bdf8' }}
      />
    );
  };

  return (
    <div
      className="flex flex-col h-full bg-[#101014] relative overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="h-8 bg-[#141417] border-b border-[#27272a] px-3 flex items-center justify-between text-xs text-zinc-300 z-30">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-[#1f1f23] px-2.5 py-1 rounded-t border-t-2 border-purple-500 text-white font-medium font-mono text-xs">
            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Node Graph</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-zinc-400">
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium flex items-center space-x-1 shadow"
            >
              <Plus className="w-3 h-3" />
              <span>Add Node</span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#18181b] border border-zinc-700 rounded shadow-2xl py-1 z-50 text-zinc-300 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-zinc-500 font-mono">
                  Available Nodes
                </div>
                <button
                  onClick={() => { onAddNode('LLM Context Filter', 'neural'); setShowAddMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-xs flex items-center space-x-2 text-sky-300"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>LLM Context Filter</span>
                </button>
                <button
                  onClick={() => { onAddNode('Audio WebRTC Sync', 'audio'); setShowAddMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-xs flex items-center space-x-2 text-emerald-300"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Audio WebRTC Sync</span>
                </button>
                <button
                  onClick={() => { onAddNode('Branch On Emotion', 'behavior'); setShowAddMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-xs flex items-center space-x-2 text-amber-300"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Branch On Emotion</span>
                </button>
              </div>
            )}
          </div>

          <div className="h-3.5 w-[1px] bg-zinc-800" />

          <div className="flex items-center bg-[#09090b] border border-zinc-800 rounded px-1.5 py-0.5 space-x-1">
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
              aria-label="Zoom Out"
              className="p-0.5 hover:text-white"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] text-zinc-300 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))}
              aria-label="Zoom In"
              className="p-0.5 hover:text-white"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => setZoom(1)}
            title="Reset Zoom / Pan"
            aria-label="Reset Zoom and Pan"
            className="p-1 bg-[#09090b] border border-zinc-800 rounded hover:text-white"
          >
            <Maximize className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative blueprint-grid-dense overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          <defs>
            <linearGradient id="execGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
            <filter id="wireGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {connections.map((conn) => {
            const start = getPinCoordinate(conn.fromNodeId, conn.fromPinId, true);
            const end = getPinCoordinate(conn.toNodeId, conn.toPinId, false);
            const path = createBezierPath(start, end);

            return (
              <g key={conn.id}>
                <path d={path} stroke="#000000" strokeWidth="5" fill="none" opacity="0.6" />
                <path
                  d={path}
                  stroke={conn.color || '#38bdf8'}
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  filter={isPlaying && conn.isActiveFlow ? 'url(#wireGlow)' : undefined}
                />
                {isPlaying && conn.isActiveFlow && (
                  <path
                    d={path}
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                    className="animate-wire-flow"
                    opacity="0.85"
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div
          className="absolute inset-0 z-20"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {nodes.map((node) => {
            const nodeWidth = node.width || 210;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                  width: `${nodeWidth}px`,
                }}
                className={`absolute bg-[#18181d] rounded-lg border border-zinc-700/80 shadow-2xl transition-shadow cursor-move ${
                  node.borderColor || ''
                } ${
                  node.highlight
                    ? 'ring-2 ring-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                    : 'hover:border-zinc-500'
                }`}
              >
                <div
                  className={`px-2.5 py-1.5 rounded-t-lg border-b border-zinc-700/60 flex items-center justify-between ${
                    node.headerColor || 'bg-zinc-800'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs truncate tracking-wide text-white">
                      {node.title}
                    </span>
                    {node.subTitle && (
                      <span className="text-[9px] text-zinc-300/80 font-mono truncate">
                        {node.subTitle}
                      </span>
                    )}
                  </div>
                  {node.isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </div>

                <div className="p-2 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-start space-x-2">
                    <div className="space-y-1.5 flex-1">
                      {node.inputs.map((pin) => (
                        <div
                          key={pin.id}
                          className="flex items-center space-x-1.5 text-zinc-300 text-[10px] hover:text-white transition-colors"
                        >
                          {getPinIcon(pin)}
                          <span className="truncate">{pin.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 flex-1 text-right">
                      {node.outputs.map((pin) => (
                        <div
                          key={pin.id}
                          className="flex items-center justify-end space-x-1.5 text-zinc-300 text-[10px] hover:text-white transition-colors"
                        >
                          <span className="truncate">{pin.label}</span>
                          {getPinIcon(pin)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-3 left-3 z-30 pointer-events-none bg-zinc-950/80 border border-zinc-800 rounded p-1 shadow-lg backdrop-blur-xs">
          <div className="w-24 h-16 bg-[#141418] rounded relative flex items-center justify-center border border-zinc-800/80">
            <div className="w-3 h-2 bg-sky-500/70 rounded absolute top-2 left-2" />
            <div className="w-4 h-3 bg-amber-500/90 rounded absolute top-4 left-8" />
            <div className="w-4 h-3 bg-rose-500/70 rounded absolute top-4 left-14" />
            <div className="w-3 h-2 bg-indigo-500/70 rounded absolute bottom-2 left-8" />
            <div className="w-3 h-2 bg-emerald-500/70 rounded absolute bottom-2 left-14" />
            <div className="absolute inset-1 border border-white/40 rounded pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};