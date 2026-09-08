import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CognitiveRuntimeSnapshot,
  NpcBrainConfig,
  PerceptionEvent,
} from '../../brain/cognitiveModel.js';
import type { BehaviorCandidate } from '../../brain/decision/utilityDecisionEngine.js';
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
    const current = runtime.getSnapshot();
    const candidates = buildLocalSimulationCandidates(runtime.getConfig(), current);
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

function buildLocalSimulationCandidates(
  config: NpcBrainConfig,
  snapshot: CognitiveRuntimeSnapshot,
): BehaviorCandidate[] {
  const perception = snapshot.recentPerception.at(-1);
  const relationship = snapshot.activeRelationship;
  const socialConfidence = clamp01(perception?.confidence ?? 0.7);
  const trust = clamp01(relationship?.trust ?? snapshot.emotionalState.trust);

  return [
    {
      id: 'goal-greet-test-subject',
      label: 'Greet test subject',
      capabilityId: 'greet',
      baseUtility: 0.22,
      urgency: 0.48,
      confidence: socialConfidence,
      signals: [
        { type: 'perception', key: 'subject-visible', signal: socialConfidence, weight: 0.32, reason: 'A visible subject is available for interaction', sourceId: perception?.id },
        { type: 'personality', key: 'agreeableness', signal: config.psychology.personality.agreeableness, weight: 0.2, reason: 'Agreeableness favors cooperative social responses' },
        { type: 'drive', key: 'belonging', signal: config.psychology.drives.belonging, weight: 0.16, reason: 'Belonging drive supports social engagement' },
        { type: 'relationship', key: 'trust', signal: trust, weight: 0.18, reason: 'Current trust does not discourage greeting', sourceId: relationship?.subjectId },
      ],
    },
    {
      id: 'goal-observe-test-subject',
      label: 'Observe before responding',
      capabilityId: 'think',
      baseUtility: 0.18,
      urgency: 0.32,
      confidence: 0.95,
      signals: [
        { type: 'personality', key: 'openness', signal: config.psychology.personality.openness, weight: 0.14, reason: 'Openness supports gathering more context' },
        { type: 'value', key: 'curiosity', signal: config.psychology.values.curiosity, weight: 0.18, reason: 'Curiosity increases value of observation' },
        { type: 'drive', key: 'safety', signal: config.psychology.drives.safety, weight: 0.12, reason: 'Safety drive favors verification before action' },
      ],
    },
    {
      id: 'goal-speak-to-test-subject',
      label: 'Speak to test subject',
      capabilityId: 'speak',
      baseUtility: 0.16,
      urgency: 0.4,
      confidence: socialConfidence,
      signals: [
        { type: 'perception', key: 'subject-present', signal: socialConfidence, weight: 0.22, reason: 'Perception confirms a conversational target', sourceId: perception?.id },
        { type: 'personality', key: 'extraversion', signal: config.psychology.personality.extraversion, weight: 0.15, reason: 'Extraversion supports initiating dialogue' },
        { type: 'value', key: 'compassion', signal: config.psychology.values.compassion, weight: 0.1, reason: 'Compassion favors a non-hostile response' },
      ],
    },
  ];
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
