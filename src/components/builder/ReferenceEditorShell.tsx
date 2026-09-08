import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  Box,
  Brain,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  Library,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Save,
  Search,
  Settings,
  Square,
  User,
  Volume2,
  Zap,
} from 'lucide-react';
import type { CognitivePhase, EmotionalState } from '../../brain/cognitiveModel.js';
import { createDefaultNpcBrainConfig } from '../../brain/defaultBrainConfig.js';
import { useNpcBrainConfig } from '../../brain/useNpcBrainConfig.js';
import {
  ConnectedBrainTab,
  ConnectedMemoryTab,
  ConnectedPerceptionTab,
  ConnectedPersonalityTab,
} from './CognitiveConfigTabs.js';
import {
  ConnectedActionsTab,
  ConnectedIntegrationsTab,
  ConnectedKnowledgeTab,
  ConnectedVoiceTab,
} from './CognitiveRuntimeTabs.js';
import { useCognitiveTestRuntime } from './useCognitiveTestRuntime.js';
import { useMemoryHealth } from './useMemoryHealth.js';
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

const NEURAL_NODES = [
  [132, 105], [176, 72], [230, 58], [282, 69], [331, 99], [360, 140],
  [346, 184], [302, 220], [250, 233], [196, 218], [151, 189], [118, 147],
  [184, 126], [232, 105], [278, 121], [310, 153], [277, 177], [227, 172],
  [186, 163], [229, 139], [262, 150],
];

