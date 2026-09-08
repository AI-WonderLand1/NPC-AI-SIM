import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Brain,
  ChevronDown,
  ExternalLink,
  Library,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Save,
  Search,
  Settings,
  Square,
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
import CognitiveCore3DViewport from './CognitiveCore3DViewport.js';
import { useCognitiveTestRuntime } from './useCognitiveTestRuntime.js';
import { useMemoryHealth } from './useMemoryHealth.js';
import '../../theme/npc-brain-editor.css';
import '../../theme/npc-glass-overrides.css';

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

type PlayState = 'stopped' | 'playing';
type SidebarMode = 'library' | 'create' | 'editor';

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

const GLOBAL_NAV = [
  { label: 'WonderBuild', href: 'https://dreammakerhub.website/wonder-build' },
  { label: 'WonderSpace', href: 'https://dreammakerhub.website/wonderspace' },
  { label: 'AI Playground', href: 'https://playground.dreammakerhub.website/' },
  { label: '3D Studio', href: 'https://dreammakerhub.website/dashboard/3dhub' },
  { label: 'NPC-AI-SIM', href: '/builder' },
  { label: 'Marketplace', href: null },
] as const;

const SIDEBAR_ITEMS: Array<{ id: SidebarMode; label: string; icon: React.ReactNode; tab?: ConfigTab }> = [
  { id: 'library', label: 'Library', icon: <Library size={16} /> },
  { id: 'create', label: 'Create New', icon: <Plus size={16} /> },
  { id: 'editor', label: 'Editor', icon: <Pencil size={16} />, tab: 'Details' },
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

function DetailsTab({ brain }: { brain: BrainEditorState }) {
  const { config } = brain;

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
        <h3>Brain Summary</h3>
        <label className="npc-form-row"><span>Provider</span><span className="npc-form-control">{config.model.provider}</span></label>
        <label className="npc-form-row"><span>Model</span><span className="npc-form-control">{config.model.model}</span></label>
        <label className="npc-form-row"><span>Temperature</span><span className="npc-form-control">{config.model.temperature.toFixed(1)}</span></label>
        <label className="npc-form-row"><span>Max Tokens</span><span className="npc-form-control">{config.model.maxTokens}</span></label>
        <p className="npc-runtime-note">Editable model and reasoning controls live only in the AI Brain tab.</p>
      </section>

      <section className="npc-config-section">
        <h3>Brain Status</h3>
        <div className="npc-core-fields">
          <label><span>Schema</span><span className="readonly">{config.schemaVersion}</span></label>
          <label><span>Revision</span><span className="readonly">r{config.revision}</span></label>
          <label><span>Validation</span><span className="readonly"><i />{brain.validationErrors.length === 0 ? 'Valid' : `${brain.validationErrors.length} issue(s)`}</span></label>
          <label><span>Memory Layer</span><span className="readonly">{config.memory.durableMemoryEnabled ? 'Working + Durable' : 'Working Only'}</span></label>
        </div>
      </section>

      <section className="npc-config-section">
        <h3>Simulation Context</h3>
        <label className="npc-form-row"><span>Runtime</span><span className="npc-form-control">{config.integrations.runtimeTarget}</span></label>
        <label className="npc-form-row"><span>Perception</span><span className="npc-form-control">{config.perception.sightRadiusMeters}m / {config.perception.fieldOfViewDegrees}° FOV</span></label>
        <label className="npc-form-row"><span>Memory</span><span className="npc-form-control">{config.memory.workingMemoryItems} working items</span></label>
        <label className="npc-form-row"><span>Training Scene</span><span className="npc-form-control">System Training Lab • locked</span></label>
        <p className="npc-runtime-note">Runtime target is edited only in Integrations. Perception and memory are edited only in their dedicated tabs.</p>
      </section>
    </div>
  );
}

