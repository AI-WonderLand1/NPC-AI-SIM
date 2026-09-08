import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { npcAssets, type NPCAsset } from './LibraryPage.js';
import ReferenceEditorShell from './builder/ReferenceEditorShell.js';

const isNpcType = (value: string | null): value is NPCAsset['type'] =>
  value === 'humanoid' || value === 'creature' || value === 'vehicle' || value === 'prop';

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
  thumbnail: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
  tags: ['New', 'AI Ready', role || 'Custom'],
  previewImages: [],
  modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb',
  defaultAnimation: 'idle',
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
  thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nova-aiw&backgroundColor=0f172a,1e3a8a',
  tags: ['Companion', 'Dialogue', 'Sci-Fi'],
  previewImages: [],
  modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb',
  defaultAnimation: 'idle',
  stats: { health: 100, speed: 5, intelligence: 10, combat: 4 },
  aiConfig: {
    behaviorTree: 'CognitiveCore',
    perceptionRange: 18,
    decisionInterval: 450,
  },
};

export const BuilderPage: React.FC<{
  isSubscribed?: boolean;
  onSubscribe?: () => void;
}> = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [searchParams] = useSearchParams();

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

  return (
    <ReferenceEditorShell
      selectedItem={routeAsset.name}
      objectCount={0}
      viewportStatus="Cognitive core editor active • character runtime detached until Test & Export"
    />
  );
};

export default BuilderPage;
