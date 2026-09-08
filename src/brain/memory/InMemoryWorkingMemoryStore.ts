import type { MemoryEntry } from '../cognitiveModel.js';
import type { WorkingMemoryStore } from './MemoryProvider.js';

/**
 * Runtime-local bounded working memory.
 *
 * This store never persists data. When a bucket exceeds its configured limit,
 * it keeps a blend of important and recent items rather than blindly retaining
 * every transient perception. Durable promotion is handled by a separate
 * memory policy/provider.
 */
export class InMemoryWorkingMemoryStore implements WorkingMemoryStore {
  private readonly buckets = new Map<string, MemoryEntry[]>();
  private readonly limits = new Map<string, number>();
  private readonly defaultLimit: number;

  constructor(defaultLimit = 16) {
    this.defaultLimit = normalizeLimit(defaultLimit);
  }

  setLimit(npcId: string, limit: number): void {
    this.limits.set(npcId, normalizeLimit(limit));
    this.prune(npcId);
  }

  list(npcId: string): MemoryEntry[] {
    return (this.buckets.get(npcId) ?? []).map(cloneMemory);
  }

  push(entry: MemoryEntry): void {
    if (entry.kind !== 'working') {
      throw new Error(`WorkingMemoryStore only accepts working memories; received ${entry.kind}`);
    }
    if (!entry.npcId) throw new Error('Working memory requires npcId');
    if (!entry.id) throw new Error('Working memory requires id');

    const bucket = this.buckets.get(entry.npcId) ?? [];
    const withoutDuplicate = bucket.filter((candidate) => candidate.id !== entry.id);
    withoutDuplicate.push(cloneMemory(entry));
    this.buckets.set(entry.npcId, withoutDuplicate);
    this.prune(entry.npcId);
  }

  remove(npcId: string, memoryId: string): void {
    const bucket = this.buckets.get(npcId);
    if (!bucket) return;
    const next = bucket.filter((entry) => entry.id !== memoryId);
    if (next.length === 0) this.buckets.delete(npcId);
    else this.buckets.set(npcId, next);
  }

  clear(npcId: string): void {
    this.buckets.delete(npcId);
  }

  private prune(npcId: string): void {
    const bucket = this.buckets.get(npcId);
    if (!bucket) return;

    const limit = this.limits.get(npcId) ?? this.defaultLimit;
    if (bucket.length <= limit) return;

    const ranked = bucket.map((entry, index) => {
      const recency = bucket.length <= 1 ? 1 : index / (bucket.length - 1);
      const importance = clamp01(entry.importance);
      return {
        entry,
        score: importance * 0.65 + recency * 0.35,
      };
    });

    ranked.sort((a, b) => b.score - a.score);
    const keepIds = new Set(ranked.slice(0, limit).map(({ entry }) => entry.id));
    const kept = bucket.filter((entry) => keepIds.has(entry.id));
    this.buckets.set(npcId, kept);
  }
}

function normalizeLimit(value: number): number {
  if (!Number.isFinite(value)) return 16;
  return Math.max(1, Math.min(256, Math.floor(value)));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function cloneMemory(entry: MemoryEntry): MemoryEntry {
  return {
    ...entry,
    tags: [...entry.tags],
    relatedEntityIds: [...entry.relatedEntityIds],
    sources: entry.sources.map((source) => ({ ...source })),
  };
}
