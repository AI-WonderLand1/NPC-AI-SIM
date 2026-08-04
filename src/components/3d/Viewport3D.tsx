import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import {
  RenderMode,
  GizmoMode,
  ScaleCalibration,
  PhotoSample,
  BoneNode,
  NpcStats,
  BehaviorTreeNode
} from '../../types';
import {
  Layers,
  Eye,
  Camera,
  Grid,
  Maximize2,
  Minimize2,
  Move,
  RotateCw,
  Scale as ScaleIcon,
  Ruler,
  Box,
  Circle,
  Play,
  Pause,
  RotateCcw,
  UserCheck,
  Target,
  Swords,
  ShieldAlert,
  HeartPulse,
  Radio,
  Zap,
  Bot,
  Activity,
  Sparkles
} from 'lucide-react';

interface Viewport3DProps {
  renderMode: RenderMode;
  setRenderMode: (mode: RenderMode) => void;
  gizmoMode: GizmoMode;
  setGizmoMode: (mode: GizmoMode) => void;
  showCameraFrustums: boolean;
  setShowCameraFrustums: (show: boolean) => void;
  photos: PhotoSample[];
  pointCloudType: 'sparse' | 'dense';
  meshDecimation: number; // 0.05 - 1.0
  retopoOverlay: boolean;
  scaleCalibration: ScaleCalibration;
  setScaleCalibration: React.Dispatch<React.SetStateAction<ScaleCalibration>>;
  skeleton: BoneNode;
  activeMode: string;
  npcStats: NpcStats;
  behaviorNodes: BehaviorTreeNode[];
  currentAnimFrame: number;
  isPlayingAnim: boolean;
  isSimulatingNpc: boolean;
  onSelectBone?: (boneId: string) => void;
  selectedBoneId?: string;
  wireframeColor?: string;
  onTriggerEvent?: (
    eventType: 'player_spotted' | 'player_lost' | 'take_damage' | 'receive_command' | 'heal' | 'stun',
    payload?: any
  ) => void;
  activeNpcEvent?: {
    name: string;
    type: 'spot' | 'damage' | 'command' | 'heal' | 'stun';
    timestamp: number;
  } | null;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  renderMode,
  setRenderMode,
  gizmoMode,
  setGizmoMode,
  showCameraFrustums,
  setShowCameraFrustums,
  photos,
  pointCloudType,
  meshDecimation,
  retopoOverlay,
  scaleCalibration,
  setScaleCalibration,
  skeleton,
  activeMode,
  npcStats,
  behaviorNodes,
  currentAnimFrame,
  isPlayingAnim,
  isSimulatingNpc,
  onSelectBone,
  selectedBoneId,
  onTriggerEvent,
  activeNpcEvent
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showLighting, setShowLighting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simTargetPos, setSimTargetPos] = useState<[number, number]>([3, 2]);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [cinematicDof, setCinematicDof] = useState(false);
  const [postFxEnabled, setPostFxEnabled] = useState(true);

  // Shared Orbit Control State
  const orbitRef = useRef({
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { x: 0.3, y: 0.6 },
    zoom: 5.5,
    pan: { x: 0, y: 0.9 }
  });

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer?: EffectComposer;
    ssaoPass?: SSAOPass;
    bloomPass?: UnrealBloomPass;
    fxaaPass?: ShaderPass;
    bokehPass?: BokehPass;
    pbrNormalMap?: THREE.CanvasTexture;
    pbrRoughnessMap?: THREE.CanvasTexture;
    pmremGenerator?: THREE.PMREMGenerator;
    meshGroup: THREE.Group;
    pointCloudGroup: THREE.Group;
    frustumGroup: THREE.Group;
    skeletonGroup: THREE.Group;
    retopoGroup: THREE.Group;
    gizmoGroup: THREE.Group;
    calibrationGroup: THREE.Group;
    simGroup: THREE.Group;
    orbitState: typeof orbitRef.current;
  } | null>(null);

  // NPC Sim State
  const npcSimRef = useRef({
    x: 0,
    z: 0,
    rotY: 0,
    currentWaypointIndex: 0,
    state: 'PATROL',
    waypoints: [
      [0, 0],
      [2.5, -2],
      [-2, -3],
      [-2.5, 1.5]
    ]
  });

  // Setup Three.js scene with WebGL Context safety
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;

    // First check if WebGL context can be retrieved from canvas before calling Three.js
    const isWebGLAvailable = (): boolean => {
      try {
        const canvas = document.createElement('canvas');
        const gl =
          canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl');
        if (!gl) return false;
        if ('isContextLost' in gl && typeof (gl as any).isContextLost === 'function' && (gl as any).isContextLost()) {
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    };

    if (!isWebGLAvailable()) {
      setWebglSupported(false);
      threeRef.current = null;
      return;
    }

    // Safely attempt WebGL creation while intercepting Three.js internal console errors if GL fails
    const originalConsoleError = console.error;
    let renderer: THREE.WebGLRenderer | null = null;
    let isOk = false;

    try {
      console.error = (...args: any[]) => {
        const msg = args.map(a => (typeof a === 'string' ? a : String(a))).join(' ');
        if (msg.includes('THREE.WebGLRenderer') || msg.includes('WebGL context could not be created')) {
          // Suppress internal Three.js WebGL error noise when falling back
          return;
        }
        originalConsoleError.apply(console, args);
      };

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default' });
      isOk = true;
    } catch (e1) {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: false,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: false,
          precision: 'lowp'
        });
        isOk = true;
      } catch (e2) {
        isOk = false;
      }
    } finally {
      console.error = originalConsoleError;
    }

    if (!isOk || !renderer || !renderer.domElement) {
      setWebglSupported(false);
      threeRef.current = null;
      return;
    }

    setWebglSupported(true);

    // AAA Tone Mapping & Color Space Configuration
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // Scene with dark gradient environment background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d0d14');

    // HDRI Environment Map generation via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envMap = pmremGenerator.fromScene(roomEnv).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.85;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3.5, 2.5, 4.5);
    camera.lookAt(0, 1.0, 0);

    // --- Three-Point Lighting Setup ---
    // 1. Ambient / Base Tint
    const ambientLight = new THREE.AmbientLight(0x1e1e2d, 0.5);
    scene.add(ambientLight);

    // 2. Key Light (Warm Directional Light with Soft Shadows)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    keyLight.position.set(5, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -1;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.radius = 3;
    scene.add(keyLight);

    // 3. Fill Light (Cool Directional Light)
    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.9);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    // 4. Rim Light (Backlight with intense Cyan/Purple Edge Highlights)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    rimLight.position.set(0, 7, -8);
    scene.add(rimLight);

    // --- Subtle Reflective Ground Plane & Contact Shadows ---
    const groundGeo = new THREE.PlaneGeometry(24, 24);
    const groundMat = new THREE.MeshPhysicalMaterial({
      color: 0x121218,
      roughness: 0.22,
      metalness: 0.85,
      clearcoat: 0.3,
      clearcoatRoughness: 0.1,
      reflectivity: 0.8,
      envMapIntensity: 1.0
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Subtle Radial Grid Overlay
    const gridHelper = new THREE.GridHelper(12, 24, 0x3d85c6, 0x222230);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    // Soft Contact Shadow Disc beneath character
    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.002, 0);
    scene.add(shadowMesh);

    // --- Procedural PBR Maps ---
    const pbrNormalMap = createPbrNormalMap();
    const pbrRoughnessMap = createPbrRoughnessMap();

    // Groups
    const meshGroup = new THREE.Group();
    const pointCloudGroup = new THREE.Group();
    const frustumGroup = new THREE.Group();
    const skeletonGroup = new THREE.Group();
    const retopoGroup = new THREE.Group();
    const gizmoGroup = new THREE.Group();
    const calibrationGroup = new THREE.Group();
    const simGroup = new THREE.Group();

    scene.add(meshGroup);
    scene.add(pointCloudGroup);
    scene.add(frustumGroup);
    scene.add(skeletonGroup);
    scene.add(retopoGroup);
    scene.add(gizmoGroup);
    scene.add(calibrationGroup);
    scene.add(simGroup);

    // Build procedural Knight/Character Mesh with PBR textures
    const mainMesh = buildCharacterMesh(meshDecimation, renderMode, pbrNormalMap, pbrRoughnessMap);
    meshGroup.add(mainMesh);

    // Build Point Clouds
    const pointCloud = buildPointCloud(pointCloudType);
    pointCloudGroup.add(pointCloud);

    // --- Post-Processing Stack (EffectComposer) ---
    const pixelRatio = renderer.getPixelRatio();
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 1. SSAO Pass (Crevice Ambient Occlusion)
    let ssaoPass: SSAOPass | undefined = undefined;
    try {
      ssaoPass = new SSAOPass(scene, camera, width, height);
      ssaoPass.kernelRadius = 0.4;
      ssaoPass.minDistance = 0.002;
      ssaoPass.maxDistance = 0.15;
      composer.addPass(ssaoPass);
    } catch (e) {
      // Graceful fallback if SSAO fails on low-power devices
    }

    // 2. Unreal Bloom Pass (Subtle bright highlights)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.35,
      0.4,
      0.82
    );
    composer.addPass(bloomPass);

    // 3. FXAA Anti-Aliasing Pass
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms['resolution'].value.set(
      1 / (width * pixelRatio),
      1 / (height * pixelRatio)
    );
    composer.addPass(fxaaPass);

    // 4. Subtle Vignette Pass
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms['offset'].value = 1.05;
    vignettePass.uniforms['darkness'].value = 1.1;
    composer.addPass(vignettePass);

    // 5. Cinematic Depth of Field (Bokeh Pass)
    const bokehPass = new BokehPass(scene, camera, {
      focus: 5.5,
      aperture: 0.00025,
      maxblur: 0.015
    });
    bokehPass.enabled = false;
    composer.addPass(bokehPass);

    // Store refs
    threeRef.current = {
      scene,
      camera,
      renderer,
      composer,
      ssaoPass,
      bloomPass,
      fxaaPass,
      bokehPass,
      pbrNormalMap,
      pbrRoughnessMap,
      pmremGenerator,
      meshGroup,
      pointCloudGroup,
      frustumGroup,
      skeletonGroup,
      retopoGroup,
      gizmoGroup,
      calibrationGroup,
      simGroup,
      orbitState: orbitRef.current
    };

    // Animation loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (threeRef.current) {
        const { camera, orbitState, renderer, scene, simGroup, composer, bokehPass } = threeRef.current;

        // Sync Depth of Field toggle
        if (bokehPass) {
          bokehPass.enabled = cinematicDof;
        }

        // Camera Orbit calculation
        const x =
          orbitState.zoom *
          Math.sin(orbitState.rotation.y) *
          Math.cos(orbitState.rotation.x);
        const y = orbitState.zoom * Math.sin(orbitState.rotation.x);
        const z =
          orbitState.zoom *
          Math.cos(orbitState.rotation.y) *
          Math.cos(orbitState.rotation.x);

        camera.position.set(
          x + orbitState.pan.x,
          Math.max(0.2, y + orbitState.pan.y),
          z
        );
        camera.lookAt(orbitState.pan.x, orbitState.pan.y, 0);

        // Animation update
        if (isPlayingAnim || isSimulatingNpc) {
          // Idle chest breathe animation
          meshGroup.position.y = Math.sin(time * 3) * 0.02;
          skeletonGroup.position.y = Math.sin(time * 3) * 0.02;

          // Gentle rotation during playback
          if (activeMode === 'npc' && !isSimulatingNpc) {
            meshGroup.rotation.y = Math.sin(time * 0.8) * 0.15;
            skeletonGroup.rotation.y = Math.sin(time * 0.8) * 0.15;
          }
        }

        // Live NPC Simulation loop
        if (isSimulatingNpc && simGroup) {
          updateNpcSimulation(delta, simGroup, npcSimRef.current, simTargetPos, npcStats);
        }

        if (postFxEnabled && composer) {
          composer.render();
        } else {
          renderer.render(scene, camera);
        }
      }
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !threeRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      const pixelRatio = threeRef.current.renderer.getPixelRatio();

      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);

      if (threeRef.current.composer) {
        threeRef.current.composer.setSize(w, h);
      }
      if (threeRef.current.fxaaPass) {
        threeRef.current.fxaaPass.uniforms['resolution'].value.set(
          1 / (w * pixelRatio),
          1 / (h * pixelRatio)
        );
      }
      if (threeRef.current.ssaoPass) {
        threeRef.current.ssaoPass.setSize(w, h);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (pmremGenerator) pmremGenerator.dispose();
      if (renderer) renderer.dispose();
      threeRef.current = null;
    };
  }, []);

  // Update mesh geometry / material on renderMode / decimation change
  useEffect(() => {
    if (!threeRef.current) return;
    const { meshGroup, pointCloudGroup, pbrNormalMap, pbrRoughnessMap } = threeRef.current;

    // Clear existing
    while (meshGroup.children.length > 0) {
      meshGroup.remove(meshGroup.children[0]);
    }
    while (pointCloudGroup.children.length > 0) {
      pointCloudGroup.remove(pointCloudGroup.children[0]);
    }

    if (renderMode === 'pointcloud') {
      const pc = buildPointCloud(pointCloudType);
      pointCloudGroup.add(pc);
    } else {
      const mesh = buildCharacterMesh(meshDecimation, renderMode, pbrNormalMap, pbrRoughnessMap);
      meshGroup.add(mesh);
    }
  }, [renderMode, meshDecimation, pointCloudType]);

  // Update Camera Frustums
  useEffect(() => {
    if (!threeRef.current) return;
    const { frustumGroup } = threeRef.current;

    while (frustumGroup.children.length > 0) {
      frustumGroup.remove(frustumGroup.children[0]);
    }

    if (showCameraFrustums) {
      photos.forEach((photo) => {
        if (photo.cameraPose) {
          const frustumMesh = createCameraFrustum(
            photo.cameraPose.position,
            photo.cameraPose.rotation,
            photo.filename
          );
          frustumGroup.add(frustumMesh);
        }
      });
    }
  }, [showCameraFrustums, photos]);

  // Update Skeleton / Rig Visualization
  useEffect(() => {
    if (!threeRef.current) return;
    const { skeletonGroup } = threeRef.current;

    while (skeletonGroup.children.length > 0) {
      skeletonGroup.remove(skeletonGroup.children[0]);
    }

    if (activeMode === 'npc' || activeMode === 'edit') {
      const skelObj = buildSkeletonObject(skeleton, selectedBoneId);
      skeletonGroup.add(skelObj);
    }
  }, [skeleton, activeMode, selectedBoneId]);

  // Update Retopology Overlay
  useEffect(() => {
    if (!threeRef.current) return;
    const { retopoGroup } = threeRef.current;

    while (retopoGroup.children.length > 0) {
      retopoGroup.remove(retopoGroup.children[0]);
    }

    if (retopoOverlay) {
      const retopoMesh = buildRetopoCageMesh();
      retopoGroup.add(retopoMesh);
    }
  }, [retopoOverlay]);

  // Update Scale Calibration Drawing
  useEffect(() => {
    if (!threeRef.current) return;
    const { calibrationGroup } = threeRef.current;

    while (calibrationGroup.children.length > 0) {
      calibrationGroup.remove(calibrationGroup.children[0]);
    }

    if (scaleCalibration.point1 && scaleCalibration.point2) {
      const lineMesh = createCalibrationLine(
        scaleCalibration.point1,
        scaleCalibration.point2,
        scaleCalibration.realDistance
      );
      calibrationGroup.add(lineMesh);
    }
  }, [scaleCalibration]);

  // Update Transform Gizmo
  useEffect(() => {
    if (!threeRef.current) return;
    const { gizmoGroup } = threeRef.current;

    while (gizmoGroup.children.length > 0) {
      gizmoGroup.remove(gizmoGroup.children[0]);
    }

    if (gizmoMode !== 'none') {
      const gizmo = createTransformGizmo(gizmoMode);
      gizmoGroup.add(gizmo);
    }
  }, [gizmoMode]);

  // 2D Canvas Fallback Viewport (Runs when WebGL context creation is unavailable)
  useEffect(() => {
    if (webglSupported || !mountRef.current) return;

    const mount = mountRef.current;
    const canvas = document.createElement('canvas');
    canvas.className = 'w-full h-full block';
    mount.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render2DFallback = () => {
      animId = requestAnimationFrame(render2DFallback);
      const width = mount.clientWidth || 800;
      const height = mount.clientHeight || 600;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const time = performance.now() / 1000;
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#181818';
      ctx.fillRect(0, 0, width, height);

      const orbit = orbitRef.current;

      // 3D -> 2D Isometric Projection
      const project = (x: number, y: number, z: number): [number, number] => {
        const rx = orbit.rotation.x;
        const ry = orbit.rotation.y;

        const x1 = x * Math.cos(ry) - z * Math.sin(ry);
        const z1 = x * Math.sin(ry) + z * Math.cos(ry);
        const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);

        const scale = (Math.min(width, height) / 6) * (5.5 / orbit.zoom);
        const screenX = width / 2 + (x1 + orbit.pan.x) * scale;
        const screenY = height / 2 - (y2 + orbit.pan.y - 0.6) * scale;

        return [screenX, screenY];
      };

      // Ground Grid
      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 1;
      for (let i = -5; i <= 5; i++) {
        const p1 = project(i, 0, -5);
        const p2 = project(i, 0, 5);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        const p3 = project(-5, 0, i);
        const p4 = project(5, 0, i);
        ctx.beginPath();
        ctx.moveTo(p3[0], p3[1]);
        ctx.lineTo(p4[0], p4[1]);
        ctx.stroke();
      }

      // Character Model
      const bounceY = (isPlayingAnim || isSimulatingNpc) ? Math.sin(time * 3) * 0.03 : 0;
      const modelY = 0.6 + bounceY;

      // Head
      const headCenter = project(0, modelY + 0.65, 0);
      const headRadius = Math.max(6, 22 * (5.5 / orbit.zoom));

      ctx.fillStyle = renderMode === 'wireframe' ? 'transparent' : '#818cf8';
      ctx.strokeStyle = '#3d85c6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(headCenter[0], headCenter[1], headRadius, 0, Math.PI * 2);
      if (renderMode !== 'wireframe') ctx.fill();
      ctx.stroke();

      // Body Torso
      const shoulderL = project(0.35, modelY + 0.55, 0);
      const shoulderR = project(-0.35, modelY + 0.55, 0);
      const hipL = project(0.2, modelY, 0);
      const hipR = project(-0.2, modelY, 0);

      ctx.fillStyle = renderMode === 'wireframe' ? 'transparent' : '#475569';
      ctx.beginPath();
      ctx.moveTo(shoulderL[0], shoulderL[1]);
      ctx.lineTo(shoulderR[0], shoulderR[1]);
      ctx.lineTo(hipR[0], hipR[1]);
      ctx.lineTo(hipL[0], hipL[1]);
      ctx.closePath();
      if (renderMode !== 'wireframe') ctx.fill();
      ctx.stroke();

      // Sword
      const swordTip = project(0.5, modelY + 0.8, 0.2);
      const swordHilt = project(0.5, modelY + 0.1, 0.2);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(swordHilt[0], swordHilt[1]);
      ctx.lineTo(swordTip[0], swordTip[1]);
      ctx.stroke();

      // Skeleton Bones
      if (activeMode === 'npc' || activeMode === 'edit') {
        const drawBone = (bone: BoneNode, parentPos?: [number, number, number]) => {
          const bp = project(bone.position[0], bone.position[1], bone.position[2]);
          if (parentPos) {
            const pp = project(parentPos[0], parentPos[1], parentPos[2]);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pp[0], pp[1]);
            ctx.lineTo(bp[0], bp[1]);
            ctx.stroke();
          }
          ctx.fillStyle = bone.id === selectedBoneId ? '#ef4444' : '#06b6d4';
          ctx.beginPath();
          ctx.arc(bp[0], bp[1], 4, 0, Math.PI * 2);
          ctx.fill();

          if (bone.children) {
            bone.children.forEach(c => drawBone(c, bone.position));
          }
        };
        drawBone(skeleton);
      }

      // Camera Frustums
      if (showCameraFrustums) {
        photos.forEach(photo => {
          if (photo.cameraPose) {
            const cp = project(photo.cameraPose.position[0], photo.cameraPose.position[1], photo.cameraPose.position[2]);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(cp[0], cp[1], 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '9px monospace';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(photo.filename, cp[0] + 8, cp[1] + 3);
          }
        });
      }

      // Scale calibration
      if (scaleCalibration.point1 && scaleCalibration.point2) {
        const p1 = project(scaleCalibration.point1[0], scaleCalibration.point1[1], scaleCalibration.point1[2]);
        const p2 = project(scaleCalibration.point2[0], scaleCalibration.point2[1], scaleCalibration.point2[2]);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#10b981';
        ctx.font = '10px monospace';
        ctx.fillText(`${scaleCalibration.realDistance}m`, (p1[0] + p2[0]) / 2 + 5, (p1[1] + p2[1]) / 2 - 5);
      }

      // NPC Sim
      if (isSimulatingNpc) {
        const simDx = Math.sin(time * 1.2) * 1.5;
        const simDz = Math.cos(time * 1.2) * 1.5;
        const npcPos = project(simDx, 0, simDz);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(npcPos[0], npcPos[1], 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '10px monospace';
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText(npcStats.name, npcPos[0] - 15, npcPos[1] - 10);
      }
    };

    render2DFallback();

    return () => {
      cancelAnimationFrame(animId);
      if (mount.contains(canvas)) {
        mount.removeChild(canvas);
      }
    };
  }, [webglSupported, renderMode, pointCloudType, showCameraFrustums, photos, skeleton, activeMode, selectedBoneId, scaleCalibration, isPlayingAnim, isSimulatingNpc, npcStats]);

  // Mouse Interaction Logic (Orbit, Pan, Zoom, Scale Calibration pick)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Calibration Point Pick
    if (scaleCalibration.active) {
      const rect = mountRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (scaleCalibration.step === 'pick_p1') {
          setScaleCalibration((prev) => ({
            ...prev,
            step: 'pick_p2',
            point1: [mouseX * 1.2, 1.2, mouseY * 1.2]
          }));
        } else if (scaleCalibration.step === 'pick_p2') {
          setScaleCalibration((prev) => ({
            ...prev,
            step: 'input_dist',
            point2: [mouseX * 1.2 + 0.8, 1.2, mouseY * 1.2 - 0.5]
          }));
        }
      }
      return;
    }

    // NPC Target Placement
    if (isSimulatingNpc && e.shiftKey) {
      const rect = mountRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = ((e.clientX - rect.left) / rect.width) * 4;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 4;
        setSimTargetPos([mouseX, mouseY]);
      }
      return;
    }

    orbitRef.current.isDragging = true;
    orbitRef.current.previousMousePosition = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!orbitRef.current.isDragging) return;

    const deltaX = e.clientX - orbitRef.current.previousMousePosition.x;
    const deltaY = e.clientY - orbitRef.current.previousMousePosition.y;

    if (e.buttons === 2 || e.shiftKey) {
      // Pan
      orbitRef.current.pan.x -= deltaX * 0.005;
      orbitRef.current.pan.y += deltaY * 0.005;
    } else {
      // Rotate
      orbitRef.current.rotation.y += deltaX * 0.008;
      orbitRef.current.rotation.x = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(
          Math.PI / 2 - 0.1,
          orbitRef.current.rotation.x + deltaY * 0.008
        )
      );
    }

    orbitRef.current.previousMousePosition = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleMouseUp = () => {
    orbitRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    orbitRef.current.zoom = Math.max(
      1.5,
      Math.min(15.0, orbitRef.current.zoom + e.deltaY * 0.005)
    );
  };

  return (
    <div
      className={`relative w-full h-full bg-[#181818] overflow-hidden select-none flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Viewport Top Bar / Overlay Toolbar */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        {/* Render Modes Bar */}
        <div className="pointer-events-auto flex items-center bg-[#232323]/95 backdrop-blur border border-[#333] rounded-sm p-1 gap-1 text-[11px] text-gray-300">
          <button
            onClick={() => setRenderMode('pointcloud')}
            className={`px-2 py-0.5 rounded-sm flex items-center gap-1 transition ${
              renderMode === 'pointcloud'
                ? 'bg-[#3d85c6] text-white font-medium'
                : 'hover:bg-[#353535]'
            }`}
            title="Point Cloud Mode"
          >
            <Circle className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Point Cloud</span>
          </button>
          <button
            onClick={() => setRenderMode('wireframe')}
            className={`px-2 py-0.5 rounded-sm flex items-center gap-1 transition ${
              renderMode === 'wireframe'
                ? 'bg-[#3d85c6] text-white font-medium'
                : 'hover:bg-[#353535]'
            }`}
            title="Wireframe Mode"
          >
            <Grid className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Wireframe</span>
          </button>
          <button
            onClick={() => setRenderMode('solid')}
            className={`px-2 py-0.5 rounded-sm flex items-center gap-1 transition ${
              renderMode === 'solid'
                ? 'bg-[#3d85c6] text-white font-medium'
                : 'hover:bg-[#353535]'
            }`}
            title="Solid Flat Shaded"
          >
            <Box className="w-3.5 h-3.5 text-gray-300" />
            <span className="hidden sm:inline">Solid</span>
          </button>
          <button
            onClick={() => setRenderMode('textured')}
            className={`px-2 py-0.5 rounded-sm flex items-center gap-1 transition ${
              renderMode === 'textured'
                ? 'bg-[#3d85c6] text-white font-medium'
                : 'hover:bg-[#353535]'
            }`}
            title="Textured PBR Material"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Textured</span>
          </button>
          <button
            onClick={() => setRenderMode('matcap')}
            className={`px-2 py-0.5 rounded-sm flex items-center gap-1 transition ${
              renderMode === 'matcap'
                ? 'bg-[#3d85c6] text-white font-medium'
                : 'hover:bg-[#353535]'
            }`}
            title="Sculpt Matcap Shading"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Matcap</span>
          </button>
        </div>

        {/* Gizmo & Overlay Toggles */}
        <div className="pointer-events-auto flex items-center bg-[#232323]/95 backdrop-blur border border-[#333] rounded-sm p-1 gap-1 text-[11px] text-gray-300">
          <button
            onClick={() => setGizmoMode(gizmoMode === 'translate' ? 'none' : 'translate')}
            className={`p-1 rounded-sm transition ${
              gizmoMode === 'translate' ? 'bg-[#3d85c6] text-white' : 'hover:bg-[#353535]'
            }`}
            title="Translate Gizmo (W)"
          >
            <Move className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGizmoMode(gizmoMode === 'rotate' ? 'none' : 'rotate')}
            className={`p-1 rounded-sm transition ${
              gizmoMode === 'rotate' ? 'bg-[#3d85c6] text-white' : 'hover:bg-[#353535]'
            }`}
            title="Rotate Gizmo (E)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGizmoMode(gizmoMode === 'scale' ? 'none' : 'scale')}
            className={`p-1 rounded-sm transition ${
              gizmoMode === 'scale' ? 'bg-[#3d85c6] text-white' : 'hover:bg-[#353535]'
            }`}
            title="Scale Gizmo (R)"
          >
            <ScaleIcon className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[#333] mx-0.5" />

          {/* Camera Pose Overlay Toggle */}
          <button
            onClick={() => setShowCameraFrustums(!showCameraFrustums)}
            className={`p-1 rounded-sm flex items-center gap-1 transition ${
              showCameraFrustums ? 'bg-amber-600 text-white' : 'hover:bg-[#353535]'
            }`}
            title="Toggle Estimated Camera Frustums"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Frustums</span>
          </button>

          {/* Scale Calibration Trigger */}
          <button
            onClick={() =>
              setScaleCalibration((prev) => ({
                ...prev,
                active: !prev.active,
                step: prev.active ? 'none' : 'pick_p1'
              }))
            }
            className={`p-1 rounded-sm flex items-center gap-1 transition ${
              scaleCalibration.active ? 'bg-emerald-600 text-white' : 'hover:bg-[#353535]'
            }`}
            title="Scale Calibration (Measure Distance)"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Calibrate</span>
          </button>

          <div className="w-[1px] h-4 bg-[#333] mx-0.5" />

          {/* Cinematic DOF Toggle */}
          <button
            onClick={() => setCinematicDof(!cinematicDof)}
            className={`px-1.5 py-1 rounded-sm flex items-center gap-1 transition ${
              cinematicDof
                ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/30'
                : 'hover:bg-[#353535]'
            }`}
            title="Toggle Cinematic Depth of Field Blur"
          >
            <Sparkles className={`w-3.5 h-3.5 ${cinematicDof ? 'text-indigo-200 animate-pulse' : 'text-indigo-400'}`} />
            <span className="hidden lg:inline">Cinematic DOF</span>
          </button>

          {/* AAA Post-FX Shading Stack Toggle */}
          <button
            onClick={() => setPostFxEnabled(!postFxEnabled)}
            className={`px-1.5 py-1 rounded-sm flex items-center gap-1 transition ${
              postFxEnabled
                ? 'bg-amber-600/90 text-white font-medium shadow-md shadow-amber-500/20'
                : 'hover:bg-[#353535] text-gray-500'
            }`}
            title="Toggle Unreal Engine AAA Post-Processing Stack (Bloom, SSAO, Vignette, FXAA)"
          >
            <Zap className={`w-3.5 h-3.5 ${postFxEnabled ? 'text-amber-300' : 'text-gray-500'}`} />
            <span className="hidden lg:inline">AAA Shader</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded-sm hover:bg-[#353535] transition"
            title="Toggle Viewport Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Scale Calibration Step Guide Banner */}
      {scaleCalibration.active && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
          <Ruler className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>
            {scaleCalibration.step === 'pick_p1' && 'Click Point 1 on the 3D model'}
            {scaleCalibration.step === 'pick_p2' && 'Click Point 2 on the 3D model'}
            {scaleCalibration.step === 'input_dist' && 'Enter real-world length between points:'}
          </span>
          {scaleCalibration.step === 'input_dist' && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={scaleCalibration.realDistance}
                onChange={(e) =>
                  setScaleCalibration((prev) => ({
                    ...prev,
                    realDistance: parseFloat(e.target.value) || 1.0
                  }))
                }
                className="w-16 bg-[#181818] border border-emerald-500 text-white px-2 py-0.5 rounded-sm text-center"
              />
              <span className="font-mono">meters</span>
              <button
                onClick={() =>
                  setScaleCalibration((prev) => ({
                    ...prev,
                    active: false,
                    step: 'none'
                  }))
                }
                className="ml-2 bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-sm font-medium"
              >
                Apply Scale
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Viewport Floating Info Overlay (Bottom Left & Right) */}
      <div className="absolute bottom-2 left-2 z-10 pointer-events-none flex items-center gap-3 text-[10px] font-mono text-gray-300 bg-[#232323]/90 backdrop-blur px-2.5 py-1 rounded-sm border border-[#333]">
        <div>
          <span className="text-gray-400">Verts:</span>{' '}
          <span className="text-[#3d85c6] font-bold">
            {renderMode === 'pointcloud'
              ? pointCloudType === 'dense'
                ? '500,000'
                : '14,250'
              : Math.round(18500 * meshDecimation).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Tris:</span>{' '}
          <span className="text-[#3d85c6] font-bold">
            {renderMode === 'pointcloud'
              ? '0'
              : Math.round(36000 * meshDecimation).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-400">FPS:</span>{' '}
          <span className="text-emerald-400 font-bold">60.0</span>
        </div>
        {postFxEnabled && webglSupported && (
          <div className="text-amber-300 font-semibold bg-amber-950/80 px-1.5 py-0.5 rounded-sm border border-amber-500/40 text-[9px] flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span>AAA PBR + Bloom + SSAO</span>
          </div>
        )}
        {cinematicDof && (
          <div className="text-indigo-300 font-semibold bg-indigo-950/80 px-1.5 py-0.5 rounded-sm border border-indigo-500/40 text-[9px] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
            <span>Cinematic DOF</span>
          </div>
        )}
        {!webglSupported && (
          <div className="text-amber-400 font-semibold bg-amber-950/80 px-1.5 py-0.5 rounded-sm border border-amber-500/30 text-[9px] uppercase tracking-wider">
            2D Canvas Viewport
          </div>
        )}
        {retopoOverlay && (
          <div className="text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.5 rounded-sm border border-amber-500/30">
            Retopo Cage Active
          </div>
        )}
      </div>

      {/* Live NPC Event Toast Flash Notification Banner */}
      {activeMode === 'npc' && activeNpcEvent && Date.now() - activeNpcEvent.timestamp < 3500 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 font-mono text-xs px-4 py-2 rounded-full shadow-2xl border backdrop-blur flex items-center gap-2.5 animate-bounce transition-all">
          {activeNpcEvent.type === 'spot' && (
            <div className="flex items-center gap-2 bg-amber-950/90 border-amber-500/80 text-amber-200 px-3 py-1 rounded-full">
              <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-bold">EVENT TRIGGERED:</span>
              <span>{activeNpcEvent.name}</span>
            </div>
          )}
          {activeNpcEvent.type === 'damage' && (
            <div className="flex items-center gap-2 bg-rose-950/90 border-rose-500/80 text-rose-200 px-3 py-1 rounded-full">
              <Swords className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="font-bold">EVENT TRIGGERED:</span>
              <span>{activeNpcEvent.name}</span>
            </div>
          )}
          {activeNpcEvent.type === 'command' && (
            <div className="flex items-center gap-2 bg-purple-950/90 border-purple-500/80 text-purple-200 px-3 py-1 rounded-full">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="font-bold">COMMAND ISSUED:</span>
              <span>{activeNpcEvent.name}</span>
            </div>
          )}
          {activeNpcEvent.type === 'heal' && (
            <div className="flex items-center gap-2 bg-emerald-950/90 border-emerald-500/80 text-emerald-200 px-3 py-1 rounded-full">
              <HeartPulse className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-bold">HEAL & RESET:</span>
              <span>{activeNpcEvent.name}</span>
            </div>
          )}
          {activeNpcEvent.type === 'stun' && (
            <div className="flex items-center gap-2 bg-cyan-950/90 border-cyan-500/80 text-cyan-200 px-3 py-1 rounded-full">
              <ShieldAlert className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-bold">STUNNED:</span>
              <span>{activeNpcEvent.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Live NPC Simulation Floating Debug Overlay in NPC mode */}
      {activeMode === 'npc' && (
        <div className="absolute bottom-3 right-3 z-10 bg-[#1e1e24]/95 border border-[#383842] p-3 rounded-sm text-xs w-80 shadow-2xl backdrop-blur space-y-2.5">
          {/* Header Bar */}
          <div className="flex items-center justify-between font-semibold text-gray-200 border-b border-[#2d2d38] pb-1.5">
            <div className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-amber-400" />
              <span className="font-bold">NPC Behavior Testing Viewport</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-sm text-[9px] uppercase font-mono font-bold ${
                npcStats.health <= 0
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/50'
                  : npcStats.aiMode === 'Aggressive'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {npcStats.health <= 0
                ? 'Defeated'
                : `AI: ${npcStats.aiMode.toUpperCase()}`}
            </span>
          </div>

          {/* NPC Stats & Health Bar */}
          <div className="space-y-1.5 font-mono text-gray-300 text-[10px]">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Target Entity:</span>
              <span className="text-white font-bold">{npcStats.name}</span>
            </div>

            {/* Health Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px]">
                <span className="text-gray-400 font-mono">Health Points (HP):</span>
                <span
                  className={`font-bold ${
                    npcStats.health > 120
                      ? 'text-emerald-400'
                      : npcStats.health > 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {npcStats.health} / {npcStats.maxHealth} HP
                </span>
              </div>
              <div className="w-full bg-[#121216] h-2 rounded-full overflow-hidden border border-[#2d2d38]">
                <div
                  className={`h-full transition-all duration-500 ${
                    npcStats.health > 120
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      : npcStats.health > 50
                      ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                      : 'bg-gradient-to-r from-rose-600 to-rose-400'
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (npcStats.health / npcStats.maxHealth) * 100)
                    )}%`
                  }}
                />
              </div>
            </div>

            {/* Active Behavior Tree Executing Node Ticker */}
            <div className="bg-[#141418] border border-[#2e2e3a] p-1.5 rounded-sm flex items-center justify-between text-[9px] mt-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
                <span>Active BT Node:</span>
              </div>
              <span className="text-cyan-300 font-bold truncate max-w-[140px]">
                {behaviorNodes.find((n) => n.status === 'active')?.title ||
                  behaviorNodes.find((n) => n.status === 'success')?.title ||
                  'Idle Patrol'}
              </span>
            </div>
          </div>

          {/* Manual Event Trigger Buttons in Viewport */}
          <div className="space-y-1.5 pt-1.5 border-t border-[#2d2d38]">
            <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 uppercase tracking-wider font-bold">
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Manual Event Triggers</span>
              </span>
              <span className="text-[8px] text-gray-500">Instant Reaction</span>
            </div>

            {/* Grid of Event Action Buttons */}
            <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
              <button
                onClick={() =>
                  onTriggerEvent &&
                  onTriggerEvent(
                    npcStats.aiMode === 'Aggressive' ? 'player_lost' : 'player_spotted'
                  )
                }
                className={`px-2 py-1 rounded-sm border flex items-center justify-center gap-1 transition font-semibold ${
                  npcStats.aiMode === 'Aggressive'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300 hover:bg-amber-600/50'
                    : 'bg-[#141418] border-[#333] text-gray-200 hover:bg-[#282830] hover:border-amber-400'
                }`}
                title="Toggle Player Spotted / Lost"
              >
                <Eye className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">
                  {npcStats.aiMode === 'Aggressive' ? 'Player Lost' : 'Player Spotted'}
                </span>
              </button>

              <button
                onClick={() => onTriggerEvent && onTriggerEvent('take_damage', 50)}
                className="px-2 py-1 rounded-sm border bg-[#141418] border-[#333] text-rose-300 hover:bg-rose-950/60 hover:border-rose-500 flex items-center justify-center gap-1 transition font-semibold"
                title="Deal 50 Damage to NPC"
              >
                <Swords className="w-3 h-3 text-rose-400 shrink-0" />
                <span>Take Damage</span>
              </button>

              <button
                onClick={() => onTriggerEvent && onTriggerEvent('stun')}
                className="px-2 py-1 rounded-sm border bg-[#141418] border-[#333] text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-500 flex items-center justify-center gap-1 transition font-semibold"
                title="Stun / Impact NPC"
              >
                <ShieldAlert className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Stun Impact</span>
              </button>

              <button
                onClick={() => onTriggerEvent && onTriggerEvent('heal')}
                className="px-2 py-1 rounded-sm border bg-[#141418] border-[#333] text-emerald-300 hover:bg-emerald-950/60 hover:border-emerald-500 flex items-center justify-center gap-1 transition font-semibold"
                title="Restore full HP and reset tree"
              >
                <HeartPulse className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Heal / Reset</span>
              </button>
            </div>

            {/* Quick Tactical Command Pill Buttons */}
            <div className="pt-1 flex items-center gap-1 text-[9px] font-mono">
              <span className="text-gray-400 shrink-0">Command:</span>
              <div className="grid grid-cols-4 gap-1 flex-1">
                <button
                  onClick={() => onTriggerEvent && onTriggerEvent('receive_command', 'Guard Post')}
                  className="px-1 py-0.5 bg-[#141418] hover:bg-purple-950 hover:text-purple-300 border border-[#2d2d38] text-gray-300 rounded-sm text-center truncate transition"
                >
                  Guard
                </button>
                <button
                  onClick={() => onTriggerEvent && onTriggerEvent('receive_command', 'Patrol Route')}
                  className="px-1 py-0.5 bg-[#141418] hover:bg-purple-950 hover:text-purple-300 border border-[#2d2d38] text-gray-300 rounded-sm text-center truncate transition"
                >
                  Patrol
                </button>
                <button
                  onClick={() => onTriggerEvent && onTriggerEvent('receive_command', 'Charge Attack')}
                  className="px-1 py-0.5 bg-[#141418] hover:bg-purple-950 hover:text-purple-300 border border-[#2d2d38] text-gray-300 rounded-sm text-center truncate transition"
                >
                  Attack
                </button>
                <button
                  onClick={() => onTriggerEvent && onTriggerEvent('receive_command', 'Retreat / Fallback')}
                  className="px-1 py-0.5 bg-[#141418] hover:bg-purple-950 hover:text-purple-300 border border-[#2d2d38] text-gray-300 rounded-sm text-center truncate transition"
                >
                  Retreat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Procedural Texture Generators for PBR Shading ---
function createPbrNormalMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const imgData = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const idx = (y * 256 + x) * 4;
        const noiseX = Math.sin(x * 0.25) * Math.cos(y * 0.25) * 18 + (Math.random() - 0.5) * 12;
        const noiseY = Math.cos(x * 0.25) * Math.sin(y * 0.25) * 18 + (Math.random() - 0.5) * 12;

        imgData.data[idx] = Math.max(0, Math.min(255, 128 + noiseX));
        imgData.data[idx + 1] = Math.max(0, Math.min(255, 128 + noiseY));
        imgData.data[idx + 2] = 240;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

function createPbrRoughnessMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const imgData = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const idx = (y * 256 + x) * 4;
        const brush = Math.sin(x * 0.8 + y * 0.05) * 20;
        const noise = (Math.random() - 0.5) * 30;
        const val = Math.max(40, Math.min(200, 100 + brush + noise));

        imgData.data[idx] = val;
        imgData.data[idx + 1] = val;
        imgData.data[idx + 2] = val;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// --- Procedural 3D Mesh Generator Helper ---
function buildCharacterMesh(
  decimationRatio: number,
  renderMode: RenderMode,
  pbrNormalMap?: THREE.CanvasTexture,
  pbrRoughnessMap?: THREE.CanvasTexture
): THREE.Mesh {
  const group = new THREE.Group();

  // Create character silhouette geometry
  const bodyGeo = new THREE.CylinderGeometry(
    0.35 * decimationRatio,
    0.25 * decimationRatio,
    1.2,
    Math.max(8, Math.round(32 * decimationRatio)),
    Math.max(4, Math.round(16 * decimationRatio))
  );

  const headGeo = new THREE.SphereGeometry(
    0.22,
    Math.max(8, Math.round(24 * decimationRatio)),
    Math.max(8, Math.round(24 * decimationRatio))
  );
  headGeo.translate(0, 0.85, 0);

  const shoulderL = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  shoulderL.translate(0.35, 0.55, 0);

  const shoulderR = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  shoulderR.translate(-0.35, 0.55, 0);

  const swordGeo = new THREE.BoxGeometry(0.06, 0.9, 0.02);
  swordGeo.translate(-0.5, 0.4, 0.2);

  // Pick material based on render mode
  let material: THREE.Material;

  if (renderMode === 'wireframe') {
    material = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true
    });
  } else if (renderMode === 'matcap') {
    material = new THREE.MeshPhongMaterial({
      color: 0x94a3b8,
      shininess: 90,
      specular: 0x38bdf8,
      bumpMap: pbrNormalMap,
      bumpScale: 0.04
    });
  } else if (renderMode === 'solid') {
    material = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.45,
      metalness: 0.25,
      flatShading: true,
      normalMap: pbrNormalMap,
      normalScale: new THREE.Vector2(0.3, 0.3)
    });
  } else {
    // Textured PBR Material with clearcoat, normal maps, roughness maps and metalness
    material = new THREE.MeshPhysicalMaterial({
      color: 0x818cf8,
      roughness: 0.25,
      metalness: 0.65,
      clearcoat: 0.35,
      clearcoatRoughness: 0.1,
      reflectivity: 0.85,
      normalMap: pbrNormalMap,
      normalScale: new THREE.Vector2(0.4, 0.4),
      roughnessMap: pbrRoughnessMap,
      envMapIntensity: 1.25
    });
  }

  // Create combined mesh group
  const primaryMesh = new THREE.Mesh(bodyGeo, material);
  primaryMesh.position.y = 0.6;
  primaryMesh.castShadow = true;
  primaryMesh.receiveShadow = true;

  const headMesh = new THREE.Mesh(headGeo, material);
  headMesh.castShadow = true;

  const swordMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.95,
    roughness: 0.1,
    envMapIntensity: 1.5
  });
  const swordMesh = new THREE.Mesh(swordGeo, swordMaterial);
  swordMesh.castShadow = true;

  primaryMesh.add(headMesh);
  primaryMesh.add(swordMesh);

  return primaryMesh;
}

