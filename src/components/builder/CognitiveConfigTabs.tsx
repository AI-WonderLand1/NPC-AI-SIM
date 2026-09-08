import React from 'react';
import type { NpcBrainEditorState } from '../../brain/useNpcBrainConfig.js';
import { useMemoryHealth } from './useMemoryHealth.js';

interface PercentSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function PercentSlider({ label, value, onChange }: PercentSliderProps) {
  const percent = Math.round(value * 100);
  return (
    <label className="npc-slider-row">
      <span>{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={percent}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
      <span className="npc-number-chip">{percent}</span>
    </label>
  );
}

export function ConnectedBrainTab({ brain }: { brain: NpcBrainEditorState }) {
  const { reasoning, model } = brain.config;

  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card">
        <h4>Reasoning</h4>
        <p>Controls the amount of deliberation the NPC may use before selecting an allowed action.</p>
        <label className="npc-slider-row">
          <span>Depth</span>
          <input type="range" min="1" max="10" value={reasoning.reasoningDepth} onChange={(event) => brain.updateReasoning({ reasoningDepth: Number(event.target.value) })} />
          <span className="npc-number-chip">{reasoning.reasoningDepth}</span>
        </label>
        <PercentSlider label="Confidence" value={reasoning.confidenceThreshold} onChange={(confidenceThreshold) => brain.updateReasoning({ confidenceThreshold })} />
        <label className="npc-form-row">
          <span>Context</span>
          <input type="number" min="512" step="512" value={reasoning.contextBudgetTokens} onChange={(event) => brain.updateReasoning({ contextBudgetTokens: Math.max(512, Number(event.target.value)) })} />
        </label>
        <label className="npc-form-row"><span>Model Max</span><span className="npc-form-control">{model.maxTokens} tokens</span></label>
      </div>

      <div className="npc-config-card">
        <h4>Goal Selection</h4>
        <p>Perception, memory, psychology, drives and relationships contribute to candidate goal utility.</p>
        <label className="npc-form-row">
          <span>Strategy</span>
          <select value={reasoning.strategy} onChange={(event) => brain.updateReasoning({ strategy: event.target.value as typeof reasoning.strategy })}>
            <option value="balanced">Balanced</option>
            <option value="utility-first">Utility First</option>
            <option value="role-first">Role First</option>
          </select>
        </label>
        <label className="npc-slider-row">
          <span>Replan</span>
          <input type="range" min="100" max="3000" step="50" value={reasoning.replanningIntervalMs} onChange={(event) => brain.updateReasoning({ replanningIntervalMs: Number(event.target.value) })} />
          <span className="npc-number-chip">{reasoning.replanningIntervalMs}ms</span>
        </label>
        <label className="npc-form-row">
          <span>Fallback</span>
          <select value={reasoning.fallback} onChange={(event) => brain.updateReasoning({ fallback: event.target.value as typeof reasoning.fallback })}>
            <option value="ask">Ask</option>
            <option value="idle">Idle</option>
            <option value="retry">Retry</option>
          </select>
        </label>
      </div>

      <div className="npc-config-card">
        <h4>Capability Gate</h4>
        <p>The model may suggest intent, but only enabled runtime capabilities are eligible for authoritative execution.</p>
        <label className="npc-form-row"><span>Enabled</span><span className="npc-form-control">{brain.config.capabilities.filter((capability) => capability.enabled).length} / {brain.config.capabilities.length}</span></label>
        <label className="npc-form-row"><span>AI Selectable</span><span className="npc-form-control">{brain.config.capabilities.filter((capability) => capability.enabled && capability.aiSelectable).length}</span></label>
        <label className="npc-form-row"><span>Runtime</span><span className="npc-form-control">{brain.config.integrations.runtimeTarget}</span></label>
        <label className="npc-form-row"><span>Schema</span><span className="npc-form-control">{brain.config.schemaVersion}</span></label>
      </div>
    </div>
  );
}

