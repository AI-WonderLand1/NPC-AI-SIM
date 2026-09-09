import React from 'react';
import { Activity, GraduationCap } from 'lucide-react';
import type { CapabilityDefinition } from '../../brain/cognitiveModel.js';
import type { NpcBrainEditorState } from '../../brain/useNpcBrainConfig.js';
import {
  SYSTEM_TRAINING_SCENE,
  TRAINING_COURSES,
  type TrainingCourse,
} from '../../training/trainingCatalog.js';

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

const ANIMATION_SLOTS: Array<{
  capabilityId: string;
  slot: string;
  layer: 'Locomotion' | 'One-shot' | 'Upper Body' | 'Reaction';
}> = [
  { capabilityId: 'walk', slot: 'Walk', layer: 'Locomotion' },
  { capabilityId: 'run', slot: 'Run', layer: 'Locomotion' },
  { capabilityId: 'jump', slot: 'Jump / Land', layer: 'One-shot' },
  { capabilityId: 'speak', slot: 'Talk / Gesture', layer: 'Upper Body' },
  { capabilityId: 'greet', slot: 'Greeting', layer: 'One-shot' },
  { capabilityId: 'use-object', slot: 'Use Object', layer: 'One-shot' },
  { capabilityId: 'open-door', slot: 'Open Door', layer: 'One-shot' },
  { capabilityId: 'sit', slot: 'Sit / Stand', layer: 'One-shot' },
  { capabilityId: 'defend', slot: 'Defend', layer: 'Reaction' },
  { capabilityId: 'attack', slot: 'Attack', layer: 'One-shot' },
  { capabilityId: 'flee', slot: 'Flee', layer: 'Locomotion' },
];

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

/**
 * Actions are the authoritative things the NPC is allowed to request from a runtime.
 * They are not animation clips and they are not training courses.
 */