function CognitiveCoreVisual({
  phase,
  mode,
  onIdle,
  onThink,
  onPerceive,
  onPlan,
  onAct,
}: {
  phase: CognitivePhase;
  mode: 'idle' | 'local-simulation';
  onIdle: () => void;
  onThink: () => void;
  onPerceive: () => void;
  onPlan: () => void;
  onAct: () => void;
}) {
  const active = phase !== 'idle';
  const coreColor = phaseColor(phase);
  const modeLabel = mode === 'local-simulation' ? 'LOCAL SIMULATION' : 'CONFIGURATION MODE';

  return (
    <div className={`npc-cognitive-stage phase-${phase}`} aria-label="AI cognitive core visualization">
      <div className="npc-stage-hud-left">
        <strong>AIW<br />NPC-AI-SIM</strong>
        <small>COGNITION<br />MEMORY<br />PERCEPTION<br />REASONING<br />ACTION</small>
      </div>
      <div className="npc-stage-hud-right">
        <strong>A MORE<br />LIFELIKE<br />WORLD</strong>
        <small>COGNITIVE CORE<br />{modeLabel}<br />PHASE {formatPhase(phase).toUpperCase()}</small>
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

          <ellipse cx="238" cy="151" rx="26" ry="19" fill={coreColor} opacity={active ? 0.58 : 0.34} filter="url(#npcBrainGlow)" />
          <circle cx="238" cy="151" r="8" fill={active ? '#effcff' : '#72a3bd'} filter="url(#npcBrainGlow)" />
        </svg>
      </div>

      <div className="npc-stage-modebar">
        <button type="button" className={phase === 'idle' ? 'is-active' : ''} onClick={onIdle}>Idle</button>
        <button type="button" className={phase === 'reasoning' ? 'is-active' : ''} onClick={onThink}>Think</button>
        <button type="button" className={phase === 'perceiving' ? 'is-active' : ''} onClick={onPerceive}>Perceive</button>
        <button type="button" className={phase === 'planning' ? 'is-active' : ''} onClick={onPlan}>Plan</button>
        <button type="button" className={phase === 'acting' ? 'is-active' : ''} onClick={onAct}>Act</button>
        <button type="button" disabled title="Reserved for future custom runtime phase">Custom</button>
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
  const cognition = useCognitiveTestRuntime(brain.config);
  const memoryHealth = useMemoryHealth();
  const snapshot = cognition.snapshot;

  const runtimeLabel = playState === 'paused'
    ? 'PAUSED'
    : snapshot.runtimeConnected
      ? 'LIVE RUNTIME'
      : cognition.mode === 'local-simulation'
        ? 'LOCAL SIM'
        : 'DESIGN MODE';
  const latestPerception = snapshot.recentPerception.at(-1);
  const confidence = snapshot.lastDecision?.confidence;
  const actionCapability = snapshot.activeAction
    ? brain.config.capabilities.find((capability) => capability.id === snapshot.activeAction?.capabilityId)
    : undefined;
  const actionProgress = snapshot.activeAction?.progress ?? 0;
  const memoryStatus = memoryHealth.loading
    ? 'Checking'
    : memoryHealth.connected && memoryHealth.durable
      ? 'Durable connected'
      : 'Working only';

  const runTest = async () => {
    setPlayState('playing');
    await cognition.runCycle();
  };

  const stopTest = () => {
    cognition.reset();
    setPlayState('stopped');
  };

  const runStep = (step: () => void | Promise<void>) => {
    setPlayState('playing');
    void step();
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'Details': return <DetailsTab brain={brain} />;
      case 'AI Brain': return <ConnectedBrainTab brain={brain} />;
      case 'Personality': return <ConnectedPersonalityTab brain={brain} />;
      case 'Memory': return <ConnectedMemoryTab brain={brain} />;
      case 'Perception': return <ConnectedPerceptionTab brain={brain} />;
      case 'Knowledge / RAG': return <ConnectedKnowledgeTab brain={brain} />;
      case 'Voice': return <ConnectedVoiceTab brain={brain} />;
      case 'Actions': return <ConnectedActionsTab brain={brain} />;
      case 'Integrations': return <ConnectedIntegrationsTab brain={brain} />;
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
              <CognitiveCoreVisual
                phase={snapshot.phase}
                mode={cognition.mode}
                onIdle={stopTest}
                onThink={() => runStep(cognition.think)}
                onPerceive={() => runStep(cognition.perceive)}
                onPlan={() => runStep(cognition.decide)}
                onAct={() => runStep(cognition.act)}
              />
            </section>

            <section className="npc-panel npc-live-panel">
              <div className="npc-panel-header">
                Live Cognition
                <span className="npc-online-badge">{runtimeLabel}</span>
              </div>
              <div className="npc-live-grid">
                <div className="npc-live-primary">
                  <div className="npc-core-profile npc-cognition-profile">
                    <div><h2>{brain.config.identity.name}</h2><p>{brain.config.identity.role} • {formatPhase(snapshot.phase)} • {snapshot.runtimeConnected ? 'runtime linked' : cognition.mode === 'local-simulation' ? 'local cognitive simulation' : 'configuration only'}</p></div>
                    <button className="npc-test-button" type="button" onClick={cognition.mode === 'local-simulation' ? stopTest : () => void runTest()}>{cognition.mode === 'local-simulation' ? 'Reset Test' : 'Test Brain'}</button>
                  </div>

                  <div className="npc-inspector-section">
                    <h3>Cognitive State</h3>
                    <div className="npc-value-row"><span>State</span><strong>{formatPhase(snapshot.phase)}</strong></div>
                    <div className="npc-value-row"><span>Goal</span><strong>{snapshot.currentGoal?.label ?? 'No selected goal'}</strong></div>
                    <div className="npc-value-row"><span>Emotion</span><strong>{dominantEmotion(snapshot.emotionalState)} • stress {Math.round(snapshot.stressLevel * 100)}%</strong></div>
                    <div className="npc-value-row"><span>Confidence</span><div className="npc-meter"><span>{confidence === undefined ? '—' : `${Math.round(confidence * 100)}%`}</span><span className="npc-meter-track"><i style={{ width: confidence === undefined ? '0%' : `${Math.round(confidence * 100)}%` }} /></span></div></div>
                  </div>

                  <div className="npc-inspector-section">
                    <h3>{snapshot.runtimeConnected ? 'Perception (Live)' : cognition.mode === 'local-simulation' ? 'Perception (Local Test)' : 'Perception'}</h3>
                    <div className="npc-value-row"><span className={latestPerception ? 'npc-signal' : ''}>Subject</span><strong>{latestPerception?.subjectId ?? 'Awaiting input'}</strong></div>
                    <div className="npc-value-row"><span>Sensor</span><strong>{latestPerception ? formatPhaseWord(latestPerception.kind) : '—'}</strong></div>
                    <div className="npc-value-row"><span>Distance</span><strong>{latestPerception?.distanceMeters === undefined ? '—' : `${latestPerception.distanceMeters.toFixed(1)} m`}</strong></div>
                    <div className="npc-value-row"><span>Confidence</span><strong>{latestPerception ? `${Math.round(latestPerception.confidence * 100)}%` : '—'}</strong></div>
                  </div>

                  <div className="npc-inspector-section">
                    <h3>Current Action</h3>
                    <div className="npc-action-line"><span>{actionCapability?.label ?? 'No action selected'}</span><span className="npc-thinking-badge">{snapshot.activeAction?.status?.toUpperCase() ?? snapshot.phase.toUpperCase()}</span></div>
                    <div className="npc-value-row"><span>Target</span><strong>{snapshot.activeAction?.targetId ?? snapshot.activeRelationship?.subjectId ?? '—'}</strong></div>
                    <div className="npc-value-row"><span>Progress</span><div className="npc-meter"><span className="npc-meter-track"><i style={{ width: `${Math.round(actionProgress * 100)}%` }} /></span><span>{Math.round(actionProgress * 100)}%</span></div></div>
                    <div className="npc-value-row"><span>Decision</span><strong title={snapshot.lastDecision?.summary}>{snapshot.lastDecision?.summary ?? 'No decision trace yet'}</strong></div>
                  </div>
                </div>

                <div className="npc-live-secondary">
                  <section className="npc-small-card">
                    <h3>Memory</h3>
                    <div className="npc-value-row"><span>Durable</span><strong>{memoryStatus}</strong></div>
                    <div className="npc-value-row"><span>Working</span><strong>{snapshot.workingMemoryCount} / {brain.config.memory.workingMemoryItems}</strong></div>
                    <div className="npc-value-row"><span>Recalled</span><strong>{snapshot.recalledMemoryIds.length}</strong></div>
                    <div className="npc-tag-row">{brain.config.identity.tags.map((tag) => <span className="npc-tag" key={tag}>{tag}</span>)}</div>
                  </section>

                  <section className="npc-small-card">
                    <h3>Runtime Systems</h3>
                    {[
                      ['Runtime Bridge', snapshot.runtimeConnected ? 'CONNECTED' : 'DISCONNECTED'],
                      ['Memory', memoryHealth.connected && memoryHealth.durable ? 'DURABLE' : 'WORKING ONLY'],
                      ['AI Model', 'CONFIGURED'],
                      ['Voice', brain.config.voice.provider ? 'CONFIGURED' : 'UNCONFIGURED'],
                      ['Perception', cognition.mode === 'local-simulation' ? 'LOCAL TEST' : 'AWAITING INPUT'],
                    ].map(([name, status]) => <div className="npc-system-row" key={name}><i /><span>{name}</span><span>{status}</span></div>)}
                  </section>

                  <section className="npc-small-card">
                    <h3>Quick Controls</h3>
                    <div className="npc-quick-controls">
                      <button className="primary" type="button" onClick={() => void runTest()}><Play size={12} /> Run Brain</button>
                      <div className="split">
                        <button type="button" onClick={() => setPlayState('paused')}><Pause size={12} /> Pause</button>
                        <button className="danger" type="button" onClick={stopTest}><Square size={11} /> Reset</button>
                      </div>
                    </div>
                    {cognition.warnings.length > 0 && <p className="npc-runtime-note">{cognition.warnings[0]}</p>}
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
        <span style={{ marginLeft: 12 }}>{snapshot.runtimeConnected ? 'External runtime connected' : cognition.mode === 'local-simulation' ? 'Local cognition simulation; no authoritative game runtime' : 'Cognition editor idle'}</span>
        <div className="status-right"><span className="autosave">{brain.validationErrors.length === 0 ? '✓ Brain Schema Valid' : `⚠ ${brain.validationErrors.length} Validation Issue(s)`}</span><span>{brain.dirty ? 'Local changes not persisted' : `Working memory ${snapshot.workingMemoryCount}/${brain.config.memory.workingMemoryItems}`}</span></div>
      </footer>
    </div>
  );
};

function formatPhase(phase: CognitivePhase): string {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

function formatPhaseWord(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function dominantEmotion(state: EmotionalState): string {
  const values: Array<[string, number]> = [
    ['Joy', state.joy],
    ['Trust', state.trust],
    ['Fear', state.fear],
    ['Anger', state.anger],
    ['Sadness', state.sadness],
    ['Surprise', state.surprise],
  ];
  values.sort((a, b) => b[1] - a[1]);
  const [label, strength] = values[0];
  return strength < 0.2 ? 'Neutral' : `${label} ${Math.round(strength * 100)}%`;
}

function phaseColor(phase: CognitivePhase): string {
  switch (phase) {
    case 'perceiving': return '#43e5ff';
    case 'reasoning': return '#a774ff';
    case 'planning': return '#778bff';
    case 'acting': return '#37e99b';
    case 'error': return '#ff6675';
    default: return '#61ceff';
  }
}

export default ReferenceEditorShell;
