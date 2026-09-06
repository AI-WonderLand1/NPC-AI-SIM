import React, { useMemo, useState } from 'react';
import { ArrowRight, Box, Plus, Search, Sparkles, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface NPCAsset {
  id: string;
  name: string;
  description: string;
  type: 'humanoid' | 'creature' | 'vehicle' | 'prop';
  personality: string[];
  thumbnail: string;
  tags: string[];
  previewImages: string[];
  modelUrl?: string;
  defaultAnimation?: string;
  stats: {
    health: number;
    speed: number;
    intelligence: number;
    combat: number;
  };
  aiConfig: {
    behaviorTree: string;
    perceptionRange: number;
    decisionInterval: number;
  };
}

export const npcAssets: NPCAsset[] = [
  {
    id: 'guardian',
    name: 'Guardian Knight',
    description: 'A loyal protector with tactical combat AI. Patrols areas, defends allies, and engages threats intelligently.',
    type: 'humanoid',
    personality: ['Brave', 'Loyal', 'Tactical', 'Protective'],
    thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guardian-knight&backgroundColor=3b82f6,1e40af',
    tags: ['Combat', 'Patrol', 'Teamplay'],
    previewImages: [],
    modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb',
    defaultAnimation: 'idle',
    stats: { health: 100, speed: 5, intelligence: 7, combat: 9 },
    aiConfig: { behaviorTree: 'GuardianPatrol', perceptionRange: 15, decisionInterval: 500 },
  },
  {
    id: 'merchant',
    name: 'Wandering Merchant',
    description: 'An intelligent trader who evaluates inventory, offers dynamic pricing, and remembers past transactions.',
    type: 'humanoid',
    personality: ['Cunning', 'Friendly', 'Opportunistic', 'Memorable'],
    thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wandering-merchant&backgroundColor=f59e0b,d97706',
    tags: ['Trading', 'Economy', 'Dialogue'],
    previewImages: [],
    modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb',
    defaultAnimation: 'idle',
    stats: { health: 50, speed: 4, intelligence: 9, combat: 2 },
    aiConfig: { behaviorTree: 'MerchantTrade', perceptionRange: 10, decisionInterval: 1000 },
  },
  {
    id: 'beast',
    name: 'Shadow Beast',
    description: 'A territorial predator with pack hunting AI that flanks prey and adapts to player tactics.',
    type: 'creature',
    personality: ['Aggressive', 'Cunning', 'Territorial', 'Pack-oriented'],
    thumbnail: 'https://api.dicebear.com/7.x//avataaars/svg?seed=shadow-beast&backgroundColor=ef4444,dc2626'.replace('/7.x//', '/7.x/'),
    tags: ['Combat', 'Hunting', 'Stealth'],
    previewImages: [],
    modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Horse.glb',
    stats: { health: 80, speed: 8, intelligence: 6, combat: 8 },
    aiConfig: { behaviorTree: 'PredatorHunt', perceptionRange: 20, decisionInterval: 300 },
  },
  {
    id: 'drone',
    name: 'Scout Drone',
    description: 'Autonomous aerial recon unit that surveys areas, detects threats, and relays tactical data.',
    type: 'vehicle',
    personality: ['Vigilant', 'Precise', 'Relentless', 'Efficient'],
    thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=scout-drone&backgroundColor=8b5cf6,7c3aed',
    tags: ['Recon', 'Vision', 'Support'],
    previewImages: [],
    modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/PrimaryIonDrive.glb',
    stats: { health: 40, speed: 12, intelligence: 8, combat: 3 },
    aiConfig: { behaviorTree: 'DroneSurvey', perceptionRange: 30, decisionInterval: 200 },
  },
  {
    id: 'villager',
    name: 'Village Elder',
    description: 'A wise conversational NPC that can offer quests, share lore, and react to world-state changes.',
    type: 'humanoid',
    personality: ['Wise', 'Compassionate', 'Knowledgeable', 'Patient'],
    thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=village-elder&backgroundColor=22c55e,16a34a',
    tags: ['Quest', 'Dialogue', 'Lore'],
    previewImages: [],
    modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb',
    defaultAnimation: 'idle',
    stats: { health: 60, speed: 3, intelligence: 10, combat: 1 },
    aiConfig: { behaviorTree: 'ElderDialogue', perceptionRange: 8, decisionInterval: 2000 },
  },
  {
    id: 'sentry',
    name: 'Automated Sentry',
    description: 'A stationary defense unit with threat assessment, target prioritization, and network coordination.',
    type: 'prop',
    personality: ['Vigilant', 'Ruthless', 'Calculating', 'Networked'],
    thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=automated-sentry&backgroundColor=6b7280,4b5563',
    tags: ['Defense', 'Surveillance', 'Automation'],
    previewImages: [],
    modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/BoomBox.glb',
    stats: { health: 120, speed: 0, intelligence: 7, combat: 9 },
    aiConfig: { behaviorTree: 'SentryDefense', perceptionRange: 25, decisionInterval: 100 },
  },
];

export type FilterType = 'all' | NPCAsset['type'];

const FILTERS: Array<{ value: FilterType; label: string }> = [
  { value: 'all', label: 'All NPCs' },
  { value: 'humanoid', label: 'Humanoids' },
  { value: 'creature', label: 'Creatures' },
  { value: 'vehicle', label: 'Vehicles' },
  { value: 'prop', label: 'Props' },
];

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<NPCAsset['type']>('humanoid');
  const [role, setRole] = useState('Companion');

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return npcAssets.filter((asset) => {
      const matchesFilter = filter === 'all' || asset.type === filter;
      const matchesSearch = !query ||
        asset.name.toLowerCase().includes(query) ||
        asset.description.toLowerCase().includes(query) ||
        asset.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const createNpc = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({
      name: name.trim() || 'Untitled AI Character',
      prompt: prompt.trim(),
      type,
      role,
    });
    navigate(`/builder/new?${params.toString()}`);
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#090b10] text-zinc-100 custom-scrollbar">
      <header className="sticky top-0 z-40 border-b border-zinc-800/90 bg-[#0d1016]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-5 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-sky-500/40 bg-sky-500/10 shadow-[0_0_24px_rgba(14,165,233,0.12)]">
              <Sparkles className="h-4.5 w-4.5 text-sky-300" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[11px] uppercase tracking-[0.22em] text-sky-400">AI Wonderland</div>
              <div className="truncate text-sm font-semibold text-white">NPC-AI-SIM</div>
            </div>
          </div>

          <div className="hidden h-8 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/70 px-3 text-[10px] text-zinc-500 md:flex">
            <span className="text-sky-300">1 Library / Create</span>
            <span>→</span>
            <span>2 Editor</span>
            <span>→</span>
            <span>3 Test / Export</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden rounded border border-emerald-900/60 bg-emerald-950/30 px-2 py-1 text-[10px] text-emerald-300 sm:block">
              AIW Gateway ready for provider integration
            </div>
            <Link
              to="/builder"
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px] font-medium text-zinc-200 hover:border-sky-700 hover:text-white"
            >
              Open Editor
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <div className="mb-5 rounded-xl border border-zinc-800 bg-gradient-to-br from-[#111722] via-[#0d1118] to-[#0a0c11] p-5 shadow-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-sky-400">Character Library</div>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Pick an NPC or create a new one.</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                  Existing characters open directly in the editor. New characters use the compact creation panel—no extra detail page or setup wizard.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1">{npcAssets.length} starter assets</span>
                <span className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1">GLB / GLTF viewport</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 lg:flex-row">
              <label className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search characters, roles, behaviors..."
                  className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 text-xs text-zinc-200 outline-none transition focus:border-sky-700"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className={`h-10 rounded-md border px-3 text-[10px] font-medium transition ${
                      filter === item.value
                        ? 'border-sky-600 bg-sky-950/50 text-sky-300'
                        : 'border-zinc-800 bg-zinc-950/70 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredAssets.map((asset) => (
              <Link
                key={asset.id}
                to={`/builder/${asset.id}`}
                className="group overflow-hidden rounded-lg border border-zinc-800 bg-[#101319] transition hover:-translate-y-0.5 hover:border-sky-800/80 hover:bg-[#121821] hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
              >
                <div className="grid grid-cols-[104px_1fr]">
                  <div className="relative min-h-[150px] border-r border-zinc-800 bg-gradient-to-br from-sky-950/40 via-zinc-950 to-purple-950/30 p-2">
                    <img src={asset.thumbnail} alt="" className="h-full w-full rounded object-cover opacity-90" loading="lazy" />
                    <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-zinc-300">
                      {asset.type}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-semibold text-white">{asset.name}</h2>
                        <div className="mt-0.5 text-[9px] uppercase tracking-wider text-sky-500">{asset.aiConfig.behaviorTree}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-sky-400" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-zinc-500">{asset.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {asset.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[8px] text-zinc-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center gap-3 pt-3 text-[9px] text-zinc-600">
                      <span>INT {asset.stats.intelligence}</span>
                      <span>SPD {asset.stats.speed}</span>
                      <span className="ml-auto text-sky-500 group-hover:text-sky-300">Open Editor</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {filteredAssets.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 p-12 text-center text-sm text-zinc-600">
                No NPCs match that search.
              </div>
            )}
          </div>
        </section>

        <aside className="xl:sticky xl:top-[74px] xl:self-start">
          <form onSubmit={createNpc} className="overflow-hidden rounded-xl border border-sky-900/60 bg-[#0f141c] shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="border-b border-zinc-800 bg-gradient-to-r from-sky-950/50 to-purple-950/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Plus className="h-4 w-4 text-sky-300" />
                Create New NPC
              </div>
              <p className="mt-1 text-[10px] leading-4 text-zinc-500">Four simple inputs. AI and the editor handle the rest.</p>
            </div>

            <div className="space-y-4 p-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">Character name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nova, Guard 07, Merchant..."
                  className="h-9 w-full rounded border border-zinc-800 bg-zinc-950 px-3 text-xs text-white outline-none focus:border-sky-700"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">Describe what you want</span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={5}
                  placeholder="Realistic sci-fi engineer, calm and intelligent, tactical clothing, helpful dialogue, idle and repair behaviors..."
                  className="w-full resize-none rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-5 text-white outline-none focus:border-sky-700"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">Type</span>
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value as NPCAsset['type'])}
                    className="h-9 w-full rounded border border-zinc-800 bg-zinc-950 px-2 text-[11px] text-zinc-200 outline-none focus:border-sky-700"
                  >
                    <option value="humanoid">Humanoid</option>
                    <option value="creature">Creature</option>
                    <option value="vehicle">Vehicle / Drone</option>
                    <option value="prop">Smart Prop</option>
                  </select>
                </label>

                <label>
                  <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">Role</span>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="h-9 w-full rounded border border-zinc-800 bg-zinc-950 px-2 text-[11px] text-zinc-200 outline-none focus:border-sky-700"
                  >
                    <option>Companion</option>
                    <option>Enemy</option>
                    <option>Merchant</option>
                    <option>Quest Giver</option>
                    <option>Civilian</option>
                    <option>Custom</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-sky-500/50 bg-sky-600 text-xs font-semibold text-white shadow-[0_0_24px_rgba(14,165,233,0.15)] transition hover:bg-sky-500"
              >
                <Sparkles className="h-4 w-4" />
                Create & Open Editor
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-[9px] leading-4 text-zinc-600">
                <div className="mb-1 flex items-center gap-1.5 text-zinc-400"><User className="h-3 w-3" /> No setup wizard.</div>
                <div className="flex items-center gap-1.5"><Box className="h-3 w-3" /> Mesh, materials, behaviors, voice and provider/model settings stay editable inside the engine.</div>
              </div>
            </div>
          </form>
        </aside>
      </main>
    </div>
  );
};

export default LibraryPage;
