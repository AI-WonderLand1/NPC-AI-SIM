import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { npcAssets, type NPCAsset } from './LibraryPage.js';
import ReferenceEditorShell from './builder/ReferenceEditorShell.js';
import NPCViewport from './builder/NPCViewport.js';

export const BuilderPage: React.FC<{
  isSubscribed?: boolean;
  onSubscribe?: () => void;
}> = () => {
  const { templateId } = useParams<{ templateId: string }>();

  const routeAsset = useMemo(
    () => npcAssets.find((candidate) => candidate.id === templateId) || npcAssets[0],
    [templateId],
  );

  const npcNames = useMemo(() => npcAssets.map((npc) => npc.name), []);

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

          <div className="absolute left-3 bottom-3 z-20 max-w-[70%] px-2.5 py-1.5 rounded border border-zinc-700/80 bg-zinc-950/85 backdrop-blur text-[9px] font-mono text-zinc-300 pointer-events-none">
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
