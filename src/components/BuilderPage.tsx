import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { npcAssets, type NPCAsset } from './LibraryPage.js';
import ReferenceEditorShell from './builder/ReferenceEditorShell.js';
import NPCViewport from './builder/NPCViewport.js';

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
  modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb',
  defaultAnimation: 'idle',
  stats: { health: 100, speed: 5, intelligence: 8, combat: 5 },
  aiConfig: {
    behaviorTree: 'AIControllerInit',
    perceptionRange: 15,
    decisionInterval: 500,
  },
});

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

    return npcAssets.find((candidate) => candidate.id === templateId) || npcAssets[0];
  }, [templateId, draftName, draftPrompt, draftType, draftRole]);

  const npcNames = useMemo(() => {
    const names = npcAssets.map((npc) => npc.name);
    if (templateId === 'new' && !names.includes(routeAsset.name)) {
      return [routeAsset.name, ...names];
    }
    return names;
  }, [routeAsset.name, templateId]);

  const [activeAsset, setActiveAsset] = useState<NPCAsset>(routeAsset);
  const [selectedObject, setSelectedObject] = useState(routeAsset.name);
  const [objectCount, setObjectCount] = useState(0);
  const [viewportStatus, setViewportStatus] = useState('Preparing GLB/GLTF viewport…');

  useEffect(() => {
    setActiveAsset(routeAsset);
    setSelectedObject(routeAsset.name);
  }, [routeAsset]);

  const handleEditorSelection = useCallback((_id: string, name: string) => {
    setSelectedObject(name);

    const selectedNpc = npcAssets.find((candidate) => candidate.name === name);
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

  return (
    <ReferenceEditorShell
      viewport={
        <div className="relative w-full h-full overflow-hidden">
          <NPCViewport
            asset={activeAsset}
            onSelect={handleViewportSelect}
            onObjectCountChange={handleObjectCountChange}
            onStatusChange={handleViewportStatus}
          />

          <div className="absolute left-3 bottom-3 z-20 max-w-[72%] px-2.5 py-1.5 rounded border border-zinc-700/80 bg-zinc-950/85 backdrop-blur text-[9px] font-mono text-zinc-300 pointer-events-none">
            <div className="text-sky-300">{activeAsset.name}</div>
            <div className="text-zinc-500 mt-0.5">{viewportStatus}</div>
          </div>
        </div>
      }
      selectedItem={selectedObject}
      onSelectItem={handleEditorSelection}
      npcNames={npcNames}
      objectCount={objectCount}
    />
  );
};

export default BuilderPage;
