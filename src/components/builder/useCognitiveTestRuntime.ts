import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CognitiveRuntimeSnapshot,
  NpcBrainConfig,
  PerceptionEvent,
} from '../../brain/cognitiveModel.js';
import { generateBehaviorCandidates } from '../../brain/decision/generateBehaviorCandidates.js';
import { NpcCognitiveRuntime } from '../../brain/runtime/NpcCognitiveRuntime.js';

export interface CognitiveTestRuntimeState {
  snapshot: CognitiveRuntimeSnapshot;
  warnings: string[];
  mode: 'idle' | 'local-simulation';
  runCycle: () => Promise<void>;
  perceive: () => void;
  think: () => Promise<void>;
  decide: () => Promise<void>;
  act: () => void;
  reset: () => void;
}

/**
 * Browser-side deterministic test harness for the cognition runtime.
 *
 * This is deliberately labeled as local simulation. It exercises the same
 * perception, psychology, working-memory, recall and utility-selection code as
 * the runtime, but it never claims that a game-engine bridge is connected.
 */
export function useCognitiveTestRuntime(config: NpcBrainConfig): CognitiveTestRuntimeState {
  const runtimeRef = useRef<NpcCognitiveRuntime | null>(null);
  const sequenceRef = useRef(0);

  if (!runtimeRef.current || runtimeRef.current.getConfig().npcId !== config.npcId) {
    runtimeRef.current = new NpcCognitiveRuntime(config);
  }

  const [snapshot, setSnapshot] = useState<CognitiveRuntimeSnapshot>(() => runtimeRef.current!.getSnapshot());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [mode, setMode] = useState<'idle' | 'local-simulation'>('idle');

  const publish = useCallback(() => {
    setSnapshot(runtimeRef.current!.getSnapshot());
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current!;
    runtime.setConfig(config);
    runtime.setRuntimeConnected(false);
    publish();
  }, [config, publish]);

  const perceive = useCallback(() => {
    const runtime = runtimeRef.current!;
    const currentConfig = runtime.getConfig();
    sequenceRef.current += 1;
    const distanceMeters = Math.max(1, Math.min(currentConfig.perception.sightRadiusMeters * 0.25, 5));
    const occurredAt = new Date().toISOString();
    const event: PerceptionEvent = {
      id: `editor-sim-perception-${sequenceRef.current}`,
      npcId: currentConfig.npcId,
      kind: 'vision',
      subjectId: 'editor-test-subject',
      description: `Local test subject detected inside configured vision radius at ${distanceMeters.toFixed(1)}m.`,
      confidence: clamp01(0.55 + currentConfig.perception.hearingSensitivity * 0.25),
      distanceMeters,
      occurredAt,
      data: {
        source: 'editor-local-simulation',
        syntheticInput: true,
      },
    };

    runtime.ingestPerception(event);
    setMode('local-simulation');
    setWarnings([]);
    publish();
  }, [publish]);

  const think = useCallback(async () => {
    const runtime = runtimeRef.current!;
    const current = runtime.getSnapshot();
    if (current.recentPerception.length === 0) perceive();

    const perception = runtime.getSnapshot().recentPerception.at(-1);
    const result = await runtime.processPsychologicalEvent({
      id: `editor-sim-social-${++sequenceRef.current}`,
      kind: 'social-positive',
      intensity: 0.55,
      confidence: perception?.confidence ?? 0.75,
      subjectId: perception?.subjectId ?? 'editor-test-subject',
      occurredAt: new Date().toISOString(),
      description: 'The local test subject approaches without hostile behavior and initiates a neutral greeting.',
    });

    setMode('local-simulation');
    setWarnings(result.warnings);
    publish();
  }, [perceive, publish]);

  const decide = useCallback(async () => {
    const runtime = runtimeRef.current!;
    if (runtime.getSnapshot().recentPerception.length === 0) perceive();

    const recall = await runtime.recallContext('test subject');
    const candidates = generateBehaviorCandidates({
      config: runtime.getConfig(),
      snapshot: runtime.getSnapshot(),
      recalledMemories: recall.combined,
    });
    runtime.decide(candidates);

    setMode('local-simulation');
    setWarnings(recall.warnings);
    publish();
  }, [perceive, publish]);

  const act = useCallback(() => {
    const runtime = runtimeRef.current!;
    const action = runtime.beginSelectedAction('editor-test-subject');
    const nextWarnings = action?.status === 'queued'
      ? ['Action is capability-gated and queued. A real runtime bridge is required before authoritative execution.']
      : [];
    setMode('local-simulation');
    setWarnings(nextWarnings);
    publish();
  }, [publish]);

  const runCycle = useCallback(async () => {
    const runtime = runtimeRef.current!;
    runtime.resetSessionState();
    setWarnings([]);
    setMode('local-simulation');
    publish();
    perceive();
    await think();
    await decide();
  }, [decide, perceive, publish, think]);

  const reset = useCallback(() => {
    setWarnings([]);
    setMode('idle');
    setSnapshot(runtimeRef.current!.resetSessionState());
  }, []);

  return {
    snapshot,
    warnings,
    mode,
    runCycle,
    perceive,
    think,
    decide,
    act,
    reset,
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
