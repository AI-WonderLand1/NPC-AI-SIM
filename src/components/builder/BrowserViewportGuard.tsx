import React from 'react';
import { Cpu, TriangleAlert } from 'lucide-react';

interface BrowserViewportGuardProps {
  children: React.ReactNode;
  onError?: (message: string) => void;
  characterName?: string;
}

interface BrowserViewportGuardState {
  error: string | null;
}

const supportsBrowserGpu = () => {
  if (typeof navigator !== 'undefined' && (navigator as Navigator & { gpu?: unknown }).gpu) return true;
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }));
  } catch {
    return false;
  }
};

export class BrowserViewportGuard extends React.Component<BrowserViewportGuardProps, BrowserViewportGuardState> {
  state: BrowserViewportGuardState = {
    error: supportsBrowserGpu() ? null : 'This browser does not expose WebGPU or WebGL2.',
  };

  static getDerivedStateFromError(error: unknown): BrowserViewportGuardState {
    return {
      error: error instanceof Error ? error.message : 'The browser GPU viewport failed to initialize.',
    };
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : 'The browser GPU viewport failed to initialize.';
    console.error('[BrowserViewportGuard] renderer failure', error);
    this.props.onError?.(message);
  }

  renderFallback() {
    const characterName = this.props.characterName || 'NPC';
    const message = this.state.error || 'Browser GPU unavailable';

    return (
      <div className="relative h-full w-full overflow-hidden bg-[#05070a] text-zinc-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_38%,rgba(55,91,140,0.18),transparent_32%),linear-gradient(180deg,#0b0f14_0%,#05070a_72%,#030405_100%)]" />
        <div className="absolute inset-x-[-14%] bottom-[-42%] h-[78%] origin-center opacity-35 [transform:perspective(720px)_rotateX(66deg)] bg-[linear-gradient(rgba(90,110,138,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(90,110,138,0.18)_1px,transparent_1px)] bg-[size:42px_42px]" />

        <div className="absolute left-1/2 top-[47%] h-[48%] w-[18%] min-w-24 -translate-x-1/2 -translate-y-1/2 rounded-[46%_46%_30%_30%] border border-[#344153] bg-gradient-to-b from-[#2c3540] via-[#151b22] to-[#090c10] shadow-[0_0_55px_rgba(68,112,170,0.15)]">
          <div className="absolute left-1/2 top-[-16%] h-[26%] w-[46%] -translate-x-1/2 rounded-full border border-[#3c4856] bg-[#262f39]" />
          <div className="absolute inset-x-[22%] top-[13%] h-px bg-sky-300/30 shadow-[0_0_9px_rgba(125,211,252,0.4)]" />
        </div>

        <div className="absolute left-4 top-4 rounded border border-[#394452] bg-[#0a0e13]/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-zinc-400">
          Training viewport
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded border border-amber-500/20 bg-[#151006]/85 px-2 py-1 text-[8px] text-amber-300">
          <TriangleAlert className="h-3 w-3" /> Software fallback
        </div>

        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 text-center">
          <div className="text-[11px] font-semibold text-zinc-300">{characterName}</div>
          <div className="mt-1 text-[8px] uppercase tracking-[0.16em] text-zinc-600">Neutral training-stage preview</div>
        </div>

        <div className="absolute bottom-2 left-1/2 flex max-w-[82%] -translate-x-1/2 items-center gap-1.5 rounded border border-[#303944] bg-[#080b0f]/90 px-2 py-1 text-[8px] text-zinc-600">
          <Cpu className="h-3 w-3" /> {message}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.error) return this.renderFallback();
    return this.props.children;
  }
}

export default BrowserViewportGuard;
