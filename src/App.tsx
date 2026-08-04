import React, { useState, useEffect } from 'react';
import {
  AppMode,
  RenderMode,
  GizmoMode,
  PhotoSample,
  PipelineNode,
  ModifierItem,
  MaterialData,
  SculptBrush,
  Checkpoint,
  BatchJob,
  BoneNode,
  BehaviorTreeNode,
  AnimationClip,
  NpcStats,
  PluginItem,
  ConsoleLog,
  ScaleCalibration
} from './types';
import {
  INITIAL_PHOTOS,
  INITIAL_PIPELINE_NODES,
  INITIAL_MODIFIERS,
  INITIAL_MATERIAL,
  INITIAL_CHECKPOINTS,
  INITIAL_BATCH_JOBS,
  INITIAL_SKELETON,
  INITIAL_BEHAVIOR_NODES,
  INITIAL_ANIMATIONS,
  INITIAL_NPC_STATS,
  INITIAL_PLUGINS,
  INITIAL_CONSOLE_LOGS
} from './data/initialData';

import { Viewport3D } from './components/3d/Viewport3D';
import { TopToolbar } from './components/toolbar/TopToolbar';
import { CapturePanel } from './components/panels/CapturePanel';
import { PipelineGraph } from './components/panels/PipelineGraph';
import { BlenderProperties } from './components/panels/BlenderProperties';
import { CheckpointsPanel } from './components/panels/CheckpointsPanel';
import { BatchQueuePanel } from './components/panels/BatchQueuePanel';
import { NpcBuilderPanel } from './components/panels/NpcBuilderPanel';
import { PluginManager } from './components/panels/PluginManager';
import { ConsolePanel } from './components/panels/ConsolePanel';
import { MaskEditorModal } from './components/modals/MaskEditorModal';
import { ExportModal } from './components/modals/ExportModal';
import { ToastContainer, ToastItem } from './components/common/ToastContainer';

