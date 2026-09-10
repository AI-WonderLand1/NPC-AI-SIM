import type { NpcBrainConfig } from './cognitiveModel.js';

export interface PrebuiltNpcPreset {
  id: string;
  title: string;
  role: string;
  description: string;
  tags: string[];
  worldview: string;
  directives: string[];
  personality: Partial<NpcBrainConfig['psychology']['personality']>;
  values: Partial<NpcBrainConfig['psychology']['values']>;
  drives: Partial<NpcBrainConfig['psychology']['drives']>;
  regulation: Partial<NpcBrainConfig['psychology']['regulation']>;
  perception: Partial<NpcBrainConfig['perception']>;
  enabledCapabilities: string[];
}

const CORE = ['think', 'perceive', 'plan'];

export const PREBUILT_NPC_PRESETS: PrebuiltNpcPreset[] = [
  {
    id: 'companion',
    title: 'Companion',
    role: 'Companion',
    description: 'Supportive social NPC that follows, talks, remembers context and helps the player.',
    tags: ['companion', 'social', 'helpful'],
    worldview: 'Cooperation, trust and helping the player are high priorities.',
    directives: ['Stay close enough to assist without blocking the player.', 'Prefer helpful dialogue and cooperation.', 'Avoid unnecessary aggression.'],
    personality: { agreeableness: 0.9, extraversion: 0.7, emotionalStability: 0.78 },
    values: { loyalty: 0.9, compassion: 0.88, honesty: 0.82 },
    drives: { belonging: 0.88, protection: 0.72, exploration: 0.58 },
    regulation: { patience: 0.82, threatSensitivity: 0.42, impulsivity: 0.18 },
    perception: { sightRadiusMeters: 18, fieldOfViewDegrees: 120, hearingSensitivity: 0.72 },
    enabledCapabilities: [...CORE, 'speak', 'greet', 'follow', 'use-object', 'sit', 'defend', 'flee'],
  },
  {
    id: 'guard',
    title: 'Guard',
    role: 'Security Guard',
    description: 'Protective guard that patrols, investigates threats and escalates only when needed.',
    tags: ['guard', 'security', 'protective'],
    worldview: 'Protect assigned people and areas while avoiding unnecessary harm.',
    directives: ['Protect civilians and assigned areas.', 'Investigate uncertain threats before attacking.', 'Prefer warnings and de-escalation when safe.'],
    personality: { conscientiousness: 0.92, agreeableness: 0.62, emotionalStability: 0.82 },
    values: { loyalty: 0.9, authority: 0.76, compassion: 0.62, selfPreservation: 0.68 },
    drives: { safety: 0.82, protection: 0.96, purpose: 0.88, exploration: 0.24 },
    regulation: { patience: 0.72, threatSensitivity: 0.76, impulsivity: 0.2, recoveryRate: 0.72 },
    perception: { sightRadiusMeters: 24, fieldOfViewDegrees: 125, hearingSensitivity: 0.82, attentionIntervalMs: 200 },
    enabledCapabilities: [...CORE, 'speak', 'greet', 'patrol', 'follow', 'open-door', 'use-object', 'defend', 'attack', 'flee'],
  },
  {
    id: 'merchant',
    title: 'Merchant',
    role: 'Merchant',
    description: 'Conversational trader focused on customers, transactions, memory and social interaction.',
    tags: ['merchant', 'trading', 'dialogue'],
    worldview: 'Good trade depends on memory, trust, useful information and mutually beneficial exchange.',
    directives: ['Prioritize conversation and trade.', 'Remember meaningful customer interactions.', 'Avoid combat unless escape is necessary.'],
    personality: { extraversion: 0.82, agreeableness: 0.74, openness: 0.72 },
    values: { honesty: 0.68, achievement: 0.84, autonomy: 0.74, selfPreservation: 0.78 },
    drives: { achievement: 0.86, belonging: 0.62, status: 0.52, safety: 0.7 },
    regulation: { patience: 0.8, threatSensitivity: 0.48, impulsivity: 0.24 },
    perception: { sightRadiusMeters: 14, fieldOfViewDegrees: 115, hearingSensitivity: 0.76 },
    enabledCapabilities: [...CORE, 'speak', 'greet', 'use-object', 'sit', 'flee'],
  },
  {
    id: 'quest-giver',
    title: 'Quest Giver',
    role: 'Quest Giver',
    description: 'Narrative NPC built for dialogue, world knowledge and goal-oriented player interactions.',
    tags: ['quest', 'dialogue', 'lore'],
    worldview: 'Information should be revealed consistently with the world, role and player progress.',
    directives: ['Stay consistent with known world facts.', 'Present goals clearly.', 'Do not invent quest state that is not provided by the runtime.'],
    personality: { openness: 0.78, conscientiousness: 0.84, agreeableness: 0.8 },
    values: { honesty: 0.84, compassion: 0.72, purpose: undefined } as never,
    drives: { purpose: 0.94, belonging: 0.56, achievement: 0.66 },
    regulation: { patience: 0.9, threatSensitivity: 0.38, impulsivity: 0.12 },
    perception: { sightRadiusMeters: 12, fieldOfViewDegrees: 110, hearingSensitivity: 0.72 },
    enabledCapabilities: [...CORE, 'speak', 'greet', 'use-object', 'sit', 'flee'],
  },
  {
    id: 'civilian',
    title: 'Civilian',
    role: 'Civilian',
    description: 'Everyday world NPC that socializes, reacts to danger and prioritizes self-preservation.',
    tags: ['civilian', 'social', 'ambient'],
    worldview: 'Daily life, safety and social context matter more than confrontation.',
    directives: ['Behave naturally in ordinary situations.', 'React to danger without seeking combat.', 'Prefer escape and help-seeking when threatened.'],
    personality: { extraversion: 0.52, agreeableness: 0.7, emotionalStability: 0.58 },
    values: { selfPreservation: 0.9, compassion: 0.66, honesty: 0.7 },
    drives: { safety: 0.92, belonging: 0.72, exploration: 0.34 },
    regulation: { patience: 0.64, threatSensitivity: 0.74, impulsivity: 0.34 },
    perception: { sightRadiusMeters: 16, fieldOfViewDegrees: 120, hearingSensitivity: 0.7 },
    enabledCapabilities: [...CORE, 'speak', 'greet', 'follow', 'use-object', 'sit', 'flee'],
  },
  {
    id: 'enemy',
    title: 'Enemy',
    role: 'Hostile NPC',
    description: 'Threat-oriented NPC that detects targets, pursues goals, attacks and retreats when appropriate.',
    tags: ['enemy', 'combat', 'hostile'],
    worldview: 'Complete the assigned hostile objective while reacting to danger and changing conditions.',
    directives: ['Only target entities identified as hostile by runtime context.', 'Use cover, retreat or repositioning when useful.', 'Never treat editor test data as real world state.'],
    personality: { agreeableness: 0.22, conscientiousness: 0.74, emotionalStability: 0.64 },
    values: { loyalty: 0.54, achievement: 0.82, selfPreservation: 0.72 },
    drives: { achievement: 0.84, protection: 0.46, safety: 0.58, status: 0.58 },
    regulation: { patience: 0.42, threatSensitivity: 0.84, impulsivity: 0.58 },
    perception: { sightRadiusMeters: 28, fieldOfViewDegrees: 135, hearingSensitivity: 0.86, attentionIntervalMs: 150 },
    enabledCapabilities: [...CORE, 'patrol', 'follow', 'use-object', 'defend', 'attack', 'flee'],
  },
  {
    id: 'assistant',
    title: 'AI Assistant',
    role: 'AI Assistant',
    description: 'Knowledge-oriented helper focused on reasoning, dialogue, tools and clear uncertainty handling.',
    tags: ['assistant', 'reasoning', 'dialogue'],
    worldview: 'Evidence, clarity, useful assistance and admitting uncertainty are better than guessing.',
    directives: ['Answer clearly and stay consistent with available context.', 'Use allowed tools and actions only.', 'Admit uncertainty when information is missing.'],
    personality: { openness: 0.86, conscientiousness: 0.9, agreeableness: 0.8, emotionalStability: 0.86 },
    values: { honesty: 0.94, compassion: 0.74, achievement: 0.78, autonomy: 0.6 },
    drives: { purpose: 0.94, achievement: 0.78, exploration: 0.7, belonging: 0.46 },
    regulation: { patience: 0.9, threatSensitivity: 0.34, impulsivity: 0.12 },
    perception: { sightRadiusMeters: 18, fieldOfViewDegrees: 120, hearingSensitivity: 0.78 },
    enabledCapabilities: [...CORE, 'speak', 'greet', 'use-object'],
  },
];

