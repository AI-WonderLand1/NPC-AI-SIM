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

function createCortexLobe(side: -1 | 1) {
  const geometry = new THREE.SphereGeometry(1, 96, 68);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const length = Math.max(Math.hypot(x, y, z), 0.0001);
    const azimuth = Math.atan2(z, x);
    const polar = Math.acos(THREE.MathUtils.clamp(y / length, -1, 1));

    const waveA = Math.sin(azimuth * 10.5 + polar * 6.2 + side * 0.8);
    const waveB = Math.sin(azimuth * 19.0 - polar * 8.8 + side * 1.6);
    const waveC = Math.cos(azimuth * 7.2 + polar * 15.4 - side * 0.7);
    const narrowSulcus = -0.060 * Math.pow(1 - Math.abs(waveA), 5);
    const fineSulcus = -0.030 * Math.pow(1 - Math.abs(waveB), 7);
    const fold = 1 + waveA * 0.060 + waveB * 0.026 + waveC * 0.014 + narrowSulcus + fineSulcus;

    position.setXYZ(
      index,
      x * 0.69 * fold + side * 0.50,
      y * 0.82 * fold + 0.16,
      z * 0.92 * fold + 0.10,
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createCerebellum(side: -1 | 1) {
  const geometry = new THREE.SphereGeometry(0.58, 72, 48);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const waveA = Math.sin((x + z) * 17 + side * 0.7);
    const waveB = Math.cos((y - z) * 21 - side);
    const groove = -0.028 * Math.pow(1 - Math.abs(waveA), 6);
    const fold = 1 + waveA * 0.032 + waveB * 0.014 + groove;

    position.setXYZ(
      index,
      x * 0.62 * fold + side * 0.28,
      y * 0.46 * fold - 0.60,
      z * 0.70 * fold - 0.57,
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
  model.scale.multiplyScalar(2.30 / longest);
  model.updateMatrixWorld(true);

  bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.position.y += 0.04;
  model.position.z += 0.22;
}

function makeNeuralOverlay() {
  const points: THREE.Vector3[] = [];

  for (let index = 0; index < 72; index += 1) {
    const side: -1 | 1 = index % 2 === 0 ? -1 : 1;
    const theta = ((index * 0.61803398875) % 1) * Math.PI * 2;
    const phi = 0.30 + (((index * 0.38196601125) % 1) * Math.PI * 0.67);
    const x = side * 0.48 + Math.cos(theta) * Math.sin(phi) * 0.56;
    const y = 0.16 + Math.cos(phi) * 0.71;
    const z = 0.11 + Math.sin(theta) * Math.sin(phi) * 0.78;
    points.push(new THREE.Vector3(x, y, z));
  }

  const pointGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const pointMaterial = new THREE.PointsMaterial({
    color: 0xc8f3ff,
    size: 0.036,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const connectionPositions: number[] = [];
  const linked = new Set<string>();

  points.forEach((point, index) => {
    const nearest = points
      .map((other, otherIndex) => ({ other, otherIndex, distance: point.distanceTo(other) }))
      .filter(({ otherIndex }) => otherIndex !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    nearest.forEach(({ other, otherIndex, distance }) => {
      if (distance > 0.67) return;
      const key = `${Math.min(index, otherIndex)}:${Math.max(index, otherIndex)}`;
      if (linked.has(key)) return;
      linked.add(key);
      connectionPositions.push(point.x, point.y, point.z, other.x, other.y, other.z);
    });
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x62cbff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const group = new THREE.Group();
  group.renderOrder = 12;
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
    scene.fog = new THREE.FogExp2(0x020713, 0.024);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0.15, 1.26, 7.55);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.62;
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
    controls.minDistance = 5.8;
    controls.maxDistance = 9.0;
    controls.minPolarAngle = Math.PI * 0.31;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, 1.22, 0.20);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.11, 0.18, 0.96);
    composer.addPass(bloom);

    const root = new THREE.Group();
    root.position.y = 1.17;
    scene.add(root);

    const darkMetal = new THREE.MeshPhysicalMaterial({
      color: 0x060d17,
      metalness: 0.94,
      roughness: 0.20,
      clearcoat: 0.40,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.25,
    });

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.62, 0.32, 64), darkMetal);
    platform.position.y = -2.03;
    platform.receiveShadow = true;
    root.add(platform);

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.22, 64), darkMetal);
    topCap.position.y = 2.02;
    root.add(topCap);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x64c8ff,
      emissive: 0x0754b8,
      emissiveIntensity: 0.30,
      roughness: 0.26,
      metalness: 0.08,
    });

    const rings: THREE.Mesh[] = [];
    [-1.70, -1.52, 1.57, 1.76].forEach((y, index) => {
      const material = ringMaterial.clone();
      if (index % 2) {
        material.color.setHex(0x8f78ff);
        material.emissive.setHex(0x3b2192);
        material.emissiveIntensity = 0.22;
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(index % 2 ? 1.95 : 2.17, 0.016, 10, 112), material);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      root.add(ring);
      rings.push(ring);
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf2fbff,
      roughness: 0.024,
      metalness: 0,
      transmission: 0.992,
      thickness: 0.075,
      ior: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.025,
      envMapIntensity: 1.35,
      attenuationColor: new THREE.Color(0x86cfff),
      attenuationDistance: 8.5,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(2.10, 2.10, 3.70, 112, 1, true),
      glassMaterial,
    );
    glass.renderOrder = 8;
    root.add(glass);

    const innerReflectionMaterial = new THREE.MeshBasicMaterial({
      color: 0x5fbfff,
      transparent: true,
      opacity: 0.028,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const innerReflection = new THREE.Mesh(
      new THREE.CylinderGeometry(2.02, 2.02, 3.58, 112, 1, true),
      innerReflectionMaterial,
    );
    innerReflection.renderOrder = 7;
    root.add(innerReflection);

    const reflectionMaterial = new THREE.MeshBasicMaterial({
      color: 0xe9fbff,
      transparent: true,
      opacity: 0.032,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    [
      { x: -1.32, width: 0.08, angle: -0.06 },
      { x: 1.26, width: 0.055, angle: 0.05 },
      { x: -0.46, width: 0.026, angle: -0.02 },
    ].forEach(({ x, width, angle }) => {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(width, 3.02), reflectionMaterial.clone());
      strip.position.set(x, 0.03, 2.075);
      strip.rotation.y = angle;
      strip.renderOrder = 10;
      root.add(strip);
    });

    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.040, 3.40, 0.040), darkMetal);
      rail.position.set(Math.cos(angle) * 2.08, 0.02, Math.sin(angle) * 2.08);
      root.add(rail);
    }

    const brainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x071b36,
      roughness: 0.23,
      metalness: 0.02,
      transmission: 0,
      clearcoat: 0.84,
      clearcoatRoughness: 0.13,
      emissive: 0x03152f,
      emissiveIntensity: 0.16,
      envMapIntensity: 1.55,
    });

    const brain = new THREE.Group();
    brain.position.set(0, 0.05, 0.24);
    brain.scale.setScalar(0.92);
    root.add(brain);

    const fallbackBrain = new THREE.Group();
    fallbackBrain.visible = true;
    brain.add(fallbackBrain);

    ([-1, 1] as const).forEach((side) => {
      const lobeGeometry = createCortexLobe(side);
      const lobe = new THREE.Mesh(lobeGeometry, brainMaterial);
      lobe.castShadow = true;
      fallbackBrain.add(lobe);

      const cortexSheen = new THREE.Mesh(
        lobeGeometry.clone(),
        new THREE.MeshBasicMaterial({
          color: 0x2c8be8,
          transparent: true,
          opacity: 0.035,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.FrontSide,
        }),
      );
      cortexSheen.scale.setScalar(1.008);
      cortexSheen.renderOrder = 6;
      fallbackBrain.add(cortexSheen);

      const cerebellum = new THREE.Mesh(createCerebellum(side), brainMaterial);
      cerebellum.castShadow = true;
      fallbackBrain.add(cerebellum);
    });

    const stemMaterial = brainMaterial.clone();
    stemMaterial.color.setHex(0x0b2b52);
    stemMaterial.emissiveIntensity = 0.13;
    const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.62, 6, 14), stemMaterial);
    stem.position.set(0.05, -0.91, -0.18);
    stem.rotation.z = -0.10;
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
        onStatusChange?.('Real-time 3D cognitive core • WebGL2 • anatomical brain mesh • clear physical glass');
      },
      undefined,
      () => {
        if (disposed) return;
        fallbackBrain.visible = true;
        onStatusChange?.('Real-time 3D cognitive core • WebGL2 • detailed folded fallback • add /public/models/brain.glb for final anatomical mesh');
      },
    );

    const scanMaterial = new THREE.MeshBasicMaterial({
      color: 0x54c8ff,
      transparent: true,
      opacity: 0.042,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const scanRing = new THREE.Mesh(new THREE.RingGeometry(0.48, 1.72, 96), scanMaterial);
    scanRing.rotation.x = -Math.PI / 2;
    scanRing.renderOrder = 9;
    root.add(scanRing);

    const dustPositions: number[] = [];
    for (let index = 0; index < 190; index += 1) {
      const radius = Math.sqrt(Math.random()) * 1.74;
      const angle = Math.random() * Math.PI * 2;
      dustPositions.push(
        Math.cos(angle) * radius,
        -1.44 + Math.random() * 2.90,
        Math.sin(angle) * radius,
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x82d9ff,
      size: 0.018,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    root.add(dust);

    const floorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x020812,
      metalness: 0.86,
      roughness: 0.16,
      clearcoat: 0.60,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.45,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.98;
    floor.receiveShadow = true;
    scene.add(floor);

    const backMaterial = new THREE.MeshStandardMaterial({
      color: 0x071221,
      metalness: 0.82,
      roughness: 0.34,
    });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.2, 5.9, 0.32), backMaterial);
    backWall.position.set(0, 1.45, -4.45);
    scene.add(backWall);

    for (const x of [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6]) {
      const stripMaterial = ringMaterial.clone();
      stripMaterial.emissiveIntensity = x === 0 ? 0.16 : 0.075;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 3.65, 0.04), stripMaterial);
      strip.position.set(x, 1.34, -4.25);
      scene.add(strip);
    }

    for (const side of [-1, 1] as const) {
      const consolePanel = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 3.2, 0.20),
        new THREE.MeshStandardMaterial({ color: 0x07111d, metalness: 0.68, roughness: 0.31 }),
      );
      consolePanel.position.set(side * 4.15, 1.18, -3.25);
      consolePanel.rotation.y = side * -0.10;
      scene.add(consolePanel);

      for (let row = 0; row < 4; row += 1) {
        const indicatorMaterial = ringMaterial.clone();
        indicatorMaterial.emissiveIntensity = 0.11 + row * 0.015;
        const indicator = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.018, 0.035), indicatorMaterial);
        indicator.position.set(side * 4.05, 0.45 + row * 0.55, -3.08);
        indicator.rotation.y = side * -0.10;
        scene.add(indicator);
      }
    }

    scene.add(new THREE.HemisphereLight(0x789dca, 0x010307, 0.18));

    const key = new THREE.SpotLight(0x7fc8ff, 0.34, 16, Math.PI / 5.5, 0.92, 1.4);
    key.position.set(3.8, 4.9, 3.1);
    key.target.position.set(0, 1.25, 0.22);
    key.castShadow = true;
    scene.add(key, key.target);

    const brainFill = new THREE.PointLight(0x2b8fff, 0.78, 5.4, 2.0);
    brainFill.position.set(-1.35, 1.55, 2.25);
    scene.add(brainFill);

    const brainRim = new THREE.PointLight(0x7b55ff, 0.55, 5.2, 2.0);
    brainRim.position.set(1.8, 2.0, -0.65);
    scene.add(brainRim);

    const backRim = new THREE.PointLight(0x2db7ff, 0.82, 7.0, 2.0);
    backRim.position.set(0, 1.6, -2.65);
    scene.add(backRim);

    const lowerGlow = new THREE.PointLight(0x1765d8, 0.38, 4.5, 2.0);
    lowerGlow.position.set(0, -0.55, 0.6);
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
    const warmWhite = new THREE.Color(0xe0f7ff);

    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      const currentPhase = phaseRef.current;
      const phaseColor = new THREE.Color(PHASE_COLORS[currentPhase]);
      const active = currentPhase !== 'idle';

      const pulse = 1 + Math.sin(time * (active ? 3.0 : 1.45)) * (active ? 0.010 : 0.004);
      brain.rotation.y = Math.sin(time * 0.18) * 0.055;
      brain.rotation.x = Math.sin(time * 0.13) * 0.012;
      brain.scale.setScalar(0.92 * pulse);

      brainMaterial.emissive.copy(phaseColor).multiplyScalar(active ? 0.070 : 0.035);
      brainMaterial.emissiveIntensity = active ? 0.24 : 0.16;
      stemMaterial.emissive.copy(brainMaterial.emissive);
      stemMaterial.emissiveIntensity = active ? 0.19 : 0.13;

      neural.lineMaterial.color.copy(phaseColor).lerp(warmWhite, 0.22);
      neural.lineMaterial.opacity = active ? 0.58 : 0.40;
      neural.pointMaterial.color.copy(phaseColor).lerp(warmWhite, 0.42);
      neural.pointMaterial.opacity = active ? 0.94 : 0.78;
      neural.pointMaterial.size = active ? 0.041 : 0.034;

      rings.forEach((ring, index) => {
        ring.rotation.z = time * (index % 2 ? -0.085 : 0.065) + index * 0.42;
        const material = ring.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = active
          ? (index % 2 ? 0.28 : 0.36)
          : (index % 2 ? 0.18 : 0.26);
      });

      scanRing.position.y = Math.sin(time * 0.58) * 1.24;
      scanMaterial.color.copy(phaseColor).lerp(warmWhite, 0.18);
      scanMaterial.opacity = active ? 0.070 : 0.038;

      dust.rotation.y = time * 0.022;
      dustMaterial.opacity = active ? 0.30 : 0.22;

      innerReflection.rotation.y = Math.sin(time * 0.12) * 0.035;

      controls.update();
      composer.render();
    };

    onStatusChange?.('Real-time 3D cognitive core • WebGL2 • layered clear glass • dark detailed brain fallback');
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      composer.dispose();
      environment.dispose();

      scene.traverse((object) => {
        const renderable = object as THREE.Mesh & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
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
      <div className="npc-real-3d-badge">REAL-TIME 3D • LAYERED PHYSICAL GLASS</div>
      <div className="npc-real-3d-phase">{phaseLabel(phase)}</div>
    </div>
  );
};

export default CognitiveCore3DViewport;
