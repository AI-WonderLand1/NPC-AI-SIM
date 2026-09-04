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
  Layers,
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
type BottomTab = 'Assets' | 'Animation' | 'AI Graph' | 'Console';
type PropertyTab = 'Transform' | 'Materials' | 'Animator';
type PlayState = 'stopped' | 'playing' | 'paused';

const MENU_ITEMS = ['File', 'Edit', 'View', 'Window', 'Help'];

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
    name: 'Adventure_Girl',
    shaderType: 'PBR',
    previewClass: 'bg-zinc-500',
    roughness: 0.372,
    metallic: 0,
    albedoMap: 'Character_Albedo',
    normalMap: 'Character_Normal',
  },
  {
    id: 'detail-material',
    name: 'Accessory_Detail',
    shaderType: 'PBR',
    previewClass: 'bg-slate-500',
    roughness: 0.28,
    metallic: 0.12,
    albedoMap: 'Detail_Albedo',
    normalMap: 'Detail_Normal',
  },
];

const DEFAULT_BEHAVIOR_NODES: BehaviorNode[] = [
  {
    id: 'start',
    title: 'ON START',
    subTitle: 'Runtime entry',
    headerColor: 'bg-emerald-900/80',
    x: 50,
    y: 70,
    width: 170,
    inputs: [],
    outputs: [{ id: 'exec-out', label: 'Exec', type: 'exec' }],
    isActive: true,
  },
  {
    id: 'perception',
    title: 'AI PERCEPTION',
    subTitle: 'Vision + awareness',
    headerColor: 'bg-sky-900/80',
    x: 280,
    y: 80,
    width: 200,
    inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
    outputs: [{ id: 'exec-out', label: 'Detected', type: 'exec' }],
    isActive: true,
  },
  {
    id: 'dialogue',
    title: 'DIALOGUE',
    subTitle: 'NPC response',
    headerColor: 'bg-purple-900/80',
    x: 545,
    y: 80,
    width: 195,
    inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
    outputs: [{ id: 'exec-out', label: 'Complete', type: 'exec' }],
  },
];

const DEFAULT_CONNECTIONS: GraphConnection[] = [
  {
    id: 'start-perception',
    fromNodeId: 'start',
    fromPinId: 'exec-out',
    toNodeId: 'perception',
    toPinId: 'exec-in',
    color: '#e4e4e7',
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
];

const createLog = (level: ConsoleLogEntry['level'], message: string): ConsoleLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  timestamp: new Date().toLocaleTimeString([], { hour12: false }),
  level,
  message,
});

const fieldClass =
  'h-6 w-full rounded-sm border border-[#4b4b4b] bg-[#242424] px-1.5 text-[10px] text-zinc-200 outline-none focus:border-sky-500';

