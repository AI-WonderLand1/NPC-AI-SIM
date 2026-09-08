import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  Bot,
  Box,
  Brain,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  Folder,
  Library,
  MessageCircle,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Save,
  Search,
  Settings,
  Sparkles,
  Square,
  User,
  Volume2,
  Zap,
} from 'lucide-react';
import { createDefaultNpcBrainConfig } from '../../brain/defaultBrainConfig.js';
import { useNpcBrainConfig } from '../../brain/useNpcBrainConfig.js';
import '../../theme/npc-brain-editor.css';

interface SidebarAsset {
  id: string;
  name: string;
  thumbnail?: string;
  description?: string;
}

interface ReferenceEditorShellProps {
  selectedItem: string;
  objectCount?: number;
  viewportStatus?: string;
  viewport?: React.ReactNode;
  onSelectItem?: (id: string, name: string) => void;
  npcNames?: string[];
  npcAssets?: SidebarAsset[];
}

type PlayState = 'stopped' | 'playing' | 'paused';
type SidebarMode =
  | 'library'
  | 'create'
  | 'editor'
  | 'animations'
  | 'voice'
  | 'personality'
  | 'perception'
  | 'knowledge'
  | 'actions'
  | 'environments'
  | 'export';

type ConfigTab =
  | 'Details'
  | 'AI Brain'
  | 'Personality'
  | 'Memory'
  | 'Perception'
  | 'Knowledge / RAG'
  | 'Voice'
  | 'Actions'
  | 'Integrations';

type BrainEditorState = ReturnType<typeof useNpcBrainConfig>;

const GLOBAL_NAV = ['WonderBuild', 'WonderSpace', 'AI Playground', '3D Studio', 'NPC-AI-SIM', 'Marketplace'];

const SIDEBAR_ITEMS: Array<{ id: SidebarMode; label: string; icon: React.ReactNode }> = [
  { id: 'library', label: 'Library', icon: <Library size={16} /> },
  { id: 'create', label: 'Create New', icon: <Plus size={16} /> },
  { id: 'editor', label: 'Editor', icon: <Pencil size={16} /> },
  { id: 'animations', label: 'Animations', icon: <Activity size={16} /> },
  { id: 'voice', label: 'Voice & Dialogue', icon: <Volume2 size={16} /> },
  { id: 'personality', label: 'Personality', icon: <User size={16} /> },
  { id: 'perception', label: 'Perception', icon: <Eye size={16} /> },
  { id: 'knowledge', label: 'Knowledge', icon: <BookOpen size={16} /> },
  { id: 'actions', label: 'Actions', icon: <Zap size={16} /> },
  { id: 'environments', label: 'Environments', icon: <Box size={16} /> },
  { id: 'export', label: 'Test & Export', icon: <Download size={16} /> },
];

const CONFIG_TABS: ConfigTab[] = [
  'Details',
  'AI Brain',
  'Personality',
  'Memory',
  'Perception',
  'Knowledge / RAG',
  'Voice',
  'Actions',
  'Integrations',
];

const ACTIONS = [
  ['Think', 'Evaluate context and choose a response'],
  ['Perceive', 'Read configured sight, hearing and proximity inputs'],
  ['Plan', 'Build the next short-horizon goal sequence'],
  ['Speak', 'Generate and deliver dialogue with the selected voice'],
  ['Follow', 'Maintain a target-relative follow distance'],
  ['Greet', 'Start a context-aware greeting interaction'],
  ['Patrol', 'Traverse configured waypoints or patrol areas'],
  ['Use Object', 'Claim and use an engine interaction target'],
  ['Defend', 'React defensively to a validated threat'],
  ['Attack', 'Execute an allowed combat action'],
  ['Flee', 'Choose a safe retreat target and disengage'],
  ['Custom', 'Expose a custom engine capability to the brain'],
];

