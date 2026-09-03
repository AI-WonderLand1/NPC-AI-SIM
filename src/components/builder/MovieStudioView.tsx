import React, { useState } from 'react';
import {
  Clapperboard, Play, Pause, RotateCcw, Camera, Plus, ChevronLeft, ChevronRight,
  FastForward, Download, Upload
} from 'lucide-react';

interface MovieStudioViewProps {
  selectedAsset: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

interface TimelineTrack {
  id: string;
  name: string;
  type: 'animation' | 'audio' | 'camera' | 'lighting' | 'event';
  color: string;
  clips: TimelineClip[];
  visible: boolean;
  locked: boolean;
}

interface TimelineClip {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  data?: any;
}

export const MovieStudioView: React.FC<MovieStudioViewProps> = ({
  selectedAsset,
  isPlaying,
  onTogglePlay,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(300);
  const [fps, setFps] = useState(30);
  const [zoom, setZoom] = useState(1);
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'track-anim',
      name: 'Animation',
      type: 'animation',
      color: '#38bdf8',
      visible: true,
      locked: false,
      clips: [
        { id: 'clip-1', name: 'Walk Cycle', startFrame: 0, endFrame: 120 },
        { id: 'clip-2', name: 'Idle', startFrame: 120, endFrame: 300 },
      ],
    },
    {
      id: 'track-audio',
      name: 'Audio/Voice',
      type: 'audio',
      color: '#22c55e',
      visible: true,
      locked: false,
      clips: [
        { id: 'clip-a1', name: 'Dialogue_01', startFrame: 30, endFrame: 90 },
        { id: 'clip-a2', name: 'Ambient', startFrame: 0, endFrame: 300 },
      ],
    },
    {
      id: 'track-cam',
      name: 'Camera',
      type: 'camera',
      color: '#f59e0b',
      visible: true,
      locked: false,
      clips: [
        { id: 'clip-c1', name: 'Shot_A_Wide', startFrame: 0, endFrame: 60 },
        { id: 'clip-c2', name: 'Shot_B_Close', startFrame: 60, endFrame: 180 },
        { id: 'clip-c3', name: 'Shot_C_Action', startFrame: 180, endFrame: 300 },
      ],
    },
    {
      id: 'track-light',
      name: 'Lighting',
      type: 'lighting',
      color: '#fbbf24',
      visible: true,
      locked: false,
      clips: [],
    },
    {
      id: 'track-events',
      name: 'Events/Triggers',
      type: 'event',
      color: '#a855f7',
      visible: true,
      locked: false,
      clips: [
        { id: 'clip-e1', name: 'NPC_SEES_PLAYER', startFrame: 45, endFrame: 45 },
        { id: 'clip-e2', name: 'DIALOGUE_START', startFrame: 90, endFrame: 90 },
      ],
    },
  ]);

  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [showAddTrack, setShowAddTrack] = useState(false);

  const frameWidth = 8 * zoom;
  const trackHeight = 60;

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-12 bg-[--color-bg-elevated] border-b border-[--color-border-default] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clapperboard className="w-5 h-5 text-sky-400" />
            <span className="font-semibold text-white">CINEMATIC STUDIO</span>
            <span className="px-2 py-0.5 bg-sky-900/40 border border-sky-600/50 rounded text-[10px] font-mono text-sky-300">
              {selectedAsset}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-[--color-bg-input] border border-[--color-border-default] rounded px-2 py-1">
            <span className="text-zinc-400 text-xs">FPS:</span>
            <select
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value))}
              className="bg-transparent border-none text-white text-xs focus:outline-none"
            >
              <option value={24}>24</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-[--color-bg-input] border border-[--color-border-default] rounded px-2 py-1">
            <span className="text-zinc-400 text-xs">Frames:</span>
            <input
              type="number"
              value={totalFrames}
              onChange={(e) => setTotalFrames(parseInt(e.target.value))}
              className="bg-transparent border-none text-white text-xs w-16 focus:outline-none"
            />
          </div>

          <div className="w-px h-6 bg-zinc-800 mx-1" />

          <button
            onClick={() => setCurrentFrame(0)}
            title="Jump to Start"
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-zinc-400 hover:text-white" />
          </button>
          <button
            onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
            title="Previous Frame"
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400 hover:text-white" />
          </button>
          <button
            onClick={onTogglePlay}
            className={`p-2 rounded-lg transition-colors flex items-center space-x-1 ${
              isPlaying
                ? 'bg-amber-600 text-white'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            onClick={() => setCurrentFrame(Math.min(totalFrames, currentFrame + 1))}
            title="Next Frame"
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-zinc-400 hover:text-white" />
          </button>
          <button
            onClick={() => setCurrentFrame(totalFrames)}
            title="Jump to End"
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
          >
            <FastForward className="w-4 h-4 text-zinc-400 hover:text-white" />
          </button>

          <div className="w-px h-6 bg-zinc-800 mx-1" />

          <div className="flex items-center space-x-1 bg-[--color-bg-input] border border-[--color-border-default] rounded px-2 py-1">
            <span className="text-zinc-400 text-xs">Zoom:</span>
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.25"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-24 accent-sky-500"
            />
            <span className="text-white text-xs font-mono w-10">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Main Viewport + Timeline */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Viewport Preview */}
        <div className="w-[45%] border-r border-[--color-border-default] bg-[--color-bg-deep] relative">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
            <div className="text-center p-8">
              <Camera className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium">Cinematic Viewport</h3>
              <p className="text-zinc-500 mt-2">PlayCanvas rendering with camera tracking</p>
              <div className="mt-6 p-4 bg-zinc-900/50 rounded border border-zinc-800 text-xs text-zinc-400 font-mono">
                Frame: {currentFrame} / {totalFrames} @ {fps}fps
                <br />
                Time: {(currentFrame / fps).toFixed(2)}s / {(totalFrames / fps).toFixed(2)}s
              </div>
            </div>
          </div>

          {/* Playhead overlay on viewport */}
          <div
            className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none"
            style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
          >
            <div className="w-[2px] h-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="flex-1 flex flex-col bg-[--color-bg-surface] min-w-0">
          {/* Track Headers */}
          <div className="w-48 border-r border-[--color-border-default] bg-[--color-bg-elevated] flex-shrink-0 overflow-y-auto">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`h-${trackHeight} flex items-center px-3 border-b border-[--color-border-default] ${
                  track.locked ? 'opacity-50' : ''
                } ${selectedClip && tracks.flatMap(t => t.clips).some(c => c.id === selectedClip) ? 'bg-sky-950/30' : ''}`}
              >
                <div className="flex items-center space-x-2 w-full">
                  <input
                    type="checkbox"
                    checked={track.visible}
                    onChange={(e) => setTracks(t => t.map(tk => tk.id === track.id ? { ...tk, visible: e.target.checked } : tk))}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                  <input
                    type="checkbox"
                    checked={track.locked}
                    onChange={(e) => setTracks(t => t.map(tk => tk.id === track.id ? { ...tk, locked: e.target.checked } : tk))}
                    className="w-4 h-4 accent-amber-500 rounded"
                    title="Lock Track"
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: track.color }}
                  />
                  <span className="text-xs text-white font-medium truncate">{track.name}</span>
                  <span className="text-[9px] text-zinc-500 font-mono">{track.clips.length} clips</span>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowAddTrack(true)}
              className="w-full h-12 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="ml-2 text-sm">Add Track</span>
            </button>
          </div>

          {/* Timeline Canvas */}
          <div className="flex-1 relative overflow-auto bg-[--color-bg-deep]">
            <div
              className="absolute top-0 left-0 right-0 h-8 bg-zinc-900 border-b border-[--color-border-default] flex items-center px-4 z-10"
              style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left' }}
            >
              {Array.from({ length: totalFrames + 1 }, (_, i) => i % 30 === 0 && (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-[1px] bg-zinc-700"
                  style={{ left: `${i * frameWidth}px` }}
                >
                  <span className="absolute -top-5 left-0 text-[9px] text-zinc-500 font-mono whitespace-nowrap">
                    {i}s
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-8 relative" style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left top', width: `${totalFrames * frameWidth}px` }}>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`absolute left-0 right-0 h-${trackHeight} border-b border-[--color-border-default]/50 ${
                    !track.visible ? 'hidden' : ''
                  }`}
                  style={{ top: `${tracks.indexOf(track) * trackHeight}px` }}
                >
                  {/* Track background */}
                  <div className="absolute inset-0 bg-zinc-900/30" />

                  {/* Clips */}
                  {track.clips.map((clip) => (
                    <div
                      key={clip.id}
                      className="absolute h-10 rounded border-2 flex items-center justify-center px-2 cursor-pointer transition-all"
                      style={{
                        left: `${clip.startFrame * frameWidth}px`,
                        width: `${Math.max((clip.endFrame - clip.startFrame) * frameWidth, 40)}px`,
                        backgroundColor: `${track.color}30`,
                        borderColor: track.color,
                        top: '8px',
                      }}
                      onClick={(e) => { e.stopPropagation(); setSelectedClip(clip.id); }}
                    >
                      <span className="text-[10px] font-mono text-white truncate px-1">{clip.name}</span>
                    </div>
                  ))}

                  {/* Playhead on track */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-amber-400 pointer-events-none shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                    style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
                  />
                </div>
              ))}

              {/* Global playhead */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-amber-400 pointer-events-none z-20 shadow-[0_0_15px_rgba(245,158,11,1)]"
                style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
              >
                <div className="w-3 h-3 bg-amber-400 rounded-full -left-1.5 top-2" />
                <div className="w-3 h-3 bg-amber-400 rounded-full -left-1.5 bottom-2" />
              </div>
            </div>
          </div>

          {/* Bottom Transport Controls */}
          <div className="h-14 bg-[--color-bg-elevated] border-t border-[--color-border-default] flex items-center justify-between px-4">
            <div className="flex items-center space-x-4 text-zinc-400 text-sm">
              <span className="font-mono">Frame: <span className="text-white">{currentFrame}</span> / {totalFrames}</span>
              <span className="font-mono">Time: <span className="text-white">{(currentFrame / fps).toFixed(2)}s</span> / {(totalFrames / fps).toFixed(2)}s</span>
              <span className="font-mono">FPS: <span className="text-white">{fps}</span></span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-medium text-zinc-300 hover:text-white transition-colors">
                <Download className="w-3 h-3 inline mr-1" /> Export
              </button>
              <button className="px-3 py-1 bg-sky-600 hover:bg-sky-500 rounded text-xs font-medium text-white transition-colors">
                <Upload className="w-3 h-3 inline mr-1" /> Render
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};