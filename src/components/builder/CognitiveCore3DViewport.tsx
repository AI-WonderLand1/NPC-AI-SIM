import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { CognitivePhase } from '../../brain/cognitiveModel.js';

interface CognitiveCore3DViewportProps {
  phase: CognitivePhase;
  onStatusChange?: (status: string) => void;
}

const BRAIN_MODEL_URL = '/models/brain.glb';

const PHASE_COLORS: Record<CognitivePhase, number> = {
  idle: 0x49a8ff,
  perceiving: 0x35e6ff,
  reasoning: 0xa673ff,
  planning: 0x6f88ff,
  acting: 0x2ce79a,
  error: 0xff5f72,
};

function phaseLabel(phase: CognitivePhase) {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

function cortexFold(side: -1 | 1, azimuth: number, polar: number) {
  const waveA = Math.sin(azimuth * 11.8 + polar * 6.9 + side * 0.72);
  const waveB = Math.sin(azimuth * 21.4 - polar * 9.6 + side * 1.44);
  const waveC = Math.cos(azimuth * 7.8 + polar * 17.2 - side * 0.58);
  const waveD = Math.sin(azimuth * 31.0 + polar * 4.4 + side * 0.33);
  const primarySulcus = -0.082 * Math.pow(1 - Math.abs(waveA), 6);
  const secondarySulcus = -0.044 * Math.pow(1 - Math.abs(waveB), 8);
  const microSulcus = -0.018 * Math.pow(1 - Math.abs(waveD), 9);
  const asymmetry = side > 0
    ? Math.sin(polar * 3.7 + azimuth * 1.6) * 0.010
    : Math.cos(polar * 4.1 - azimuth * 1.3) * 0.012;

  return 1
    + waveA * 0.066
    + waveB * 0.031
    + waveC * 0.017
    + waveD * 0.009
    + primarySulcus
    + secondarySulcus
    + microSulcus
    + asymmetry;
}

function cortexSurfacePoint(side: -1 | 1, azimuth: number, polar: number, outward = 1.018) {
  const unitX = Math.sin(polar) * Math.cos(azimuth);
  const unitY = Math.cos(polar);
  const unitZ = Math.sin(polar) * Math.sin(azimuth);
  const fold = cortexFold(side, azimuth, polar) * outward;
  const medialScale = unitX * side < 0 ? 0.80 : 1;

  return new THREE.Vector3(
    unitX * 0.66 * medialScale * fold + side * 0.54,
    unitY * 0.80 * fold + 0.15 + side * 0.008,
    unitZ * 0.90 * fold + 0.10 + side * 0.010,
  );
}

function createCortexLobe(side: -1 | 1) {
  const geometry = new THREE.SphereGeometry(1, 112, 76);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const length = Math.max(Math.hypot(x, y, z), 0.0001);
    const azimuth = Math.atan2(z, x);
    const polar = Math.acos(THREE.MathUtils.clamp(y / length, -1, 1));
    const fold = cortexFold(side, azimuth, polar);
    const medialScale = x * side < 0 ? 0.80 : 1;

    position.setXYZ(
      index,
      x * 0.66 * medialScale * fold + side * 0.54,
      y * 0.80 * fold + 0.15 + side * 0.008,
      z * 0.90 * fold + 0.10 + side * 0.010,
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createCerebellum(side: -1 | 1) {
  const geometry = new THREE.SphereGeometry(0.58, 80, 52);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const waveA = Math.sin((x + z) * 20 + side * 0.7);
    const waveB = Math.cos((y - z) * 25 - side);
    const waveC = Math.sin(x * 31 + y * 10 + side * 0.4);
    const groove = -0.040 * Math.pow(1 - Math.abs(waveA), 7);
    const fold = 1 + waveA * 0.036 + waveB * 0.017 + waveC * 0.009 + groove;

    position.setXYZ(
      index,
      x * 0.60 * fold + side * 0.27,
      y * 0.45 * fold - 0.60,
      z * 0.68 * fold - 0.57,
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function createCortexBumpTexture(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const nx = x / canvas.width;
      const ny = y / canvas.height;
      const broad = Math.sin(nx * Math.PI * 23 + Math.sin(ny * Math.PI * 7) * 2.8);
      const crossing = Math.sin(nx * Math.PI * 41 - ny * Math.PI * 15);
      const fine = Math.cos(nx * Math.PI * 67 + ny * Math.PI * 21);
      const sulcus = -Math.pow(1 - Math.abs(broad), 7) * 58;
      const value = THREE.MathUtils.clamp(126 + broad * 24 + crossing * 13 + fine * 7 + sulcus, 28, 220);
      const offset = (y * canvas.width + x) * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1.15, 1);
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
  return texture;
}

function normalizeBrainModel(model: THREE.Object3D) {
  model.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 0.0001);
  model.scale.multiplyScalar(2.22 / longest);
  model.updateMatrixWorld(true);

  bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.position.y += 0.04;
  model.position.z += 0.18;
}

function makeNeuralOverlay() {
  const entries: Array<{ point: THREE.Vector3; side: -1 | 1 }> = [];

  for (const side of [-1, 1] as const) {
    for (let index = 0; index < 46; index += 1) {
      const azimuth = ((index * 0.61803398875 + (side > 0 ? 0.17 : 0)) % 1) * Math.PI * 2;
      const polar = 0.48 + (((index * 0.38196601125 + (side > 0 ? 0.09 : 0)) % 1) * 1.82);
      entries.push({ point: cortexSurfacePoint(side, azimuth, polar), side });
    }
  }

  const points = entries.map((entry) => entry.point);
  const pointGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const pointMaterial = new THREE.PointsMaterial({
    color: 0xbdefff,
    size: 0.024,
    transparent: true,
    opacity: 0.84,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const connectionPositions: number[] = [];
  const linked = new Set<string>();

  entries.forEach((entry, index) => {
    const nearest = entries
      .map((other, otherIndex) => ({
        other,
        otherIndex,
        distance: entry.side === other.side
          ? entry.point.distanceTo(other.point)
          : Number.POSITIVE_INFINITY,
      }))
      .filter(({ otherIndex }) => otherIndex !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);

    nearest.forEach(({ other, otherIndex, distance }) => {
      if (distance > 0.42) return;
      const key = `${Math.min(index, otherIndex)}:${Math.max(index, otherIndex)}`;
      if (linked.has(key)) return;
      linked.add(key);
      connectionPositions.push(
        entry.point.x,
        entry.point.y,
        entry.point.z,
        other.point.x,
        other.point.y,
        other.point.z,
      );
    });
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x51c7ff,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  });

  const group = new THREE.Group();
  group.renderOrder = 11;
  group.add(new THREE.Points(pointGeometry, pointMaterial));
  group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  return { group, pointMaterial, lineMaterial };
}

export const CognitiveCore3DViewport: React.FC<CognitiveCore3DViewportProps> = ({
  phase,
  onStatusChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const probe = document.createElement('canvas');
    if (!probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false })) {
      onStatusChange?.('Real-time 3D unavailable • this browser does not expose WebGL2');
      return;
    }

    let disposed = false;
    let frame = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x01050d);
    scene.fog = new THREE.FogExp2(0x020713, 0.022);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0.15, 1.25, 7.65);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.56;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    room.dispose();
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 5.9;
    controls.maxDistance = 9.1;
    controls.minPolarAngle = Math.PI * 0.31;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, 1.20, 0.18);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.065, 0.12, 0.985);
    composer.addPass(bloom);

    const root = new THREE.Group();
    root.position.y = 1.17;
    scene.add(root);

    const darkMetal = new THREE.MeshPhysicalMaterial({
      color: 0x060d17,
      metalness: 0.92,
      roughness: 0.23,
      clearcoat: 0.34,
      clearcoatRoughness: 0.18,
      envMapIntensity: 0.82,
    });

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.62, 0.32, 64), darkMetal);
    platform.position.y = -2.03;
    platform.receiveShadow = true;
    root.add(platform);

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.22, 64), darkMetal);
    topCap.position.y = 2.02;
    root.add(topCap);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x59bdf4,
      emissive: 0x064ba3,
      emissiveIntensity: 0.25,
      roughness: 0.30,
      metalness: 0.08,
      envMapIntensity: 0.68,
    });

    const rings: THREE.Mesh[] = [];
    [-1.70, -1.52, 1.57, 1.76].forEach((y, index) => {
      const material = ringMaterial.clone();
      if (index % 2) {
        material.color.setHex(0x806fe8);
        material.emissive.setHex(0x321d7e);
        material.emissiveIntensity = 0.18;
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(index % 2 ? 1.95 : 2.17, 0.015, 10, 112), material);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      root.add(ring);
      rings.push(ring);
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf6fcff,
      roughness: 0.018,
      metalness: 0,
      transmission: 0.996,
      thickness: 0.055,
      ior: 1.44,
      clearcoat: 0.90,
      clearcoatRoughness: 0.03,
      envMapIntensity: 0.52,
      attenuationColor: new THREE.Color(0x9bd8ff),
      attenuationDistance: 11.0,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(2.10, 2.10, 3.70, 128, 1, true),
      glassMaterial,
    );
    glass.renderOrder = 8;
    root.add(glass);

    const innerReflectionMaterial = new THREE.MeshBasicMaterial({
      color: 0x4b9ed8,
      transparent: true,
      opacity: 0.016,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const innerReflection = new THREE.Mesh(
      new THREE.CylinderGeometry(2.025, 2.025, 3.58, 128, 1, true),
      innerReflectionMaterial,
    );
    innerReflection.renderOrder = 7;
    root.add(innerReflection);

    const curvedReflectionMaterial = new THREE.MeshBasicMaterial({
      color: 0xccefff,
      transparent: true,
      opacity: 0.026,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });

    [
      { start: Math.PI * 0.08, length: 0.12, opacity: 0.022 },
      { start: Math.PI * 0.88, length: 0.08, opacity: 0.016 },
      { start: Math.PI * 1.58, length: 0.055, opacity: 0.012 },
    ].forEach(({ start, length, opacity }) => {
      const material = curvedReflectionMaterial.clone();
      material.opacity = opacity;
      const arc = new THREE.Mesh(
        new THREE.CylinderGeometry(2.106, 2.106, 3.34, 24, 1, true, start, length),
        material,
      );
      arc.position.y = 0.02;
      arc.renderOrder = 10;
      root.add(arc);
    });

    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.036, 3.36, 0.036), darkMetal);
      rail.position.set(Math.cos(angle) * 2.08, 0.02, Math.sin(angle) * 2.08);
      root.add(rail);
    }

    const cortexBump = createCortexBumpTexture(renderer);
    const brainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x06162c,
      roughness: 0.31,
      metalness: 0.01,
      transmission: 0,
      clearcoat: 0.62,
      clearcoatRoughness: 0.20,
      emissive: 0x021329,
      emissiveIntensity: 0.15,
      envMapIntensity: 0.86,
      bumpMap: cortexBump ?? undefined,
      bumpScale: 0.075,
    });

    const brain = new THREE.Group();
    brain.position.set(0, 0.04, 0.23);
    brain.scale.setScalar(0.87);
    root.add(brain);

    const fallbackBrain = new THREE.Group();
    fallbackBrain.visible = true;
    brain.add(fallbackBrain);

    ([-1, 1] as const).forEach((side) => {
      const lobeGeometry = createCortexLobe(side);
      const lobe = new THREE.Mesh(lobeGeometry, brainMaterial);
      lobe.castShadow = true;
      fallbackBrain.add(lobe);

      const cortexSheenMaterial = new THREE.MeshBasicMaterial({
        color: side > 0 ? 0x236fb4 : 0x184d87,
        transparent: true,
        opacity: 0.018,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      });
      const cortexSheen = new THREE.Mesh(lobeGeometry.clone(), cortexSheenMaterial);
      cortexSheen.scale.setScalar(1.006);
      cortexSheen.renderOrder = 6;
      fallbackBrain.add(cortexSheen);

      const cerebellum = new THREE.Mesh(createCerebellum(side), brainMaterial);
      cerebellum.castShadow = true;
      fallbackBrain.add(cerebellum);
    });

    const stemMaterial = brainMaterial.clone();
    stemMaterial.color.setHex(0x092540);
    stemMaterial.emissiveIntensity = 0.12;
    const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.58, 6, 14), stemMaterial);
    stem.position.set(0.045, -0.89, -0.18);
    stem.rotation.z = -0.09;
    fallbackBrain.add(stem);

    const neural = makeNeuralOverlay();
    brain.add(neural.group);

    const realBrain = new THREE.Group();
    realBrain.visible = false;
    brain.add(realBrain);

    const loader = new GLTFLoader();
    loader.load(
      BRAIN_MODEL_URL,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        normalizeBrainModel(model);
        model.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          const material = brainMaterial.clone();
          material.bumpMap = undefined;
          material.bumpScale = 0;
          mesh.material = material;
          mesh.castShadow = true;
          mesh.receiveShadow = false;
        });
        realBrain.add(model);
        realBrain.visible = true;
        fallbackBrain.visible = false;
        onStatusChange?.('Real-time 3D cognitive core • WebGL2 • anatomical brain mesh • restrained layered glass');
      },
      undefined,
      () => {
        if (disposed) return;
        fallbackBrain.visible = true;
        onStatusChange?.('Real-time 3D cognitive core • WebGL2 • detailed procedural fallback • add /public/models/brain.glb for final anatomical mesh');
      },
    );

    const scanMaterial = new THREE.MeshBasicMaterial({
      color: 0x47b8ef,
      transparent: true,
      opacity: 0.032,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const scanRing = new THREE.Mesh(new THREE.RingGeometry(0.46, 1.68, 96), scanMaterial);
    scanRing.rotation.x = -Math.PI / 2;
    scanRing.renderOrder = 9;
    root.add(scanRing);

    const dustPositions: number[] = [];
    for (let index = 0; index < 170; index += 1) {
      const radius = Math.sqrt(Math.random()) * 1.72;
      const angle = Math.random() * Math.PI * 2;
      dustPositions.push(
        Math.cos(angle) * radius,
        -1.42 + Math.random() * 2.84,
        Math.sin(angle) * radius,
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x71cfff,
      size: 0.014,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    root.add(dust);

    const floorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x020812,
      metalness: 0.78,
      roughness: 0.20,
      clearcoat: 0.48,
      clearcoatRoughness: 0.20,
      envMapIntensity: 0.72,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.98;
    floor.receiveShadow = true;
    scene.add(floor);

    const floorGrid = new THREE.GridHelper(20, 44, 0x164978, 0x0a2038);
    floorGrid.position.y = -0.972;
    const gridMaterials = Array.isArray(floorGrid.material) ? floorGrid.material : [floorGrid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.075;
    });
    scene.add(floorGrid);

    const backMaterial = new THREE.MeshStandardMaterial({
      color: 0x071221,
      metalness: 0.70,
      roughness: 0.38,
      envMapIntensity: 0.62,
    });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.2, 5.9, 0.32), backMaterial);
    backWall.position.set(0, 1.45, -4.45);
    scene.add(backWall);

    for (const x of [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6]) {
      const stripMaterial = ringMaterial.clone();
      stripMaterial.emissiveIntensity = x === 0 ? 0.12 : 0.055;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.020, 3.65, 0.04), stripMaterial);
      strip.position.set(x, 1.34, -4.25);
      scene.add(strip);
    }

    const screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x020915,
      emissive: 0x03162d,
      emissiveIntensity: 0.18,
      metalness: 0.15,
      roughness: 0.32,
    });

    for (const side of [-1, 1] as const) {
      const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(2.48, 3.08, 0.18), darkMetal);
      panelFrame.position.set(side * 4.15, 1.18, -3.25);
      panelFrame.rotation.y = side * -0.10;
      scene.add(panelFrame);

      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 1.48), screenMaterial);
      screen.position.set(side * 4.03, 1.58, -3.10);
      screen.rotation.y = side * -0.10;
      scene.add(screen);

      for (let row = 0; row < 5; row += 1) {
        const indicatorMaterial = ringMaterial.clone();
        indicatorMaterial.emissiveIntensity = 0.07 + row * 0.012;
        if (row === 2) {
          indicatorMaterial.color.setHex(0x775fd4);
          indicatorMaterial.emissive.setHex(0x2f1a76);
        }
        const width = row % 2 === 0 ? 1.32 : 0.98;
        const indicator = new THREE.Mesh(new THREE.BoxGeometry(width, 0.016, 0.030), indicatorMaterial);
        indicator.position.set(side * 4.02, 0.24 + row * 0.29, -3.07);
        indicator.rotation.y = side * -0.10;
        scene.add(indicator);
      }

      for (const xOffset of [-0.78, 0.78]) {
        const frameStrip = new THREE.Mesh(new THREE.BoxGeometry(0.018, 2.56, 0.025), ringMaterial.clone());
        frameStrip.position.set(side * 4.02 + xOffset, 1.18, -3.06);
        frameStrip.rotation.y = side * -0.10;
        scene.add(frameStrip);
      }
    }

    scene.add(new THREE.HemisphereLight(0x668ab5, 0x010307, 0.14));

    const key = new THREE.SpotLight(0x6fb8ee, 0.22, 16, Math.PI / 5.8, 0.94, 1.4);
    key.position.set(4.2, 4.4, 2.7);
    key.target.position.set(0, 1.20, 0.18);
    key.castShadow = true;
    scene.add(key, key.target);

    const brainFill = new THREE.PointLight(0x1d7fd4, 0.62, 5.2, 2.0);
    brainFill.position.set(-1.45, 1.35, 2.1);
    scene.add(brainFill);

    const brainRim = new THREE.PointLight(0x6346c9, 0.44, 5.0, 2.0);
    brainRim.position.set(1.75, 1.95, -0.75);
    scene.add(brainRim);

    const backRim = new THREE.PointLight(0x2099d5, 0.58, 6.8, 2.0);
    backRim.position.set(0, 1.55, -2.55);
    scene.add(backRim);

    const lowerGlow = new THREE.PointLight(0x104fa6, 0.24, 4.2, 2.0);
    lowerGlow.position.set(0, -0.55, 0.55);
    scene.add(lowerGlow);

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloom.setSize(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    const warmWhite = new THREE.Color(0xd7f3ff);

    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      const currentPhase = phaseRef.current;
      const phaseColor = new THREE.Color(PHASE_COLORS[currentPhase]);
      const active = currentPhase !== 'idle';

      const pulse = 1 + Math.sin(time * (active ? 3.0 : 1.45)) * (active ? 0.009 : 0.0035);
      brain.rotation.y = Math.sin(time * 0.17) * 0.048;
      brain.rotation.x = Math.sin(time * 0.12) * 0.010;
      brain.scale.setScalar(0.87 * pulse);

      brainMaterial.emissive.copy(phaseColor).multiplyScalar(active ? 0.060 : 0.026);
      brainMaterial.emissiveIntensity = active ? 0.22 : 0.15;
      stemMaterial.emissive.copy(brainMaterial.emissive);
      stemMaterial.emissiveIntensity = active ? 0.17 : 0.12;

      neural.lineMaterial.color.copy(phaseColor).lerp(warmWhite, 0.16);
      neural.lineMaterial.opacity = active ? 0.50 : 0.34;
      neural.pointMaterial.color.copy(phaseColor).lerp(warmWhite, 0.34);
      neural.pointMaterial.opacity = active ? 0.92 : 0.76;
      neural.pointMaterial.size = active ? 0.029 : 0.023;

      rings.forEach((ring, index) => {
        ring.rotation.z = time * (index % 2 ? -0.075 : 0.058) + index * 0.42;
        const material = ring.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = active
          ? (index % 2 ? 0.22 : 0.28)
          : (index % 2 ? 0.15 : 0.21);
      });

      scanRing.position.y = Math.sin(time * 0.54) * 1.20;
      scanMaterial.color.copy(phaseColor).lerp(warmWhite, 0.14);
      scanMaterial.opacity = active ? 0.056 : 0.026;

      dust.rotation.y = time * 0.020;
      dustMaterial.opacity = active ? 0.23 : 0.16;
      innerReflection.rotation.y = Math.sin(time * 0.10) * 0.026;

      controls.update();
      composer.render();
    };

    onStatusChange?.('Real-time 3D cognitive core • WebGL2 • refined cortical fallback • restrained layered glass');
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      composer.dispose();
      environment.dispose();
      cortexBump?.dispose();

      scene.traverse((object) => {
        const renderable = object as THREE.Mesh & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        renderable.geometry?.dispose?.();
        const materials = renderable.material
          ? (Array.isArray(renderable.material) ? renderable.material : [renderable.material])
          : [];
        materials.forEach((material) => material.dispose());
      });

      neural.pointMaterial.dispose();
      neural.lineMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onStatusChange]);

  return (
    <div
      ref={mountRef}
      className="npc-real-3d-core"
      aria-label="Real-time 3D cognitive core viewport"
    >
      <div className="npc-real-3d-badge">REAL-TIME 3D • REFINED LAYERED GLASS</div>
      <div className="npc-real-3d-phase">{phaseLabel(phase)}</div>
    </div>
  );
};

export default CognitiveCore3DViewport;
