import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { NpcBrainEditorState } from '../../brain/useNpcBrainConfig.js';

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
        <label className="npc-form-row"><span>Runtime</span><span className="npc-form-control">Playback pipeline not yet connected to brain state</span></label>
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

  return (
    <div className="npc-action-catalog">
      {brain.config.capabilities.map((capability) => (
        <button className="npc-action-tile" key={capability.id} type="button" onClick={() => toggleCapability(capability.id)} title="Toggle capability enabled state">
          <strong>{capability.label}</strong>
          <span>{capability.description}</span>
          <em>{capability.enabled ? (capability.aiSelectable ? 'AI SELECTABLE • ENABLED' : 'MANUAL ONLY • ENABLED') : 'CAPABILITY DISABLED'}</em>
        </button>
      ))}
    </div>
  );
}

export function ConnectedIntegrationsTab({ brain }: { brain: NpcBrainEditorState }) {
  const { integrations } = brain.config;

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
        <label className="npc-form-row"><span>Bridge</span><span className="npc-form-control">Not connected</span></label>
      </div>

      <div className="npc-config-card">
        <h4>AI Playground</h4>
        <p>Advanced workflows, agents, triggers, external APIs and orchestration stay in AI Playground.</p>
        <label className="npc-form-row"><span>Handoff</span><select value={integrations.aiPlaygroundEnabled ? 'Enabled' : 'Disabled'} onChange={(event) => brain.updateIntegrations({ aiPlaygroundEnabled: event.target.value === 'Enabled' })}><option>Enabled</option><option>Disabled</option></select></label>
        <button className="npc-test-button" type="button" disabled title="Cross-product navigation handoff is not wired yet"><ExternalLink size={12} /> Open AI Playground • Not Wired</button>
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
