import React, { useRef, useState } from 'react';
import { ChevronDown, GitBranch, Maximize, Plus, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import type { BehaviorNode, GraphConnection, NodePin } from '../types';

interface BehaviorGraphEditorProps {
  nodes: BehaviorNode[];
  connections: GraphConnection[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, deltaX: number, deltaY: number) => void;
  isPlaying: boolean;
  onAddNode: (title: string, category: string) => void;
}

export const BehaviorGraphEditor: React.FC<BehaviorGraphEditorProps> = ({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  onNodeMove,
  isPlaying,
  onAddNode,
}) => {
  const [zoom, setZoom] = useState(0.82);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleNodeMouseDown = (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    onSelectNode(nodeId);
    setDraggingNodeId(nodeId);
    dragStartPos.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const deltaX = (event.clientX - dragStartPos.current.x) / zoom;
    const deltaY = (event.clientY - dragStartPos.current.y) / zoom;
    onNodeMove(draggingNodeId, deltaX, deltaY);
    dragStartPos.current = { x: event.clientX, y: event.clientY };
  };

  const getPinCoordinate = (nodeId: string, pinId: string, isOutput: boolean) => {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const width = node.width || 205;
    const pins = isOutput ? node.outputs : node.inputs;
    const pinIndex = Math.max(0, pins.findIndex((pin) => pin.id === pinId));
    return {
      x: isOutput ? node.x + width : node.x,
      y: node.y + 43 + pinIndex * 22,
    };
  };

  const createBezierPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const bend = Math.max(Math.abs(end.x - start.x) * 0.5, 38);
    return `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`;
  };

  const renderPin = (pin: NodePin) => (
    <span
      className={pin.type === 'exec'
        ? 'inline-block h-2.5 w-2.5 shrink-0 rotate-45 border-2 border-white/90 bg-white/10'
        : 'inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-black'}
      style={pin.type === 'exec' ? undefined : { backgroundColor: pin.color || '#38bdf8' }}
    />
  );

  return (
    <div
      className="flex h-full min-h-0 select-none flex-col bg-[#06101a]"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDraggingNodeId(null)}
      onMouseLeave={() => setDraggingNodeId(null)}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#1d2a3e] bg-[#081321] px-3">
        <GitBranch className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-semibold text-zinc-200">Behavior Graph</span>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => {
                setShowAddMenu((value) => !value);
                setShowTemplateMenu(false);
              }}
              className="flex h-7 items-center gap-1 rounded-md border border-[#2c405a] bg-[#0b1725] px-2.5 text-[8px] text-zinc-300 hover:border-blue-500/50 hover:text-white"
            >
              <Plus className="h-3 w-3" /> Add Node
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-[#30415a] bg-[#0b1522] py-1 shadow-2xl">
                {[
                  ['Perception', 'perception'],
                  ['Dialogue', 'dialogue'],
                  ['Play Animation', 'animation'],
                  ['Expression', 'expression'],
                  ['Memory Query', 'memory'],
                  ['Decision', 'decision'],
                ].map(([title, category]) => (
                  <button
                    key={title}
                    onClick={() => {
                      onAddNode(title, category);
                      setShowAddMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-[8px] text-zinc-400 hover:bg-blue-950/40 hover:text-white"
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowTemplateMenu((value) => !value);
                setShowAddMenu(false);
              }}
              className="flex h-7 items-center gap-1 rounded-md border border-[#2c405a] bg-[#0b1725] px-2.5 text-[8px] text-zinc-400 hover:text-white"
            >
              <Sparkles className="h-3 w-3 text-violet-400" /> AI Templates <ChevronDown className="h-3 w-3" />
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#30415a] bg-[#0b1522] py-1 shadow-2xl">
                {['Companion', 'Guard / Patrol', 'Merchant', 'Quest NPC'].map((template) => (
                  <button
                    key={template}
                    onClick={() => setShowTemplateMenu(false)}
                    className="w-full px-3 py-1.5 text-left text-[8px] text-zinc-400 hover:bg-violet-950/40 hover:text-white"
                  >
                    {template}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="blueprint-grid-dense relative flex-1 overflow-hidden"
        onMouseDown={() => {
          onSelectNode(null);
          setShowAddMenu(false);
          setShowTemplateMenu(false);
        }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <defs>
            <filter id="active-wire-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {connections.map((connection) => {
            const start = getPinCoordinate(connection.fromNodeId, connection.fromPinId, true);
            const end = getPinCoordinate(connection.toNodeId, connection.toPinId, false);
            const path = createBezierPath(start, end);
            const active = isPlaying && connection.isActiveFlow;
            return (
              <g key={connection.id}>
                <path d={path} stroke="#02060b" strokeWidth="5" fill="none" />
                <path
                  d={path}
                  stroke={connection.color}
                  strokeWidth={active ? 3 : 2}
                  fill="none"
                  strokeLinecap="round"
                  filter={active ? 'url(#active-wire-glow)' : undefined}
                  className={active ? 'animate-wire-flow' : undefined}
                  opacity={active ? 1 : 0.86}
                />
              </g>
            );
          })}
        </svg>

        <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          {nodes.map((node) => {
            const selected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onMouseDown={(event) => handleNodeMouseDown(event, node.id)}
                className={`absolute cursor-move overflow-hidden rounded-lg border bg-[#0b1522]/95 shadow-[0_12px_35px_rgba(0,0,0,0.48)] backdrop-blur ${
                  selected ? 'border-sky-400 ring-2 ring-sky-500/20' : 'border-[#31415a] hover:border-[#4d6585]'
                }`}
                style={{ width: node.width || 205, transform: `translate(${node.x}px, ${node.y}px)` }}
              >
                <div className={`border-b border-black/20 px-2.5 py-1.5 ${node.headerColor}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-semibold text-white">{node.title}</span>
                    {node.isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                  </div>
                  {node.subTitle && <div className="mt-0.5 truncate font-mono text-[7px] text-white/55">{node.subTitle}</div>}
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 font-mono">
                  <div className="space-y-1.5">
                    {node.inputs.map((pin) => (
                      <div key={pin.id} className="flex items-center gap-1.5 text-[8px] text-zinc-400">{renderPin(pin)}<span className="truncate">{pin.label}</span></div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {node.outputs.map((pin) => (
                      <div key={pin.id} className="flex items-center justify-end gap-1.5 text-[8px] text-zinc-400"><span className="truncate">{pin.label}</span>{renderPin(pin)}</div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md border border-[#26364d] bg-[#07111d]/90 p-1 text-[7px] text-zinc-600 backdrop-blur">
          <button onClick={() => setZoom((z) => Math.max(0.55, z - 0.1))} className="rounded p-1 hover:bg-white/5 hover:text-white"><ZoomOut className="h-3 w-3" /></button>
          <span className="w-8 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.25, z + 0.1))} className="rounded p-1 hover:bg-white/5 hover:text-white"><ZoomIn className="h-3 w-3" /></button>
          <button onClick={() => setZoom(0.82)} className="rounded p-1 hover:bg-white/5 hover:text-white"><Maximize className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
};
