import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { createDefaultNpcBrainConfig } from '../brain/defaultBrainConfig.js';
import { validateNpcBrainConfig } from '../brain/validateBrainConfig.js';
import ReferenceEditorShell from './builder/ReferenceEditorShell.js';

const BRAIN_STORAGE_PREFIX = 'npc-ai-sim:brain:';

const npcIdFromName = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'new-npc';

const titleFromId = (value: string) => value
  .split(/[-_]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

interface RouteNpcSeed {
  npcId: string;
  name: string;
  role: string;
  prompt: string;
  tags: string[];
}

function buildBrainSeed(seed: RouteNpcSeed) {
  const config = createDefaultNpcBrainConfig(seed.npcId);
  const selfConcept = seed.prompt.trim() || config.identity.selfConcept;

  return {
    ...config,
    identity: {
      ...config.identity,
      name: seed.name,
      role: seed.role,
      selfConcept,
      background: selfConcept,
      tags: Array.from(new Set(seed.tags)).filter(Boolean),
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

  const routeNpc = useMemo<RouteNpcSeed>(() => {
    if (templateId === 'new') {
      const name = searchParams.get('name')?.trim() || 'New AI Character';
      const role = searchParams.get('role')?.trim() || 'Companion';
      const prompt = searchParams.get('prompt')?.trim() || '';
      return {
        npcId: npcIdFromName(name),
        name,
        role,
        prompt,
        tags: ['new', role.toLowerCase().replace(/\s+/g, '-')],
      };
    }

    if (templateId) {
      return {
        npcId: templateId,
        name: titleFromId(templateId) || 'NPC',
        role: 'Custom NPC',
        prompt: '',
        tags: ['custom'],
      };
    }

    return {
      npcId: 'nova-showcase',
      name: 'Nova',
      role: 'Engineer',
      prompt: 'A capable AI companion who solves practical problems and learns from experience.',
      tags: ['engineer', 'sci-fi', 'technology'],
    };
  }, [templateId, searchParams]);

  useEffect(() => {
    const storageKey = `${BRAIN_STORAGE_PREFIX}${routeNpc.npcId}`;
    const seed = buildBrainSeed(routeNpc);

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
            && existing.npcId === routeNpc.npcId;
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

    setSeededNpcId(routeNpc.npcId);
  }, [routeNpc]);

  if (seededNpcId !== routeNpc.npcId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060910] text-xs text-zinc-500">
        Preparing NPC brain editor…
      </div>
    );
  }

  return (
    <ReferenceEditorShell
      key={routeNpc.npcId}
      selectedItem={routeNpc.name}
      objectCount={0}
      viewportStatus="Cognitive core editor active • character runtime detached until Test & Export"
    />
  );
};

export default BuilderPage;
