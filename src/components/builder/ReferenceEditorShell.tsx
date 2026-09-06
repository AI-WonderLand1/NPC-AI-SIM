import React, { useMemo, useState } from 'react';
import {
  Activity,
  Box,
  Bot,
  Camera,
  ChevronRight,
  CircleStop,
  Download,
  Folder,
  GitBranch,
  Grid3X3,
  Library,
  Maximize2,
  MousePointer2,
  Move3D,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Scaling,
  Search,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react';
import { BehaviorGraphEditor } from './RightPanel/BehaviorGraphEditor';
import { DebugConsole } from './CenterPanel/DebugConsole';
import type {
  BehaviorNode,
  ConsoleLogEntry,
  GraphConnection,
  NpcMotionPreset,
  PBRMaterial,
  TransformState,
} from './types';

interface SidebarAsset {
  id: string;
  name: string;
  thumbnail?: string;
  description?: string;
}

interface ReferenceEditorShellProps {
  viewport: React.ReactNode;
  selectedItem: string;
  onSelectItem: (id: string, name: string) => void;
  npcNames: string[];
  npcAssets?: SidebarAsset[];
  objectCount: number;
  viewportStatus?: string;
}

type ActiveTool = 'select' | 'move' | 'rotate' | 'scale';
type PlayState = 'stopped' | 'playing' | 'paused';
type SidebarMode = 'library' | 'editor' | 'animations' | 'voice' | 'behavior' | 'environments' | 'export';
type ViewportTab = 'Viewport' | 'Animation' | 'Lighting' | 'Cinematics';

type CreatedAsset = {
  id: string;
  name: string;
  kind: string;
};

const PROVIDER_MODELS: Record<string, string[]> = {
  OpenRouter: ['Auto / Best available', 'Claude family', 'GPT family', 'Gemini family', 'Llama family'],
  OpenAI: ['Auto / Recommended', 'GPT family', 'Reasoning family'],
  Anthropic: ['Auto / Recommended', 'Claude Sonnet', 'Claude Haiku'],
  Groq: ['Auto / Recommended', 'Llama family', 'Gemma family'],
  Mistral: ['Auto / Recommended', 'Mistral Large', 'Codestral'],
  DeepSeek: ['Auto / Recommended', 'DeepSeek V3', 'DeepSeek R1'],
  xAI: ['Auto / Recommended', 'Grok family'],
  'Google Gemini': ['Auto / Recommended', 'Gemini Pro', 'Gemini Flash'],
};

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
    name: 'Character Body',
    shaderType: 'PBR',
    previewClass: 'bg-zinc-500',
    roughness: 0.34,
    metallic: 0.12,
    albedoMap: 'Character_Albedo',
    normalMap: 'Character_Normal',
  },
  {
    id: 'detail-material',
    name: 'Outfit Detail',
    shaderType: 'PBR',
    previewClass: 'bg-sky-700',
    roughness: 0.22,
    metallic: 0.26,
    albedoMap: 'Detail_Albedo',
    normalMap: 'Detail_Normal',
  },
];

const DEFAULT_BEHAVIOR_NODES: BehaviorNode[] = [
  {
    id: 'start',
    title: 'On Start',
    subTitle: 'Character runtime entry',
    headerColor: 'bg-emerald-900/80',
    x: 150,
    y: 28,
    width: 150,
    inputs: [],
    outputs: [{ id: 'exec-out', label: 'Exec', type: 'exec' }],
    isActive: true,
  },
  {
    id: 'controller',
    title: 'AI Controller Init',
    subTitle: 'AIW gateway • provider + model',
    headerColor: 'bg-sky-900/80',
    x: 125,
    y: 120,
    width: 205,
    inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
    outputs: [{ id: 'ready', label: 'Ready', type: 'exec' }],
    isActive: true,
  },
  {
    id: 'perception',
    title: 'Perception',
    subTitle: 'Vision • hearing • proximity',
    headerColor: 'bg-violet-900/80',
    x: 132,
    y: 220,
    width: 190,
    inputs: [{ id: 'exec-in', label: 'Ready', type: 'exec' }],
    outputs: [{ id: 'detected', label: 'Detected', type: 'exec' }],
    isActive: true,
  },
  {
    id: 'detected',
    title: 'Player Detected?',
    subTitle: 'Branch on perception result',
    headerColor: 'bg-blue-900/80',
    x: 120,
    y: 322,
    width: 210,
    inputs: [{ id: 'exec-in', label: 'Detected', type: 'exec' }],
    outputs: [
      { id: 'no', label: 'No', type: 'exec' },
      { id: 'yes', label: 'Yes', type: 'exec' },
    ],
  },
  {
    id: 'idle',
    title: 'Idle',
    subTitle: 'Play Idle_Loop',
    headerColor: 'bg-slate-800/90',
    x: 8,
    y: 445,
    width: 168,
    inputs: [{ id: 'exec-in', label: 'No', type: 'exec' }],
    outputs: [{ id: 'complete', label: 'Complete', type: 'exec' }],
  },
  {
    id: 'approach',
    title: 'Approach',
    subTitle: 'Move to player • target 2m',
    headerColor: 'bg-purple-900/80',
    x: 268,
    y: 445,
    width: 174,
    inputs: [{ id: 'exec-in', label: 'Yes', type: 'exec' }],
    outputs: [{ id: 'reached', label: 'Reached', type: 'exec' }],
  },
  {
    id: 'dialogue',
    title: 'Dialogue',
    subTitle: 'Start conversation',
    headerColor: 'bg-fuchsia-900/80',
    x: 130,
    y: 565,
    width: 190,
    inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
    outputs: [{ id: 'complete', label: 'Complete', type: 'exec' }],
  },
  {
    id: 'decision',
    title: 'Decide Action',
    subTitle: 'Talk • follow • trade • other',
    headerColor: 'bg-amber-900/80',
    x: 322,
    y: 565,
    width: 166,
    inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
    outputs: [{ id: 'done', label: 'Done', type: 'exec' }],
  },
];

