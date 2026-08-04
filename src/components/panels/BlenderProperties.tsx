import React, { useState } from 'react';
import { ModifierItem, MaterialData, SculptBrush } from '../../types';
import {
  Sliders,
  Move,
  Layers,
  Sparkles,
  Paintbrush,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Check,
  Grid,
  Box,
  Circle,
  FileCode,
  Grid2X2
} from 'lucide-react';

interface BlenderPropertiesProps {
  modifiers: ModifierItem[];
  setModifiers: React.Dispatch<React.SetStateAction<ModifierItem[]>>;
  material: MaterialData;
  setMaterial: React.Dispatch<React.SetStateAction<MaterialData>>;
  sculptBrush: SculptBrush;
  setSculptBrush: React.Dispatch<React.SetStateAction<SculptBrush>>;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  setTransform: React.Dispatch<
    React.SetStateAction<{
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }>
  >;
  retopoOverlay: boolean;
  setRetopoOverlay: (val: boolean) => void;
}

export const BlenderProperties: React.FC<BlenderPropertiesProps> = ({
  modifiers,
  setModifiers,
  material,
  setMaterial,
  sculptBrush,
  setSculptBrush,
  transform,
  setTransform,
  retopoOverlay,
  setRetopoOverlay
}) => {
  const [activeTab, setActiveTab] = useState<
    'transform' | 'modifiers' | 'material' | 'uv' | 'sculpt'
  >('transform');

  // Add modifier handler
  const handleAddModifier = (type: ModifierItem['type']) => {
    const newMod: ModifierItem = {
      id: `mod_${Date.now()}`,
      type,
      name:
        type === 'subdivision'
          ? 'Subdivision Surface'
          : type === 'decimate'
          ? 'Decimate Mesh'
          : type === 'mirror'
          ? 'Mirror Symmetry'
          : type === 'retopo'
          ? 'Retopology Shrinkwrap'
          : 'Solidify Shell',
      enabled: true,
      settings:
        type === 'subdivision'
          ? { levelsViewport: 1, levelsRender: 2 }
          : type === 'decimate'
          ? { ratio: 0.5 }
          : { offset: 0.01 }
    };
    setModifiers((prev) => [...prev, newMod]);
  };

  const handleToggleModifier = (id: string) => {
    setModifiers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleRemoveModifier = (id: string) => {
    setModifiers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="w-full h-full bg-[#232323] border-l border-[#111] flex flex-col select-none text-xs text-gray-300 overflow-hidden">
      {/* Header Tab Switcher */}
      <div className="bg-[#2d2d2d] border-b border-[#111] px-2 py-1 flex items-center justify-between font-medium">
        <div className="flex items-center gap-1 bg-[#181818] p-0.5 rounded-sm border border-[#333]">
          <button
            onClick={() => setActiveTab('transform')}
            className={`px-2 py-0.5 rounded-sm text-[10px] transition ${
              activeTab === 'transform'
                ? 'bg-[#3d85c6] text-white font-semibold'
                : 'text-gray-400 hover:bg-[#2a2a2a]'
            }`}
            title="Object Transform"
          >
            Transform
          </button>
          <button
            onClick={() => setActiveTab('modifiers')}
            className={`px-2 py-0.5 rounded-sm text-[10px] transition ${
              activeTab === 'modifiers'
                ? 'bg-[#3d85c6] text-white font-semibold'
                : 'text-gray-400 hover:bg-[#2a2a2a]'
            }`}
            title="Modifier Stack"
          >
            Modifiers ({modifiers.length})
          </button>
          <button
            onClick={() => setActiveTab('material')}
            className={`px-2 py-0.5 rounded-sm text-[10px] transition ${
              activeTab === 'material'
                ? 'bg-[#3d85c6] text-white font-semibold'
                : 'text-gray-400 hover:bg-[#2a2a2a]'
            }`}
            title="Shader Node Editor"
          >
            Material
          </button>
          <button
            onClick={() => setActiveTab('uv')}
            className={`px-2 py-0.5 rounded-sm text-[10px] transition ${
              activeTab === 'uv'
                ? 'bg-[#3d85c6] text-white font-semibold'
                : 'text-gray-400 hover:bg-[#2a2a2a]'
            }`}
            title="2D UV Layout"
          >
            UV Unwrap
          </button>
          <button
            onClick={() => setActiveTab('sculpt')}
            className={`px-2 py-0.5 rounded-sm text-[10px] transition ${
              activeTab === 'sculpt'
                ? 'bg-[#3d85c6] text-white font-semibold'
                : 'text-gray-400 hover:bg-[#2a2a2a]'
            }`}
            title="Digital Sculpting"
          >
            Sculpt
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* 1. TRANSFORM TAB */}
        {activeTab === 'transform' && (
          <div className="space-y-4">
            <div className="font-semibold text-gray-200 border-b border-[#2d2d2d] pb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
              <Move className="w-3.5 h-3.5 text-[#3d85c6]" />
              <span>Object Transform Properties</span>
            </div>

            {/* Position */}
            <div className="space-y-1">
              <span className="text-gray-400 font-mono text-[10px] uppercase">Position (Location)</span>
              <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, i) => (
                  <div
                    key={`pos_${axis}`}
                    className="flex items-center bg-[#181818] border border-[#333] rounded-sm overflow-hidden"
                  >
                    <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 font-mono font-bold text-[10px]">
                      {axis}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={transform.position[i]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const next = [...transform.position] as [number, number, number];
                        next[i] = val;
                        setTransform((prev) => ({ ...prev, position: next }));
                      }}
                      className="w-full bg-transparent text-white px-1 font-mono text-[10px] outline-none text-right"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-1">
              <span className="text-gray-400 font-mono text-[10px] uppercase">Rotation (Euler °)</span>
              <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, i) => (
                  <div
                    key={`rot_${axis}`}
                    className="flex items-center bg-[#181818] border border-[#333] rounded-sm overflow-hidden"
                  >
                    <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 font-mono font-bold text-[10px]">
                      {axis}
                    </span>
                    <input
                      type="number"
                      step="1"
                      value={transform.rotation[i]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const next = [...transform.rotation] as [number, number, number];
                        next[i] = val;
                        setTransform((prev) => ({ ...prev, rotation: next }));
                      }}
                      className="w-full bg-transparent text-white px-1 font-mono text-[10px] outline-none text-right"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div className="space-y-1">
              <span className="text-gray-400 font-mono text-[10px] uppercase">Scale Multiplier</span>
              <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, i) => (
                  <div
                    key={`scale_${axis}`}
                    className="flex items-center bg-[#181818] border border-[#333] rounded-sm overflow-hidden"
                  >
                    <span className="bg-[#3d85c6]/20 text-[#3d85c6] px-1.5 py-0.5 font-mono font-bold text-[10px]">
                      {axis}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={transform.scale[i]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        const next = [...transform.scale] as [number, number, number];
                        next[i] = val;
                        setTransform((prev) => ({ ...prev, scale: next }));
                      }}
                      className="w-full bg-transparent text-white px-1 font-mono text-[10px] outline-none text-right"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Retopology Toggle Button */}
            <div className="pt-2 border-t border-[#2d2d2d]">
              <button
                onClick={() => setRetopoOverlay(!retopoOverlay)}
                className={`w-full py-1.5 px-3 rounded-sm font-medium flex items-center justify-center gap-2 transition text-[11px] ${
                  retopoOverlay
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-[#353535] hover:bg-[#404040] text-gray-200 border border-[#444]'
                }`}
              >
                <Grid className="w-4 h-4 text-amber-300" />
                <span>
                  {retopoOverlay
                    ? 'Disable Retopology Cage'
                    : 'Enable Retopology Overlay Cage'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 2. MODIFIERS TAB */}
        {activeTab === 'modifiers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-gray-200 text-[11px] uppercase tracking-wide">
                <Layers className="w-3.5 h-3.5 text-[#3d85c6]" />
                <span>Modifier Stack</span>
              </div>

              {/* Add Modifier Select */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddModifier(e.target.value as ModifierItem['type']);
                    e.target.value = '';
                  }
                }}
                className="bg-[#181818] border border-[#333] text-[#3d85c6] font-medium px-2 py-0.5 rounded-sm text-[10px] outline-none"
              >
                <option value="">+ Add Modifier...</option>
                <option value="subdivision">Subdivision Surface</option>
                <option value="decimate">Decimate Mesh</option>
                <option value="mirror">Mirror Symmetry</option>
                <option value="retopo">Retopology Shrinkwrap</option>
              </select>
            </div>

            {/* Stack List */}
            <div className="space-y-2">
              {modifiers.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-[#353535] border border-[#444] rounded-sm p-2.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleModifier(mod.id)}
                        className={`p-1 rounded-sm ${
                          mod.enabled
                            ? 'bg-[#3d85c6] text-white'
                            : 'bg-[#181818] text-gray-400'
                        }`}
                        title="Toggle modifier"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <span className="font-semibold text-gray-200 text-[11px]">{mod.name}</span>
                    </div>

                    <button
                      onClick={() => handleRemoveModifier(mod.id)}
                      className="text-gray-400 hover:text-red-400 transition p-1"
                      title="Remove modifier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#444] font-mono text-[10px]">
                    {Object.entries(mod.settings).map(([sKey, sVal]) => (
                      <div key={sKey} className="flex justify-between items-center">
                        <span className="text-gray-400 truncate">{sKey}:</span>
                        <span className="text-[#3d85c6] font-bold">{String(sVal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. MATERIAL / SHADER NODE EDITOR TAB */}
        {activeTab === 'material' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-gray-200 text-[11px] uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>PBR Shader Node Graph</span>
              </div>
            </div>

            {/* Material Parameters Form */}
            <div className="bg-[#181818] p-2.5 rounded-sm border border-[#333] space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Base Color:</span>
                <input
                  type="color"
                  value={material.baseColor}
                  onChange={(e) =>
                    setMaterial((prev) => ({ ...prev, baseColor: e.target.value }))
                  }
                  className="w-8 h-6 bg-transparent cursor-pointer rounded-sm border border-[#333]"
                />
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Metallic ({material.metallic}):</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={material.metallic}
                  onChange={(e) =>
                    setMaterial((prev) => ({
                      ...prev,
                      metallic: parseFloat(e.target.value)
                    }))
                  }
                  className="w-28 accent-[#3d85c6]"
                />
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Roughness ({material.roughness}):</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={material.roughness}
                  onChange={(e) =>
                    setMaterial((prev) => ({
                      ...prev,
                      roughness: parseFloat(e.target.value)
                    }))
                  }
                  className="w-28 accent-[#3d85c6]"
                />
              </div>
            </div>

            {/* Interactive Shader Node Diagram */}
            <div className="relative h-48 bg-[#181818] border border-[#333] rounded-sm p-2 overflow-hidden">
              <div className="text-[9px] text-gray-500 font-mono mb-2 uppercase">
                Node Graph Canvas (Image Texture → Principled BSDF → Output)
              </div>
              <div className="flex items-center justify-between gap-2 h-36">
                {material.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex-1 bg-[#232323] border border-[#333] rounded-sm p-2 text-[10px] font-mono shadow"
                  >
                    <div className="font-bold text-[#3d85c6] border-b border-[#2d2d2d] pb-1 mb-1 truncate">
                      {node.name}
                    </div>
                    <div className="space-y-1 text-gray-400">
                      {Object.entries(node.params).map(([pk, pv]) => (
                        <div key={pk} className="truncate">
                          {pk}: <span className="text-gray-200">{String(pv)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. 2D UV UNWRAP PREVIEW TAB */}
        {activeTab === 'uv' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-gray-200 text-[11px] uppercase tracking-wide">
                <Grid2X2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>2D UV Layout Canvas</span>
              </div>
              <button
                onClick={() => alert('UV Unwrap recalculated using LSCM algorithm!')}
                className="bg-[#3d85c6] hover:bg-[#3472ab] text-white text-[10px] px-2 py-0.5 rounded-sm font-medium transition"
              >
                Unwrap UVs
              </button>
            </div>

            {/* 2D UV Mesh Wireframe Preview Canvas */}
            <div className="aspect-square bg-[#181818] border border-[#333] rounded-sm relative overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full p-4" viewBox="0 0 100 100">
                {/* UV Grid Background Lines */}
                <pattern id="uvGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#2a2a2a" strokeWidth="0.5" />
                </pattern>
                <rect width="100" height="100" fill="url(#uvGrid)" />

                {/* UV Islands Wireframe */}
                <polygon
                  points="20,20 45,15 50,45 25,40"
                  fill="rgba(61,133,198,0.2)"
                  stroke="#3d85c6"
                  strokeWidth="0.8"
                />
                <polygon
                  points="55,20 85,18 80,55 58,50"
                  fill="rgba(16,185,129,0.15)"
                  stroke="#10b981"
                  strokeWidth="0.8"
                />
                <polygon
                  points="25,50 50,55 45,85 15,80"
                  fill="rgba(245,158,11,0.15)"
                  stroke="#f59e0b"
                  strokeWidth="0.8"
                />
                <circle cx="70" cy="70" r="15" fill="rgba(168,85,247,0.15)" stroke="#a855f7" strokeWidth="0.8" />
              </svg>

              <span className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-500 bg-[#111]/80 px-1.5 py-0.5 rounded-sm">
                4096 x 4096 PBR Tex
              </span>
            </div>
          </div>
        )}

        {/* 5. DIGITAL SCULPTING TOOLSET TAB */}
        {activeTab === 'sculpt' && (
          <div className="space-y-3">
            <div className="font-semibold text-gray-200 border-b border-[#2d2d2d] pb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
              <Paintbrush className="w-3.5 h-3.5 text-[#3d85c6]" />
              <span>Digital Sculpting Brushes</span>
            </div>

            {/* Brush Type Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { type: 'draw', label: 'Sculpt Draw' },
                { type: 'clay', label: 'Clay Strips' },
                { type: 'smooth', label: 'Smooth' },
                { type: 'flatten', label: 'Flatten' },
                { type: 'grab', label: 'Grab Move' },
                { type: 'pinch', label: 'Pinch Crease' }
              ].map((b) => (
                <button
                  key={b.type}
                  onClick={() =>
                    setSculptBrush((prev) => ({
                      ...prev,
                      type: b.type as SculptBrush['type']
                    }))
                  }
                  className={`p-1.5 rounded-sm border text-[10px] font-medium transition flex flex-col items-center gap-1 ${
                    sculptBrush.type === b.type
                      ? 'bg-[#3d85c6] border-[#3d85c6] text-white'
                      : 'bg-[#353535] border-[#444] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span>{b.label}</span>
                </button>
              ))}
            </div>

            {/* Size & Strength Controls */}
            <div className="space-y-2 bg-[#181818] p-2.5 rounded-sm border border-[#333]">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">Brush Radius ({sculptBrush.radius}px):</span>
                <input
                  type="range"
                  min="5"
                  max="150"
                  value={sculptBrush.radius}
                  onChange={(e) =>
                    setSculptBrush((prev) => ({
                      ...prev,
                      radius: parseInt(e.target.value) || 20
                    }))
                  }
                  className="w-28 accent-[#3d85c6] cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">Strength ({sculptBrush.strength.toFixed(2)}):</span>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={sculptBrush.strength}
                  onChange={(e) =>
                    setSculptBrush((prev) => ({
                      ...prev,
                      strength: parseFloat(e.target.value) || 0.5
                    }))
                  }
                  className="w-28 accent-[#3d85c6] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
