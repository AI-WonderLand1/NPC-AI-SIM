import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { createDefaultNpcBrainConfig } from '../brain/defaultBrainConfig.js';
import { validateNpcBrainConfig } from '../brain/validateBrainConfig.js';
import { npcAssets, type NPCAsset } from './LibraryPage.js';
import ReferenceEditorShell from './builder/ReferenceEditorShell.js';

const BRAIN_STORAGE_PREFIX = 'npc-ai-sim:brain:';

const isNpcType = (value: string | null): value is NPCAsset['type'] =>
  value === 'humanoid' || value === 'creature' || value === 'vehicle' || value === 'prop';

const npcIdFromName = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

const createDraftAsset = (
  name: string,
  description: string,
  type: NPCAsset['type'],
  role: string,
): NPCAsset => ({
  id: 'new',
  name,
  description: description || 'New AI brain ready for configuration.',
  type,
  personality: ['Adaptive', 'Editable', role || 'AI Character'],
  thumbnail: '',
  tags: ['New', 'AI Ready', role || 'Custom'],
  previewImages: [],
  stats: { health: 100, speed: 5, intelligence: 8, combat: 5 },
  aiConfig: {
    behaviorTree: 'CognitiveCore',
    perceptionRange: 15,
    decisionInterval: 500,
  },
});

const NOVA_SHOWCASE: NPCAsset = {
  id: 'nova-showcase',
  name: 'Nova',
  description: 'Sci-fi cognitive-core showcase profile for the NPC-AI-SIM brain editor.',
  type: 'humanoid',
  personality: ['Calm', 'Intelligent', 'Adaptive', 'Curious'],
  thumbnail: '',
  tags: ['Companion', 'Dialogue', 'Sci-Fi'],
  previewImages: [],
  stats: { health: 100, speed: 5, intelligence: 10, combat: 4 },
  aiConfig: {
    behaviorTree: 'CognitiveCore',
    perceptionRange: 18,
    decisionInterval: 450,
  },
};

function buildBrainSeed(
  asset: NPCAsset,
  options?: { role?: string; prompt?: string; isNew?: boolean },
) {
  const npcId = npcIdFromName(asset.name);
  const config = createDefaultNpcBrainConfig(npcId);
  const role = options?.role?.trim()
    || (asset.tags[0] ? `${asset.tags[0]} ${asset.type}` : `${asset.type} NPC`);
  const selfConcept = options?.prompt?.trim() || asset.description || config.identity.selfConcept;

  return {
    ...config,
    identity: {
      ...config.identity,
      name: asset.name,
      role,
      selfConcept,
      background: selfConcept,
      tags: options?.isNew
        ? Array.from(new Set([asset.type, role, ...asset.tags])).filter(Boolean)
        : Array.from(new Set([asset.type, ...asset.tags])).filter(Boolean),
    },
    reasoning: {
      ...config.reasoning,
      replanningIntervalMs: Math.max(asset.aiConfig.decisionInterval, 100),
    },
    perception: {
      ...config.perception,
      sightRadiusMeters: Math.max(asset.aiConfig.perceptionRange, 0),
    },
  };
}

export const BuilderPage: React.FC<{
  isSubscribed?: boolean;
  onSubscribe?: () => void;
}> = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [searchParams] = useSearchParams();
  const [seededNpcId, setSeededNpcId] = useState<string | null>(null);

  const draftName = searchParams.get('name')?.trim() || 'New AI Character';
  const draftPrompt = searchParams.get('prompt')?.trim() || '';
  const draftRole = searchParams.get('role')?.trim() || 'Companion';
  const requestedType = searchParams.get('type');
  const draftType: NPCAsset['type'] = isNpcType(requestedType) ? requestedType : 'humanoid';

  const routeAsset = useMemo(() => {
    if (templateId === 'new') {
      return createDraftAsset(draftName, draftPrompt, draftType, draftRole);
    }
    if (!templateId) return NOVA_SHOWCASE;
    return npcAssets.find((candidate) => candidate.id === templateId) || NOVA_SHOWCASE;
  }, [templateId, draftName, draftPrompt, draftType, draftRole]);

  const npcId = useMemo(() => npcIdFromName(routeAsset.name), [routeAsset.name]);

  useEffect(() => {
    const storageKey = `${BRAIN_STORAGE_PREFIX}${npcId}`;
    const seed = buildBrainSeed(routeAsset, {
      role: templateId === 'new' ? draftRole : undefined,
      prompt: templateId === 'new' ? draftPrompt : undefined,
      isNew: templateId === 'new',
    });

    try {
      const existingRaw = window.localStorage.getItem(storageKey);
      let existingIsValid = false;

      if (existingRaw) {
        try {
          const existing: unknown = JSON.parse(existingRaw);
          const validation = validateNpcBrainConfig(existing);
          existingIsValid = validation.valid
            && typeof existing === 'object'
            && existing !== null
            && 'npcId' in existing
            && existing.npcId === npcId;
        } catch {
          existingIsValid = false;
        }
      }

      if (!existingIsValid) {
        const validation = validateNpcBrainConfig(seed);
        if (validation.valid) {
          window.localStorage.setItem(storageKey, JSON.stringify(seed));
        } else {
          console.warn('[BuilderPage] Refusing to seed invalid brain config:', validation.errors);
        }
      }
    } catch (error) {
      console.warn('[BuilderPage] Browser persistence unavailable; continuing with in-memory defaults:', error);
    }

    setSeededNpcId(npcId);
  }, [npcId, routeAsset, templateId, draftRole, draftPrompt]);

  if (seededNpcId !== npcId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060910] text-xs text-zinc-500">
        Preparing NPC brain editor…
      </div>
    );
  }

  return (
    <ReferenceEditorShell
      key={npcId}
      selectedItem={routeAsset.name}
      objectCount={0}
      viewportStatus="Cognitive core editor active • character runtime detached until Test & Export"
    />
  );
};

export default BuilderPage;