export function ConnectedPersonalityTab({ brain }: { brain: NpcBrainEditorState }) {
  const { psychology } = brain.config;

  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card">
        <h4>Personality Dimensions</h4>
        <p>Stable tendencies that influence goal scoring and response style without overriding runtime safety.</p>
        <PercentSlider label="Openness" value={psychology.personality.openness} onChange={(openness) => brain.updatePsychology({ personality: { ...psychology.personality, openness } })} />
        <PercentSlider label="Conscience" value={psychology.personality.conscientiousness} onChange={(conscientiousness) => brain.updatePsychology({ personality: { ...psychology.personality, conscientiousness } })} />
        <PercentSlider label="Extraversion" value={psychology.personality.extraversion} onChange={(extraversion) => brain.updatePsychology({ personality: { ...psychology.personality, extraversion } })} />
        <PercentSlider label="Agreeable" value={psychology.personality.agreeableness} onChange={(agreeableness) => brain.updatePsychology({ personality: { ...psychology.personality, agreeableness } })} />
        <PercentSlider label="Stability" value={psychology.personality.emotionalStability} onChange={(emotionalStability) => brain.updatePsychology({ personality: { ...psychology.personality, emotionalStability } })} />
      </div>

      <div className="npc-config-card">
        <h4>Values & Drives</h4>
        <p>Persistent priorities that shape what the NPC considers important before goals are selected.</p>
        <PercentSlider label="Loyalty" value={psychology.values.loyalty} onChange={(loyalty) => brain.updatePsychology({ values: { ...psychology.values, loyalty } })} />
        <PercentSlider label="Honesty" value={psychology.values.honesty} onChange={(honesty) => brain.updatePsychology({ values: { ...psychology.values, honesty } })} />
        <PercentSlider label="Curiosity" value={psychology.values.curiosity} onChange={(curiosity) => brain.updatePsychology({ values: { ...psychology.values, curiosity } })} />
        <PercentSlider label="Compassion" value={psychology.values.compassion} onChange={(compassion) => brain.updatePsychology({ values: { ...psychology.values, compassion } })} />
        <PercentSlider label="Safety" value={psychology.drives.safety} onChange={(safety) => brain.updatePsychology({ drives: { ...psychology.drives, safety } })} />
        <PercentSlider label="Belonging" value={psychology.drives.belonging} onChange={(belonging) => brain.updatePsychology({ drives: { ...psychology.drives, belonging } })} />
        <PercentSlider label="Exploration" value={psychology.drives.exploration} onChange={(exploration) => brain.updatePsychology({ drives: { ...psychology.drives, exploration } })} />
        <PercentSlider label="Protection" value={psychology.drives.protection} onChange={(protection) => brain.updatePsychology({ drives: { ...psychology.drives, protection } })} />
      </div>

      <div className="npc-config-card">
        <h4>Emotion & Regulation</h4>
        <p>Baseline affect and regulation parameters. Runtime events move live emotion away from this baseline, then recovery pulls it back over time.</p>
        <PercentSlider label="Joy" value={psychology.baselineEmotion.joy} onChange={(joy) => brain.updatePsychology({ baselineEmotion: { ...psychology.baselineEmotion, joy } })} />
        <PercentSlider label="Trust" value={psychology.baselineEmotion.trust} onChange={(trust) => brain.updatePsychology({ baselineEmotion: { ...psychology.baselineEmotion, trust } })} />
        <PercentSlider label="Fear" value={psychology.baselineEmotion.fear} onChange={(fear) => brain.updatePsychology({ baselineEmotion: { ...psychology.baselineEmotion, fear } })} />
        <PercentSlider label="Anger" value={psychology.baselineEmotion.anger} onChange={(anger) => brain.updatePsychology({ baselineEmotion: { ...psychology.baselineEmotion, anger } })} />
        <PercentSlider label="Stress" value={psychology.regulation.stress} onChange={(stress) => brain.updatePsychology({ regulation: { ...psychology.regulation, stress } })} />
        <PercentSlider label="Patience" value={psychology.regulation.patience} onChange={(patience) => brain.updatePsychology({ regulation: { ...psychology.regulation, patience } })} />
        <PercentSlider label="Threat Sens." value={psychology.regulation.threatSensitivity} onChange={(threatSensitivity) => brain.updatePsychology({ regulation: { ...psychology.regulation, threatSensitivity } })} />
        <PercentSlider label="Recovery" value={psychology.regulation.recoveryRate} onChange={(recoveryRate) => brain.updatePsychology({ regulation: { ...psychology.regulation, recoveryRate } })} />
      </div>
    </div>
  );
}

