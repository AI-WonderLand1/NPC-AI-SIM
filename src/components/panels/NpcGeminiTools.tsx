import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Eye,
  Video,
  Upload,
  Zap,
  Activity,
  ShieldAlert,
  Swords,
  HeartPulse,
  Radio,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Play,
  Camera,
  Layers
} from 'lucide-react';
import { NpcStats, BehaviorTreeNode } from '../../types';

interface NpcGeminiToolsProps {
  npcStats: NpcStats;
  setNpcStats: React.Dispatch<React.SetStateAction<NpcStats>>;
  behaviorNodes: BehaviorTreeNode[];
  setBehaviorNodes: React.Dispatch<React.SetStateAction<BehaviorTreeNode[]>>;
  onTriggerEvent: (
    eventType: 'player_spotted' | 'player_lost' | 'take_damage' | 'receive_command' | 'heal' | 'stun',
    payload?: any
  ) => void;
  activeNpcEvent?: {
    name: string;
    type: 'spot' | 'damage' | 'command' | 'heal' | 'stun';
    timestamp: number;
  } | null;
}

export const NpcGeminiTools: React.FC<NpcGeminiToolsProps> = ({
  npcStats,
  setNpcStats,
  behaviorNodes,
  setBehaviorNodes,
  onTriggerEvent,
  activeNpcEvent
}) => {
  const [activeToolTab, setActiveToolTab] = useState<'intelligence' | 'vision' | 'video'>('intelligence');

  // Tool 1: Intelligence State
  const [intelPrompt, setIntelPrompt] = useState<string>('A hostile enemy is creeping up from the left flank. Evaluate reaction.');
  const [intelLoading, setIntelLoading] = useState<boolean>(false);
  const [intelResult, setIntelResult] = useState<any>(null);

  // Tool 2: Vision Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>('Identify entities in NPC vision frame and calculate threat level.');
  const [visionLoading, setVisionLoading] = useState<boolean>(false);
  const [visionResult, setVisionResult] = useState<any>(null);

  // Tool 3: Video Recon State
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState<string>('Perform tactical video surveillance analysis. Detect hostiles and security breaches.');
  const [videoLoading, setVideoLoading] = useState<boolean>(false);
  const [videoResult, setVideoResult] = useState<any>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sample SVG Image Data URLs for instant testing
  const SAMPLE_IMAGES = [
    {
      name: 'Hostile Mercenary in Camo',
      type: 'Hostile',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%231a1a24"/><circle cx="150" cy="110" r="45" fill="%23d97706"/><rect x="110" y="155" width="80" height="110" rx="10" fill="%23b45309"/><path d="M120 180 L180 180 M150 160 L150 200" stroke="%23ef4444" stroke-width="4"/><text x="150" y="280" fill="%23f59e0b" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">TARGET: HOSTILE MERCENARY</text></svg>'
    },
    {
      name: 'Friendly Recon Quadcopter',
      type: 'Friendly',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><circle cx="150" cy="150" r="50" fill="%230284c7"/><rect x="80" y="140" width="140" height="20" rx="5" fill="%2338bdf8"/><rect x="140" y="80" width="20" height="140" rx="5" fill="%2338bdf8"/><text x="150" y="280" fill="%2338bdf8" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">SQUAD DRONE: FRIENDLY</text></svg>'
    },
    {
      name: 'Medical Nanotech Cache',
      type: 'Supply',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23064e3b"/><rect x="100" y="100" width="100" height="100" rx="15" fill="%2310b981"/><path d="M150 120 L150 180 M120 150 L180 150" stroke="%23ffffff" stroke-width="12" stroke-linecap="round"/><text x="150" y="280" fill="%2334d399" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">SUPPLY: MEDICAL KIT</text></svg>'
    }
  ];

  // Helper to apply AI recommendation directly into Behavior Tree & NPC state
  const applyAiReaction = (action: string, commandName?: string, aiMode?: string) => {
    if (!action) return;

    // Trigger behavior tree event
    if (
      action === 'player_spotted' ||
      action === 'player_lost' ||
      action === 'take_damage' ||
      action === 'receive_command' ||
      action === 'heal' ||
      action === 'stun'
    ) {
      onTriggerEvent(action, commandName || action);
    } else {
      onTriggerEvent('receive_command', commandName || action);
    }

    // Update AI Mode if provided
    if (aiMode && ['Aggressive', 'Patrol', 'Guard', 'Passive'].includes(aiMode)) {
      setNpcStats((prev) => ({ ...prev, aiMode: aiMode as any }));
    }
  };

  // Run Tool 1: Intelligence API Call
  const handleRunIntelligence = async () => {
    setIntelLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/npc-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: intelPrompt,
          npcStats,
          behaviorNodes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gemini Intelligence query failed');
      }

      setIntelResult(data);
      if (data.action) {
        applyAiReaction(data.action, data.commandName, data.updatedAiMode);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to query Gemini Intelligence API');
      // Fallback local logic if key missing
      onTriggerEvent('player_spotted', 'AI Intelligence Trigger');
    } finally {
      setIntelLoading(false);
    }
  };

  // Run Tool 2: Vision Image API Call
  const handleRunVision = async () => {
    if (!selectedImage) {
      setErrorMessage('Please select or upload an image first.');
      return;
    }

    setVisionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/npc-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/png',
          prompt: imagePrompt,
          npcStats
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gemini Vision analysis failed');
      }

      setVisionResult(data);
      if (data.triggeredEvent) {
        applyAiReaction(data.triggeredEvent, data.suggestedAction, data.targetType === 'Hostile' ? 'Aggressive' : 'Patrol');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to process image with Gemini Vision');
      // Fallback
      onTriggerEvent('player_spotted', 'Vision Target Detected');
    } finally {
      setVisionLoading(false);
    }
  };

  // Run Tool 3: Video Analysis API Call
  const handleRunVideo = async () => {
    if (!selectedVideo) {
      setErrorMessage('Please select or upload a video clip first.');
      return;
    }

    setVideoLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/npc-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoBase64: selectedVideo,
          mimeType: 'video/mp4',
          prompt: videoPrompt,
          npcStats
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gemini Video analysis failed');
      }

      setVideoResult(data);
      if (data.behaviorTreeAction) {
        applyAiReaction(data.behaviorTreeAction, data.tacticalCommand, data.threatLevel > 50 ? 'Aggressive' : 'Guard');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to process video with Gemini Pro');
      onTriggerEvent('player_spotted', 'Surveillance Motion Detected');
    } finally {
      setVideoLoading(false);
    }
  };

  // File Upload Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedVideo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3 font-mono text-[11px] text-gray-300">
      {/* Header & Tool Selector Tabs */}
      <div className="bg-[#1e1e24] border border-[#383842] p-2.5 rounded-sm space-y-2">
        <div className="flex items-center justify-between border-b border-[#2d2d38] pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="font-bold text-gray-100 text-xs uppercase tracking-wider">
              Gemini AI Tools for NPC Engine
            </span>
          </div>
          <span className="text-[9px] bg-purple-950/80 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-sm font-bold flex items-center gap-1">
            <Bot className="w-3 h-3 text-purple-400" />
            <span>@google/genai Powered</span>
          </span>
        </div>

        {/* Tool Sub-Tabs */}
        <div className="grid grid-cols-3 gap-1.5 font-semibold text-[10px]">
          <button
            onClick={() => setActiveToolTab('intelligence')}
            className={`p-2 rounded-sm border flex items-center justify-center gap-1.5 transition ${
              activeToolTab === 'intelligence'
                ? 'bg-purple-900/40 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                : 'bg-[#141418] border-[#2e2e38] text-gray-400 hover:bg-[#252530] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>1. AI Intelligence</span>
          </button>

          <button
            onClick={() => setActiveToolTab('vision')}
            className={`p-2 rounded-sm border flex items-center justify-center gap-1.5 transition ${
              activeToolTab === 'vision'
                ? 'bg-cyan-900/40 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500'
                : 'bg-[#141418] border-[#2e2e38] text-gray-400 hover:bg-[#252530] hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. Vision / Images</span>
          </button>

          <button
            onClick={() => setActiveToolTab('video')}
            className={`p-2 rounded-sm border flex items-center justify-center gap-1.5 transition ${
              activeToolTab === 'video'
                ? 'bg-rose-900/40 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                : 'bg-[#141418] border-[#2e2e38] text-gray-400 hover:bg-[#252530] hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span>3. Video Recon</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-2 bg-rose-950/80 border border-rose-500/50 text-rose-200 rounded-sm text-[10px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* TOOL 1: GEMINI INTELLIGENCE & COMMAND ENGINE */}
      {activeToolTab === 'intelligence' && (
        <div className="bg-[#18181c] border border-[#2e2e38] p-3 rounded-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#252530] pb-2">
            <div>
              <h4 className="font-bold text-gray-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Tactical AI Reasoning & Dialogue Engine</span>
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Pass natural language scenarios, dialogue, or tactics to Gemini (gemini-3.6-flash). It parses intent and automatically executes behavior tree actions.
              </p>
            </div>
            <span className="text-[9px] bg-amber-950/60 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-sm">
              Model: gemini-3.6-flash
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1">
            <label className="text-[9px] text-gray-400 uppercase font-bold">Quick Scenario Presets:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setIntelPrompt('Hostile sniper spotted on the northern ridge tower!')}
                className="p-1.5 bg-[#22222a] hover:bg-[#2c2c38] border border-[#383848] rounded-sm text-left truncate text-gray-300 hover:text-white"
              >
                🎯 Hostile Sniper Spotted
              </button>
              <button
                onClick={() => setIntelPrompt('Heavy artillery impact! NPC takes severe damage, fall back!')}
                className="p-1.5 bg-[#22222a] hover:bg-[#2c2c38] border border-[#383848] rounded-sm text-left truncate text-gray-300 hover:text-white"
              >
                💥 Artillery Impact (-50 HP)
              </button>
              <button
                onClick={() => setIntelPrompt('Squad Leader: Secure and guard the checkpoint gate.')}
                className="p-1.5 bg-[#22222a] hover:bg-[#2c2c38] border border-[#383848] rounded-sm text-left truncate text-gray-300 hover:text-white"
              >
                🛡️ Command: Guard Post
              </button>
              <button
                onClick={() => setIntelPrompt('Field Medic deployed healing nanites! NPC fully restored.')}
                className="p-1.5 bg-[#22222a] hover:bg-[#2c2c38] border border-[#383848] rounded-sm text-left truncate text-gray-300 hover:text-white"
              >
                💚 Medic Field Restore
              </button>
            </div>
          </div>

          {/* Input Text Area */}
          <div className="space-y-1">
            <label className="text-[9px] text-gray-400 uppercase font-bold">Custom Scenario / Command Prompt:</label>
            <textarea
              value={intelPrompt}
              onChange={(e) => setIntelPrompt(e.target.value)}
              rows={3}
              className="w-full bg-[#121216] border border-[#333342] focus:border-purple-400 rounded-sm p-2 text-gray-200 font-mono text-[11px] outline-none resize-none"
              placeholder="Type what happens in the game world..."
            />
          </div>

          <button
            onClick={handleRunIntelligence}
            disabled={intelLoading}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-sm flex items-center justify-center gap-2 transition"
          >
            {intelLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Evaluating Scenario with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Execute Gemini AI Decision</span>
              </>
            )}
          </button>

          {/* Output Result Card */}
          {intelResult && (
            <div className="bg-[#121216] border border-purple-500/40 p-2.5 rounded-sm space-y-2 mt-2">
              <div className="flex items-center justify-between border-b border-[#2a2a36] pb-1">
                <span className="font-bold text-purple-300 text-[10px] uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gemini Decision Output</span>
                </span>
                <span className="text-[9px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded-sm">
                  Action: {intelResult.action}
                </span>
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="text-gray-300">
                  <span className="text-gray-500 font-bold">AI Monologue: </span>
                  <span className="italic text-gray-200">"{intelResult.aiThought}"</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#22222e] text-[9px]">
                  <div>
                    <span className="text-gray-500">Updated AI Mode:</span>{' '}
                    <span className="text-cyan-300 font-bold">{intelResult.updatedAiMode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Animation:</span>{' '}
                    <span className="text-emerald-300 font-bold">{intelResult.recommendedAnim}</span>
                  </div>
                </div>
                <div className="text-[9px] text-emerald-400 bg-emerald-950/30 p-1.5 border border-emerald-500/20 rounded-sm">
                  {intelResult.logMessage}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 2: GEMINI VISION / IMAGE SENSOR ANALYSIS */}
      {activeToolTab === 'vision' && (
        <div className="bg-[#18181c] border border-[#2e2e38] p-3 rounded-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#252530] pb-2">
            <div>
              <h4 className="font-bold text-gray-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>NPC Sight Sensor & Target Image Analysis</span>
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Analyze optical frame captures from the NPC camera sensor using Gemini Vision. Automatically classifies threat and triggers behavior tree branches.
              </p>
            </div>
            <span className="text-[9px] bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-sm">
              Model: gemini-3.6-flash
            </span>
          </div>

          {/* Sample Image Presets */}
          <div className="space-y-1">
            <label className="text-[9px] text-gray-400 uppercase font-bold">Preset Optical Camera Frames:</label>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.url)}
                  className={`p-1.5 border rounded-sm flex flex-col items-center gap-1 transition ${
                    selectedImage === img.url
                      ? 'bg-cyan-950/50 border-cyan-400 ring-1 ring-cyan-400'
                      : 'bg-[#121216] border-[#2c2c3a] hover:border-cyan-500'
                  }`}
                >
                  <img src={img.url} alt={img.name} className="w-12 h-12 rounded object-cover border border-[#333]" />
                  <span className="text-[8px] text-center font-bold truncate w-full text-gray-300">{img.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom File Upload */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#252530]">
            <label className="px-3 py-1.5 bg-[#252532] hover:bg-[#303040] border border-[#3d3d52] text-cyan-300 rounded-sm cursor-pointer flex items-center gap-1.5 text-[10px] font-bold transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Frame</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {selectedImage && (
              <span className="text-[9px] text-emerald-400 font-bold truncate">✓ Frame Loaded into Vision Buffer</span>
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-1">
            <label className="text-[9px] text-gray-400 uppercase font-bold">Vision Analysis Instruction:</label>
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="w-full bg-[#121216] border border-[#333342] focus:border-cyan-400 rounded-sm p-1.5 text-gray-200 font-mono text-[10px] outline-none"
            />
          </div>

          <button
            onClick={handleRunVision}
            disabled={visionLoading || !selectedImage}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-sm flex items-center justify-center gap-2 transition"
          >
            {visionLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing Frame with Gemini Vision...</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-cyan-200" />
                <span>Analyze Optical Frame & Trigger Behavior</span>
              </>
            )}
          </button>

          {/* Vision Output */}
          {visionResult && (
            <div className="bg-[#121216] border border-cyan-500/40 p-2.5 rounded-sm space-y-2 mt-2">
              <div className="flex items-center justify-between border-b border-[#2a2a36] pb-1">
                <span className="font-bold text-cyan-300 text-[10px] uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Optical Analysis Results</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border ${
                    visionResult.threatLevel > 50
                      ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  Threat Rating: {visionResult.threatLevel}% ({visionResult.targetType})
                </span>
              </div>

              <div className="space-y-1 text-[10px]">
                <p className="text-gray-300">{visionResult.description}</p>
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  <span className="text-gray-500 font-bold">Identified:</span>
                  {visionResult.detectedObjects?.map((obj: string, i: number) => (
                    <span key={i} className="bg-[#222230] text-cyan-300 px-1.5 py-0.5 rounded border border-[#38384c]">
                      {obj}
                    </span>
                  ))}
                </div>
                <div className="text-[9px] text-amber-300 bg-amber-950/30 p-1.5 border border-amber-500/20 rounded-sm mt-1">
                  <strong>Triggered Action:</strong> {visionResult.triggeredEvent} → {visionResult.suggestedAction}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: GEMINI VIDEO RECONNAISSANCE */}
      {activeToolTab === 'video' && (
        <div className="bg-[#18181c] border border-[#2e2e38] p-3 rounded-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#252530] pb-2">
            <div>
              <h4 className="font-bold text-gray-100 flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-400" />
                <span>Tactical Video Reconnaissance & Surveillance</span>
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Analyze video surveillance clips using Gemini Pro (gemini-3.1-pro-preview) for key movement detection, hostile tracking, and perimeter security updates.
              </p>
            </div>
            <span className="text-[9px] bg-rose-950/60 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-sm">
              Model: gemini-3.1-pro-preview
            </span>
          </div>

          {/* Preset Sample Video Clips (Data URIs) */}
          <div className="space-y-1">
            <label className="text-[9px] text-gray-400 uppercase font-bold">Select Recon Video Feed:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  setSelectedVideo(
                    'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAABtZGF0'
                  )
                }
                className={`p-2 border rounded-sm flex items-center gap-2 transition text-left ${
                  selectedVideo
                    ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                    : 'bg-[#121216] border-[#2c2c3a] hover:border-rose-500 text-gray-300'
                }`}
              >
                <Video className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[10px]">CAM-01: Perimeter Breach</div>
                  <div className="text-[8px] text-gray-500">Infiltrator movement detected</div>
                </div>
              </button>

              <label className="p-2 border border-[#38384c] hover:border-rose-500 bg-[#14141a] rounded-sm flex items-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="font-bold text-[10px] text-rose-300">Upload Video File</div>
                  <div className="text-[8px] text-gray-500">MP4 / WebM video clip</div>
                </div>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1">
            <label className="text-[9px] text-gray-400 uppercase font-bold">Video Recon Prompt:</label>
            <input
              type="text"
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              className="w-full bg-[#121216] border border-[#333342] focus:border-rose-400 rounded-sm p-1.5 text-gray-200 font-mono text-[10px] outline-none"
            />
          </div>

          <button
            onClick={handleRunVideo}
            disabled={videoLoading || !selectedVideo}
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-sm flex items-center justify-center gap-2 transition"
          >
            {videoLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Gemini Pro Analyzing Video Content...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4 text-rose-200" />
                <span>Run Gemini Pro Video Analysis</span>
              </>
            )}
          </button>

          {/* Video Output */}
          {videoResult && (
            <div className="bg-[#121216] border border-rose-500/40 p-2.5 rounded-sm space-y-2 mt-2">
              <div className="flex items-center justify-between border-b border-[#2a2a36] pb-1">
                <span className="font-bold text-rose-300 text-[10px] uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Surveillance Analysis Summary</span>
                </span>
                <span className="text-[9px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40">
                  Threat: {videoResult.threatLevel}%
                </span>
              </div>

              <div className="space-y-1 text-[10px]">
                <p className="text-gray-300">{videoResult.surveillanceSummary}</p>
                <div className="text-[9px] text-purple-300 bg-purple-950/30 p-1.5 border border-purple-500/20 rounded-sm">
                  <strong>Executed Tactical Response:</strong> {videoResult.behaviorTreeAction} ({videoResult.tacticalCommand})
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
