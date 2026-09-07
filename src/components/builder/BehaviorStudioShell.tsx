import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Bot,
  Box,
  ChevronDown,
  Download,
  Folder,
  GitBranch,
  Library,
  Mic2,
  Pencil,
  Play,
  Plus,
  Search,
  Settings2,
  Sparkles,
  UserRound,
  Volume2,
} from 'lucide-react';
import { BehaviorGraphEditor } from './RightPanel/BehaviorGraphEditor';
import { DebugConsole } from './CenterPanel/DebugConsole';
import type { BehaviorNode, ConsoleLogEntry, GraphConnection, NpcMotionPreset } from './types';

interface SidebarAsset {
  id: string;
  name: string;
  thumbnail?: string;
  description?: string;
}

interface BehaviorStudioShellProps {
  viewport: React.ReactNode;
  selectedItem: string;
  onSelectItem: (id: string, name: string) => void;
  npcNames: string[];
  npcAssets?: SidebarAsset[];
  objectCount: number;
  viewportStatus?: string;
}

type SidebarMode = 'library' | 'create' | 'editor' | 'animations' | 'voice' | 'behavior' | 'training' | 'export';
type WorkspaceTab = 'Viewport' | 'Animation' | 'Dialogue' | 'Behavior' | 'Audio';
type DetailTab = 'Details' | 'Properties' | 'AI Settings';

const PROVIDER_MODELS: Record<string, string[]> = {
  OpenRouter: ['Auto / Best available', 'Claude family', 'GPT family', 'Gemini family'],
  OpenAI: ['Auto / Recommended', 'GPT family', 'Reasoning family'],
  Anthropic: ['Auto / Recommended', 'Claude Sonnet', 'Claude Haiku'],
  Groq: ['Auto / Recommended', 'Llama family', 'Gemma family'],
};

const DEFAULT_BEHAVIOR_NODES: BehaviorNode[] = [
  { id: 'start', title: 'On Start', subTitle: 'Character runtime entry', headerColor: 'bg-emerald-900/90', x: 155, y: 24, width: 145, inputs: [], outputs: [{ id: 'exec-out', label: 'Exec', type: 'exec' }], isActive: true },
  { id: 'controller', title: 'AI Controller Init', subTitle: 'Model: provider + memory', headerColor: 'bg-sky-900/90', x: 130, y: 112, width: 195, inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }], outputs: [{ id: 'ready', label: 'Ready', type: 'exec' }], isActive: true },
  { id: 'perception', title: 'Perception', subTitle: 'Vision • hearing • proximity', headerColor: 'bg-violet-900/90', x: 135, y: 208, width: 188, inputs: [{ id: 'exec-in', label: 'Ready', type: 'exec' }], outputs: [{ id: 'detected', label: 'Detected', type: 'exec' }], isActive: true },
  { id: 'detected', title: 'Player Detected?', subTitle: 'Branch on perception result', headerColor: 'bg-blue-900/90', x: 127, y: 305, width: 205, inputs: [{ id: 'exec-in', label: 'Detected', type: 'exec' }], outputs: [{ id: 'no', label: 'No', type: 'exec' }, { id: 'yes', label: 'Yes', type: 'exec' }] },
  { id: 'idle', title: 'Idle', subTitle: 'Play Idle_Loop', headerColor: 'bg-slate-800/95', x: 20, y: 422, width: 160, inputs: [{ id: 'exec-in', label: 'No', type: 'exec' }], outputs: [{ id: 'complete', label: 'Complete', type: 'exec' }] },
  { id: 'approach', title: 'Approach', subTitle: 'Move to player • 2m', headerColor: 'bg-purple-900/90', x: 272, y: 422, width: 166, inputs: [{ id: 'exec-in', label: 'Yes', type: 'exec' }], outputs: [{ id: 'reached', label: 'Reached', type: 'exec' }] },
  { id: 'dialogue', title: 'Dialogue', subTitle: 'Start conversation', headerColor: 'bg-fuchsia-900/90', x: 125, y: 535, width: 182, inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }], outputs: [{ id: 'complete', label: 'Complete', type: 'exec' }] },
  { id: 'decision', title: 'Decide Action', subTitle: 'Talk • follow • trade', headerColor: 'bg-amber-900/90', x: 320, y: 535, width: 160, inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }], outputs: [{ id: 'done', label: 'Done', type: 'exec' }] },
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