const DEFAULT_CONNECTIONS: GraphConnection[] = [
  { id: 'start-controller', fromNodeId: 'start', fromPinId: 'exec-out', toNodeId: 'controller', toPinId: 'exec-in', color: '#d4d4d8', isActiveFlow: true },
  { id: 'controller-perception', fromNodeId: 'controller', fromPinId: 'ready', toNodeId: 'perception', toPinId: 'exec-in', color: '#38bdf8', isActiveFlow: true },
  { id: 'perception-detected', fromNodeId: 'perception', fromPinId: 'detected', toNodeId: 'detected', toPinId: 'exec-in', color: '#a855f7', isActiveFlow: true },
  { id: 'detected-idle', fromNodeId: 'detected', fromPinId: 'no', toNodeId: 'idle', toPinId: 'exec-in', color: '#94a3b8', isActiveFlow: true },
  { id: 'detected-approach', fromNodeId: 'detected', fromPinId: 'yes', toNodeId: 'approach', toPinId: 'exec-in', color: '#8b5cf6', isActiveFlow: true },
  { id: 'idle-dialogue', fromNodeId: 'idle', fromPinId: 'complete', toNodeId: 'dialogue', toPinId: 'exec-in', color: '#94a3b8', isActiveFlow: true },
  { id: 'approach-dialogue', fromNodeId: 'approach', fromPinId: 'reached', toNodeId: 'dialogue', toPinId: 'exec-in', color: '#a855f7', isActiveFlow: true },
  { id: 'dialogue-decision', fromNodeId: 'dialogue', fromPinId: 'complete', toNodeId: 'decision', toPinId: 'exec-in', color: '#eab308', isActiveFlow: true },
];

const createLog = (level: ConsoleLogEntry['level'], message: string): ConsoleLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  timestamp: new Date().toLocaleTimeString([], { hour12: false }),
  level,
  message,
});

const fieldClass = 'h-8 w-full rounded-md border border-[#263248] bg-[#0a111c] px-2.5 text-[10px] text-zinc-200 outline-none focus:border-blue-500';

const SIDEBAR_ITEMS: Array<{ id: SidebarMode; label: string; icon: React.ReactNode }> = [
  { id: 'library', label: 'Library', icon: <Library className="h-4 w-4" /> },
  { id: 'editor', label: 'Editor', icon: <Pencil className="h-4 w-4" /> },
  { id: 'animations', label: 'Animations', icon: <Activity className="h-4 w-4" /> },
  { id: 'voice', label: 'Voice & Dialogue', icon: <Volume2 className="h-4 w-4" /> },
  { id: 'behavior', label: 'Behavior Graph', icon: <GitBranch className="h-4 w-4" /> },
  { id: 'environments', label: 'Environments', icon: <Box className="h-4 w-4" /> },
  { id: 'export', label: 'Test & Export', icon: <Download className="h-4 w-4" /> },
];

