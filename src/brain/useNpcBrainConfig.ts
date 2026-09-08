import { useCallback, useMemo, useState } from 'react';
import { createDefaultNpcBrainConfig } from './defaultBrainConfig.js';
import type {
  CapabilityDefinition,
  IntegrationConfig,
  MemoryPolicy,
  ModelConfig,
  NpcBrainConfig,
  NpcIdentity,
  PerceptionConfig,
  PsychologyProfile,
  ReasoningConfig,
  VoiceConfig,
} from './cognitiveModel.js';
import { validateNpcBrainConfig } from './validateBrainConfig.js';

export interface NpcBrainEditorState {
  config: NpcBrainConfig;
  dirty: boolean;
  validationErrors: string[];
  updateIdentity: (patch: Partial<NpcIdentity>) => void;
  updateModel: (patch: Partial<ModelConfig>) => void;
  updateReasoning: (patch: Partial<ReasoningConfig>) => void;
  updatePsychology: (patch: Partial<PsychologyProfile>) => void;
  updateMemory: (patch: Partial<MemoryPolicy>) => void;
  updatePerception: (patch: Partial<PerceptionConfig>) => void;
  updateVoice: (patch: Partial<VoiceConfig>) => void;
  updateIntegrations: (patch: Partial<IntegrationConfig>) => void;
  setCapabilities: (capabilities: CapabilityDefinition[]) => void;
  markSaved: () => void;
  reset: () => void;
  replace: (config: NpcBrainConfig, markDirty?: boolean) => void;
}

export function useNpcBrainConfig(initialConfig?: NpcBrainConfig): NpcBrainEditorState {
  const [baseline, setBaseline] = useState<NpcBrainConfig>(() =>
    initialConfig ?? createDefaultNpcBrainConfig(),
  );
  const [config, setConfig] = useState<NpcBrainConfig>(baseline);

  const mutate = useCallback((updater: (current: NpcBrainConfig) => NpcBrainConfig) => {
    setConfig((current) => {
      const next = updater(current);
      return {
        ...next,
        revision: current.revision + 1,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const updateIdentity = useCallback((patch: Partial<NpcIdentity>) => {
    mutate((current) => ({ ...current, identity: { ...current.identity, ...patch } }));
  }, [mutate]);

  const updateModel = useCallback((patch: Partial<ModelConfig>) => {
    mutate((current) => ({ ...current, model: { ...current.model, ...patch } }));
  }, [mutate]);

  const updateReasoning = useCallback((patch: Partial<ReasoningConfig>) => {
    mutate((current) => ({ ...current, reasoning: { ...current.reasoning, ...patch } }));
  }, [mutate]);

  const updatePsychology = useCallback((patch: Partial<PsychologyProfile>) => {
    mutate((current) => ({
      ...current,
      psychology: {
        ...current.psychology,
        ...patch,
        personality: patch.personality
          ? { ...current.psychology.personality, ...patch.personality }
          : current.psychology.personality,
        values: patch.values
          ? { ...current.psychology.values, ...patch.values }
          : current.psychology.values,
        drives: patch.drives
          ? { ...current.psychology.drives, ...patch.drives }
          : current.psychology.drives,
        baselineEmotion: patch.baselineEmotion
          ? { ...current.psychology.baselineEmotion, ...patch.baselineEmotion }
          : current.psychology.baselineEmotion,
        regulation: patch.regulation
          ? { ...current.psychology.regulation, ...patch.regulation }
          : current.psychology.regulation,
      },
    }));
  }, [mutate]);

  const updateMemory = useCallback((patch: Partial<MemoryPolicy>) => {
    mutate((current) => ({ ...current, memory: { ...current.memory, ...patch } }));
  }, [mutate]);

  const updatePerception = useCallback((patch: Partial<PerceptionConfig>) => {
    mutate((current) => ({ ...current, perception: { ...current.perception, ...patch } }));
  }, [mutate]);

  const updateVoice = useCallback((patch: Partial<VoiceConfig>) => {
    mutate((current) => ({ ...current, voice: { ...current.voice, ...patch } }));
  }, [mutate]);

  const updateIntegrations = useCallback((patch: Partial<IntegrationConfig>) => {
    mutate((current) => ({ ...current, integrations: { ...current.integrations, ...patch } }));
  }, [mutate]);

  const setCapabilities = useCallback((capabilities: CapabilityDefinition[]) => {
    mutate((current) => ({ ...current, capabilities }));
  }, [mutate]);

  const markSaved = useCallback(() => {
    setBaseline(config);
  }, [config]);

  const reset = useCallback(() => {
    setConfig(baseline);
  }, [baseline]);

  const replace = useCallback((next: NpcBrainConfig, markDirty = false) => {
    setConfig(next);
    if (!markDirty) setBaseline(next);
  }, []);

  const validation = useMemo(() => validateNpcBrainConfig(config), [config]);
  const dirty = useMemo(() => config.revision !== baseline.revision || config.updatedAt !== baseline.updatedAt, [config, baseline]);

  return {
    config,
    dirty,
    validationErrors: validation.errors,
    updateIdentity,
    updateModel,
    updateReasoning,
    updatePsychology,
    updateMemory,
    updatePerception,
    updateVoice,
    updateIntegrations,
    setCapabilities,
    markSaved,
    reset,
    replace,
  };
}
