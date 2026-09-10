export interface NPCAsset {
  id: string;
  name: string;
  description: string;
  type: 'humanoid' | 'creature' | 'vehicle' | 'prop';
  personality: string[];
  thumbnail: string;
  tags: string[];
  previewImages: string[];
  modelUrl?: string;
  defaultAnimation?: string;
  stats: {
    health: number;
    speed: number;
    intelligence: number;
    combat: number;
  };
  aiConfig: {
    behaviorTree: string;
    perceptionRange: number;
    decisionInterval: number;
  };
}
