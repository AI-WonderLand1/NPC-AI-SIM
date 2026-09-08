import type {
  MemoryEntry,
  MemoryKind,
  RelationshipState,
} from '../cognitiveModel.js';

/**
 * Server-owned durable-memory scope. This should be derived from an
 * authenticated tenant/project/workspace boundary, never from arbitrary user
 * input in the browser.
 */
export type MemoryNamespace = string;

export interface MemoryRecallQuery {
  namespace: MemoryNamespace;
  npcId: string;
  text?: string;
  kinds?: MemoryKind[];
  relatedEntityIds?: string[];
  tags?: string[];
  limit: number;
  minimumImportance?: number;
  minimumConfidence?: number;
}

export interface RememberInput {
  namespace: MemoryNamespace;
  npcId: string;
  kind: Exclude<MemoryKind, 'working'>;
  content: string;
  summary?: string;
  importance: number;
  emotionalWeight: number;
  confidence: number;
  tags?: string[];
  relatedEntityIds?: string[];
  sourceIds?: string[];
}

export interface MemoryProviderHealth {
  provider: string;
  connected: boolean;
  durable: boolean;
  details?: string;
}

/**
 * Durable memory boundary for NPC-AI-SIM.
 *
 * A remember operation returns an array because extraction layers such as Mem0
 * may derive multiple durable facts from one conversation/event. The domain
 * layer must not silently discard those additional memories.
 *
 * Every durable operation includes a server-owned namespace so two projects
 * may safely use the same npcId without sharing memory or relationship state.
 *
 * The first production adapter uses Mem0 for memory extraction/retrieval and
 * MongoDB for durable structured/vector-backed storage. Working memory remains
 * runtime-local and should not be written to the durable store on every frame
 * or intermediate reasoning step.
 */
export interface DurableMemoryProvider {
  recall(query: MemoryRecallQuery): Promise<MemoryEntry[]>;
  remember(input: RememberInput): Promise<MemoryEntry[]>;
  forget(namespace: MemoryNamespace, npcId: string, memoryId: string): Promise<void>;

  getRelationship(namespace: MemoryNamespace, npcId: string, subjectId: string): Promise<RelationshipState | null>;
  upsertRelationship(namespace: MemoryNamespace, npcId: string, relationship: RelationshipState): Promise<RelationshipState>;

  health(): Promise<MemoryProviderHealth>;
}

/**
 * Runtime-local working memory is deliberately separate from durable memory.
 * This avoids turning transient perceptions and intermediate reasoning state
 * into permanent history.
 */
export interface WorkingMemoryStore {
  list(npcId: string): MemoryEntry[];
  push(entry: MemoryEntry): void;
  remove(npcId: string, memoryId: string): void;
  clear(npcId: string): void;
}
