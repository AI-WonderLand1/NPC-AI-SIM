import React, { useMemo, useState } from 'react';
import {
  Box,
  Camera,
  ChevronDown,
  CircleStop,
  Grid3X3,
  Maximize2,
  MousePointer2,
  Move3D,
  Pause,
  Play,
  Redo2,
  RotateCw,
  Save,
  Scaling,
  Settings2,
  Sparkles,
  Terminal,
  Undo2,
} from 'lucide-react';
import { AssetBrowser } from './LeftPanel/AssetBrowser';
import { DetailsPanel } from './LeftPanel/DetailsPanel';
import { BehaviorGraphEditor } from './RightPanel/BehaviorGraphEditor';
import { DebugConsole } from './CenterPanel/DebugConsole';
import type { BehaviorNode, ConsoleLogEntry, GraphConnection, NpcMotionPreset, PBRMaterial, TransformState, TreeItem } from './types';

interface EditorShellProps {
  viewport: React.ReactNode;
  selectedItem: string;
  onSelectItem: (id: string, name: string) => void;
  npcNames: string[];
  objectCount: number;
}

type ActiveTool = 'select' | 'move' | 'rotate' | 'scale';
type PlayState = 'stopped' | 'playing' | 'paused';

const MENU_ITEMS = ['File', 'Edit', 'View', 'Build', 'AI', 'AI Tools', 'Layout', 'Help'];

const MENU_ACTIONS: Record<string, string[]> = {
  File: ['New Scene', 'Open Project', 'Save', 'Save As…', 'Export NPC Package'],
  Edit: ['Undo', 'Redo', 'Duplicate', 'Delete', 'Project Settings'],
  View: ['Frame Selection', 'Focus Viewport', 'Toggle Grid', 'Reset Camera'],
  Build: ['Validate NPC', 'Compile Behaviors', 'Build Runtime Package'],
  AI: ['Run AI Simulation', 'Pause AI', 'Reset NPC Brain', 'Inspect Memory'],
  'AI Tools': ['Generate Behavior', 'Generate Dialogue', 'Analyze Character', 'AI Safety Check'],
  Layout: ['Default Layout', 'Viewport Focus', 'Graph Focus', 'Reset Panels'],
  Help: ['Editor Shortcuts', 'NPC Runtime Docs', 'About NPC-AI-SIM'],
};

const createInitialTree = (npcNames: string[]): TreeItem[] => [
  {
    id: 'characters',
    name: 'Characters',
    type: 'folder',
    isOpen: true,
    children: npcNames.map((name, index) => ({
      id: `character-${index}`,
      name,
      type: 'character',
    })),
  },
  {
    id: 'animations',
    name: 'Animations',
    type: 'folder',
    isOpen: true,
    children: [
      { id: 'anim-idle', name: 'Idle', type: 'animation' },
      { id: 'anim-walk', name: 'Walk', type: 'animation' },
      { id: 'anim-dialogue', name: 'Dialogue_Gesture', type: 'animation' },
    ],
  },
  {
    id: 'behaviors',
    name: 'Behaviors',
    type: 'folder',
    isOpen: true,
    children: [
      { id: 'behavior-perception', name: 'AI_Perception', type: 'behavior' },
      { id: 'behavior-dialogue', name: 'Dialogue_Controller', type: 'behavior' },
      { id: 'behavior-idle', name: 'Idle_State', type: 'behavior' },
    ],
  },
  {
    id: 'environments',
    name: 'Environments',
    type: 'folder',
    isOpen: false,
    children: [
      { id: 'env-stage', name: 'NPC_Test_Stage', type: 'environment' },
      { id: 'env-lighting', name: 'Studio_Lighting', type: 'environment' },
    ],
  },
  {
    id: 'system',
    name: 'System',
    type: 'folder',
    isOpen: false,
    children: [
      { id: 'system-runtime', name: 'NPC_Runtime', type: 'system' },
      { id: 'system-voice', name: 'Voice_System', type: 'system' },
    ],
  },
];

const toggleFolderRecursive = (items: TreeItem[], id: string): TreeItem[] =>
  items.map((item) => {
    if (item.id === id && item.type === 'folder') {
      return { ...item, isOpen: !item.isOpen };
    }

    if (item.children) {
      return { ...item, children: toggleFolderRecursive(item.children, id) };
    }

    return item;
  });

const DEFAULT_TRANSFORM: TransformState = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
};

