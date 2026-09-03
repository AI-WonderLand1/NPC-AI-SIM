import React from 'react';
import { Bot, Box, BrainCircuit, Mic2, Palette, SlidersHorizontal } from 'lucide-react';
import type { PBRMaterial, TransformState } from '../types';

interface DetailsPanelProps {
  selectedAsset: string;
  transform: TransformState;
  onTransformChange: (key: keyof TransformState, value: number) => void;
  materials: PBRMaterial[];
  onMaterialUpdate: (id: string, roughness: number, metallic: number) => void;
}

type TransformPrefix = 'pos' | 'rot' | 'scale';

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedAsset,
  transform,
  onTransformChange,
  materials,
  onMaterialUpdate,
}) => {
  const createNumberInput = (prefix: TransformPrefix, label: string) => (
    <div className="grid grid-cols-[64px_repeat(3,minmax(0,1fr))] gap-1.5 items-center">
      <label className="text-[10px] text-zinc-500 font-mono">{label}</label>
      {(['X', 'Y', 'Z'] as const).map((axis) => {
        const key = `${prefix}${axis}` as keyof TransformState;
        return (
          <input
            key={axis}
            type="number"
            step="0.1"
            className="min-w-0 bg-[#0e0e11] border border-zinc-800 rounded px-1.5 py-1 text-zinc-200 text-[10px] font-mono focus:border-sky-600 focus:outline-none"
            value={transform[key] as number}
            onChange={(e) => {
              const value = Number.parseFloat(e.target.value);
              onTransformChange(key, Number.isFinite(value) ? value : 0);
            }}
            aria-label={`${label} ${axis}`}
          />
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#101014]">
      <div className="h-8 shrink-0 px-3 border-y border-zinc-800 flex items-center justify-between bg-[#141417]">
        <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-[10px] tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          <span>DETAILS PANEL</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-600">INSPECTOR</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-3 custom-scrollbar">
        {selectedAsset ? (
          <>
            <div className="flex items-center gap-2.5 p-2 bg-[#0e0e11] rounded border border-zinc-800">
              <div className="w-9 h-9 rounded bg-sky-950/70 border border-sky-800/60 flex items-center justify-center">
                <Bot className="w-5 h-5 text-sky-300" />
              </div>
              <div className="min-w-0">
                <h4 className="text-zinc-100 text-xs font-medium truncate">{selectedAsset}</h4>
                <p className="text-[9px] text-zinc-500 font-mono">NPC CHARACTER ENTITY</p>
              </div>
            </div>

            <section className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-semibold tracking-wider">
                <Box className="w-3 h-3" />
                <span>TRANSFORM</span>
              </div>
              {createNumberInput('pos', 'Position')}
              {createNumberInput('rot', 'Rotation')}
              {createNumberInput('scale', 'Scale')}
            </section>

            <section className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-semibold tracking-wider">
                <Box className="w-3 h-3" />
                <span>MESH</span>
              </div>
              <div className="grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-[10px] font-mono">
                <span className="text-zinc-600">Type</span><span className="text-zinc-300">SkeletalMesh</span>
                <span className="text-zinc-600">Rig</span><span className="text-zinc-300">Humanoid</span>
                <span className="text-zinc-600">LOD</span><span className="text-emerald-400">Auto</span>
                <span className="text-zinc-600">Shadows</span><span className="text-zinc-300">Enabled</span>
              </div>
            </section>

            <section className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-semibold tracking-wider">
                <Palette className="w-3 h-3" />
                <span>MATERIALS / PBR</span>
              </div>
              {materials.map((material) => (
                <div key={material.id} className="space-y-2 p-2 bg-[#0e0e11] rounded border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-zinc-300">{material.name}</span>
                    <span className="text-[9px] text-zinc-600 font-mono">{material.shaderType}</span>
                  </div>
                  <label className="block">
                    <div className="flex justify-between text-[9px] mb-1">
                      <span className="text-zinc-500">Roughness</span>
                      <span className="text-sky-400 font-mono">{material.roughness.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={material.roughness}
                      onChange={(e) => onMaterialUpdate(material.id, Number(e.target.value), material.metallic)}
                      className="slider"
                    />
                  </label>
                  <label className="block">
                    <div className="flex justify-between text-[9px] mb-1">
                      <span className="text-zinc-500">Metallic</span>
                      <span className="text-sky-400 font-mono">{material.metallic.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={material.metallic}
                      onChange={(e) => onMaterialUpdate(material.id, material.roughness, Number(e.target.value))}
                      className="slider"
                    />
                  </label>
                </div>
              ))}
            </section>

            <section className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-semibold tracking-wider">
                <BrainCircuit className="w-3 h-3" />
                <span>NPC / AI</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                {[
                  ['AI Reasoning', true],
                  ['Vision Perception', true],
                  ['Audio Perception', false],
                  ['Behavior Graph', true],
                ].map(([label, enabled]) => (
                  <label key={String(label)} className="flex items-center justify-between text-zinc-400">
                    <span>{String(label)}</span>
                    <input type="checkbox" defaultChecked={Boolean(enabled)} className="accent-sky-500" />
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-semibold tracking-wider">
                <Mic2 className="w-3 h-3" />
                <span>VOICE</span>
              </div>
              <div className="grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-[10px] font-mono">
                <span className="text-zinc-600">Provider</span><span className="text-zinc-300">Configurable</span>
                <span className="text-zinc-600">Spatial</span><span className="text-emerald-400">Enabled</span>
                <span className="text-zinc-600">Subtitles</span><span className="text-emerald-400">Enabled</span>
              </div>
            </section>
          </>
        ) : (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center text-zinc-600">
            <Bot className="w-7 h-7 mb-2 opacity-40" />
            <p className="text-[10px] font-medium text-zinc-500">No selection</p>
            <p className="text-[9px] mt-1">Select a character or scene object to inspect it.</p>
          </div>
        )}
      </div>
    </div>
  );
};
