import React, { useState } from 'react';
import { Download, X, Check, Box, FileCode, Layers } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectName
}) => {
  if (!isOpen) return null;

  const [format, setFormat] = useState<'gltf' | 'fbx' | 'obj' | 'usd'>('gltf');
  const [includeRig, setIncludeRig] = useState(true);
  const [textureRes, setTextureRes] = useState<'2k' | '4k' | '8k'>('4k');
  const [coordSystem, setCoordSystem] = useState<'y_up' | 'z_up'>('y_up');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);

      // Create downloadable file blob trigger
      const dummyContent = `# MeshForge Studio 3D Asset Export
Format: ${format.toUpperCase()}
Project: ${projectName}
Rig Included: ${includeRig}
Texture Resolution: ${textureRes}
Coordinate System: ${coordSystem.toUpperCase()}`;

      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '_')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[#1c1c20] border border-[#2e2e38] rounded-xl shadow-2xl flex flex-col overflow-hidden text-xs text-gray-300">
        {/* Header */}
        <div className="h-11 bg-[#24242a] border-b border-[#2e2e38] px-4 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2 text-gray-100 font-semibold text-sm">
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export Production 3D Asset</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#2e2e38] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Options */}
        <div className="p-4 space-y-4">
          {/* Format Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-200">
              3D File Format:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'gltf', label: 'GLTF / GLB', desc: 'Web & Realtime' },
                { id: 'fbx', label: 'FBX', desc: 'Unreal / Unity' },
                { id: 'obj', label: 'OBJ + MTL', desc: 'Universal Mesh' },
                { id: 'usd', label: 'USD / USDA', desc: 'Omniverse Pixar' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    format === f.id
                      ? 'bg-blue-600 border-blue-500 text-white font-bold'
                      : 'bg-[#222226] border-[#2e2e38] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="text-xs">{f.label}</span>
                  <span className="text-[9px] opacity-75 font-normal">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Options Grid */}
          <div className="space-y-3 bg-[#141417] p-3 rounded-lg border border-[#2e2e38] font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Include Skeleton Rig & Animations:</span>
              <input
                type="checkbox"
                checked={includeRig}
                onChange={(e) => setIncludeRig(e.target.checked)}
                className="accent-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Baked Texture Resolution:</span>
              <select
                value={textureRes}
                onChange={(e) => setTextureRes(e.target.value as any)}
                className="bg-[#222226] border border-[#33333b] text-blue-400 px-2 py-0.5 rounded outline-none"
              >
                <option value="2k">2048 x 2048 (2K)</option>
                <option value="4k">4096 x 4096 (4K Ultra)</option>
                <option value="8k">8192 x 8192 (8K Cinematic)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Coordinate Axis:</span>
              <select
                value={coordSystem}
                onChange={(e) => setCoordSystem(e.target.value as any)}
                className="bg-[#222226] border border-[#33333b] text-blue-400 px-2 py-0.5 rounded outline-none"
              >
                <option value="y_up">Y-Up (OpenGL / WebGL)</option>
                <option value="z_up">Z-Up (Blender / Unreal / CAD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-[#24242a] border-t border-[#2e2e38] px-4 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-mono">
            Estimated file size: ~24.5 MB
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded hover:bg-[#2e2e38] text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-semibold px-4 py-1.5 rounded shadow transition"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Packaging Asset...' : `Export .${format.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
