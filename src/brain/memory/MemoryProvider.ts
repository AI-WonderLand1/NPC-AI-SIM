import type {
  MemoryEntry,
  MemoryKind,
  RelationshipState,
} from '../cognitiveModel.js';

export interface MemoryRecallQuery {
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
 * The first production adapter uses Mem0 for memory extraction/retrieval and
 * MongoDB for durable structured/vector-backed storage. Working memory remains
 * runtime-local and should not be written to the durable store on every frame
 * or intermediate reasoning step.
 */
export interface DurableMemoryProvider {
  recall(query: MemoryRecallQuery): Promise<MemoryEntry[]>;
  remember(input: RememberInput): Promise<MemoryEntry[]>;
  forget(npcId: string, memoryId: string): Promise<void>;

  getRelationship(npcId: string, subjectId: string): Promise<RelationshipState | null>;
  upsertRelationship(npcId: string, relationship: RelationshipState): Promise<RelationshipState>;

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