const DEFAULT_MATERIALS: PBRMaterial[] = [
  {
    id: 'body-material',
    name: 'NPC_Body_PBR',
    shaderType: 'PBR',
    previewClass: 'bg-zinc-600',
    roughness: 0.42,
    metallic: 0.18,
    albedoMap: 'Body_Albedo',
    normalMap: 'Body_Normal',
  },
  {
    id: 'detail-material',
    name: 'NPC_Detail_PBR',
    shaderType: 'PBR',
    previewClass: 'bg-zinc-500',
    roughness: 0.28,
    metallic: 0.62,
    albedoMap: 'Detail_Albedo',
    normalMap: 'Detail_Normal',
  },
];

const DEFAULT_BEHAVIOR_NODES: BehaviorNode[] = [
  {
    id: 'start',
    title: 'ON START',
    subTitle: 'NPC runtime entry',
    headerColor: 'bg-emerald-900/80',
    x: 32,
    y: 52,
    width: 175,
    inputs: [],
    outputs: [{ id: 'exec-out', label: 'Exec', type: 'exec' }],
    isActive: true,
  },
  {
    id: 'perception',
    title: 'AI PERCEPTION',
    subTitle: 'Vision + awareness',
    headerColor: 'bg-sky-900/80',
    x: 265,
    y: 74,
    width: 205,
    inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
    outputs: [
      { id: 'exec-out', label: 'Detected', type: 'exec' },
      { id: 'target-out', label: 'Target', type: 'target', color: '#38bdf8' },
    ],
    isActive: true,
  },
  {
    id: 'dialogue',
    title: 'DIALOGUE',
    subTitle: 'Generate NPC response',
    headerColor: 'bg-purple-900/80',
    x: 535,
    y: 44,
    width: 205,
    inputs: [
      { id: 'exec-in', label: 'Exec', type: 'exec' },
      { id: 'target-in', label: 'Target', type: 'target', color: '#38bdf8' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Complete', type: 'exec' },
      { id: 'text-out', label: 'Response', type: 'string', color: '#a855f7' },
    ],
  },
  {
    id: 'animation',
    title: 'PLAY ANIMATION',
    subTitle: 'Body gesture / motion',
    headerColor: 'bg-amber-900/80',
    x: 535,
    y: 205,
    width: 205,
    inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
    outputs: [{ id: 'exec-out', label: 'Complete', type: 'exec' }],
  },
  {
    id: 'expression',
    title: 'FACIAL EXPRESSION',
    subTitle: 'Emotion output',
    headerColor: 'bg-rose-900/80',
    x: 790,
    y: 86,
    width: 205,
    inputs: [
      { id: 'exec-in', label: 'Exec', type: 'exec' },
      { id: 'emotion-in', label: 'Emotion', type: 'string', color: '#fb7185' },
    ],
    outputs: [{ id: 'exec-out', label: 'Complete', type: 'exec' }],
  },
];

const DEFAULT_GRAPH_CONNECTIONS: GraphConnection[] = [
  {
    id: 'start-perception',
    fromNodeId: 'start',
    fromPinId: 'exec-out',
    toNodeId: 'perception',
    toPinId: 'exec-in',
    color: '#f4f4f5',
    isActiveFlow: true,
  },
  {
    id: 'perception-dialogue',
    fromNodeId: 'perception',
    fromPinId: 'exec-out',
    toNodeId: 'dialogue',
    toPinId: 'exec-in',
    color: '#38bdf8',
    isActiveFlow: true,
  },
  {
    id: 'perception-target',
    fromNodeId: 'perception',
    fromPinId: 'target-out',
    toNodeId: 'dialogue',
    toPinId: 'target-in',
    color: '#38bdf8',
  },
  {
    id: 'dialogue-animation',
    fromNodeId: 'dialogue',
    fromPinId: 'exec-out',
    toNodeId: 'animation',
    toPinId: 'exec-in',
    color: '#a855f7',
    isActiveFlow: true,
  },
  {
    id: 'dialogue-expression',
    fromNodeId: 'dialogue',
    fromPinId: 'exec-out',
    toNodeId: 'expression',
    toPinId: 'exec-in',
    color: '#fb7185',
    isActiveFlow: true,
  },
];

const createLog = (
  level: ConsoleLogEntry['level'],
  message: string,
  nodeSource?: string,
): ConsoleLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  timestamp: new Date().toLocaleTimeString([], { hour12: false }),
  level,
  message,
  nodeSource,
});

