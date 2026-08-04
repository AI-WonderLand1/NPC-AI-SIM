import React, { useState } from 'react';
import { PipelineNode, PipelineNodeStatus } from '../../types';
import {
  GitBranch,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sliders,
  Maximize2,
  Ruler,
  Layers,
  ChevronRight,
  Circle
} from 'lucide-react';

interface PipelineGraphProps {
  nodes: PipelineNode[];
  setNodes: React.Dispatch<React.SetStateAction<PipelineNode[]>>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  pointCloudType: 'sparse' | 'dense';
  setPointCloudType: (type: 'sparse' | 'dense') => void;
  meshDecimation: number;
  setMeshDecimation: (val: number) => void;
  onRunPipeline: () => void;
  isPipelineRunning: boolean;
  onOpenScaleCalibration: () => void;
}

export const PipelineGraph: React.FC<PipelineGraphProps> = ({
  nodes,
  setNodes,
  selectedNodeId,
  setSelectedNodeId,
  pointCloudType,
  setPointCloudType,
  meshDecimation,
  setMeshDecimation,
  onRunPipeline,
  isPipelineRunning,
  onOpenScaleCalibration
}) => {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleParamChange = (paramKey: string, value: any) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              params: {
                ...node.params,
                [paramKey]: value
              }
            }
          : node
      )
    );
  };

  return (
    <div className="w-full h-full bg-[#232323] border-r border-[#111] flex flex-col select-none text-xs text-gray-300 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-[#2d2d2d] px-3 py-1.5 text-[10px] uppercase font-semibold text-gray-300 border-b border-[#111] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-amber-400" />
          <span className="tracking-wide">Meshroom Pipeline Graph</span>
        </div>

        {/* Run Pipeline Trigger */}
        <button
          onClick={onRunPipeline}
          disabled={isPipelineRunning}
          className="flex items-center gap-1.5 bg-[#3d85c6] hover:bg-[#3472ab] disabled:bg-[#3d85c6]/50 text-white font-medium px-2.5 py-0.5 rounded-sm text-[10px] transition"
        >
          <Play className={`w-3 h-3 ${isPipelineRunning ? 'animate-spin' : ''}`} />
          <span>{isPipelineRunning ? 'Processing...' : 'Run Pipeline'}</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Active Pipeline Execution HUD Overlay */}
        {isPipelineRunning && (
          <div className="absolute top-2 left-3 right-3 bg-[#14141c]/95 border border-amber-500/60 p-2 rounded-sm backdrop-blur-md flex items-center justify-between z-30 shadow-2xl animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span>Reconstruction Pipeline Active</span>
                  <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
                    Step {nodes.findIndex((n) => n.status === 'processing') >= 0 ? nodes.findIndex((n) => n.status === 'processing') + 1 : nodes.length} of {nodes.length}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  Active Stage:{' '}
                  <span className="text-gray-100 font-bold">
                    {nodes.find((n) => n.status === 'processing')?.name || 'Finalizing Outputs'}
                  </span>
                </div>
              </div>
            </div>

            {/* Overall Pipeline Progress Bar */}
            <div className="flex items-center gap-3 w-52">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-gray-400">
                  <span>Overall Pipeline</span>
                  <span className="text-amber-400 font-bold">
                    {Math.round(
                      ((nodes.filter((n) => n.status === 'done').length +
                        (nodes.find((n) => n.status === 'processing')?.progress || 0) / 100) /
                        Math.max(1, nodes.length)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden border border-[#3d3d4e]">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-200"
                    style={{
                      width: `${
                        ((nodes.filter((n) => n.status === 'done').length +
                          (nodes.find((n) => n.status === 'processing')?.progress || 0) / 100) /
                          Math.max(1, nodes.length)) *
                        100
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Node Graph Canvas View */}
        <div className="flex-1 bg-[#181818] p-3 overflow-x-auto overflow-y-auto relative flex items-center min-h-[180px]">
          {/* Node Wires / Connections SVG Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.map((node, idx) => {
              if (idx === nodes.length - 1) return null;
              const sourceNode = node;
              const targetNode = nodes[idx + 1];

              const x1 = idx * 216 + 170;
              const y1 = 90;
              const x2 = (idx + 1) * 216 + 20;
              const y2 = 90;

              const isWireActive = sourceNode.status === 'done' && targetNode.status === 'processing';
              const isWireDone = sourceNode.status === 'done' && targetNode.status === 'done';

              return (
                <g key={`wire_${node.id}`}>
                  {/* Outer Glow path for active wire */}
                  {isWireActive && (
                    <path
                      d={`M ${x1} ${y1} C ${x1 + 45} ${y1}, ${x2 - 45} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="6"
                      opacity="0.3"
                      className="animate-pulse"
                    />
                  )}
                  {/* Core Wire */}
                  <path
                    d={`M ${x1} ${y1} C ${x1 + 45} ${y1}, ${x2 - 45} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={isWireDone ? '#10b981' : isWireActive ? '#f59e0b' : '#374151'}
                    strokeWidth={isWireActive ? '3' : '2'}
                    strokeDasharray={isWireActive ? '6,6' : 'none'}
                    className={isWireActive ? 'animate-pulse' : ''}
                  />
                </g>
              );
            })}
          </svg>

          {/* Draggable Node Cards */}
          <div className="flex items-center gap-12 z-10 pl-2 pr-6 py-4">
            {nodes.map((node, idx) => {
              const isSelected = selectedNode?.id === node.id;
              const isProcessing = node.status === 'processing';
              const isDone = node.status === 'done';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-48 bg-[#232323] border rounded-sm p-2.5 cursor-pointer shadow-lg transition-all duration-300 relative ${
                    isProcessing
                      ? 'border-amber-500 ring-2 ring-amber-500/50 bg-amber-950/20 shadow-amber-500/20'
                      : isDone
                      ? 'border-emerald-500/60 bg-emerald-950/10 shadow-emerald-500/10'
                      : 'border-[#333] hover:border-gray-500'
                  } ${
                    isSelected ? 'ring-1 ring-[#3d85c6] border-[#3d85c6]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[9px] bg-[#141418] border border-[#333] text-gray-400 px-1 rounded-sm font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-gray-200 text-[11px] truncate">
                        {node.name}
                      </span>
                    </div>

                    {isDone && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {isProcessing && (
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                    )}
                    {node.status === 'queued' && (
                      <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />
                    )}
                  </div>

                  {/* Category & Status */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mb-1.5">
                    <span>{node.category}</span>
                    <span
                      className={`capitalize font-bold ${
                        isDone
                          ? 'text-emerald-400'
                          : isProcessing
                          ? 'text-amber-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {isProcessing ? `${node.progress}%` : node.status}
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full h-1.5 bg-[#141418] border border-[#2c2c36] rounded-sm overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ease-out ${
                        isDone
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                          : isProcessing
                          ? 'bg-gradient-to-r from-amber-600 to-amber-400 animate-pulse'
                          : 'bg-gray-700'
                      }`}
                      style={{ width: `${node.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reconstruction Quick Tools Bar (Point Cloud + Decimation + Scale Calibration) */}
        <div className="bg-[#2d2d2d] border-y border-[#111] p-2 grid grid-cols-3 gap-3 items-center">
          {/* Sparse vs Dense Point Cloud Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[10px] uppercase font-semibold">Point Cloud:</span>
            <div className="flex bg-[#181818] p-0.5 rounded-sm border border-[#333]">
              <button
                onClick={() => setPointCloudType('sparse')}
                className={`px-2 py-0.5 rounded-sm text-[10px] transition ${
                  pointCloudType === 'sparse'
                    ? 'bg-[#3d85c6] text-white font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sparse (14.2k)
              </button>
              <button
                onClick={() => setPointCloudType('dense')}
                className={`px-2 py-0.5 rounded-sm text-[10px] transition ${
                  pointCloudType === 'dense'
                    ? 'bg-[#3d85c6] text-white font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Dense (500k)
              </button>
            </div>
          </div>

          {/* Decimation Slider */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[10px] uppercase font-semibold whitespace-nowrap">
              Mesh Decimate:
            </span>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={meshDecimation}
              onChange={(e) => setMeshDecimation(parseFloat(e.target.value))}
              className="w-full accent-[#3d85c6] cursor-pointer"
            />
            <span className="font-mono text-[#3d85c6] font-bold text-[10px]">
              {Math.round(meshDecimation * 100)}%
            </span>
          </div>

          {/* Scale Calibration Button */}
          <div className="flex justify-end">
            <button
              onClick={onOpenScaleCalibration}
              className="flex items-center gap-1.5 bg-[#181818] hover:bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-medium px-2 py-0.5 rounded-sm transition text-[10px]"
            >
              <Ruler className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scale Calibration</span>
            </button>
          </div>
        </div>

        {/* Selected Node Parameter Inspector Panel */}
        {selectedNode && (
          <div className="h-44 bg-[#232323] p-3 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1.5 mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-gray-200">
                <Sliders className="w-3.5 h-3.5 text-[#3d85c6]" />
                <span className="text-[11px] uppercase tracking-wide">
                  Node Parameters: {selectedNode.name}
                </span>
              </div>
              <span className="text-[10px] bg-[#181818] border border-[#333] text-[#3d85c6] px-2 py-0.5 rounded-sm font-mono">
                {selectedNode.category}
              </span>
            </div>

            {/* Dynamic Parameter Fields */}
            <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
              {Object.entries(selectedNode.params).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 capitalize truncate">
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  {typeof val === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => handleParamChange(key, e.target.checked)}
                      className="accent-[#3d85c6]"
                    />
                  ) : typeof val === 'number' ? (
                    <input
                      type="number"
                      value={val}
                      onChange={(e) =>
                        handleParamChange(key, parseFloat(e.target.value) || 0)
                      }
                      className="w-24 bg-[#181818] border border-[#333] text-white px-2 py-0.5 rounded-sm text-right outline-none focus:border-[#3d85c6]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(val)}
                      onChange={(e) => handleParamChange(key, e.target.value)}
                      className="w-28 bg-[#181818] border border-[#333] text-white px-2 py-0.5 rounded-sm text-right outline-none focus:border-[#3d85c6]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