const NEURAL_NODES = [
  [132, 105], [176, 72], [230, 58], [282, 69], [331, 99], [360, 140],
  [346, 184], [302, 220], [250, 233], [196, 218], [151, 189], [118, 147],
  [184, 126], [232, 105], [278, 121], [310, 153], [277, 177], [227, 172],
  [186, 163], [229, 139], [262, 150],
];

function CognitiveCoreVisual({ active }: { active: boolean }) {
  return (
    <div className="npc-cognitive-stage" aria-label="AI cognitive core visualization">
      <div className="npc-stage-hud-left">
        <strong>AIW<br />NPC-AI-SIM</strong>
        <small>COGNITION<br />MEMORY<br />PERCEPTION<br />REASONING<br />ACTION</small>
      </div>
      <div className="npc-stage-hud-right">
        <strong>A MORE<br />LIFELIKE<br />WORLD</strong>
        <small>COGNITIVE CORE<br />SYSTEM ONLINE</small>
      </div>

      <div className="npc-core-chamber">
        <span className="npc-core-ring ring-a" />
        <span className="npc-core-ring ring-b" />
        <span className="npc-core-ring ring-c" />
        <span className="npc-core-ring ring-d" />

        <svg className="npc-core-svg" viewBox="0 0 480 300" role="img" aria-label="Neural brain core">
          <defs>
            <filter id="npcBrainGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="npcNeuralGradient" x1="0" x2="1">
              <stop offset="0" stopColor="#6ee7ff" />
              <stop offset="0.5" stopColor="#4f8dff" />
              <stop offset="1" stopColor="#a774ff" />
            </linearGradient>
            <radialGradient id="npcBrainFill" cx="45%" cy="40%" r="70%">
              <stop offset="0" stopColor="#55c7ff" stopOpacity="0.36" />
              <stop offset="0.5" stopColor="#235fc4" stopOpacity="0.22" />
              <stop offset="1" stopColor="#3a1c83" stopOpacity="0.14" />
            </radialGradient>
          </defs>

          <path
            className="npc-core-brain-shell"
            fill="url(#npcBrainFill)"
            d="M117 146c-17-31-5-69 24-88 25-17 54-17 76-3 19-25 56-31 82-16 21 12 34 31 38 52 29 5 51 27 56 54 5 25-6 51-28 65-8 27-31 47-59 49-18 25-55 33-82 17-18 14-46 16-67 4-24-13-37-38-34-61-25-12-40-42-31-68 4-12 13-23 25-30z"
          />

          <path className="npc-core-neural-path" d="M132 105C178 95 191 76 230 58M230 58c24 25 54 22 101 41M331 99c-3 38 25 33 29 41M360 140c-19 18-12 31-14 44M346 184c-26 1-29 26-44 36M302 220c-25-32-41 4-52 13M250 233c-15-30-40-20-54-15M196 218c5-32-31-21-45-29M151 189c22-31-19-27-33-42M118 147c31-2 38-28 66-21M184 126c18-29 33-14 48-21M232 105c14 29 25 13 46 16M278 121c-22 17 20 17 32 32M310 153c-32-5-22 18-33 24M277 177c-17-24-32-5-50-5M227 172c12-24-23-13-41-9M186 163c22-13 18-27 43-24M229 139c22-17 27 10 33 11" />
          <path className="npc-core-neural-path" d="M176 72c-2 44 23 44 8 54M282 69c-11 25-22 26-4 52M331 99c-38 11-21 33-21 54M346 184c-39-15-46-5-69-7M302 220c-19-22-42-34-75-48M196 218c14-25 17-45 31-46M151 189c34-20 19-39 35-26M118 147c33 13 39 9 68 16M184 126c12 12 28 10 45 13M229 139c3 18 15 32-2 33" />

          {NEURAL_NODES.map(([cx, cy], index) => (
            <circle
              key={`${cx}-${cy}`}
              className="npc-core-node"
              cx={cx}
              cy={cy}
              r={index % 4 === 0 ? 5.5 : 4}
              style={{ animationDelay: `${-(index % 6) * 0.32}s` }}
            />
          ))}

          <ellipse cx="238" cy="151" rx="26" ry="19" fill={active ? '#61ceff' : '#2b6490'} opacity="0.46" filter="url(#npcBrainGlow)" />
          <circle cx="238" cy="151" r="8" fill={active ? '#e3fbff' : '#72a3bd'} filter="url(#npcBrainGlow)" />
        </svg>
      </div>

      <div className="npc-stage-modebar">
        <span className={!active ? 'is-active' : ''}>Idle</span>
        <span className={active ? 'is-active' : ''}>Think</span>
        <span>Perceive</span>
        <span>Plan</span>
        <span>Act</span>
        <span>Custom</span>
      </div>
    </div>
  );
}

