import React, { useState } from 'react';
import {
  Camera,
  Cpu,
  Layers,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  FileCode,
  Sliders,
  Settings,
  RefreshCw,
  FolderOpen,
  Eye,
  FileCheck,
  Zap,
} from 'lucide-react';

interface RealityCapturePipelinePanelProps {
  onNotifyLog?: (level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR', msg: string) => void;
}

export const RealityCapturePipelinePanel: React.FC<RealityCapturePipelinePanelProps> = ({
  onNotifyLog,
}) => {
  const [imageBatchCount, setImageBatchCount] = useState<number>(148);
  const [decimateRatio, setDecimateRatio] = useState<number>(0.1);
  const [bakeResolution, setBakeResolution] = useState<'1024' | '2048' | '4096'>('2048');
  const [enableDraco, setEnableDraco] = useState<boolean>(true);
  const [enableBasisu, setEnableBasisu] = useState<boolean>(true);
  const [exportTarget, setExportTarget] = useState<'glb' | 'gltf' | 'wondercanvas_bundle'>('glb');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const steps = [
    {
      id: 1,
      name: 'COLMAP (SfM)',
      desc: 'Structure-from-Motion & Camera Pose Estimation',
      detail: `${imageBatchCount} photos / 142 matched (96%)`,
      status: currentStep > 1 ? 'done' : currentStep === 1 ? 'running' : 'idle',
      duration: '42s',
      polyCount: '48,200 Sparse Points',
    },
    {
      id: 2,
      name: 'Meshroom Depth',
      desc: 'Dense Depth Map & High-Poly Surface Mesh',
      detail: 'Meshroom batch output: raw_mesh.obj',
      status: currentStep > 2 ? 'done' : currentStep === 2 ? 'running' : 'idle',
      duration: '1m 18s',
      polyCount: '3,840,000 Polygons (Raw)',
    },
    {
      id: 3,
      name: 'Headless Cycles Optimizer',
      desc: 'Decimation to 10% & Cycles PBR Light/AO Bake',
      detail: `Headless bake -> ${bakeResolution}x${bakeResolution} PBR ORM`,
      status: currentStep > 3 ? 'done' : currentStep === 3 ? 'running' : 'idle',
      duration: '54s',
      polyCount: `${Math.round(3840000 * decimateRatio).toLocaleString()} Tris (Game Ready)`,
    },
    {
      id: 4,
      name: 'WonderCanvas GLB Pack',
      desc: 'Draco Compression & WonderCanvas Deployment',
      detail: 'output: SK_DigitalHuman_01.glb (3.8MB)',
      status: currentStep >= 4 ? 'done' : 'idle',
      duration: '4s',
      polyCount: 'WonderCanvas Ready',
    },
  ];

  const handleRunPipeline = () => {
    setIsProcessing(true);
    setCurrentStep(1);
    setProgressPercent(15);
    onNotifyLog?.('INFO', `Starting reality capture pipeline: COLMAP feature extraction with ${imageBatchCount} images`);

    setTimeout(() => {
      setCurrentStep(2);
      setProgressPercent(45);
      onNotifyLog?.('INFO', 'COLMAP completed. Launching Meshroom dense photogrammetry reconstruction...');
    }, 1800);

    setTimeout(() => {
      setCurrentStep(3);
      setProgressPercent(78);
      onNotifyLog?.('INFO', `Running headless decimation optimizer (ratio: ${decimateRatio}) & Cycles ${bakeResolution}px PBR map bake...`);
    }, 3600);

    setTimeout(() => {
      setCurrentStep(4);
      setProgressPercent(100);
      setIsProcessing(false);
      onNotifyLog?.('INFO', 'Asset optimized successfully! Exported SK_DigitalHuman_01.glb (3.8 MB) ready for WonderCanvas Engine.');
    }, 5400);
  };

  return (
    <div className="flex-1 flex flex-col bg-[--color-bg-surface] text-zinc-300 text-xs overflow-y-auto custom-scrollbar p-3 space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-[--color-border-default] pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-sky-950/80 border border-sky-600/40 text-sky-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs">Reality Capture Pipeline</h3>
            <p className="text-[10px] text-zinc-500 font-mono">COLMAP ➔ Meshroom ➔ Cycles Optimizer ➔ WonderCanvas</p>
          </div>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={isProcessing}
          className={`px-3 py-1.5 rounded flex items-center space-x-1.5 font-medium transition-all shadow-md ${
            isProcessing
              ? 'bg-amber-900/60 text-amber-300 border border-amber-600/40 cursor-not-allowed'
              : 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 active:scale-95'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Baking... {progressPercent}%</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Pipeline</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-1 bg-zinc-900/90 border border-[--color-border-default] p-2.5 rounded-lg">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400">Pipeline Status:</span>
          <span className={isProcessing ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
            {isProcessing ? `Step ${currentStep}/4 in progress` : 'Standby / Synchronized'}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-[--color-border-default]">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-amber-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-0.5">
          <span>Target: bin/process_asset.sh</span>
          <span>Elapsed: 2m 58s</span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          Pipeline Execution Stages
        </span>

        <div className="space-y-2">
          {steps.map((step) => {
            const isDone = step.status === 'done';
            const isRunning = step.status === 'running';

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded border transition-all ${
                  isRunning
                    ? 'bg-sky-950/40 border-sky-600/70 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                    : isDone
                    ? 'bg-zinc-900/70 border-[--color-border-default] text-zinc-300'
                    : 'bg-zinc-900/30 border-[--color-border-default]/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/60'
                          : isRunning
                          ? 'bg-sky-900 text-sky-300 border border-sky-500 animate-pulse'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-100">{step.name}</span>
                      <span className="text-[10px] text-zinc-500 block font-mono">{step.desc}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400">{step.duration}</span>
                </div>

                <div className="mt-2 pt-2 border-t border-[--color-border-default]/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400 truncate max-w-[190px]">{step.detail}</span>
                  <span className="text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                    {step.polyCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center justify-between">
          <span>Headless Cycles Optimizer Parameters</span>
          <Settings className="w-3.5 h-3.5 text-zinc-500" />
        </span>

        <div className="bg-zinc-900/80 border border-[--color-border-default] p-3 rounded-lg space-y-3 font-mono">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-400">Decimation Poly Ratio:</span>
              <span className="text-sky-400 font-bold">{(decimateRatio * 100).toFixed(0)}% (Collapse to ~38k tris)</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.50"
              step="0.01"
              value={decimateRatio}
              onChange={(e) => setDecimateRatio(parseFloat(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 h-1.5 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Cycles PBR Bake Map:</span>
            <div className="flex space-x-1">
              {(['1024', '2048', '4096'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setBakeResolution(res)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    bakeResolution === res
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {res}px
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center space-x-2 text-[10px] text-zinc-300 cursor-pointer bg-zinc-950/60 p-1.5 rounded border border-[--color-border-default]">
              <input
                type="checkbox"
                checked={enableDraco}
                onChange={(e) => setEnableDraco(e.target.checked)}
                className="rounded accent-sky-500 bg-zinc-900"
              />
              <span>Draco Mesh Geom</span>
            </label>

            <label className="flex items-center space-x-2 text-[10px] text-zinc-300 cursor-pointer bg-zinc-950/60 p-1.5 rounded border border-[--color-border-default]">
              <input
                type="checkbox"
                checked={enableBasisu}
                onChange={(e) => setEnableBasisu(e.target.checked)}
                className="rounded accent-sky-500 bg-zinc-900"
              />
              <span>KTX2 / Basis-U ORM</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-[--color-bg-deep] border border-[--color-border-default]/80 p-2.5 rounded font-mono text-[10px] text-zinc-400">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="flex items-center space-x-1">
            <FileCode className="w-3 h-3 text-emerald-400" />
            <span>bin/process_asset.sh</span>
          </span>
          <span className="text-[9px] bg-zinc-800 px-1 rounded text-zinc-300">Isolated Headless Runner</span>
        </div>
        <div className="text-zinc-500 truncate">
          ./bin/optimize_pipeline.sh --decimate={decimateRatio} --bake={bakeResolution} --target=wondercanvas
        </div>
      </div>
    </div>
  );
};