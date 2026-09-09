import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
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

function createFoldedEllipsoid(
  radius: number,
  scale: THREE.Vector3,
  offset: THREE.Vector3,
  sideSeed: number,
  detail = 0,
) {
  const geometry = new THREE.SphereGeometry(radius, 72, 52);
  const position = geometry.attributes.position as THREE.BufferAttribute;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const length = Math.max(Math.hypot(x, y, z), 0.0001);
    const azimuth = Math.atan2(z, x);
    const polar = Math.acos(THREE.MathUtils.clamp(y / length, -1, 1));

    const primary =
      Math.sin(azimuth * (8.5 + detail * 0.35) + sideSeed * 0.8 + Math.sin(polar * 3.0) * 1.2) *
      Math.sin(polar * (10.5 + detail * 0.25));
    const secondary = Math.sin(azimuth * 17.0 - polar * 7.5 + sideSeed * 1.7);
    const tertiary = Math.cos(azimuth * 5.5 + polar * 15.0 + sideSeed * 0.4);
    const fold = 1 + primary * 0.055 + secondary * 0.024 + tertiary * 0.012;

    position.setXYZ(
      index,
      x * scale.x * fold + offset.x,
      y * scale.y * fold + offset.y,
      z * scale.z * fold + offset.z,
    );
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function disposeChildren(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children.pop();
    if (!child) continue;
    child.parent = null;

    const mesh = child as THREE.Mesh;
    const line = child as THREE.LineSegments;
    const points = child as THREE.Points;
    mesh.geometry?.dispose?.();
    line.geometry?.dispose?.();
    points.geometry?.dispose?.();
  }
}

