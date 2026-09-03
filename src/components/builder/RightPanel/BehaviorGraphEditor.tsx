import React, { useRef, useState } from 'react';
import { GitBranch, Maximize, Plus, ZoomIn, ZoomOut } from 'lucide-react';
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
      y: node.y + 40 + pinIndex * 22,
    };
  };

  const createBezierPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const bend = Math.max(Math.abs(end.x - start.x) * 0.5, 45);
    return `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`;
  };

  const renderPin = (pin: NodePin) => (
    <span
      className={pin.type === 'exec'
        ? 'w-2.5 h-2.5 border-2 border-white/90 bg-white/10 rotate-45 inline-block shrink-0'
        : 'w-2.5 h-2.5 rounded-full border border-black inline-block shrink-0'}
      style={pin.type === 'exec' ? undefined : { backgroundColor: pin.color || '#38bdf8' }}
    />
  );

  return (
    <div
      className="h-full min-h-0 flex flex-col bg-[#0d0d11] select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDraggingNodeId(null)}
      onMouseLeave={() => setDraggingNodeId(null)}
    >
      <div className="h-8 shrink-0 px-2 border-b border-zinc-800 bg-[#141417] flex items-center gap-2">
        <GitBranch className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[10px] tracking-wider font-semibold text-zinc-200">AI BEHAVIOR GRAPH</span>

        <div className="ml-auto relative">
          <button
            onClick={() => setShowAddMenu((value) => !value)}
            className="px-2 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white text-[9px] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Node
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-[#18181b] border border-zinc-700 rounded shadow-2xl py-1">
              {[
                ['Perception', 'perception'],
                ['Dialogue', 'dialogue'],
                ['Play Animation', 'animation'],
                ['Expression', 'expression'],
                ['Memory Query', 'memory'],
              ].map(([title, category]) => (
                <button
                  key={title}
                  onClick={() => {
                    onAddNode(title, category);
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[9px] text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  {title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center border border-zinc-800 rounded bg-zinc-950">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="p-1 text-zinc-400 hover:text-white">
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="w-9 text-center text-[9px] font-mono text-zinc-400">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))} className="p-1 text-zinc-400 hover:text-white">
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
        <button onClick={() => setZoom(0.82)} className="p-1 text-zinc-400 hover:text-white" title="Reset zoom">
          <Maximize className="w-3 h-3" />
        </button>
      </div>

      <div
        className="relative flex-1 overflow-hidden blueprint-grid-dense"
        onMouseDown={() => onSelectNode(null)}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          <defs>
            <filter id="active-wire-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {connections.map((connection) => {
            const start = getPinCoordinate(connection.fromNodeId, connection.fromPinId, true);
            const end = getPinCoordinate(connection.toNodeId, connection.toPinId, false);
            const path = createBezierPath(start, end);
            const active = isPlaying && connection.isActiveFlow;
            return (
              <g key={connection.id}>
                <path d={path} stroke="#050505" strokeWidth="5" fill="none" />
                <path
                  d={path}
                  stroke={connection.color}
                  strokeWidth={active ? 3 : 2}
                  fill="none"
                  strokeLinecap="round"
                  filter={active ? 'url(#active-wire-glow)' : undefined}
                  className={active ? 'animate-wire-flow' : undefined}
                />
              </g>
            );
          })}
        </svg>

        <div
          className="absolute inset-0"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {nodes.map((node) => {
            const selected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onMouseDown={(event) => handleNodeMouseDown(event, node.id)}
                className={`absolute rounded border bg-[#18181d] shadow-2xl cursor-move ${
                  selected ? 'border-sky-400 ring-2 ring-sky-500/30' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                style={{
                  width: node.width || 205,
                  transform: `translate(${node.x}px, ${node.y}px)`,
                }}
              >
                <div className={`px-2.5 py-1.5 rounded-t border-b border-zinc-700/60 ${node.headerColor}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-white tracking-wide">{node.title}</span>
                    {node.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                  {node.subTitle && <div className="text-[8px] font-mono text-white/60 mt-0.5">{node.subTitle}</div>}
                </div>

                <div className="p-2 grid grid-cols-2 gap-2 font-mono">
                  <div className="space-y-1.5">
                    {node.inputs.map((pin) => (
                      <div key={pin.id} className="flex items-center gap-1.5 text-[9px] text-zinc-300">
                        {renderPin(pin)}
                        <span className="truncate">{pin.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {node.outputs.map((pin) => (
                      <div key={pin.id} className="flex items-center justify-end gap-1.5 text-[9px] text-zinc-300">
                        <span className="truncate">{pin.label}</span>
                        {renderPin(pin)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-2 left-2 px-2 py-1 rounded border border-zinc-800 bg-zinc-950/90 text-[8px] font-mono text-zinc-500">
          Drag nodes • Click canvas to deselect • {nodes.length} nodes
        </div>
      </div>
    </div>
  );
};
