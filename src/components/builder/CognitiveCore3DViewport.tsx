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

function createBrainLobe(side: -1 | 1, detail = 0) {
  const geometry = new THREE.SphereGeometry(1, 72, 52);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const length = Math.max(Math.hypot(x, y, z), 0.0001);
    const azimuth = Math.atan2(z, x);
    const polar = Math.acos(THREE.MathUtils.clamp(y / length, -1, 1));

    const foldA = Math.sin(azimuth * 9.4 + polar * 5.8 + side * 0.9);
    const foldB = Math.sin(azimuth * 17.6 - polar * 8.2 + detail * 0.6);
    const foldC = Math.cos(azimuth * 6.2 + polar * 14.4 + side * 1.7);
    const fold = 1 + foldA * 0.062 + foldB * 0.029 + foldC * 0.015;

    position.setXYZ(
      index,
      x * 0.80 * fold + side * 0.60,
      y * 0.88 * fold + 0.13,
      z * 1.04 * fold + 0.12,
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createCerebellum(side: -1 | 1) {
  const geometry = new THREE.SphereGeometry(0.62, 56, 38);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const wave = 1 + Math.sin((x + z) * 13 + side) * 0.045 + Math.cos(y * 16) * 0.025;
    position.setXYZ(
      index,
      x * 0.68 * wave + side * 0.31,
      y * 0.55 * wave - 0.62,
      z * 0.78 * wave - 0.62,
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function normalizeBrainModel(model: THREE.Object3D) {
  model.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 0.0001);
  model.scale.multiplyScalar(2.75 / longest);
  model.updateMatrixWorld(true);

  bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.position.y += 0.05;
  model.position.z += 0.30;
}

function makeNeuralOverlay() {
  const points: THREE.Vector3[] = [];

  for (let index = 0; index < 58; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const u = ((index * 0.61803398875) % 1) * Math.PI * 2;
    const v = 0.35 + (((index * 0.38196601125) % 1) * Math.PI * 0.62);
    const x = side * (0.58 + Math.cos(u) * 0.55 * Math.sin(v));
    const y = 0.14 + Math.cos(v) * 0.76;
    const z = 0.20 + Math.sin(u) * 0.82 * Math.sin(v);
    points.push(new THREE.Vector3(x, y, z));
  }

  const pointGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const pointMaterial = new THREE.PointsMaterial({
    color: 0xb9eaff,
    size: 0.040,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const connections: number[] = [];
  points.forEach((point, index) => {
    const nearest = points
      .map((other, otherIndex) => ({ other, otherIndex, distance: point.distanceTo(other) }))
      .filter(({ otherIndex }) => otherIndex !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);

    nearest.forEach(({ other, distance }) => {
      if (distance > 0.75) return;
      connections.push(point.x, point.y, point.z, other.x, other.y, other.z);
    });
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connections, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x6dcfff,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const group = new THREE.Group();
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
    scene.background = new THREE.Color(0x010610);
    scene.fog = new THREE.FogExp2(0x020916, 0.028);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0.1, 1.30, 7.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.70;
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
    controls.minDistance = 5.6;
    controls.maxDistance = 8.8;
    controls.minPolarAngle = Math.PI * 0.31;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, 1.24, 0.20);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.20, 0.22, 0.93);
    composer.addPass(bloom);

    const root = new THREE.Group();
    root.position.y = 1.18;
    scene.add(root);

    const darkMetal = new THREE.MeshPhysicalMaterial({
      color: 0x07101c,
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 0.36,
      clearcoatRoughness: 0.17,
      envMapIntensity: 1.35,
    });

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.62, 0.34, 64), darkMetal);
    platform.position.y = -2.02;
    platform.receiveShadow = true;
    root.add(platform);

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.25, 64), darkMetal);
    topCap.position.y = 2.03;
    root.add(topCap);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb8e4ff,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.94,
      thickness: 0.18,
      ior: 1.36,
      clearcoat: 1,
      clearcoatRoughness: 0.035,
      envMapIntensity: 1.85,
      attenuationColor: new THREE.Color(0x7ec8ff),
      attenuationDistance: 6.0,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(2.10, 2.10, 3.70, 96, 1, true),
      glassMaterial,
    );
    glass.renderOrder = 8;
    root.add(glass);

    const glintMaterial = new THREE.MeshBasicMaterial({
      color: 0xe7f8ff,
      transparent: true,
      opacity: 0.045,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    [-1.28, 1.18].forEach((x, index) => {
      const glint = new THREE.Mesh(new THREE.PlaneGeometry(index === 0 ? 0.12 : 0.08, 3.05), glintMaterial.clone());
      glint.position.set(x, 0.04, 2.07);
      glint.rotation.y = index === 0 ? -0.08 : 0.07;
      glint.renderOrder = 9;
      root.add(glint);
    });

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x6ecbff,
      emissive: 0x0b55c0,
      emissiveIntensity: 0.42,
      roughness: 0.26,
      metalness: 0.08,
    });
    const rings: THREE.Mesh[] = [];
    [-1.70, -1.51, 1.58, 1.77].forEach((y, index) => {
      const material = ringMaterial.clone();
      if (index % 2) {
        material.color.setHex(0x927cff);
        material.emissive.setHex(0x4320a4);
        material.emissiveIntensity = 0.28;
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(index % 2 ? 1.95 : 2.17, 0.018, 10, 112), material);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      root.add(ring);
      rings.push(ring);
    });

    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 3.44, 0.045), darkMetal);
      rail.position.set(Math.cos(angle) * 2.08, 0.02, Math.sin(angle) * 2.08);
      root.add(rail);
    }

    const brainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2e79cf,
      roughness: 0.35,
      metalness: 0.01,
      transmission: 0,
      clearcoat: 0.68,
      clearcoatRoughness: 0.19,
      emissive: 0x083b84,
      emissiveIntensity: 0.30,
      envMapIntensity: 1.55,
    });

    const brain = new THREE.Group();
    brain.position.set(0, 0.06, 0.30);
    brain.scale.setScalar(1.08);
    root.add(brain);

    const fallbackBrain = new THREE.Group();
    fallbackBrain.visible = true;
    brain.add(fallbackBrain);

    ([-1, 1] as const).forEach((side) => {
      const lobe = new THREE.Mesh(createBrainLobe(side, side), brainMaterial);
      lobe.castShadow = true;
      fallbackBrain.add(lobe);

      const cerebellum = new THREE.Mesh(createCerebellum(side), brainMaterial);
      cerebellum.castShadow = true;
      fallbackBrain.add(cerebellum);
    });

    const stemMaterial = brainMaterial.clone();
    stemMaterial.color.setHex(0x245ea6);
    stemMaterial.emissiveIntensity = 0.20;
    const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.72, 6, 14), stemMaterial);
    stem.position.set(0.07, -0.93, -0.20);
    stem.rotation.z = -0.12;
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
          mesh.material = brainMaterial.clone();
          mesh.castShadow = true;
          mesh.receiveShadow = false;
        });
        realBrain.add(model);
        realBrain.visible = true;
        fallbackBrain.visible = false;
        onStatusChange?.('Real-time 3D cognitive core • WebGL2 • anatomical brain mesh • physical glass');
      },
      undefined,
      () => {
        if (disposed) return;
        fallbackBrain.visible = true;
        onStatusChange?.('Real-time 3D cognitive core • WebGL2 • visible folded anatomical fallback • add /public/models/brain.glb for final mesh');
      },
    );

    const scanMaterial = new THREE.MeshBasicMaterial({
      color: 0x4fc3ff,
      transparent: true,
      opacity: 0.045,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const scanRing = new THREE.Mesh(new THREE.RingGeometry(0.50, 1.78, 80), scanMaterial);
    scanRing.rotation.x = -Math.PI / 2;
    scanRing.renderOrder = 7;
    root.add(scanRing);

    const dustPositions: number[] = [];
    for (let index = 0; index < 150; index += 1) {
      const radius = Math.sqrt(Math.random()) * 1.68;
      const angle = Math.random() * Math.PI * 2;
      dustPositions.push(Math.cos(angle) * radius, -1.42 + Math.random() * 2.84, Math.sin(angle) * radius);
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x81d5ff,
      size: 0.020,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    root.add(dust);

    const floorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x030a14,
      metalness: 0.82,
      roughness: 0.17,
      clearcoat: 0.58,
      clearcoatRoughness: 0.17,
      envMapIntensity: 1.50,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.98;
    floor.receiveShadow = true;
    scene.add(floor);

    const backMaterial = new THREE.MeshStandardMaterial({ color: 0x0b1728, metalness: 0.82, roughness: 0.32 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 5.8, 0.30), backMaterial);
    backWall.position.set(0, 1.45, -4.35);
    scene.add(backWall);

    for (const x of [-3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3]) {
      const material = ringMaterial.clone();
      material.emissiveIntensity = x === 0 ? 0.22 : 0.10;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.024, 3.7, 0.04), material);
      strip.position.set(x, 1.35, -4.16);
      scene.add(strip);
    }

    scene.add(new THREE.HemisphereLight(0x8bbfff, 0x01030a, 0.25));

    const brainFill = new THREE.PointLight(0x6cc7ff, 1.25, 5.8, 2.0);
    brainFill.position.set(0.4, 1.6, 2.5);
    scene.add(brainFill);

    const brainRim = new THREE.PointLight(0x7252ff, 0.78, 5.0, 2.0);
    brainRim.position.set(-1.8, 2.2, -0.4);
    scene.add(brainRim);

    const key = new THREE.SpotLight(0xd5efff, 0.82, 18, Math.PI / 5, 0.80, 1.3);
    key.position.set(4.8, 6.0, 4.2);
    key.target.position.set(0, 1.25, 0.2);
    key.castShadow = true;
    scene.add(key, key.target);

    const leftRim = new THREE.PointLight(0x168cff, 1.15, 8.0, 1.9);
    leftRim.position.set(-3.4, 2.0, 1.8);
    scene.add(leftRim);

    const backRim = new THREE.PointLight(0x39b8ff, 1.35, 7.5, 2.0);
    backRim.position.set(0, 1.8, -2.5);
    scene.add(backRim);

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
    const warmWhite = new THREE.Color(0xdaf5ff);

    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      const currentPhase = phaseRef.current;
      const phaseColor = new THREE.Color(PHASE_COLORS[currentPhase]);
      const active = currentPhase !== 'idle';

      const pulse = 1 + Math.sin(time * (active ? 3.0 : 1.5)) * (active ? 0.014 : 0.006);
      brain.rotation.y = Math.sin(time * 0.20) * 0.065;
      brain.rotation.x = Math.sin(time * 0.15) * 0.015;
      brain.scale.setScalar(1.08 * pulse);

      brainMaterial.emissive.copy(phaseColor).multiplyScalar(active ? 0.18 : 0.11);
      brainMaterial.emissiveIntensity = active ? 0.42 : 0.30;
      stemMaterial.emissive.copy(brainMaterial.emissive);
      stemMaterial.emissiveIntensity = active ? 0.30 : 0.20;

      neural.lineMaterial.color.copy(phaseColor).lerp(warmWhite, 0.18);
      neural.lineMaterial.opacity = active ? 0.34 : 0.22;
      neural.pointMaterial.color.copy(phaseColor).lerp(warmWhite, 0.34);
      neural.pointMaterial.opacity = active ? 0.78 : 0.60;
      neural.pointMaterial.size = active ? 0.048 : 0.040;

      rings.forEach((ring, index) => {
        ring.rotation.z = time * (index % 2 ? -0.10 : 0.08) + index * 0.42;
      });

      scanRing.position.y = Math.sin(time * 0.62) * 1.30;
      scanMaterial.color.copy(phaseColor).lerp(warmWhite, 0.12);
      scanMaterial.opacity = active ? 0.070 : 0.040;

      dust.rotation.y = time * 0.024;
      dustMaterial.opacity = active ? 0.32 : 0.22;

      controls.update();
      composer.render();
    };

    onStatusChange?.('Real-time 3D cognitive core • WebGL2 • visible brain fallback • physical glass');
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

      neural.pointMaterial.dispose();
      neural.lineMaterial.dispose();
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