function DetailsTab({ brain }: { brain: BrainEditorState }) {
  const { config } = brain;
  const models = useMemo(() => {
    if (config.model.provider === 'OpenRouter') return ['Auto / Best Available', 'Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 2.5 Pro', 'Llama 4 Maverick'];
    if (config.model.provider === 'Anthropic') return ['Claude 3.5 Sonnet', 'Claude Haiku'];
    if (config.model.provider === 'OpenAI') return ['GPT-4o', 'GPT-4o mini'];
    return ['Auto / Recommended'];
  }, [config.model.provider]);

  const updateProvider = (provider: string) => {
    const providerModels = provider === 'OpenRouter'
      ? ['Auto / Best Available', 'Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 2.5 Pro', 'Llama 4 Maverick']
      : provider === 'Anthropic'
        ? ['Claude 3.5 Sonnet', 'Claude Haiku']
        : provider === 'OpenAI'
          ? ['GPT-4o', 'GPT-4o mini']
          : ['Auto / Recommended'];
    brain.updateModel({ provider, model: providerModels.includes(config.model.model) ? config.model.model : providerModels[0] });
  };

  return (
    <div className="npc-details-grid">
      <section className="npc-config-section">
        <h3>Identity</h3>
        <label className="npc-form-row"><span>Name</span><input value={config.identity.name} onChange={(event) => brain.updateIdentity({ name: event.target.value })} /></label>
        <label className="npc-form-row"><span>Role</span><input value={config.identity.role} onChange={(event) => brain.updateIdentity({ role: event.target.value })} /></label>
        <label className="npc-form-row"><span>Self Concept</span><textarea value={config.identity.selfConcept} onChange={(event) => brain.updateIdentity({ selfConcept: event.target.value })} /></label>
        <label className="npc-form-row"><span>Tags</span><input value={config.identity.tags.join(', ')} onChange={(event) => brain.updateIdentity({ tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} /></label>
      </section>

      <section className="npc-config-section">
        <h3>Model & AI Settings</h3>
        <label className="npc-form-row">
          <span>Provider</span>
          <select value={config.model.provider} onChange={(event) => updateProvider(event.target.value)}>
            <option>OpenRouter</option><option>Anthropic</option><option>OpenAI</option><option>Google Gemini</option>
          </select>
        </label>
        <label className="npc-form-row">
          <span>Model</span>
          <select value={models.includes(config.model.model) ? config.model.model : models[0]} onChange={(event) => brain.updateModel({ model: event.target.value })}>
            {models.map((entry) => <option key={entry}>{entry}</option>)}
          </select>
        </label>
        <label className="npc-slider-row"><span>Temperature</span><input type="range" min="0" max="2" step="0.1" value={config.model.temperature} onChange={(event) => brain.updateModel({ temperature: Number(event.target.value) })} /><span className="npc-number-chip">{config.model.temperature.toFixed(1)}</span></label>
        <label className="npc-slider-row"><span>Max Tokens</span><input type="range" min="512" max="8192" step="512" value={config.model.maxTokens} onChange={(event) => brain.updateModel({ maxTokens: Number(event.target.value) })} /><span className="npc-number-chip">{config.model.maxTokens}</span></label>
        <label className="npc-form-row"><span>Directives</span><textarea value={config.reasoning.directives.join('\n')} onChange={(event) => brain.updateReasoning({ directives: event.target.value.split('\n').map((entry) => entry.trim()).filter(Boolean) })} /></label>
      </section>

      <section className="npc-config-section">
        <h3>Cognitive Core <span className="npc-online-badge">CONFIG</span></h3>
        <div className="npc-core-config">
          <div className="npc-core-orb"><Brain /></div>
          <div className="npc-core-fields">
            <label><span>Schema</span><span className="readonly">{config.schemaVersion}</span></label>
            <label><span>Revision</span><span className="readonly">r{config.revision}</span></label>
            <label><span>Validation</span><span className="readonly"><i />{brain.validationErrors.length === 0 ? 'Valid' : `${brain.validationErrors.length} issue(s)`}</span></label>
            <label><span>Memory Layer</span><span className="readonly">{config.memory.durableMemoryEnabled ? 'Working + Durable' : 'Working Only'}</span></label>
          </div>
        </div>
      </section>

      <section className="npc-config-section">
        <h3>Simulation Context</h3>
        <label className="npc-form-row"><span>Runtime</span><select value={config.integrations.runtimeTarget} onChange={(event) => brain.updateIntegrations({ runtimeTarget: event.target.value as typeof config.integrations.runtimeTarget })}><option value="generic">Generic</option><option value="godot">Godot</option><option value="unreal">Unreal</option><option value="unity">Unity</option><option value="custom">Custom</option></select></label>
        <label className="npc-form-row"><span>Perception</span><span className="npc-form-control">{config.perception.sightRadiusMeters}m / {config.perception.fieldOfViewDegrees}° FOV</span></label>
        <label className="npc-form-row"><span>Memory</span><span className="npc-form-control">{config.memory.workingMemoryItems} working items</span></label>
        <label className="npc-form-row"><span>Linked Test</span><select defaultValue="None"><option>None</option><option>Nova.glb</option></select></label>
      </section>
    </div>
  );
}

function BrainTab() {
  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card"><h4>Reasoning</h4><p>Configure short-horizon reasoning, confidence thresholds, deliberation limits and when the NPC should ask for clarification.</p><label className="npc-slider-row"><span>Depth</span><input type="range" min="1" max="10" defaultValue="4" /><span className="npc-number-chip">4</span></label><label className="npc-slider-row"><span>Confidence</span><input type="range" min="0" max="100" defaultValue="72" /><span className="npc-number-chip">72%</span></label></div>
      <div className="npc-config-card"><h4>Goal Selection</h4><p>Controls how current needs, personality, memory and environmental context are scored before an action is chosen.</p><label className="npc-form-row"><span>Strategy</span><select defaultValue="Balanced"><option>Balanced</option><option>Utility-first</option><option>Role-first</option></select></label><label className="npc-slider-row"><span>Replan</span><input type="range" min="100" max="3000" defaultValue="600" /><span className="npc-number-chip">600ms</span></label></div>
      <div className="npc-config-card"><h4>Safety & Boundaries</h4><p>Limit what the brain may attempt before a capability is exposed to the runtime.</p><label className="npc-form-row"><span>Mode</span><select defaultValue="Strict Runtime"><option>Strict Runtime</option><option>Balanced</option></select></label><label className="npc-form-row"><span>Fallback</span><select defaultValue="Ask / Idle"><option>Ask / Idle</option><option>Idle</option><option>Retry</option></select></label></div>
    </div>
  );
}

function PersonalityTab() {
  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card"><h4>Persona</h4><label className="npc-form-row"><span>Archetype</span><select defaultValue="Professional"><option>Professional</option><option>Companion</option><option>Guardian</option></select></label><label className="npc-form-row"><span>Backstory</span><textarea defaultValue="Sci-fi systems engineer with a calm, analytical temperament and a strong drive to help solve practical problems." /></label></div>
      <div className="npc-config-card"><h4>Core Traits</h4>{['Curiosity','Empathy','Confidence','Caution','Humor'].map((trait, index) => <label className="npc-slider-row" key={trait}><span>{trait}</span><input type="range" min="0" max="100" defaultValue={[82,68,74,57,36][index]} /><span className="npc-number-chip">{[82,68,74,57,36][index]}</span></label>)}</div>
      <div className="npc-config-card"><h4>Emotional Baseline</h4>{['Joy','Trust','Fear','Anger','Surprise'].map((trait, index) => <label className="npc-slider-row" key={trait}><span>{trait}</span><input type="range" min="0" max="100" defaultValue={[52,75,12,8,31][index]} /><span className="npc-number-chip">{[52,75,12,8,31][index]}</span></label>)}</div>
    </div>
  );
}

