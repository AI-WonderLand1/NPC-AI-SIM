export type GraphicsBackend = 'webgpu' | 'webgl2' | 'none';
export type GraphicsQuality = 'ultra' | 'high' | 'balanced' | 'performance' | 'fallback';

export interface BrowserGraphicsProfile {
  backend: GraphicsBackend;
  quality: GraphicsQuality;
  deviceMemoryGb: number;
  logicalCores: number;
  pixelRatioCap: number;
  label: string;
}

const getWebGL2Support = () => {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }));
  } catch {
    return false;
  }
};

export const detectBrowserGraphicsProfile = (): BrowserGraphicsProfile => {
  if (typeof navigator === 'undefined') {
    return {
      backend: 'none',
      quality: 'fallback',
      deviceMemoryGb: 0,
      logicalCores: 0,
      pixelRatioCap: 1,
      label: 'Software preview',
    };
  }

  const nav = navigator as Navigator & {
    gpu?: unknown;
    deviceMemory?: number;
  };
  const deviceMemoryGb = nav.deviceMemory ?? 4;
  const logicalCores = nav.hardwareConcurrency ?? 4;
  const hasWebGPU = Boolean(nav.gpu);
  const hasWebGL2 = getWebGL2Support();

  if (hasWebGPU) {
    if (deviceMemoryGb >= 8 && logicalCores >= 8) {
      return {
        backend: 'webgpu',
        quality: 'ultra',
        deviceMemoryGb,
        logicalCores,
        pixelRatioCap: 1.75,
        label: 'WebGPU Ultra',
      };
    }

    return {
      backend: 'webgpu',
      quality: 'high',
      deviceMemoryGb,
      logicalCores,
      pixelRatioCap: 1.4,
      label: 'WebGPU High',
    };
  }

  if (hasWebGL2) {
    const balanced = deviceMemoryGb >= 6 && logicalCores >= 6;
    return {
      backend: 'webgl2',
      quality: balanced ? 'balanced' : 'performance',
      deviceMemoryGb,
      logicalCores,
      pixelRatioCap: balanced ? 1.3 : 1,
      label: balanced ? 'WebGL2 Balanced' : 'WebGL2 Performance',
    };
  }

  return {
    backend: 'none',
    quality: 'fallback',
    deviceMemoryGb,
    logicalCores,
    pixelRatioCap: 1,
    label: 'Software preview',
  };
};
