import React from 'react';
import { Activity, Cpu, MemoryStick, HardDrive, Wifi, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface WonderCanvasStatsProps {
  isPlaying: boolean;
}

export const WonderCanvasStats: React.FC<WonderCanvasStatsProps> = ({ isPlaying }) => {
  const stats = [
    { label: 'Draw Calls', value: '24', icon: Cpu, color: 'text-sky-400', bg: 'bg-sky-950/40' },
    { label: 'Triangles', value: '38.4k', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-950/40' },
    { label: 'VRAM Usage', value: '124 MB', icon: MemoryStick, color: 'text-amber-400', bg: 'bg-amber-950/40' },
    { label: 'Texture Mem', value: '42 MB', icon: HardDrive, color: 'text-purple-400', bg: 'bg-purple-950/40' },
    { label: 'Network', value: '0.8 KB/s', icon: Wifi, color: 'text-cyan-400', bg: 'bg-cyan-950/40' },
    { label: 'Frame Time', value: '16.6 ms', icon: Zap, color: 'text-rose-400', bg: 'bg-rose-950/40' },
  ];

  const features = [
    { name: 'WebGPU Renderer', status: true },
    { name: 'Filament PBR BRDF', status: true },
    { name: 'Draco Compression', status: true },
    { name: 'KTX2 / BasisU', status: true },
    { name: 'Compute Shaders', status: true },
    { name: 'Ray Tracing', status: false },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[--color-bg-surface] text-zinc-300 text-xs overflow-y-auto custom-scrollbar p-3 space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-[--color-border-default] pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-emerald-950/80 border border-emerald-600/40 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs">WonderCanvas Diagnostics</h3>
            <p className="text-[10px] text-zinc-500 font-mono">Real-time Engine Telemetry</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-[10px] font-mono text-zinc-500">{isPlaying ? 'RUNNING' : 'IDLE'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className={`p-3 rounded-lg border border-[--color-border-default] ${stat.bg}`}>
            <div className="flex items-center space-x-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-zinc-400 font-mono text-[10px]">{stat.label}</span>
            </div>
            <div className="text-white font-mono font-semibold text-lg">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[--color-border-default]">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          Feature Support Matrix
        </span>
        <div className="space-y-2 mt-2">
          {features.map((feature) => (
            <div key={feature.name} className="flex items-center justify-between p-2 bg-zinc-900/60 rounded border border-[--color-border-default]/40">
              <span className="text-zinc-300 text-xs font-mono">{feature.name}</span>
              <div className="flex items-center space-x-1.5">
                {feature.status ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span className={`text-[10px] font-mono ${feature.status ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {feature.status ? 'SUPPORTED' : 'UNAVAILABLE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-[--color-border-default]">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          Runtime Config
        </span>
        <div className="space-y-2 mt-2 font-mono text-[10px] text-zinc-400">
          <div className="flex justify-between p-2 bg-zinc-900/60 rounded border border-[--color-border-default]/40">
            <span>Renderer Backend</span>
            <span className="text-sky-400">WebGPU (Primary)</span>
          </div>
          <div className="flex justify-between p-2 bg-zinc-900/60 rounded border border-[--color-border-default]/40">
            <span>PBR Model</span>
            <span className="text-emerald-400">Filament v1.50 GGX</span>
          </div>
          <div className="flex justify-between p-2 bg-zinc-900/60 rounded border border-[--color-border-default]/40">
            <span>IBL Prefilter</span>
            <span className="text-amber-400">PMREM (256 samples)</span>
          </div>
          <div className="flex justify-between p-2 bg-zinc-900/60 rounded border border-[--color-border-default]/40">
            <span>Shadow Map</span>
            <span className="text-purple-400">PCF 2048²</span>
          </div>
          <div className="flex justify-between p-2 bg-zinc-900/60 rounded border border-[--color-border-default]/40">
            <span>Post-FX</span>
            <span className="text-cyan-400">Bloom + Tonemap + FXAA</span>
          </div>
        </div>
      </div>
    </div>
  );
};