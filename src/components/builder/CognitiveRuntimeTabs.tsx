import React, { useState } from 'react';
import { Download, ExternalLink, Volume2 } from 'lucide-react';
import type { CapabilityDefinition } from '../../brain/cognitiveModel.js';
import type { NpcBrainEditorState } from '../../brain/useNpcBrainConfig.js';
import { voiceProviderRegistry } from '../../VoiceProvider.js';
import { SYSTEM_TRAINING_SCENE, TRAINING_COURSES, type TrainingCourse } from '../../training/trainingCatalog.js';

const COURSE_SKILLS: Record<string, Array<[string, string, string]>> = {
  'movement-basics': [
    ['walk', 'Walk', 'Move toward an allowed runtime target at walking speed'],
    ['run', 'Run', 'Move toward an allowed runtime target at running speed'],
  ],
  jump: [
    ['jump', 'Jump', 'Request a jump and landing sequence from the authoritative runtime'],
  ],
  'navigation-core': [
    ['follow', 'Follow', 'Maintain a configured distance from a target'],
    ['patrol', 'Patrol', 'Traverse configured patrol points or areas'],
  ],
  'perception-core': [
    ['perceive', 'Perceive', 'Read configured sensory and environment inputs'],
  ],
  'conversation-core': [
    ['speak', 'Speak', 'Generate and deliver dialogue'],
    ['greet', 'Greet', 'Start a context-aware greeting'],
  ],
  'smart-interactions': [
    ['use-object', 'Use Object', 'Interact with an allowed runtime object'],
    ['open-door', 'Open Door', 'Request an allowed door/open interaction'],
    ['sit', 'Sit / Use Point', 'Use an allowed seating or interaction point'],
  ],
  'social-basics': [
    ['greet', 'Greet', 'Start a context-aware greeting'],
    ['follow', 'Follow', 'Maintain a configured distance from a target'],
    ['speak', 'Speak', 'Generate and deliver dialogue'],
  ],
};

function courseCapability(course: TrainingCourse, skill: [string, string, string]): CapabilityDefinition {
  const [id, label, description] = skill;
  return {
    id,
    label,
    description,
    enabled: true,
    aiSelectable: true,
    cooldownMs: 0,
    requirements: [`course:${course.id}`],
    targetConstraints: [],
    runtimeEvent: `npc.action.${id}`,
    parameters: {},
  };
}

export function ConnectedKnowledgeTab({ brain }: { brain: NpcBrainEditorState }) {
  const { knowledgeSources, memory } = brain.config;

  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card">
        <h4>Knowledge Sources</h4>
        <p>World lore, manuals, character history and canon stay separate from autobiographical memory and personality.</p>
        <label className="npc-form-row"><span>Indexed</span><span className="npc-form-control">{knowledgeSources.filter((source) => source.status === 'indexed').length}</span></label>
        <label className="npc-form-row"><span>Pending</span><span className="npc-form-control">{knowledgeSources.filter((source) => source.status === 'pending').length}</span></label>
        <button className="npc-test-button" type="button" disabled title="Knowledge ingestion API not connected yet">Add Source • Backend Required</button>
      </div>

      <div className="npc-config-card">
        <h4>Retrieval</h4>
        <p>The first durable retrieval target is Mem0 + MongoDB. Retrieval must be server-side and grounded in indexed sources.</p>
        <label className="npc-form-row"><span>Top K</span><span className="npc-form-control">{memory.retrievalLimit}</span></label>
        <label className="npc-form-row"><span>Adapter</span><span className="npc-form-control">Not connected</span></label>
        <label className="npc-form-row"><span>Vector Store</span><span className="npc-form-control">MongoDB target</span></label>
      </div>

      <div className="npc-config-card">
        <h4>Grounding</h4>
        <p>When evidence is missing, the NPC should expose uncertainty rather than inventing world facts.</p>
        <label className="npc-form-row"><span>Sources</span><span className="npc-form-control">Internal provenance trail</span></label>
        <label className="npc-form-row"><span>Unknown</span><span className="npc-form-control">Admit uncertainty / ask</span></label>
        <label className="npc-form-row"><span>Status</span><span className="npc-form-control">Configuration only</span></label>
      </div>
    </div>
  );
}

