/**
 * MeshForge Studio - Unified 3D Production Suite Types
 */

export type AppMode = 'capture' | 'reconstruct' | 'edit' | 'npc';

export type RenderMode = 'pointcloud' | 'wireframe' | 'solid' | 'textured' | 'matcap' | 'xray';

export type GizmoMode = 'translate' | 'rotate' | 'scale' | 'none';

export interface PhotoSample {
  id: string;
  filename: string;
  url: string;
  thumbnail: string;
  qualityScore: number; // 0-100
  qualityStatus: 'good' | 'medium' | 'poor';
  sourceType?: 'photo' | 'video' | 'live';
  maskDataUrl?: string; // Painted background mask
  exif: {
    cameraModel: string;
    focalLength: string;
    aperture: string;
    iso: number;
    shutterSpeed: string;
    dimensions: string;
    gps?: { lat: number; lng: number; alt: number };
  };
  cameraPose?: {
    position: [number, number, number];
    rotation: [number, number, number];
    fov: number;
  };
}

export type PipelineNodeStatus = 'queued' | 'processing' | 'done' | 'error';

export interface PipelineNode {
  id: string;
  name: string;
  category: string;
  status: PipelineNodeStatus;
  progress: number; // 0-100
  params: Record<string, number | string | boolean>;
  position: { x: number; y: number };
  inputs: string[];
  outputs: string[];
}

export interface ModifierItem {
  id: string;
  type: 'subdivision' | 'mirror' | 'decimate' | 'bevel' | 'solidify' | 'retopo';
  name: string;
  enabled: boolean;
  settings: Record<string, number | string | boolean>;
}

export interface ShaderNode {
  id: string;
  name: string;
  type: 'texture' | 'bsdf' | 'output' | 'color_ramp' | 'normal_map';
  position: { x: number; y: number };
  params: Record<string, string | number>;
}

export interface ShaderConnection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

export interface MaterialData {
  name: string;
  baseColor: string;
  metallic: number;
  roughness: number;
  wireframe: boolean;
  nodes: ShaderNode[];
  connections: ShaderConnection[];
}

export interface SculptBrush {
  type: 'draw' | 'clay' | 'smooth' | 'flatten' | 'grab' | 'pinch';
  radius: number;
  strength: number;
  symmetryX: boolean;
  dynTopo: boolean;
}

export interface Checkpoint {
  id: string;
  timestamp: string;
  name: string;
  stage: string;
  vertexCount: number;
  faceCount: number;
  diffSummary: string;
  diffType: 'mesh' | 'texture' | 'transform' | 'rig' | 'pipeline';
  isAutoSave: boolean;
}

export interface BatchJob {
  id: string;
  projectName: string;
  imageCount: number;
  status: 'processing' | 'queued' | 'paused' | 'done' | 'failed';
  progress: number;
  gpuUsage: number;
  estimatedTime: string;
  priority: number;
}

export interface BoneNode {
  id: string;
  name: string;
  parent?: string;
  children?: BoneNode[];
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  selected?: boolean;
}

export interface BehaviorTreeNode {
  id: string;
  title: string;
  type: 'root' | 'selector' | 'sequence' | 'condition' | 'action';
  status?: 'idle' | 'active' | 'success' | 'failure';
  position: { x: number; y: number };
  params: Record<string, string | number | boolean>;
  connections: string[]; // Child node IDs
}

export interface AnimationClip {
  id: string;
  name: string;
  duration: number; // in seconds
  fps: number;
  loop: boolean;
  previewIcon?: string;
}

export interface NpcStats {
  name: string;
  faction: 'Guard' | 'Hostile' | 'Merchant' | 'Neutral';
  health: number;
  maxHealth: number;
  walkSpeed: number;
  runSpeed: number;
  aggroRange: number;
  sightAngle: number;
  dialogueId: string;
  aiMode: 'Aggressive' | 'Guard' | 'Passive' | 'Patrol';
}

export interface PluginItem {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  category: string;
}

export interface ConsoleLog {
  id: string;
  timestamp: string;
  source: 'Meshroom' | 'Blender' | 'NPC Plugin' | 'Capture' | 'System';
  type: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface ScaleCalibration {
  active: boolean;
  step: 'none' | 'pick_p1' | 'pick_p2' | 'input_dist';
  point1?: [number, number, number];
  point2?: [number, number, number];
  realDistance: number; // in meters
}
