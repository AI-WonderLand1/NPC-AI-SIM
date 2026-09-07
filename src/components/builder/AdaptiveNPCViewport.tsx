import React, { useMemo, useState } from 'react';
import type { NPCAsset } from '../LibraryPage.js';
import NPCViewport from './NPCViewport.js';
import WebGPUNPCViewport from './WebGPUNPCViewport.js';
import { detectBrowserGraphicsProfile } from '../../rendering/browserGraphics.js';

interface AdaptiveNPCViewportProps {
  asset: NPCAsset;
  onSelect?: (name: string) => void;
  onObjectCountChange?: (count: number) => void;
  onStatusChange?: (status: string) => void;
}

export const AdaptiveNPCViewport: React.FC<AdaptiveNPCViewportProps> = ({
  asset,
  onSelect,
  onObjectCountChange,
  onStatusChange,
}) => {
  const profile = useMemo(() => detectBrowserGraphicsProfile(), []);
  const [webgpuFailed, setWebgpuFailed] = useState(false);

  if (profile.backend === 'webgpu' && !webgpuFailed) {
    return (
      <WebGPUNPCViewport
        asset={asset}
        profile={profile}
        onSelect={onSelect}
        onObjectCountChange={onObjectCountChange}
        onStatusChange={onStatusChange}
        onRendererFailure={() => setWebgpuFailed(true)}
      />
    );
  }

  return (
    <NPCViewport
      asset={asset}
      onSelect={onSelect}
      onObjectCountChange={onObjectCountChange}
      onStatusChange={(status) => {
        onStatusChange?.(
          profile.backend === 'webgl2'
            ? `${status} • ${profile.label}`
            : webgpuFailed
              ? `${status} • WebGPU fallback to WebGL2`
              : status,
        );
      }}
    />
  );
};

export default AdaptiveNPCViewport;
