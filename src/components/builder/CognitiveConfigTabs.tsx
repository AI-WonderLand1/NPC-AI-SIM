import React from 'react';
import type { NpcBrainEditorState } from '../../brain/useNpcBrainConfig.js';

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
        <p>Baseline affect and regulation parameters. Runtime events will later move live emotion away from this baseline.</p>
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
        <p>The durable adapter is intentionally server-side. The schema and provider boundary exist; credentials and SDK wiring are the next backend stage.</p>
        <label className="npc-form-row"><span>Adapter</span><span className="npc-form-control">Mem0 + MongoDB</span></label>
        <label className="npc-form-row"><span>Status</span><span className="npc-form-control">Not connected</span></label>
        <label className="npc-form-row"><span>Durable</span><span className="npc-form-control">Disabled until adapter health passes</span></label>
        <label className="npc-form-row"><span>Current</span><span className="npc-form-control">Working memory only</span></label>
      </div>
    </div>
  );
}
