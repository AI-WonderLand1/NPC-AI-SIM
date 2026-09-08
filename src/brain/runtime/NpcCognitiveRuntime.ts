import type {
  CognitivePhase,
  CognitiveRuntimeSnapshot,
  DecisionTrace,
  EmotionalState,
  GoalCandidate,
  MemoryEntry,
  NpcBrainConfig,
  PerceptionEvent,
  RelationshipState,
  RuntimeActionState,
} from '../cognitiveModel.js';
import {
  selectBehavior,
  type BehaviorCandidate,
  type DecisionResult,
} from '../decision/utilityDecisionEngine.js';
import { InMemoryWorkingMemoryStore } from '../memory/InMemoryWorkingMemoryStore.js';
import {
  isMemoryEligibleForPromotion,
  rankMemoriesForRecall,
} from '../memory/memoryDynamics.js';
import type { DurableMemoryProvider } from '../memory/MemoryProvider.js';
import {
  appraisePsychologicalEvent,
  applyEmotionalAppraisal,
  applyRelationshipAppraisal,
  recoverEmotionalState,
  type PsychologicalAppraisal,
  type PsychologicalEvent,
} from '../psychology/psychologyRuntime.js';

export interface CognitiveRuntimeOptions {
  durableMemory?: DurableMemoryProvider;
  workingMemory?: InMemoryWorkingMemoryStore;
  now?: () => string;
}

export interface PsychologicalEventResult {
  appraisal: PsychologicalAppraisal;
  emotionalState: EmotionalState;
  stressLevel: number;
  relationship?: RelationshipState;
  promotedMemories: MemoryEntry[];
  warnings: string[];
}

export interface RecallContextResult {
  working: MemoryEntry[];
  durable: MemoryEntry[];
  combined: MemoryEntry[];
  warnings: string[];
}

/**
 * TypeScript reference cognition runtime.
 *
 * This is not the future native BehaviorTree.CPP execution layer. It composes
 * the cognition rules used by the editor/server today and provides a stable,
 * deterministic reference for the later native bridge.
 */
export class NpcCognitiveRuntime {
  private config: NpcBrainConfig;
  private readonly workingMemory: InMemoryWorkingMemoryStore;
  private readonly durableMemory?: DurableMemoryProvider;
  private readonly now: () => string;
  private emotionalState: EmotionalState;
  private stressLevel: number;
  private phase: CognitivePhase = 'idle';
  private currentGoal?: GoalCandidate;
  private activeAction?: RuntimeActionState;
  private activeRelationship?: RelationshipState;
  private runtimeConnected = false;
  private recalledMemoryIds: string[] = [];
  private readonly relationships = new Map<string, RelationshipState>();
  private readonly recentPerception: PerceptionEvent[] = [];
  private lastDecision?: DecisionTrace;

  constructor(config: NpcBrainConfig, options: CognitiveRuntimeOptions = {}) {
    this.config = config;
    this.workingMemory = options.workingMemory ?? new InMemoryWorkingMemoryStore(config.memory.workingMemoryItems);
    this.workingMemory.setLimit(config.npcId, config.memory.workingMemoryItems);
    this.durableMemory = options.durableMemory;
    this.now = options.now ?? (() => new Date().toISOString());
    this.emotionalState = {
      ...config.psychology.baselineEmotion,
      updatedAt: this.now(),
    };
    this.stressLevel = clamp01(config.psychology.regulation.stress);
  }

  setConfig(config: NpcBrainConfig): void {
    if (config.npcId !== this.config.npcId) {
      throw new Error('Cannot replace cognitive runtime config with a different npcId');
    }
    this.config = config;
    this.workingMemory.setLimit(config.npcId, config.memory.workingMemoryItems);
  }

  getConfig(): NpcBrainConfig {
    return this.config;
  }

  getPhase(): CognitivePhase {
    return this.phase;
  }

  setPhase(phase: CognitivePhase): void {
    this.phase = phase;
  }

  setRuntimeConnected(connected: boolean): void {
    this.runtimeConnected = connected;
    if (!connected && this.activeAction?.status === 'running') {
      this.activeAction = {
        ...this.activeAction,
        status: 'cancelled',
        completedAt: this.now(),
        failureReason: 'Runtime bridge disconnected',
      };
      this.phase = 'idle';
    }
  }

