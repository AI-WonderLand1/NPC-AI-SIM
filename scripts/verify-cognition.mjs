import assert from 'node:assert/strict';
import { createDefaultNpcBrainConfig } from '../dist/src/brain/defaultBrainConfig.js';
import { generateBehaviorCandidates } from '../dist/src/brain/decision/generateBehaviorCandidates.js';
import { NpcCognitiveRuntime } from '../dist/src/brain/runtime/NpcCognitiveRuntime.js';

const config = createDefaultNpcBrainConfig('ci-cognition-test', '2026-01-01T00:00:00.000Z');
config.memory.durableMemoryEnabled = false;

let tick = 0;
const now = () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++)).toISOString();
const runtime = new NpcCognitiveRuntime(config, { now });

assert.equal(runtime.getSnapshot().phase, 'idle');
assert.equal(runtime.getSnapshot().workingMemoryCount, 0);
assert.equal(runtime.getSnapshot().runtimeConnected, false);

runtime.ingestPerception({
  id: 'perception-1',
  npcId: config.npcId,
  kind: 'vision',
  subjectId: 'test-subject',
  description: 'A non-hostile test subject entered the configured vision radius.',
  confidence: 0.9,
  distanceMeters: 3,
  occurredAt: now(),
});

let snapshot = runtime.getSnapshot();
assert.equal(snapshot.phase, 'perceiving');
assert.equal(snapshot.workingMemoryCount, 1);
assert.equal(snapshot.recentPerception.at(-1)?.subjectId, 'test-subject');

const psychologyResult = await runtime.processPsychologicalEvent({
  id: 'social-1',
  kind: 'social-positive',
  intensity: 0.7,
  confidence: 0.9,
  subjectId: 'test-subject',
  occurredAt: now(),
  description: 'The test subject greets the NPC in a cooperative manner.',
});

assert.equal(runtime.getSnapshot().phase, 'reasoning');
assert.ok(psychologyResult.relationship, 'social event should create relationship state');
assert.ok(psychologyResult.relationship.trust >= config.psychology.baselineEmotion.trust);
assert.ok(runtime.getSnapshot().workingMemoryCount >= 2);

const recall = await runtime.recallContext('test subject');
assert.ok(recall.working.length > 0, 'working recall should return relevant context');
assert.equal(recall.durable.length, 0, 'durable memory is disabled in smoke test');
assert.ok(runtime.getSnapshot().recalledMemoryIds.length > 0);

const candidates = generateBehaviorCandidates({
  config,
  snapshot: runtime.getSnapshot(),
  recalledMemories: recall.combined,
});
assert.ok(candidates.length >= 2, 'candidate generator should produce multiple options');
assert.ok(candidates.some((candidate) => candidate.capabilityId === 'greet'));
assert.ok(candidates.some((candidate) => candidate.capabilityId === 'think'));

const decision = runtime.decide(candidates);
assert.ok(decision.selected, 'utility engine should select an eligible behavior');
snapshot = runtime.getSnapshot();
assert.equal(snapshot.phase, 'planning');
assert.ok(snapshot.currentGoal, 'selected behavior should become current goal');
assert.ok(snapshot.lastDecision, 'decision trace should be retained');
assert.ok(snapshot.lastDecision.influences.length > 0, 'decision trace should contain auditable influences');

if (snapshot.activeAction) {
  const queued = runtime.beginSelectedAction('test-subject');
  assert.equal(queued?.status, 'queued', 'action must remain queued without an authoritative runtime bridge');
  assert.equal(runtime.getSnapshot().runtimeConnected, false);

  runtime.setRuntimeConnected(true);
  const running = runtime.beginSelectedAction('test-subject');
  assert.equal(running?.status, 'running');
  assert.equal(runtime.getSnapshot().phase, 'acting');

  const completed = runtime.completeActiveAction(true);
  assert.equal(completed?.status, 'succeeded');
  assert.equal(runtime.getSnapshot().phase, 'idle');
}

runtime.resetSessionState();
runtime.ingestPerception({
  id: 'perception-threat',
  npcId: config.npcId,
  kind: 'game-event',
  subjectId: 'threat-subject',
  description: 'A hostile test event is detected.',
  confidence: 0.95,
  distanceMeters: 2,
  occurredAt: now(),
});
await runtime.processPsychologicalEvent({
  id: 'threat-1',
  kind: 'threat',
  intensity: 0.95,
  confidence: 0.95,
  subjectId: 'threat-subject',
  occurredAt: now(),
  description: 'The subject presents a high-confidence threat.',
});
const threatRecall = await runtime.recallContext('threat');
const threatCandidates = generateBehaviorCandidates({
  config,
  snapshot: runtime.getSnapshot(),
  recalledMemories: threatRecall.combined,
});
assert.ok(
  threatCandidates.some((candidate) => candidate.capabilityId === 'defend' || candidate.capabilityId === 'flee'),
  'threat appraisal should create a defensive or retreat candidate',
);

console.log('Cognition smoke test passed.');