export function ConnectedVoiceTab({ brain }: { brain: NpcBrainEditorState }) {
  const { voice } = brain.config;
  const [testText, setTestText] = useState('Hello. My NPC voice system is working.');
  const [testStatus, setTestStatus] = useState('Ready');
  const [testing, setTesting] = useState(false);

  const testVoice = async () => {
    if (voice.provider !== 'Browser TTS') {
      setTestStatus(`${voice.provider} requires a configured server-side provider before it can be tested here.`);
      return;
    }

    const provider = voiceProviderRegistry.get('browser');
    if (!provider) {
      setTestStatus('Browser speech synthesis is unavailable in this browser.');
      return;
    }

    setTesting(true);
    setTestStatus('Speaking…');
    try {
      const result = await provider.generateSpeech(testText.trim() || 'Voice test', {
        voiceId: voice.voiceId,
        speed: voice.speed,
        pitch: voice.pitch,
        language: 'en-US',
      });
      setTestStatus(`Completed in ${result.duration.toFixed(1)}s • playback-only browser voice`);
    } catch (error) {
      setTestStatus(error instanceof Error ? error.message : 'Voice test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card">
        <h4>Voice Engine</h4>
        <label className="npc-form-row">
          <span>Provider</span>
          <select value={voice.provider} onChange={(event) => brain.updateVoice({ provider: event.target.value })}>
            <option>Browser TTS</option>
            <option>ElevenLabs</option>
            <option>OpenAI</option>
            <option>Custom</option>
          </select>
        </label>
        <label className="npc-form-row"><span>Voice ID</span><input value={voice.voiceId ?? ''} placeholder="Default / provider voice ID" onChange={(event) => brain.updateVoice({ voiceId: event.target.value || undefined })} /></label>
      </div>

      <div className="npc-config-card">
        <h4>Delivery</h4>
        <label className="npc-slider-row"><span>Speed</span><input type="range" min="0.5" max="1.5" step="0.05" value={voice.speed} onChange={(event) => brain.updateVoice({ speed: Number(event.target.value) })} /><span className="npc-number-chip">{voice.speed.toFixed(2)}x</span></label>
        <label className="npc-slider-row"><span>Pitch</span><input type="range" min="0.5" max="1.5" step="0.05" value={voice.pitch} onChange={(event) => brain.updateVoice({ pitch: Number(event.target.value) })} /><span className="npc-number-chip">{voice.pitch.toFixed(2)}</span></label>
      </div>

      <div className="npc-config-card">
        <h4>Dialogue Behavior</h4>
        <label className="npc-form-row"><span>Interruptible</span><select value={voice.interruptible ? 'Yes' : 'No'} onChange={(event) => brain.updateVoice({ interruptible: event.target.value === 'Yes' })}><option>Yes</option><option>No</option></select></label>
        <label className="npc-form-row"><span>Subtitles</span><select value={voice.subtitles ? 'On' : 'Off'} onChange={(event) => brain.updateVoice({ subtitles: event.target.value === 'On' })}><option>On</option><option>Off</option></select></label>
        <label className="npc-form-row"><span>Test Text</span><input value={testText} maxLength={240} onChange={(event) => setTestText(event.target.value)} /></label>
        <button className="npc-test-button" type="button" onClick={() => void testVoice()} disabled={testing}><Volume2 size={12} /> {testing ? 'Speaking…' : 'Test Voice'}</button>
        <p className="npc-runtime-note">{testStatus}</p>
      </div>
    </div>
  );
}

export function ConnectedActionsTab({ brain }: { brain: NpcBrainEditorState }) {
  const toggleCapability = (capabilityId: string) => {
    brain.setCapabilities(brain.config.capabilities.map((capability) => (
      capability.id === capabilityId
        ? { ...capability, enabled: !capability.enabled }
        : capability
    )));
  };

  const installCourse = (course: TrainingCourse) => {
    if (course.adaptiveTraining) return;
    const skills = COURSE_SKILLS[course.id] ?? [];
    const next = [...brain.config.capabilities];

    for (const skill of skills) {
      const existingIndex = next.findIndex((capability) => capability.id === skill[0]);
      if (existingIndex >= 0) {
        next[existingIndex] = { ...next[existingIndex], enabled: true };
      } else {
        next.push(courseCapability(course, skill));
      }
    }

    brain.setCapabilities(next);
  };

  const courseInstalled = (course: TrainingCourse) => {
    const skills = COURSE_SKILLS[course.id] ?? [];
    return skills.length > 0 && skills.every(([id]) => brain.config.capabilities.some((capability) => capability.id === id && capability.enabled));
  };

  return (
    <>
      <div className="npc-action-catalog">
        {brain.config.capabilities.map((capability) => (
          <button className="npc-action-tile" key={capability.id} type="button" onClick={() => toggleCapability(capability.id)} title="Toggle capability enabled state">
            <strong>{capability.label}</strong>
            <span>{capability.description}</span>
            <em>{capability.enabled ? (capability.aiSelectable ? 'AI SELECTABLE • ENABLED' : 'MANUAL ONLY • ENABLED') : 'CAPABILITY DISABLED'}</em>
          </button>
        ))}
      </div>

      <div className="npc-config-card-grid" style={{ marginTop: 12 }}>
        <div className="npc-config-card">
          <h4>System Training Lab</h4>
          <p>{SYSTEM_TRAINING_SCENE.name} is system-owned, locked, non-exportable and resets between validation runs.</p>
          <label className="npc-form-row"><span>Fixtures</span><span className="npc-form-control">{SYSTEM_TRAINING_SCENE.fixtures.length} deterministic fixtures</span></label>
          <label className="npc-form-row"><span>Ownership</span><span className="npc-form-control">SYSTEM • READ ONLY</span></label>
        </div>

        {TRAINING_COURSES.map((course) => {
          const installed = courseInstalled(course);
          const skillCount = (COURSE_SKILLS[course.id] ?? []).length;
          return (
            <div className="npc-config-card" key={course.id}>
              <h4>{course.name}</h4>
              <p>{course.description}</p>
              <label className="npc-form-row"><span>Package</span><span className="npc-form-control">{skillCount} capability hook(s)</span></label>
              <label className="npc-form-row"><span>Validation</span><span className="npc-form-control">{course.validation.length} runtime check(s)</span></label>
              <label className="npc-form-row"><span>Status</span><span className="npc-form-control">{course.adaptiveTraining ? 'ADVANCED RUNNER REQUIRED' : installed ? 'INSTALLED • VALIDATION PENDING' : 'NOT INSTALLED'}</span></label>
              <button
                className="npc-test-button"
                type="button"
                onClick={() => installCourse(course)}
                disabled={course.adaptiveTraining || installed || skillCount === 0}
                title={course.adaptiveTraining ? 'Adaptive learning runner is not implemented yet' : 'Install this reusable skill package into the NPC brain config'}
              >
                {course.adaptiveTraining ? 'Future Adaptive Training' : installed ? 'Course Installed' : 'Install Skill Course'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ConnectedIntegrationsTab({ brain }: { brain: NpcBrainEditorState }) {
  const { integrations } = brain.config;

  const exportBrainConfig = () => {
    if (brain.validationErrors.length > 0 || typeof window === 'undefined') return;

    brain.markSaved();
    const blob = new Blob([JSON.stringify(brain.config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeId = brain.config.npcId.replace(/[^a-zA-Z0-9._-]+/g, '-');
    link.href = url;
    link.download = `${safeId}.npc-brain.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card">
        <h4>Game Runtime</h4>
        <p>Brain configuration stays engine-neutral; runtime adapters handle authoritative game-state execution.</p>
        <label className="npc-form-row">
          <span>Target</span>
          <select value={integrations.runtimeTarget} onChange={(event) => brain.updateIntegrations({ runtimeTarget: event.target.value as typeof integrations.runtimeTarget })}>
            <option value="generic">Generic</option>
            <option value="godot">Godot</option>
            <option value="unreal">Unreal</option>
            <option value="unity">Unity</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="npc-form-row"><span>Bridge</span><span className="npc-form-control">Not connected • authoritative runtime required</span></label>
      </div>

      <div className="npc-config-card">
        <h4>Brain Export</h4>
        <p>Export the canonical versioned NPC brain configuration for storage, inspection or a future runtime handoff.</p>
        <label className="npc-form-row"><span>Schema</span><span className="npc-form-control">{brain.config.schemaVersion}</span></label>
        <label className="npc-form-row"><span>Revision</span><span className="npc-form-control">r{brain.config.revision}</span></label>
        <button className="npc-test-button" type="button" disabled={brain.validationErrors.length > 0} onClick={exportBrainConfig}><Download size={12} /> Export Brain JSON</button>
        {brain.validationErrors.length > 0 && <p className="npc-runtime-note">Fix schema validation errors before export.</p>}
      </div>

      <div className="npc-config-card">
        <h4>AI Playground</h4>
        <p>Advanced workflows, agents, triggers, external APIs and orchestration stay in AI Playground.</p>
        <label className="npc-form-row"><span>Handoff</span><select value={integrations.aiPlaygroundEnabled ? 'Enabled' : 'Disabled'} onChange={(event) => brain.updateIntegrations({ aiPlaygroundEnabled: event.target.value === 'Enabled' })}><option>Enabled</option><option>Disabled</option></select></label>
        <a className="npc-test-button" href="https://playground.dreammakerhub.website/" style={{ textDecoration: 'none' }}><ExternalLink size={12} /> Open AI Playground</a>
        <p className="npc-runtime-note">Navigation works. NPC data handoff remains separate until the cross-product protocol is implemented.</p>
      </div>

      <div className="npc-config-card">
        <h4>Runtime Events</h4>
        <p>Perception, memory and action lifecycle events can be emitted once the runtime bridge is available.</p>
        <label className="npc-form-row"><span>Events</span><select value={integrations.emitRuntimeEvents ? 'Enabled' : 'Disabled'} onChange={(event) => brain.updateIntegrations({ emitRuntimeEvents: event.target.value === 'Enabled' })}><option>Enabled</option><option>Disabled</option></select></label>
        <label className="npc-form-row"><span>Status</span><span className="npc-form-control">Configuration only</span></label>
      </div>
    </div>
  );
}
