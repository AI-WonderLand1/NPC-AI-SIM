// NPC-AI-SIM cognition-first domain model.
//
// This file defines the editor/runtime contract. It intentionally contains no
// database, Mem0, LLM, or game-engine implementation details so the same brain
// schema can be used by the browser editor, server, native runtime, tests, and
// future adapters.

export const NPC_BRAIN_SCHEMA_VERSION = 'npc-brain/v1alpha1' as const;

/** Normalized 0..1 value. Runtime validation will enforce the range. */
export type Scalar01 = number;
/** Normalized -1..1 value. Runtime validation will enforce the range. */
export type BipolarScalar = number;

export type MemoryKind = 'working' | 'episodic' | 'semantic' | 'relationship';
export type CognitivePhase = 'idle' | 'perceiving' | 'reasoning' | 'planning' | 'acting' | 'error';
export type ActionStatus = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface NpcIdentity {
  name: string;
  role: string;
  selfConcept: string;
  background: string;
  worldview: string;
  tags: string[];
}

/**
 * Computational personality dimensions inspired by established personality
 * research. These are design variables for fictional agents, not clinical
 * diagnoses or mental-health assessments.
 */
export interface PersonalityProfile {
  openness: Scalar01;
  conscientiousness: Scalar01;
  extraversion: Scalar01;
  agreeableness: Scalar01;
  emotionalStability: Scalar01;
}

export interface ValueProfile {
  loyalty: Scalar01;
  honesty: Scalar01;
  autonomy: Scalar01;
  authority: Scalar01;
  curiosity: Scalar01;
  compassion: Scalar01;
  achievement: Scalar01;
  selfPreservation: Scalar01;
}

export interface DriveProfile {
  safety: Scalar01;
  belonging: Scalar01;
  achievement: Scalar01;
  exploration: Scalar01;
  status: Scalar01;
  protection: Scalar01;
  purpose: Scalar01;
}

export interface EmotionalState {
  /** Negative to positive affect. */
  valence: BipolarScalar;
  arousal: Scalar01;
  joy: Scalar01;
  trust: Scalar01;
  fear: Scalar01;
  anger: Scalar01;
  sadness: Scalar01;
  surprise: Scalar01;
  updatedAt: string;
}

export interface StressRegulationProfile {
  stress: Scalar01;
  patience: Scalar01;
  impulsivity: Scalar01;
  threatSensitivity: Scalar01;
  recoveryRate: Scalar01;
}

export interface PsychologyProfile {
  personality: PersonalityProfile;
  values: ValueProfile;
  drives: DriveProfile;
  baselineEmotion: Omit<EmotionalState, 'updatedAt'>;
  regulation: StressRegulationProfile;
}

export interface RelationshipState {
  subjectId: string;
  displayName?: string;
  trust: Scalar01;
  familiarity: Scalar01;
  respect: Scalar01;
  attachment: Scalar01;
  suspicion: Scalar01;
  conflict: Scalar01;
  interactionCount: number;
  tags: string[];
  lastInteractionAt?: string;
}

export interface MemorySourceRef {
  type: 'dialogue' | 'perception' | 'event' | 'knowledge' | 'system';
  id?: string;
  label?: string;
}

export interface MemoryEntry {
  id: string;
  npcId: string;
  kind: MemoryKind;
  content: string;
  summary?: string;
  importance: Scalar01;
  emotionalWeight: BipolarScalar;
  confidence: Scalar01;
  tags: string[];
  relatedEntityIds: string[];
  sources: MemorySourceRef[];
  createdAt: string;
  lastAccessedAt?: string;
  expiresAt?: string;
  /** Provider-specific durable-store reference. Never treat this as domain state. */
  storeRef?: string;
}

