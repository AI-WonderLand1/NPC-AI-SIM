import {
  NPC_BRAIN_SCHEMA_VERSION,
  type NpcBrainConfig,
} from './cognitiveModel.js';

export interface BrainValidationResult {
  valid: boolean;
  errors: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const inRange = (value: unknown, min: number, max: number): value is number =>
  isFiniteNumber(value) && value >= min && value <= max;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function requireScalar01(errors: string[], path: string, value: unknown) {
  if (!inRange(value, 0, 1)) errors.push(`${path} must be between 0 and 1`);
}

function requireBipolar(errors: string[], path: string, value: unknown) {
  if (!inRange(value, -1, 1)) errors.push(`${path} must be between -1 and 1`);
}

function requirePositive(errors: string[], path: string, value: unknown, allowZero = false) {
  const minimum = allowZero ? 0 : Number.EPSILON;
  if (!isFiniteNumber(value) || value < minimum) {
    errors.push(`${path} must be ${allowZero ? 'zero or greater' : 'greater than zero'}`);
  }
}

export function validateNpcBrainConfig(value: unknown): BrainValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) return { valid: false, errors: ['brain config must be an object'] };

  if (value.schemaVersion !== NPC_BRAIN_SCHEMA_VERSION) {
    errors.push(`schemaVersion must equal ${NPC_BRAIN_SCHEMA_VERSION}`);
  }
  if (!nonEmptyString(value.npcId)) errors.push('npcId is required');
  if (!Number.isInteger(value.revision) || (value.revision as number) < 1) errors.push('revision must be an integer >= 1');

  const identity = value.identity;
  if (!isRecord(identity)) {
    errors.push('identity is required');
  } else {
    for (const key of ['name', 'role', 'selfConcept', 'background', 'worldview'] as const) {
      if (!nonEmptyString(identity[key])) errors.push(`identity.${key} is required`);
    }
    if (!Array.isArray(identity.tags) || identity.tags.some((tag) => typeof tag !== 'string')) {
      errors.push('identity.tags must be an array of strings');
    }
  }

  const model = value.model;
  if (!isRecord(model)) {
    errors.push('model is required');
  } else {
    if (!nonEmptyString(model.provider)) errors.push('model.provider is required');
    if (!nonEmptyString(model.model)) errors.push('model.model is required');
    if (!inRange(model.temperature, 0, 2)) errors.push('model.temperature must be between 0 and 2');
    requirePositive(errors, 'model.maxTokens', model.maxTokens);
  }

  const reasoning = value.reasoning;
  if (!isRecord(reasoning)) {
    errors.push('reasoning is required');
  } else {
    if (!['balanced', 'utility-first', 'role-first'].includes(String(reasoning.strategy))) {
      errors.push('reasoning.strategy is invalid');
    }
    requirePositive(errors, 'reasoning.reasoningDepth', reasoning.reasoningDepth);
    requireScalar01(errors, 'reasoning.confidenceThreshold', reasoning.confidenceThreshold);
    requirePositive(errors, 'reasoning.replanningIntervalMs', reasoning.replanningIntervalMs);
    requirePositive(errors, 'reasoning.contextBudgetTokens', reasoning.contextBudgetTokens);
    if (!['ask', 'idle', 'retry'].includes(String(reasoning.fallback))) errors.push('reasoning.fallback is invalid');
    if (!Array.isArray(reasoning.directives) || reasoning.directives.some((item) => typeof item !== 'string')) {
      errors.push('reasoning.directives must be an array of strings');
    }
  }

  const psychology = value.psychology;
  if (!isRecord(psychology)) {
    errors.push('psychology is required');
  } else {
    const personality = psychology.personality;
    if (!isRecord(personality)) {
      errors.push('psychology.personality is required');
    } else {
      for (const key of ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotionalStability'] as const) {
        requireScalar01(errors, `psychology.personality.${key}`, personality[key]);
      }
    }

    const values = psychology.values;
    if (!isRecord(values)) {
      errors.push('psychology.values is required');
    } else {
      for (const key of ['loyalty', 'honesty', 'autonomy', 'authority', 'curiosity', 'compassion', 'achievement', 'selfPreservation'] as const) {
        requireScalar01(errors, `psychology.values.${key}`, values[key]);
      }
    }

    const drives = psychology.drives;
    if (!isRecord(drives)) {
      errors.push('psychology.drives is required');
    } else {
      for (const key of ['safety', 'belonging', 'achievement', 'exploration', 'status', 'protection', 'purpose'] as const) {
        requireScalar01(errors, `psychology.drives.${key}`, drives[key]);
      }
    }

    const emotion = psychology.baselineEmotion;
    if (!isRecord(emotion)) {
      errors.push('psychology.baselineEmotion is required');
    } else {
      requireBipolar(errors, 'psychology.baselineEmotion.valence', emotion.valence);
      for (const key of ['arousal', 'joy', 'trust', 'fear', 'anger', 'sadness', 'surprise'] as const) {
        requireScalar01(errors, `psychology.baselineEmotion.${key}`, emotion[key]);
      }
    }

    const regulation = psychology.regulation;
    if (!isRecord(regulation)) {
      errors.push('psychology.regulation is required');
    } else {
      for (const key of ['stress', 'patience', 'impulsivity', 'threatSensitivity', 'recoveryRate'] as const) {
        requireScalar01(errors, `psychology.regulation.${key}`, regulation[key]);
      }
    }
  }

  const memory = value.memory;
  if (!isRecord(memory)) {
    errors.push('memory is required');
  } else {
    requirePositive(errors, 'memory.workingMemoryItems', memory.workingMemoryItems);
    requirePositive(errors, 'memory.retrievalLimit', memory.retrievalLimit);
    requireScalar01(errors, 'memory.minimumImportanceToPersist', memory.minimumImportanceToPersist);
    if (typeof memory.decayEnabled !== 'boolean') errors.push('memory.decayEnabled must be boolean');
    if (memory.decayHalfLifeHours !== undefined) requirePositive(errors, 'memory.decayHalfLifeHours', memory.decayHalfLifeHours);
    if (typeof memory.promoteWorkingToEpisodic !== 'boolean') errors.push('memory.promoteWorkingToEpisodic must be boolean');
    if (typeof memory.durableMemoryEnabled !== 'boolean') errors.push('memory.durableMemoryEnabled must be boolean');
  }

  const perception = value.perception;
  if (!isRecord(perception)) {
    errors.push('perception is required');
  } else {
    requirePositive(errors, 'perception.sightRadiusMeters', perception.sightRadiusMeters, true);
    if (!inRange(perception.fieldOfViewDegrees, 1, 360)) errors.push('perception.fieldOfViewDegrees must be between 1 and 360');
    requireScalar01(errors, 'perception.hearingSensitivity', perception.hearingSensitivity);
    requirePositive(errors, 'perception.proximityMeters', perception.proximityMeters, true);
    requirePositive(errors, 'perception.attentionIntervalMs', perception.attentionIntervalMs);
    if (typeof perception.trackDynamicObjects !== 'boolean') errors.push('perception.trackDynamicObjects must be boolean');
    if (typeof perception.trackStaticObjects !== 'boolean') errors.push('perception.trackStaticObjects must be boolean');
  }

  if (!Array.isArray(value.knowledgeSources)) errors.push('knowledgeSources must be an array');

  const voice = value.voice;
  if (!isRecord(voice)) {
    errors.push('voice is required');
  } else {
    if (!nonEmptyString(voice.provider)) errors.push('voice.provider is required');
    requirePositive(errors, 'voice.speed', voice.speed);
    requirePositive(errors, 'voice.pitch', voice.pitch);
    if (typeof voice.interruptible !== 'boolean') errors.push('voice.interruptible must be boolean');
    if (typeof voice.subtitles !== 'boolean') errors.push('voice.subtitles must be boolean');
  }

  if (!Array.isArray(value.capabilities)) {
    errors.push('capabilities must be an array');
  } else {
    const ids = new Set<string>();
    value.capabilities.forEach((capability, index) => {
      if (!isRecord(capability)) {
        errors.push(`capabilities[${index}] must be an object`);
        return;
      }
      if (!nonEmptyString(capability.id)) errors.push(`capabilities[${index}].id is required`);
      else if (ids.has(capability.id)) errors.push(`capability id ${capability.id} is duplicated`);
      else ids.add(capability.id);
      if (!nonEmptyString(capability.label)) errors.push(`capabilities[${index}].label is required`);
      if (typeof capability.enabled !== 'boolean') errors.push(`capabilities[${index}].enabled must be boolean`);
      if (typeof capability.aiSelectable !== 'boolean') errors.push(`capabilities[${index}].aiSelectable must be boolean`);
      requirePositive(errors, `capabilities[${index}].cooldownMs`, capability.cooldownMs, true);
      if (!nonEmptyString(capability.runtimeEvent)) errors.push(`capabilities[${index}].runtimeEvent is required`);
    });
  }

  const integrations = value.integrations;
  if (!isRecord(integrations)) {
    errors.push('integrations is required');
  } else {
    if (!['generic', 'godot', 'unreal', 'unity', 'custom'].includes(String(integrations.runtimeTarget))) {
      errors.push('integrations.runtimeTarget is invalid');
    }
    if (typeof integrations.aiPlaygroundEnabled !== 'boolean') errors.push('integrations.aiPlaygroundEnabled must be boolean');
    if (typeof integrations.emitRuntimeEvents !== 'boolean') errors.push('integrations.emitRuntimeEvents must be boolean');
  }

  if (!nonEmptyString(value.createdAt)) errors.push('createdAt is required');
  if (!nonEmptyString(value.updatedAt)) errors.push('updatedAt is required');

  return { valid: errors.length === 0, errors };
}

export function isNpcBrainConfig(value: unknown): value is NpcBrainConfig {
  return validateNpcBrainConfig(value).valid;
}