  getEmotionalState(): EmotionalState {
    return { ...this.emotionalState };
  }

  getStressLevel(): number {
    return this.stressLevel;
  }

  getLastDecision(): DecisionTrace | undefined {
    return this.lastDecision ? cloneDecisionTrace(this.lastDecision) : undefined;
  }

  getSnapshot(): CognitiveRuntimeSnapshot {
    return {
      npcId: this.config.npcId,
      phase: this.phase,
      currentGoal: this.currentGoal ? { ...this.currentGoal } : undefined,
      emotionalState: this.getEmotionalState(),
      stressLevel: this.stressLevel,
      activeRelationship: this.activeRelationship
        ? { ...this.activeRelationship, tags: [...this.activeRelationship.tags] }
        : undefined,
      activeAction: this.activeAction ? { ...this.activeAction } : undefined,
      recentPerception: this.recentPerception.map((event) => ({
        ...event,
        data: event.data ? { ...event.data } : undefined,
      })),
      recalledMemoryIds: [...this.recalledMemoryIds],
      workingMemoryCount: this.workingMemory.list(this.config.npcId).length,
      lastDecision: this.lastDecision ? cloneDecisionTrace(this.lastDecision) : undefined,
      runtimeConnected: this.runtimeConnected,
      updatedAt: this.now(),
    };
  }

  resetSessionState(): CognitiveRuntimeSnapshot {
    this.phase = 'idle';
    this.currentGoal = undefined;
    this.activeAction = undefined;
    this.activeRelationship = undefined;
    this.lastDecision = undefined;
    this.recalledMemoryIds = [];
    this.recentPerception.length = 0;
    this.relationships.clear();
    this.workingMemory.clear(this.config.npcId);
    this.emotionalState = {
      ...this.config.psychology.baselineEmotion,
      updatedAt: this.now(),
    };
    this.stressLevel = clamp01(this.config.psychology.regulation.stress);
    return this.getSnapshot();
  }

  listWorkingMemory(): MemoryEntry[] {
    return this.workingMemory.list(this.config.npcId);
  }

  ingestPerception(event: PerceptionEvent): MemoryEntry {
    if (event.npcId !== this.config.npcId) {
      throw new Error(`Perception npcId ${event.npcId} does not match runtime ${this.config.npcId}`);
    }

    this.phase = 'perceiving';
    this.recentPerception.push({ ...event, data: event.data ? { ...event.data } : undefined });
    if (this.recentPerception.length > 32) this.recentPerception.shift();

    const entry: MemoryEntry = {
      id: `working-perception-${event.id}`,
      npcId: event.npcId,
      kind: 'working',
      content: event.description,
      importance: clamp01(0.25 + event.confidence * 0.45),
      emotionalWeight: 0,
      confidence: clamp01(event.confidence),
      tags: ['perception', event.kind],
      relatedEntityIds: event.subjectId ? [event.subjectId] : [],
      sources: [{ type: 'perception', id: event.id }],
      createdAt: event.occurredAt,
    };

    this.workingMemory.push(entry);
    return cloneMemory(entry);
  }