export const ReferenceEditorShell: React.FC<ReferenceEditorShellProps> = ({
  viewport,
  selectedItem,
  onSelectItem,
  npcNames,
  npcAssets = [],
  objectCount,
  viewportStatus = '3D scene ready',
}) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('library');
  const [viewportTab, setViewportTab] = useState<ViewportTab>('Viewport');
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const [materials, setMaterials] = useState<PBRMaterial[]>(DEFAULT_MATERIALS);
  const [behaviorNodes, setBehaviorNodes] = useState<BehaviorNode[]>(DEFAULT_BEHAVIOR_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('controller');
  const [motionPreset, setMotionPreset] = useState<NpcMotionPreset>('idle');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [lastAction, setLastAction] = useState('Ready');
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([
    createLog('SUCCESS', `Project loaded: ${selectedItem || 'NPC Project'}`),
    createLog('NEURAL', 'AI provider registry initialized'),
    createLog('SUCCESS', 'Behavior graph initialized'),
    createLog('INFO', '3D scene ready'),
  ]);
  const [aiCommand, setAiCommand] = useState('');
  const [provider, setProvider] = useState('OpenRouter');
  const [model, setModel] = useState(PROVIDER_MODELS.OpenRouter[0]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetMenu, setAssetMenu] = useState<{ x: number; y: number } | null>(null);
  const [creatingKind, setCreatingKind] = useState<string | null>(null);
  const [pendingAssetName, setPendingAssetName] = useState('');
  const [createdAssets, setCreatedAssets] = useState<CreatedAsset[]>([]);

  const currentModels = PROVIDER_MODELS[provider] || ['Auto / Recommended'];

  const visibleAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    const base: SidebarAsset[] = npcAssets.length > 0
      ? npcAssets
      : npcNames.map((name, index): SidebarAsset => ({ id: `character-${index}`, name }));
    return query ? base.filter((asset) => asset.name.toLowerCase().includes(query)) : base;
  }, [assetSearch, npcAssets, npcNames]);

  const setSimulationState = (state: PlayState) => {
    setPlayState(state);
    setLastAction(`Simulation ${state}`);
    setLogs((current) => [...current.slice(-120), createLog(state === 'playing' ? 'SUCCESS' : 'INFO', `Simulation ${state}`)]);
  };

  const handleGraphMove = (nodeId: string, dx: number, dy: number) => {
    setBehaviorNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, x: node.x + dx, y: node.y + dy } : node)));
  };

  const handleGraphAdd = (title: string, category: string) => {
    const id = `${category}-${Date.now()}`;
    setBehaviorNodes((current) => [
      ...current,
      {
        id,
        title,
        subTitle: `Custom ${category}`,
        headerColor: 'bg-sky-900/80',
        x: 120 + (current.length % 2) * 200,
        y: 690 + Math.floor(current.length / 2) * 100,
        width: 180,
        inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
        outputs: [{ id: 'exec-out', label: 'Complete', type: 'exec' }],
      },
    ]);
    setSelectedNodeId(id);
    setLogs((current) => [...current.slice(-120), createLog('SUCCESS', `Created behavior node: ${title}`)]);
  };

  const runAiCommand = () => {
    const command = aiCommand.trim();
    if (!command) return;
    setLastAction(`AI: ${command}`);
    setLogs((current) => [
      ...current.slice(-120),
      createLog('NEURAL', `AI command queued via ${provider} / ${model}: ${command}`),
    ]);
    setAiCommand('');
  };

  const handleProviderChange = (nextProvider: string) => {
    setProvider(nextProvider);
    setModel((PROVIDER_MODELS[nextProvider] || ['Auto / Recommended'])[0]);
    setLogs((current) => [...current.slice(-120), createLog('INFO', `AI provider selected: ${nextProvider}`)]);
  };

  const startAssetCreation = (kind: string) => {
    setCreatingKind(kind);
    setPendingAssetName(kind === 'AI Character Blueprint' ? 'AI_NewCharacter' : `New ${kind}`);
    setSidebarMode('library');
    setAssetMenu(null);
  };

  const commitAssetCreation = () => {
    const name = pendingAssetName.trim();
    if (!creatingKind || !name) return;
    const id = `asset-${Date.now()}`;
    setCreatedAssets((current) => [...current, { id, name, kind: creatingKind }]);
    onSelectItem(id, name);
    setLogs((current) => [...current.slice(-120), createLog('SUCCESS', `Created ${creatingKind}: ${name}`)]);
    setCreatingKind(null);
    setPendingAssetName('');
  };

  const updateTransform = (key: keyof TransformState, value: number) => {
    setTransform((current) => ({ ...current, [key]: value }));
  };

  const updateMaterial = (id: string, key: 'roughness' | 'metallic', value: number) => {
    setMaterials((current) => current.map((material) => (material.id === id ? { ...material, [key]: value } : material)));
  };

  const navToSidebar = (mode: SidebarMode) => {
    setSidebarMode(mode);
    setLastAction(`${SIDEBAR_ITEMS.find((item) => item.id === mode)?.label || mode} panel`);
  };

  return (
    <div
      className="h-screen w-full min-w-[1120px] overflow-hidden bg-[#050912] text-zinc-100 font-sans"
      onClick={() => assetMenu && setAssetMenu(null)}
    >
      <div className="flex h-full flex-col">
        <header className="h-14 shrink-0 border-b border-[#1d2a3e] bg-[#07101c] shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
          <div className="flex h-full items-center gap-5 px-4">
            <a href="https://dreammakerhub.website/" className="flex items-center gap-3 text-white no-underline">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/40 bg-gradient-to-br from-blue-500/30 via-violet-500/25 to-fuchsia-500/25 shadow-[0_0_24px_rgba(59,130,246,0.22)]">
                <span className="text-sm font-black tracking-tight text-blue-100">AI</span>
              </div>
              <div className="leading-tight">
                <div className="text-[15px] font-bold tracking-[0.04em]">AI WONDERLAND</div>
                <div className="text-[7px] uppercase tracking-[0.28em] text-zinc-600">Build more real worlds</div>
              </div>
            </a>

            <div className="h-7 w-px bg-[#203047]" />

            <nav className="flex h-full items-center gap-1 text-[11px]">
              <a href="/builder" className="relative flex h-full items-center px-3 font-semibold text-sky-300 no-underline">
                NPC-AI-SIM
                <span className="absolute inset-x-2 bottom-0 h-0.5 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
              </a>
              <a href="/library" className="px-3 text-zinc-500 no-underline hover:text-zinc-200">Library</a>
              <a href="https://playground.dreammakerhub.website/" className="px-3 text-zinc-500 no-underline hover:text-zinc-200">AI Playground</a>
            </nav>

            <div className="ml-auto flex h-9 w-[360px] items-center rounded-lg border border-[#26364d] bg-[#0a1421] px-2.5 shadow-inner">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              <input
                value={aiCommand}
                onChange={(event) => setAiCommand(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && runAiCommand()}
                placeholder="Ask AI to create or change anything..."
                className="h-full min-w-0 flex-1 bg-transparent px-2 text-[10px] text-zinc-200 outline-none placeholder:text-zinc-600"
              />
              <span className="rounded border border-[#2a3a52] bg-[#0c1725] px-1.5 py-0.5 text-[7px] text-zinc-600">AI</span>
            </div>

            <div className="rounded-full border border-emerald-900/70 bg-emerald-950/30 px-2.5 py-1 text-[8px] font-semibold text-emerald-300">
              AIW GATEWAY READY
            </div>
          </div>
        </header>

        <div className="flex h-[58px] shrink-0 items-center gap-3 border-b border-[#1d2a3e] bg-[#09121f] px-3">
          <div className="flex h-9 min-w-[240px] items-center gap-2 rounded-lg border border-[#26364d] bg-[#0c1725] px-3">
            <Folder className="h-4 w-4 text-sky-400" />
            <span className="text-[9px] text-zinc-600">Project:</span>
            <span className="max-w-[150px] truncate text-[10px] font-semibold text-white">{selectedItem || 'NPC Project'}</span>
          </div>

          <label className="flex h-9 items-center gap-2 rounded-lg border border-[#26364d] bg-[#0c1725] px-2.5">
            <span className="text-[9px] text-zinc-600">Provider</span>
            <select value={provider} onChange={(event) => handleProviderChange(event.target.value)} className="w-[128px] bg-transparent text-[10px] text-zinc-200 outline-none">
              {Object.keys(PROVIDER_MODELS).map((name) => <option key={name} className="bg-[#0c1725]">{name}</option>)}
            </select>
          </label>

          <label className="flex h-9 items-center gap-2 rounded-lg border border-[#26364d] bg-[#0c1725] px-2.5">
            <span className="text-[9px] text-zinc-600">Model</span>
            <select value={model} onChange={(event) => setModel(event.target.value)} className="w-[190px] bg-transparent text-[10px] text-zinc-200 outline-none">
              {currentModels.map((name) => <option key={name} className="bg-[#0c1725]">{name}</option>)}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSimulationState(playState === 'playing' ? 'stopped' : 'playing')}
              className={`flex h-9 items-center gap-2 rounded-lg border px-4 text-[10px] font-semibold transition ${
                playState === 'playing'
                  ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300'
                  : 'border-blue-500/50 bg-blue-950/35 text-blue-200 hover:bg-blue-900/40'
              }`}
            >
              {playState === 'playing' ? <CircleStop className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playState === 'playing' ? 'Stop Test' : 'Play Test'}
            </button>
            <select className="h-9 rounded-lg border border-[#26364d] bg-[#0c1725] px-3 text-[10px] text-zinc-300 outline-none">
              <option>Game</option>
              <option>Film / VFX</option>
              <option>Both</option>
            </select>
            <button
              onClick={() => {
                navToSidebar('export');
                setLogs((current) => [...current.slice(-120), createLog('INFO', 'Export tools opened')]);
              }}
              className="flex h-9 items-center gap-2 rounded-lg border border-violet-400/40 bg-gradient-to-r from-violet-600 to-purple-600 px-4 text-[10px] font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:brightness-110"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        <main
          className="min-h-0 flex-1 grid"
          style={{
            gridTemplateColumns: '232px minmax(0, 1fr) 500px',
            gridTemplateRows: consoleOpen ? 'minmax(0, 1fr) 205px' : 'minmax(0, 1fr) 31px',
            gridTemplateAreas: '"sidebar viewport graph" "sidebar console console"',
          }}
        >
          <aside
            style={{ gridArea: 'sidebar' }}
            className="min-h-0 border-r border-[#1d2a3e] bg-[#07101b] flex flex-col"
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setAssetMenu({ x: event.clientX, y: event.clientY });
            }}
          >
            <div className="border-b border-[#1d2a3e] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                  <Bot className="h-4.5 w-4.5 text-violet-300" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white">NPC-AI-SIM</div>
                  <div className="mt-0.5 text-[8px] text-zinc-600">Bring NPCs to life with AI</div>
                </div>
              </div>
            </div>

            <div className="px-2 py-2">
              <button
                onClick={() => startAssetCreation('AI Character Blueprint')}
                className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[10px] text-zinc-400 transition hover:bg-blue-950/35 hover:text-white"
              >
                <Plus className="h-4 w-4" /> Create New
              </button>
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navToSidebar(item.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[10px] transition ${
                    sidebarMode === item.id
                      ? 'border-blue-500/40 bg-gradient-to-r from-blue-600/35 to-violet-600/20 text-blue-100 shadow-[inset_3px_0_0_#3b82f6]'
                      : 'border-transparent text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mx-3 h-px bg-[#1d2a3e]" />

            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-3 py-3">
              {sidebarMode === 'library' && (
                <div>
                  <div className="mb-2 flex items-center">
                    <span className="text-[10px] font-semibold text-zinc-300">My NPCs</span>
                    <button onClick={() => startAssetCreation('AI Character Blueprint')} className="ml-auto rounded p-1 text-zinc-600 hover:bg-white/5 hover:text-sky-300"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="mb-2 flex h-8 items-center gap-2 rounded-md border border-[#223047] bg-[#0a1420] px-2">
                    <Search className="h-3.5 w-3.5 text-zinc-600" />
                    <input value={assetSearch} onChange={(event) => setAssetSearch(event.target.value)} placeholder="Search NPCs..." className="min-w-0 flex-1 bg-transparent text-[9px] text-zinc-300 outline-none placeholder:text-zinc-700" />
                  </div>

                  {creatingKind && (
                    <div className="mb-2 rounded-lg border border-sky-700/50 bg-sky-950/20 p-2">
                      <div className="mb-1 text-[8px] uppercase tracking-wider text-sky-400">New {creatingKind}</div>
                      <input
                        autoFocus
                        value={pendingAssetName}
                        onChange={(event) => setPendingAssetName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commitAssetCreation();
                          if (event.key === 'Escape') setCreatingKind(null);
                        }}
                        onBlur={() => pendingAssetName.trim() && commitAssetCreation()}
                        className={fieldClass}
                      />
                      <div className="mt-1 text-[7px] text-zinc-600">Enter to create • Esc to cancel</div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {visibleAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => onSelectItem(asset.id, asset.name)}
                        className={`flex w-full items-center gap-2.5 rounded-lg border p-1.5 text-left transition ${
                          selectedItem === asset.name
                            ? 'border-blue-500/70 bg-blue-950/45 shadow-[0_0_16px_rgba(59,130,246,0.08)]'
                            : 'border-transparent hover:border-[#26364d] hover:bg-white/[0.025]'
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#27364c] bg-gradient-to-br from-sky-950 to-violet-950">
                          {asset.thumbnail ? <img src={asset.thumbnail} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-sky-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`truncate text-[10px] font-semibold ${selectedItem === asset.name ? 'text-white' : 'text-zinc-300'}`}>{asset.name}</div>
                          <div className="mt-0.5 truncate text-[8px] text-zinc-600">{asset.description || 'AI Character'}</div>
                        </div>
                      </button>
                    ))}
                    {createdAssets.filter((asset) => asset.kind.includes('Character')).map((asset) => (
                      <button key={asset.id} onClick={() => onSelectItem(asset.id, asset.name)} className="flex w-full items-center gap-2 rounded-lg border border-transparent p-2 text-left hover:border-[#26364d] hover:bg-white/[0.025]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-sky-800/60 bg-sky-950/30"><Sparkles className="h-4 w-4 text-sky-300" /></div>
                        <div className="min-w-0"><div className="truncate text-[10px] text-zinc-300">{asset.name}</div><div className="text-[8px] text-zinc-700">{asset.kind}</div></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sidebarMode === 'editor' && (
                <div className="space-y-3 text-[9px]">
                  <div>
                    <div className="mb-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Character Details</div>
                    <label className="mb-2 block"><span className="mb-1 block text-zinc-500">Name</span><input className={fieldClass} value={selectedItem || 'Character'} readOnly /></label>
                    <label className="block"><span className="mb-1 block text-zinc-500">Rig</span><select className={fieldClass}><option>Humanoid / Auto</option><option>Creature</option><option>Custom</option></select></label>
                  </div>
                  <div className="rounded-lg border border-[#223047] bg-[#0a1420] p-2.5">
                    <div className="mb-2 flex items-center gap-2 text-[8px] uppercase tracking-wider text-zinc-600"><Move3D className="h-3 w-3" /> Transform</div>
                    {([
                      ['Pos X', 'posX'], ['Pos Y', 'posY'], ['Pos Z', 'posZ'],
                      ['Rot X', 'rotX'], ['Rot Y', 'rotY'], ['Rot Z', 'rotZ'],
                    ] as Array<[string, keyof TransformState]>).map(([label, key]) => (
                      <label key={key} className="mb-1 grid grid-cols-[50px_1fr] items-center gap-2"><span className="text-zinc-600">{label}</span><input className={fieldClass} type="number" step="0.01" value={transform[key]} onChange={(event) => updateTransform(key, Number(event.target.value))} /></label>
                    ))}
                  </div>
                  <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/15 p-2.5">
                    <div className="flex items-center gap-2 text-emerald-300"><Bot className="h-3.5 w-3.5" /><span className="text-[9px] font-semibold">AIW Universal Gateway</span></div>
                    <p className="mt-1 text-[8px] leading-4 text-zinc-600">Provider keys live in account Secrets. This project only keeps provider and model references.</p>
                  </div>
                  <label className="block"><span className="mb-1 block text-zinc-500">Provider</span><select value={provider} onChange={(event) => handleProviderChange(event.target.value)} className={fieldClass}>{Object.keys(PROVIDER_MODELS).map((name) => <option key={name}>{name}</option>)}</select></label>
                  <label className="block"><span className="mb-1 block text-zinc-500">Model</span><select value={model} onChange={(event) => setModel(event.target.value)} className={fieldClass}>{currentModels.map((name) => <option key={name}>{name}</option>)}</select></label>
                  <div>
                    <div className="mb-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-zinc-600">PBR Materials</div>
                    {materials.map((material) => (
                      <div key={material.id} className="mb-2 rounded-lg border border-[#223047] bg-[#0a1420] p-2.5">
                        <div className="mb-2 flex items-center gap-2"><div className={`h-3 w-3 rounded-full ${material.previewClass}`} /><span className="text-zinc-300">{material.name}</span></div>
                        <label className="mb-1 grid grid-cols-[60px_1fr] items-center gap-2"><span className="text-zinc-600">Metallic</span><input className={fieldClass} type="number" min="0" max="1" step="0.01" value={material.metallic} onChange={(event) => updateMaterial(material.id, 'metallic', Number(event.target.value))} /></label>
                        <label className="grid grid-cols-[60px_1fr] items-center gap-2"><span className="text-zinc-600">Roughness</span><input className={fieldClass} type="number" min="0" max="1" step="0.01" value={material.roughness} onChange={(event) => updateMaterial(material.id, 'roughness', Number(event.target.value))} /></label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sidebarMode === 'animations' && (
                <div className="space-y-2 text-[9px]">
                  <div className="mb-2 text-[8px] uppercase tracking-[0.18em] text-zinc-600">Animation Presets</div>
                  {(['idle', 'walk-in-place', 'combat', 'dialogue'] as NpcMotionPreset[]).map((preset) => (
                    <button key={preset} onClick={() => setMotionPreset(preset)} className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left ${motionPreset === preset ? 'border-blue-500/50 bg-blue-950/35 text-blue-200' : 'border-[#223047] bg-[#0a1420] text-zinc-500 hover:text-zinc-200'}`}><Activity className="h-3.5 w-3.5" />{preset}</button>
                  ))}
                  <label className="block pt-2"><span className="mb-1 block text-zinc-600">Playback speed</span><select value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))} className={fieldClass}><option value={0.5}>0.5x</option><option value={1}>1x</option><option value={1.5}>1.5x</option><option value={2}>2x</option></select></label>
                </div>
              )}

              {sidebarMode === 'voice' && (
                <div className="space-y-3 text-[9px]">
                  <div className="mb-2 text-[8px] uppercase tracking-[0.18em] text-zinc-600">Voice & Dialogue</div>
                  <label className="block"><span className="mb-1 block text-zinc-600">Voice Provider</span><select className={fieldClass}><option>Browser / Local</option><option>Connected Provider</option></select></label>
                  <label className="block"><span className="mb-1 block text-zinc-600">Voice</span><select className={fieldClass}><option>Natural</option><option>Calm</option><option>Commanding</option></select></label>
                  <label className="block"><span className="mb-1 block text-zinc-600">Dialogue Style</span><select className={fieldClass}><option>Conversational</option><option>Quest NPC</option><option>Companion</option><option>Enemy</option></select></label>
                  <div className="rounded-lg border border-[#223047] bg-[#0a1420] p-3 text-[8px] leading-4 text-zinc-600">AI-generated dialogue uses the provider/model selected for this character. Raw provider keys are not stored in the NPC project.</div>
                </div>
              )}

              {sidebarMode === 'behavior' && (
                <div className="space-y-3 text-[9px]">
                  <div className="rounded-lg border border-violet-800/50 bg-violet-950/20 p-3">
                    <div className="flex items-center gap-2 text-violet-300"><GitBranch className="h-4 w-4" /><span className="font-semibold">Behavior Graph</span></div>
                    <p className="mt-2 text-[8px] leading-4 text-zinc-600">The live graph stays visible on the right. Right-click or use Add Node to extend it.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-[#223047] bg-[#0a1420] p-2 text-center"><div className="text-base font-bold text-white">{behaviorNodes.length}</div><div className="text-[7px] uppercase text-zinc-600">Nodes</div></div>
                    <div className="rounded-lg border border-[#223047] bg-[#0a1420] p-2 text-center"><div className="text-base font-bold text-white">{DEFAULT_CONNECTIONS.length}</div><div className="text-[7px] uppercase text-zinc-600">Links</div></div>
                  </div>
                </div>
              )}

              {sidebarMode === 'environments' && (
                <div className="space-y-3 text-[9px]">
                  <div className="mb-2 text-[8px] uppercase tracking-[0.18em] text-zinc-600">Environment</div>
                  <label className="block"><span className="mb-1 block text-zinc-600">Scene</span><select className={fieldClass}><option>Sci-Fi Hangar</option><option>Neutral Studio</option><option>Dark Stage</option></select></label>
                  <label className="block"><span className="mb-1 block text-zinc-600">Lighting</span><select className={fieldClass}><option>Cinematic</option><option>Neutral PBR</option><option>High Contrast</option></select></label>
                  <div className="rounded-lg border border-[#223047] bg-[#0a1420] p-3 text-[8px] leading-4 text-zinc-600">The viewport currently uses realtime PBR lighting, shadows, ACES tone mapping, and a sci-fi environment.</div>
                </div>
              )}

              {sidebarMode === 'export' && (
                <div className="space-y-2 text-[9px]">
                  <div className="mb-2 text-[8px] uppercase tracking-[0.18em] text-zinc-600">Test & Export</div>
                  <button onClick={() => setSimulationState('playing')} className="flex w-full items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-950/30 px-3 py-2 text-blue-200"><Play className="h-3.5 w-3.5" />Play Test</button>
                  {['GLB / GLTF', 'FBX', 'USD', 'Behavior JSON'].map((format) => <button key={format} onClick={() => setLogs((current) => [...current.slice(-120), createLog('INFO', `Export requested: ${format}`)])} className="flex w-full items-center gap-2 rounded-lg border border-[#223047] bg-[#0a1420] px-3 py-2 text-left text-zinc-400 hover:border-violet-700/60 hover:text-white"><Download className="h-3.5 w-3.5" />{format}</button>)}
                </div>
              )}
            </div>

            <div className="border-t border-[#1d2a3e] p-3">
              <button onClick={() => startAssetCreation('AI Character Blueprint')} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-500/60 bg-blue-950/25 text-[10px] font-semibold text-blue-200 hover:bg-blue-900/35"><Plus className="h-4 w-4" /> New NPC</button>
            </div>
          </aside>

          <section style={{ gridArea: 'viewport' }} className="relative min-h-0 min-w-0 overflow-hidden border-r border-[#1d2a3e] bg-black">
            <div className="absolute inset-x-0 top-0 z-30 flex h-10 items-center border-b border-[#1d2a3e] bg-[#081321]/95 px-2">
              {(['Viewport', 'Animation', 'Lighting', 'Cinematics'] as ViewportTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setViewportTab(tab);
                    setLastAction(`${tab} workspace`);
                  }}
                  className={`relative h-full px-4 text-[9px] font-medium ${viewportTab === tab ? 'text-blue-200' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                  {tab}
                  {viewportTab === tab && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-blue-500" />}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1 text-zinc-600">
                <button className="rounded p-1.5 hover:bg-white/5 hover:text-white"><Camera className="h-3.5 w-3.5" /></button>
                <button className="rounded p-1.5 hover:bg-white/5 hover:text-white"><Grid3X3 className="h-3.5 w-3.5" /></button>
                <button className="rounded p-1.5 hover:bg-white/5 hover:text-white"><Maximize2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="absolute inset-0 pt-10">{viewport}</div>

            <div className="absolute left-3 top-14 z-40 flex flex-col overflow-hidden rounded-lg border border-[#26364d] bg-[#07111d]/90 shadow-xl backdrop-blur">
              {([
                ['select', <MousePointer2 className="h-3.5 w-3.5" />],
                ['move', <Move3D className="h-3.5 w-3.5" />],
                ['rotate', <RotateCw className="h-3.5 w-3.5" />],
                ['scale', <Scaling className="h-3.5 w-3.5" />],
              ] as const).map(([tool, icon]) => (
                <button key={tool} onClick={() => setActiveTool(tool)} className={`flex h-9 w-9 items-center justify-center border-b border-[#1d2a3e] last:border-b-0 ${activeTool === tool ? 'bg-blue-600/35 text-blue-200' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>{icon}</button>
              ))}
            </div>

            <div className="absolute right-3 top-14 z-30 rounded-md border border-[#26364d] bg-[#07111d]/75 px-2 py-1 font-mono text-[8px] text-zinc-500 backdrop-blur">
              {objectCount} object{objectCount === 1 ? '' : 's'} • {playState}
            </div>

            <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-[#26364d] bg-[#07111d]/88 p-1 text-[8px] text-zinc-300 backdrop-blur">
                <button className="rounded px-2 py-1.5 hover:bg-white/5">Perspective</button>
                <button className="rounded px-2 py-1.5 hover:bg-white/5">Lit</button>
              </div>
              <div className="ml-auto hidden max-w-[48%] truncate rounded-lg border border-[#26364d] bg-[#07111d]/80 px-3 py-2 text-[8px] text-zinc-500 backdrop-blur xl:block">{viewportStatus}</div>
              <div className="flex items-center gap-1 rounded-lg border border-[#26364d] bg-[#07111d]/88 p-1 text-[8px] text-zinc-400 backdrop-blur">
                <button className="rounded px-2 py-1.5 hover:bg-white/5">Character</button>
                <button className="rounded px-2 py-1.5 hover:bg-white/5">Environment</button>
                <button className="rounded px-2 py-1.5 hover:bg-white/5">Camera</button>
              </div>
            </div>
          </section>

          <section style={{ gridArea: 'graph' }} className="min-h-0 min-w-0 border-b border-[#1d2a3e] bg-[#07101a]">
            <BehaviorGraphEditor
              nodes={behaviorNodes}
              connections={DEFAULT_CONNECTIONS}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onNodeMove={handleGraphMove}
              isPlaying={playState === 'playing'}
              onAddNode={handleGraphAdd}
            />
          </section>

          <section style={{ gridArea: 'console' }} className="min-h-0 min-w-0 border-t border-[#1d2a3e] bg-[#050a11]">
            <DebugConsole
              logs={logs}
              onClearLogs={() => setLogs([])}
              isOpen={consoleOpen}
              onToggleOpen={() => setConsoleOpen((value) => !value)}
              motionPreset={motionPreset}
              onSelectMotionPreset={setMotionPreset}
              playbackSpeed={playbackSpeed}
              onSelectPlaybackSpeed={setPlaybackSpeed}
              aiCommand={aiCommand}
              onAiCommandChange={setAiCommand}
              onRunAiCommand={runAiCommand}
              provider={provider}
              model={model}
            />
          </section>
        </main>

        <footer className="flex h-5 shrink-0 items-center gap-3 border-t border-[#172338] bg-[#060d17] px-3 font-mono text-[7px] text-zinc-700">
          <span className="text-emerald-500">● READY</span>
          <span>{lastAction}</span>
          <span className="ml-auto">Right-click the left workspace to create assets</span>
        </footer>
      </div>

      {assetMenu && (
        <div
          className="fixed z-[90] w-56 overflow-hidden rounded-lg border border-[#30415a] bg-[#0b1522] py-1 shadow-[0_24px_70px_rgba(0,0,0,0.8)]"
          style={{ left: assetMenu.x, top: assetMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-[#1d2a3e] px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Create New</div>
          {[
            'AI Character Blueprint',
            'Behavior',
            'Animation',
            'Dialogue',
            'Voice Profile',
            'Material',
            'Environment',
            'Generate Asset with AI',
          ].map((kind) => (
            <button key={kind} onClick={() => startAssetCreation(kind)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[9px] text-zinc-400 hover:bg-blue-950/40 hover:text-white">
              {kind.includes('AI') || kind.includes('Generate') ? <Sparkles className="h-3.5 w-3.5 text-blue-400" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-700" />}
              {kind}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferenceEditorShell;
