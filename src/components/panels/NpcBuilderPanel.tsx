import React, { useState } from 'react';
import { NpcGeminiTools } from './NpcGeminiTools';
import {
  BoneNode,
  BehaviorTreeNode,
  AnimationClip,
  NpcStats
} from '../../types';
import {
  Bot,
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Sliders,
  Activity,
  Layers,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Target,
  Plus,
  Trash2,
  FileText,
  Eye,
  ShieldAlert,
  Swords,
  HeartPulse,
  Radio,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Terminal
} from 'lucide-react';

interface NpcBuilderPanelProps {
  skeleton: BoneNode;
  selectedBoneId?: string;
  onSelectBone: (boneId: string) => void;
  behaviorNodes: BehaviorTreeNode[];
  setBehaviorNodes: React.Dispatch<React.SetStateAction<BehaviorTreeNode[]>>;
  animations: AnimationClip[];
  activeAnimId: string;
  setActiveAnimId: (id: string) => void;
  currentAnimFrame: number;
  setCurrentAnimFrame: (frame: number) => void;
  isPlayingAnim: boolean;
  setIsPlayingAnim: (playing: boolean) => void;
  npcStats: NpcStats;
  setNpcStats: React.Dispatch<React.SetStateAction<NpcStats>>;
  isSimulatingNpc: boolean;
  setIsSimulatingNpc: (sim: boolean) => void;
  onAutoRig: () => void;
  onTriggerEvent?: (
    eventType: 'player_spotted' | 'player_lost' | 'take_damage' | 'receive_command' | 'heal' | 'stun',
    payload?: any
  ) => void;
  activeNpcEvent?: {
    name: string;
    type: 'spot' | 'damage' | 'command' | 'heal' | 'stun';
    timestamp: number;
  } | null;
}

