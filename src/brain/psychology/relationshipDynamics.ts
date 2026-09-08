import type { PsychologyProfile, RelationshipState } from '../cognitiveModel.js';

export type RelationshipStance =
  | 'attached'
  | 'trusted'
  | 'friendly'
  | 'neutral'
  | 'cautious'
  | 'guarded'
  | 'hostile';

export interface RelationshipSignals {
  stance: RelationshipStance;
  affinity: number;
  threatPressure: number;
  cooperation: number;
  avoidance: number;
}

/**
 * Convert structured relationship dimensions into deterministic behavioral
 * signals. This is a fictional-agent/game model, not a human diagnosis model.
 */
export function evaluateRelationship(state?: RelationshipState): RelationshipSignals {
  if (!state) {
    return {
      stance: 'neutral',
      affinity: 0.5,
      threatPressure: 0.15,
      cooperation: 0.45,
      avoidance: 0.1,
    };
  }

  const trust = clamp01(state.trust);
  const familiarity = clamp01(state.familiarity);
  const respect = clamp01(state.respect);
  const attachment = clamp01(state.attachment);
  const suspicion = clamp01(state.suspicion);
  const conflict = clamp01(state.conflict);

  const affinity = clamp01(
    trust * 0.34
    + familiarity * 0.16
    + respect * 0.2
    + attachment * 0.2
    - suspicion * 0.16
    - conflict * 0.2,
  );

  const threatPressure = clamp01(
    suspicion * 0.38
    + conflict * 0.42
    + (1 - trust) * 0.2,
  );

  const cooperation = clamp01(
    trust * 0.36
    + respect * 0.24
    + familiarity * 0.16
    + attachment * 0.14
    - suspicion * 0.12
    - conflict * 0.2,
  );

  const avoidance = clamp01(
    suspicion * 0.28
    + conflict * 0.34
    + (1 - trust) * 0.16
    - attachment * 0.12,
  );

  return {
    stance: classifyStance({ trust, familiarity, respect, attachment, suspicion, conflict, affinity, threatPressure }),
    affinity,
    threatPressure,
    cooperation,
    avoidance,
  };
}

/**
 * Let acute suspicion/conflict cool over time without erasing durable trust,
 * respect, familiarity or attachment. Repairing those dimensions requires new
 * experience rather than a timer.
 */
export function recoverRelationshipTension(
  state: RelationshipState,
  psychology: PsychologyProfile,
  elapsedMs: number,
  updatedAt = new Date().toISOString(),
): RelationshipState {
  if (elapsedMs <= 0) return cloneRelationship(state);

  const hours = elapsedMs / 3_600_000;
  const recovery = clamp01(psychology.regulation.recoveryRate);
  const stability = clamp01(psychology.personality.emotionalStability);
  const patience = clamp01(psychology.regulation.patience);

  const suspicionHalfLifeHours = 36 * (1.35 - recovery * 0.55) * (1.25 - stability * 0.25);
  const conflictHalfLifeHours = 24 * (1.4 - recovery * 0.5) * (1.3 - patience * 0.3);
  const suspicionRetention = Math.pow(0.5, hours / Math.max(1, suspicionHalfLifeHours));
  const conflictRetention = Math.pow(0.5, hours / Math.max(1, conflictHalfLifeHours));

  return {
    ...cloneRelationship(state),
    suspicion: clamp01(state.suspicion * suspicionRetention),
    conflict: clamp01(state.conflict * conflictRetention),
    lastInteractionAt: state.lastInteractionAt ?? updatedAt,
  };
}

function classifyStance(input: {
  trust: number;
  familiarity: number;
  respect: number;
  attachment: number;
  suspicion: number;
  conflict: number;
  affinity: number;
  threatPressure: number;
}): RelationshipStance {
  if (input.conflict >= 0.72 || (input.threatPressure >= 0.72 && input.trust < 0.3)) return 'hostile';
  if (input.conflict >= 0.48 || input.suspicion >= 0.62) return 'guarded';
  if (input.suspicion >= 0.38 || input.threatPressure >= 0.42) return 'cautious';
  if (input.attachment >= 0.72 && input.trust >= 0.7) return 'attached';
  if (input.trust >= 0.76 && (input.familiarity >= 0.38 || input.respect >= 0.7)) return 'trusted';
  if (input.affinity >= 0.58 && input.trust >= 0.55) return 'friendly';
  return 'neutral';
}

function cloneRelationship(state: RelationshipState): RelationshipState {
  return { ...state, tags: [...state.tags] };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
