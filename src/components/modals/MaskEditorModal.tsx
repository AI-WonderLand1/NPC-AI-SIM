import React, { useRef, useState, useEffect } from 'react';
import { PhotoSample } from '../../types';
import {
  Paintbrush,
  Eraser,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Sliders
} from 'lucide-react';

interface MaskEditorModalProps {
  photo: PhotoSample | null;
  onClose: () => void;
  onSaveMask: (photoId: string, maskDataUrl: string) => void;
}

export const MaskEditorModal: React.FC<MaskEditorModalProps> = ({
  photo,
  onClose,
  onSaveMask
}) => {
  if (!photo) return null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(24);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = photo.url;
    img.onload = () => {
      canvas.width = img.width || 600;
      canvas.height = img.height || 400;

      // Draw base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // If existing mask, draw on top
      if (photo.maskDataUrl) {
        const maskImg = new Image();
        maskImg.src = photo.maskDataUrl;
        maskImg.onload = () => {
          ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
        };
      }
    };
  }, [photo]);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);

    if (isEraser) {
      // Clear mask
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // Draw red exclusion mask overlay
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.fill();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = photo.url;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  const handleAutoSegment = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simulate AI Background Cut
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.25);
    ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maskUrl = canvas.toDataURL('image/png');
    onSaveMask(photo.id, maskUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-[#1c1c20] border border-[#2e2e38] rounded-xl shadow-2xl flex flex-col overflow-hidden text-xs text-gray-300">
        {/* Header */}
        <div className="h-11 bg-[#24242a] border-b border-[#2e2e38] px-4 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2 text-gray-100 font-semibold text-sm">
            <Paintbrush className="w-4 h-4 text-red-400" />
            <span>Brush Exclusion Mask Tool: {photo.filename}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#2e2e38] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas & Controls */}
        <div className="p-4 flex flex-col items-center gap-3">
          {/* Toolbar */}
          <div className="w-full flex items-center justify-between bg-[#222226] border border-[#2e2e38] p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEraser(false)}
                className={`flex items-center gap-1 px-3 py-1 rounded font-medium transition ${
                  !isEraser ? 'bg-red-600 text-white' : 'hover:bg-[#2e2e38] text-gray-400'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Mask Brush</span>
              </button>

              <button
                onClick={() => setIsEraser(true)}
                className={`flex items-center gap-1 px-3 py-1 rounded font-medium transition ${
                  isEraser ? 'bg-blue-600 text-white' : 'hover:bg-[#2e2e38] text-gray-400'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Eraser</span>
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-[#2e2e38]">
                <span className="text-gray-400 font-mono">Size ({brushSize}px):</span>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value) || 20)}
                  className="w-24 accent-red-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSegment}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded font-medium transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Auto-Cut BG</span>
              </button>

              <button
                onClick={handleClear}
                className="flex items-center gap-1 bg-[#18181b] hover:bg-[#2e2e38] text-gray-300 px-2.5 py-1 rounded border border-[#2e2e38] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Interactive Paint Canvas */}
          <div className="relative border-2 border-[#33333b] rounded-lg overflow-hidden bg-[#121214] max-h-[50vh]">
            <canvas
              ref={canvasRef}
              onMouseDown={() => setIsDrawing(true)}
              onMouseMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
              className="cursor-crosshair max-h-[50vh] object-contain"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-[#24242a] border-t border-[#2e2e38] px-4 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 italic">
            Red overlay areas are excluded from Meshroom feature point matching.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded hover:bg-[#2e2e38] text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-1.5 rounded transition shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Mask</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
