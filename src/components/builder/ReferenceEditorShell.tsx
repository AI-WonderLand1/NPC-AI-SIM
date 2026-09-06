import React, { useMemo, useState } from 'react';
import {
  Activity,
  Box,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleStop,
  Folder,
  Grid3X3,
  Maximize2,
  MousePointer2,
  Move3D,
  Palette,
  Pause,
  Play,
  RotateCw,
  Scaling,
  Search,
  Sparkles,
  Terminal,
  User,
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

interface ReferenceEditorShellProps {
  viewport: React.ReactNode;
  selectedItem: string;
  onSelectItem: (id: string, name: string) => void;
  npcNames: string[];
  objectCount: number;
}

type ActiveTool = 'select' | 'move' | 'rotate' | 'scale';
type PropertyTab = 'Character' | 'AI Brain' | 'Materials';
type PlayState = 'stopped' | 'playing' | 'paused';

type CreatedAsset = {
  id: string;
  name: string;
  kind: string;
};

const MENU_ITEMS = ['File', 'Edit', 'View', 'Window', 'Help'];

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
    roughness: 0.36,
    metallic: 0.08,
    albedoMap: 'Character_Albedo',
    normalMap: 'Character_Normal',
  },
  {
    id: 'detail-material',
    name: 'Outfit Detail',
    shaderType: 'PBR',
    previewClass: 'bg-sky-700',
    roughness: 0.24,
    metallic: 0.18,
    albedoMap: 'Detail_Albedo',
    normalMap: 'Detail_Normal',
  },
];

const DEFAULT_BEHAVIOR_NODES: BehaviorNode[] = [
  {
    id: 'start',
    title: 'ON START',
    subTitle: 'Character runtime entry',
    headerColor: 'bg-emerald-900/80',
    x: 20,
    y: 55,
    width: 145,
    inputs: [],
    outputs: [{ id: 'exec-out', label: 'Exec', type: 'exec' }],
    isActive: true,
  },
  {
    id: 'controller',
    title: 'AI CONTROLLER INIT',
    subTitle: 'Provider + model from AIW gateway',
    headerColor: 'bg-sky-900/80',
    x: 190,
    y: 55,
    width: 195,
    inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
    outputs: [
      { id: 'ready', label: 'Ready', type: 'exec' },
      { id: 'brain', label: 'Brain', type: 'string', color: '#38bdf8' },
    ],
    isActive: true,
  },
  {
    id: 'perception',
    title: 'AI PERCEPTION',
    subTitle: 'Vision + awareness',
    headerColor: 'bg-violet-900/80',
    x: 55,
    y: 225,
    width: 180,
    inputs: [{ id: 'exec-in', label: 'Ready', type: 'exec' }],
    outputs: [{ id: 'detected', label: 'Detected', type: 'exec' }],
    isActive: true,
  },
  {
    id: 'dialogue',
    title: 'DIALOGUE / ACTION',
    subTitle: 'Respond and choose action',
    headerColor: 'bg-purple-900/80',
    x: 260,
    y: 250,
    width: 190,
    inputs: [{ id: 'exec-in', label: 'Detected', type: 'exec' }],
    outputs: [{ id: 'complete', label: 'Complete', type: 'exec' }],
  },
];

const DEFAULT_CONNECTIONS: GraphConnection[] = [
  {
    id: 'start-controller',
    fromNodeId: 'start',
    fromPinId: 'exec-out',
    toNodeId: 'controller',
    toPinId: 'exec-in',
    color: '#e4e4e7',
    isActiveFlow: true,
  },
  {
    id: 'controller-perception',
    fromNodeId: 'controller',
    fromPinId: 'ready',
    toNodeId: 'perception',
    toPinId: 'exec-in',
    color: '#38bdf8',
    isActiveFlow: true,
  },
  {
    id: 'perception-dialogue',
    fromNodeId: 'perception',
    fromPinId: 'detected',
    toNodeId: 'dialogue',
    toPinId: 'exec-in',
    color: '#a855f7',
    isActiveFlow: true,
  },
];