function rebuildSurfaceNetwork(
  meshes: THREE.Mesh[],
  brainRoot: THREE.Group,
  overlay: THREE.Group,
  lineMaterial: THREE.LineBasicMaterial,
  pointMaterial: THREE.PointsMaterial,
) {
  disposeChildren(overlay);
  if (!meshes.length) return;

  brainRoot.updateMatrixWorld(true);
  meshes.forEach((mesh) => mesh.updateMatrixWorld(true));

  const usableMeshes = meshes.filter((mesh) => {
    const position = mesh.geometry?.getAttribute('position');
    return Boolean(position && position.count >= 3);
  });
  if (!usableMeshes.length) return;

  const samplers = usableMeshes.map((mesh) => ({
    mesh,
    sampler: new MeshSurfaceSampler(mesh).build(),
  }));

  const sampleCount = 74;
  const sampled: THREE.Vector3[] = [];
  const temporary = new THREE.Vector3();

  for (let index = 0; index < sampleCount; index += 1) {
    const entry = samplers[index % samplers.length];
    entry.sampler.sample(temporary);
    const point = temporary.clone();
    entry.mesh.localToWorld(point);
    brainRoot.worldToLocal(point);
    sampled.push(point);
  }

  const pointGeometry = new THREE.BufferGeometry().setFromPoints(sampled);
  overlay.add(new THREE.Points(pointGeometry, pointMaterial));

  const connectionPositions: number[] = [];
  const connected = new Set<string>();

  sampled.forEach((point, index) => {
    const nearest = sampled
      .map((other, otherIndex) => ({
        other,
        otherIndex,
        distance: otherIndex === index ? Number.POSITIVE_INFINITY : point.distanceTo(other),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);

    nearest.forEach(({ other, otherIndex, distance }) => {
      if (distance > 0.95) return;
      const low = Math.min(index, otherIndex);
      const high = Math.max(index, otherIndex);
      const key = `${low}:${high}`;
      if (connected.has(key)) return;
      connected.add(key);
      connectionPositions.push(point.x, point.y, point.z, other.x, other.y, other.z);
    });
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
  overlay.add(new THREE.LineSegments(lineGeometry, lineMaterial));
}

function normalizeBrainModel(model: THREE.Object3D) {
  model.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 0.0001);
  const scale = 2.72 / longest;
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);

  bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.position.y += 0.08;
  model.updateMatrixWorld(true);
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
    const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!gl) {
      onStatusChange?.('Real-time 3D unavailable • this browser does not expose WebGL2');
      return;
    }

    let disposed = false;
    let frame = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010610);
    scene.fog = new THREE.FogExp2(0x020916, 0.032);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0.1, 1.34, 7.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.72;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.05).texture;
    scene.environment = environment;
    room.dispose();
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 5.5;
    controls.maxDistance = 9.0;
    controls.minPolarAngle = Math.PI * 0.31;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, 1.28, 0);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.28, 0.90);
    composer.addPass(bloom);

    const root = new THREE.Group();
    root.position.y = 1.22;
    scene.add(root);

    const darkMetal = new THREE.MeshPhysicalMaterial({
      color: 0x06101e,
      metalness: 0.92,
      roughness: 0.16,
      clearcoat: 0.34,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.4,
    });
    const brushedMetal = new THREE.MeshStandardMaterial({
      color: 0x10233b,
      metalness: 0.86,
      roughness: 0.27,
      envMapIntensity: 1.15,
    });
    const glossyFloorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x030914,
      metalness: 0.84,
      roughness: 0.15,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.55,
    });
    const blueEmitter = new THREE.MeshStandardMaterial({
      color: 0x57b9ff,
      emissive: 0x0754c9,
      emissiveIntensity: 0.62,
      metalness: 0.08,
      roughness: 0.28,
    });
    const violetEmitter = new THREE.MeshStandardMaterial({
      color: 0x9c83e8,
      emissive: 0x4c22aa,
      emissiveIntensity: 0.42,
      metalness: 0.08,
      roughness: 0.30,
    });

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.62, 0.34, 64), darkMetal);
    platform.position.y = -2.02;
    platform.receiveShadow = true;
    root.add(platform);

    const platformInset = new THREE.Mesh(
      new THREE.CylinderGeometry(2.13, 2.27, 0.11, 64),
      brushedMetal,
    );
    platformInset.position.y = -1.80;
    root.add(platformInset);

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.26, 64), darkMetal);
    topCap.position.y = 2.03;
    root.add(topCap);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa7d8ff,
      roughness: 0.045,
      metalness: 0,
      transmission: 0.985,
      thickness: 0.24,
      ior: 1.34,
      clearcoat: 1,
      clearcoatRoughness: 0.035,
      envMapIntensity: 2.2,
      attenuationColor: new THREE.Color(0x72bfff),
      attenuationDistance: 5.5,
      side: THREE.FrontSide,
      depthWrite: false,
    });

    const innerGlassMaterial = glassMaterial.clone();
    innerGlassMaterial.side = THREE.BackSide;
    innerGlassMaterial.thickness = 0.08;
    innerGlassMaterial.roughness = 0.025;
    innerGlassMaterial.envMapIntensity = 1.65;

    const outerGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(2.12, 2.12, 3.72, 96, 1, true),
      glassMaterial,
    );
    outerGlass.renderOrder = 3;
    root.add(outerGlass);

    const innerGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(2.00, 2.00, 3.60, 96, 1, true),
      innerGlassMaterial,
    );
    innerGlass.renderOrder = 2;
    root.add(innerGlass);

    const glassCapMaterial = glassMaterial.clone();
    glassCapMaterial.transmission = 0.94;
    glassCapMaterial.thickness = 0.10;
    glassCapMaterial.roughness = 0.07;

    const glassTop = new THREE.Mesh(new THREE.CircleGeometry(2.10, 96), glassCapMaterial);
    glassTop.rotation.x = Math.PI / 2;
    glassTop.position.y = 1.86;
    glassTop.renderOrder = 2;
    root.add(glassTop);

    const glassBottom = glassTop.clone();
    glassBottom.rotation.x = -Math.PI / 2;
    glassBottom.position.y = -1.72;
    root.add(glassBottom);

    const glintMaterial = new THREE.MeshBasicMaterial({
      color: 0xdff7ff,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    [
      { x: -1.34, width: 0.14, opacity: 0.06 },
      { x: 1.22, width: 0.08, opacity: 0.04 },
      { x: -0.38, width: 0.035, opacity: 0.025 },
    ].forEach(({ x, width, opacity }, index) => {
      const material = glintMaterial.clone();
      material.opacity = opacity;
      const glint = new THREE.Mesh(new THREE.PlaneGeometry(width, 3.20), material);
      glint.position.set(x, 0.04, 2.075);
      glint.rotation.y = index === 1 ? 0.07 : -0.08;
      glint.renderOrder = 5;
      root.add(glint);
    });

    const rings: THREE.Mesh[] = [];
    [-1.68, -1.50, 1.57, 1.76].forEach((y, index) => {
      const material = (index % 2 === 0 ? blueEmitter : violetEmitter).clone();
      material.emissiveIntensity = index % 2 === 0 ? 0.44 : 0.28;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(index % 2 === 0 ? 2.18 : 1.96, 0.018, 10, 112),
        material,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      root.add(ring);
      rings.push(ring);
    });

    const railMaterial = darkMetal.clone();
    railMaterial.color.setHex(0x071322);
    railMaterial.roughness = 0.22;

    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.052, 3.48, 0.052), railMaterial);
      rail.position.set(Math.cos(angle) * 2.08, 0.01, Math.sin(angle) * 2.08);
      root.add(rail);

      const trimMaterial = (index % 2 ? violetEmitter : blueEmitter).clone();
      trimMaterial.emissiveIntensity = 0.16;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.012, 3.18, 0.012), trimMaterial);
      trim.position.set(Math.cos(angle) * 2.055, 0.01, Math.sin(angle) * 2.055);
      root.add(trim);
    }

    const scanMaterial = new THREE.MeshBasicMaterial({
      color: 0x4fc3ff,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const scanRing = new THREE.Mesh(new THREE.RingGeometry(0.48, 1.86, 80), scanMaterial);
    scanRing.rotation.x = -Math.PI / 2;
    scanRing.renderOrder = 4;
    root.add(scanRing);

    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x2098ff,
      transparent: true,
      opacity: 0.032,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 3.35, 16), beamMaterial);
    beam.position.y = 0.02;
    root.add(beam);

    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions: number[] = [];
    for (let index = 0; index < 170; index += 1) {
      const radius = Math.sqrt(Math.random()) * 1.72;
      const angle = Math.random() * Math.PI * 2;
      dustPositions.push(
        Math.cos(angle) * radius,
        -1.45 + Math.random() * 2.92,
        Math.sin(angle) * radius,
      );
    }
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x7ccfff,
      size: 0.022,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    root.add(dust);

    const brain = new THREE.Group();
    brain.position.y = 0.08;
    root.add(brain);

    const fallbackBrain = new THREE.Group();
    brain.add(fallbackBrain);

    const brainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0d4fa9,
      roughness: 0.33,
      metalness: 0.02,
      transmission: 0.10,
      thickness: 0.28,
      clearcoat: 0.72,
      clearcoatRoughness: 0.18,
      emissive: 0x031d52,
      emissiveIntensity: 0.18,
      envMapIntensity: 1.35,
    });

    const fallbackMeshes: THREE.Mesh[] = [];
    ([-1, 1] as const).forEach((side) => {
      const hemisphere = new THREE.Mesh(
        createFoldedEllipsoid(
          1,
          new THREE.Vector3(0.78, 0.86, 1.04),
          new THREE.Vector3(side * 0.62, 0.16, 0.02),
          side,
          1,
        ),
        brainMaterial,
      );
      hemisphere.castShadow = true;
      fallbackBrain.add(hemisphere);
      fallbackMeshes.push(hemisphere);

      const cerebellum = new THREE.Mesh(
        createFoldedEllipsoid(
          0.66,
          new THREE.Vector3(0.68, 0.56, 0.78),
          new THREE.Vector3(side * 0.34, -0.58, -0.72),
          side * 2.3,
          4,
        ),
        brainMaterial,
      );
      cerebellum.castShadow = true;
      fallbackBrain.add(cerebellum);
      fallbackMeshes.push(cerebellum);
    });

    const stemMaterial = brainMaterial.clone();
    stemMaterial.color.setHex(0x0a428f);
    stemMaterial.roughness = 0.42;
    stemMaterial.emissiveIntensity = 0.11;
    const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.78, 6, 14), stemMaterial);
    stem.position.set(0.08, -0.93, -0.25);
    stem.rotation.z = -0.14;
    fallbackBrain.add(stem);
    fallbackMeshes.push(stem);

    const neuralOverlay = new THREE.Group();
    neuralOverlay.renderOrder = 4;
    brain.add(neuralOverlay);

    const neuralLineMaterial = new THREE.LineBasicMaterial({
      color: 0x66c8ff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: true,
    });
    const neuralPointMaterial = new THREE.PointsMaterial({
      color: 0xb2e7ff,
      size: 0.045,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: true,
    });

    fallbackBrain.updateMatrixWorld(true);
    rebuildSurfaceNetwork(
      fallbackMeshes,
      brain,
      neuralOverlay,
      neuralLineMaterial,
      neuralPointMaterial,
    );

    const realBrain = new THREE.Group();
    realBrain.visible = false;
    brain.add(realBrain);

    const realBrainMaterial = brainMaterial.clone();
    realBrainMaterial.color.setHex(0x0a55b6);
    realBrainMaterial.roughness = 0.30;
    realBrainMaterial.clearcoat = 0.82;
    realBrainMaterial.clearcoatRoughness = 0.15;
    realBrainMaterial.transmission = 0.16;
    realBrainMaterial.thickness = 0.40;
    realBrainMaterial.envMapIntensity = 1.55;

    const loader = new GLTFLoader();
    loader.load(
      BRAIN_MODEL_URL,
      (gltf) => {
        if (disposed) return;

        const model = gltf.scene;
        normalizeBrainModel(model);

        const meshes: THREE.Mesh[] = [];
        model.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh || !mesh.geometry) return;
          mesh.material = realBrainMaterial;
          mesh.castShadow = true;
          mesh.receiveShadow = false;
          meshes.push(mesh);
        });

        realBrain.add(model);
        realBrain.visible = true;
        fallbackBrain.visible = false;
        realBrain.updateMatrixWorld(true);

        rebuildSurfaceNetwork(
          meshes,
          brain,
          neuralOverlay,
          neuralLineMaterial,
          neuralPointMaterial,
        );

        onStatusChange?.('Real-time 3D cognitive core • WebGL2 • anatomical brain mesh • physical glass');
      },
      undefined,
      () => {
        if (disposed) return;
        onStatusChange?.(
          'Real-time 3D cognitive core • WebGL2 • folded anatomical fallback • add /public/models/brain.glb for final mesh',
        );
      },
    );

    const lab = new THREE.Group();
    scene.add(lab);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 22), glossyFloorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.98;
    floor.receiveShadow = true;
    lab.add(floor);

    for (const side of [-1, 1] as const) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(3.15, 5.2, 0.28), brushedMetal);
      wall.position.set(side * 5.0, 1.38, -2.95);
      wall.rotation.y = side * -0.12;
      lab.add(wall);

      const screenMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x020813,
        emissive: 0x03142b,
        emissiveIntensity: 0.20,
        roughness: 0.18,
        metalness: 0.12,
        clearcoat: 0.52,
        clearcoatRoughness: 0.18,
      });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 2.78), screenMaterial);
      screen.position.set(side * 4.82, 1.54, -2.74);
      screen.rotation.y = side * -0.12;
      lab.add(screen);

      for (let row = 0; row < 5; row += 1) {
        const stripMaterial = (row % 2 ? violetEmitter : blueEmitter).clone();
        stripMaterial.emissiveIntensity = row === 2 ? 0.38 : 0.22;
        const strip = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.024, 0.05), stripMaterial);
        strip.position.set(side * 4.80, 0.24 + row * 0.72, -2.66);
        strip.rotation.y = side * -0.12;
        lab.add(strip);
      }
    }

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(9.8, 5.8, 0.32), brushedMetal);
    backWall.position.set(0, 1.45, -4.40);
    lab.add(backWall);

    for (let column = -3; column <= 3; column += 1) {
      const material = blueEmitter.clone();
      material.emissiveIntensity = column === 0 ? 0.28 : 0.12;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.025, 3.6, 0.05), material);
      strip.position.set(column * 1.1, 1.35, -4.20);
      lab.add(strip);
    }

    const grid = new THREE.GridHelper(20, 44, 0x1d5cc9, 0x122440);
    grid.position.y = -0.955;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.09;
    });
    lab.add(grid);

    scene.add(new THREE.HemisphereLight(0x82b6ff, 0x01030a, 0.16));

    const key = new THREE.SpotLight(0xcceaff, 1.65, 18, Math.PI / 5, 0.72, 1.3);
    key.position.set(4.4, 6.6, 5.0);
    key.target.position.set(0, 1.25, 0);
    key.castShadow = true;
    scene.add(key, key.target);

    const leftRim = new THREE.PointLight(0x168cff, 1.45, 8.5, 1.9);
    leftRim.position.set(-3.5, 2.1, 1.9);
    scene.add(leftRim);

    const rightRim = new THREE.PointLight(0x7141d8, 0.95, 8.0, 1.9);
    rightRim.position.set(3.2, 2.7, 1.0);
    scene.add(rightRim);

    const backRim = new THREE.PointLight(0x39b8ff, 1.85, 8.0, 2.0);
    backRim.position.set(0, 1.8, -2.6);
    scene.add(backRim);

    const lowerGlow = new THREE.PointLight(0x176bff, 1.0, 5.0, 2.0);
    lowerGlow.position.set(0, -0.52, 0.6);
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

    onStatusChange?.(
      'Real-time 3D cognitive core • WebGL2 • physical blue glass • anatomical mesh loader ready',
    );

    const clock = new THREE.Clock();
    const warmWhite = new THREE.Color(0xd8f3ff);

    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      const currentPhase = phaseRef.current;
      const phaseColor = new THREE.Color(PHASE_COLORS[currentPhase]);
      const active = currentPhase !== 'idle';

      const pulse = 1 + Math.sin(time * (active ? 3.0 : 1.45)) * (active ? 0.012 : 0.004);
      brain.rotation.y = Math.sin(time * 0.20) * 0.055;
      brain.rotation.x = Math.sin(time * 0.15) * 0.012;
      brain.scale.setScalar(pulse);

      const emissive = phaseColor.clone().multiplyScalar(active ? 0.16 : 0.085);
      brainMaterial.emissive.copy(emissive);
      brainMaterial.emissiveIntensity = active ? 0.28 : 0.16;
      realBrainMaterial.emissive.copy(emissive);
      realBrainMaterial.emissiveIntensity = active ? 0.30 : 0.17;
      stemMaterial.emissive.copy(emissive);
      stemMaterial.emissiveIntensity = active ? 0.20 : 0.10;

      neuralLineMaterial.color.copy(phaseColor).lerp(warmWhite, 0.18);
      neuralLineMaterial.opacity = active ? 0.34 : 0.22;
      neuralPointMaterial.color.copy(phaseColor).lerp(warmWhite, 0.34);
      neuralPointMaterial.opacity = active ? 0.76 : 0.58;
      neuralPointMaterial.size = active ? 0.050 : 0.043;

      rings.forEach((ring, index) => {
        ring.rotation.z = time * (index % 2 ? -0.10 : 0.08) + index * 0.48;
        const material = ring.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = active
          ? (index % 2 ? 0.38 : 0.48)
          : (index % 2 ? 0.24 : 0.32);
      });

      scanRing.position.y = Math.sin(time * 0.62) * 1.34;
      scanMaterial.opacity = active ? 0.078 : 0.044;
      scanMaterial.color.copy(phaseColor).lerp(warmWhite, 0.14);

      beamMaterial.color.copy(phaseColor);
      beamMaterial.opacity = active ? 0.052 : 0.028;

      dust.rotation.y = time * 0.025;
      dustMaterial.opacity = active ? 0.34 : 0.24;

      controls.update();
      composer.render();
    };

    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      composer.dispose();
      environment.dispose();

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => material?.dispose());
      });

      neuralLineMaterial.dispose();
      neuralPointMaterial.dispose();
      dustMaterial.dispose();
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
      <div className="npc-real-3d-badge">REAL-TIME 3D • PHYSICAL GLASS</div>
      <div className="npc-real-3d-phase">{phaseLabel(phase)}</div>
    </div>
  );
};

export default CognitiveCore3DViewport;