export function ConnectedActionsOnlyTab({ brain }: { brain: NpcBrainEditorState }) {
  const toggleCapability = (capabilityId: string) => {
    brain.setCapabilities(brain.config.capabilities.map((capability) => (
      capability.id === capabilityId
        ? { ...capability, enabled: !capability.enabled }
        : capability
    )));
  };

  return (
    <>
      <div className="npc-config-card-grid" style={{ marginBottom: 12 }}>
        <div className="npc-config-card">
          <h4>Action / Capability Layer</h4>
          <p>Actions define what the NPC may ask the authoritative runtime to do. They expose permissions, constraints and runtime events. Animation playback is handled separately.</p>
          <label className="npc-form-row"><span>Enabled</span><span className="npc-form-control">{brain.config.capabilities.filter((capability) => capability.enabled).length}</span></label>
          <label className="npc-form-row"><span>Total</span><span className="npc-form-control">{brain.config.capabilities.length}</span></label>
        </div>
      </div>

      <div className="npc-action-catalog">
        {brain.config.capabilities.map((capability) => (
          <button
            className="npc-action-tile"
            key={capability.id}
            type="button"
            onClick={() => toggleCapability(capability.id)}
            title="Toggle whether this runtime capability is enabled"
          >
            <strong>{capability.label}</strong>
            <span>{capability.description}</span>
            <span>{capability.runtimeEvent}</span>
            <em>{capability.enabled ? (capability.aiSelectable ? 'AI SELECTABLE • ENABLED' : 'MANUAL ONLY • ENABLED') : 'CAPABILITY DISABLED'}</em>
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * Animations are presentation bindings for a linked character/test host.
 * They do not grant skills or permissions. Runtime actions may trigger them later.
 */
export function ConnectedAnimationsTab({ brain }: { brain: NpcBrainEditorState }) {
  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card">
        <h4><Activity size={14} /> Animation System</h4>
        <p>Animations are visual motion clips on a linked GLB/GLTF test character. They respond to runtime state and action events; they do not teach the NPC a skill and they do not authorize an action.</p>
        <label className="npc-form-row"><span>Character Host</span><span className="npc-form-control">NOT LINKED</span></label>
        <label className="npc-form-row"><span>Clip Source</span><span className="npc-form-control">GLB / GLTF animation clips</span></label>
        <label className="npc-form-row"><span>Mixer</span><span className="npc-form-control">Runtime host required</span></label>
      </div>

      <div className="npc-config-card">
        <h4>Playback Contract</h4>
        <p>The brain emits action/runtime state. A linked character adapter maps those events to locomotion, one-shot, upper-body and reaction clips.</p>
        <label className="npc-form-row"><span>Idle</span><span className="npc-form-control">Base locomotion state</span></label>
        <label className="npc-form-row"><span>Transitions</span><span className="npc-form-control">Character runtime owns blending</span></label>
        <label className="npc-form-row"><span>Status</span><span className="npc-form-control">BINDINGS PENDING TEST HOST</span></label>
      </div>

      {ANIMATION_SLOTS.map((binding) => {
        const capability = brain.config.capabilities.find((item) => item.id === binding.capabilityId);
        return (
          <div className="npc-config-card" key={binding.capabilityId}>
            <h4>{binding.slot}</h4>
            <p>{binding.layer} animation slot for the <strong>{capability?.label ?? binding.capabilityId}</strong> runtime state/action.</p>
            <label className="npc-form-row"><span>Runtime Event</span><span className="npc-form-control">{capability?.runtimeEvent ?? `npc.action.${binding.capabilityId}`}</span></label>
            <label className="npc-form-row"><span>Action</span><span className="npc-form-control">{capability?.enabled ? 'ENABLED' : 'DISABLED / NOT INSTALLED'}</span></label>
            <label className="npc-form-row"><span>Clip</span><span className="npc-form-control">UNBOUND</span></label>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Training & Skills owns reusable courses and validation requirements.
 * Installing a course may add capability hooks, but validation is a separate Training Lab concern.
 */
export function ConnectedTrainingSkillsTab({ brain }: { brain: NpcBrainEditorState }) {
  const installCourse = (course: TrainingCourse) => {
    if (course.adaptiveTraining) return;
    const skills = COURSE_SKILLS[course.id] ?? [];
    const next = [...brain.config.capabilities];

    for (const skill of skills) {
      const existingIndex = next.findIndex((capability) => capability.id === skill[0]);
      if (existingIndex >= 0) {
        const requirements = Array.from(new Set([
          ...next[existingIndex].requirements,
          `course:${course.id}`,
        ]));
        next[existingIndex] = {
          ...next[existingIndex],
          enabled: true,
          requirements,
        };
      } else {
        next.push(courseCapability(course, skill));
      }
    }

    brain.setCapabilities(next);
  };

  const courseInstalled = (course: TrainingCourse) => {
    const skills = COURSE_SKILLS[course.id] ?? [];
    return skills.length > 0 && skills.every(([id]) => (
      brain.config.capabilities.some((capability) => (
        capability.id === id
        && capability.enabled
        && capability.requirements.includes(`course:${course.id}`)
      ))
    ));
  };

  return (
    <div className="npc-config-card-grid">
      <div className="npc-config-card">
        <h4><GraduationCap size={14} /> System Training Lab</h4>
        <p>Training installs and validates reusable skills. The lab is a locked test environment, not an animation editor and not the action-permission screen.</p>
        <label className="npc-form-row"><span>Scene</span><span className="npc-form-control">{SYSTEM_TRAINING_SCENE.name}</span></label>
        <label className="npc-form-row"><span>Fixtures</span><span className="npc-form-control">{SYSTEM_TRAINING_SCENE.fixtures.length} deterministic fixtures</span></label>
        <label className="npc-form-row"><span>Ownership</span><span className="npc-form-control">SYSTEM • READ ONLY</span></label>
        <label className="npc-form-row"><span>Executor</span><span className="npc-form-control">VALIDATION RUNTIME PENDING</span></label>
      </div>

      {TRAINING_COURSES.map((course) => {
        const installed = courseInstalled(course);
        const skillCount = (COURSE_SKILLS[course.id] ?? []).length;
        return (
          <div className="npc-config-card" key={course.id}>
            <h4>{course.name}</h4>
            <p>{course.description}</p>
            <label className="npc-form-row"><span>Category</span><span className="npc-form-control">{course.category.toUpperCase()}</span></label>
            <label className="npc-form-row"><span>Skill Package</span><span className="npc-form-control">{skillCount} capability hook(s)</span></label>
            <label className="npc-form-row"><span>Lab Checks</span><span className="npc-form-control">{course.validation.length} validation requirement(s)</span></label>
            <label className="npc-form-row"><span>Status</span><span className="npc-form-control">{course.adaptiveTraining ? 'ADVANCED RUNNER REQUIRED' : installed ? 'SKILL INSTALLED • TRAINING PENDING' : 'NOT INSTALLED'}</span></label>
            <button
              className="npc-test-button"
              type="button"
              onClick={() => installCourse(course)}
              disabled={course.adaptiveTraining || installed || skillCount === 0}
              title={course.adaptiveTraining ? 'Adaptive learning runner is not implemented yet' : 'Install this reusable skill package into the NPC brain config'}
            >
              {course.adaptiveTraining ? 'Future Adaptive Training' : installed ? 'Skill Installed' : 'Install Skill Course'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