  async processPsychologicalEvent(event: PsychologicalEvent): Promise<PsychologicalEventResult> {
    this.phase = 'reasoning';
    const warnings: string[] = [];
    const relationship = event.subjectId ? await this.resolveRelationship(event.subjectId, warnings) : undefined;
    const appraisal = appraisePsychologicalEvent(this.config.psychology, event, relationship);

    this.emotionalState = applyEmotionalAppraisal(this.emotionalState, appraisal, this.now());
    this.stressLevel = clamp01(this.stressLevel + appraisal.stressDelta);

    let updatedRelationship: RelationshipState | undefined;
    if (event.subjectId) {
      const base = relationship ?? createNeutralRelationship(event.subjectId, this.config, this.now());
      updatedRelationship = applyRelationshipAppraisal(base, appraisal, event.occurredAt);
      this.relationships.set(event.subjectId, updatedRelationship);
      this.activeRelationship = updatedRelationship;

      if (this.config.memory.durableMemoryEnabled && this.durableMemory) {
        try {
          updatedRelationship = await this.durableMemory.upsertRelationship(this.config.npcId, updatedRelationship);
          this.relationships.set(event.subjectId, updatedRelationship);
          this.activeRelationship = updatedRelationship;
        } catch (error) {
          warnings.push(`Relationship persistence unavailable: ${messageOf(error)}`);
        }
      }
    }

    const content = event.description?.trim() || `Psychological event: ${event.kind}`;
    const workingEntry: MemoryEntry = {
      id: `working-event-${event.id}`,
      npcId: this.config.npcId,
      kind: 'working',
      content,
      summary: appraisal.summary,
      importance: appraisal.memoryImportance,
      emotionalWeight: clampBipolar(this.emotionalState.valence),
      confidence: clamp01(event.confidence),
      tags: ['psychology', event.kind],
      relatedEntityIds: event.subjectId ? [event.subjectId] : [],
      sources: [{ type: 'event', id: event.id }],
      createdAt: event.occurredAt,
    };
    this.workingMemory.push(workingEntry);

    const promotedMemories: MemoryEntry[] = [];
    if (isMemoryEligibleForPromotion(workingEntry, this.config.memory)) {
      if (!this.config.memory.durableMemoryEnabled) {
        warnings.push('Durable memory is disabled; event remained in working memory only.');
      } else if (!this.durableMemory) {
        warnings.push('Durable memory is enabled but no provider is attached.');
      } else {
        try {
          promotedMemories.push(...await this.durableMemory.remember({
            npcId: this.config.npcId,
            kind: 'episodic',
            content,
            summary: appraisal.summary,
            importance: appraisal.memoryImportance,
            emotionalWeight: workingEntry.emotionalWeight,
            confidence: workingEntry.confidence,
            tags: workingEntry.tags,
            relatedEntityIds: workingEntry.relatedEntityIds,
            sourceIds: [event.id],
          }));
        } catch (error) {
          warnings.push(`Durable memory promotion failed: ${messageOf(error)}`);
        }
      }
    }

    return {
      appraisal,
      emotionalState: this.getEmotionalState(),
      stressLevel: this.stressLevel,
      relationship: updatedRelationship ? { ...updatedRelationship, tags: [...updatedRelationship.tags] } : undefined,
      promotedMemories,
      warnings,
    };
  }

  async recallContext(text?: string): Promise<RecallContextResult> {
    this.phase = 'reasoning';
    const warnings: string[] = [];
    const recallAt = this.now();
    const working = rankMemoriesForRecall(
      filterWorkingMemory(this.listWorkingMemory(), text),
      this.config.memory,
      this.config.memory.retrievalLimit,
      recallAt,
    );
    let durable: MemoryEntry[] = [];

    if (this.config.memory.durableMemoryEnabled) {
      if (!this.durableMemory) {
        warnings.push('Durable memory enabled but provider is not attached.');
      } else {
        try {
          const recalled = await this.durableMemory.recall({
            npcId: this.config.npcId,
            text,
            kinds: ['episodic', 'semantic', 'relationship'],
            limit: this.config.memory.retrievalLimit * 2,
          });
          durable = rankMemoriesForRecall(
            recalled,
            this.config.memory,
            this.config.memory.retrievalLimit,
            recallAt,
          );
        } catch (error) {
          warnings.push(`Durable memory recall failed: ${messageOf(error)}`);
        }
      }
    }

    const combined = rankMemoriesForRecall(
      dedupeMemories([...working, ...durable]),
      this.config.memory,
      this.config.memory.retrievalLimit * 2,
      recallAt,
    );
    this.recalledMemoryIds = combined.map((entry) => entry.id);

    return { working, durable, combined, warnings };
  }

  decide(candidates: BehaviorCandidate[]): DecisionResult {
    this.phase = 'planning';
    const result = selectBehavior(candidates, {
      npcId: this.config.npcId,
      minimumConfidence: this.config.reasoning.confidenceThreshold,
      capabilities: this.config.capabilities,
      now: this.now(),
    });
    this.lastDecision = result.trace;

    if (result.selected) {
      this.currentGoal = {
        id: result.selected.id,
        label: result.selected.label,
        source: 'runtime',
        utility: result.selected.score,
        urgency: result.selected.urgency,
        confidence: result.selected.confidence,
        createdAt: result.trace.createdAt,
      };
      this.activeAction = result.selected.capabilityId
        ? {
            capabilityId: result.selected.capabilityId,
            status: 'queued',
            progress: 0,
          }
        : undefined;
    } else {
      this.currentGoal = undefined;
      this.activeAction = undefined;
      this.phase = 'idle';
    }

    return result;
  }

