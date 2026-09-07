import React from 'react';

interface ViewportGuardProps {
  children: React.ReactNode;
  onError?: (message: string) => void;
}

interface ViewportGuardState {
  error: string | null;
}

const supportsWebGL = () => {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const context =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl');
    return Boolean(context);
  } catch {
    return false;
  }
};

export class ViewportGuard extends React.Component<ViewportGuardProps, ViewportGuardState> {
  state: ViewportGuardState = {
    error: supportsWebGL() ? null : 'WebGL is unavailable or disabled in this browser.',
  };

  static getDerivedStateFromError(error: unknown): ViewportGuardState {
    return {
      error: error instanceof Error ? error.message : 'The 3D viewport failed to initialize.',
    };
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : 'The 3D viewport failed to initialize.';
    console.error('[NPCViewport] guarded runtime failure', error);
    this.props.onError?.(message);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#030811] p-8 text-center">
          <div className="max-w-lg rounded-xl border border-amber-500/30 bg-[#08111f]/95 p-6 shadow-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
              3D viewport unavailable
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {this.state.error}
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              The NPC editor is still running. Enable WebGL or hardware acceleration to restore the live 3D viewport.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ViewportGuard;