function MemoryTab() {
  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card"><h4>Working Memory</h4><p>Immediate conversation, perception and task context.</p><label className="npc-slider-row"><span>Window</span><input type="range" min="4" max="64" defaultValue="16" /><span className="npc-number-chip">16</span></label></div>
      <div className="npc-config-card"><h4>Episodic Memory</h4><p>Stores meaningful encounters and events instead of every frame of noise.</p><label className="npc-slider-row"><span>Importance</span><input type="range" min="0" max="100" defaultValue="62" /><span className="npc-number-chip">62%</span></label></div>
      <div className="npc-config-card"><h4>Semantic Memory</h4><p>Long-term facts, relationships, learned preferences and world knowledge extracted from experience.</p><label className="npc-form-row"><span>Persistence</span><select defaultValue="Enabled"><option>Enabled</option><option>Session only</option></select></label></div>
    </div>
  );
}

function PerceptionTab() {
  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card"><h4>Vision</h4><label className="npc-slider-row"><span>Radius</span><input type="range" min="1" max="100" defaultValue="18" /><span className="npc-number-chip">18m</span></label><label className="npc-slider-row"><span>FOV</span><input type="range" min="30" max="300" defaultValue="110" /><span className="npc-number-chip">110°</span></label></div>
      <div className="npc-config-card"><h4>Hearing</h4><label className="npc-slider-row"><span>Sensitivity</span><input type="range" min="0" max="100" defaultValue="68" /><span className="npc-number-chip">68</span></label><label className="npc-slider-row"><span>Attention</span><input type="range" min="50" max="2000" defaultValue="250" /><span className="npc-number-chip">250ms</span></label></div>
      <div className="npc-config-card"><h4>World Awareness</h4><label className="npc-form-row"><span>Objects</span><select defaultValue="Dynamic + Static"><option>Dynamic + Static</option><option>Dynamic only</option></select></label><label className="npc-form-row"><span>Navigation</span><select defaultValue="Enabled"><option>Enabled</option><option>Disabled</option></select></label></div>
    </div>
  );
}

