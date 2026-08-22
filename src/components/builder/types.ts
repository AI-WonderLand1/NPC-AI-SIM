export interface TreeItem {
  id: string;
  name: string;
  type: 'folder' | 'character' | 'animation' | 'behavior' | 'environment' | 'system' | 'shader';
  children?: TreeItem[];
  isOpen?: boolean;
  isSelected?: boolean;
  badge?: string;
}

export interface TransformState {
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

export interface PBRMaterial {
  id: string;
  name: string;
  shaderType: string;
  previewClass: string;
  roughness: number;
  metallic: number;
  albedoMap: string;
  normalMap: string;
}

export type PinType = 'exec' | 'bool' | 'float' | 'string' | 'vector' | 'target' | 'anim';

export interface NodePin {
  id: string;
  label: string;
  type: PinType;
  color?: string;
  defaultValue?: string | number;
}

export interface BehaviorNode {
  id: string;
  title: string;
  subTitle?: string;
  headerColor: string;
  borderColor?: string;
  x: number;
  y: number;
  width?: number;
  inputs: NodePin[];
  outputs: NodePin[];
  isActive?: boolean;
  highlight?: boolean;
  extraField?: {
    type: 'select' | 'slider' | 'badge';
    label: string;
    value: string | number;
    options?: string[];
  };
}

export interface GraphConnection {
  id: string;
  fromNodeId: string;
  fromPinId: string;
  toNodeId: string;
  toPinId: string;
  color: string;
  isActiveFlow?: boolean;
}

export interface ConsoleLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'DEBUG' | 'NEURAL' | 'WEBRTC' | 'DECISION' | 'SHADERS' | 'AUDIO' | 'SUCCESS' | 'ERROR';
  message: string;
  nodeSource?: string;
}

export type ViewportRenderMode = 'Lit' | 'Unlit' | 'Wireframe' | 'Detailed Lighting' | 'Path Tracing' | 'Shader Complexity';
export type ViewportCameraMode = 'Perspective' | 'Top' | 'Front' | 'Right';

export interface SceneSpawnedObject {
  id: string;
  name: string;
  category: 'prop' | 'foliage' | 'vehicle' | 'lighting' | 'character' | 'structure';
  icon: string;
  posX: number;
  posY: number;
  scale: number;
  rotation: number;
  color?: string;
  polyCount?: string;
}

export interface QuickActionAsset {
  id: string;
  name: string;
  category: 'prop' | 'foliage' | 'vehicle' | 'lighting' | 'structure';
  icon: string;
  polyCount: string;
  color: string;
  description: string;
  defaultScale?: number;
}

export type NpcMotionPreset = 'idle' | 'walk-in-place' | 'combat' | 'dialogue';
export type PbrChannelMode = 'Lit' | 'Albedo' | 'Normal' | 'ORM' | 'PointCloud';

export type DrawerTab = 'both' | 'assets' | 'details' | 'pipeline' | 'wondercanvas';
export type AppStudioPage = 'game' | 'movie';