export const ReferenceEditorShell: React.FC<ReferenceEditorShellProps> = ({
  viewport,
  selectedItem,
  onSelectItem,
  npcNames,
  objectCount,
}) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const [bottomTab, setBottomTab] = useState<BottomTab>('Assets');
  const [propertyTab, setPropertyTab] = useState<PropertyTab>('Materials');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const [materials, setMaterials] = useState<PBRMaterial[]>(DEFAULT_MATERIALS);
  const [behaviorNodes, setBehaviorNodes] = useState<BehaviorNode[]>(DEFAULT_BEHAVIOR_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('perception');
  const [motionPreset, setMotionPreset] = useState<NpcMotionPreset>('idle');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [lastAction, setLastAction] = useState('Ready');
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([
    createLog('SUCCESS', 'Spatial Composer editor initialized'),
    createLog('NEURAL', 'NPC behavior runtime ready'),
  ]);

  const sceneCharacters = useMemo(() => npcNames.slice(0, 4), [npcNames]);

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
        x: 200 + current.length * 60,
        y: 210,
        width: 195,
        inputs: [{ id: 'exec-in', label: 'Exec', type: 'exec' }],
        outputs: [{ id: 'exec-out', label: 'Complete', type: 'exec' }],
      },
    ]);
    setSelectedNodeId(id);
  };

  const updateTransform = (key: keyof TransformState, value: number) => {
    setTransform((current) => ({ ...current, [key]: value }));
  };

  const updateMaterial = (id: string, key: 'roughness' | 'metallic', value: number) => {
    setMaterials((current) =>
      current.map((material) => (material.id === id ? { ...material, [key]: value } : material)),
    );
  };

  const assetTiles = [
    ['Materials', 'folder'],
    ['Textures', 'folder'],
    ['Characters', 'character'],
    ['Terrain', 'terrain'],
    ['Light_Rig', 'light'],
    ['Asset_Ram', 'mesh'],
    ['Rig_Adventure', 'character'],
    ['Animation_Idle', 'animation'],
    ['Scene_Materials', 'material'],
    ['Workshop', 'mesh'],
  ] as const;

  const dockTools: Array<{ id: ActiveTool | 'sculpt' | 'paint' | 'material' | 'measure'; label: string; icon: React.ReactNode }> = [
    { id: 'select', label: 'Select\nMode', icon: <MousePointer2 className="h-6 w-6" /> },
    { id: 'sculpt', label: 'Sculpt\nBrush', icon: <Sparkles className="h-6 w-6" /> },
    { id: 'paint', label: 'Texture\nPaint', icon: <Palette className="h-6 w-6" /> },
    { id: 'material', label: 'Material\nPicker', icon: <Box className="h-6 w-6" /> },
    { id: 'measure', label: 'Measure\nDistance', icon: <Grid3X3 className="h-6 w-6" /> },
  ];

  const renderAssetIcon = (type: string) => {
    if (type === 'folder') return <Folder className="h-8 w-8 text-zinc-200" />;
    if (type === 'character') return <User className="h-8 w-8 text-zinc-200" />;
    if (type === 'animation') return <Activity className="h-8 w-8 text-zinc-200" />;
    if (type === 'material') return <Palette className="h-8 w-8 text-zinc-200" />;
    return <Box className="h-8 w-8 text-zinc-200" />;
  };

  return (
    <div
      className="h-screen w-full overflow-hidden bg-[#1c1c1c] text-zinc-100 flex flex-col font-sans"
      onClick={() => openMenu && setOpenMenu(null)}
    >
      <header className="h-[45px] shrink-0 border-b border-[#525252] bg-[#242424] flex items-stretch relative z-50">
        <div className="w-[43%] min-w-[420px] px-2 py-1 flex flex-col justify-center leading-tight">
          <div className="text-[14px] font-medium tracking-tight">SPATIAL COMPOSER: V4.1 - HYBRID PROJECT: AQUATIC ADVENTURE</div>
          <div className="text-[11px] text-zinc-300">Built according to the component layout map</div>
        </div>

        <div className="ml-auto flex items-center gap-1 px-2">
          {MENU_ITEMS.map((item) => (
            <div className="relative h-full" key={item}>
              <button
                className="h-full px-2.5 text-[12px] hover:bg-[#343434]"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenu((current) => (current === item ? null : item));
                }}
              >
                {item}
              </button>
              {openMenu === item && (
                <div className="absolute top-full left-0 min-w-40 border border-[#555] bg-[#292929] shadow-xl py-1">
                  {['New', 'Open', 'Save', 'Project Settings'].map((action) => (
                    <button
                      key={action}
                      className="block w-full px-3 py-1.5 text-left text-[11px] hover:bg-[#414141]"
                      onClick={() => {
                        setLastAction(`${item}: ${action}`);
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

          <button
            onClick={() => {
              setBottomTab('AI Graph');
              setLastAction('AI graph opened');
            }}
            className="ml-2 h-7 rounded border border-sky-700 bg-sky-900/70 px-2 text-[11px] flex items-center gap-1"
          >
            AI <ChevronDown className="h-3 w-3" />
          </button>
          <div className="ml-2 flex items-center gap-2 border-l border-[#4d4d4d] pl-3">
            <div className="h-8 w-8 rounded-full border-2 border-sky-500 bg-slate-700 flex items-center justify-center text-[10px] font-semibold">AI</div>
            <div className="text-right leading-tight">
              <div className="text-[11px]">AI</div>
              <div className="text-[10px] text-zinc-400">Avatar</div>
            </div>
          </div>
        </div>
      </header>

      <div className="h-[41px] shrink-0 bg-[#303030] border-b border-[#555] flex items-center px-2 gap-1.5">
        {([
          ['select', <MousePointer2 className="h-4 w-4" />, 'Select'],
          ['move', <Move3D className="h-4 w-4" />, 'Move'],
          ['rotate', <RotateCw className="h-4 w-4" />, 'Rotate'],
          ['scale', <Scaling className="h-4 w-4" />, 'Scale'],
        ] as const).map(([tool, icon, label]) => (
          <button
            key={tool}
            onClick={() => {
              setActiveTool(tool);
              setLastAction(`${label} tool`);
            }}
            className={`h-7 px-2 flex items-center gap-1 text-[11px] border ${
              activeTool === tool ? 'bg-[#425f78] border-[#6b94b3]' : 'bg-[#292929] border-[#444] hover:bg-[#3a3a3a]'
            }`}
          >
            {icon} {label}
          </button>
        ))}

        <div className="ml-2 flex items-center gap-1 text-[11px]">
          <span className="text-zinc-300">Pivot:</span>
          <button className="h-6 bg-[#242424] border border-[#444] px-2">Center <ChevronDown className="inline h-3 w-3" /></button>
          <span className="ml-2 text-zinc-300">Snap:</span>
          <button className="h-6 bg-[#242424] border border-[#444] px-2">On <ChevronDown className="inline h-3 w-3" /></button>
          <span className="ml-2 text-zinc-300">Grid:</span>
          <button className="h-6 bg-[#242424] border border-[#444] px-2">1m</button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setSimulationState('playing')} className={`p-1.5 ${playState === 'playing' ? 'bg-emerald-900/70' : 'hover:bg-[#444]'}`} title="Play"><Play className="h-4 w-4" /></button>
          <button onClick={() => setSimulationState('paused')} className={`p-1.5 ${playState === 'paused' ? 'bg-amber-900/70' : 'hover:bg-[#444]'}`} title="Pause"><Pause className="h-4 w-4" /></button>
          <button onClick={() => setSimulationState('stopped')} className="p-1.5 hover:bg-[#444]" title="Stop"><CircleStop className="h-4 w-4" /></button>
        </div>
      </div>

      <main
        className="flex-1 min-h-0 grid"
        style={{
          gridTemplateColumns: '148px minmax(0, 1fr) 318px',
          gridTemplateRows: 'minmax(0, 1fr) 258px',
          gridTemplateAreas: '"dock viewport side" "dock bottom side"',
        }}
      >
        <aside style={{ gridArea: 'dock' }} className="min-h-0 border-r border-[#505050] bg-[#252525] flex flex-col">
          <div className="h-8 border-b border-[#505050] flex items-center px-3 text-[12px]">Left Tool Dock</div>
          <div className="p-2 space-y-2">
            {dockTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  if (tool.id === 'select') setActiveTool('select');
                  setLastAction(String(tool.id));
                }}
                className={`w-full min-h-[54px] border flex items-center gap-2 px-2 text-left ${
                  tool.id === activeTool ? 'bg-[#466681] border-[#6e9abe]' : 'bg-[#303030] border-[#414141] hover:bg-[#393939]'
                }`}
              >
                <div className="h-9 w-9 bg-[#3c5369] border border-[#587897] flex items-center justify-center">{tool.icon}</div>
                <span className="whitespace-pre-line text-[11px] leading-tight">+ {tool.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-auto pb-6 text-center text-[12px] text-zinc-300">Left Tool Dock</div>
        </aside>

        <section style={{ gridArea: 'viewport' }} className="relative min-h-0 min-w-0 overflow-hidden bg-black border-r border-[#505050]">
          <div className="absolute inset-x-0 top-0 h-7 z-20 bg-[#252525]/95 border-b border-[#505050] flex items-center px-2 text-[10px]">
            <div className="flex items-center gap-2">
              <span>▾</span>
              <span>Perspective</span>
              <span>Camera Gizmo (360)</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-zinc-300">
              <Camera className="h-3.5 w-3.5" />
              <span>Lit</span>
              <Grid3X3 className="h-3.5 w-3.5" />
              <Maximize2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="absolute inset-0 pt-7">{viewport}</div>
          <div className="absolute top-9 left-3 z-20 text-[10px] leading-tight pointer-events-none">
            <div>Perspective</div>
            <div>Camera Gizmo (360)</div>
          </div>
          <div className="absolute top-9 left-1/2 -translate-x-1/2 z-20 text-[12px] bg-black/30 px-2 py-0.5 pointer-events-none">Main 3D Viewport</div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-[11px] bg-black/45 px-2 py-1 pointer-events-none">Active Object Gizmo</div>
        </section>

        <aside style={{ gridArea: 'side' }} className="min-h-0 min-w-0 bg-[#252525] flex flex-col">
          <section className="h-[42%] min-h-[210px] border-b border-[#555] flex flex-col">
            <div className="h-8 shrink-0 border-b border-[#555] px-3 flex items-center justify-between text-[12px]">
              <span>Outliner</span>
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <div className="h-7 shrink-0 border-b border-[#444] px-2 flex items-center gap-1 bg-[#202020]">
              <Search className="h-3.5 w-3.5 text-zinc-500" />
              <input className="w-full bg-transparent text-[10px] outline-none" placeholder="AI" />
            </div>
            <div className="flex-1 overflow-y-auto p-1 text-[10px]">
              <div className="flex items-center gap-1 px-1 py-0.5 text-zinc-200"><ChevronDown className="h-3 w-3" /><Box className="h-3 w-3" /> Scene: Aquatic Habitat</div>
              <div className="ml-4 flex items-center gap-1 px-1 py-0.5"><ChevronDown className="h-3 w-3" /><Folder className="h-3 w-3 text-amber-300" /> Inside Elements</div>
              {['Command Console', ...sceneCharacters, 'NPC: Ninja', 'Accessory: Terrier Dog', 'Viewing Port', 'Light Fixtures'].map((name, index) => (
                <button
                  key={`${name}-${index}`}
                  onClick={() => {
                    const matchIndex = npcNames.indexOf(name);
                    onSelectItem(matchIndex >= 0 ? `character-${matchIndex}` : `scene-${index}`, name);
                  }}
                  className={`ml-8 w-[calc(100%-2rem)] flex items-center gap-1 px-1 py-0.5 text-left ${
                    selectedItem === name ? 'bg-[#395f87] text-white' : 'hover:bg-[#343434]'
                  }`}
                >
                  {name.includes('NPC') || npcNames.includes(name) ? <User className="h-3 w-3" /> : <Box className="h-3 w-3" />}
                  <span className="truncate">{name}</span>
                </button>
              ))}
              <div className="mt-1 ml-4 flex items-center gap-1 px-1 py-0.5"><ChevronDown className="h-3 w-3" /><Folder className="h-3 w-3 text-amber-300" /> Outside Elements</div>
              {['Ocean Floor', 'Skybox', 'Terrain'].map((name, index) => (
                <button key={name} onClick={() => onSelectItem(`outside-${index}`, name)} className="ml-8 w-[calc(100%-2rem)] flex items-center gap-1 px-1 py-0.5 text-left hover:bg-[#343434]"><Box className="h-3 w-3" />{name}</button>
              ))}
            </div>
          </section>

          <section className="flex-1 min-h-0 flex flex-col">
            <div className="h-8 shrink-0 border-b border-[#555] px-3 flex items-center justify-between text-[12px]">
              <span>Properties</span>
              <span className="text-zinc-500 text-[10px]">{selectedItem || 'Character'}</span>
            </div>
            <div className="h-7 shrink-0 border-b border-[#444] flex items-center text-[10px] bg-[#222]">
              {(['Transform', 'Materials', 'Animator'] as PropertyTab[]).map((tab) => (
                <button key={tab} onClick={() => setPropertyTab(tab)} className={`h-full px-3 border-r border-[#444] ${propertyTab === tab ? 'bg-[#363636] text-white' : 'text-zinc-400'}`}>{tab}</button>
              ))}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-2 text-[10px]">
              {propertyTab === 'Transform' && (
                <div className="space-y-2">
                  {([
                    ['Position X', 'posX'], ['Position Y', 'posY'], ['Position Z', 'posZ'],
                    ['Rotation X', 'rotX'], ['Rotation Y', 'rotY'], ['Rotation Z', 'rotZ'],
                    ['Scale X', 'scaleX'], ['Scale Y', 'scaleY'], ['Scale Z', 'scaleZ'],
                  ] as Array<[string, keyof TransformState]>).map(([label, key]) => (
                    <label key={key} className="grid grid-cols-[90px_1fr] items-center gap-2"><span>{label}</span><input className={fieldClass} type="number" step="0.01" value={transform[key]} onChange={(event) => updateTransform(key, Number(event.target.value))} /></label>
                  ))}
                </div>
              )}

              {propertyTab === 'Materials' && (
                <div className="space-y-3">
                  <div className="border border-[#484848] bg-[#2c2c2c] p-2">
                    <div className="text-[11px] mb-2">Adventure Girl</div>
                    <div className="grid grid-cols-[92px_1fr] gap-y-1.5 items-center">
                      <span>Shader</span><select className={fieldClass}><option>GGX</option></select>
                      <span>Lighting</span><select className={fieldClass}><option>Christensen-Burley</option></select>
                    </div>
                  </div>
                  {materials.map((material) => (
                    <div key={material.id} className="border-t border-[#444] pt-2 space-y-1.5">
                      <div className="flex items-center gap-2"><div className={`h-3 w-3 rounded-full ${material.previewClass}`} /><span>{material.name}</span></div>
                      <label className="grid grid-cols-[92px_1fr] items-center gap-2"><span>Metallic</span><input className={fieldClass} type="number" step="0.01" min="0" max="1" value={material.metallic} onChange={(event) => updateMaterial(material.id, 'metallic', Number(event.target.value))} /></label>
                      <label className="grid grid-cols-[92px_1fr] items-center gap-2"><span>Roughness</span><input className={fieldClass} type="number" step="0.01" min="0" max="1" value={material.roughness} onChange={(event) => updateMaterial(material.id, 'roughness', Number(event.target.value))} /></label>
                      <label className="grid grid-cols-[92px_1fr] items-center gap-2"><span>Specular</span><input className={fieldClass} type="number" step="0.01" defaultValue="0.555" /></label>
                      <label className="grid grid-cols-[92px_1fr] items-center gap-2"><span>Sheen</span><input className={fieldClass} type="number" step="0.01" defaultValue="0.168" /></label>
                    </div>
                  ))}
                </div>
              )}

              {propertyTab === 'Animator' && (
                <div className="space-y-2">
                  <div className="border border-[#484848] bg-[#2b2b2b] p-2">Animation Controller</div>
                  {['Idle', 'Walk', 'Dialogue_Gesture', 'Climb', 'Attack'].map((clip) => (
                    <button key={clip} onClick={() => setLastAction(`Animation: ${clip}`)} className="w-full border border-[#444] bg-[#292929] px-2 py-1.5 text-left hover:bg-[#383838]">◆ {clip}</button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </aside>

        <section style={{ gridArea: 'bottom' }} className="min-h-0 min-w-0 border-t border-[#555] border-r border-[#505050] bg-[#242424] flex flex-col">
          <div className="h-7 shrink-0 border-b border-[#555] bg-[#2b2b2b] flex items-center text-[10px]">
            {(['Assets', 'Animation', 'AI Graph', 'Console'] as BottomTab[]).map((tab) => (
              <button key={tab} onClick={() => setBottomTab(tab)} className={`h-full px-3 border-r border-[#4a4a4a] ${bottomTab === tab ? 'bg-[#3a3a3a] text-white' : 'text-zinc-400 hover:text-white'}`}>{tab}</button>
            ))}
          </div>

          {bottomTab === 'Assets' && (
            <div className="flex-1 min-h-0 grid grid-cols-[210px_1fr]">
              <div className="border-r border-[#505050] overflow-y-auto p-2 text-[10px]">
                <div className="mb-1 font-medium">Adventurer</div>
                {['Camera', 'Main', 'Staff', 'Climbing', 'Boots', 'Ninja_Dirt', 'Rig_Adventure', 'Animation_Climb', 'Animation_Idle'].map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-1 py-0.5 text-zinc-300"><ChevronRight className="h-3 w-3 text-zinc-500" /><Folder className="h-3 w-3 text-zinc-400" />{item}</div>
                ))}
              </div>
              <div className="min-w-0 flex flex-col">
                <div className="h-7 shrink-0 border-b border-[#444] px-2 flex items-center gap-2 text-[10px]"><span className="text-zinc-400">Assets</span><span>›</span><span>Quick Access</span><div className="ml-auto w-64 h-5 bg-[#1f1f1f] border border-[#444] flex items-center px-2"><Search className="h-3 w-3 text-zinc-500 mr-1" /><span className="text-zinc-600">Search</span></div></div>
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden p-3 flex items-start gap-3">
                  {assetTiles.map(([name, type]) => (
                    <button key={name} onClick={() => setLastAction(`Asset selected: ${name}`)} className="w-[62px] shrink-0 text-center group">
                      <div className="h-[54px] w-[54px] mx-auto bg-gradient-to-br from-[#5d6770] to-[#252a2f] border border-[#5b5b5b] flex items-center justify-center group-hover:border-sky-500">{renderAssetIcon(type)}</div>
                      <div className="mt-1 truncate text-[9px] text-zinc-300">{name}</div>
                    </button>
                  ))}
                </div>
                <div className="h-34 shrink-0 border-t border-[#4a4a4a] relative overflow-hidden bg-[#202020]">
                  <div className="absolute inset-x-0 top-0 h-5 border-b border-[#3f3f3f] flex items-center px-2 text-[9px] text-zinc-400">Timeline</div>
                  <div className="absolute left-0 right-0 top-5 bottom-0 bg-[linear-gradient(to_right,transparent_0,transparent_49px,#343434_50px),linear-gradient(to_bottom,transparent_0,transparent_23px,#343434_24px)] bg-[length:50px_100%,100%_24px]" />
                  {[310, 645, 720].map((left, index) => <div key={left} className="absolute top-8 h-3 w-3 rotate-45 bg-amber-300 border border-amber-600" style={{ left: `${Math.min(left / 10, 86)}%`, top: `${32 + index * 23}px` }} />)}
                </div>
              </div>
            </div>
          )}

          {bottomTab === 'Animation' && (
            <div className="flex-1 min-h-0 bg-[#202020] p-3">
              <div className="text-[10px] text-zinc-300 mb-2">Animation Timeline — {selectedItem || 'Adventure Girl'}</div>
              <div className="relative h-[calc(100%-28px)] border border-[#444] bg-[linear-gradient(to_right,transparent_0,transparent_49px,#343434_50px),linear-gradient(to_bottom,transparent_0,transparent_27px,#343434_28px)] bg-[length:50px_100%,100%_28px]">
                {[18, 44, 63, 79].map((left, index) => <div key={left} className="absolute h-3 w-3 rotate-45 bg-amber-300 border border-amber-600" style={{ left: `${left}%`, top: `${22 + index * 28}px` }} />)}
              </div>
            </div>
          )}

          {bottomTab === 'AI Graph' && (
            <div className="flex-1 min-h-0">
              <BehaviorGraphEditor
                nodes={behaviorNodes}
                connections={DEFAULT_CONNECTIONS}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onNodeMove={handleGraphMove}
                isPlaying={playState === 'playing'}
                onAddNode={handleGraphAdd}
              />
            </div>
          )}

          {bottomTab === 'Console' && (
            <div className="flex-1 min-h-0">
              <DebugConsole
                logs={logs}
                onClearLogs={() => setLogs([])}
                isOpen
                onToggleOpen={() => undefined}
                motionPreset={motionPreset}
                onSelectMotionPreset={setMotionPreset}
                playbackSpeed={playbackSpeed}
                onSelectPlaybackSpeed={setPlaybackSpeed}
              />
            </div>
          )}
        </section>
      </main>

      <footer className="h-[22px] shrink-0 border-t border-[#555] bg-[#2b2b2b] px-2 flex items-center text-[10px] text-zinc-300">
        <Terminal className="h-3 w-3 mr-1" />
        <span>Status Bar</span>
        <span className="ml-auto">Verts: 36,789 | Edges: 62,341 | Selected: {selectedItem || 'Adventure Girl'} | Objects: {objectCount} | {lastAction}</span>
      </footer>
    </div>
  );
};

export default ReferenceEditorShell;
