import type {
  CapabilityDefinition,
  DecisionInfluence,
  DecisionTrace,
  Scalar01,
} from '../cognitiveModel.js';

export type UtilitySignalType =
  | 'memory'
  | 'perception'
  | 'relationship'
  | 'personality'
  | 'value'
  | 'drive'
  | 'directive';

export interface UtilitySignal {
  type: UtilitySignalType;
  key: string;
  /** Current normalized signal strength, normally 0..1. */
  signal: number;
  /** Signed contribution weight. Negative values discourage the candidate. */
  weight: number;
  reason: string;
  sourceId?: string;
}

export interface BehaviorCandidate {
  id: string;
  label: string;
  capabilityId?: string;
  baseUtility: number;
  urgency: Scalar01;
  confidence: Scalar01;
  signals: UtilitySignal[];
}

export interface ScoredBehaviorCandidate extends BehaviorCandidate {
  score: number;
  contributions: Array<UtilitySignal & { contribution: number }>;
}

export interface DecisionResult {
  selected?: ScoredBehaviorCandidate;
  ranked: ScoredBehaviorCandidate[];
  trace: DecisionTrace;
}

export interface DecisionOptions {
  npcId: string;
  minimumConfidence: Scalar01;
  capabilities: CapabilityDefinition[];
  now?: string;
}

/**
 * Deterministic utility ranking for authoritative behavior selection.
 *
 * LLMs may propose candidates/signals, but this function only selects a
 * candidate whose capability is actually exposed by the runtime. Every score
 * contribution is retained for audit/debug display without storing model
 * chain-of-thought.
 */
export function selectBehavior(
  candidates: BehaviorCandidate[],
  options: DecisionOptions,
): DecisionResult {
  const availableCapabilities = new Map(
    options.capabilities
      .filter((capability) => capability.enabled && capability.aiSelectable)
      .map((capability) => [capability.id, capability]),
  );

  const eligible = candidates.filter((candidate) => {
    if (candidate.confidence < options.minimumConfidence) return false;
    if (!candidate.capabilityId) return true;
    return availableCapabilities.has(candidate.capabilityId);
  });

  const ranked = eligible
    .map(scoreCandidate)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      if (b.urgency !== a.urgency) return b.urgency - a.urgency;
      return a.id.localeCompare(b.id);
    });

  const selected = ranked[0];
  const now = options.now ?? new Date().toISOString();

  const trace: DecisionTrace = {
    id: `decision-${options.npcId}-${Date.parse(now) || Date.now()}`,
    npcId: options.npcId,
    selectedGoalId: selected?.id,
    selectedCapabilityId: selected?.capabilityId,
    confidence: selected?.confidence ?? 0,
    summary: selected
      ? `Selected ${selected.label} with utility ${selected.score.toFixed(3)} from ${ranked.length} eligible candidate(s).`
      : `No behavior candidate met confidence and capability gates.`,
    influences: selected ? toDecisionInfluences(selected) : [],
    createdAt: now,
  };

  return { selected, ranked, trace };
}

export function scoreCandidate(candidate: BehaviorCandidate): ScoredBehaviorCandidate {
  const urgency = clamp01(candidate.urgency);
  const confidence = clamp01(candidate.confidence);

  const contributions = candidate.signals.map((signal) => {
    const normalizedSignal = clampSignedSignal(signal.signal);
    const contribution = normalizedSignal * finiteOrZero(signal.weight);
    return {
      ...signal,
      signal: normalizedSignal,
      weight: finiteOrZero(signal.weight),
      contribution,
    };
  });

  const signalTotal = contributions.reduce((sum, signal) => sum + signal.contribution, 0);
  const score = finiteOrZero(candidate.baseUtility)
    + urgency * 0.35
    + confidence * 0.2
    + signalTotal;

  return {
    ...candidate,
    urgency,
    confidence,
    score,
    contributions,
  };
}

function toDecisionInfluences(candidate: ScoredBehaviorCandidate): DecisionInfluence[] {
  return candidate.contributions
    .filter((signal) => Math.abs(signal.contribution) > 0.0001)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .map((signal) => ({
      type: signal.type,
      id: signal.sourceId,
      label: `${signal.key}: ${signal.reason}`,
      weight: signal.contribution,
    }));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clampSignedSignal(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