export function ConnectedMemoryTab({ brain }: { brain: NpcBrainEditorState }) {
  const { memory } = brain.config;
  const health = useMemoryHealth();
  const durableAvailable = !health.loading && health.connected && health.durable;
  const status = health.loading
    ? 'Checking service'
    : durableAvailable
      ? 'Connected'
      : health.error
        ? 'Unavailable'
        : 'Not connected';

  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card">
        <h4>Working Memory</h4>
        <p>Runtime-local context for the current conversation, perceptions, goals, targets and active action state.</p>
        <label className="npc-slider-row">
          <span>Window</span>
          <input type="range" min="4" max="64" value={memory.workingMemoryItems} onChange={(event) => brain.updateMemory({ workingMemoryItems: Number(event.target.value) })} />
          <span className="npc-number-chip">{memory.workingMemoryItems}</span>
        </label>
        <label className="npc-slider-row">
          <span>Recall Limit</span>
          <input type="range" min="1" max="20" value={memory.retrievalLimit} onChange={(event) => brain.updateMemory({ retrievalLimit: Number(event.target.value) })} />
          <span className="npc-number-chip">{memory.retrievalLimit}</span>
        </label>
        <label className="npc-form-row">
          <span>Promotion</span>
          <select value={memory.promoteWorkingToEpisodic ? 'Meaningful only' : 'Disabled'} onChange={(event) => brain.updateMemory({ promoteWorkingToEpisodic: event.target.value === 'Meaningful only' })}>
            <option>Meaningful only</option>
            <option>Disabled</option>
          </select>
        </label>
      </div>

      <div className="npc-config-card">
        <h4>Durable Memory Policy</h4>
        <p>Controls what is eligible to leave working memory. Intermediate reasoning and frame-by-frame perception are not durable memories.</p>
        <PercentSlider label="Importance" value={memory.minimumImportanceToPersist} onChange={(minimumImportanceToPersist) => brain.updateMemory({ minimumImportanceToPersist })} />
        <label className="npc-form-row">
          <span>Decay</span>
          <select value={memory.decayEnabled ? 'Enabled' : 'Disabled'} onChange={(event) => brain.updateMemory({ decayEnabled: event.target.value === 'Enabled' })}>
            <option>Enabled</option>
            <option>Disabled</option>
          </select>
        </label>
        <label className="npc-form-row">
          <span>Half Life</span>
          <input type="number" min="1" value={memory.decayHalfLifeHours ?? 720} onChange={(event) => brain.updateMemory({ decayHalfLifeHours: Math.max(1, Number(event.target.value)) })} />
        </label>
      </div>

      <div className="npc-config-card">
        <h4>Mem0 + MongoDB</h4>
        <p>Durable memory remains server-side. This status is read from the Node health endpoint and does not expose MongoDB or Mem0 credentials to the browser.</p>
        <label className="npc-form-row"><span>Provider</span><span className="npc-form-control">{health.provider}</span></label>
        <label className="npc-form-row"><span>Status</span><span className="npc-form-control">{status}</span></label>
        <label className="npc-form-row">
          <span>Mode</span>
          <select
            value={memory.durableMemoryEnabled ? 'Durable enabled' : 'Working only'}
            onChange={(event) => brain.updateMemory({ durableMemoryEnabled: event.target.value === 'Durable enabled' })}
          >
            <option>Working only</option>
            <option disabled={!durableAvailable}>Durable enabled</option>
          </select>
        </label>
        <label className="npc-form-row"><span>Current</span><span className="npc-form-control">{memory.durableMemoryEnabled ? (durableAvailable ? 'Working + durable' : 'Configured, service unavailable') : 'Working memory only'}</span></label>
      </div>
    </div>
  );
}

export function ConnectedPerceptionTab({ brain }: { brain: NpcBrainEditorState }) {
  const { perception } = brain.config;

  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card">
        <h4>Vision</h4>
        <label className="npc-slider-row">
          <span>Radius</span>
          <input type="range" min="1" max="100" value={perception.sightRadiusMeters} onChange={(event) => brain.updatePerception({ sightRadiusMeters: Number(event.target.value) })} />
          <span className="npc-number-chip">{perception.sightRadiusMeters}m</span>
        </label>
        <label className="npc-slider-row">
          <span>FOV</span>
          <input type="range" min="30" max="300" value={perception.fieldOfViewDegrees} onChange={(event) => brain.updatePerception({ fieldOfViewDegrees: Number(event.target.value) })} />
          <span className="npc-number-chip">{perception.fieldOfViewDegrees}°</span>
        </label>
        <label className="npc-slider-row">
          <span>Proximity</span>
          <input type="range" min="0.5" max="20" step="0.5" value={perception.proximityMeters} onChange={(event) => brain.updatePerception({ proximityMeters: Number(event.target.value) })} />
          <span className="npc-number-chip">{perception.proximityMeters}m</span>
        </label>
      </div>

      <div className="npc-config-card">
        <h4>Hearing & Attention</h4>
        <PercentSlider label="Hearing" value={perception.hearingSensitivity} onChange={(hearingSensitivity) => brain.updatePerception({ hearingSensitivity })} />
        <label className="npc-slider-row">
          <span>Attention</span>
          <input type="range" min="50" max="2000" step="50" value={perception.attentionIntervalMs} onChange={(event) => brain.updatePerception({ attentionIntervalMs: Number(event.target.value) })} />
          <span className="npc-number-chip">{perception.attentionIntervalMs}ms</span>
        </label>
        <p>The editor can feed deterministic local test events. True live perception remains unavailable until an external runtime event stream is connected.</p>
      </div>

      <div className="npc-config-card">
        <h4>World Awareness</h4>
        <label className="npc-form-row">
          <span>Dynamic</span>
          <select value={perception.trackDynamicObjects ? 'Track' : 'Ignore'} onChange={(event) => brain.updatePerception({ trackDynamicObjects: event.target.value === 'Track' })}>
            <option>Track</option><option>Ignore</option>
          </select>
        </label>
        <label className="npc-form-row">
          <span>Static</span>
          <select value={perception.trackStaticObjects ? 'Track' : 'Ignore'} onChange={(event) => brain.updatePerception({ trackStaticObjects: event.target.value === 'Track' })}>
            <option>Track</option><option>Ignore</option>
          </select>
        </label>
        <label className="npc-form-row"><span>Events</span><span className="npc-form-control">Vision / Hearing / Proximity / Environment</span></label>
      </div>
    </div>
  );
}
