export type TrainingCategory =
  | 'movement'
  | 'navigation'
  | 'perception'
  | 'communication'
  | 'interaction'
  | 'social'
  | 'advanced';

export type RuntimeCapability =
  | 'behavior'
  | 'navigation'
  | 'perception'
  | 'animation'
  | 'dialogue'
  | 'voice'
  | 'interaction'
  | 'memory'
  | 'reasoning';

export interface TrainingFixture {
  id: string;
  name: string;
  purpose: string;
  locked: true;
}

export interface TrainingCourse {
  id: string;
  name: string;
  category: TrainingCategory;
  description: string;
  capabilities: RuntimeCapability[];
  fixtures: string[];
  validation: string[];
  adaptiveTraining: boolean;
}

export interface SystemTrainingScene {
  id: 'aiw-npc-training-lab';
  name: string;
  owner: 'system';
  editable: false;
  exportable: false;
  resetAfterRun: true;
  fixtures: readonly TrainingFixture[];
}

const FIXTURES: readonly TrainingFixture[] = Object.freeze([
  { id: 'spawn-pad', name: 'Spawn Pad', purpose: 'Canonical NPC start position', locked: true },
  { id: 'walk-lane', name: 'Movement Lane', purpose: 'Walk/run/stop validation', locked: true },
  { id: 'turn-markers', name: 'Turn Markers', purpose: 'Heading and turn validation', locked: true },
  { id: 'jump-obstacle', name: 'Jump Obstacle', purpose: 'Jump capability validation', locked: true },
  { id: 'nav-obstacles', name: 'Navigation Obstacles', purpose: 'Pathfinding and repath validation', locked: true },
  { id: 'patrol-markers', name: 'Patrol Markers', purpose: 'Patrol-route validation', locked: true },
  { id: 'follow-target', name: 'Follow Target', purpose: 'Follow-distance and tracking validation', locked: true },
  { id: 'sight-target', name: 'Sight Target', purpose: 'Vision/perception validation', locked: true },
  { id: 'sound-emitter', name: 'Sound Emitter', purpose: 'Hearing-event validation', locked: true },
  { id: 'conversation-target', name: 'Conversation Target', purpose: 'Dialogue and interruption validation', locked: true },
  { id: 'door-target', name: 'Training Door', purpose: 'Door interaction validation', locked: true },
  { id: 'console-target', name: 'Training Console', purpose: 'Button/console interaction validation', locked: true },
  { id: 'pickup-target', name: 'Pickup Object', purpose: 'Pickup/use-object validation', locked: true },
  { id: 'use-point', name: 'Use Point', purpose: 'Sit/use-point interaction validation', locked: true },
  { id: 'threat-target', name: 'Threat Target', purpose: 'Reaction/combat-hook validation', locked: true },
]);

export const SYSTEM_TRAINING_SCENE: SystemTrainingScene = Object.freeze({
  id: 'aiw-npc-training-lab',
  name: 'AI Wonderland NPC Training Lab',
  owner: 'system',
  editable: false,
  exportable: false,
  resetAfterRun: true,
  fixtures: FIXTURES,
});

export const TRAINING_COURSES: readonly TrainingCourse[] = Object.freeze([
  {
    id: 'movement-basics',
    name: 'Movement Basics',
    category: 'movement',
    description: 'Validate idle, walk, run, turn and stop behavior.',
    capabilities: ['behavior', 'animation', 'navigation'],
    fixtures: ['spawn-pad', 'walk-lane', 'turn-markers'],
    validation: ['starts-idle', 'walks-to-marker', 'runs-to-marker', 'turns-to-heading', 'stops-at-target'],
    adaptiveTraining: false,
  },
  {
    id: 'jump',
    name: 'Jump',
    category: 'movement',
    description: 'Validate jump triggering, animation synchronization and landing recovery.',
    capabilities: ['behavior', 'animation', 'navigation'],
    fixtures: ['spawn-pad', 'jump-obstacle'],
    validation: ['detects-obstacle', 'starts-jump', 'clears-obstacle', 'lands', 'returns-to-locomotion'],
    adaptiveTraining: false,
  },
  {
    id: 'navigation-core',
    name: 'Navigation Core',
    category: 'navigation',
    description: 'Reach targets, follow, patrol and repath around blocked routes.',
    capabilities: ['behavior', 'navigation', 'perception'],
    fixtures: ['nav-obstacles', 'patrol-markers', 'follow-target'],
    validation: ['reaches-target', 'maintains-follow-distance', 'completes-patrol', 'repaths-after-blockage'],
    adaptiveTraining: false,
  },
  {
    id: 'perception-core',
    name: 'Perception Core',
    category: 'perception',
    description: 'Validate sight, hearing, proximity, loss and reacquisition events.',
    capabilities: ['behavior', 'perception'],
    fixtures: ['sight-target', 'sound-emitter', 'follow-target'],
    validation: ['sees-target', 'hears-event', 'fires-proximity-event', 'loses-target', 'reacquires-target'],
    adaptiveTraining: false,
  },
  {
    id: 'conversation-core',
    name: 'Conversation Core',
    category: 'communication',
    description: 'Validate state-driven dialogue, voice, subtitles and interruption behavior.',
    capabilities: ['behavior', 'perception', 'dialogue', 'voice', 'animation'],
    fixtures: ['conversation-target', 'sound-emitter'],
    validation: ['dialogue-follows-state', 'voice-starts', 'subtitle-syncs', 'interrupts-on-event', 'returns-to-state'],
    adaptiveTraining: false,
  },
  {
    id: 'smart-interactions',
    name: 'Smart Interactions',
    category: 'interaction',
    description: 'Validate approach, claim/use, animation and completion for system interaction targets.',
    capabilities: ['behavior', 'navigation', 'interaction', 'animation', 'perception'],
    fixtures: ['door-target', 'console-target', 'pickup-target', 'use-point'],
    validation: ['finds-interaction', 'reaches-slot', 'claims-interaction', 'plays-action', 'releases-interaction'],
    adaptiveTraining: false,
  },
  {
    id: 'social-basics',
    name: 'Social Basics',
    category: 'social',
    description: 'Validate greeting, follow and relationship/state reaction hooks.',
    capabilities: ['behavior', 'perception', 'dialogue', 'memory'],
    fixtures: ['conversation-target', 'follow-target'],
    validation: ['greets-target', 'reacts-to-state', 'follows-target', 'retains-context-hook'],
    adaptiveTraining: false,
  },
  {
    id: 'advanced-adaptation',
    name: 'Advanced Adaptation',
    category: 'advanced',
    description: 'Reserved for future adaptive-learning-agent training and strategy optimization.',
    capabilities: ['behavior', 'memory', 'reasoning'],
    fixtures: ['nav-obstacles', 'threat-target'],
    validation: ['advanced-runner-required'],
    adaptiveTraining: true,
  },
]);

export const getTrainingCourse = (courseId: string) =>
  TRAINING_COURSES.find((course) => course.id === courseId) ?? null;

export const getTrainingCoursesByCategory = (category: TrainingCategory) =>
  TRAINING_COURSES.filter((course) => course.category === category);
