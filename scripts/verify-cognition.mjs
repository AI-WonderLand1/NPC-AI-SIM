import assert from 'node:assert/strict';
import { createDefaultNpcBrainConfig } from '../dist/src/brain/defaultBrainConfig.js';
import { generateBehaviorCandidates } from '../dist/src/brain/decision/generateBehaviorCandidates.js';
import {
  rankMemoriesForRecall,
  reinforceMemory,
  scoreMemoryForRecall,
} from '../dist/src/brain/memory/memoryDynamics.js';
import {
  evaluateRelationship,
  recoverRelationshipTension,
} from '../dist/src/brain/psychology/relationshipDynamics.js';
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

const memoryPolicy = {
  ...config.memory,
  decayEnabled: true,
  decayHalfLifeHours: 24,
};
const memoryNow = '2026-01-10T00:00:00.000Z';
const memoryBase = {
  npcId: config.npcId,
  summary: undefined,
  tags: [],
  relatedEntityIds: [],
  sources: [{ type: 'event' }],
};
const oldImportant = {
  ...memoryBase,
  id: 'old-important',
  kind: 'episodic',
  content: 'An old but highly significant emotionally charged event.',
  importance: 0.95,
  emotionalWeight: -0.9,
  confidence: 0.95,
  createdAt: '2026-01-01T00:00:00.000Z',
};
const recentTrivial = {
  ...memoryBase,
  id: 'recent-trivial',
  kind: 'episodic',
  content: 'A recent trivial observation.',
  importance: 0.1,
  emotionalWeight: 0,
  confidence: 0.5,
  createdAt: '2026-01-09T23:00:00.000Z',
};
const expired = {
  ...memoryBase,
  id: 'expired',
  kind: 'episodic',
  content: 'This should never be recalled after expiry.',
  importance: 1,
  emotionalWeight: 1,
  confidence: 1,
  createdAt: '2026-01-09T23:30:00.000Z',
  expiresAt: '2026-01-09T23:59:00.000Z',
};

const ranked = rankMemoriesForRecall(
  [recentTrivial, expired, oldImportant],
  memoryPolicy,
  10,
  memoryNow,
);
assert.equal(ranked[0]?.id, 'old-important', 'salient old memory should outrank recent trivial noise');
assert.ok(!ranked.some((entry) => entry.id === 'expired'), 'expired memory must be filtered from recall');

const semanticScore = scoreMemoryForRecall(
  { ...oldImportant, id: 'old-semantic', kind: 'semantic' },
  memoryPolicy,
  memoryNow,
);
const episodicScore = scoreMemoryForRecall(oldImportant, memoryPolicy, memoryNow);
assert.ok(semanticScore.retention > episodicScore.retention, 'semantic memory should decay more slowly than episodic memory');

const reinforced = reinforceMemory(
  oldImportant,
  { importance: 0.85, confidence: 0.8, emotionalWeight: -0.7 },
  memoryNow,
);
assert.ok(reinforced.confidence > oldImportant.confidence, 'supporting evidence should increase memory confidence');
assert.ok(reinforced.confidence <= 1, 'reinforcement must remain normalized');
assert.ok(reinforced.importance <= 1, 'reinforcement must keep importance normalized');
assert.equal(reinforced.lastAccessedAt, memoryNow);

const trustedRelationship = {
  subjectId: 'trusted-subject',
  displayName: 'Trusted Subject',
  trust: 0.85,
  familiarity: 0.7,
  respect: 0.8,
  attachment: 0.5,
  suspicion: 0.05,
  conflict: 0.02,
  interactionCount: 20,
  tags: ['ally'],
  lastInteractionAt: '2026-01-09T12:00:00.000Z',
};
const trustedSignals = evaluateRelationship(trustedRelationship);
assert.equal(trustedSignals.stance, 'trusted');
assert.ok(trustedSignals.cooperation > trustedSignals.avoidance);

const hostileRelationship = {
  subjectId: 'threat-subject',
  displayName: 'Hostile Subject',
  trust: 0.1,
  familiarity: 0.8,
  respect: 0.2,
  attachment: 0.05,
  suspicion: 0.9,
  conflict: 0.8,
  interactionCount: 12,
  tags: ['hostile-history'],
  lastInteractionAt: '2026-01-09T23:00:00.000Z',
};
const hostileSignals = evaluateRelationship(hostileRelationship);
assert.equal(hostileSignals.stance, 'hostile');
assert.ok(hostileSignals.threatPressure > hostileSignals.cooperation);

const cooledRelationship = recoverRelationshipTension(
  hostileRelationship,
  config.psychology,
  48 * 60 * 60 * 1000,
  memoryNow,
);
assert.ok(cooledRelationship.suspicion < hostileRelationship.suspicion, 'suspicion should cool over time');
assert.ok(cooledRelationship.conflict < hostileRelationship.conflict, 'acute conflict should cool over time');
assert.equal(cooledRelationship.trust, hostileRelationship.trust, 'time alone must not magically repair trust');
assert.equal(cooledRelationship.respect, hostileRelationship.respect, 'time alone must not rewrite respect');

const hostileSnapshot = {
  ...runtime.getSnapshot(),
  activeRelationship: hostileRelationship,
};
const hostileCandidates = generateBehaviorCandidates({
  config,
  snapshot: hostileSnapshot,
  recalledMemories: threatRecall.combined,
});
assert.ok(!hostileCandidates.some((candidate) => candidate.capabilityId === 'greet'), 'hostile relationship should suppress casual greeting');
assert.ok(
  hostileCandidates.some((candidate) => candidate.capabilityId === 'defend' || candidate.capabilityId === 'flee'),
  'hostile relationship should create defensive or avoidance behavior options',
);

console.log('Cognition smoke test passed.');
