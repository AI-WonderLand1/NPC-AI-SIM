import type {
  EmotionalState,
  PsychologyProfile,
  RelationshipState,
  Scalar01,
} from '../cognitiveModel.js';

export type PsychologicalEventKind =
  | 'threat'
  | 'aid'
  | 'betrayal'
  | 'praise'
  | 'loss'
  | 'discovery'
  | 'success'
  | 'failure'
  | 'social-positive'
  | 'social-negative';

export interface PsychologicalEvent {
  id: string;
  kind: PsychologicalEventKind;
  intensity: Scalar01;
  confidence: Scalar01;
  subjectId?: string;
  occurredAt: string;
  description?: string;
}

export interface EmotionalDelta {
  valence: number;
  arousal: number;
  joy: number;
  trust: number;
  fear: number;
  anger: number;
  sadness: number;
  surprise: number;
}

export interface RelationshipDelta {
  trust: number;
  familiarity: number;
  respect: number;
  attachment: number;
  suspicion: number;
  conflict: number;
}

export interface PsychologicalAppraisal {
  eventId: string;
  summary: string;
  emotionalDelta: EmotionalDelta;
  stressDelta: number;
  relationshipDelta?: RelationshipDelta;
  memoryImportance: Scalar01;
}

/**
 * Deterministic fictional-agent appraisal model.
 *
 * The coefficients below are tunable game-design parameters. They are not a
 * clinical psychology model and must never be presented as diagnosis. Their
 * purpose is to make event -> emotion -> relationship effects inspectable and
 * reproducible instead of leaving them entirely to an LLM.
 */
export function appraisePsychologicalEvent(
  profile: PsychologyProfile,
  event: PsychologicalEvent,
  relationship?: RelationshipState,
): PsychologicalAppraisal {
  const intensity = clamp01(event.intensity) * clamp01(event.confidence);
  const p = profile.personality;
  const v = profile.values;
  const d = profile.drives;
  const r = profile.regulation;
  const relTrust = relationship?.trust ?? profile.baselineEmotion.trust;

  const emotion = emptyEmotionalDelta();
  const rel = emptyRelationshipDelta();
  let stressDelta = 0;
  let memoryImportance = 0.35 + intensity * 0.35;

  switch (event.kind) {
    case 'threat': {
      emotion.fear += intensity * (0.35 + r.threatSensitivity * 0.65);
      emotion.anger += intensity * (0.08 + (1 - p.agreeableness) * 0.32);
      emotion.arousal += intensity * 0.72;
      emotion.valence -= intensity * 0.55;
      stressDelta += intensity * (0.45 + r.threatSensitivity * 0.45);
      rel.suspicion += intensity * 0.18;
      rel.conflict += intensity * 0.12;
      memoryImportance += intensity * 0.25;
      break;
    }
    case 'aid': {
      emotion.joy += intensity * (0.35 + p.agreeableness * 0.25);
      emotion.trust += intensity * 0.48;
      emotion.valence += intensity * 0.62;
      stressDelta -= intensity * (0.15 + r.recoveryRate * 0.25);
      rel.trust += intensity * (0.28 + v.loyalty * 0.22);
      rel.respect += intensity * 0.3;
      rel.attachment += intensity * (0.1 + d.belonging * 0.18);
      rel.familiarity += intensity * 0.16;
      memoryImportance += intensity * 0.18;
      break;
    }
    case 'betrayal': {
      emotion.anger += intensity * (0.45 + v.loyalty * 0.35);
      emotion.sadness += intensity * (0.25 + p.agreeableness * 0.25);
      emotion.fear += intensity * r.threatSensitivity * 0.28;
      emotion.trust -= intensity * (0.45 + relTrust * 0.35);
      emotion.valence -= intensity * 0.8;
      emotion.arousal += intensity * 0.48;
      stressDelta += intensity * 0.7;
      rel.trust -= intensity * (0.5 + v.loyalty * 0.35);
      rel.suspicion += intensity * 0.72;
      rel.conflict += intensity * 0.58;
      rel.attachment -= intensity * 0.28;
      memoryImportance += intensity * 0.42;
      break;
    }
    case 'praise': {
      emotion.joy += intensity * (0.3 + d.achievement * 0.25);
      emotion.trust += intensity * 0.18;
      emotion.valence += intensity * 0.48;
      rel.respect += intensity * 0.18;
      rel.familiarity += intensity * 0.08;
      memoryImportance += intensity * d.achievement * 0.14;
      break;
    }
    case 'loss': {
      emotion.sadness += intensity * 0.76;
      emotion.fear += intensity * d.safety * 0.18;
      emotion.valence -= intensity * 0.72;
      emotion.arousal += intensity * 0.2;
      stressDelta += intensity * 0.5;
      memoryImportance += intensity * 0.4;
      break;
    }
    case 'discovery': {
      emotion.surprise += intensity * 0.62;
      emotion.joy += intensity * (p.openness * 0.32 + v.curiosity * 0.28);
      emotion.valence += intensity * (0.12 + v.curiosity * 0.22);
      emotion.arousal += intensity * 0.38;
      memoryImportance += intensity * (p.openness * 0.18 + v.curiosity * 0.2);
      break;
    }
    case 'success': {
      emotion.joy += intensity * (0.42 + d.achievement * 0.22);
      emotion.valence += intensity * 0.58;
      stressDelta -= intensity * (0.18 + r.recoveryRate * 0.18);
      memoryImportance += intensity * d.achievement * 0.18;
      break;
    }
    case 'failure': {
      emotion.sadness += intensity * (0.2 + (1 - p.emotionalStability) * 0.32);
      emotion.anger += intensity * r.impulsivity * 0.28;
      emotion.valence -= intensity * 0.42;
      stressDelta += intensity * (0.22 + (1 - p.emotionalStability) * 0.28);
      memoryImportance += intensity * d.achievement * 0.15;
      break;
    }
    case 'social-positive': {
      emotion.joy += intensity * (0.25 + p.extraversion * 0.18 + p.agreeableness * 0.18);
      emotion.trust += intensity * 0.22;
      emotion.valence += intensity * 0.42;
      rel.trust += intensity * 0.2;
      rel.familiarity += intensity * 0.22;
      rel.attachment += intensity * d.belonging * 0.16;
      break;
    }
    case 'social-negative': {
      emotion.sadness += intensity * p.agreeableness * 0.22;
      emotion.anger += intensity * (0.12 + r.impulsivity * 0.25);
      emotion.trust -= intensity * 0.16;
      emotion.valence -= intensity * 0.4;
      stressDelta += intensity * 0.28;
      rel.trust -= intensity * 0.15;
      rel.suspicion += intensity * 0.2;
      rel.conflict += intensity * 0.18;
      break;
    }
  }

  const relationshipDelta = event.subjectId ? rel : undefined;

  return {
    eventId: event.id,
    summary: buildSummary(event, emotion, stressDelta),
    emotionalDelta: emotion,
    stressDelta,
    relationshipDelta,
    memoryImportance: clamp01(memoryImportance),
  };
}

