import type {
  MemoryEntry,
  RelationshipState,
} from '../cognitiveModel.js';
import type {
  DurableMemoryProvider,
  MemoryProviderHealth,
  MemoryRecallQuery,
  RememberInput,
} from './MemoryProvider.js';
import { Mem0HttpMemoryProvider } from './Mem0HttpMemoryProvider.js';

class DisabledMemoryProvider implements DurableMemoryProvider {
  private readonly reason: string;

  constructor(reason: string) {
    this.reason = reason;
  }

  async recall(_query: MemoryRecallQuery): Promise<MemoryEntry[]> {
    throw new Error(this.reason);
  }

  async remember(_input: RememberInput): Promise<MemoryEntry> {
    throw new Error(this.reason);
  }

  async forget(_npcId: string, _memoryId: string): Promise<void> {
    throw new Error(this.reason);
  }

  async getRelationship(_npcId: string, _subjectId: string): Promise<RelationshipState | null> {
    throw new Error(this.reason);
  }

  async upsertRelationship(_npcId: string, _relationship: RelationshipState): Promise<RelationshipState> {
    throw new Error(this.reason);
  }

  async health(): Promise<MemoryProviderHealth> {
    return {
      provider: 'disabled',
      connected: false,
      durable: false,
      details: this.reason,
    };
  }
}

let singleton: DurableMemoryProvider | null = null;

export function getServerMemoryProvider(): DurableMemoryProvider {
  if (singleton) return singleton;

  const baseUrl = process.env.MEM0_SERVICE_URL?.trim();
  if (!baseUrl) {
    singleton = new DisabledMemoryProvider('MEM0_SERVICE_URL is not configured');
    return singleton;
  }

  singleton = new Mem0HttpMemoryProvider({
    baseUrl,
    token: process.env.MEM0_SERVICE_TOKEN?.trim() || undefined,
    timeoutMs: Number(process.env.MEM0_SERVICE_TIMEOUT_MS || 5000),
  });

  return singleton;
}

export function resetServerMemoryProviderForTests(): void {
  singleton = null;
}