  beginSelectedAction(targetId?: string): RuntimeActionState | undefined {
    if (!this.activeAction) return undefined;
    if (!this.runtimeConnected) {
      return { ...this.activeAction };
    }

    this.phase = 'acting';
    this.activeAction = {
      ...this.activeAction,
      targetId: targetId ?? this.activeAction.targetId,
      status: 'running',
      progress: 0,
      startedAt: this.now(),
      completedAt: undefined,
      failureReason: undefined,
    };
    return { ...this.activeAction };
  }

  completeActiveAction(success: boolean, failureReason?: string): RuntimeActionState | undefined {
    if (!this.activeAction) return undefined;

    this.activeAction = {
      ...this.activeAction,
      status: success ? 'succeeded' : 'failed',
      progress: success ? 1 : this.activeAction.progress,
      completedAt: this.now(),
      failureReason: success ? undefined : (failureReason || 'Runtime action failed'),
    };
    this.phase = 'idle';
    return { ...this.activeAction };
  }

  recover(elapsedMs: number): void {
    this.emotionalState = recoverEmotionalState(
      this.emotionalState,
      this.config.psychology,
      elapsedMs,
      this.now(),
    );

    if (elapsedMs <= 0) return;
    const minutes = elapsedMs / 60_000;
    const recovery = clamp01(this.config.psychology.regulation.recoveryRate);
    const blend = clamp01(1 - Math.exp(-minutes * (0.015 + recovery * 0.085)));
    this.stressLevel = lerp(
      this.stressLevel,
      clamp01(this.config.psychology.regulation.stress),
      blend,
    );
  }

  private async resolveRelationship(subjectId: string, warnings: string[]): Promise<RelationshipState | undefined> {
    const cached = this.relationships.get(subjectId);
    if (cached) return cached;

    if (!this.config.memory.durableMemoryEnabled || !this.durableMemory) return undefined;

    try {
      const durable = await this.durableMemory.getRelationship(this.config.npcId, subjectId);
      if (durable) this.relationships.set(subjectId, durable);
      return durable ?? undefined;
    } catch (error) {
      warnings.push(`Relationship recall unavailable: ${messageOf(error)}`);
      return undefined;
    }
  }
}

function createNeutralRelationship(subjectId: string, config: NpcBrainConfig, now: string): RelationshipState {
  return {
    subjectId,
    trust: clamp01(config.psychology.baselineEmotion.trust),
    familiarity: 0,
    respect: 0.5,
    attachment: 0,
    suspicion: 0,
    conflict: 0,
    interactionCount: 0,
    tags: [],
    lastInteractionAt: now,
  };
}

function filterWorkingMemory(entries: MemoryEntry[], text?: string): MemoryEntry[] {
  if (!text?.trim()) return entries;
  const query = text.toLowerCase();
  return entries.filter((entry) => (
    entry.content.toLowerCase().includes(query)
    || entry.summary?.toLowerCase().includes(query)
    || entry.tags.some((tag) => tag.toLowerCase().includes(query))
  ));
}

function dedupeMemories(entries: MemoryEntry[]): MemoryEntry[] {
  const byKey = new Map<string, MemoryEntry>();
  for (const entry of entries) {
    const key = entry.storeRef || entry.id;
    const existing = byKey.get(key);
    if (!existing || entry.importance > existing.importance) byKey.set(key, entry);
  }
  return [...byKey.values()];
}

function cloneMemory(entry: MemoryEntry): MemoryEntry {
  return {
    ...entry,
    tags: [...entry.tags],
    relatedEntityIds: [...entry.relatedEntityIds],
    sources: entry.sources.map((source) => ({ ...source })),
  };
}

function cloneDecisionTrace(trace: DecisionTrace): DecisionTrace {
  return {
    ...trace,
    influences: trace.influences.map((influence) => ({ ...influence })),
  };
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

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}