function KnowledgeTab() {
  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card"><h4>Knowledge Sources</h4><p>Add world lore, character history, manuals, dialogue canon and other retrieval sources. Sources should remain separate from personality so the NPC can distinguish facts from identity.</p><button className="npc-test-button"><Plus size={12} /> Add Source</button></div>
      <div className="npc-config-card"><h4>Retrieval</h4><label className="npc-slider-row"><span>Top K</span><input type="range" min="1" max="20" defaultValue="6" /><span className="npc-number-chip">6</span></label><label className="npc-slider-row"><span>Threshold</span><input type="range" min="0" max="100" defaultValue="72" /><span className="npc-number-chip">72%</span></label></div>
      <div className="npc-config-card"><h4>Grounding</h4><label className="npc-form-row"><span>Citations</span><select defaultValue="Internal"><option>Internal</option><option>Expose</option><option>Off</option></select></label><label className="npc-form-row"><span>Unknown</span><select defaultValue="Admit uncertainty"><option>Admit uncertainty</option><option>Ask question</option></select></label></div>
    </div>
  );
}

function VoiceTab() {
  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card"><h4>Voice Engine</h4><label className="npc-form-row"><span>Provider</span><select defaultValue="Browser TTS"><option>Browser TTS</option><option>ElevenLabs</option></select></label><label className="npc-form-row"><span>Voice</span><select defaultValue="Default"><option>Default</option></select></label></div>
      <div className="npc-config-card"><h4>Delivery</h4><label className="npc-slider-row"><span>Speed</span><input type="range" min="50" max="150" defaultValue="100" /><span className="npc-number-chip">1.0x</span></label><label className="npc-slider-row"><span>Pitch</span><input type="range" min="50" max="150" defaultValue="100" /><span className="npc-number-chip">1.0</span></label></div>
      <div className="npc-config-card"><h4>Dialogue Behavior</h4><label className="npc-form-row"><span>Interruptible</span><select defaultValue="Yes"><option>Yes</option><option>No</option></select></label><label className="npc-form-row"><span>Subtitles</span><select defaultValue="On"><option>On</option><option>Off</option></select></label></div>
    </div>
  );
}

