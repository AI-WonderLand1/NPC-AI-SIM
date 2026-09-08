import type { MemoryEntry, MemoryPolicy } from '../cognitiveModel.js';

export interface MemoryRecallScore {
  entry: MemoryEntry;
  score: number;
  retention: number;
  importance: number;
  confidence: number;
  emotionalSalience: number;
  recency: number;
}

/**
 * Score memories for cognition without destructively deleting old experience.
 *
 * Decay lowers retrieval priority over time. Importance, confidence and strong
 * emotional weight can keep an old memory relevant. Semantic memories decay
 * more slowly than episodic memories, while working memory remains primarily
 * session-local and recency-sensitive.
 */
export function scoreMemoryForRecall(
  entry: MemoryEntry,
  policy: MemoryPolicy,
  now = new Date().toISOString(),
): MemoryRecallScore {
  const nowMs = parseTime(now, Date.now());
  const createdMs = parseTime(entry.createdAt, nowMs);
  const accessedMs = entry.lastAccessedAt ? parseTime(entry.lastAccessedAt, createdMs) : createdMs;
  const referenceMs = Math.max(createdMs, accessedMs);
  const ageHours = Math.max(0, (nowMs - referenceMs) / 3_600_000);
  const importance = clamp01(entry.importance);
  const confidence = clamp01(entry.confidence);
  const emotionalSalience = clamp01(Math.abs(entry.emotionalWeight));
  const retention = calculateRetention(entry, policy, ageHours);
  const recency = calculateRecency(entry, policy, ageHours);

  let score = importance * 0.38
    + confidence * 0.2
    + emotionalSalience * 0.14
    + retention * 0.18
    + recency * 0.1;

  if (entry.kind === 'semantic') score += 0.04;
  if (entry.kind === 'relationship') score += 0.03;
  if (entry.kind === 'working') score += recency * 0.08;

  if (isExpired(entry, nowMs)) score = Number.NEGATIVE_INFINITY;

  return {
    entry,
    score,
    retention,
    importance,
    confidence,
    emotionalSalience,
    recency,
  };
}

export function rankMemoriesForRecall(
  entries: MemoryEntry[],
  policy: MemoryPolicy,
  limit: number,
  now = new Date().toISOString(),
): MemoryEntry[] {
  const safeLimit = Math.max(0, Math.floor(limit));
  if (safeLimit === 0) return [];

  return entries
    .map((entry) => scoreMemoryForRecall(entry, policy, now))
    .filter((scored) => Number.isFinite(scored.score))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.importance !== a.importance) return b.importance - a.importance;
      const createdDelta = parseTime(b.entry.createdAt, 0) - parseTime(a.entry.createdAt, 0);
      if (createdDelta !== 0) return createdDelta;
      return a.entry.id.localeCompare(b.entry.id);
    })
    .slice(0, safeLimit)
    .map(({ entry }) => cloneMemory(entry));
}

/**
 * Reinforce an already-matched memory when new evidence supports it.
 * Similarity/matching remains the caller/provider's responsibility.
 */
export function reinforceMemory(
  existing: MemoryEntry,
  evidence: Pick<MemoryEntry, 'importance' | 'confidence' | 'emotionalWeight'>,
  accessedAt = new Date().toISOString(),
): MemoryEntry {
  const evidenceConfidence = clamp01(evidence.confidence);
  const nextConfidence = 1 - ((1 - clamp01(existing.confidence)) * (1 - evidenceConfidence * 0.55));
  const nextImportance = clamp01(
    Math.max(existing.importance, evidence.importance)
    + Math.min(existing.importance, evidence.importance) * 0.08,
  );
  const nextEmotion = clampBipolar(
    existing.emotionalWeight * 0.7 + evidence.emotionalWeight * 0.3,
  );

  return {
    ...cloneMemory(existing),
    importance: nextImportance,
    confidence: clamp01(nextConfidence),
    emotionalWeight: nextEmotion,
    lastAccessedAt: accessedAt,
  };
}

export function isMemoryEligibleForPromotion(entry: MemoryEntry, policy: MemoryPolicy): boolean {
  return entry.kind === 'working'
    && policy.promoteWorkingToEpisodic
    && clamp01(entry.importance) >= clamp01(policy.minimumImportanceToPersist);
}

function calculateRetention(entry: MemoryEntry, policy: MemoryPolicy, ageHours: number): number {
  if (!policy.decayEnabled) return 1;

  const baseHalfLife = Math.max(1, policy.decayHalfLifeHours ?? 720);
  const kindMultiplier = entry.kind === 'semantic'
    ? 4
    : entry.kind === 'relationship'
      ? 2.5
      : entry.kind === 'working'
        ? 0.08
        : 1;

  const importanceMultiplier = 0.65 + clamp01(entry.importance) * 1.35;
  const emotionalMultiplier = 0.85 + Math.abs(clampBipolar(entry.emotionalWeight)) * 0.45;
  const effectiveHalfLife = baseHalfLife * kindMultiplier * importanceMultiplier * emotionalMultiplier;

  return clamp01(Math.pow(0.5, ageHours / effectiveHalfLife));
}

function calculateRecency(entry: MemoryEntry, policy: MemoryPolicy, ageHours: number): number {
  const baseHalfLife = Math.max(1, policy.decayHalfLifeHours ?? 720);
  const recencyHalfLife = entry.kind === 'working'
    ? Math.max(0.25, baseHalfLife * 0.01)
    : Math.max(1, baseHalfLife * 0.25);
  return clamp01(Math.pow(0.5, ageHours / recencyHalfLife));
}

function isExpired(entry: MemoryEntry, nowMs: number): boolean {
  if (!entry.expiresAt) return false;
  const expiresMs = Date.parse(entry.expiresAt);
  return Number.isFinite(expiresMs) && expiresMs <= nowMs;
}

function parseTime(value: string, fallback: number): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clampBipolar(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

function cloneMemory(entry: MemoryEntry): MemoryEntry {
  return {
    ...entry,
    tags: [...entry.tags],
    relatedEntityIds: [...entry.relatedEntityIds],
    sources: entry.sources.map((source) => ({ ...source })),
  };
}