export const NpcBuilderPanel: React.FC<NpcBuilderPanelProps> = ({
  skeleton,
  selectedBoneId,
  onSelectBone,
  behaviorNodes,
  setBehaviorNodes,
  animations,
  activeAnimId,
  setActiveAnimId,
  currentAnimFrame,
  setCurrentAnimFrame,
  isPlayingAnim,
  setIsPlayingAnim,
  npcStats,
  setNpcStats,
  isSimulatingNpc,
  setIsSimulatingNpc,
  onAutoRig,
  onTriggerEvent,
  activeNpcEvent
}) => {
  const [activeTab, setActiveTab] = useState<
    'rig' | 'behavior' | 'animation' | 'stats' | 'gemini'
  >('behavior');

  const [expandedBones, setExpandedBones] = useState<Record<string, boolean>>({
    bone_hips: true,
    bone_spine: true,
    bone_chest: true
  });

  const [selectedCommand, setSelectedCommand] = useState<string>('Guard Post');

  const toggleBoneExpand = (id: string) => {
    setExpandedBones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper for node status styles and icons
  const getNodeStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.5 rounded-sm animate-pulse">
            <Activity className="w-2.5 h-2.5 text-cyan-400" />
            <span>EXECUTING</span>
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded-sm">
            <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
            <span>PASSED</span>
          </span>
        );
      case 'failure':
        return (
          <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.5 rounded-sm">
            <XCircle className="w-2.5 h-2.5 text-rose-400" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[9px] uppercase text-gray-400 bg-[#181818] border border-[#333] px-1.5 py-0.5 rounded-sm">
            <Clock className="w-2.5 h-2.5 text-gray-500" />
            <span>IDLE</span>
          </span>
        );
    }
  };

  // Render Skeleton Bone Tree recursive node
  const renderBoneTree = (bone: BoneNode, depth = 0) => {
    const isSelected = selectedBoneId === bone.id;
    const hasChildren = bone.children && bone.children.length > 0;
    const isExpanded = expandedBones[bone.id];

    return (
      <div key={bone.id} className="select-none font-mono text-[11px]">
        <div
          onClick={() => onSelectBone(bone.id)}
          className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition ${
            isSelected
              ? 'bg-blue-600 text-white font-bold'
              : 'hover:bg-[#2b2b32] text-gray-300'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBoneExpand(bone.id);
              }}
              className="p-0.5 hover:text-white"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <span className="w-3 h-3" />
          )}

          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="truncate">{bone.name}</span>
        </div>

        {hasChildren && isExpanded && (
          <div>{bone.children!.map((child) => renderBoneTree(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#232323] border-r border-[#111] flex flex-col select-none text-xs text-gray-300 overflow-hidden">
      {/* Top Plugin Header */}
      <div className="bg-[#2d2d2d] border-b border-[#111] px-3 py-1.5 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2 text-gray-200">
          <Bot className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-[11px] uppercase tracking-wide">NPC Builder & Behavior Engine</span>
          <span className="bg-[#181818] border border-[#333] text-[#3d85c6] px-1.5 py-0.2 rounded-sm text-[9px] font-mono">
            Plugin v2.4
          </span>
        </div>

        {/* Live Simulation Trigger Button */}
        <button
          onClick={() => setIsSimulatingNpc(!isSimulatingNpc)}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[10px] font-semibold transition ${
            isSimulatingNpc
              ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
              : 'bg-[#3d85c6] hover:bg-[#3472ab] text-white'
          }`}
        >
          {isSimulatingNpc ? (
            <>
              <Pause className="w-3 h-3" />
              <span>Stop AI Sim</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              <span>Run Live AI Sim</span>
            </>
          )}
        </button>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="bg-[#181818] border-b border-[#111] px-2 py-1 flex items-center gap-1">
        <button
          onClick={() => setActiveTab('gemini')}
          className={`px-2 py-0.5 rounded-sm text-[10px] font-medium transition flex items-center gap-1 ${
            activeTab === 'gemini'
              ? 'bg-purple-600 text-white font-bold'
              : 'text-purple-300 hover:bg-[#2d2d2d] bg-purple-950/40 border border-purple-500/30'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Gemini AI Tools</span>
        </button>
        <button
          onClick={() => setActiveTab('behavior')}
          className={`px-2 py-0.5 rounded-sm text-[10px] font-medium transition ${
            activeTab === 'behavior'
              ? 'bg-[#3d85c6] text-white'
              : 'text-gray-400 hover:bg-[#2d2d2d]'
          }`}
        >
          Behavior Tree
        </button>
        <button
          onClick={() => setActiveTab('rig')}
          className={`px-2 py-0.5 rounded-sm text-[10px] font-medium transition ${
            activeTab === 'rig'
              ? 'bg-[#3d85c6] text-white'
              : 'text-gray-400 hover:bg-[#2d2d2d]'
          }`}
        >
          Rig & Skeleton
        </button>
        <button
          onClick={() => setActiveTab('animation')}
          className={`px-2 py-0.5 rounded-sm text-[10px] font-medium transition ${
            activeTab === 'animation'
              ? 'bg-[#3d85c6] text-white'
              : 'text-gray-400 hover:bg-[#2d2d2d]'
          }`}
        >
          Animations
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-2 py-0.5 rounded-sm text-[10px] font-medium transition ${
            activeTab === 'stats'
              ? 'bg-[#3d85c6] text-white'
              : 'text-gray-400 hover:bg-[#2d2d2d]'
          }`}
        >
          NPC Stats & AI
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3 bg-[#1a1a1a]">
        {/* 1. BEHAVIOR TREE EDITOR TAB */}
        {activeTab === 'behavior' && (
          <div className="space-y-3 flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1.5">
              <span className="font-semibold text-gray-200 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                <span>Visual Behavior Tree Engine</span>
              </span>
              <span className="text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-sm font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live State Reactive</span>
              </span>
            </div>

            {/* Manual Event Trigger Debug Panel */}
            <div className="bg-[#1e1e24] border border-[#383842] rounded-sm p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-300">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>MANUAL EVENT TRIGGERS (TREE REACT)</span>
                </div>
                {activeNpcEvent && (
                  <span className="text-[9px] text-[#3d85c6] font-semibold truncate max-w-[140px]">
                    Last: {activeNpcEvent.name}
                  </span>
                )}
              </div>

              {/* Event Quick Buttons */}
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                <button
                  onClick={() =>
                    onTriggerEvent &&
                    onTriggerEvent(
                      npcStats.aiMode === 'Aggressive' ? 'player_lost' : 'player_spotted'
                    )
                  }
                  className={`px-2 py-1 rounded-sm border flex items-center justify-center gap-1.5 transition font-semibold ${
                    npcStats.aiMode === 'Aggressive'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300 hover:bg-amber-600/50 ring-1 ring-amber-500'
                      : 'bg-[#282832] border-[#3e3e4d] text-gray-200 hover:bg-[#323240] hover:border-amber-400'
                  }`}
                >
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>{npcStats.aiMode === 'Aggressive' ? 'Player Lost' : 'Player Spotted'}</span>
                </button>

                <button
                  onClick={() => onTriggerEvent && onTriggerEvent('take_damage', 50)}
                  className="px-2 py-1 rounded-sm border bg-[#282832] border-[#3e3e4d] text-rose-300 hover:bg-rose-950/50 hover:border-rose-500 flex items-center justify-center gap-1.5 transition font-semibold"
                >
                  <Swords className="w-3 h-3 text-rose-400" />
                  <span>Take Damage (-50 HP)</span>
                </button>

                <button
                  onClick={() => onTriggerEvent && onTriggerEvent('stun')}
                  className="px-2 py-1 rounded-sm border bg-[#282832] border-[#3e3e4d] text-cyan-300 hover:bg-cyan-950/50 hover:border-cyan-500 flex items-center justify-center gap-1.5 transition font-semibold"
                >
                  <ShieldAlert className="w-3 h-3 text-cyan-400" />
                  <span>Stun / Impact</span>
                </button>

                <button
                  onClick={() => onTriggerEvent && onTriggerEvent('heal')}
                  className="px-2 py-1 rounded-sm border bg-[#282832] border-[#3e3e4d] text-emerald-300 hover:bg-emerald-950/50 hover:border-emerald-500 flex items-center justify-center gap-1.5 transition font-semibold"
                >
                  <HeartPulse className="w-3 h-3 text-emerald-400" />
                  <span>Heal & Reset Tree</span>
                </button>
              </div>

              {/* Tactical Command Row */}
              <div className="pt-1 border-t border-[#2d2d38] flex items-center gap-1.5 text-[10px]">
                <Radio className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="text-gray-400 font-mono text-[9px]">Send Command:</span>
                <select
                  value={selectedCommand}
                  onChange={(e) => {
                    setSelectedCommand(e.target.value);
                    if (onTriggerEvent) onTriggerEvent('receive_command', e.target.value);
                  }}
                  className="bg-[#141418] border border-[#3e3e4d] text-gray-200 text-[10px] px-1.5 py-0.5 rounded-sm outline-none flex-1 font-mono focus:border-purple-400"
                >
                  <option value="Guard Post">Guard Post</option>
                  <option value="Patrol Route">Patrol Route</option>
                  <option value="Charge Attack">Charge Attack</option>
                  <option value="Retreat / Fallback">Retreat / Fallback</option>
                </select>
                <button
                  onClick={() => onTriggerEvent && onTriggerEvent('receive_command', selectedCommand)}
                  className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-sm text-[9px] font-mono transition"
                >
                  Issue
                </button>
              </div>
            </div>

            {/* Behavior Tree Node Hierarchy Graph */}
            <div className="bg-[#181818] border border-[#333] rounded-sm p-2.5 relative overflow-auto min-h-[260px] space-y-2">
              <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono border-b border-[#2a2a2a] pb-1">
                <span>BEHAVIOR NODE EXECUTION FLOW</span>
                <span className="text-[#3d85c6] font-bold">
                  Active Branch: {npcStats.aiMode.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2">
                {behaviorNodes.map((node) => {
                  const isActive = node.status === 'active';
                  const isPassed = node.status === 'success';
                  const isFailed = node.status === 'failure';

                  return (
                    <div
                      key={node.id}
                      className={`p-2 rounded-sm border shadow-md font-mono text-[10px] transition-all duration-300 ${
                        isActive
                          ? 'bg-[#3d85c6]/20 border-[#3d85c6] text-white ring-1 ring-[#3d85c6] shadow-cyan-900/30'
                          : isPassed
                          ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-100'
                          : isFailed
                          ? 'bg-rose-950/20 border-rose-500/50 text-rose-200 opacity-75'
                          : 'bg-[#232323] border-[#333] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={isActive ? 'text-cyan-300' : 'text-amber-300'}>
                            {node.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] uppercase px-1 py-0.2 rounded-sm bg-[#141418] text-gray-400 font-mono">
                            {node.type}
                          </span>
                          {getNodeStatusBadge(node.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[9px] text-gray-400">
                        {Object.entries(node.params).map(([k, v]) => (
                          <div key={k} className="truncate">
                            {k}: <span className="text-gray-200 font-semibold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. RIG & SKELETON TREE TAB */}
        {activeTab === 'rig' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1.5">
              <span className="font-semibold text-gray-200 text-[11px] uppercase tracking-wide">Bone Skeleton Hierarchy</span>
              <button
                onClick={onAutoRig}
                className="flex items-center gap-1 bg-[#3d85c6] hover:bg-[#3472ab] text-white text-[10px] font-medium px-2 py-0.5 rounded-sm transition"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Auto-Rig Weights</span>
              </button>
            </div>

            <div className="bg-[#181818] p-2 rounded-sm border border-[#333]">
              {renderBoneTree(skeleton)}
            </div>
          </div>
        )}

        {/* 3. ANIMATIONS TAB */}
        {activeTab === 'animation' && (
          <div className="space-y-3">
            <div className="font-semibold text-gray-200 border-b border-[#2d2d2d] pb-1.5 text-[11px] uppercase tracking-wide">
              Attached Animation Clips
            </div>

            {/* Animation List */}
            <div className="space-y-1.5">
              {animations.map((anim) => {
                const isActive = activeAnimId === anim.id;
                return (
                  <div
                    key={anim.id}
                    onClick={() => setActiveAnimId(anim.id)}
                    className={`p-2 rounded-sm border flex items-center justify-between cursor-pointer font-mono text-[10px] transition ${
                      isActive
                        ? 'bg-[#3d85c6]/20 border-[#3d85c6] text-white font-bold'
                        : 'bg-[#232323] border-[#333] hover:border-gray-500 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-[#3d85c6]" />
                      <span>{anim.name}</span>
                    </div>
                    <span className="text-gray-400">{anim.duration}s ({anim.fps} fps)</span>
                  </div>
                );
              })}
            </div>

            {/* Scrub Timeline & Playback Controls */}
            <div className="bg-[#181818] p-3 rounded-sm border border-[#333] space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsPlayingAnim(!isPlayingAnim)}
                  className="flex items-center gap-1.5 bg-[#3d85c6] hover:bg-[#3472ab] text-white px-3 py-1 rounded-sm text-[10px] font-medium transition"
                >
                  {isPlayingAnim ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingAnim ? 'Pause' : 'Play Timeline'}</span>
                </button>

                <span className="font-mono text-[#3d85c6] font-bold text-[10px]">
                  Frame: {currentAnimFrame} / 90
                </span>
              </div>

              {/* Timeline Scrubber */}
              <input
                type="range"
                min="0"
                max="90"
                value={currentAnimFrame}
                onChange={(e) => setCurrentAnimFrame(parseInt(e.target.value) || 0)}
                className="w-full accent-[#3d85c6] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 0. GEMINI AI TOOLS TAB */}
        {activeTab === 'gemini' && (
          <NpcGeminiTools
            npcStats={npcStats}
            setNpcStats={setNpcStats}
            behaviorNodes={behaviorNodes}
            setBehaviorNodes={setBehaviorNodes}
            onTriggerEvent={onTriggerEvent}
            activeNpcEvent={activeNpcEvent}
          />
        )}

        {/* 4. STATS & AI CONFIG TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-3 font-mono text-[10px]">
            <div className="font-semibold text-gray-200 border-b border-[#2d2d2d] pb-1.5 uppercase tracking-wide text-[11px]">
              NPC Attributes & AI Parameters
            </div>

            <div className="space-y-2 bg-[#181818] p-3 rounded-sm border border-[#333]">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">NPC Name:</span>
                <input
                  type="text"
                  value={npcStats.name}
                  onChange={(e) =>
                    setNpcStats((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-[#232323] border border-[#333] text-white px-2 py-0.5 rounded-sm text-right outline-none w-48 focus:border-[#3d85c6]"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Max Health (HP):</span>
                <input
                  type="number"
                  value={npcStats.maxHealth}
                  onChange={(e) =>
                    setNpcStats((prev) => ({
                      ...prev,
                      maxHealth: parseInt(e.target.value) || 100
                    }))
                  }
                  className="bg-[#232323] border border-[#333] text-white px-2 py-0.5 rounded-sm text-right outline-none w-24 focus:border-[#3d85c6]"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Walk Speed (m/s):</span>
                <input
                  type="number"
                  step="0.1"
                  value={npcStats.walkSpeed}
                  onChange={(e) =>
                    setNpcStats((prev) => ({
                      ...prev,
                      walkSpeed: parseFloat(e.target.value) || 1.0
                    }))
                  }
                  className="bg-[#232323] border border-[#333] text-white px-2 py-0.5 rounded-sm text-right outline-none w-24 focus:border-[#3d85c6]"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Aggro Range (m):</span>
                <input
                  type="number"
                  step="0.5"
                  value={npcStats.aggroRange}
                  onChange={(e) =>
                    setNpcStats((prev) => ({
                      ...prev,
                      aggroRange: parseFloat(e.target.value) || 5.0
                    }))
                  }
                  className="bg-[#232323] border border-[#333] text-white px-2 py-0.5 rounded-sm text-right outline-none w-24 focus:border-[#3d85c6]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
