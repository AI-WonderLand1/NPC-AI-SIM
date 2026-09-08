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

export interface Mem0HttpMemoryProviderOptions {
  baseUrl: string;
  token?: string;
  timeoutMs?: number;
}

export class Mem0HttpMemoryProvider implements DurableMemoryProvider {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly timeoutMs: number;

  constructor(options: Mem0HttpMemoryProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  async recall(query: MemoryRecallQuery): Promise<MemoryEntry[]> {
    const result = await this.request<{ memories: MemoryEntry[] }>('/v1/memory/recall', {
      method: 'POST',
      body: JSON.stringify(query),
    });
    return result.memories;
  }

  async remember(input: RememberInput): Promise<MemoryEntry> {
    const result = await this.request<{ memory: MemoryEntry }>('/v1/memory/remember', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return result.memory;
  }

  async forget(npcId: string, memoryId: string): Promise<void> {
    await this.request(`/v1/memory/${encodeURIComponent(npcId)}/${encodeURIComponent(memoryId)}`, {
      method: 'DELETE',
    });
  }

  async getRelationship(npcId: string, subjectId: string): Promise<RelationshipState | null> {
    const result = await this.request<{ relationship: RelationshipState | null }>(
      `/v1/relationships/${encodeURIComponent(npcId)}/${encodeURIComponent(subjectId)}`,
    );
    return result.relationship;
  }

  async upsertRelationship(npcId: string, relationship: RelationshipState): Promise<RelationshipState> {
    const result = await this.request<{ relationship: RelationshipState }>(
      `/v1/relationships/${encodeURIComponent(npcId)}/${encodeURIComponent(relationship.subjectId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(relationship),
      },
    );
    return result.relationship;
  }

  async health(): Promise<MemoryProviderHealth> {
    try {
      const result = await this.request<{
        provider?: string;
        connected?: boolean;
        durable?: boolean;
        details?: string;
      }>('/health');

      return {
        provider: result.provider || 'mem0-mongodb',
        connected: result.connected === true,
        durable: result.durable === true,
        details: result.details,
      };
    } catch (error) {
      return {
        provider: 'mem0-mongodb',
        connected: false,
        durable: false,
        details: error instanceof Error ? error.message : 'Memory service unavailable',
      };
    }
  }

  private async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers = new Headers(init.headers);
      headers.set('Accept', 'application/json');
      if (init.body) headers.set('Content-Type', 'application/json');
      if (this.token) headers.set('Authorization', `Bearer ${this.token}`);

      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Memory service ${response.status}: ${body || response.statusText}`);
      }

      if (response.status === 204) return undefined as T;
      return await response.json() as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
