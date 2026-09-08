import type {
  CognitiveRuntimeSnapshot,
  MemoryEntry,
  NpcBrainConfig,
} from '../cognitiveModel.js';
import { evaluateRelationship } from '../psychology/relationshipDynamics.js';
import type { BehaviorCandidate, UtilitySignal } from './utilityDecisionEngine.js';

export interface BehaviorGenerationContext {
  config: NpcBrainConfig;
  snapshot: CognitiveRuntimeSnapshot;
  recalledMemories?: MemoryEntry[];
}

/**
 * Deterministic baseline candidate generator.
 *
 * This layer proposes goals from current perception, emotion, relationships,
 * memory and configured psychology. It does not execute anything. The utility
 * decision engine still ranks candidates and the capability gate remains
 * authoritative.
 */
export function generateBehaviorCandidates(context: BehaviorGenerationContext): BehaviorCandidate[] {
  const { config, snapshot } = context;
  const perception = snapshot.recentPerception.at(-1);
  const relationship = snapshot.activeRelationship;
  const relationshipSignals = evaluateRelationship(relationship);
  const emotion = snapshot.emotionalState;
  const memories = context.recalledMemories ?? [];
  const candidates: BehaviorCandidate[] = [];

  const subjectPresent = Boolean(perception?.subjectId);
  const perceptionConfidence = clamp01(perception?.confidence ?? 0);
  const trust = clamp01(relationship?.trust ?? emotion.trust);
  const suspicion = clamp01(relationship?.suspicion ?? 0);
  const fearPressure = clamp01(Math.max(
    emotion.fear,
    snapshot.stressLevel * config.psychology.regulation.threatSensitivity,
    relationshipSignals.threatPressure * 0.75,
  ));
  const positiveMemorySignal = memorySignal(memories, 1);
  const negativeMemorySignal = memorySignal(memories, -1);

  if (subjectPresent && fearPressure < 0.72 && relationshipSignals.stance !== 'hostile') {
    candidates.push({
      id: 'goal-social-greet',
      label: 'Greet visible subject',
      capabilityId: 'greet',
      baseUtility: 0.2,
      urgency: clamp01(0.3 + config.psychology.drives.belonging * 0.35),
      confidence: clamp01(Math.max(0.55, perceptionConfidence)),
      signals: compactSignals([
        signal('perception', 'subject-visible', perceptionConfidence, 0.32, 'A perceived subject is available for interaction', perception?.id),
        signal('personality', 'agreeableness', config.psychology.personality.agreeableness, 0.2, 'Cooperative disposition favors a greeting'),
        signal('drive', 'belonging', config.psychology.drives.belonging, 0.16, 'Belonging drive supports social engagement'),
        signal('relationship', 'cooperation', relationshipSignals.cooperation, 0.2, `${relationshipSignals.stance} relationship stance affects willingness to cooperate`, relationship?.subjectId),
        signal('relationship', 'affinity', relationshipSignals.affinity, 0.13, 'Relationship affinity supports social approach', relationship?.subjectId),
        signal('memory', 'positive-history', positiveMemorySignal, 0.12, 'Positive recalled history supports greeting'),
        signal('relationship', 'avoidance', relationshipSignals.avoidance, -0.22, 'Relationship avoidance pressure discourages immediate engagement', relationship?.subjectId),
      ]),
    });

    candidates.push({
      id: 'goal-social-speak',
      label: 'Speak to visible subject',
      capabilityId: 'speak',
      baseUtility: 0.15,
      urgency: clamp01(0.25 + config.psychology.personality.extraversion * 0.3),
      confidence: clamp01(Math.max(0.5, perceptionConfidence)),
      signals: compactSignals([
        signal('perception', 'subject-present', perceptionConfidence, 0.24, 'Perception confirms a conversational target', perception?.id),
        signal('personality', 'extraversion', config.psychology.personality.extraversion, 0.18, 'Extraversion supports initiating dialogue'),
        signal('value', 'compassion', config.psychology.values.compassion, 0.12, 'Compassion favors a communicative response'),
        signal('relationship', 'cooperation', relationshipSignals.cooperation, 0.14, 'Relationship stance affects willingness to communicate', relationship?.subjectId),
        signal('relationship', 'threat-pressure', relationshipSignals.threatPressure, -0.18, 'Relationship threat pressure suppresses casual dialogue', relationship?.subjectId),
      ]),
    });
  }

  if (subjectPresent && relationshipSignals.cooperation >= 0.62 && trust >= 0.58 && fearPressure < 0.45) {
    candidates.push({
      id: 'goal-social-follow',
      label: 'Follow trusted subject',
      capabilityId: 'follow',
      baseUtility: 0.1,
      urgency: clamp01(config.psychology.drives.belonging * 0.45),
      confidence: clamp01(Math.max(0.5, perceptionConfidence)),
      signals: compactSignals([
        signal('relationship', 'cooperation', relationshipSignals.cooperation, 0.3, `${relationshipSignals.stance} stance permits cooperative following`, relationship?.subjectId),
        signal('relationship', 'trust', trust, 0.18, 'Trust supports following behavior', relationship?.subjectId),
        signal('drive', 'belonging', config.psychology.drives.belonging, 0.18, 'Belonging drive supports staying near trusted entities'),
        signal('perception', 'subject-visible', perceptionConfidence, 0.16, 'Target is currently perceived', perception?.id),
      ]),
    });
  }

  if (subjectPresent && (
    fearPressure >= 0.28
    || relationshipSignals.threatPressure >= 0.34
    || suspicion >= 0.42
    || negativeMemorySignal >= 0.35
  )) {
    candidates.push({
      id: 'goal-threat-defend',
      label: 'Adopt defensive response',
      capabilityId: 'defend',
      baseUtility: 0.16,
      urgency: clamp01(Math.max(fearPressure, relationshipSignals.threatPressure, suspicion, negativeMemorySignal)),
      confidence: clamp01(Math.max(0.58, perceptionConfidence)),
      signals: compactSignals([
        signal('drive', 'protection', config.psychology.drives.protection, 0.28, 'Protection drive favors defensive preparation'),
        signal('value', 'self-preservation', config.psychology.values.selfPreservation, 0.22, 'Self-preservation raises defensive utility'),
        signal('relationship', 'threat-pressure', relationshipSignals.threatPressure, 0.32, `${relationshipSignals.stance} relationship stance raises defensive pressure`, relationship?.subjectId),
        signal('relationship', 'suspicion', suspicion, 0.18, 'Suspicion raises defensive caution', relationship?.subjectId),
        signal('memory', 'negative-history', negativeMemorySignal, 0.28, 'Negative recalled history raises defensive utility'),
        signal('personality', 'threat-sensitivity', config.psychology.regulation.threatSensitivity, 0.18, 'Threat sensitivity amplifies defensive readiness'),
      ]),
    });
  }

  if (fearPressure >= 0.58 || snapshot.stressLevel >= 0.72 || relationshipSignals.avoidance >= 0.66) {
    candidates.push({
      id: 'goal-threat-flee',
      label: 'Disengage toward safety',
      capabilityId: 'flee',
      baseUtility: 0.18,
      urgency: clamp01(Math.max(fearPressure, snapshot.stressLevel, relationshipSignals.avoidance)),
      confidence: clamp01(Math.max(0.62, perceptionConfidence)),
      signals: compactSignals([
        signal('drive', 'safety', config.psychology.drives.safety, 0.32, 'Safety drive supports disengagement'),
        signal('value', 'self-preservation', config.psychology.values.selfPreservation, 0.28, 'Self-preservation favors retreat under pressure'),
        signal('personality', 'emotional-stability', 1 - config.psychology.personality.emotionalStability, 0.12, 'Lower stability increases retreat pressure'),
        signal('relationship', 'avoidance', relationshipSignals.avoidance, 0.24, `${relationshipSignals.stance} relationship stance favors distance`, relationship?.subjectId),
      ]),
    });
  }

  candidates.push({
    id: 'goal-cognition-observe',
    label: subjectPresent ? 'Observe before responding' : 'Review current context',
    capabilityId: 'think',
    baseUtility: 0.14,
    urgency: subjectPresent ? 0.34 : 0.22,
    confidence: 0.95,
    signals: compactSignals([
      signal('personality', 'openness', config.psychology.personality.openness, 0.14, 'Openness supports gathering more context'),
      signal('value', 'curiosity', config.psychology.values.curiosity, 0.18, 'Curiosity increases information-gathering utility'),
      signal('drive', 'safety', config.psychology.drives.safety, subjectPresent ? 0.1 : 0.04, 'Safety favors verification before action'),
      signal('memory', 'recalled-context', clamp01(memories.length / Math.max(1, config.memory.retrievalLimit)), 0.08, 'Available memory can inform deliberation'),
      signal('relationship', 'uncertainty', subjectPresent ? clamp01(1 - relationshipSignals.cooperation) : 0, 0.08, 'Lower cooperation increases the value of observing before acting', relationship?.subjectId),
    ]),
  });

  if (!subjectPresent) {
    candidates.push({
      id: 'goal-world-patrol',
      label: 'Patrol configured area',
      capabilityId: 'patrol',
      baseUtility: 0.12,
      urgency: clamp01(0.2 + config.psychology.drives.purpose * 0.3),
      confidence: 0.88,
      signals: compactSignals([
        signal('personality', 'conscientiousness', config.psychology.personality.conscientiousness, 0.18, 'Conscientiousness supports continuing assigned routines'),
        signal('drive', 'purpose', config.psychology.drives.purpose, 0.2, 'Purpose drive supports productive idle behavior'),
        signal('drive', 'exploration', config.psychology.drives.exploration, 0.14, 'Exploration supports moving through the environment'),
      ]),
    });
  }

  return candidates;
}

function signal(
  type: UtilitySignal['type'],
  key: string,
  strength: number,
  weight: number,
  reason: string,
  sourceId?: string,
): UtilitySignal {
  return {
    type,
    key,
    signal: clampSigned(strength),
    weight,
    reason,
    sourceId,
  };
}

function compactSignals(signals: UtilitySignal[]): UtilitySignal[] {
  return signals.filter((entry) => Math.abs(entry.signal * entry.weight) > 0.0001);
}

function memorySignal(memories: MemoryEntry[], direction: 1 | -1): number {
  if (memories.length === 0) return 0;
  let weighted = 0;
  let weightTotal = 0;

  for (const memory of memories) {
    const emotional = clampSigned(memory.emotionalWeight);
    const directional = direction === 1 ? Math.max(0, emotional) : Math.max(0, -emotional);
    const weight = clamp01(memory.importance) * clamp01(memory.confidence);
    weighted += directional * weight;
    weightTotal += weight;
  }

  return weightTotal <= 0 ? 0 : clamp01(weighted / weightTotal);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clampSigned(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}
