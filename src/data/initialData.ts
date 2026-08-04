import {
  PhotoSample,
  PipelineNode,
  ModifierItem,
  MaterialData,
  Checkpoint,
  BatchJob,
  BoneNode,
  BehaviorTreeNode,
  AnimationClip,
  NpcStats,
  PluginItem,
  ConsoleLog
} from '../types';

// SVG Data URL generator for placeholder photogrammetry photo thumbnails
const createSamplePhotoUrl = (label: string, angle: number, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#1e1e24"/>
    <grid width="300" height="200" fill="none" stroke="#2e2e38" stroke-width="1"/>
    <circle cx="150" cy="100" r="60" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="6,4"/>
    <polygon points="150,50 120,130 180,130" fill="${color}" opacity="0.3"/>
    <polygon points="150,50 120,130 180,130" fill="none" stroke="${color}" stroke-width="2"/>
    <circle cx="${150 + Math.cos(angle) * 45}" cy="${100 + Math.sin(angle) * 35}" r="8" fill="#60a5fa"/>
    <text x="15" y="30" fill="#f3f4f6" font-family="monospace" font-size="12" font-weight="bold">${label}</text>
    <text x="15" y="180" fill="#9ca3af" font-family="monospace" font-size="10">FOV: 50mm | ISO 100</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_PHOTOS: PhotoSample[] = [
  {
    id: 'img_01',
    filename: 'DSC_0012_Front.JPG',
    url: createSamplePhotoUrl('Cam_01 (0° Front)', 0, '#3b82f6'),
    thumbnail: createSamplePhotoUrl('Cam_01 (0° Front)', 0, '#3b82f6'),
    qualityScore: 96,
    qualityStatus: 'good',
    exif: {
      cameraModel: 'Sony α7 IV',
      focalLength: '50.0 mm',
      aperture: 'f/8.0',
      iso: 100,
      shutterSpeed: '1/200 s',
      dimensions: '7008 x 4672',
      gps: { lat: 37.7749, lng: -122.4194, alt: 24.5 }
    },
    cameraPose: { position: [0, 1.2, 3.5], rotation: [0, 0, 0], fov: 50 }
  },
  {
    id: 'img_02',
    filename: 'DSC_0013_Right_30.JPG',
    url: createSamplePhotoUrl('Cam_02 (30° Right)', Math.PI / 6, '#3b82f6'),
    thumbnail: createSamplePhotoUrl('Cam_02 (30° Right)', Math.PI / 6, '#3b82f6'),
    qualityScore: 91,
    qualityStatus: 'good',
    exif: {
      cameraModel: 'Sony α7 IV',
      focalLength: '50.0 mm',
      aperture: 'f/8.0',
      iso: 100,
      shutterSpeed: '1/200 s',
      dimensions: '7008 x 4672',
      gps: { lat: 37.77491, lng: -122.41939, alt: 24.5 }
    },
    cameraPose: { position: [1.8, 1.2, 3.0], rotation: [0, -0.5, 0], fov: 50 }
  },
  {
    id: 'img_03',
    filename: 'DSC_0014_Right_60.JPG',
    url: createSamplePhotoUrl('Cam_03 (60° Right)', Math.PI / 3, '#3b82f6'),
    thumbnail: createSamplePhotoUrl('Cam_03 (60° Right)', Math.PI / 3, '#3b82f6'),
    qualityScore: 84,
    qualityStatus: 'good',
    exif: {
      cameraModel: 'Sony α7 IV',
      focalLength: '50.0 mm',
      aperture: 'f/8.0',
      iso: 125,
      shutterSpeed: '1/160 s',
      dimensions: '7008 x 4672'
    },
    cameraPose: { position: [3.0, 1.2, 1.8], rotation: [0, -1.0, 0], fov: 50 }
  },
  {
    id: 'img_04',
    filename: 'DSC_0015_Side_90.JPG',
    url: createSamplePhotoUrl('Cam_04 (90° Side)', Math.PI / 2, '#3b82f6'),
    thumbnail: createSamplePhotoUrl('Cam_04 (90° Side)', Math.PI / 2, '#3b82f6'),
    qualityScore: 78,
    qualityStatus: 'medium',
    exif: {
      cameraModel: 'Sony α7 IV',
      focalLength: '50.0 mm',
      aperture: 'f/7.1',
      iso: 200,
      shutterSpeed: '1/125 s',
      dimensions: '7008 x 4672'
    },
    cameraPose: { position: [3.5, 1.2, 0], rotation: [0, -Math.PI / 2, 0], fov: 50 }
  },
  {
    id: 'img_05',
    filename: 'DSC_0016_Back_180.JPG',
    url: createSamplePhotoUrl('Cam_05 (180° Rear)', Math.PI, '#eab308'),
    thumbnail: createSamplePhotoUrl('Cam_05 (180° Rear)', Math.PI, '#eab308'),
    qualityScore: 68,
    qualityStatus: 'medium',
    exif: {
      cameraModel: 'Sony α7 IV',
      focalLength: '50.0 mm',
      aperture: 'f/5.6',
      iso: 400,
      shutterSpeed: '1/100 s',
      dimensions: '7008 x 4672'
    },
    cameraPose: { position: [0, 1.2, -3.5], rotation: [0, Math.PI, 0], fov: 50 }
  },
  {
    id: 'img_06',
    filename: 'DSC_0017_Top_Angle.JPG',
    url: createSamplePhotoUrl('Cam_06 (+45° Top)', -Math.PI / 4, '#ef4444'),
    thumbnail: createSamplePhotoUrl('Cam_06 (+45° Top)', -Math.PI / 4, '#ef4444'),
    qualityScore: 42,
    qualityStatus: 'poor',
    exif: {
      cameraModel: 'Sony α7 IV',
      focalLength: '50.0 mm',
      aperture: 'f/4.0',
      iso: 800,
      shutterSpeed: '1/60 s (Blur)',
      dimensions: '7008 x 4672'
    },
    cameraPose: { position: [0, 3.2, 2.2], rotation: [-0.6, 0, 0], fov: 50 }
  }
];

export const INITIAL_PIPELINE_NODES: PipelineNode[] = [
  {
    id: 'node_ext',
    name: 'Feature Extraction',
    category: 'Photogrammetry',
    status: 'done',
    progress: 100,
    position: { x: 30, y: 40 },
    inputs: [],
    outputs: ['node_match'],
    params: { describerTypes: 'sift', describerPreset: 'normal', maxPoints: 10000, forceCpu: false }
  },
  {
    id: 'node_match',
    name: 'Feature Matching',
    category: 'Photogrammetry',
    status: 'done',
    progress: 100,
    position: { x: 230, y: 40 },
    inputs: ['node_ext'],
    outputs: ['node_sfm'],
    params: { photometricMatchingMethod: 'ANN_L2', geometricEstimator: 'acransac', distanceRatio: 0.8 }
  },
  {
    id: 'node_sfm',
    name: 'Structure from Motion',
    category: 'Photogrammetry',
    status: 'done',
    progress: 100,
    position: { x: 430, y: 40 },
    inputs: ['node_match'],
    outputs: ['node_depth'],
    params: { minPointsForTriangulation: 3, maxReprojectionError: 4.0, lockCameraPoses: false }
  },
  {
    id: 'node_depth',
    name: 'Depth Map Computation',
    category: 'Dense Reconstruction',
    status: 'processing',
    progress: 75,
    position: { x: 630, y: 40 },
    inputs: ['node_sfm'],
    outputs: ['node_mesh'],
    params: { downscale: 2, sgmMaxNMatches: 4, numSamples: 100, refineWithGpu: true }
  },
  {
    id: 'node_mesh',
    name: 'Meshing & Decimation',
    category: 'Geometry',
    status: 'queued',
    progress: 0,
    position: { x: 830, y: 40 },
    inputs: ['node_depth'],
    outputs: ['node_tex'],
    params: { maxPoints: 5000000, maxInputVertices: 500000, decimationRatio: 0.2, smoothingIterations: 3 }
  },
  {
    id: 'node_tex',
    name: 'Texturing & UV Baking',
    category: 'Texturing',
    status: 'queued',
    progress: 0,
    position: { x: 1030, y: 40 },
    inputs: ['node_mesh'],
    outputs: [],
    params: { textureSide: 4096, textureFormat: 'png', unwrapMethod: 'LSCM', padding: 8 }
  }
];

export const INITIAL_MODIFIERS: ModifierItem[] = [
  {
    id: 'mod_1',
    type: 'subdivision',
    name: 'Subdivision Surface',
    enabled: true,
    settings: { levelsViewport: 1, levelsRender: 2, algorithm: 'Catmull-Clark' }
  },
  {
    id: 'mod_2',
    type: 'decimate',
    name: 'Decimate (Quad/Tri Ratio)',
    enabled: true,
    settings: { ratio: 0.35, mode: 'Collapse', symmetry: true }
  },
  {
    id: 'mod_3',
    type: 'retopo',
    name: 'Retopology Shrinkwrap',
    enabled: false,
    settings: { offset: 0.002, wrapMethod: 'Nearest Surface Point', snapToSurface: true }
  }
];

export const INITIAL_MATERIAL: MaterialData = {
  name: 'M_KnightGuard_PBR',
  baseColor: '#8a92a6',
  metallic: 0.85,
  roughness: 0.3,
  wireframe: false,
  nodes: [
    { id: 's_tex', name: 'Albedo Texture Map', type: 'texture', position: { x: 40, y: 50 }, params: { image: 'Baked_Diffuse_4K.png' } },
    { id: 's_norm', name: 'Normal Map', type: 'normal_map', position: { x: 40, y: 220 }, params: { strength: 1.2 } },
    { id: 's_bsdf', name: 'Principled BSDF', type: 'bsdf', position: { x: 280, y: 100 }, params: { BaseColor: '#8a92a6', Metallic: 0.85, Roughness: 0.3 } },
    { id: 's_out', name: 'Material Output', type: 'output', position: { x: 520, y: 120 }, params: { surface: 'BSDF' } }
  ],
  connections: [
    { id: 'c1', fromNode: 's_tex', fromPort: 'Color', toNode: 's_bsdf', toPort: 'Base Color' },
    { id: 'c2', fromNode: 's_norm', fromPort: 'Normal', toNode: 's_bsdf', toPort: 'Normal' },
    { id: 'c3', fromNode: 's_bsdf', fromPort: 'BSDF', toNode: 's_out', toPort: 'Surface' }
  ]
};

export const INITIAL_CHECKPOINTS: Checkpoint[] = [
  {
    id: 'chk_01',
    timestamp: '10:14:22',
    name: '01. Raw Photos Imported',
    stage: 'Capture',
    vertexCount: 0,
    faceCount: 0,
    diffSummary: '6 photos loaded, EXIF extracted',
    diffType: 'pipeline',
    isAutoSave: true
  },
  {
    id: 'chk_02',
    timestamp: '10:18:05',
    name: '02. Structure from Motion Solved',
    stage: 'Reconstruct',
    vertexCount: 14250,
    faceCount: 0,
    diffSummary: 'Sparse Point Cloud generated (14.2k pts)',
    diffType: 'mesh',
    isAutoSave: true
  },
  {
    id: 'chk_03',
    timestamp: '10:25:40',
    name: '03. Dense Mesh & Texture Baked',
    stage: 'Reconstruct',
    vertexCount: 128400,
    faceCount: 254800,
    diffSummary: 'High-poly mesh + 4K PBR Albedo baked',
    diffType: 'texture',
    isAutoSave: false
  },
  {
    id: 'chk_04',
    timestamp: '10:32:11',
    name: '04. Decimated & Retopologized',
    stage: 'Edit',
    vertexCount: 18500,
    faceCount: 36000,
    diffSummary: 'Decimated to 18.5k Verts (-85% polycount)',
    diffType: 'mesh',
    isAutoSave: true
  },
  {
    id: 'chk_05',
    timestamp: '10:41:00',
    name: '05. Humanoid Rig & Behavior Tree',
    stage: 'NPC',
    vertexCount: 18500,
    faceCount: 36000,
    diffSummary: '24 Bones added + Patrol/Attack AI attached',
    diffType: 'rig',
    isAutoSave: false
  }
];

export const INITIAL_BATCH_JOBS: BatchJob[] = [
  {
    id: 'job_01',
    projectName: 'Knight_Guard_Statue_Scan',
    imageCount: 36,
    status: 'processing',
    progress: 68,
    gpuUsage: 88,
    estimatedTime: '02m 15s',
    priority: 1
  },
  {
    id: 'job_02',
    projectName: 'Cyberpunk_Prop_Shield',
    imageCount: 24,
    status: 'queued',
    progress: 0,
    gpuUsage: 0,
    estimatedTime: '04m 30s',
    priority: 2
  },
  {
    id: 'job_03',
    projectName: 'Gargoyle_Architectural_Detail',
    imageCount: 52,
    status: 'paused',
    progress: 35,
    gpuUsage: 0,
    estimatedTime: '08m 10s',
    priority: 3
  }
];

export const INITIAL_SKELETON: BoneNode = {
  id: 'bone_hips',
  name: 'Hips (Root)',
  position: [0, 1.0, 0],
  rotation: [0, 0, 0],
  length: 0.2,
  children: [
    {
      id: 'bone_spine',
      name: 'Spine',
      position: [0, 1.25, 0],
      rotation: [0, 0, 0],
      length: 0.25,
      children: [
        {
          id: 'bone_chest',
          name: 'Chest',
          position: [0, 1.5, 0],
          rotation: [0, 0, 0],
          length: 0.2,
          children: [
            {
              id: 'bone_neck',
              name: 'Neck & Head',
              position: [0, 1.75, 0],
              rotation: [0, 0, 0],
              length: 0.2
            },
            {
              id: 'bone_shoulder_l',
              name: 'Shoulder.L',
              position: [0.25, 1.6, 0],
              rotation: [0, 0, -0.2],
              length: 0.35,
              children: [
                {
                  id: 'bone_arm_l',
                  name: 'Forearm.L & Hand',
                  position: [0.55, 1.35, 0],
                  rotation: [0, 0, -0.4],
                  length: 0.35
                }
              ]
            },
            {
              id: 'bone_shoulder_r',
              name: 'Shoulder.R (Sword Arm)',
              position: [-0.25, 1.6, 0],
              rotation: [0, 0, 0.2],
              length: 0.35,
              children: [
                {
                  id: 'bone_arm_r',
                  name: 'Forearm.R & Sword',
                  position: [-0.55, 1.35, 0.2],
                  rotation: [0.3, 0, 0.4],
                  length: 0.35
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'bone_leg_l',
      name: 'Thigh.L & Foot',
      position: [0.18, 0.55, 0],
      rotation: [0, 0, 0],
      length: 0.55
    },
    {
      id: 'bone_leg_r',
      name: 'Thigh.R & Foot',
      position: [-0.18, 0.55, 0],
      rotation: [0, 0, 0],
      length: 0.55
    }
  ]
};

export const INITIAL_BEHAVIOR_NODES: BehaviorTreeNode[] = [
  {
    id: 'btn_root',
    title: 'NPC Brain Root',
    type: 'root',
    status: 'active',
    position: { x: 30, y: 120 },
    params: { tickRate: '60 Hz', fallback: 'Idle' },
    connections: ['btn_sel_1']
  },
  {
    id: 'btn_sel_1',
    title: 'Priority Selector',
    type: 'selector',
    status: 'active',
    position: { x: 220, y: 120 },
    params: { strategy: 'First Passing' },
    connections: ['btn_seq_attack', 'btn_seq_patrol']
  },
  {
    id: 'btn_seq_attack',
    title: 'Combat Sequence',
    type: 'sequence',
    status: 'idle',
    position: { x: 440, y: 50 },
    params: { interruptible: true },
    connections: ['btn_cond_player', 'btn_act_chase', 'btn_act_attack']
  },
  {
    id: 'btn_cond_player',
    title: 'Detect Player In Range?',
    type: 'condition',
    status: 'idle',
    position: { x: 670, y: 20 },
    params: { detectionRadius: 10.0, sightAngle: 120, lineOfSight: true },
    connections: []
  },
  {
    id: 'btn_act_chase',
    title: 'Chase Target',
    type: 'action',
    status: 'idle',
    position: { x: 670, y: 100 },
    params: { moveSpeed: 4.5, turnRate: 180, stopDistance: 1.8 },
    connections: []
  },
  {
    id: 'btn_act_attack',
    title: 'Melee Sword Attack',
    type: 'action',
    status: 'idle',
    position: { x: 670, y: 180 },
    params: { damage: 25, cooldown: 1.5, animation: 'Sword_Attack_01' },
    connections: []
  },
  {
    id: 'btn_seq_patrol',
    title: 'Patrol Sequence',
    type: 'sequence',
    status: 'active',
    position: { x: 440, y: 260 },
    params: { loopWaypoints: true },
    connections: ['btn_act_patrol', 'btn_act_idle']
  },
  {
    id: 'btn_act_patrol',
    title: 'Patrol Waypoints',
    type: 'action',
    status: 'active',
    position: { x: 670, y: 260 },
    params: { walkSpeed: 1.8, waitAtWaypoint: 2.5 },
    connections: []
  },
  {
    id: 'btn_act_idle',
    title: 'Idle Breathe',
    type: 'action',
    status: 'idle',
    position: { x: 670, y: 340 },
    params: { playSound: 'heavy_armor_breathe.wav' },
    connections: []
  }
];

export const INITIAL_ANIMATIONS: AnimationClip[] = [
  { id: 'anim_idle', name: 'Idle_Breathe_Loop', duration: 3.2, fps: 30, loop: true },
  { id: 'anim_patrol', name: 'Patrol_Walk_Heavy', duration: 1.6, fps: 30, loop: true },
  { id: 'anim_run', name: 'Run_Chase_Aggressive', duration: 0.9, fps: 30, loop: true },
  { id: 'anim_attack_1', name: 'Sword_Slash_Combo', duration: 1.2, fps: 30, loop: false },
  { id: 'anim_shield', name: 'Shield_Block_Impact', duration: 0.8, fps: 30, loop: false },
  { id: 'anim_death', name: 'Death_Fall_Backward', duration: 2.4, fps: 30, loop: false }
];

export const INITIAL_NPC_STATS: NpcStats = {
  name: 'Ironclad Guard - Royal Sentinel',
  faction: 'Guard',
  health: 250,
  maxHealth: 250,
  walkSpeed: 1.8,
  runSpeed: 4.5,
  aggroRange: 12.0,
  sightAngle: 110,
  dialogueId: 'DLG_GUARD_SENTINEL_01',
  aiMode: 'Patrol'
};

export const INITIAL_PLUGINS: PluginItem[] = [
  {
    id: 'plugin_npc',
    name: 'NPC AI Behavior & Rigging Toolset',
    version: 'v2.4.1',
    author: 'MeshForge Core Engine',
    description: 'Behavior trees, state machines, auto-rig suggestions, and live simulation runner.',
    enabled: true,
    category: 'AI & Animation'
  },
  {
    id: 'plugin_meshroom',
    name: 'Meshroom Photogrammetry Connector',
    version: 'v1.8.0',
    author: 'AliceVision OpenSource',
    description: 'SfM, DepthMap calculation, and texture baking node graph executor.',
    enabled: true,
    category: 'Reconstruction'
  },
  {
    id: 'plugin_retopo',
    name: 'Auto-Retopo & Cage Remesher Pro',
    version: 'v3.1.2',
    author: 'Topology Labs',
    description: 'Quadrangulated low-poly mesh generation with shrinkwrap projection.',
    enabled: true,
    category: 'Modeling'
  },
  {
    id: 'plugin_omniverse',
    name: 'USD / OpenUSD Omniverse Live Sync',
    version: 'v0.9.5',
    author: 'NVIDIA Omniverse',
    description: 'Real-time multi-user USD scene graph synchronization with RTX renderer.',
    enabled: false,
    category: 'Interoperability'
  },
  {
    id: 'plugin_sdxl',
    name: 'AI PBR Texture Synthesizer (SDXL)',
    version: 'v1.2.0',
    author: 'Diffuse3D Systems',
    description: 'Prompt-based Normal/Roughness/Albedo map synthesis for UV islands.',
    enabled: false,
    category: 'Texturing'
  }
];

export const INITIAL_CONSOLE_LOGS: ConsoleLog[] = [
  { id: 'l1', timestamp: '10:07:01', source: 'System', type: 'info', message: 'MeshForge Studio 3D initialized. WebGL 2.0 active (NVIDIA GeForce RTX 4090 Direct3D11).' },
  { id: 'l2', timestamp: '10:07:02', source: 'Meshroom', type: 'info', message: 'AliceVision SfM engine v2.4.0 pipeline loaded.' },
  { id: 'l3', timestamp: '10:07:05', source: 'Meshroom', type: 'success', message: 'Feature Extraction complete. 10,000 keypoints per photo calculated.' },
  { id: 'l4', timestamp: '10:07:12', source: 'Blender', type: 'info', message: 'Mesh Decimate modifier initialized. Active polygon count: 36,000 triangles.' },
  { id: 'l5', timestamp: '10:07:18', source: 'NPC Plugin', type: 'info', message: 'Humanoid skeleton detected. 24 bone chains bound to vertex weights.' },
  { id: 'l6', timestamp: '10:07:22', source: 'NPC Plugin', type: 'success', message: 'Behavior Tree compiled. State: [Patrol Sequence -> Waypoint Walk].' }
];
