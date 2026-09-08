import { useEffect, useState } from 'react';

export interface MemoryHealthState {
  provider: string;
  connected: boolean;
  durable: boolean;
  loading: boolean;
  error?: string;
}

const INITIAL_STATE: MemoryHealthState = {
  provider: 'mem0-mongodb',
  connected: false,
  durable: false,
  loading: true,
};

export function useMemoryHealth(): MemoryHealthState {
  const [state, setState] = useState<MemoryHealthState>(INITIAL_STATE);

  useEffect(() => {
    const controller = new AbortController();

    void fetch('/api/memory/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Memory health returned ${response.status}`);
        return await response.json() as {
          provider?: string;
          connected?: boolean;
          durable?: boolean;
        };
      })
      .then((health) => {
        setState({
          provider: health.provider || 'mem0-mongodb',
          connected: health.connected === true,
          durable: health.durable === true,
          loading: false,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          provider: 'mem0-mongodb',
          connected: false,
          durable: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Memory health unavailable',
        });
      });

    return () => controller.abort();
  }, []);

  return state;
}
