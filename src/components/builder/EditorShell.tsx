import React, { useMemo, useState } from 'react';
import {
  Box,
  ChevronDown,
  CircleStop,
  Grid3X3,
  Maximize2,
  Move3D,
  Pause,
  Play,
  RotateCw,
  Save,
  Settings2,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { AssetBrowser } from './LeftPanel/AssetBrowser';
import type { TreeItem } from './types';

interface EditorShellProps {
  viewport: React.ReactNode;
  selectedItem: string;
  onSelectItem: (id: string, name: string) => void;
  npcNames: string[];
  objectCount: number;
}

const MENU_ITEMS = ['File', 'Edit', 'View', 'Build', 'AI', 'AI Tools', 'Layout', 'Help'];

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

export const EditorShell: React.FC<EditorShellProps> = ({
  viewport,
  selectedItem,
  onSelectItem,
  npcNames,
  objectCount,
}) => {
  const initialTree = useMemo(() => createInitialTree(npcNames), [npcNames]);
  const [treeData, setTreeData] = useState<TreeItem[]>(initialTree);

  React.useEffect(() => {
    setTreeData(createInitialTree(npcNames));
  }, [npcNames]);

  const handleToggleFolder = (id: string) => {
    setTreeData((current) => toggleFolderRecursive(current, id));
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#09090b] text-zinc-200 flex flex-col">
      <header className="h-8 shrink-0 bg-[#111114] border-b border-zinc-800 flex items-center px-2 text-[11px]">
        <div className="w-7 h-7 mr-2 rounded-full border border-sky-500/50 bg-sky-950/60 flex items-center justify-center font-bold text-sky-300">
          AI
        </div>
        <div className="flex items-center h-full">
          {MENU_ITEMS.map((item) => (
            <button
              key={item}
              className="h-full px-2.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-zinc-500 font-mono">
          <span>NPC-AI-SIM</span>
          <span className="text-emerald-400">● LIVE</span>
        </div>
      </header>

      <div className="h-10 shrink-0 bg-[#161619] border-b border-zinc-800 flex items-center px-2 gap-1.5">
        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300" title="Save">
          <Save className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-zinc-700 mx-1" />
        <button className="p-1.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-300" title="Select / Move">
          <Move3D className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300" title="Rotate">
          <RotateCw className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300" title="Grid">
          <Grid3X3 className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-zinc-700 mx-1" />
        <button className="p-1.5 rounded hover:bg-zinc-800 text-emerald-400" title="Play">
          <Play className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400" title="Pause">
          <Pause className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-800 text-rose-400" title="Stop">
          <CircleStop className="w-4 h-4" />
        </button>
        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span className="px-2 py-1 rounded border border-zinc-800 bg-zinc-950">Lit</span>
          <span className="px-2 py-1 rounded border border-zinc-800 bg-zinc-950">Perspective</span>
          <button className="p-1.5 rounded hover:bg-zinc-800" title="Layout settings">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 grid"
        style={{
          gridTemplateColumns: '270px minmax(420px, 1fr) minmax(340px, 31vw)',
          gridTemplateRows: 'minmax(0, 1fr) 150px',
          gridTemplateAreas: '"left viewport graph" "left console console"',
        }}
      >
        <section
          className="min-h-0 border-r border-zinc-800 bg-[#101014]"
          style={{ gridArea: 'left' }}
        >
          <AssetBrowser
            treeData={treeData}
            selectedItem={selectedItem}
            onSelectItem={onSelectItem}
            onToggleFolder={handleToggleFolder}
          />
        </section>

        <section
          className="relative min-h-0 min-w-0 bg-black border-r border-zinc-800"
          style={{ gridArea: 'viewport' }}
        >
          <div className="absolute inset-x-0 top-0 h-7 z-20 bg-[#111114]/95 border-b border-zinc-800 flex items-center px-2 justify-between text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">VIEWPORT</span>
              <span className="text-sky-300">NPC_CHARACTER</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <span>WebGL</span>
              <span className="text-emerald-400">60 FPS</span>
              <span>{objectCount} objects</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="absolute inset-0 pt-7">{viewport}</div>
        </section>

        <section
          className="min-h-0 min-w-0 flex flex-col bg-[#0d0d11]"
          style={{ gridArea: 'graph' }}
        >
          <div className="h-8 shrink-0 border-b border-zinc-800 bg-[#141417] flex items-center px-3 gap-2 text-[11px] font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI BEHAVIOR GRAPH EDITOR</span>
            <ChevronDown className="ml-auto w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex-1 relative overflow-hidden blueprint-grid-dense">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M 88 92 C 165 92, 160 155, 235 155" stroke="#38bdf8" strokeWidth="2" fill="none" />
              <path d="M 235 155 C 305 155, 300 245, 365 245" stroke="#a855f7" strokeWidth="2" fill="none" />
              <path d="M 235 155 C 305 155, 300 335, 365 335" stroke="#22c55e" strokeWidth="2" fill="none" />
            </svg>

            <div className="absolute left-5 top-12 w-32 rounded border border-zinc-600 bg-[#1a1a1f] shadow-xl">
              <div className="px-2 py-1 bg-emerald-950/70 border-b border-emerald-800/60 text-[10px] font-semibold text-emerald-200">
                ON START
              </div>
              <div className="p-2 text-[10px] text-zinc-400">Begin NPC runtime</div>
            </div>

            <div className="absolute left-[42%] top-[23%] w-40 rounded border border-sky-800/70 bg-[#18181d] shadow-xl">
              <div className="px-2 py-1 bg-sky-950/80 border-b border-sky-800/70 text-[10px] font-semibold text-sky-200">
                AI PERCEPTION
              </div>
              <div className="p-2 space-y-1 text-[10px] text-zinc-300">
                <div>Vision: Enabled</div>
                <div>State: Idle</div>
              </div>
            </div>

            <div className="absolute right-5 top-[43%] w-40 rounded border border-purple-800/70 bg-[#18181d] shadow-xl">
              <div className="px-2 py-1 bg-purple-950/80 border-b border-purple-800/70 text-[10px] font-semibold text-purple-200">
                DIALOGUE
              </div>
              <div className="p-2 text-[10px] text-zinc-300">Render NPC response</div>
            </div>

            <div className="absolute right-5 top-[67%] w-40 rounded border border-emerald-800/70 bg-[#18181d] shadow-xl">
              <div className="px-2 py-1 bg-emerald-950/80 border-b border-emerald-800/70 text-[10px] font-semibold text-emerald-200">
                PLAY ANIMATION
              </div>
              <div className="p-2 text-[10px] text-zinc-300">Idle / gesture state</div>
            </div>
          </div>
        </section>

        <section
          className="min-w-0 min-h-0 border-t border-zinc-800 bg-[#09090b] flex flex-col"
          style={{ gridArea: 'console' }}
        >
          <div className="h-7 shrink-0 border-b border-zinc-800 bg-[#141417] flex items-center px-3 gap-2 text-[10px] font-mono">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-300 font-semibold">DEBUG CONSOLE</span>
            <span className="ml-auto text-zinc-500">WebRTC: connected</span>
          </div>
          <div className="flex-1 overflow-hidden px-3 py-2 font-mono text-[10px] leading-5">
            <div><span className="text-zinc-600">[runtime]</span> <span className="text-emerald-400">NPC editor shell ready</span></div>
            <div><span className="text-zinc-600">[scene]</span> <span className="text-zinc-300">{objectCount} NPC objects loaded</span></div>
            <div><span className="text-zinc-600">[selection]</span> <span className="text-sky-300">{selectedItem || 'none'}</span></div>
          </div>
        </section>
      </div>

      <footer className="h-5 shrink-0 bg-[#111114] border-t border-zinc-800 flex items-center px-2 text-[9px] font-mono text-zinc-500">
        <Box className="w-3 h-3 mr-1.5" />
        <span>NPC-AI-SIM Editor</span>
        <span className="mx-2">|</span>
        <span>Renderer: Three.js / WebGL</span>
        <span className="ml-auto text-emerald-400">READY</span>
      </footer>
    </div>
  );
};

export default EditorShell;