// --- Procedural Point Cloud Generator ---
function buildPointCloud(type: 'sparse' | 'dense'): THREE.Points {
  const count = type === 'dense' ? 25000 : 3500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const color1 = new THREE.Color('#3b82f6');
  const color2 = new THREE.Color('#eab308');

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = 0.4 + Math.random() * 0.6;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = 0.8 + (Math.random() - 0.5) * 1.2;
    const z = radius * Math.sin(phi) * Math.sin(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const mixedColor = color1.clone().lerp(color2, Math.random());
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: type === 'dense' ? 0.025 : 0.04,
    vertexColors: true,
    sizeAttenuation: true
  });

  return new THREE.Points(geometry, material);
}

// --- Camera Frustum Helper ---
function createCameraFrustum(
  pos: [number, number, number],
  rot: [number, number, number],
  label: string
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...pos);
  group.rotation.set(...rot);

  // Pyramidal Frustum Wireframe
  const geometry = new THREE.ConeGeometry(0.35, 0.5, 4);
  geometry.rotateX(Math.PI / 2);
  const wireframe = new THREE.WireframeGeometry(geometry);
  const line = new THREE.LineSegments(
    wireframe,
    new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 })
  );

  group.add(line);
  return group;
}

// --- Skeleton Rig Helper ---
function buildSkeletonObject(rootBone: BoneNode, selectedId?: string): THREE.Group {
  const group = new THREE.Group();

  function traverseBone(bone: BoneNode, parentPos?: [number, number, number]) {
    const boneMarker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06),
      new THREE.MeshBasicMaterial({
        color: bone.id === selectedId ? 0xef4444 : 0x06b6d4,
        wireframe: true
      })
    );
    boneMarker.position.set(...bone.position);
    group.add(boneMarker);

    if (parentPos) {
      const points = [
        new THREE.Vector3(...parentPos),
        new THREE.Vector3(...bone.position)
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);
    }

    if (bone.children) {
      bone.children.forEach((child) => traverseBone(child, bone.position));
    }
  }

  traverseBone(rootBone);
  return group;
}

