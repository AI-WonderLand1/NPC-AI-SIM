import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { CognitivePhase } from '../../brain/cognitiveModel.js';

interface CognitiveCore3DViewportProps {
  phase: CognitivePhase;
  onStatusChange?: (status: string) => void;
}

const PHASE_COLORS: Record<CognitivePhase, number> = {
  idle: 0x49a8ff,
  perceiving: 0x35e6ff,
  reasoning: 0xa673ff,
  planning: 0x6f88ff,
  acting: 0x2ce79a,
  error: 0xff5f72,
};

const BRAIN_POINTS: Array<[number, number, number, number]> = [
  [-1.05, 0.30, 0.05, 0.52], [-0.86, 0.70, -0.02, 0.47], [-0.55, 0.92, 0.02, 0.45],
  [-0.22, 0.78, 0.05, 0.44], [-1.16, -0.02, 0.02, 0.49], [-0.92, -0.34, 0.04, 0.47],
  [-0.58, -0.55, 0.02, 0.46], [-0.25, -0.42, 0.10, 0.44], [-0.72, 0.22, 0.45, 0.46],
  [-0.50, 0.56, 0.42, 0.41], [-0.78, -0.18, 0.40, 0.42], [-0.37, -0.15, 0.48, 0.40],
  [1.05, 0.30, 0.05, 0.52], [0.86, 0.70, -0.02, 0.47], [0.55, 0.92, 0.02, 0.45],
  [0.22, 0.78, 0.05, 0.44], [1.16, -0.02, 0.02, 0.49], [0.92, -0.34, 0.04, 0.47],
  [0.58, -0.55, 0.02, 0.46], [0.25, -0.42, 0.10, 0.44], [0.72, 0.22, 0.45, 0.46],
  [0.50, 0.56, 0.42, 0.41], [0.78, -0.18, 0.40, 0.42], [0.37, -0.15, 0.48, 0.40],
  [-0.62, 0.36, -0.42, 0.40], [-0.28, 0.20, -0.48, 0.39], [0.62, 0.36, -0.42, 0.40],
  [0.28, 0.20, -0.48, 0.39], [-0.42, -0.30, -0.38, 0.38], [0.42, -0.30, -0.38, 0.38],
];