export function applyEmotionalAppraisal(
  current: EmotionalState,
  appraisal: PsychologicalAppraisal,
  updatedAt = new Date().toISOString(),
): EmotionalState {
  const delta = appraisal.emotionalDelta;
  return {
    valence: clampBipolar(current.valence + delta.valence),
    arousal: clamp01(current.arousal + delta.arousal),
    joy: clamp01(current.joy + delta.joy),
    trust: clamp01(current.trust + delta.trust),
    fear: clamp01(current.fear + delta.fear),
    anger: clamp01(current.anger + delta.anger),
    sadness: clamp01(current.sadness + delta.sadness),
    surprise: clamp01(current.surprise + delta.surprise),
    updatedAt,
  };
}

export function applyRelationshipAppraisal(
  current: RelationshipState,
  appraisal: PsychologicalAppraisal,
  lastInteractionAt = new Date().toISOString(),
): RelationshipState {
  const delta = appraisal.relationshipDelta;
  if (!delta) return current;

  return {
    ...current,
    trust: clamp01(current.trust + delta.trust),
    familiarity: clamp01(current.familiarity + delta.familiarity),
    respect: clamp01(current.respect + delta.respect),
    attachment: clamp01(current.attachment + delta.attachment),
    suspicion: clamp01(current.suspicion + delta.suspicion),
    conflict: clamp01(current.conflict + delta.conflict),
    interactionCount: current.interactionCount + 1,
    lastInteractionAt,
  };
}

/** Moves transient emotion back toward the configured baseline. */
export function recoverEmotionalState(
  current: EmotionalState,
  profile: PsychologyProfile,
  elapsedMs: number,
  updatedAt = new Date().toISOString(),
): EmotionalState {
  if (elapsedMs <= 0) return current;

  const minutes = elapsedMs / 60_000;
  const recoveryRate = clamp01(profile.regulation.recoveryRate);
  const blend = clamp01(1 - Math.exp(-minutes * (0.015 + recoveryRate * 0.085)));
  const baseline = profile.baselineEmotion;

  return {
    valence: lerp(current.valence, baseline.valence, blend),
    arousal: lerp(current.arousal, baseline.arousal, blend),
    joy: lerp(current.joy, baseline.joy, blend),
    trust: lerp(current.trust, baseline.trust, blend),
    fear: lerp(current.fear, baseline.fear, blend),
    anger: lerp(current.anger, baseline.anger, blend),
    sadness: lerp(current.sadness, baseline.sadness, blend),
    surprise: lerp(current.surprise, baseline.surprise, blend),
    updatedAt,
  };
}

function emptyEmotionalDelta(): EmotionalDelta {
  return { valence: 0, arousal: 0, joy: 0, trust: 0, fear: 0, anger: 0, sadness: 0, surprise: 0 };
}

function emptyRelationshipDelta(): RelationshipDelta {
  return { trust: 0, familiarity: 0, respect: 0, attachment: 0, suspicion: 0, conflict: 0 };
}

function buildSummary(event: PsychologicalEvent, delta: EmotionalDelta, stressDelta: number): string {
  const strongest: Array<[string, number]> = [
    ['joy', delta.joy],
    ['trust', delta.trust],
    ['fear', delta.fear],
    ['anger', delta.anger],
    ['sadness', delta.sadness],
    ['surprise', delta.surprise],
  ];

  strongest.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const [emotion, amount] = strongest[0];
  const direction = amount >= 0 ? 'increased' : 'decreased';
  const stress = stressDelta > 0.05 ? 'stress increased' : stressDelta < -0.05 ? 'stress decreased' : 'stress mostly unchanged';
  return `${event.kind} appraisal: ${emotion} ${direction}; ${stress}`;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clampBipolar(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}
