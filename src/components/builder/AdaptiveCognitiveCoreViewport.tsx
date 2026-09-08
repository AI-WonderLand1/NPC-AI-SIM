import React, { useEffect, useState } from 'react';
import type { CognitivePhase } from '../../brain/cognitiveModel.js';
import CognitiveCore3DViewport from './CognitiveCore3DViewport.js';
import CognitiveCoreWebGL1Fallback from './CognitiveCoreWebGL1Fallback.js';

interface Props {
  phase: CognitivePhase;
  onStatusChange?: (status: string) => void;
}

type Backend = 'checking' | 'webgl2' | 'webgl1' | 'none';

function detectBackend(): Backend {
  if (typeof document === 'undefined') return 'checking';
  const canvas = document.createElement('canvas');
  try {
    if (canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false })) return 'webgl2';
    if (canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) || canvas.getContext('experimental-webgl')) return 'webgl1';
  } catch {
    return 'none';
  }
  return 'none';
}

export default function AdaptiveCognitiveCoreViewport({ phase, onStatusChange }: Props) {
  const [backend, setBackend] = useState<Backend>('checking');

  useEffect(() => {
    const detected = detectBackend();
    setBackend(detected);
    if (detected === 'webgl1') onStatusChange?.('WebGL2 unavailable • using real WebGL1 3D compatibility renderer');
    if (detected === 'none') onStatusChange?.('3D unavailable • browser/GPU exposes no usable WebGL context');
  }, [onStatusChange]);

  if (backend === 'webgl2') return <CognitiveCore3DViewport phase={phase} onStatusChange={onStatusChange} />;
  if (backend === 'webgl1') return (
    <div className="npc-real-3d-core npc-real-3d-core--compat" aria-label="Real-time WebGL1 3D cognitive core viewport">
      <CognitiveCoreWebGL1Fallback phase={phase} onStatusChange={onStatusChange} />
      <div className="npc-real-3d-badge">REAL-TIME 3D • WEBGL1 GLASS</div>
      <div className="npc-real-3d-phase">{phase}</div>
    </div>
  );
  if (backend === 'none') return (
    <div className="npc-real-3d-core npc-real-3d-core--error">
      <div className="npc-3d-error-card">
        <strong>3D renderer unavailable</strong>
        <span>This browser/GPU exposes neither WebGL2 nor WebGL1.</span>
      </div>
    </div>
  );
  return <div className="npc-real-3d-core npc-real-3d-core--loading"><div className="npc-3d-loader" /></div>;
}