function ActionsTab() {
  return (
    <div className="npc-action-catalog">
      {ACTIONS.map(([name, description]) => (
        <button className="npc-action-tile" key={name} type="button">
          <strong>{name}</strong>
          <span>{description}</span>
          <em>CAPABILITY ENABLED</em>
        </button>
      ))}
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card"><h4>Game Runtime</h4><p>Expose the brain through a stable runtime bridge rather than coupling cognition to one engine.</p><label className="npc-form-row"><span>Target</span><select defaultValue="Generic"><option>Generic</option><option>Godot</option><option>Unreal</option><option>Unity</option></select></label></div>
      <div className="npc-config-card"><h4>AI Playground</h4><p>Advanced automations, external API workflows and multi-agent orchestration live in AI Playground, not inside this brain editor.</p><button className="npc-test-button"><ExternalLink size={12} /> Open AI Playground</button></div>
      <div className="npc-config-card"><h4>Runtime Events</h4><p>Send perception, memory and action lifecycle events to the connected host when a runtime bridge is available.</p><label className="npc-form-row"><span>Events</span><select defaultValue="Enabled"><option>Enabled</option><option>Disabled</option></select></label></div>
    </div>
  );
}

export const ReferenceEditorShell: React.FC<ReferenceEditorShellProps> = ({
  selectedItem,
  objectCount = 0,
  viewportStatus = 'Runtime bridge not connected',
}) => {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('editor');
  const [activeTab, setActiveTab] = useState<ConfigTab>('Details');
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const initialBrain = useMemo(() => {
    const config = createDefaultNpcBrainConfig(selectedItem ? selectedItem.toLowerCase().replace(/\s+/g, '-') : 'nova-showcase');
    return {
      ...config,
      identity: {
        ...config.identity,
        name: selectedItem || config.identity.name,
      },
    };
  }, [selectedItem]);
  const brain = useNpcBrainConfig(initialBrain);

  const coreActive = playState === 'playing';
  const runtimeLabel = coreActive ? 'ACTIVE TEST' : playState === 'paused' ? 'PAUSED' : 'DESIGN MODE';

  const renderTab = () => {
    switch (activeTab) {
      case 'Details': return <DetailsTab brain={brain} />;
      case 'AI Brain': return <BrainTab />;
      case 'Personality': return <PersonalityTab />;
      case 'Memory': return <MemoryTab />;
      case 'Perception': return <PerceptionTab />;
      case 'Knowledge / RAG': return <KnowledgeTab />;
      case 'Voice': return <VoiceTab />;
      case 'Actions': return <ActionsTab />;
      case 'Integrations': return <IntegrationsTab />;
      default: return null;
    }
  };

  return (
    <div className="npc-brain-app">
      <header className="npc-topbar">
        <div className="npc-brand"><span className="npc-brand-mark">AI</span><span>WONDERLAND</span></div>
        <nav className="npc-global-nav" aria-label="AI Wonderland products">
          {GLOBAL_NAV.map((item) => <button type="button" key={item} className={item === 'NPC-AI-SIM' ? 'is-active' : ''}>{item}</button>)}
        </nav>
        <div className="npc-account-strip">
          <button className="npc-icon-button" type="button" aria-label="Search"><Search size={17} /></button>
          <button className="npc-icon-button" type="button" aria-label="Notifications"><Bell size={17} /></button>
          <span className="npc-account-avatar">M</span>
          <span className="account-name">Michael</span>
          <ChevronDown size={14} />
        </div>
      </header>

      <div className="npc-shell">
        <aside className="npc-sidebar">
          <div className="npc-sidebar-title"><span className="core-dot"><Brain size={16} /></span><span>NPC-AI-SIM</span></div>
          <nav className="npc-sidebar-nav" aria-label="NPC editor sections">
            {SIDEBAR_ITEMS.map((item) => (
              <button key={item.id} type="button" className={sidebarMode === item.id ? 'is-active' : ''} onClick={() => setSidebarMode(item.id)}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button className="npc-playground-link" type="button" onClick={() => setActiveTab('Integrations')}>
            <strong><ExternalLink size={14} /><span>Open in AI Playground</span></strong>
            <span>Advanced workflows, agents and automations stay in the Playground.</span>
          </button>
        </aside>

        <main className="npc-workspace">
          <div className="npc-main-top">
            <section className="npc-panel npc-core-panel">
              <div className="npc-project-bar">
                <span className="npc-project-pill"><Brain size={13} /> Project: {brain.config.identity.name}</span>
                <span className="npc-project-pill saved"><Save size={12} /> {brain.dirty ? 'Unsaved Changes' : 'Local Draft'}</span>
                <div className="npc-project-tools">
                  <select aria-label="Core view"><option>Cognitive Core</option><option>Diagnostics</option></select>
                  <button type="button" title="Core settings"><Settings size={14} /></button>
                  <button type="button" title="Reset local changes" onClick={brain.reset}><RotateCw size={14} /></button>
                </div>
              </div>
              <CognitiveCoreVisual active={coreActive} />
            </section>

            <section className="npc-panel npc-live-panel">
              <div className="npc-panel-header">
                Live NPC
                <span className="npc-online-badge">{runtimeLabel}</span>
              </div>
              <div className="npc-live-grid">
                <div className="npc-live-primary">
                  <div className="npc-core-profile">
                    <div className="npc-mini-core"><Brain size={25} /></div>
                    <div><h2>{brain.config.identity.name}</h2><p>{brain.config.identity.role} • Cognitive Core {coreActive ? 'Running' : 'Ready for configuration'}</p></div>
                    <button className="npc-test-button" type="button" onClick={() => setPlayState(coreActive ? 'stopped' : 'playing')}>{coreActive ? 'Stop Test' : 'Test NPC'}</button>
                  </div>

                  <div className="npc-inspector-section">
                    <h3>Cognitive State</h3>
                    <div className="npc-value-row"><span>State</span><strong>{coreActive ? 'Reasoning' : 'Idle'}</strong></div>
                    <div className="npc-value-row"><span>Goal</span><strong>{coreActive ? 'Evaluate current context' : 'None running'}</strong></div>
                    <div className="npc-value-row"><span>Emotion</span><strong>{coreActive ? 'Curious' : 'Neutral'}</strong></div>
                    <div className="npc-value-row"><span>Confidence</span><div className="npc-meter"><span>{coreActive ? '87%' : '—'}</span><span className="npc-meter-track"><i style={{ width: coreActive ? '87%' : '0%' }} /></span></div></div>
                  </div>

                  <div className="npc-inspector-section">
                    <h3>Perception (Live)</h3>
                    <div className="npc-value-row"><span className={coreActive ? 'npc-signal' : ''}>Player</span><strong>{coreActive ? '3.2 m' : 'Awaiting test runtime'}</strong></div>
                    <div className="npc-value-row"><span className={coreActive ? 'npc-signal' : ''}>Voice</span><strong>{coreActive ? 'Detected (-18 dB)' : 'No live input'}</strong></div>
                    <div className="npc-value-row"><span className={coreActive ? 'npc-signal' : ''}>Looking At</span><strong>{coreActive ? 'Player_01' : '—'}</strong></div>
                    <div className="npc-value-row"><span>Environment</span><strong>{coreActive ? 'Training Lab' : 'Configured context only'}</strong></div>
                  </div>

                  <div className="npc-inspector-section">
                    <h3>Current Action</h3>
                    <div className="npc-action-line"><span>{coreActive ? 'Reasoning about response' : 'No action running'}</span><span className="npc-thinking-badge">{coreActive ? 'THINKING' : 'IDLE'}</span></div>
                    <div className="npc-value-row"><span>Target</span><strong>{coreActive ? 'Player' : '—'}</strong></div>
                    <div className="npc-value-row"><span>Progress</span><div className="npc-meter"><span className="npc-meter-track"><i style={{ width: coreActive ? '62%' : '0%' }} /></span><span>{coreActive ? '62%' : '0%'}</span></div></div>
                  </div>
                </div>

                <div className="npc-live-secondary">
                  <section className="npc-small-card">
                    <h3>Memory</h3>
                    <div className="npc-value-row"><span>Durable Memory</span><strong>{brain.config.memory.durableMemoryEnabled ? 'Configured' : 'Not connected'}</strong></div>
                    <div className="npc-value-row"><span>Working Limit</span><strong>{brain.config.memory.workingMemoryItems} items</strong></div>
                    <div className="npc-tag-row">{brain.config.identity.tags.map((tag) => <span className="npc-tag" key={tag}>{tag}</span>)}</div>
                  </section>

                  <section className="npc-small-card">
                    <h3>Runtime Systems</h3>
                    {[
                      ['Navigation', coreActive ? 'READY' : 'CONFIGURED'],
                      ['Voice', coreActive ? 'READY' : 'CONFIGURED'],
                      ['AI Model', coreActive ? 'CONNECTED' : 'NOT STARTED'],
                      ['Animation', coreActive ? 'READY' : 'UNBOUND'],
                      ['Perception', coreActive ? 'READY' : 'CONFIGURED'],
                    ].map(([name, status]) => <div className="npc-system-row" key={name}><i /><span>{name}</span><span>{status}</span></div>)}
                  </section>

                  <section className="npc-small-card">
                    <h3>Quick Controls</h3>
                    <div className="npc-quick-controls">
                      <button className="primary" type="button" onClick={() => setPlayState('playing')}><Play size={12} /> Start Test</button>
                      <div className="split">
                        <button type="button" onClick={() => setPlayState('paused')}><Pause size={12} /> Pause</button>
                        <button className="danger" type="button" onClick={() => setPlayState('stopped')}><Square size={11} /> Stop</button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </section>
          </div>

          <section className="npc-panel npc-config-panel">
            <div className="npc-config-tabs">
              {CONFIG_TABS.map((tab) => <button key={tab} type="button" className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
            </div>
            <div className="npc-config-content">{renderTab()}</div>
          </section>
        </main>
      </div>

      <footer className="npc-statusbar">
        <span className="ready-dot" /> Ready
        <span style={{ marginLeft: 12 }}>{viewportStatus}</span>
        <span style={{ marginLeft: 12 }}>Scene objects: {objectCount}</span>
        <div className="status-right"><span className="autosave">{brain.validationErrors.length === 0 ? '✓ Brain Schema Valid' : `⚠ ${brain.validationErrors.length} Validation Issue(s)`}</span><span>{brain.dirty ? 'Local changes not persisted' : 'Local draft baseline'}</span></div>
      </footer>
    </div>
  );
};

export default ReferenceEditorShell;
