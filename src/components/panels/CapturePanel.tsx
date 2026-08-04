import React, { useState, useEffect, useRef } from 'react';
import { PhotoSample } from '../../types';
import {
  Upload,
  Camera,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Paintbrush,
  Eye,
  Trash2,
  Plus,
  MapPin,
  Sparkles,
  Film,
  Video,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CircleDot,
  ArrowRight,
  GitBranch,
  RefreshCw,
  Compass,
  Crosshair,
  Radio,
  CheckCircle2,
  X,
  Zap,
  Maximize2
} from 'lucide-react';

interface CapturePanelProps {
  photos: PhotoSample[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoSample[]>>;
  selectedPhotoId: string | null;
  setSelectedPhotoId: (id: string | null) => void;
  onOpenMaskEditor: (photo: PhotoSample) => void;
  showCameraFrustums: boolean;
  setShowCameraFrustums: (show: boolean) => void;
  onSendToPipeline?: () => void;
  addToast?: (type: 'info' | 'success' | 'warn' | 'error', message: string, title?: string) => void;
}

export const CapturePanel: React.FC<CapturePanelProps> = ({
  photos,
  setPhotos,
  selectedPhotoId,
  setSelectedPhotoId,
  onOpenMaskEditor,
  showCameraFrustums,
  setShowCameraFrustums,
  onSendToPipeline,
  addToast
}) => {
  // Main Panel Tab: Photos | Video | Live Capture
  const [importTab, setImportTab] = useState<'photos' | 'video' | 'live'>('photos');

  // Filter Grid Tag
  const [gridFilter, setGridFilter] = useState<'all' | 'photo' | 'video' | 'live'>('all');

  // --- VIDEO TAB STATE ---
  const [videoFile, setVideoFile] = useState<{
    name: string;
    duration: number; // in seconds
    resolution: string;
    sizeMb: number;
    fps: number;
  } | null>({
    name: 'statue_photogrammetry_orbit_4k.mp4',
    duration: 45,
    resolution: '3840 x 2160',
    sizeMb: 142.8,
    fps: 60
  });

  const [extractionMode, setExtractionMode] = useState<'fps' | 'count'>('count');
  const [extractFps, setExtractFps] = useState<number>(4);
  const [extractCount, setExtractCount] = useState<number>(180);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractProgress, setExtractProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 180
  });

  // --- LIVE CAPTURE STATE ---
  const [isLiveCaptureOpen, setIsLiveCaptureOpen] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [capturedCount, setCapturedCount] = useState<number>(0);
  const [orbitCoverage, setOrbitCoverage] = useState<number>(0); // 0-100%
  const [cameraStreamActive, setCameraStreamActive] = useState<boolean>(false);

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId) || photos[0];

  // Helper to generate realistic frame placeholder data URLs
  const generateFrameSvg = (type: 'video' | 'live', index: number, total: number) => {
    const angle = Math.round((index / Math.max(1, total)) * 360);
    const color = type === 'video' ? '%233d85c6' : '%2310b981';
    const label = type === 'video' ? `VIDEO FRAME %23${index + 1}` : `LIVE CAPTURE %23${index + 1}`;
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231a1a24"/><circle cx="200" cy="150" r="75" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6,6"/><circle cx="200" cy="150" r="35" fill="${color}" opacity="0.25"/><path d="M150 150 L250 150 M200 100 L200 200" stroke="${color}" stroke-width="1.5"/><text x="200" y="245" fill="%23f1f5f9" font-family="monospace" font-size="12" text-anchor="middle" font-weight="bold">${label}</text><text x="200" y="265" fill="%2394a3b8" font-family="monospace" font-size="10" text-anchor="middle">ORBIT ANGLE: ${angle}° | 3840x2160</text></svg>`;
  };

  // --- PHOTO UPLOAD HANDLER ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);

    const newSamples: PhotoSample[] = files.map((file, idx) => {
      const url = URL.createObjectURL(file);
      const qualityScore = Math.floor(Math.random() * 35) + 65;
      return {
        id: `img_custom_${Date.now()}_${idx}`,
        filename: file.name,
        url,
        thumbnail: url,
        qualityScore,
        qualityStatus: qualityScore > 80 ? 'good' : qualityScore > 60 ? 'medium' : 'poor',
        sourceType: 'photo',
        exif: {
          cameraModel: 'Imported DSLR Camera',
          focalLength: '35.0 mm',
          aperture: 'f/2.8',
          iso: 200,
          shutterSpeed: '1/250 s',
          dimensions: '4000 x 3000'
        },
        cameraPose: {
          position: [(Math.random() - 0.5) * 4, 1.2 + Math.random() * 0.5, (Math.random() - 0.5) * 4],
          rotation: [0, Math.random() * Math.PI, 0],
          fov: 50
        }
      };
    });

    setPhotos((prev) => [...prev, ...newSamples]);
    addToast?.('success', `Imported ${files.length} photo(s) into capture set.`, 'Photos Added');
  };

  // --- VIDEO UPLOAD & DRAG DROP HANDLER ---
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile({
      name: file.name,
      duration: 38,
      resolution: '3840 x 2160',
      sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10,
      fps: 60
    });

    addToast?.('info', `Video file "${file.name}" loaded for frame extraction.`, 'Video Imported');
  };

  // --- START FRAME EXTRACTION SIMULATION ---
  const handleExtractFrames = () => {
    if (!videoFile) return;

    const totalToExtract =
      extractionMode === 'fps'
        ? Math.round(videoFile.duration * extractFps)
        : extractCount;

    setIsExtracting(true);
    setExtractProgress({ current: 0, total: totalToExtract });
    addToast?.('info', `Extracting ${totalToExtract} frames from ${videoFile.name}...`, 'Extraction Started');

    let current = 0;
    const interval = setInterval(() => {
      current += Math.ceil(totalToExtract / 15);
      if (current >= totalToExtract) {
        current = totalToExtract;
        clearInterval(interval);
        setIsExtracting(false);

        // Populate extracted frames into photos array
        const newExtractedFrames: PhotoSample[] = Array.from({ length: totalToExtract }).map((_, idx) => {
          const score = Math.floor(Math.random() * 30) + 70;
          const url = generateFrameSvg('video', idx, totalToExtract);
          return {
            id: `img_vid_${Date.now()}_${idx}`,
            filename: `frame_vid_${String(idx + 1).padStart(3, '0')}.jpg`,
            url,
            thumbnail: url,
            qualityScore: score,
            qualityStatus: score > 80 ? 'good' : score > 60 ? 'medium' : 'poor',
            sourceType: 'video',
            exif: {
              cameraModel: '4K Video Frame Extractor',
              focalLength: '24.0 mm',
              aperture: 'f/1.8',
              iso: 100,
              shutterSpeed: '1/500 s',
              dimensions: videoFile.resolution
            },
            cameraPose: {
              position: [
                Math.sin((idx / totalToExtract) * Math.PI * 2) * 2.5,
                1.2,
                Math.cos((idx / totalToExtract) * Math.PI * 2) * 2.5
              ],
              rotation: [0, (idx / totalToExtract) * Math.PI * 2, 0],
              fov: 55
            }
          };
        });

        setPhotos((prev) => [...prev, ...newExtractedFrames]);
        addToast?.(
          'success',
          `Successfully extracted ${totalToExtract} high-quality keyframes!`,
          'Extraction Complete'
        );
      } else {
        setExtractProgress({ current, total: totalToExtract });
      }
    }, 180);
  };

  // --- LIVE CAPTURE LOOP EFFECT ---
  useEffect(() => {
    let captureInterval: NodeJS.Timeout;
    if (isCapturing && !isPaused) {
      captureInterval = setInterval(() => {
        setCapturedCount((prev) => {
          const next = prev + 1;
          const newCoverage = Math.min(100, Math.round((next / 120) * 100));
          setOrbitCoverage(newCoverage);

          // Add frame to photos
          const score = Math.floor(Math.random() * 25) + 75;
          const url = generateFrameSvg('live', next, 120);
          const newFrame: PhotoSample = {
            id: `img_live_${Date.now()}_${next}`,
            filename: `live_orbit_frame_${String(next).padStart(3, '0')}.jpg`,
            url,
            thumbnail: url,
            qualityScore: score,
            qualityStatus: score > 80 ? 'good' : score > 60 ? 'medium' : 'poor',
            sourceType: 'live',
            exif: {
              cameraModel: 'Webcam Orbit Sensor 4K',
              focalLength: '28.0 mm',
              aperture: 'f/2.0',
              iso: 160,
              shutterSpeed: '1/300 s',
              dimensions: '1920 x 1080'
            },
            cameraPose: {
              position: [
                Math.sin((next / 120) * Math.PI * 2) * 2.2,
                1.0,
                Math.cos((next / 120) * Math.PI * 2) * 2.2
              ],
              rotation: [0, (next / 120) * Math.PI * 2, 0],
              fov: 60
            }
          };

          setPhotos((prevPhotos) => [...prevPhotos, newFrame]);
          return next;
        });
      }, 400);
    }
    return () => clearInterval(captureInterval);
  }, [isCapturing, isPaused]);

  // Handle Start Live Capture
  const handleStartLiveCapture = () => {
    setIsLiveCaptureOpen(true);
    setIsCapturing(true);
    setIsPaused(false);
    setCameraStreamActive(true);
    addToast?.('info', 'Webcam live capture initialized. Orbit object 360°.', 'Live Capture Started');
  };

  const handlePauseCapture = () => {
    setIsPaused(!isPaused);
    addToast?.('warn', isPaused ? 'Resumed live capture stream.' : 'Paused live capture stream.', 'Stream Toggled');
  };

  const handleStopLiveCapture = () => {
    setIsCapturing(false);
    setIsLiveCaptureOpen(false);
    addToast?.(
      'success',
      `Live capture finished. ${capturedCount} orbit frames populated into project.`,
      'Capture Saved'
    );
  };

  const handleRetakeLiveCapture = () => {
    setCapturedCount(0);
    setOrbitCoverage(0);
    setPhotos((prev) => prev.filter((p) => p.sourceType !== 'live'));
    addToast?.('info', 'Live capture reset. Cleared webcam frames.', 'Stream Reset');
  };

  // Filtered Photos List
  const filteredPhotos = photos.filter((p) => {
    if (gridFilter === 'photo') return p.sourceType === 'photo' || !p.sourceType;
    if (gridFilter === 'video') return p.sourceType === 'video';
    if (gridFilter === 'live') return p.sourceType === 'live';
    return true;
  });

  const handleRemovePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Handle Send to Pipeline
  const handleSendToPipelineClick = () => {
    if (onSendToPipeline) {
      addToast?.(
        'info',
        `Transferred ${photos.length} frames to Meshroom Pipeline. Starting SfM reconstruction...`,
        'Pipeline Triggered'
      );
      onSendToPipeline();
    }
  };

  // Estimated Frame Count preview text calculation
  const estimatedFramesText =
    extractionMode === 'fps'
      ? `~${Math.round((videoFile?.duration || 45) * extractFps)} frames will be extracted (interval: ${(
          1 / extractFps
        ).toFixed(2)}s)`
      : `~${extractCount} frames will be extracted (interval: ${(
          (videoFile?.duration || 45) / extractCount
        ).toFixed(2)}s)`;

  return (
    <div className="w-full h-full bg-[#232323] border-r border-[#111] flex flex-col select-none text-xs text-gray-300 overflow-hidden relative">
      {/* Panel Header Bar */}
      <div className="bg-[#2d2d2d] px-3 py-1.5 text-[10px] uppercase font-semibold text-gray-300 border-b border-[#111] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-[#3d85c6]" />
          <span className="tracking-wide">Capture & Import</span>
          <span className="bg-[#181818] border border-[#333] text-[#3d85c6] px-1.5 py-0.2 rounded-sm text-[9px] lowercase font-mono font-bold">
            {photos.length} frames
          </span>
        </div>

        {/* Camera Frustums Toggle */}
        <button
          onClick={() => setShowCameraFrustums(!showCameraFrustums)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] border transition ${
            showCameraFrustums
              ? 'bg-[#3d85c6] border-[#3d85c6] text-white font-medium'
              : 'border-[#333] bg-[#181818] hover:bg-[#2d2d2d] text-gray-400'
          }`}
          title="Toggle estimated camera positions in 3D viewport"
        >
          <Eye className="w-3 h-3" />
          <span>Poses ({showCameraFrustums ? 'ON' : 'OFF'})</span>
        </button>
      </div>

      {/* IMPORT METHOD TAB SWITCHER (Photos | Video | Live Capture) */}
      <div className="bg-[#1e1e24] border-b border-[#111] p-1.5 flex items-center justify-between shrink-0">
        <div className="grid grid-cols-3 gap-1 w-full text-[10px] font-bold">
          <button
            onClick={() => setImportTab('photos')}
            className={`py-1.5 rounded-sm border flex items-center justify-center gap-1.5 transition ${
              importTab === 'photos'
                ? 'bg-[#3d85c6] border-[#3d85c6] text-white'
                : 'bg-[#141418] border-[#2c2c38] text-gray-400 hover:bg-[#282834] hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>

          <button
            onClick={() => setImportTab('video')}
            className={`py-1.5 rounded-sm border flex items-center justify-center gap-1.5 transition ${
              importTab === 'video'
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-[#141418] border-[#2c2c38] text-gray-400 hover:bg-[#282834] hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>Video</span>
          </button>

          <button
            onClick={() => setImportTab('live')}
            className={`py-1.5 rounded-sm border flex items-center justify-center gap-1.5 transition ${
              importTab === 'live'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-[#141418] border-[#2c2c38] text-gray-400 hover:bg-[#282834] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Live Capture</span>
          </button>
        </div>
      </div>

      {/* BODY CONTENT BY TAB */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TAB 1: PHOTOS IMPORT */}
        {importTab === 'photos' && (
          <div className="p-2 border-b border-[#111] bg-[#181818] shrink-0">
            <label className="flex flex-col items-center justify-center p-2.5 border-2 border-dashed border-[#333] hover:border-[#3d85c6] bg-[#232323] text-gray-400 rounded-sm cursor-pointer transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 font-medium text-[11px]">
                <Upload className="w-3.5 h-3.5 text-[#3d85c6]" />
                <span>Drag & Drop Photogrammetry Images</span>
              </div>
              <p className="text-[9px] text-gray-500 mt-0.5">
                Supports JPG, PNG, TIFF with EXIF metadata.
              </p>
            </label>
          </div>
        )}

        {/* TAB 2: VIDEO IMPORT & FRAME EXTRACTION */}
        {importTab === 'video' && (
          <div className="p-2.5 border-b border-[#111] bg-[#18181c] space-y-2.5 shrink-0 overflow-y-auto max-h-[300px]">
            {/* Drag & Drop Zone */}
            <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-950/20 hover:bg-amber-950/30 text-gray-300 rounded-sm cursor-pointer transition">
              <input
                type="file"
                accept="video/mp4,video/mov,video/avi,video/mkv"
                onChange={handleVideoFileUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 font-bold text-[11px] text-amber-300">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Drop video file (MP4/MOV)</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-0.5">
                Automatically extracts sharp keyframes with EXIF estimation
              </p>
            </label>

            {/* Video File Metadata Box */}
            {videoFile && (
              <div className="bg-[#121216] border border-[#2e2e3a] p-2 rounded-sm space-y-1.5 font-mono text-[10px]">
                <div className="flex items-center justify-between border-b border-[#252530] pb-1">
                  <span className="font-bold text-gray-200 truncate max-w-[180px]">{videoFile.name}</span>
                  <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-sm">
                    {videoFile.sizeMb} MB
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] text-gray-400">
                  <div>
                    <span>Duration: </span>
                    <span className="text-amber-300 font-bold">{videoFile.duration}s</span>
                  </div>
                  <div>
                    <span>Res: </span>
                    <span className="text-gray-200 font-bold">{videoFile.resolution}</span>
                  </div>
                  <div>
                    <span>FPS: </span>
                    <span className="text-gray-200 font-bold">{videoFile.fps}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Frame Extraction Controls */}
            <div className="bg-[#141418] border border-[#2a2a36] p-2.5 rounded-sm space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-gray-200 uppercase flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span>Extraction Strategy</span>
                </span>

                {/* Extraction Mode Toggle Switch */}
                <div className="flex bg-[#22222a] p-0.5 rounded-sm border border-[#383848]">
                  <button
                    onClick={() => setExtractionMode('fps')}
                    className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold transition ${
                      extractionMode === 'fps'
                        ? 'bg-amber-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    By FPS
                  </button>
                  <button
                    onClick={() => setExtractionMode('count')}
                    className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold transition ${
                      extractionMode === 'count'
                        ? 'bg-amber-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    By Total Count
                  </button>
                </div>
              </div>

              {/* Slider Input */}
              {extractionMode === 'fps' ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-gray-400">FPS Rate:</span>
                    <span className="text-amber-400 font-bold">{extractFps} FPS</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={extractFps}
                    onChange={(e) => setExtractFps(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-gray-400">Total Frame Target:</span>
                    <span className="text-amber-400 font-bold">{extractCount} Frames</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={extractCount}
                    onChange={(e) => setExtractCount(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Estimated Preview Text */}
              <div className="text-[9px] text-gray-400 font-mono italic">
                {estimatedFramesText}
              </div>

              {/* Extract CTA Button */}
              <button
                onClick={handleExtractFrames}
                disabled={isExtracting || !videoFile}
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-sm flex items-center justify-center gap-1.5 transition text-[10px]"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Extract Frames into Grid</span>
              </button>

              {/* Progress Bar */}
              {isExtracting && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[9px] font-mono text-amber-300">
                    <span>Extracting frame {extractProgress.current}/{extractProgress.total}...</span>
                    <span>{Math.round((extractProgress.current / extractProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#121216] rounded-sm overflow-hidden border border-[#333]">
                    <div
                      className="h-full bg-amber-500 transition-all duration-200"
                      style={{ width: `${(extractProgress.current / extractProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE CAPTURE CONTROL */}
        {importTab === 'live' && (
          <div className="p-2.5 border-b border-[#111] bg-[#141a18] space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-100 flex items-center gap-1.5 text-[11px]">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>360° Webcam Orbit Capture</span>
                </h4>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  Orbit object with webcam stream for real-time photogrammetry sampling.
                </p>
              </div>
            </div>

            <button
              onClick={handleStartLiveCapture}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-sm flex items-center justify-center gap-2 transition text-[11px] shadow-lg"
            >
              <Video className="w-4 h-4" />
              <span>Start Live Orbit Capture</span>
            </button>
          </div>
        )}

        {/* THUMBNAIL GRID FILTER TAGS */}
        <div className="bg-[#181818] px-2 py-1 border-b border-[#111] flex items-center justify-between text-[9px] font-mono shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-gray-500 font-bold uppercase">Filter:</span>
            <button
              onClick={() => setGridFilter('all')}
              className={`px-1.5 py-0.2 rounded-sm transition ${
                gridFilter === 'all' ? 'bg-[#3d85c6] text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({photos.length})
            </button>
            <button
              onClick={() => setGridFilter('photo')}
              className={`px-1.5 py-0.2 rounded-sm transition ${
                gridFilter === 'photo' ? 'bg-[#3d85c6] text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Photo ({photos.filter((p) => p.sourceType === 'photo' || !p.sourceType).length})
            </button>
            <button
              onClick={() => setGridFilter('video')}
              className={`px-1.5 py-0.2 rounded-sm transition ${
                gridFilter === 'video' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Video ({photos.filter((p) => p.sourceType === 'video').length})
            </button>
            <button
              onClick={() => setGridFilter('live')}
              className={`px-1.5 py-0.2 rounded-sm transition ${
                gridFilter === 'live' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Live ({photos.filter((p) => p.sourceType === 'live').length})
            </button>
          </div>
        </div>

        {/* THUMBNAIL GRID CONTAINER */}
        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start bg-[#1a1a1a]">
          {filteredPhotos.map((photo) => {
            const isSelected = selectedPhotoId === photo.id || selectedPhoto?.id === photo.id;
            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoId(photo.id)}
                className={`group relative bg-[#232323] rounded-sm border p-1.5 cursor-pointer transition flex flex-col ${
                  isSelected
                    ? 'border-[#3d85c6] ring-1 ring-[#3d85c6] bg-[#3d85c6]/10'
                    : 'border-[#333] hover:border-gray-500'
                }`}
              >
                {/* Image Thumbnail Box */}
                <div className="relative aspect-[4/3] bg-[#111] rounded-sm overflow-hidden">
                  <img
                    src={photo.thumbnail}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />

                  {/* Mask Overlay Indicator if painted */}
                  {photo.maskDataUrl && (
                    <div className="absolute inset-0 bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                      <span className="text-[9px] bg-red-950/90 text-red-300 px-1 rounded-sm font-bold">
                        MASKED
                      </span>
                    </div>
                  )}

                  {/* Source Badge (Photo vs Video vs Live) */}
                  <div className="absolute bottom-1 left-1">
                    {photo.sourceType === 'video' ? (
                      <span className="bg-amber-950/90 text-amber-300 border border-amber-500/40 text-[8px] font-bold px-1 rounded-sm flex items-center gap-0.5">
                        <Film className="w-2.5 h-2.5" />
                        <span>VIDEO</span>
                      </span>
                    ) : photo.sourceType === 'live' ? (
                      <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[8px] font-bold px-1 rounded-sm flex items-center gap-0.5">
                        <Radio className="w-2.5 h-2.5" />
                        <span>LIVE</span>
                      </span>
                    ) : (
                      <span className="bg-blue-950/90 text-blue-300 border border-blue-500/40 text-[8px] font-bold px-1 rounded-sm flex items-center gap-0.5">
                        <Camera className="w-2.5 h-2.5" />
                        <span>PHOTO</span>
                      </span>
                    )}
                  </div>

                  {/* Quality Badge */}
                  <div
                    className={`absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 ${
                      photo.qualityStatus === 'good'
                        ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                        : photo.qualityStatus === 'medium'
                        ? 'bg-amber-950/90 text-amber-400 border border-amber-500/40'
                        : 'bg-red-950/90 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {photo.qualityStatus === 'good' && <CheckCircle className="w-2.5 h-2.5" />}
                    {photo.qualityStatus === 'medium' && <AlertTriangle className="w-2.5 h-2.5" />}
                    {photo.qualityStatus === 'poor' && <XCircle className="w-2.5 h-2.5" />}
                    <span>{photo.qualityScore}%</span>
                  </div>

                  {/* Mask Painter Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMaskEditor(photo);
                    }}
                    className="absolute bottom-1 right-1 p-1 bg-[#181818]/90 hover:bg-[#3d85c6] text-gray-300 hover:text-white rounded-sm transition shadow"
                    title="Paint Exclusion Mask"
                  >
                    <Paintbrush className="w-3 h-3" />
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemovePhoto(photo.id, e)}
                    className="absolute top-1 left-1 p-1 bg-black/70 hover:bg-red-600 text-gray-400 hover:text-white rounded-sm opacity-0 group-hover:opacity-100 transition"
                    title="Remove Frame"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Filename */}
                <div className="mt-1 flex items-center justify-between text-[10px] text-gray-300 truncate">
                  <span className="truncate font-mono">{photo.filename}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* UNIFIED SEND TO PIPELINE CTA BAR */}
        {photos.length > 0 && (
          <div className="p-2 bg-[#1b1b22] border-t border-[#111] shrink-0">
            <button
              onClick={handleSendToPipelineClick}
              className="w-full py-2 bg-gradient-to-r from-[#3d85c6] to-emerald-600 hover:from-[#3472ab] hover:to-emerald-500 text-white font-bold rounded-sm flex items-center justify-center gap-2 transition text-xs shadow-lg"
            >
              <GitBranch className="w-4 h-4 text-emerald-200" />
              <span>Send {photos.length} Frames to Pipeline</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {/* Selected Image EXIF Inspector */}
        {selectedPhoto && (
          <div className="h-40 bg-[#181818] border-t border-[#111] p-2.5 flex flex-col overflow-y-auto shrink-0 font-mono text-[10px]">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#2d2d2d]">
              <div className="flex items-center gap-1.5 font-semibold text-gray-200">
                <Info className="w-3.5 h-3.5 text-[#3d85c6]" />
                <span className="uppercase tracking-wide">EXIF Inspector</span>
              </div>
              <button
                onClick={() => onOpenMaskEditor(selectedPhoto)}
                className="flex items-center gap-1 bg-[#3d85c6] hover:bg-[#3472ab] text-white text-[9px] font-medium px-2 py-0.5 rounded-sm transition"
              >
                <Paintbrush className="w-3 h-3" />
                <span>Edit Mask</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div>
                <span className="text-gray-500">Camera:</span>{' '}
                <span className="text-gray-200">{selectedPhoto.exif.cameraModel}</span>
              </div>
              <div>
                <span className="text-gray-500">Focal Length:</span>{' '}
                <span className="text-[#3d85c6]">{selectedPhoto.exif.focalLength}</span>
              </div>
              <div>
                <span className="text-gray-500">Aperture:</span>{' '}
                <span className="text-gray-200">{selectedPhoto.exif.aperture}</span>
              </div>
              <div>
                <span className="text-gray-500">ISO Speed:</span>{' '}
                <span className="text-gray-200">{selectedPhoto.exif.iso}</span>
              </div>
              <div>
                <span className="text-gray-500">Shutter:</span>{' '}
                <span className="text-gray-200">{selectedPhoto.exif.shutterSpeed}</span>
              </div>
              <div>
                <span className="text-gray-500">Dimensions:</span>{' '}
                <span className="text-gray-200">{selectedPhoto.exif.dimensions}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WEBCAM LIVE CAPTURE PREVIEW MODAL / OVERLAY PANEL */}
      {isLiveCaptureOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e24] border border-[#383848] rounded-sm w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden font-mono text-xs text-gray-300">
            {/* Modal Header */}
            <div className="bg-[#282832] px-4 py-2 border-b border-[#383848] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-bold text-gray-100 text-sm">360° Photogrammetry Live Capture</span>
              </div>
              <button
                onClick={() => setIsLiveCaptureOpen(false)}
                className="p-1 hover:bg-[#383848] text-gray-400 hover:text-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Feed Placeholder & Circular Orbit Guide Overlay */}
            <div className="relative aspect-video bg-[#0d0d12] border-b border-[#383848] flex items-center justify-center overflow-hidden">
              {/* Simulated Feed Pattern & Crosshairs */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              {/* Scanline Animation Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-pulse pointer-events-none" />

              {/* 3D Object Silhouette Placeholder in Camera */}
              <div className="relative w-48 h-48 border border-emerald-500/30 rounded-full flex items-center justify-center">
                {/* CIRCULAR CAPTURE GUIDE OVERLAY WITH DIRECTIONAL ARROW */}
                <svg className="absolute inset-0 w-full h-full animate-spin-slow">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="12,12"
                  />
                  {/* Directional Orbit Arrow */}
                  <polygon points="96,4 104,16 88,16" fill="#10b981" />
                </svg>

                {/* Reticle Crosshair */}
                <Crosshair className="w-12 h-12 text-emerald-400 opacity-60" />

                {/* Center Object Icon */}
                <div className="absolute text-center space-y-1">
                  <Camera className="w-8 h-8 text-emerald-300 mx-auto animate-bounce" />
                  <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                    Target Subject
                  </div>
                </div>
              </div>

              {/* Top HUD Stats Overlay */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-emerald-500/40 p-2 rounded-sm space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Radio className="w-3 h-3 animate-ping" />
                  <span>WEBCAM STREAM 4K</span>
                </div>
                <div className="text-gray-300">
                  Frames Captured:{' '}
                  <span className="text-emerald-300 font-bold text-xs">{capturedCount}</span>
                </div>
              </div>

              {/* Top Right Coverage Progress Ring / Percentage */}
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-emerald-500/40 p-2 rounded-sm text-center font-bold text-xs">
                <div className="text-[9px] text-gray-400 uppercase">Orbit Coverage</div>
                <div className="text-emerald-400 text-sm font-extrabold">{orbitCoverage}%</div>
                <div className="w-20 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden border border-emerald-500/30">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${orbitCoverage}%` }}
                  />
                </div>
              </div>

              {/* Directional Guide Banner */}
              <div className="absolute bottom-3 bg-black/80 border border-emerald-500/50 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
                <Compass className="w-3.5 h-3.5 animate-spin" />
                <span>Orbit camera clockwise around object (Maintain 1m distance)</span>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-3 bg-[#181820] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePauseCapture}
                  className="px-3 py-1.5 bg-[#2a2a36] hover:bg-[#383848] text-gray-200 rounded-sm font-bold flex items-center gap-1.5 transition"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={handleRetakeLiveCapture}
                  className="px-3 py-1.5 bg-[#2a2a36] hover:bg-[#383848] text-gray-200 rounded-sm font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Retake</span>
                </button>
              </div>

              <button
                onClick={handleStopLiveCapture}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm font-bold flex items-center gap-2 transition shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Stop & Process ({capturedCount} Frames)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