export default function App() {
  // Navigation & View State
  const [activeMode, setActiveMode] = useState<AppMode>('capture');
  const [renderMode, setRenderMode] = useState<RenderMode>('textured');
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('none');
  const [showCameraFrustums, setShowCameraFrustums] = useState(true);
  const [projectName, setProjectName] = useState('Knight_Sentinel_Scan_v3.meshforge');
  const [isSaving, setIsSaving] = useState(false);

  // Photogrammetry Data State
  const [photos, setPhotos] = useState<PhotoSample[]>(INITIAL_PHOTOS);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>('img_01');
  const [maskPhotoModal, setMaskPhotoModal] = useState<PhotoSample | null>(null);

  // Meshroom Pipeline Graph State
  const [pipelineNodes, setPipelineNodes] = useState<PipelineNode[]>(INITIAL_PIPELINE_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_sfm');
  const [pointCloudType, setPointCloudType] = useState<'sparse' | 'dense'>('sparse');
  const [meshDecimation, setMeshDecimation] = useState<number>(0.8);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  // 3D Geometry Scale Calibration
  const [scaleCalibration, setScaleCalibration] = useState<ScaleCalibration>({
    active: false,
    step: 'none',
    realDistance: 1.85
  });

  // Blender Properties State
  const [modifiers, setModifiers] = useState<ModifierItem[]>(INITIAL_MODIFIERS);
  const [material, setMaterial] = useState<MaterialData>(INITIAL_MATERIAL);
  const [sculptBrush, setSculptBrush] = useState<SculptBrush>({
    type: 'clay',
    radius: 35,
    strength: 0.4,
    symmetryX: true,
    dynTopo: true
  });
  const [transform, setTransform] = useState({
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number]
  });
  const [retopoOverlay, setRetopoOverlay] = useState(false);

  // Checkpoints & Batch Queue
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(INITIAL_CHECKPOINTS);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>(INITIAL_BATCH_JOBS);

  // NPC Plugin System State
  const [skeleton, setSkeleton] = useState<BoneNode>(INITIAL_SKELETON);
  const [selectedBoneId, setSelectedBoneId] = useState<string>('bone_chest');
  const [behaviorNodes, setBehaviorNodes] = useState<BehaviorTreeNode[]>(INITIAL_BEHAVIOR_NODES);
  const [animations, setAnimations] = useState<AnimationClip[]>(INITIAL_ANIMATIONS);
  const [activeAnimId, setActiveAnimId] = useState<string>('anim_patrol');
  const [currentAnimFrame, setCurrentAnimFrame] = useState<number>(14);
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(true);
  const [isSimulatingNpc, setIsSimulatingNpc] = useState<boolean>(false);
  const [npcStats, setNpcStats] = useState<NpcStats>(INITIAL_NPC_STATS);

  // NPC Event Trigger State for Behavior Tree testing
  const [activeNpcEvent, setActiveNpcEvent] = useState<{
    name: string;
    type: 'spot' | 'damage' | 'command' | 'heal' | 'stun';
    timestamp: number;
  } | null>(null);

  // Plugin Registry & Logs
  const [plugins, setPlugins] = useState<PluginItem[]>(INITIAL_PLUGINS);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>(INITIAL_CONSOLE_LOGS);

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    type: 'info' | 'success' | 'warn' | 'error',
    message: string,
    title?: string
  ) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastItem = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Modals Open State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPluginsOpen, setIsPluginsOpen] = useState(false);

  // Right Panel Drawer Tab (Properties vs Checkpoints vs Batch Queue)
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'checkpoints' | 'batch'>('properties');

  // Animation Frame Loop effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAnim) {
      timer = setInterval(() => {
        setCurrentAnimFrame((prev) => (prev + 1) % 90);
      }, 33); // ~30 fps
    }
    return () => clearInterval(timer);
  }, [isPlayingAnim]);

  // Log Helper
  const addLog = (
    source: 'Meshroom' | 'Blender' | 'NPC Plugin' | 'Capture' | 'System',
    type: 'info' | 'warn' | 'error' | 'success',
    message: string
  ) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog: ConsoleLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: time,
      source,
      type,
      message
    };
    setConsoleLogs((prev) => [...prev, newLog]);
  };

  // Run Pipeline Simulation Handler
  const handleRunPipeline = () => {
    if (isPipelineRunning) return;

    setIsPipelineRunning(true);
    addLog('Meshroom', 'info', 'Starting photogrammetry reconstruction pipeline execution...');
    addToast('info', 'Initializing 3D photogrammetry reconstruction pipeline...', 'Pipeline Started');

    // Reset all nodes: Node 0 is processing at 0%, rest are queued at 0%
    setPipelineNodes((prev) =>
      prev.map((node, i) => ({
        ...node,
        status: i === 0 ? 'processing' : 'queued',
        progress: 0
      }))
    );

    let currentIdx = 0;
    let nodeProgress = 0;

    const interval = setInterval(() => {
      nodeProgress += 25; // 4 steps per node (25%, 50%, 75%, 100%)

      if (nodeProgress < 100) {
        // Increment current processing node progress
        setPipelineNodes((prev) =>
          prev.map((node, i) => {
            if (i === currentIdx) {
              return { ...node, status: 'processing', progress: nodeProgress };
            }
            return node;
          })
        );
      } else {
        // Current node finished
        const completedNode = pipelineNodes[currentIdx];
        const stepNum = currentIdx + 1;
        const totalSteps = pipelineNodes.length;

        // Mark current node done, and next node processing (if any)
        setPipelineNodes((prev) =>
          prev.map((node, i) => {
            if (i === currentIdx) {
              return { ...node, status: 'done', progress: 100 };
            }
            if (i === currentIdx + 1) {
              return { ...node, status: 'processing', progress: 0 };
            }
            return node;
          })
        );

        addLog(
          'Meshroom',
          'info',
          `Executed node [${completedNode.name}] successfully (${completedNode.category}).`
        );

        addToast(
          'success',
          `${completedNode.name} completed successfully (${completedNode.category}).`,
          `Step ${stepNum}/${totalSteps} Complete`
        );

        // Advance to next node
        currentIdx++;
        nodeProgress = 0;

        if (currentIdx >= pipelineNodes.length) {
          clearInterval(interval);
          setIsPipelineRunning(false);
          setPipelineNodes((prev) =>
            prev.map((n) => ({ ...n, status: 'done', progress: 100 }))
          );

          addLog(
            'Meshroom',
            'success',
            '3D Meshroom Photogrammetry pipeline complete! Mesh generated (36,000 Tris).'
          );

          addToast(
            'success',
            'Full 3D photogrammetry reconstruction complete! Mesh and UV textures generated.',
            'Pipeline Execution Finished'
          );
        }
      }
    }, 250);
  };

  // Save Checkpoint Handler
  const handleSaveProject = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const newChk: Checkpoint = {
        id: `chk_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        name: `Manual Checkpoint: ${new Date().toLocaleTimeString()}`,
        stage: activeMode.toUpperCase(),
        vertexCount: Math.round(18500 * meshDecimation),
        faceCount: Math.round(36000 * meshDecimation),
        diffSummary: 'User manual checkpoint saved',
        diffType: 'transform',
        isAutoSave: false
      };
      setCheckpoints((prev) => [newChk, ...prev]);
      addLog('System', 'success', `Project state saved as checkpoint [${newChk.name}]`);
    }, 600);
  };

  // Rollback Handler
  const handleRollback = (checkpoint: Checkpoint) => {
    addLog('System', 'warn', `Rolled back scene to checkpoint: ${checkpoint.name}`);
    alert(`Scene state restored to: ${checkpoint.name}`);
  };

  // Auto-Rig Handler
  const handleAutoRig = () => {
    addLog('NPC Plugin', 'info', 'Computing humanoid skinning vertex weights...');
    setTimeout(() => {
      addLog('NPC Plugin', 'success', 'Auto-Rigging complete! 24 Bone chains bound to mesh weights.');
      alert('Auto-Rigging algorithm complete! Bone chains mapped to 3D mesh.');
    }, 800);
  };

  // NPC Event Trigger Handler (Player Spotted, Take Damage, Receive Command, Reset, etc.)
  const handleTriggerNpcEvent = (
    eventType: 'player_spotted' | 'player_lost' | 'take_damage' | 'receive_command' | 'heal' | 'stun',
    payload?: any
  ) => {
    setIsSimulatingNpc(true);

    if (eventType === 'player_spotted') {
      setActiveNpcEvent({ name: 'Player Spotted in Sight Cone!', type: 'spot', timestamp: Date.now() });
      setNpcStats((prev) => ({ ...prev, aiMode: 'Aggressive' }));
      setActiveAnimId('anim_run');
      setBehaviorNodes((prev) =>
        prev.map((node) => {
          if (node.id === 'btn_cond_player') return { ...node, status: 'success' };
          if (node.id === 'btn_seq_attack') return { ...node, status: 'active' };
          if (node.id === 'btn_act_chase') return { ...node, status: 'active' };
          if (node.id === 'btn_act_attack') return { ...node, status: 'idle' };
          if (node.id === 'btn_seq_patrol') return { ...node, status: 'idle' };
          if (node.id === 'btn_act_patrol') return { ...node, status: 'idle' };
          return node;
        })
      );
      addLog('NPC Plugin', 'warn', '⚡ EVENT TRIGGERED: [Player Spotted] Target acquired at 4.2m! Combat sequence branch activated.');
    } else if (eventType === 'player_lost') {
      setActiveNpcEvent({ name: 'Player Lost / Target Disengaged', type: 'spot', timestamp: Date.now() });
      setNpcStats((prev) => ({ ...prev, aiMode: 'Patrol' }));
      setActiveAnimId('anim_patrol');
      setBehaviorNodes((prev) =>
        prev.map((node) => {
          if (node.id === 'btn_cond_player') return { ...node, status: 'failure' };
          if (node.id === 'btn_seq_attack') return { ...node, status: 'failure' };
          if (node.id === 'btn_act_chase') return { ...node, status: 'idle' };
          if (node.id === 'btn_seq_patrol') return { ...node, status: 'active' };
          if (node.id === 'btn_act_patrol') return { ...node, status: 'active' };
          return node;
        })
      );
      addLog('NPC Plugin', 'info', '⚡ EVENT TRIGGERED: [Player Lost] Line of sight broken. Returning to Patrol route.');
    } else if (eventType === 'take_damage') {
      const dmgAmount = typeof payload === 'number' ? payload : 50;
      const currentHp = npcStats.health;
      const newHp = Math.max(0, currentHp - dmgAmount);

      if (newHp > 0) {
        setActiveNpcEvent({ name: `Took ${dmgAmount} Damage! (Shield Block)`, type: 'damage', timestamp: Date.now() });
        setNpcStats((prev) => ({ ...prev, health: newHp, aiMode: 'Aggressive' }));
        setActiveAnimId('anim_shield');
        setBehaviorNodes((prev) =>
          prev.map((node) => {
            if (node.id === 'btn_cond_player') return { ...node, status: 'success' };
            if (node.id === 'btn_seq_attack') return { ...node, status: 'active' };
            if (node.id === 'btn_act_attack') return { ...node, status: 'active' };
            if (node.id === 'btn_act_chase') return { ...node, status: 'idle' };
            if (node.id === 'btn_seq_patrol') return { ...node, status: 'idle' };
            if (node.id === 'btn_act_patrol') return { ...node, status: 'idle' };
            return node;
          })
        );
        addLog(
          'NPC Plugin',
          'error',
          `💥 EVENT TRIGGERED: [Take Damage] NPC lost ${dmgAmount} HP! (${newHp}/${npcStats.maxHealth} HP remaining). Defensive shield block counter-attack initiated.`
        );
      } else {
        setActiveNpcEvent({ name: `Fatal Damage! NPC Defeated`, type: 'damage', timestamp: Date.now() });
        setNpcStats((prev) => ({ ...prev, health: 0, aiMode: 'Passive' }));
        setActiveAnimId('anim_death');
        setBehaviorNodes((prev) =>
          prev.map((node) => {
            if (node.id === 'btn_root' || node.id === 'btn_sel_1') return { ...node, status: 'failure' };
            return { ...node, status: 'idle' };
          })
        );
        addLog(
          'NPC Plugin',
          'error',
          `☠️ EVENT TRIGGERED: [Fatal Damage] HP dropped to 0! Death animation triggered, behavior tree halted.`
        );
      }
    } else if (eventType === 'receive_command') {
      const command = payload || 'Guard Post';
      setActiveNpcEvent({ name: `Command Received: ${command}`, type: 'command', timestamp: Date.now() });

      if (command === 'Guard Post') {
        setNpcStats((prev) => ({ ...prev, aiMode: 'Guard' }));
        setActiveAnimId('anim_idle');
        setBehaviorNodes((prev) =>
          prev.map((node) => {
            if (node.id === 'btn_seq_patrol') return { ...node, status: 'active' };
            if (node.id === 'btn_act_idle') return { ...node, status: 'active' };
            if (node.id === 'btn_act_patrol') return { ...node, status: 'idle' };
            if (node.id === 'btn_seq_attack') return { ...node, status: 'idle' };
            return node;
          })
        );
        addLog('NPC Plugin', 'info', `📜 COMMAND RECEIVED: [${command}] NPC deployed to fixed guard post.`);
      } else if (command === 'Patrol Route') {
        setNpcStats((prev) => ({ ...prev, aiMode: 'Patrol' }));
        setActiveAnimId('anim_patrol');
        setBehaviorNodes((prev) =>
          prev.map((node) => {
            if (node.id === 'btn_seq_patrol') return { ...node, status: 'active' };
            if (node.id === 'btn_act_patrol') return { ...node, status: 'active' };
            if (node.id === 'btn_seq_attack') return { ...node, status: 'idle' };
            return node;
          })
        );
        addLog('NPC Plugin', 'info', `📜 COMMAND RECEIVED: [${command}] NPC resuming waypoint loop.`);
      } else if (command === 'Charge Attack') {
        setNpcStats((prev) => ({ ...prev, aiMode: 'Aggressive' }));
        setActiveAnimId('anim_attack_1');
        setBehaviorNodes((prev) =>
          prev.map((node) => {
            if (node.id === 'btn_seq_attack') return { ...node, status: 'active' };
            if (node.id === 'btn_act_attack') return { ...node, status: 'active' };
            if (node.id === 'btn_seq_patrol') return { ...node, status: 'idle' };
            return node;
          })
        );
        addLog('NPC Plugin', 'warn', `📜 COMMAND RECEIVED: [${command}] Executing heavy sword slash combo!`);
      } else if (command === 'Retreat / Fallback') {
        setNpcStats((prev) => ({ ...prev, aiMode: 'Passive' }));
        setActiveAnimId('anim_run');
        setBehaviorNodes((prev) =>
          prev.map((node) => {
            if (node.id === 'btn_seq_attack') return { ...node, status: 'failure' };
            if (node.id === 'btn_act_idle') return { ...node, status: 'active' };
            return node;
          })
        );
        addLog('NPC Plugin', 'info', `📜 COMMAND RECEIVED: [${command}] Disengaging from target area.`);
      }
    } else if (eventType === 'heal') {
      setActiveNpcEvent({ name: 'Restored Max Health & Reset Tree', type: 'heal', timestamp: Date.now() });
      setNpcStats((prev) => ({ ...prev, health: prev.maxHealth, aiMode: 'Patrol' }));
      setActiveAnimId('anim_patrol');
      setBehaviorNodes((prev) =>
        prev.map((node) => {
          if (node.id === 'btn_root' || node.id === 'btn_sel_1' || node.id === 'btn_seq_patrol' || node.id === 'btn_act_patrol') {
            return { ...node, status: 'active' };
          }
          return { ...node, status: 'idle' };
        })
      );
      addLog('NPC Plugin', 'success', `💚 EVENT TRIGGERED: [Heal / Reset] Health restored to ${npcStats.maxHealth} HP. Behavior Tree reset to default Patrol.`);
    } else if (eventType === 'stun') {
      setActiveNpcEvent({ name: 'NPC Stunned / Staggered!', type: 'stun', timestamp: Date.now() });
      setActiveAnimId('anim_shield');
      setBehaviorNodes((prev) =>
        prev.map((node) => {
          if (node.id === 'btn_act_idle') return { ...node, status: 'active' };
          if (node.id === 'btn_act_chase') return { ...node, status: 'failure' };
          return node;
        })
      );
      addLog('NPC Plugin', 'warn', `💫 EVENT TRIGGERED: [Stun] NPC staggered for 2.0 seconds.`);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#141417] text-gray-200 flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header Toolbar */}
      <TopToolbar
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        projectName={projectName}
        setProjectName={setProjectName}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenPlugins={() => setIsPluginsOpen(true)}
        onUndo={() => addLog('System', 'info', 'Undo action executed.')}
        onRedo={() => addLog('System', 'info', 'Redo action executed.')}
        canUndo={true}
        canRedo={true}
        onSaveProject={handleSaveProject}
        isSaving={isSaving}
      />

      {/* Main Workspace Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side Panel (Mode-based) */}
        <div className="w-80 h-full shrink-0 flex flex-col">
          {activeMode === 'capture' && (
            <CapturePanel
              photos={photos}
              setPhotos={setPhotos}
              selectedPhotoId={selectedPhotoId}
              setSelectedPhotoId={setSelectedPhotoId}
              onOpenMaskEditor={(photo) => setMaskPhotoModal(photo)}
              showCameraFrustums={showCameraFrustums}
              setShowCameraFrustums={setShowCameraFrustums}
              onSendToPipeline={() => {
                setActiveMode('reconstruct');
                handleRunPipeline();
              }}
              addToast={addToast}
            />
          )}

          {activeMode === 'reconstruct' && (
            <PipelineGraph
              nodes={pipelineNodes}
              setNodes={setPipelineNodes}
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
              pointCloudType={pointCloudType}
              setPointCloudType={setPointCloudType}
              meshDecimation={meshDecimation}
              setMeshDecimation={setMeshDecimation}
              onRunPipeline={handleRunPipeline}
              isPipelineRunning={isPipelineRunning}
              onOpenScaleCalibration={() =>
                setScaleCalibration((prev) => ({
                  ...prev,
                  active: true,
                  step: 'pick_p1'
                }))
              }
            />
          )}

          {activeMode === 'edit' && (
            <PipelineGraph
              nodes={pipelineNodes}
              setNodes={setPipelineNodes}
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
              pointCloudType={pointCloudType}
              setPointCloudType={setPointCloudType}
              meshDecimation={meshDecimation}
              setMeshDecimation={setMeshDecimation}
              onRunPipeline={handleRunPipeline}
              isPipelineRunning={isPipelineRunning}
              onOpenScaleCalibration={() =>
                setScaleCalibration((prev) => ({
                  ...prev,
                  active: true,
                  step: 'pick_p1'
                }))
              }
            />
          )}

          {activeMode === 'npc' && (
            <NpcBuilderPanel
              skeleton={skeleton}
              selectedBoneId={selectedBoneId}
              onSelectBone={setSelectedBoneId}
              behaviorNodes={behaviorNodes}
              setBehaviorNodes={setBehaviorNodes}
              animations={animations}
              activeAnimId={activeAnimId}
              setActiveAnimId={setActiveAnimId}
              currentAnimFrame={currentAnimFrame}
              setCurrentAnimFrame={setCurrentAnimFrame}
              isPlayingAnim={isPlayingAnim}
              setIsPlayingAnim={setIsPlayingAnim}
              npcStats={npcStats}
              setNpcStats={setNpcStats}
              isSimulatingNpc={isSimulatingNpc}
              setIsSimulatingNpc={setIsSimulatingNpc}
              onAutoRig={handleAutoRig}
              onTriggerEvent={handleTriggerNpcEvent}
              activeNpcEvent={activeNpcEvent}
            />
          )}
        </div>

        {/* Center 3D Interactive Viewport */}
        <div className="flex-1 h-full relative">
          <Viewport3D
            renderMode={renderMode}
            setRenderMode={setRenderMode}
            gizmoMode={gizmoMode}
            setGizmoMode={setGizmoMode}
            showCameraFrustums={showCameraFrustums}
            setShowCameraFrustums={setShowCameraFrustums}
            photos={photos}
            pointCloudType={pointCloudType}
            meshDecimation={meshDecimation}
            retopoOverlay={retopoOverlay}
            scaleCalibration={scaleCalibration}
            setScaleCalibration={setScaleCalibration}
            skeleton={skeleton}
            activeMode={activeMode}
            npcStats={npcStats}
            behaviorNodes={behaviorNodes}
            currentAnimFrame={currentAnimFrame}
            isPlayingAnim={isPlayingAnim}
            isSimulatingNpc={isSimulatingNpc}
            selectedBoneId={selectedBoneId}
            onSelectBone={setSelectedBoneId}
            onTriggerEvent={handleTriggerNpcEvent}
            activeNpcEvent={activeNpcEvent}
          />
        </div>

        {/* Right Side Panel (Blender Properties / Checkpoints / Batch Queue) */}
        <div className="w-80 h-full shrink-0 flex flex-col bg-[#1c1c20] border-l border-[#2e2e38]">
          {/* Right Panel Tab Controls */}
          <div className="h-9 bg-[#24242a] border-b border-[#2e2e38] px-2 flex items-center justify-between text-[11px] font-medium">
            <button
              onClick={() => setRightPanelTab('properties')}
              className={`px-2.5 py-1 rounded transition ${
                rightPanelTab === 'properties'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-400 hover:bg-[#2e2e38]'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setRightPanelTab('checkpoints')}
              className={`px-2.5 py-1 rounded transition ${
                rightPanelTab === 'checkpoints'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-400 hover:bg-[#2e2e38]'
              }`}
            >
              Checkpoints ({checkpoints.length})
            </button>
            <button
              onClick={() => setRightPanelTab('batch')}
              className={`px-2.5 py-1 rounded transition ${
                rightPanelTab === 'batch'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-400 hover:bg-[#2e2e38]'
              }`}
            >
              Batch Queue ({batchJobs.length})
            </button>
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'properties' && (
              <BlenderProperties
                modifiers={modifiers}
                setModifiers={setModifiers}
                material={material}
                setMaterial={setMaterial}
                sculptBrush={sculptBrush}
                setSculptBrush={setSculptBrush}
                transform={transform}
                setTransform={setTransform}
                retopoOverlay={retopoOverlay}
                setRetopoOverlay={setRetopoOverlay}
              />
            )}

            {rightPanelTab === 'checkpoints' && (
              <CheckpointsPanel
                checkpoints={checkpoints}
                onRollback={handleRollback}
                onCreateCheckpoint={(name) => {
                  const newChk: Checkpoint = {
                    id: `chk_${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString('en-US', {
                      hour12: false
                    }),
                    name,
                    stage: activeMode.toUpperCase(),
                    vertexCount: Math.round(18500 * meshDecimation),
                    faceCount: Math.round(36000 * meshDecimation),
                    diffSummary: 'User checkpoint created',
                    diffType: 'mesh',
                    isAutoSave: false
                  };
                  setCheckpoints((prev) => [newChk, ...prev]);
                  addLog('System', 'success', `Created checkpoint: ${name}`);
                }}
              />
            )}

            {rightPanelTab === 'batch' && (
              <BatchQueuePanel
                jobs={batchJobs}
                setJobs={setBatchJobs}
                onAddJob={() => {
                  const newJob: BatchJob = {
                    id: `job_${Date.now()}`,
                    projectName: `New_Scan_Dataset_${batchJobs.length + 1}`,
                    imageCount: 30,
                    status: 'queued',
                    progress: 0,
                    gpuUsage: 0,
                    estimatedTime: '03m 45s',
                    priority: batchJobs.length + 1
                  };
                  setBatchJobs((prev) => [...prev, newJob]);
                  addLog('System', 'info', `Queued batch job: ${newJob.projectName}`);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Bottom Console Panel */}
      <ConsolePanel
        logs={consoleLogs}
        onClearLogs={() => setConsoleLogs([])}
      />

      {/* Modals */}
      <MaskEditorModal
        photo={maskPhotoModal}
        onClose={() => setMaskPhotoModal(null)}
        onSaveMask={(photoId, maskUrl) => {
          setPhotos((prev) =>
            prev.map((p) => (p.id === photoId ? { ...p, maskDataUrl: maskUrl } : p))
          );
          addLog('Capture', 'info', `Exclusion mask applied to image [${photoId}]`);
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectName={projectName}
      />

      <PluginManager
        isOpen={isPluginsOpen}
        onClose={() => setIsPluginsOpen(false)}
        plugins={plugins}
        setPlugins={setPlugins}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
