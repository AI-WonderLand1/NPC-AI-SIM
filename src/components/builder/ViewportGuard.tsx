import React from 'react';
import { Bot, Box, Cpu, Sparkles, TriangleAlert } from 'lucide-react';

interface ViewportGuardProps {
  children: React.ReactNode;
  onError?: (message: string) => void;
  characterName?: string;
  characterType?: string;
  thumbnail?: string;
  description?: string;
  tags?: string[];
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

const shortError = (message: string) =>
  message.replace(/^THREE\.WebGLRenderer:\s*/i, '').replace(/\.$/, '');

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

  renderFallback() {
    const {
      characterName = 'NPC Character',
      characterType = 'Humanoid',
      thumbnail,
      description = 'AI-driven character ready for behavior, dialogue, animation, and export.',
      tags = [],
    } = this.props;
    const message = shortError(this.state.error || 'WebGL unavailable');
    const visibleTags = tags.slice(0, 3);

    return (
      <div className="relative h-full w-full overflow-hidden bg-[#030811] text-left">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(30,105,255,0.18), transparent 30%), radial-gradient(circle at 72% 36%, rgba(139,92,246,0.12), transparent 28%), linear-gradient(180deg, #07101d 0%, #030811 68%, #02050a 100%)',
          }}
        />

        <div
          className="absolute inset-x-[-15%] bottom-[-37%] h-[72%] origin-center opacity-55"
          style={{
            transform: 'perspective(620px) rotateX(64deg)',
            backgroundImage:
              'linear-gradient(rgba(66,125,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(66,125,255,0.18) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'linear-gradient(to top, black 10%, transparent 82%)',
          }}
        />

        <div className="absolute left-[8%] top-[13%] h-52 w-52 rounded-full border border-sky-500/10 bg-sky-500/[0.025] blur-[1px]" />
        <div className="absolute right-[10%] top-[19%] h-40 w-40 rounded-full border border-violet-500/10 bg-violet-500/[0.025]" />

        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-950/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.07)]">
          <TriangleAlert className="h-3.5 w-3.5" />
          Software preview
        </div>

        <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/20 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
          <Cpu className="h-3.5 w-3.5" />
          Editor online
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-8 pb-12 pt-14">
          <div className="relative flex w-full max-w-3xl items-center justify-center gap-10">
            <div className="relative shrink-0">
              <div className="absolute -inset-10 rounded-full bg-sky-500/10 blur-3xl" />
              <div className="absolute -inset-6 rounded-full border border-sky-400/10" />
              <div className="absolute -inset-3 rounded-full border border-violet-400/15" />
              <div className="relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-[38px] border border-sky-400/25 bg-gradient-to-br from-[#0d2137] via-[#0b1424] to-[#17102f] shadow-[0_0_55px_rgba(56,189,248,0.16)]">
                {thumbnail ? (
                  <img src={thumbnail} alt={characterName} className="h-full w-full object-cover opacity-95" />
                ) : (
                  <Bot className="h-20 w-20 text-sky-300/70" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#020711] to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-md border border-sky-400/20 bg-[#06101c]/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-200">
                  {characterType}
                </div>
              </div>
            </div>

            <div className="max-w-md">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-400">
                <Sparkles className="h-4 w-4" /> AI character preview
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-white">{characterName}</h2>
              <p className="mt-3 max-w-lg text-[13px] leading-6 text-zinc-400">{description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(visibleTags.length ? visibleTags : ['AI Ready', 'Behavior', 'Dialogue']).map((tag) => (
                  <span key={tag} className="rounded-full border border-[#2c425f] bg-[#0a1625]/90 px-2.5 py-1 text-[9px] font-medium text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-7 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg border border-[#223653] bg-[#071321]/80 p-3">
                  <div className="mb-1 flex items-center gap-2 font-semibold text-zinc-200"><Bot className="h-3.5 w-3.5 text-violet-300" /> AI Runtime</div>
                  <div className="text-zinc-600">Behavior graph and editor remain active</div>
                </div>
                <div className="rounded-lg border border-[#223653] bg-[#071321]/80 p-3">
                  <div className="mb-1 flex items-center gap-2 font-semibold text-zinc-200"><Box className="h-3.5 w-3.5 text-sky-300" /> 3D Renderer</div>
                  <div className="text-zinc-600">Enable WebGL for the interactive scene</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 flex max-w-[72%] -translate-x-1/2 items-center gap-2 rounded-full border border-[#263950] bg-[#06101a]/90 px-3 py-1.5 text-[9px] text-zinc-500 shadow-xl backdrop-blur">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
          3D acceleration unavailable: {message}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.error) return this.renderFallback();
    return this.props.children;
  }
}

export default ViewportGuard;