export interface MemoryPolicy {
  workingMemoryItems: number;
  retrievalLimit: number;
  minimumImportanceToPersist: Scalar01;
  decayEnabled: boolean;
  decayHalfLifeHours?: number;
  promoteWorkingToEpisodic: boolean;
  durableMemoryEnabled: boolean;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  kind: 'text' | 'pdf' | 'url' | 'world-lore' | 'character-history' | 'manual' | 'canon';
  status: 'pending' | 'indexed' | 'error';
  metadata: Record<string, string | number | boolean>;
}

export interface PerceptionConfig {
  sightRadiusMeters: number;
  fieldOfViewDegrees: number;
  hearingSensitivity: Scalar01;
  proximityMeters: number;
  attentionIntervalMs: number;
  trackDynamicObjects: boolean;
  trackStaticObjects: boolean;
}

export interface PerceptionEvent {
  id: string;
  npcId: string;
  kind: 'vision' | 'hearing' | 'proximity' | 'environment' | 'game-event';
  subjectId?: string;
  description: string;
  confidence: Scalar01;
  distanceMeters?: number;
  occurredAt: string;
  data?: Record<string, unknown>;
}

export interface GoalCandidate {
  id: string;
  label: string;
  source: 'drive' | 'relationship' | 'memory' | 'perception' | 'directive' | 'runtime';
  utility: number;
  urgency: Scalar01;
  confidence: Scalar01;
  createdAt: string;
}

export interface CapabilityDefinition {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  aiSelectable: boolean;
  cooldownMs: number;
  requirements: string[];
  targetConstraints: string[];
  runtimeEvent: string;
  parameters: Record<string, unknown>;
}

export interface RuntimeActionState {
  capabilityId: string;
  status: ActionStatus;
  targetId?: string;
  progress?: Scalar01;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
}

export interface ReasoningConfig {
  strategy: 'balanced' | 'utility-first' | 'role-first';
  reasoningDepth: number;
  confidenceThreshold: Scalar01;
  replanningIntervalMs: number;
  contextBudgetTokens: number;
  fallback: 'ask' | 'idle' | 'retry';
  directives: string[];
}

export interface ModelConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface VoiceConfig {
  provider: string;
  voiceId?: string;
  speed: number;
  pitch: number;
  interruptible: boolean;
  subtitles: boolean;
}

export interface IntegrationConfig {
  runtimeTarget: 'generic' | 'godot' | 'unreal' | 'unity' | 'custom';
  aiPlaygroundEnabled: boolean;
  emitRuntimeEvents: boolean;
}

export interface NpcBrainConfig {
  schemaVersion: typeof NPC_BRAIN_SCHEMA_VERSION;
  npcId: string;
  revision: number;
  identity: NpcIdentity;
  model: ModelConfig;
  reasoning: ReasoningConfig;
  psychology: PsychologyProfile;
  memory: MemoryPolicy;
  perception: PerceptionConfig;
  knowledgeSources: KnowledgeSource[];
  voice: VoiceConfig;
  capabilities: CapabilityDefinition[];
  integrations: IntegrationConfig;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionInfluence {
  type: 'memory' | 'perception' | 'relationship' | 'personality' | 'value' | 'drive' | 'directive';
  id?: string;
  label: string;
  weight: number;
}

/**
 * Audit-friendly explanation of why the runtime selected a goal/action.
 * This is structured decision metadata, not private model chain-of-thought.
 */
export interface DecisionTrace {
  id: string;
  npcId: string;
  selectedGoalId?: string;
  selectedCapabilityId?: string;
  confidence: Scalar01;
  summary: string;
  influences: DecisionInfluence[];
  createdAt: string;
}

export interface CognitiveRuntimeSnapshot {
  npcId: string;
  phase: CognitivePhase;
  currentGoal?: GoalCandidate;
  emotionalState: EmotionalState;
  stressLevel: Scalar01;
  activeRelationship?: RelationshipState;
  activeAction?: RuntimeActionState;
  recentPerception: PerceptionEvent[];
  recalledMemoryIds: string[];
  workingMemoryCount: number;
  lastDecision?: DecisionTrace;
  runtimeConnected: boolean;
  updatedAt: string;
}