export const EditorShell: React.FC<EditorShellProps> = ({
  viewport,
  selectedItem,
  onSelectItem,
  npcNames,
  objectCount,
}) => {
  const initialTree = useMemo(() => createInitialTree(npcNames), [npcNames]);
  const [treeData, setTreeData] = useState<TreeItem[]>(initialTree);
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const [materials, setMaterials] = useState<PBRMaterial[]>(DEFAULT_MATERIALS);
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const [renderMode, setRenderMode] = useState('Lit');
  const [cameraMode, setCameraMode] = useState('Perspective');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState('Editor ready');
  const [behaviorNodes, setBehaviorNodes] = useState<BehaviorNode[]>(DEFAULT_BEHAVIOR_NODES);
  const [graphConnections] = useState<GraphConnection[]>(DEFAULT_GRAPH_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('perception');
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [motionPreset, setMotionPreset] = useState<NpcMotionPreset>('idle');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [behaviorRevisionByNpc, setBehaviorRevisionByNpc] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([
    createLog('SUCCESS', 'NPC editor shell initialized'),
    createLog('WEBRTC', 'Runtime channel ready'),
    createLog('NEURAL', 'Behavior graph loaded', 'AI Graph'),
  ]);

  React.useEffect(() => {
    setTreeData(createInitialTree(npcNames));
  }, [npcNames]);

  React.useEffect(() => {
    setTransform(DEFAULT_TRANSFORM);
  }, [selectedItem]);

  const handleToggleFolder = (id: string) => {
    setTreeData((current) => toggleFolderRecursive(current, id));
  };

  const addLog = (level: ConsoleLogEntry['level'], message: string, nodeSource?: string) => {
    setLogs((current) => [...current.slice(-249), createLog(level, message, nodeSource)]);
  };

  const touchBehaviorRevision = () => {
    const owner = selectedItem || 'scene-default';
    setBehaviorRevisionByNpc((current) => ({
      ...current,
      [owner]: (current[owner] || 0) + 1,
    }));
  };

  const handleGraphNodeMove = (nodeId: string, deltaX: number, deltaY: number) => {
    setBehaviorNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
          : node,
      ),
    );
    touchBehaviorRevision();
  };

  const handleGraphNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) {
      const node = behaviorNodes.find((candidate) => candidate.id === nodeId);
      addLog('DEBUG', `Selected behavior node: ${node?.title || nodeId}`, 'AI Graph');
    }
  };

  const handleAddBehaviorNode = (title: string, category: string) => {
    const id = `${category}-${Date.now()}`;
    const headerColor =
      category === 'dialogue'
        ? 'bg-purple-900/80'
        : category === 'animation'
          ? 'bg-amber-900/80'
          : category === 'expression'
            ? 'bg-rose-900/80'
            : category === 'memory'
              ? 'bg-cyan-900/80'
              : 'bg-sky-900/80';

    const node: BehaviorNode = {
      id,
      title: title.toUpperCase(),
      subTitle: `Custom ${category} node`,
      headerColor,
      x: 130 + (behaviorNodes.length % 3) * 235,
      y: 330 + Math.floor(behaviorNodes.length / 3) * 135,
      width: 205,
      inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
      outputs: [{ id: 'exec-out', label: 'Complete', type: 'exec' }],
    };

    setBehaviorNodes((current) => [...current, node]);
    setSelectedNodeId(id);
    touchBehaviorRevision();
    addLog('NEURAL', `Added ${title} node for ${selectedItem || 'scene-default'}`, 'AI Graph');
  };

  const handleEditorSelection = (id: string, name: string) => {
    onSelectItem(id, name);
    addLog('INFO', `Selected asset: ${name}`, 'Hierarchy');
  };

  const setSimulationState = (state: PlayState) => {
    setPlayState(state);
    if (state === 'playing') {
      setLastAction('Simulation playing');
      addLog('SUCCESS', `Simulation started at ${playbackSpeed}x`, 'Runtime');
      addLog('DECISION', 'Behavior graph execution started', 'AI Graph');
    } else if (state === 'paused') {
      setLastAction('Simulation paused');
      addLog('WARN', 'Simulation paused', 'Runtime');
    } else {
      setLastAction('Simulation stopped');
      addLog('INFO', 'Simulation stopped', 'Runtime');
    }
  };

  const handleTransformChange = (key: keyof TransformState, value: number) => {
    setTransform((current) => ({ ...current, [key]: value }));
    setLastAction(`Changed ${String(key)} to ${value}`);
  };

  const handleMaterialUpdate = (id: string, roughness: number, metallic: number) => {
    setMaterials((current) =>
      current.map((material) =>
        material.id === id ? { ...material, roughness, metallic } : material,
      ),
    );
    setLastAction(`Updated material ${id}`);
  };

  const selectTool = (tool: ActiveTool) => {
    setActiveTool(tool);
    setLastAction(`Tool: ${tool}`);
  };

  const runMenuAction = (menu: string, action: string) => {
    setLastAction(`${menu}: ${action}`);
    setOpenMenu(null);
  };

  const toolButtonClass = (tool: ActiveTool) =>
    `p-1.5 rounded border transition-colors ${
      activeTool === tool
        ? 'bg-sky-950/70 border-sky-700/70 text-sky-300'
        : 'border-transparent hover:bg-zinc-800 text-zinc-300'
    }`;

  return (
    <div
      className="h-screen w-full overflow-hidden bg-[#09090b] text-zinc-200 flex flex-col"
      onClick={() => openMenu && setOpenMenu(null)}
    >
      <header className="h-8 shrink-0 bg-[#111114] border-b border-zinc-800 flex items-center px-2 text-[11px] relative z-50">
        <div className="w-7 h-7 mr-2 rounded-full border border-sky-500/50 bg-sky-950/60 flex items-center justify-center font-bold text-sky-300">
          AI
        </div>

        <div className="flex items-center h-full">
          {MENU_ITEMS.map((item) => (
            <div key={item} className="relative h-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu((current) => (current === item ? null : item));
                }}
                className={`h-full px-2.5 transition-colors ${
                  openMenu === item
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {item}
              </button>

              {openMenu === item && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full min-w-48 py-1 bg-[#18181b] border border-zinc-700 rounded-b shadow-2xl"
                >
                  {MENU_ACTIONS[item].map((action) => (
                    <button
                      key={action}
                      onClick={() => runMenuAction(item, action)}
                      className="w-full text-left px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-sky-950/60 hover:text-sky-200"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-zinc-500 font-mono text-[9px]">
          <span>NPC-AI-SIM</span>
          <span className="text-emerald-400">● LIVE</span>
        </div>
      </header>

      <div className="h-10 shrink-0 bg-[#161619] border-b border-zinc-800 flex items-center px-2 gap-1.5 relative z-40">
        <button
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300"
          title="Save"
          onClick={() => setLastAction('Project saved')}
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400"
          title="Undo"
          onClick={() => setLastAction('Undo')}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400"
          title="Redo"
          onClick={() => setLastAction('Redo')}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        <button className={toolButtonClass('select')} onClick={() => selectTool('select')} title="Select">
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button className={toolButtonClass('move')} onClick={() => selectTool('move')} title="Move">
          <Move3D className="w-4 h-4" />
        </button>
        <button className={toolButtonClass('rotate')} onClick={() => selectTool('rotate')} title="Rotate">
          <RotateCw className="w-4 h-4" />
        </button>
        <button className={toolButtonClass('scale')} onClick={() => selectTool('scale')} title="Scale">
          <Scaling className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300"
          title="Toggle Grid"
          onClick={() => setLastAction('Viewport grid toggled')}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        <button
          className={`p-1.5 rounded transition-colors ${
            playState === 'playing' ? 'bg-emerald-950/70 text-emerald-300' : 'hover:bg-zinc-800 text-emerald-400'
          }`}
          title="Play"
          onClick={() => setSimulationState('playing')}
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          className={`p-1.5 rounded transition-colors ${
            playState === 'paused' ? 'bg-amber-950/70 text-amber-300' : 'hover:bg-zinc-800 text-zinc-400'
          }`}
          title="Pause"
          onClick={() => setSimulationState('paused')}
        >
          <Pause className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-zinc-800 text-rose-400"
          title="Stop"
          onClick={() => setSimulationState('stopped')}
        >
          <CircleStop className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
          <Camera className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={cameraMode}
            onChange={(e) => {
              setCameraMode(e.target.value);
              setLastAction(`Camera: ${e.target.value}`);
            }}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[9px] text-zinc-300 outline-none"
          >
            <option>Perspective</option>
            <option>Front</option>
            <option>Top</option>
            <option>Right</option>
          </select>

          <select
            value={renderMode}
            onChange={(e) => {
              setRenderMode(e.target.value);
              setLastAction(`Render mode: ${e.target.value}`);
            }}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[9px] text-zinc-300 outline-none"
          >
            <option>Lit</option>
            <option>Unlit</option>
            <option>Wireframe</option>
            <option>Detailed Lighting</option>
          </select>

          <button
            className="p-1.5 rounded hover:bg-zinc-800"
            title="Layout settings"
            onClick={() => setLastAction('Layout settings opened')}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 grid"
        style={{
          gridTemplateColumns: '285px minmax(420px, 1fr) minmax(340px, 31vw)',
          gridTemplateRows: consoleOpen ? 'minmax(0, 1fr) 190px' : 'minmax(0, 1fr) 30px',
          gridTemplateAreas: '"left viewport graph" "left console console"',
        }}
      >
        <section
          className="min-h-0 border-r border-zinc-800 bg-[#101014] grid"
          style={{
            gridArea: 'left',
            gridTemplateRows: 'minmax(220px, 56%) minmax(220px, 44%)',
          }}
        >
          <div className="min-h-0 overflow-hidden">
            <AssetBrowser
              treeData={treeData}
              selectedItem={selectedItem}
              onSelectItem={handleEditorSelection}
              onToggleFolder={handleToggleFolder}
            />
          </div>
          <div className="min-h-0 overflow-hidden">
            <DetailsPanel
              selectedAsset={selectedItem}
              transform={transform}
              onTransformChange={handleTransformChange}
              materials={materials}
              onMaterialUpdate={handleMaterialUpdate}
            />
          </div>
        </section>

        <section
          className="relative min-h-0 min-w-0 bg-black border-r border-zinc-800"
          style={{ gridArea: 'viewport' }}
        >
          <div className="absolute inset-x-0 top-0 h-7 z-20 bg-[#111114]/95 border-b border-zinc-800 flex items-center px-2 justify-between text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">VIEWPORT</span>
              <span className="text-sky-300">{selectedItem || 'NPC_CHARACTER'}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <span>{cameraMode}</span>
              <span>{renderMode}</span>
              <span>WebGL</span>
              <span className="text-emerald-400">60 FPS</span>
              <span>{objectCount} objects</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="absolute inset-0 pt-7">{viewport}</div>
        </section>

        <section
          className="min-h-0 min-w-0 overflow-hidden bg-[#0d0d11]"
          style={{ gridArea: 'graph' }}
        >
          <BehaviorGraphEditor
            nodes={behaviorNodes}
            connections={graphConnections}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleGraphNodeSelect}
            onNodeMove={handleGraphNodeMove}
            isPlaying={playState === 'playing'}
            onAddNode={handleAddBehaviorNode}
          />
        </section>

        <section
          className="min-w-0 min-h-0 overflow-hidden bg-[#09090b]"
          style={{ gridArea: 'console' }}
        >
          <DebugConsole
            logs={logs}
            onClearLogs={() => setLogs([])}
            isOpen={consoleOpen}
            onToggleOpen={() => setConsoleOpen((value) => !value)}
            motionPreset={motionPreset}
            onSelectMotionPreset={(preset) => {
              setMotionPreset(preset);
              addLog('INFO', `Motion preset: ${preset}`, 'Animation');
            }}
            playbackSpeed={playbackSpeed}
            onSelectPlaybackSpeed={(speed) => {
              setPlaybackSpeed(speed);
              addLog('INFO', `Playback speed: ${speed}x`, 'Runtime');
            }}
          />
        </section>
      </div>

      <footer className="h-5 shrink-0 bg-[#111114] border-t border-zinc-800 flex items-center px-2 text-[9px] font-mono text-zinc-500">
        <Box className="w-3 h-3 mr-1.5" />
        <span>NPC-AI-SIM Editor</span>
        <span className="mx-2">|</span>
        <span>Tool: {activeTool}</span>
        <span className="mx-2">|</span>
        <span>Renderer: Three.js / WebGL</span>
        <span className="mx-2">|</span>
        <span>Graph Rev: {behaviorRevisionByNpc[selectedItem || 'scene-default'] || 0}</span>
        <span className="ml-auto text-emerald-400">READY</span>
      </footer>
    </div>
  );
};

export default EditorShell;
