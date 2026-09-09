import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const STORAGE_PREFIX = 'npc-ai-sim:brain:';
const HISTORY_LIMIT = 50;
const AUTOSAVE_DELAY_MS = 700;

function storageKey(npcId: string) {
  return `${STORAGE_PREFIX}${npcId}`;
}

function readPersistedConfig(fallback: NpcBrainConfig): NpcBrainConfig {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(storageKey(fallback.npcId));
    if (!raw) return fallback;

    const parsed: unknown = JSON.parse(raw);
    const validation = validateNpcBrainConfig(parsed);
    if (!validation.valid) {
      console.warn('[NpcBrainConfig] Ignoring invalid persisted brain config:', validation.errors);
      return fallback;
    }

    const persisted = parsed as NpcBrainConfig;
    return persisted.npcId === fallback.npcId ? persisted : fallback;
  } catch (error) {
    console.warn('[NpcBrainConfig] Failed to read persisted brain config:', error);
    return fallback;
  }
}

export interface NpcBrainEditorState {
  config: NpcBrainConfig;
  dirty: boolean;
  validationErrors: string[];
  lastSavedAt: string | null;
  persistenceError: string | null;
  canUndo: boolean;
  canRedo: boolean;
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
  undo: () => void;
  redo: () => void;
  reset: () => void;
  replace: (config: NpcBrainConfig, markDirty?: boolean) => void;
}

export function useNpcBrainConfig(initialConfig?: NpcBrainConfig): NpcBrainEditorState {
  const initial = useMemo(
    () => initialConfig ?? createDefaultNpcBrainConfig(),
    [initialConfig],
  );

  const loadedInitialRef = useRef<NpcBrainConfig | null>(null);
  if (loadedInitialRef.current === null) {
    loadedInitialRef.current = readPersistedConfig(initial);
  }

  const [baseline, setBaseline] = useState<NpcBrainConfig>(loadedInitialRef.current);
  const [config, setConfig] = useState<NpcBrainConfig>(loadedInitialRef.current);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const pastRef = useRef<NpcBrainConfig[]>([]);
  const futureRef = useRef<NpcBrainConfig[]>([]);
  const activeNpcIdRef = useRef(config.npcId);

  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    setHistoryVersion((value) => value + 1);
  }, []);

  const remember = useCallback((current: NpcBrainConfig) => {
    pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), current];
    futureRef.current = [];
    setHistoryVersion((value) => value + 1);
  }, []);

  const mutate = useCallback((updater: (current: NpcBrainConfig) => NpcBrainConfig) => {
    setConfig((current) => {
      const next = updater(current);
      remember(current);
      return {
        ...next,
        revision: current.revision + 1,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [remember]);

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

  const validation = useMemo(() => validateNpcBrainConfig(config), [config]);
  const dirty = useMemo(
    () => config.revision !== baseline.revision || config.updatedAt !== baseline.updatedAt,
    [config, baseline],
  );

  const persist = useCallback((next: NpcBrainConfig) => {
    const result = validateNpcBrainConfig(next);
    if (!result.valid) {
      setPersistenceError(`Cannot save invalid brain config: ${result.errors[0] ?? 'validation failed'}`);
      return false;
    }

    if (typeof window === 'undefined') return false;

    try {
      window.localStorage.setItem(storageKey(next.npcId), JSON.stringify(next));
      setBaseline(next);
      setLastSavedAt(new Date().toISOString());
      setPersistenceError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Browser storage failed';
      setPersistenceError(message);
      console.error('[NpcBrainConfig] Failed to persist brain config:', error);
      return false;
    }
  }, []);

  const markSaved = useCallback(() => {
    persist(config);
  }, [config, persist]);

  const undo = useCallback(() => {
    const previous = pastRef.current.at(-1);
    if (!previous) return;

    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current.slice(-(HISTORY_LIMIT - 1)), config];
    setConfig(previous);
    setHistoryVersion((value) => value + 1);
  }, [config]);

  const redo = useCallback(() => {
    const next = futureRef.current.at(-1);
    if (!next) return;

    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), config];
    setConfig(next);
    setHistoryVersion((value) => value + 1);
  }, [config]);

  const reset = useCallback(() => {
    if (config.revision !== baseline.revision || config.updatedAt !== baseline.updatedAt) {
      remember(config);
    }
    setConfig(baseline);
  }, [baseline, config, remember]);

  const replace = useCallback((next: NpcBrainConfig, markDirty = false) => {
    const result = validateNpcBrainConfig(next);
    if (!result.valid) {
      setPersistenceError(`Cannot load invalid brain config: ${result.errors[0] ?? 'validation failed'}`);
      return;
    }

    setConfig((current) => {
      remember(current);
      return next;
    });
    if (!markDirty) setBaseline(next);
  }, [remember]);

  useEffect(() => {
    const nextInitial = initialConfig ?? createDefaultNpcBrainConfig();
    if (nextInitial.npcId === activeNpcIdRef.current) return;

    const loaded = readPersistedConfig(nextInitial);
    activeNpcIdRef.current = loaded.npcId;
    setConfig(loaded);
    setBaseline(loaded);
    setLastSavedAt(null);
    setPersistenceError(null);
    clearHistory();
  }, [initialConfig?.npcId, clearHistory]);

  useEffect(() => {
    if (!dirty || validation.errors.length > 0 || typeof window === 'undefined') return;

    const timer = window.setTimeout(() => {
      persist(config);
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [config, dirty, persist, validation.errors.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;

      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        markSaved();
        return;
      }

      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        undo();
        return;
      }

      if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markSaved, redo, undo]);

  const canUndo = useMemo(() => pastRef.current.length > 0, [historyVersion]);
  const canRedo = useMemo(() => futureRef.current.length > 0, [historyVersion]);

  return {
    config,
    dirty,
    validationErrors: validation.errors,
    lastSavedAt,
    persistenceError,
    canUndo,
    canRedo,
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
    undo,
    redo,
    reset,
    replace,
  };
}