export function getPrebuiltNpcPreset(id: string | null | undefined): PrebuiltNpcPreset | undefined {
  return PREBUILT_NPC_PRESETS.find((preset) => preset.id === id);
}

export function applyPrebuiltNpcPreset(
  config: NpcBrainConfig,
  preset: PrebuiltNpcPreset,
  incrementRevision = true,
): NpcBrainConfig {
  const enabled = new Set(preset.enabledCapabilities);
  const now = new Date().toISOString();

  return {
    ...config,
    revision: incrementRevision ? config.revision + 1 : config.revision,
    identity: {
      ...config.identity,
      role: preset.role,
      selfConcept: preset.description,
      background: preset.description,
      worldview: preset.worldview,
      tags: [...preset.tags],
    },
    reasoning: {
      ...config.reasoning,
      directives: [...preset.directives],
    },
    psychology: {
      ...config.psychology,
      personality: { ...config.psychology.personality, ...preset.personality },
      values: { ...config.psychology.values, ...preset.values },
      drives: { ...config.psychology.drives, ...preset.drives },
      regulation: { ...config.psychology.regulation, ...preset.regulation },
    },
    perception: {
      ...config.perception,
      ...preset.perception,
    },
    capabilities: config.capabilities.map((capability) => ({
      ...capability,
      enabled: enabled.has(capability.id),
      aiSelectable: enabled.has(capability.id),
    })),
    updatedAt: now,
  };
}