const createLog = (level: ConsoleLogEntry['level'], message: string): ConsoleLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  timestamp: new Date().toLocaleTimeString([], { hour12: false }),
  level,
  message,
});

const fieldClass =
  'h-7 w-full rounded border border-zinc-700 bg-[#111318] px-2 text-[10px] text-zinc-200 outline-none focus:border-sky-600';

export const ReferenceEditorShell: React.FC<ReferenceEditorShellProps> = ({
  viewport,
  selectedItem,
  onSelectItem,
  npcNames,
  objectCount,
}) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const [propertyTab, setPropertyTab] = useState<PropertyTab>('Character');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const [materials, setMaterials] = useState<PBRMaterial[]>(DEFAULT_MATERIALS);
  const [behaviorNodes, setBehaviorNodes] = useState<BehaviorNode[]>(DEFAULT_BEHAVIOR_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('controller');
  const [motionPreset, setMotionPreset] = useState<NpcMotionPreset>('idle');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [lastAction, setLastAction] = useState('Ready');
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([
    createLog('SUCCESS', 'NPC-AI-SIM editor initialized'),
    createLog('NEURAL', 'AI behavior graph ready'),
  ]);
  const [aiCommand, setAiCommand] = useState('');
  const [provider, setProvider] = useState('OpenRouter');
  const [model, setModel] = useState(PROVIDER_MODELS.OpenRouter[0]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetMenu, setAssetMenu] = useState<{ x: number; y: number } | null>(null);
  const [creatingKind, setCreatingKind] = useState<string | null>(null);
  const [pendingAssetName, setPendingAssetName] = useState('');
  const [createdAssets, setCreatedAssets] = useState<CreatedAsset[]>([]);

  const filteredNpcNames = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    return query ? npcNames.filter((name) => name.toLowerCase().includes(query)) : npcNames;
  }, [assetSearch, npcNames]);

  const currentModels = PROVIDER_MODELS[provider] || ['Auto / Recommended'];

  const setSimulationState = (state: PlayState) => {
    setPlayState(state);
    setLastAction(`Simulation ${state}`);
    setLogs((current) => [...current.slice(-120), createLog('INFO', `Simulation ${state}`)]);
  };

  const handleGraphMove = (nodeId: string, dx: number, dy: number) => {
    setBehaviorNodes((current) =>
      current.map((node) => (node.id === nodeId ? { ...node, x: node.x + dx, y: node.y + dy } : node)),
    );
  };

  const handleGraphAdd = (title: string, category: string) => {
    const id = `${category}-${Date.now()}`;
    setBehaviorNodes((current) => [
      ...current,
      {
        id,
        title: title.toUpperCase(),
        subTitle: `Custom ${category}`,
        headerColor: 'bg-sky-900/80',
        x: 80 + (current.length % 2) * 210,
        y: 380 + Math.floor(current.length / 2) * 110,
        width: 185,
        inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
        outputs: [{ id: 'exec-out', label: 'Complete', type: 'exec' }],
      },
    ]);
    setSelectedNodeId(id);
    setLogs((current) => [...current.slice(-120), createLog('SUCCESS', `Created behavior node: ${title}`)]);
  };

  const updateTransform = (key: keyof TransformState, value: number) => {
    setTransform((current) => ({ ...current, [key]: value }));
  };

  const updateMaterial = (id: string, key: 'roughness' | 'metallic', value: number) => {
    setMaterials((current) =>
      current.map((material) => (material.id === id ? { ...material, [key]: value } : material)),
    );
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

  const startAssetCreation = (kind: string) => {
    setCreatingKind(kind);
    setPendingAssetName(kind === 'AI Character Blueprint' ? 'AI_NewCharacter' : `New ${kind}`);
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

  const handleProviderChange = (nextProvider: string) => {
    setProvider(nextProvider);
    setModel((PROVIDER_MODELS[nextProvider] || ['Auto / Recommended'])[0]);
    setLogs((current) => [...current.slice(-120), createLog('INFO', `AI provider selected: ${nextProvider}`)]);
  };

  const assetCategories = [
    { label: 'Characters', icon: <User className="h-3 w-3" />, count: npcNames.length + createdAssets.filter((asset) => asset.kind.includes('Character')).length },
    { label: 'Animations', icon: <Activity className="h-3 w-3" />, count: 5 },
    { label: 'Behaviors', icon: <Sparkles className="h-3 w-3" />, count: behaviorNodes.length },
    { label: 'Materials', icon: <Palette className="h-3 w-3" />, count: materials.length },
    { label: 'Environment', icon: <Box className="h-3 w-3" />, count: 1 },
  ];

  return (
    <div
      className="h-screen w-full min-w-[1040px] overflow-hidden bg-[#080a0e] text-zinc-100 flex flex-col font-sans"
      onClick={() => {
        if (openMenu) setOpenMenu(null);
        if (assetMenu) setAssetMenu(null);
      }}
    >
      <header className="h-[44px] shrink-0 border-b border-zinc-700/70 bg-[#15181d] flex items-center relative z-50 shadow-lg">
        <div className="flex min-w-0 items-center gap-3 px-3">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-sky-700 bg-sky-950/60">
            <Sparkles className="h-3.5 w-3.5 text-sky-300" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[11px] font-semibold tracking-wide text-white">NPC-AI-SIM</div>
            <div className="truncate text-[9px] text-zinc-500">AI Character Blueprint • {selectedItem || 'Untitled'}</div>
          </div>
        </div>

        <div className="ml-4 flex h-full items-center">
          {MENU_ITEMS.map((item) => (
            <div className="relative h-full" key={item}>
              <button
                className="h-full px-2.5 text-[10px] text-zinc-400 hover:bg-zinc-800 hover:text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenu((current) => (current === item ? null : item));
                }}
              >
                {item}
              </button>
              {openMenu === item && (
                <div className="absolute left-0 top-full z-50 min-w-44 border border-zinc-700 bg-[#1a1d22] py-1 shadow-2xl">
                  {['New Character', 'Open Project', 'Save', 'Project Settings'].map((action) => (
                    <button
                      key={action}
                      className="block w-full px-3 py-1.5 text-left text-[10px] text-zinc-300 hover:bg-zinc-700/70"
                      onClick={() => {
                        setLastAction(`${item}: ${action}`);
                        setLogs((current) => [...current.slice(-120), createLog('INFO', `${item}: ${action}`)]);
                        setOpenMenu(null);
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 px-3 text-[9px]">
          <span className="rounded border border-emerald-900/70 bg-emerald-950/30 px-2 py-1 text-emerald-300">AIW Gateway</span>
          <button
            onClick={() => setLogs((current) => [...current.slice(-120), createLog('INFO', 'Project saved')])}
            className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-zinc-300 hover:border-sky-700 hover:text-white"
          >
            Save
          </button>
          <button
            onClick={() => setSimulationState('playing')}
            className="rounded border border-sky-700 bg-sky-950/50 px-2.5 py-1.5 text-sky-300 hover:bg-sky-900/50"
          >
            Test
          </button>
          <button
            onClick={() => setLogs((current) => [...current.slice(-120), createLog('INFO', 'Export panel requested')])}
            className="rounded bg-sky-600 px-2.5 py-1.5 font-medium text-white hover:bg-sky-500"
          >
            Export
          </button>
        </div>
      </header>

      <div className="h-[38px] shrink-0 border-b border-zinc-700/70 bg-[#202328] flex items-center gap-1 px-2">
        {([
          ['select', <MousePointer2 className="h-3.5 w-3.5" />, 'Select'],
          ['move', <Move3D className="h-3.5 w-3.5" />, 'Move'],
          ['rotate', <RotateCw className="h-3.5 w-3.5" />, 'Rotate'],
          ['scale', <Scaling className="h-3.5 w-3.5" />, 'Scale'],
        ] as const).map(([tool, icon, label]) => (
          <button
            key={tool}
            onClick={() => {
              setActiveTool(tool);
              setLastAction(`${label} tool`);
            }}
            className={`flex h-7 items-center gap-1 border px-2 text-[10px] ${
              activeTool === tool
                ? 'border-sky-700 bg-[#31475b] text-white'
                : 'border-zinc-700 bg-[#181b1f] text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}

        <div className="ml-2 flex items-center gap-1 text-[9px] text-zinc-500">
          <span>Pivot</span><button className="h-6 border border-zinc-700 bg-[#17191d] px-2">Center</button>
          <span className="ml-1">Snap</span><button className="h-6 border border-zinc-700 bg-[#17191d] px-2">On</button>
          <span className="ml-1">Grid</span><button className="h-6 border border-zinc-700 bg-[#17191d] px-2">1m</button>
        </div>

        <div className="ml-auto flex items-center gap-1 border-l border-zinc-700 pl-2">
          <button onClick={() => setSimulationState('playing')} className={`p-1.5 ${playState === 'playing' ? 'bg-emerald-900/70 text-emerald-300' : 'text-zinc-400 hover:bg-zinc-700'}`} title="Play"><Play className="h-3.5 w-3.5" /></button>
          <button onClick={() => setSimulationState('paused')} className={`p-1.5 ${playState === 'paused' ? 'bg-amber-900/70 text-amber-300' : 'text-zinc-400 hover:bg-zinc-700'}`} title="Pause"><Pause className="h-3.5 w-3.5" /></button>
          <button onClick={() => setSimulationState('stopped')} className="p-1.5 text-zinc-400 hover:bg-zinc-700" title="Stop"><CircleStop className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="h-[48px] shrink-0 border-b border-sky-950/70 bg-[#0e131a] px-2.5 flex items-center gap-2">
        <div className="flex h-8 flex-1 items-center rounded-md border border-sky-900/70 bg-[#090c11] shadow-[inset_0_0_20px_rgba(14,165,233,0.03)]">
          <Sparkles className="ml-2.5 h-3.5 w-3.5 text-sky-400" />
          <input
            value={aiCommand}
            onChange={(event) => setAiCommand(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') runAiCommand();
            }}
            placeholder="Ask AI to create or change anything — character, materials, voice, animation, behavior, environment..."
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-[10px] text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>

        <select
          value={provider}
          onChange={(event) => handleProviderChange(event.target.value)}
          className="h-8 w-[120px] rounded border border-zinc-700 bg-[#15181d] px-2 text-[9px] text-zinc-300 outline-none focus:border-sky-700"
          title="Provider comes from the shared AIW provider registry"
        >
          {Object.keys(PROVIDER_MODELS).map((name) => <option key={name}>{name}</option>)}
        </select>

        <select
          value={model}
          onChange={(event) => setModel(event.target.value)}
          className="h-8 w-[145px] rounded border border-zinc-700 bg-[#15181d] px-2 text-[9px] text-zinc-300 outline-none focus:border-sky-700"
          title="Model list changes with the selected provider"
        >
          {currentModels.map((name) => <option key={name}>{name}</option>)}
        </select>

        <button
          onClick={runAiCommand}
          className="h-8 rounded border border-sky-500/50 bg-sky-600 px-4 text-[10px] font-semibold text-white hover:bg-sky-500"
        >
          Apply AI
        </button>
      </div>

      <main
        className="flex-1 min-h-0 grid"
        style={{
          gridTemplateColumns: '286px minmax(0, 1fr) 500px',
          gridTemplateRows: consoleOpen ? 'minmax(0, 1fr) 190px' : 'minmax(0, 1fr) 30px',
          gridTemplateAreas: '"left viewport graph" "left console console"',
        }}
      >
        <aside style={{ gridArea: 'left' }} className="min-h-0 border-r border-zinc-700/80 bg-[#15181d] flex flex-col">
          <section className="h-[55%] min-h-0 flex flex-col border-b border-zinc-700/80">
            <div className="h-8 shrink-0 border-b border-zinc-700/80 bg-[#1b1f24] px-2.5 flex items-center gap-2 text-[10px]">
              <Folder className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold tracking-wide">ASSET BROWSER</span>
              <span className="ml-auto text-[8px] text-zinc-600">Right-click to create</span>
            </div>
            <div className="h-8 shrink-0 border-b border-zinc-800 bg-[#111419] px-2 flex items-center gap-1.5">
              <Search className="h-3 w-3 text-zinc-600" />
              <input
                value={assetSearch}
                onChange={(event) => setAssetSearch(event.target.value)}
                placeholder="Search assets..."
                className="w-full bg-transparent text-[9px] text-zinc-300 outline-none placeholder:text-zinc-700"
              />
            </div>

            <div
              className="relative flex-1 min-h-0 overflow-y-auto p-1.5 text-[9px] custom-scrollbar"
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setAssetMenu({ x: event.clientX, y: event.clientY });
              }}
            >
              {assetCategories.map((category) => (
                <div key={category.label} className="mb-0.5">
                  <div className="flex items-center gap-1 rounded px-1.5 py-1 text-zinc-400 hover:bg-zinc-800/60">
                    <ChevronDown className="h-3 w-3 text-zinc-600" />
                    {category.icon}
                    <span>{category.label}</span>
                    <span className="ml-auto text-[8px] text-zinc-700">{category.count}</span>
                  </div>
                  {category.label === 'Characters' && (
                    <div className="ml-5 border-l border-zinc-800 pl-1">
                      {filteredNpcNames.map((name, index) => (
                        <button
                          key={`${name}-${index}`}
                          onClick={() => onSelectItem(`character-${index}`, name)}
                          className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left ${
                            selectedItem === name ? 'bg-sky-950/60 text-sky-200' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                          }`}
                        >
                          <User className="h-3 w-3" />
                          <span className="truncate">{name}</span>
                        </button>
                      ))}
                      {createdAssets.filter((asset) => asset.kind.includes('Character')).map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => onSelectItem(asset.id, asset.name)}
                          className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left ${
                            selectedItem === asset.name ? 'bg-sky-950/60 text-sky-200' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                          }`}
                        >
                          <Sparkles className="h-3 w-3 text-sky-500" />
                          <span className="truncate">{asset.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {createdAssets.filter((asset) => !asset.kind.includes('Character')).length > 0 && (
                <div className="mt-2 border-t border-zinc-800 pt-1">
                  <div className="px-1.5 py-1 text-[8px] uppercase tracking-wider text-zinc-700">Created this session</div>
                  {createdAssets.filter((asset) => !asset.kind.includes('Character')).map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => onSelectItem(asset.id, asset.name)}
                      className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                    >
                      <Box className="h-3 w-3" />
                      <span className="truncate">{asset.name}</span>
                      <span className="ml-auto text-[7px] text-zinc-700">{asset.kind}</span>
                    </button>
                  ))}
                </div>
              )}

              {creatingKind && (
                <div className="mt-2 rounded border border-sky-900/70 bg-sky-950/20 p-2">
                  <div className="mb-1 text-[8px] uppercase tracking-wide text-sky-500">New {creatingKind}</div>
                  <input
                    autoFocus
                    value={pendingAssetName}
                    onChange={(event) => setPendingAssetName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitAssetCreation();
                      if (event.key === 'Escape') setCreatingKind(null);
                    }}
                    onBlur={() => pendingAssetName.trim() && commitAssetCreation()}
                    className="h-7 w-full rounded border border-sky-800 bg-zinc-950 px-2 text-[9px] text-white outline-none"
                  />
                  <div className="mt-1 text-[7px] text-zinc-600">Enter to create • Esc to cancel</div>
                </div>
              )}
            </div>
          </section>

          <section className="flex-1 min-h-0 flex flex-col">
            <div className="h-8 shrink-0 border-b border-zinc-700/80 bg-[#1b1f24] px-2.5 flex items-center justify-between text-[10px]">
              <span className="font-semibold tracking-wide">DETAILS</span>
              <span className="max-w-[140px] truncate text-[8px] text-zinc-600">{selectedItem || 'Character'}</span>
            </div>
            <div className="h-7 shrink-0 border-b border-zinc-800 bg-[#111419] flex items-center text-[8px]">
              {(['Character', 'AI Brain', 'Materials'] as PropertyTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPropertyTab(tab)}
                  className={`h-full border-r border-zinc-800 px-2.5 ${propertyTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-2 text-[9px] custom-scrollbar">
              {propertyTab === 'Character' && (
                <div className="space-y-2.5">
                  <div className="rounded border border-zinc-800 bg-[#111419] p-2">
                    <div className="mb-2 text-[8px] uppercase tracking-wider text-zinc-600">Identity</div>
                    <label className="grid grid-cols-[68px_1fr] items-center gap-2"><span>Name</span><input className={fieldClass} value={selectedItem || 'Character'} readOnly /></label>
                    <label className="mt-1.5 grid grid-cols-[68px_1fr] items-center gap-2"><span>Rig</span><select className={fieldClass}><option>Humanoid / Auto</option><option>Creature</option><option>Custom</option></select></label>
                  </div>
                  <div className="rounded border border-zinc-800 bg-[#111419] p-2">
                    <div className="mb-2 text-[8px] uppercase tracking-wider text-zinc-600">Transform</div>
                    {([
                      ['Pos X', 'posX'], ['Pos Y', 'posY'], ['Pos Z', 'posZ'],
                      ['Rot X', 'rotX'], ['Rot Y', 'rotY'], ['Rot Z', 'rotZ'],
                    ] as Array<[string, keyof TransformState]>).map(([label, key]) => (
                      <label key={key} className="mb-1 grid grid-cols-[68px_1fr] items-center gap-2">
                        <span>{label}</span>
                        <input className={fieldClass} type="number" step="0.01" value={transform[key]} onChange={(event) => updateTransform(key, Number(event.target.value))} />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {propertyTab === 'AI Brain' && (
                <div className="space-y-2.5">
                  <div className="rounded border border-emerald-900/60 bg-emerald-950/15 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-emerald-300">AIW Universal Gateway</span>
                      <span className="rounded border border-emerald-900 bg-emerald-950 px-1.5 py-0.5 text-[7px] text-emerald-400">ACCOUNT SECRET</span>
                    </div>
                    <p className="mt-1 text-[8px] leading-4 text-zinc-600">Provider keys belong in shared Secrets. NPC projects keep provider/model references, not raw keys.</p>
                  </div>
                  <label className="grid grid-cols-[72px_1fr] items-center gap-2">
                    <span>Provider</span>
                    <select value={provider} onChange={(event) => handleProviderChange(event.target.value)} className={fieldClass}>
                      {Object.keys(PROVIDER_MODELS).map((name) => <option key={name}>{name}</option>)}
                    </select>
                  </label>
                  <label className="grid grid-cols-[72px_1fr] items-center gap-2">
                    <span>Model</span>
                    <select value={model} onChange={(event) => setModel(event.target.value)} className={fieldClass}>
                      {currentModels.map((name) => <option key={name}>{name}</option>)}
                    </select>
                  </label>
                  <label className="grid grid-cols-[72px_1fr] items-center gap-2">
                    <span>Memory</span>
                    <select className={fieldClass}><option>Project memory</option><option>Session only</option><option>Disabled</option></select>
                  </label>
                  <label className="grid grid-cols-[72px_1fr] items-center gap-2">
                    <span>Behavior</span>
                    <select className={fieldClass}><option>Graph driven</option><option>AI assisted</option><option>Scripted</option></select>
                  </label>
                </div>
              )}

              {propertyTab === 'Materials' && (
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div key={material.id} className="rounded border border-zinc-800 bg-[#111419] p-2">
                      <div className="mb-2 flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${material.previewClass}`} />
                        <span className="text-zinc-300">{material.name}</span>
                        <span className="ml-auto text-[7px] text-zinc-700">PBR</span>
                      </div>
                      <label className="mb-1 grid grid-cols-[72px_1fr] items-center gap-2"><span>Metallic</span><input className={fieldClass} type="number" step="0.01" min="0" max="1" value={material.metallic} onChange={(event) => updateMaterial(material.id, 'metallic', Number(event.target.value))} /></label>
                      <label className="grid grid-cols-[72px_1fr] items-center gap-2"><span>Roughness</span><input className={fieldClass} type="number" step="0.01" min="0" max="1" value={material.roughness} onChange={(event) => updateMaterial(material.id, 'roughness', Number(event.target.value))} /></label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </aside>

        <section style={{ gridArea: 'viewport' }} className="relative min-h-0 min-w-0 overflow-hidden border-r border-zinc-700/80 bg-black">
          <div className="absolute inset-x-0 top-0 z-20 flex h-7 items-center border-b border-zinc-700/80 bg-[#171a1f]/95 px-2 text-[9px] text-zinc-400">
            <span>Perspective</span>
            <span className="mx-2 text-zinc-700">|</span>
            <span>Lit</span>
            <span className="mx-2 text-zinc-700">|</span>
            <span>Realtime</span>
            <div className="ml-auto flex items-center gap-2">
              <Camera className="h-3 w-3" />
              <Grid3X3 className="h-3 w-3" />
              <Maximize2 className="h-3 w-3" />
            </div>
          </div>
          <div className="absolute inset-0 pt-7">{viewport}</div>
          <div className="pointer-events-none absolute left-3 top-9 z-20 rounded bg-black/45 px-2 py-1 text-[8px] text-zinc-300">
            Main 3D Viewport
          </div>
          <div className="pointer-events-none absolute right-3 top-9 z-20 rounded border border-zinc-800 bg-black/55 px-2 py-1 font-mono text-[8px] text-zinc-500">
            {objectCount} object{objectCount === 1 ? '' : 's'} • {playState}
          </div>
        </section>

        <section style={{ gridArea: 'graph' }} className="min-h-0 min-w-0 border-b border-zinc-700/80 bg-[#0d0d11]">
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

        <section style={{ gridArea: 'console' }} className="min-h-0 min-w-0 border-t border-zinc-700/80 bg-[#09090b]">
          <DebugConsole
            logs={logs}
            onClearLogs={() => setLogs([])}
            isOpen={consoleOpen}
            onToggleOpen={() => setConsoleOpen((value) => !value)}
            motionPreset={motionPreset}
            onSelectMotionPreset={setMotionPreset}
            playbackSpeed={playbackSpeed}
            onSelectPlaybackSpeed={setPlaybackSpeed}
          />
        </section>
      </main>

      <footer className="h-[22px] shrink-0 border-t border-zinc-800 bg-[#111318] px-2.5 flex items-center gap-3 font-mono text-[8px] text-zinc-600">
        <span className="text-emerald-500">● READY</span>
        <span>{lastAction}</span>
        <span className="ml-auto">Provider: {provider}</span>
        <span>Model: {model}</span>
        <span>Right-click Asset Browser to create</span>
      </footer>

      {assetMenu && (
        <div
          className="fixed z-[80] w-56 overflow-hidden rounded-md border border-zinc-700 bg-[#181b20] py-1 shadow-[0_20px_60px_rgba(0,0,0,0.75)]"
          style={{ left: assetMenu.x, top: assetMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-zinc-800 px-3 py-1.5 text-[8px] uppercase tracking-wider text-zinc-600">Create New</div>
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
            <button
              key={kind}
              onClick={() => startAssetCreation(kind)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[9px] text-zinc-300 hover:bg-sky-950/50 hover:text-white"
            >
              {kind.includes('AI') || kind.includes('Generate') ? <Sparkles className="h-3.5 w-3.5 text-sky-400" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />}
              {kind}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferenceEditorShell;
