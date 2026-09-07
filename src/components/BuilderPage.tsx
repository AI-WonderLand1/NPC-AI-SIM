import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { npcAssets, type NPCAsset } from './LibraryPage.js';
import ReferenceEditorShell from './builder/ReferenceEditorShell.js';
import NPCViewport from './builder/NPCViewport.js';
import ViewportGuard from './builder/ViewportGuard.js';

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
  description: description || 'New AI character ready for editing.',
  type,
  personality: ['Adaptive', 'Editable', role || 'AI Character'],
  thumbnail: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
  tags: ['New', 'AI Ready', role || 'Custom'],
  previewImages: [],
  modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb',
  defaultAnimation: 'idle',
  stats: { health: 100, speed: 5, intelligence: 8, combat: 5 },
  aiConfig: {
    behaviorTree: 'AIControllerInit',
    perceptionRange: 15,
    decisionInterval: 500,
  },
});

const NOVA_SHOWCASE: NPCAsset = {
  id: 'nova-showcase',
  name: 'Nova',
  description: 'Sci-fi engineer and AI companion showcase character for the NPC-AI-SIM editor.',
  type: 'humanoid',
  personality: ['Calm', 'Intelligent', 'Adaptive', 'Curious'],
  thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nova-aiw&backgroundColor=0f172a,1e3a8a',
  tags: ['Companion', 'Dialogue', 'Sci-Fi'],
  previewImages: [],
  modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb',
  defaultAnimation: 'idle',
  stats: { health: 100, speed: 5, intelligence: 10, combat: 4 },
  aiConfig: {
    behaviorTree: 'CompanionAdaptive',
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

  const npcNames = useMemo(() => {
    const names = npcAssets.map((npc) => npc.name);
    if (!names.includes(routeAsset.name)) return [routeAsset.name, ...names];
    return names;
  }, [routeAsset.name]);

  const sidebarAssets = useMemo(() => {
    if (!npcAssets.some((asset) => asset.name === routeAsset.name)) {
      return [routeAsset, ...npcAssets];
    }
    return npcAssets;
  }, [routeAsset]);

  const [activeAsset, setActiveAsset] = useState<NPCAsset>(routeAsset);
  const [selectedObject, setSelectedObject] = useState(routeAsset.name);
  const [objectCount, setObjectCount] = useState(0);
  const [viewportStatus, setViewportStatus] = useState('Preparing cinematic GLB/GLTF viewport…');

  useEffect(() => {
    setActiveAsset(routeAsset);
    setSelectedObject(routeAsset.name);
  }, [routeAsset]);

  const handleEditorSelection = useCallback((_id: string, name: string) => {
    setSelectedObject(name);

    const selectedNpc = name === NOVA_SHOWCASE.name
      ? NOVA_SHOWCASE
      : npcAssets.find((candidate) => candidate.name === name);
    if (selectedNpc) {
      setActiveAsset(selectedNpc);
      setViewportStatus(`Switching viewport to ${selectedNpc.name}…`);
    }
  }, []);

  const handleViewportSelect = useCallback((name: string) => {
    setSelectedObject(name);
  }, []);

  const handleObjectCountChange = useCallback((count: number) => {
    setObjectCount(count);
  }, []);

  const handleViewportStatus = useCallback((status: string) => {
    setViewportStatus(status);
  }, []);

  const handleViewportError = useCallback((message: string) => {
    setViewportStatus(`3D viewport unavailable: ${message}`);
    setObjectCount(0);
  }, []);

  return (
    <ReferenceEditorShell
      viewport={
        <div className="relative h-full w-full overflow-hidden">
          <ViewportGuard onError={handleViewportError}>
            <NPCViewport
              asset={activeAsset}
              onSelect={handleViewportSelect}
              onObjectCountChange={handleObjectCountChange}
              onStatusChange={handleViewportStatus}
            />
          </ViewportGuard>
        </div>
      }
      selectedItem={selectedObject}
      onSelectItem={handleEditorSelection}
      npcNames={npcNames}
      npcAssets={sidebarAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        thumbnail: asset.thumbnail,
        description: asset.description,
      }))}
      objectCount={objectCount}
      viewportStatus={viewportStatus}
    />
  );
};

export default BuilderPage;