function phaseLabel(phase: CognitivePhase) {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

function createGyriCurve(side: -1 | 1, band: number) {
  const points: THREE.Vector3[] = [];
  const phase = band * 0.83;
  for (let step = 0; step <= 10; step += 1) {
    const t = step / 10;
    const xBase = 0.18 + t * 0.95;
    const x = side * (xBase + Math.sin(t * Math.PI * 4 + phase) * 0.09);
    const y = 0.84 - t * 1.12 + (band - 2.5) * 0.105 + Math.sin(t * Math.PI * 3 + phase) * 0.095;
    const z = 0.46 + Math.cos(t * Math.PI * 2 + phase) * 0.09 - Math.abs(x) * 0.055;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.42);
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
    scene.background = new THREE.Color(0x020813);
    scene.fog = new THREE.FogExp2(0x020813, 0.035);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0.2, 1.25, 7.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.68;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
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
    controls.minDistance = 5.2;
    controls.maxDistance = 9.2;
    controls.minPolarAngle = Math.PI * 0.30;
    controls.maxPolarAngle = Math.PI * 0.64;
    controls.target.set(0, 1.25, 0);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.22, 0.88);
    composer.addPass(bloom);

    const root = new THREE.Group();
    root.position.y = 1.25;
    scene.add(root);

    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x071426, metalness: 0.94, roughness: 0.18 });
    const brushedMetal = new THREE.MeshStandardMaterial({ color: 0x14263d, metalness: 0.88, roughness: 0.28 });
    const blueEmitter = new THREE.MeshStandardMaterial({
      color: 0x58b7ef,
      emissive: 0x0750b8,
      emissiveIntensity: 0.82,
      metalness: 0.12,
      roughness: 0.22,
    });
    const violetEmitter = new THREE.MeshStandardMaterial({
      color: 0x9078d8,
      emissive: 0x5522b8,
      emissiveIntensity: 0.58,
      metalness: 0.10,
      roughness: 0.24,
    });

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.58, 0.35, 64), darkMetal);
    platform.position.y = -2.03;
    platform.receiveShadow = true;
    root.add(platform);

    const platformInset = new THREE.Mesh(new THREE.CylinderGeometry(2.14, 2.26, 0.12, 64), brushedMetal);
    platformInset.position.y = -1.80;
    root.add(platformInset);

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.28, 64), darkMetal);
    topCap.position.y = 2.05;
    root.add(topCap);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa8dcff,
      metalness: 0,
      roughness: 0.055,
      transmission: 0.985,
      thickness: 0.30,
      ior: 1.45,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.55,
      clearcoat: 1,
      clearcoatRoughness: 0.045,
    });

    const innerGlassMaterial = glassMaterial.clone();
    innerGlassMaterial.opacity = 0.035;
    innerGlassMaterial.roughness = 0.03;
    innerGlassMaterial.thickness = 0.14;

    const outerGlass = new THREE.Mesh(new THREE.CylinderGeometry(2.12, 2.12, 3.72, 72, 1, true), glassMaterial);
    outerGlass.renderOrder = 3;
    root.add(outerGlass);

    const innerGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.96, 1.96, 3.58, 72, 1, true), innerGlassMaterial);
    innerGlass.renderOrder = 2;
    root.add(innerGlass);

    const glassTop = new THREE.Mesh(new THREE.CircleGeometry(2.10, 72), innerGlassMaterial);
    glassTop.rotation.x = Math.PI / 2;
    glassTop.position.y = 1.86;
    glassTop.renderOrder = 2;
    root.add(glassTop);

    const glassBottom = glassTop.clone();
    glassBottom.rotation.x = -Math.PI / 2;
    glassBottom.position.y = -1.72;
    root.add(glassBottom);

    const glintMaterial = new THREE.MeshBasicMaterial({
      color: 0xd9f5ff,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    [-1.26, 1.18].forEach((x, index) => {
      const glint = new THREE.Mesh(new THREE.PlaneGeometry(index === 0 ? 0.16 : 0.10, 3.15), glintMaterial.clone());
      glint.position.set(x, 0.05, 2.08);
      glint.rotation.y = index === 0 ? -0.10 : 0.08;
      glint.renderOrder = 5;
      root.add(glint);
    });

    const rings: THREE.Mesh[] = [];
    [-1.69, -1.50, 1.58, 1.78].forEach((y, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(index % 2 === 0 ? 2.18 : 1.95, 0.022, 12, 112),
        (index % 2 === 0 ? blueEmitter : violetEmitter).clone(),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      root.add(ring);
      rings.push(ring);
    });

    const verticalBars: THREE.Mesh[] = [];
    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
      const barMaterial = (index % 2 ? violetEmitter : blueEmitter).clone();
      barMaterial.emissiveIntensity = 0.18;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.038, 3.42, 0.038), barMaterial);
      bar.position.set(Math.cos(angle) * 2.05, 0.02, Math.sin(angle) * 2.05);
      root.add(bar);
      verticalBars.push(bar);
    }

    const brain = new THREE.Group();
    brain.position.y = 0.10;
    root.add(brain);

    const brainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1760c8,
      roughness: 0.40,
      metalness: 0.015,
      clearcoat: 0.46,
      clearcoatRoughness: 0.24,
      emissive: 0x063b9e,
      emissiveIntensity: 0.34,
      envMapIntensity: 0.78,
    });

    const nodeMaterial = new THREE.MeshStandardMaterial({
      color: 0x74cbef,
      emissive: 0x197ebc,
      emissiveIntensity: 0.30,
      roughness: 0.34,
      metalness: 0.01,
    });
    const pointPositions: THREE.Vector3[] = [];

    BRAIN_POINTS.forEach(([x, y, z, size], index) => {
      const blob = new THREE.Mesh(new THREE.SphereGeometry(size, 28, 20), brainMaterial);
      blob.position.set(x, y, z);
      blob.scale.set(1.18, 0.86 + (index % 3) * 0.05, 0.88);
      blob.castShadow = true;
      brain.add(blob);

      const point = new THREE.Vector3(x, y, z);
      pointPositions.push(point);
      if (index % 3 === 0) {
        const nodeSize = 0.025 + (index % 4) * 0.004;
        const node = new THREE.Mesh(new THREE.SphereGeometry(nodeSize, 10, 7), nodeMaterial);
        node.position.copy(point).multiplyScalar(1.03);
        node.position.z += 0.24;
        brain.add(node);
      }
    });

    const gyriMaterial = new THREE.MeshStandardMaterial({
      color: 0x7bd6ff,
      emissive: 0x1c6fae,
      emissiveIntensity: 0.34,
      roughness: 0.32,
      metalness: 0,
      transparent: true,
      opacity: 0.76,
    });
    const gyriMeshes: THREE.Mesh[] = [];
    ([-1, 1] as const).forEach((side) => {
      for (let band = 0; band < 6; band += 1) {
        const curve = createGyriCurve(side, band);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 42, 0.017, 6, false), gyriMaterial.clone());
        tube.renderOrder = 1;
        brain.add(tube);
        gyriMeshes.push(tube);
      }
    });

    const fissureMaterial = new THREE.MeshStandardMaterial({
      color: 0x031a3d,
      emissive: 0x020a18,
      emissiveIntensity: 0.04,
      roughness: 0.72,
      metalness: 0,
    });
    const fissureCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.98, 0.52),
      new THREE.Vector3(-0.035, 0.62, 0.58),
      new THREE.Vector3(0.028, 0.28, 0.59),
      new THREE.Vector3(-0.025, -0.10, 0.56),
      new THREE.Vector3(0.018, -0.46, 0.49),
    ]);
    brain.add(new THREE.Mesh(new THREE.TubeGeometry(fissureCurve, 40, 0.028, 7, false), fissureMaterial));

    const connectionPositions: number[] = [];
    pointPositions.forEach((point, index) => {
      const candidates = pointPositions
        .map((other, otherIndex) => ({ other, otherIndex, distance: point.distanceTo(other) }))
        .filter(({ otherIndex }) => otherIndex > index)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);
      candidates.forEach(({ other }) => {
        connectionPositions.push(point.x, point.y, point.z, other.x, other.y, other.z);
      });
    });
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x5ba4cb,
      transparent: true,
      opacity: 0.26,
      toneMapped: true,
    });
    const connections = new THREE.LineSegments(lineGeometry, lineMaterial);
    brain.add(connections);

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x5fbfe5,
      emissive: 0x15679f,
      emissiveIntensity: 0.32,
      roughness: 0.34,
      metalness: 0.01,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), coreMaterial);
    brain.add(core);

    const stemMaterial = brainMaterial.clone();
    stemMaterial.emissiveIntensity = 0.22;
    stemMaterial.roughness = 0.46;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.28, 1.15, 20), stemMaterial);
    stem.position.set(0.20, -1.05, 0.04);
    stem.rotation.z = -0.13;
    brain.add(stem);

    const lab = new THREE.Group();
    scene.add(lab);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 22), darkMetal);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.96;
    floor.receiveShadow = true;
    lab.add(floor);

    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(3.0, 5.0, 0.28), brushedMetal);
      wall.position.set(side * 5.0, 1.4, -2.9);
      wall.rotation.y = side * -0.12;
      lab.add(wall);

      for (let row = 0; row < 5; row += 1) {
        const stripMaterial = (row % 2 ? violetEmitter : blueEmitter).clone();
        stripMaterial.emissiveIntensity = 0.26;
        const strip = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.028, 0.05), stripMaterial);
        strip.position.set(side * 4.82, 0.1 + row * 0.85, -2.68);
        strip.rotation.y = side * -0.12;
        lab.add(strip);
      }
    }

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(9.5, 5.8, 0.3), brushedMetal);
    backWall.position.set(0, 1.5, -4.35);
    lab.add(backWall);

    const grid = new THREE.GridHelper(20, 44, 0x1d5cc9, 0x13284c);
    grid.position.y = -0.94;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.12;
    });
    lab.add(grid);

    scene.add(new THREE.HemisphereLight(0x8bbdff, 0x01030a, 0.24));
    const key = new THREE.SpotLight(0xcbe8ff, 2.45, 18, Math.PI / 5, 0.68, 1.25);
    key.position.set(4.8, 7.0, 5.3);
    key.target.position.set(0, 1.2, 0);
    key.castShadow = true;
    scene.add(key, key.target);

    const cyan = new THREE.PointLight(0x168cff, 2.1, 9, 1.9);
    cyan.position.set(-3.8, 2.2, 2.2);
    scene.add(cyan);
    const violet = new THREE.PointLight(0x7538d4, 1.45, 8, 1.9);
    violet.position.set(3.4, 2.8, 1.0);
    scene.add(violet);

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

    onStatusChange?.('Real-time 3D cognitive core • WebGL2 • refined glass + neural gyri');

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const currentPhase = phaseRef.current;
      const phaseColor = new THREE.Color(PHASE_COLORS[currentPhase]);
      const active = currentPhase !== 'idle';
      const pulse = 1 + Math.sin(time * (active ? 3.4 : 1.7)) * (active ? 0.022 : 0.009);

      brain.rotation.y = Math.sin(time * 0.24) * 0.10;
      brain.rotation.x = Math.sin(time * 0.17) * 0.025;
      brain.scale.setScalar(pulse);
      brainMaterial.emissive.copy(phaseColor).multiplyScalar(0.22);
      brainMaterial.emissiveIntensity = active ? 0.55 : 0.30;
      gyriMeshes.forEach((mesh, index) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.emissive.copy(phaseColor).multiplyScalar(index % 3 === 0 ? 0.34 : 0.23);
        material.emissiveIntensity = active ? 0.52 : 0.30;
        material.opacity = active ? 0.86 : 0.68;
      });
      lineMaterial.color.copy(phaseColor).lerp(new THREE.Color(0x78bdd9), 0.18);
      lineMaterial.opacity = active ? 0.40 : 0.22;
      coreMaterial.color.copy(phaseColor).lerp(new THREE.Color(0x87d8ed), 0.24);
      coreMaterial.emissive.copy(phaseColor).multiplyScalar(0.26);
      coreMaterial.emissiveIntensity = active ? 0.50 : 0.28;

      rings.forEach((ring, index) => {
        ring.rotation.z = time * (index % 2 ? -0.16 : 0.13) + index * 0.5;
        ring.scale.setScalar(1 + Math.sin(time * 1.6 + index) * 0.008);
        const material = ring.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = active ? (index % 2 ? 0.48 : 0.58) : (index % 2 ? 0.30 : 0.38);
      });
      innerGlass.rotation.y = time * 0.028;
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
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onStatusChange]);

  return (
    <div ref={mountRef} className="npc-real-3d-core" aria-label="Real-time 3D cognitive core viewport">
      <div className="npc-real-3d-badge">REAL-TIME 3D • PHYSICAL GLASS</div>
      <div className="npc-real-3d-phase">{phaseLabel(phase)}</div>
    </div>
  );
};

export default CognitiveCore3DViewport;