export const ReferenceEditorShell: React.FC<ReferenceEditorShellProps> = ({
  selectedItem,
  objectCount = 0,
  viewportStatus = 'Preparing real-time 3D cognitive core',
  viewport,
}) => {
  const navigate = useNavigate();
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('editor');
  const [activeTab, setActiveTab] = useState<ConfigTab>('Details');
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const [rendererStatus, setRendererStatus] = useState(viewportStatus);

  useEffect(() => {
    setRendererStatus(viewportStatus);
  }, [viewportStatus]);

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

  const runtimeLabel = snapshot.runtimeConnected
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

  const handleSidebar = (item: (typeof SIDEBAR_ITEMS)[number]) => {
    setSidebarMode(item.id);
    if (item.id === 'library') {
      navigate('/library');
      return;
    }
    if (item.id === 'create') {
      navigate('/builder/new');
      return;
    }
    if (item.tab) setActiveTab(item.tab);
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
        <a className="npc-brand" href="https://dreammakerhub.website/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <span className="npc-brand-mark">AI</span><span>WONDERLAND</span>
        </a>
        <nav className="npc-global-nav" aria-label="AI Wonderland products">
          {GLOBAL_NAV.map((item) => item.href ? (
            <a key={item.label} href={item.href} className={item.label === 'NPC-AI-SIM' ? 'is-active' : ''}>{item.label}</a>
          ) : (
            <span key={item.label} className="is-disabled" title="Not available in this build">{item.label}</span>
          ))}
        </nav>
        <div className="npc-account-strip">
          <button className="npc-icon-button" type="button" aria-label="Search"><Search size={17} /></button>
          <button className="npc-icon-button" type="button" aria-label="Notifications"><Bell size={17} /></button>
          <span className="npc-account-avatar">U</span>
          <span className="account-name">Account</span>
          <ChevronDown size={14} />
        </div>
      </header>

      <div className="npc-shell">
        <aside className="npc-sidebar">
          <div className="npc-sidebar-title"><span className="core-dot"><Brain size={16} /></span><span>NPC-AI-SIM</span></div>
          <nav className="npc-sidebar-nav" aria-label="NPC app navigation">
            {SIDEBAR_ITEMS.map((item) => (
              <button key={item.id} type="button" className={sidebarMode === item.id ? 'is-active' : ''} onClick={() => handleSidebar(item)}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </nav>
          <a className="npc-playground-link" href="https://playground.dreammakerhub.website/" style={{ textDecoration: 'none' }}>
            <strong><ExternalLink size={14} /><span>Open in AI Playground</span></strong>
            <span>Advanced workflows, agents and automations stay in the Playground.</span>
          </a>
        </aside>

        <main className="npc-workspace">
          <div className="npc-main-top">
            <section className="npc-panel npc-core-panel">
              <div className="npc-project-bar">
                <span className="npc-project-pill"><Brain size={13} /> Project: {brain.config.identity.name}</span>
                <span className="npc-project-pill saved"><Save size={12} /> {brain.dirty ? 'Unsaved Changes' : 'Local Draft'}</span>
                <div className="npc-project-tools">
                  <span className="npc-toolbar-pill">Real-time 3D</span>
                  <button type="button" title="Core settings" onClick={() => setActiveTab('AI Brain')}><Settings size={14} /></button>
                  <button type="button" title="Reset local changes" onClick={brain.reset}><RotateCw size={14} /></button>
                </div>
              </div>

              <div className={`npc-cognitive-stage phase-${snapshot.phase}`} aria-label="AI cognitive core visualization">
                {viewport ?? <CognitiveCore3DViewport phase={snapshot.phase} onStatusChange={setRendererStatus} />}
                <div className="npc-stage-hud-left">
                  <strong>AIW<br />NPC-AI-SIM</strong>
                  <small>COGNITION<br />MEMORY<br />PERCEPTION<br />REASONING<br />ACTION</small>
                </div>
                <div className="npc-stage-hud-right">
                  <strong>A MORE<br />LIFELIKE<br />WORLD</strong>
                  <small>COGNITIVE CORE<br />{cognition.mode === 'local-simulation' ? 'LOCAL SIMULATION' : 'CONFIGURATION MODE'}<br />PHASE {formatPhase(snapshot.phase).toUpperCase()}</small>
                </div>
                <div className="npc-stage-modebar">
                  <button type="button" className={snapshot.phase === 'idle' ? 'is-active' : ''} onClick={stopTest}>Idle</button>
                  <button type="button" className={snapshot.phase === 'reasoning' ? 'is-active' : ''} onClick={() => runStep(cognition.think)}>Think</button>
                  <button type="button" className={snapshot.phase === 'perceiving' ? 'is-active' : ''} onClick={() => runStep(cognition.perceive)}>Perceive</button>
                  <button type="button" className={snapshot.phase === 'planning' ? 'is-active' : ''} onClick={() => runStep(cognition.decide)}>Plan</button>
                  <button type="button" className={snapshot.phase === 'acting' ? 'is-active' : ''} onClick={() => runStep(cognition.act)}>Act</button>
                  <button type="button" disabled title="Reserved for a future custom runtime phase">Custom</button>
                </div>
              </div>
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
                      <button className="danger" type="button" onClick={stopTest}><Square size={11} /> Reset</button>
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
        <span style={{ marginLeft: 12 }}>{rendererStatus}</span>
        <span style={{ marginLeft: 12 }}>{snapshot.runtimeConnected ? 'External runtime connected' : cognition.mode === 'local-simulation' ? 'Local cognition simulation • no authoritative game runtime' : 'Cognition editor idle'}</span>
        {objectCount > 0 && <span style={{ marginLeft: 12 }}>Scene objects: {objectCount}</span>}
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

export default ReferenceEditorShell;