// --- Retopology Cage Helper ---
function buildRetopoCageMesh(): THREE.Group {
  const group = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(0.8, 1.3, 0.8, 4, 6, 4);
  boxGeo.translate(0, 0.65, 0);

  const wireframe = new THREE.WireframeGeometry(boxGeo);
  const line = new THREE.LineSegments(
    wireframe,
    new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 })
  );

  group.add(line);
  return group;
}

// --- Scale Calibration Line Helper ---
function createCalibrationLine(
  p1: [number, number, number],
  p2: [number, number, number],
  distMeters: number
): THREE.Group {
  const group = new THREE.Group();

  const points = [new THREE.Vector3(...p1), new THREE.Vector3(...p2)];
  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat = new THREE.LineDashedMaterial({
    color: 0x10b981,
    dashSize: 0.1,
    gapSize: 0.05,
    linewidth: 3
  });

  const line = new THREE.Line(lineGeo, lineMat);
  line.computeLineDistances();
  group.add(line);

  return group;
}

// --- Transform Gizmo Helper ---
function createTransformGizmo(mode: GizmoMode): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, 0.8, 0);

  if (mode === 'translate') {
    // Red X, Green Y, Blue Z arrows
    const xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 0.6, 0xef4444);
    const yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 0.6, 0x22c55e);
    const zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 0.6, 0x3b82f6);
    group.add(xAxis, yAxis, zAxis);
  } else if (mode === 'rotate') {
    const ringGeo = new THREE.TorusGeometry(0.6, 0.015, 8, 32);
    const xRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    xRing.rotation.y = Math.PI / 2;

    const yRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    yRing.rotation.x = Math.PI / 2;

    const zRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));

    group.add(xRing, yRing, zRing);
  } else if (mode === 'scale') {
    const boxGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const xBox = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    xBox.position.x = 0.6;
    const yBox = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    yBox.position.y = 0.6;
    const zBox = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    zBox.position.z = 0.6;

    group.add(xBox, yBox, zBox);
  }

  return group;
}

// --- Live NPC Simulation Loop ---
function updateNpcSimulation(
  delta: number,
  simGroup: THREE.Group,
  simData: any,
  targetPos: [number, number],
  stats: NpcStats
) {
  // Move along waypoints
  const waypoints = simData.waypoints;
  const currentTarget = waypoints[simData.currentWaypointIndex];

  const dx = currentTarget[0] - simData.x;
  const dz = currentTarget[1] - simData.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 0.2) {
    simData.currentWaypointIndex = (simData.currentWaypointIndex + 1) % waypoints.length;
  } else {
    const speed = stats.walkSpeed * delta;
    simData.x += (dx / dist) * speed;
    simData.z += (dz / dist) * speed;
    simData.rotY = Math.atan2(dx, dz);
  }

  // Update simGroup position
  simGroup.position.set(simData.x, 0, simData.z);
  simGroup.rotation.y = simData.rotY;
}
