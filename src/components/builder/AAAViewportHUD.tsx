import React from 'react';
import { Activity, Cpu, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';

interface AAAViewportHUDProps {
  characterName: string;
  characterType: string;
  status: string;
  courseCount: number;
  intelligence?: number;
  speed?: number;
}

const Corner: React.FC<{ className: string }> = ({ className }) => (
  <span className={`pointer-events-none absolute h-8 w-8 ${className}`} aria-hidden="true" />
);

const AAAViewportHUD: React.FC<AAAViewportHUDProps> = ({
  characterName,
  characterType,
  status,
  courseCount,
  intelligence,
  speed,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

      <Corner className="left-4 top-4 border-l border-t border-cyan-300/50" />
      <Corner className="right-4 top-4 border-r border-t border-cyan-300/35" />
      <Corner className="bottom-4 left-4 border-b border-l border-violet-300/35" />
      <Corner className="bottom-4 right-4 border-b border-r border-violet-300/50" />

      <div className="absolute left-5 top-5 flex items-center gap-3 rounded-md border border-cyan-400/20 bg-[#040914]/78 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="relative flex h-8 w-8 items-center justify-center rounded border border-cyan-400/30 bg-cyan-400/10">
          <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.95)]" />
        </div>
        <div className="leading-tight">
          <div className="text-[8px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Live Character Runtime</div>
          <div className="mt-0.5 text-[12px] font-semibold tracking-wide text-white">{characterName}</div>
          <div className="mt-0.5 text-[7px] uppercase tracking-[0.16em] text-zinc-500">{characterType} • cinematic preview</div>
        </div>
      </div>

      <div className="absolute right-5 top-5 flex items-center gap-2 rounded-md border border-violet-400/20 bg-[#060913]/78 px-3 py-2 backdrop-blur-md">
        <LockKeyhole className="h-3.5 w-3.5 text-violet-300" />
        <div className="leading-tight">
          <div className="text-[8px] font-semibold uppercase tracking-[0.18em] text-violet-200">System Training Lab</div>
          <div className="mt-0.5 text-[7px] text-zinc-500">Read-only • auto reset • {courseCount} capability groups</div>
        </div>
      </div>

      <div className="absolute bottom-5 left-5 flex max-w-[58%] items-center gap-3 rounded-md border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md">
        <Activity className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
        <div className="min-w-0">
          <div className="truncate text-[8px] font-medium text-zinc-200">{status}</div>
          <div className="mt-0.5 text-[7px] uppercase tracking-[0.14em] text-zinc-600">Behavior authoritative • AI assisted • runtime validated</div>
        </div>
      </div>

      <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-md border border-white/10 bg-black/55 px-2.5 py-2 backdrop-blur-md">
        <div className="flex items-center gap-1.5 border-r border-white/10 pr-2.5">
          <Cpu className="h-3 w-3 text-sky-300" />
          <span className="text-[7px] uppercase tracking-[0.12em] text-zinc-500">PBR / ACES</span>
        </div>
        {typeof intelligence === 'number' && (
          <span className="text-[7px] font-semibold text-cyan-200">INT {intelligence}</span>
        )}
        {typeof speed === 'number' && (
          <span className="text-[7px] font-semibold text-violet-200">SPD {speed}</span>
        )}
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
      </div>
    </div>
  );
};

export default AAAViewportHUD;
