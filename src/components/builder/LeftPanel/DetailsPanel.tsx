import React from 'react';
import { TransformState, PBRMaterial } from '../../types';

interface DetailsPanelProps {
  selectedAsset: string;
  transform: TransformState;
  onTransformChange: (key: keyof TransformState, value: number) => void;
  materials: PBRMaterial[];
  onMaterialUpdate: (id: string, roughness: number, metallic: number) => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedAsset,
  transform,
  onTransformChange,
  materials,
  onMaterialUpdate,
}) => {
  const createNumberInput = (key: keyof TransformState, label: string) => (
    <div key={key} className="grid grid-cols-4 gap-2">
      <label className="text-xs text-zinc-500 col-span-1">{label}</label>
      {(['X', 'Y', 'Z'] as const).map((axis) => (
        <input
          key={axis}
          type="number"
          step="0.1"
          className="col-span-1 bg-[--color-bg-input] border border-[--color-border-default] rounded px-2 py-1 text-white text-sm focus:border-[--color-accent-blue] focus:outline-none"
          placeholder="0"
          value={transform[`${key}${axis}` as keyof TransformState] as number}
          onChange={(e) => onTransformChange(`${key}${axis}` as keyof TransformState, parseFloat(e.target.value))}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[--color-bg-surface] border-b border-[--color-border-default]">
      <div className="px-3 py-2 border-b border-[--color-border-default] flex items-center justify-between bg-[--color-bg-elevated]">
        <div className="flex items-center space-x-1.5 text-zinc-200 font-semibold text-xs tracking-wider">
          <Palette className="w-3.5 h-3.5 text-zinc-400" />
          <span>DETAILS INSPECTOR</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {selectedAsset ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[--color-bg-input] rounded-lg border border-[--color-border-default]">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h4 className="text-white font-medium">{selectedAsset}</h4>
                <p className="text-xs text-zinc-400">NPC Entity</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[--color-border-default]">
              <h5 className="text-zinc-400 text-xs uppercase tracking-wider">TRANSFORM</h5>
              {createNumberInput('pos', 'Position')}
              {createNumberInput('rot', 'Rotation')}
              {createNumberInput('scale', 'Scale')}
            </div>

            <div className="space-y-3 pt-2 border-t border-[--color-border-default]">
              <h5 className="text-zinc-400 text-xs uppercase tracking-wider">MATERIALS</h5>
              {materials.map((material) => (
                <div key={material.id} className="space-y-2 p-2 bg-[--color-bg-input] rounded border border-[--color-border-default]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">{material.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{material.shaderType}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-zinc-400">Roughness</span>
                        <span className="text-sky-400 font-mono">{material.roughness.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={material.roughness}
                        onChange={(e) => onMaterialUpdate(material.id, parseFloat(e.target.value), material.metallic)}
                        className="slider"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-zinc-400">Metallic</span>
                        <span className="text-sky-400 font-mono">{material.metallic.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={material.metallic}
                        onChange={(e) => onMaterialUpdate(material.id, material.roughness, parseFloat(e.target.value))}
                        className="slider"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t border-[--color-border-default]">
              <h5 className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 bg-gradient-to-br from-pink-500 to-purple-600 rounded flex items-center justify-center text-xs">🎤</span>
                NPC VOICE
              </h5>
              <div className="space-y-3 text-xs text-zinc-300">
                <p>Voice configuration available in NPC Inspector</p>
                <button className="w-full py-2 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2">
                  <span className="text-lg">🔊</span>
                  <span>Configure Voice</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <div className="text-4xl mb-4">🖱️</div>
            <p className="text-sm">Select an object to inspect</p>
            <p className="text-xs text-zinc-600 mt-1">Click on any NPC in the viewport</p>
          </div>
        )}
      </div>
    </div>
  );
};