const SIDEBAR_ITEMS: Array<{ id: SidebarMode; label: string; icon: React.ReactNode }> = [
  { id: 'library', label: 'Library', icon: <Library className="h-4 w-4" /> },
  { id: 'create', label: 'Create New', icon: <Plus className="h-4 w-4" /> },
  { id: 'editor', label: 'Editor', icon: <Pencil className="h-4 w-4" /> },
  { id: 'animations', label: 'Animations', icon: <Activity className="h-4 w-4" /> },
  { id: 'voice', label: 'Voice & Dialogue', icon: <Volume2 className="h-4 w-4" /> },
  { id: 'behavior', label: 'Behavior Graph', icon: <GitBranch className="h-4 w-4" /> },
  { id: 'training', label: 'Training & Skills', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'export', label: 'Test & Export', icon: <Download className="h-4 w-4" /> },
];

const NAV_ITEMS = ['WonderBuild', 'WonderSpace', 'AI Playground', '3D Studio', 'NPC-AI-SIM', 'Marketplace'];
const WORKSPACE_TABS: WorkspaceTab[] = ['Viewport', 'Animation', 'Dialogue', 'Behavior', 'Audio'];

export const BehaviorStudioShell: React.FC<BehaviorStudioShellProps> = ({
  viewport,
  selectedItem,
  onSelectItem,
  npcNames,
  npcAssets = [],
  viewportStatus = '3D scene ready',
}) => {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('library');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('Viewport');
  const [detailTab, setDetailTab] = useState<DetailTab>('Details');
  const [provider, setProvider] = useState('OpenRouter');
  const [model, setModel] = useState(PROVIDER_MODELS.OpenRouter[0]);
  const [behaviorNodes, setBehaviorNodes] = useState<BehaviorNode[]>(DEFAULT_BEHAVIOR_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('controller');
  const [playState, setPlayState] = useState<'stopped' | 'playing'>('stopped');
  const [motionPreset, setMotionPreset] = useState<NpcMotionPreset>('idle');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aiCommand, setAiCommand] = useState('');
  const [assetSearch, setAssetSearch] = useState('');
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([
    createLog('SUCCESS', `Project loaded: ${selectedItem || 'NPC Project'}`),
    createLog('SUCCESS', 'Assets loaded successfully'),
    createLog('NEURAL', 'AI provider ready'),
    createLog('SUCCESS', 'Behavior graph initialized'),
    createLog('INFO', 'Training Lab ready'),
  ]);

  const visibleAssets = useMemo(() => {
    const base = npcAssets.length ? npcAssets : npcNames.map((name, index) => ({ id: `npc-${index}`, name }));
    const query = assetSearch.trim().toLowerCase();
    return query ? base.filter((asset) => asset.name.toLowerCase().includes(query)) : base;
  }, [assetSearch, npcAssets, npcNames]);

  const currentModels = PROVIDER_MODELS[provider] || ['Auto / Recommended'];

  const setSimulationState = () => {
    const next = playState === 'playing' ? 'stopped' : 'playing';
    setPlayState(next);
    setLogs((current) => [...current.slice(-100), createLog(next === 'playing' ? 'SUCCESS' : 'INFO', next === 'playing' ? 'Play test started' : 'Play test stopped')]);
  };

  const runAiCommand = () => {
    const command = aiCommand.trim();
    if (!command) return;
    setLogs((current) => [...current.slice(-100), createLog('NEURAL', `AI command queued: ${command}`)]);
    setAiCommand('');
  };

  const moveNode = (nodeId: string, dx: number, dy: number) => {
    setBehaviorNodes((current) => current.map((node) => node.id === nodeId ? { ...node, x: node.x + dx, y: node.y + dy } : node));
  };

  const addNode = (title: string, category: string) => {
    const id = `${category}-${Date.now()}`;
    setBehaviorNodes((current) => [...current, {
      id,
      title,
      subTitle: `Custom ${category}`,
      headerColor: 'bg-sky-900/90',
      x: 145,
      y: 650 + current.length * 8,
      width: 180,
      inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
      outputs: [{ id: 'exec-out', label: 'Complete', type: 'exec' }],
    }]);
    setSelectedNodeId(id);
  };

  return (
    <div className="h-screen min-w-[1180px] overflow-hidden bg-[#050912] text-zinc-100">
      <div className="flex h-full flex-col">
        <header className="h-14 shrink-0 border-b border-[#1d2939] bg-[#070e18]">
          <div className="flex h-full items-center px-4">
            <a href="https://dreammakerhub.website/" className="flex items-center gap-3 text-white no-underline">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/50 bg-gradient-to-br from-blue-600/45 via-indigo-500/35 to-violet-600/45 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <span className="text-base font-black">AI</span>
              </div>
              <span className="text-[15px] font-bold tracking-[0.02em]">WONDERLAND</span>
            </a>

            <div className="ml-8 h-7 w-px bg-[#203047]" />

            <nav className="ml-4 flex h-full items-center gap-1 text-[11px] text-zinc-400">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item}
                  href={item === 'NPC-AI-SIM' ? '/builder' : '#'}
                  className={`relative flex h-full items-center px-3 no-underline transition ${item === 'NPC-AI-SIM' ? 'bg-blue-950/45 text-blue-300' : 'text-zinc-400 hover:text-white'}`}
                >
                  {item}
                  {item === 'NPC-AI-SIM' && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-blue-500" />}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-4">
              <Search className="h-4 w-4 text-zinc-300" />
              <div className="relative">
                <Bell className="h-4 w-4 text-zinc-300" />
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 font-semibold">M</div>
                <span className="text-zinc-200">Michael</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: '208px minmax(0, 1fr) 548px' }}>
          <aside className="flex min-h-0 flex-col border-r border-[#1d2939] bg-[#07101a]">
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#1d2939] px-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-violet-500/35 bg-violet-500/10">
                <Bot className="h-4 w-4 text-violet-300" />
              </div>
              <div>
                <div className="text-[12px] font-bold">NPC-AI-SIM</div>
                <div className="mt-0.5 text-[7px] text-zinc-600">AI CHARACTER STUDIO</div>
              </div>
            </div>

            <div className="shrink-0 p-2">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSidebarMode(item.id)}
                  className={`mb-1 flex h-10 w-full items-center gap-3 rounded-md border px-3 text-left text-[10px] transition ${
                    sidebarMode === item.id
                      ? 'border-blue-500/50 bg-gradient-to-r from-blue-600/45 to-violet-700/35 text-white shadow-[inset_3px_0_0_#60a5fa]'
                      : 'border-transparent text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mx-3 h-px bg-[#1d2939]" />

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <div className="mb-3 flex items-center">
                <span className="text-[11px] font-semibold text-zinc-200">My NPCs</span>
                <button className="ml-auto rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-white"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="mb-2 flex h-8 items-center gap-2 rounded-md border border-[#25344a] bg-[#0a1420] px-2">
                <Search className="h-3.5 w-3.5 text-zinc-600" />
                <input value={assetSearch} onChange={(event) => setAssetSearch(event.target.value)} placeholder="Search NPCs..." className="min-w-0 flex-1 bg-transparent text-[9px] text-zinc-300 outline-none placeholder:text-zinc-700" />
              </div>
              <div className="space-y-2">
                {visibleAssets.slice(0, 8).map((asset, index) => {
                  const selected = asset.name === selectedItem;
                  const safeThumb = asset.thumbnail && !asset.thumbnail.includes('dicebear.com') ? asset.thumbnail : undefined;
                  return (
                    <button
                      key={asset.id}
                      onClick={() => onSelectItem(asset.id, asset.name)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${selected ? 'border-blue-500 bg-blue-950/45' : 'border-[#1e2b3d] bg-[#09131f] hover:border-[#30435e]'}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#2b3b52] bg-gradient-to-br from-[#1b2c40] to-[#0a1018]">
                        {safeThumb ? <img src={safeThumb} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5 text-zinc-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[10px] font-semibold text-zinc-200">{asset.name}</div>
                        <div className="mt-0.5 truncate text-[8px] text-zinc-600">{index === 0 ? 'Sci-Fi Engineer' : index === 1 ? 'Companion' : index === 2 ? 'Security' : 'AI Character'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 border-t border-[#1d2939] p-3">
              <button className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-blue-500/55 bg-blue-950/30 text-[10px] font-semibold text-blue-200 hover:bg-blue-900/35">
                <Plus className="h-4 w-4" /> New NPC
              </button>
            </div>
          </aside>

          <section className="grid min-h-0 min-w-0 border-r border-[#1d2939] bg-[#050912]" style={{ gridTemplateRows: '58px minmax(0, 1fr) 300px' }}>
            <div className="flex items-center border-b border-[#1d2939] bg-[#08111d] px-3">
              <div className="flex h-9 items-center gap-2 rounded-md border border-[#26364d] bg-[#0b1624] px-3">
                <Folder className="h-4 w-4 text-sky-400" />
                <span className="text-[10px] text-zinc-400">Project:</span>
                <span className="max-w-[150px] truncate text-[10px] font-semibold text-white">{selectedItem || 'Nova'}</span>
              </div>
              <div className="ml-3 flex h-9 items-center rounded-md border border-[#26364d] bg-[#0b1624] p-1">
                {WORKSPACE_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setWorkspaceTab(tab)}
                    className={`h-7 rounded px-3 text-[9px] ${workspaceTab === tab ? 'bg-blue-600/35 text-blue-100' : 'text-zinc-500 hover:text-zinc-200'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={setSimulationState} className={`flex h-9 items-center gap-2 rounded-md border px-4 text-[10px] font-semibold ${playState === 'playing' ? 'border-emerald-500/50 bg-emerald-950/35 text-emerald-300' : 'border-[#33465f] bg-[#0b1624] text-zinc-200'}`}>
                  <Play className="h-4 w-4" /> {playState === 'playing' ? 'Stop Test' : 'Play Test'}
                </button>
                <select className="h-9 rounded-md border border-[#26364d] bg-[#0b1624] px-3 text-[9px] text-zinc-300 outline-none"><option>Game</option><option>Film / VFX</option></select>
                <button className="flex h-9 items-center gap-2 rounded-md border border-violet-500/45 bg-gradient-to-r from-violet-600 to-purple-600 px-4 text-[10px] font-semibold text-white"><Download className="h-4 w-4" /> Export</button>
              </div>
            </div>

            <div className="relative min-h-0 overflow-hidden bg-black">
              {viewport}
              <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-[#334155]/70 bg-[#050a11]/75 px-2 py-1 text-[8px] text-zinc-400 backdrop-blur-sm">
                TRAINING LAB • SYSTEM LOCKED
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-[#334155]/70 bg-[#050a11]/75 px-2 py-1 text-[8px] text-zinc-500 backdrop-blur-sm">
                Perspective&nbsp;&nbsp; • &nbsp;&nbsp;Lit
              </div>
              <div className="pointer-events-none absolute bottom-3 right-3 max-w-[46%] truncate rounded-md border border-[#334155]/70 bg-[#050a11]/75 px-2 py-1 text-[8px] text-zinc-500 backdrop-blur-sm">
                {viewportStatus}
              </div>
            </div>

            <div className="grid min-h-0 border-t border-[#1d2939] bg-[#07101a]" style={{ gridTemplateColumns: '340px minmax(0, 1fr)' }}>
              <div className="min-h-0 border-r border-[#1d2939]">
                <div className="flex h-9 items-center border-b border-[#1d2939] bg-[#09131f] px-2">
                  {(['Details', 'Properties', 'AI Settings'] as DetailTab[]).map((tab) => (
                    <button key={tab} onClick={() => setDetailTab(tab)} className={`relative h-full px-3 text-[9px] ${detailTab === tab ? 'text-blue-200' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      {tab}
                      {detailTab === tab && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-blue-500" />}
                    </button>
                  ))}
                </div>
                <div className="h-[calc(100%-36px)] overflow-y-auto p-3 text-[9px]">
                  {detailTab === 'Details' && (
                    <div className="space-y-3">
                      <div>
                        <div className="mb-2 text-[10px] font-semibold text-zinc-200">Identity</div>
                        <label className="mb-2 grid grid-cols-[72px_1fr] items-center gap-2 text-zinc-500"><span>Name</span><input value={selectedItem} readOnly className="h-7 rounded border border-[#27364b] bg-[#09131f] px-2 text-zinc-200 outline-none" /></label>
                        <label className="mb-2 grid grid-cols-[72px_1fr] items-center gap-2 text-zinc-500"><span>Role</span><select className="h-7 rounded border border-[#27364b] bg-[#09131f] px-2 text-zinc-200 outline-none"><option>Engineer</option><option>Companion</option><option>Guard</option></select></label>
                        <label className="grid grid-cols-[72px_1fr] items-start gap-2 text-zinc-500"><span>Description</span><textarea className="h-14 resize-none rounded border border-[#27364b] bg-[#09131f] p-2 text-zinc-300 outline-none" defaultValue="Calm, intelligent, adaptive NPC ready for training." /></label>
                      </div>
                      <div className="border-t border-[#1d2939] pt-3">
                        <div className="mb-2 text-[10px] font-semibold text-zinc-200">AI Brain</div>
                        <label className="mb-2 grid grid-cols-[72px_1fr] items-center gap-2 text-zinc-500"><span>Provider</span><select value={provider} onChange={(e) => { setProvider(e.target.value); setModel(PROVIDER_MODELS[e.target.value][0]); }} className="h-7 rounded border border-[#27364b] bg-[#09131f] px-2 text-zinc-200 outline-none">{Object.keys(PROVIDER_MODELS).map((name) => <option key={name}>{name}</option>)}</select></label>
                        <label className="grid grid-cols-[72px_1fr] items-center gap-2 text-zinc-500"><span>Model</span><select value={model} onChange={(e) => setModel(e.target.value)} className="h-7 rounded border border-[#27364b] bg-[#09131f] px-2 text-zinc-200 outline-none">{currentModels.map((name) => <option key={name}>{name}</option>)}</select></label>
                      </div>
                    </div>
                  )}
                  {detailTab === 'Properties' && <div className="space-y-2 text-zinc-500">{['Transform', 'Materials', 'Animation', 'Voice', 'Personality', 'Perception'].map((item) => <button key={item} className="flex h-8 w-full items-center justify-between border-b border-[#172233] text-left"><span>{item}</span><ChevronDown className="h-3 w-3" /></button>)}</div>}
                  {detailTab === 'AI Settings' && <div className="space-y-3"><div className="rounded border border-[#27364b] bg-[#09131f] p-3"><div className="font-semibold text-zinc-200">AI Runtime</div><div className="mt-1 text-zinc-600">Provider and model configuration remain tied to the NPC runtime source of truth.</div></div><div className="rounded border border-[#27364b] bg-[#09131f] p-3"><div className="font-semibold text-zinc-200">Memory</div><div className="mt-1 text-zinc-600">Context, relationships and state-aware memory hooks.</div></div></div>}
                </div>
              </div>

              <div className="min-h-0">
                <div className="flex h-9 items-center border-b border-[#1d2939] bg-[#09131f] px-3">
                  <span className="text-[10px] font-semibold text-zinc-200">Asset Browser</span>
                  <div className="ml-auto flex h-7 w-56 items-center gap-2 rounded border border-[#27364b] bg-[#07101a] px-2"><Search className="h-3 w-3 text-zinc-600" /><input placeholder="Search assets..." className="min-w-0 flex-1 bg-transparent text-[8px] text-zinc-300 outline-none placeholder:text-zinc-700" /></div>
                </div>
                <div className="grid h-[calc(100%-36px)] grid-cols-[130px_1fr] min-h-0">
                  <div className="overflow-y-auto border-r border-[#1d2939] p-2 text-[8px] text-zinc-500">
                    {['Models', 'Materials', 'Animations', 'Voice', 'Dialogue', 'Behavior', 'Textures', 'Training'].map((item, index) => <div key={item} className={`mb-1 flex h-7 items-center gap-2 rounded px-2 ${index === 0 ? 'bg-blue-950/30 text-zinc-300' : 'hover:bg-white/[0.03]'}`}><Folder className="h-3 w-3" /> {item}</div>)}
                  </div>
                  <div className="grid auto-rows-[88px] grid-cols-3 gap-2 overflow-y-auto p-2">
                    {['nova.glb', 'body_diffuse.png', 'body_normal.png', 'idle.fbx', 'walk.fbx', 'talk.fbx', 'nova_voice_01.wav', 'nova_voice_02.wav', 'dialogue.behavior'].map((name, index) => (
                      <div key={name} className={`group rounded-md border p-2 ${index === 0 ? 'border-blue-500/70 bg-blue-950/25' : 'border-[#26364d] bg-[#0a1420]'}`}>
                        <div className="flex h-11 items-center justify-center rounded bg-gradient-to-br from-[#17243a] to-[#090f18] text-zinc-500">{name.endsWith('.wav') ? <Volume2 className="h-5 w-5" /> : name.endsWith('.fbx') ? <Activity className="h-5 w-5" /> : name.endsWith('.behavior') ? <GitBranch className="h-5 w-5" /> : <Box className="h-5 w-5" />}</div>
                        <div className="mt-1 truncate text-[7px] text-zinc-400">{name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid min-h-0 bg-[#06101a]" style={{ gridTemplateRows: 'minmax(0, 1fr) 310px' }}>
            <div className="min-h-0 border-b border-[#1d2939]">
              <BehaviorGraphEditor
                nodes={behaviorNodes}
                connections={DEFAULT_CONNECTIONS}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onNodeMove={moveNode}
                isPlaying={playState === 'playing'}
                onAddNode={addNode}
              />
            </div>
            <div className="min-h-0">
              <DebugConsole
                logs={logs}
                onClearLogs={() => setLogs([])}
                isOpen
                onToggleOpen={() => undefined}
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BehaviorStudioShell;
