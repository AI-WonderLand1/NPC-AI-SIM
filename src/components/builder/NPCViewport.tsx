import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { NPCAsset } from '../LibraryPage.js';

interface NPCViewportProps {
  asset: NPCAsset;
  onSelect?: (name: string) => void;
  onObjectCountChange?: (count: number) => void;
  onStatusChange?: (status: string) => void;
}

const ENVIRONMENT_URL =
  'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/space_ship_hallway.glb';

const createFallbackModel = (name: string) => {
  const group = new THREE.Group();
  group.name = name;

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 1.25, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x26364d, roughness: 0.48, metalness: 0.38 }),
  );
  body.position.y = 1.05;
  body.castShadow = true;
  body.receiveShadow = true;

  const chest = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.42, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x0e7490, emissive: 0x0369a1, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.5 }),
  );
  chest.position.set(0, 1.45, 0.36);
  chest.castShadow = true;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x8b95a6, roughness: 0.52, metalness: 0.08 }),
  );
  head.position.y = 2.08;
  head.castShadow = true;

  group.add(body, chest, head);
  group.userData.isFallback = true;
  return group;
};

const disposeMaterial = (material: THREE.Material) => {
  Object.values(material).forEach((value) => {
    if (
      value &&
      typeof value === 'object' &&
      'isTexture' in value &&
      (value as THREE.Texture).isTexture
    ) {
      (value as THREE.Texture).dispose();
    }
  });
  material.dispose();
};

const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => material && disposeMaterial(material));
  });
};

const fitModelToScene = (model: THREE.Object3D, targetHeight = 2.85) => {
  const firstBox = new THREE.Box3().setFromObject(model);
  const size = firstBox.getSize(new THREE.Vector3());

  if (size.y > 0) {
    model.scale.setScalar(targetHeight / size.y);
  }

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;
};

const fitEnvironmentToScene = (model: THREE.Object3D) => {
  const initialBox = new THREE.Box3().setFromObject(model);
  const size = initialBox.getSize(new THREE.Vector3());
  const horizontalSpan = Math.max(size.x, size.z);

  if (horizontalSpan > 0) {
    model.scale.setScalar(20 / horizontalSpan);
  }

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;
};

const createSignMaterial = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(0.55, '#a78bfa');
    gradient.addColorStop(1, '#22d3ee');
    ctx.fillStyle = '#07101a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '700 82px Arial, sans-serif';
    ctx.fillStyle = gradient;
    ctx.fillText('AIW', 54, 122);
    ctx.font = '700 42px Arial, sans-serif';
    ctx.fillStyle = '#dbeafe';
    ctx.fillText('NPC-AI-SIM', 250, 120);
    ctx.font = '500 22px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('CHARACTERS • THINK • REACT • FEEL ALIVE', 58, 184);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  return new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: 0x335577,
    emissiveIntensity: 0.42,
    roughness: 0.42,
    metalness: 0.08,
  });
};

const createProceduralHangar = () => {
  const root = new THREE.Group();
  root.name = 'ProceduralAIWHangar';

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x111923,
    roughness: 0.28,
    metalness: 0.82,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x060b12,
    roughness: 0.62,
    metalness: 0.68,
  });
  const structureMaterial = new THREE.MeshStandardMaterial({
    color: 0x182436,
    roughness: 0.4,
    metalness: 0.9,
  });
  const blueGlow = new THREE.MeshStandardMaterial({
    color: 0x5fb7ff,
    emissive: 0x1477ff,
    emissiveIntensity: 4.2,
    roughness: 0.18,
    metalness: 0.12,
  });
  const warmGlow = new THREE.MeshStandardMaterial({
    color: 0xffbd73,
    emissive: 0xff7a1a,
    emissiveIntensity: 3.2,
    roughness: 0.24,
    metalness: 0.1,
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.18, 28), floorMaterial);
  floor.position.set(0, -0.09, -4);
  floor.receiveShadow = true;
  root.add(floor);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 6.2, 0.32), darkMetal);
  backWall.position.set(0, 3.0, -12.8);
  backWall.receiveShadow = true;
  root.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 6.4, 28), darkMetal);
  leftWall.position.set(-8, 3.0, -4);
  leftWall.receiveShadow = true;
  root.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 8;
  root.add(rightWall);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(16, 0.24, 28), darkMetal);
  ceiling.position.set(0, 6.1, -4);
  root.add(ceiling);

  for (let z = -12; z <= 8; z += 4) {
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5.9, 0.3), structureMaterial);
    leftFrame.position.set(-7.55, 3.0, z);
    leftFrame.castShadow = true;
    root.add(leftFrame);

    const rightFrame = leftFrame.clone();
    rightFrame.position.x = 7.55;
    root.add(rightFrame);

    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(15.1, 0.25, 0.3), structureMaterial);
    topFrame.position.set(0, 5.78, z);
    root.add(topFrame);

    const leftStrip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.8, 0.1), blueGlow);
    leftStrip.position.set(-7.28, 3.0, z + 0.12);
    root.add(leftStrip);

    const rightStrip = leftStrip.clone();
    rightStrip.position.x = 7.28;
    root.add(rightStrip);

    const ceilingStrip = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 0.12), z % 8 === 0 ? warmGlow : blueGlow);
    ceilingStrip.position.set(z % 8 === 0 ? 3.2 : -2.6, 5.58, z + 0.12);
    root.add(ceilingStrip);
  }

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 2.0, 0.18, 56),
    new THREE.MeshStandardMaterial({ color: 0x17243a, roughness: 0.26, metalness: 0.92 }),
  );
  platform.position.y = 0.1;
  platform.receiveShadow = true;
  root.add(platform);

  const platformRing = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.035, 12, 64), blueGlow);
  platformRing.rotation.x = Math.PI / 2;
  platformRing.position.y = 0.2;
  root.add(platformRing);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.7), createSignMaterial());
  sign.position.set(-2.25, 3.7, -12.58);
  root.add(sign);

  const bayDoor = new THREE.Mesh(new THREE.BoxGeometry(5.3, 3.2, 0.18), structureMaterial);
  bayDoor.position.set(4.4, 2.1, -12.55);
  root.add(bayDoor);

  for (let x = 2.2; x <= 6.4; x += 1.05) {
    const bayLine = new THREE.Mesh(new THREE.BoxGeometry(0.055, 2.75, 0.05), warmGlow);
    bayLine.position.set(x, 2.1, -12.42);
    root.add(bayLine);
  }

  for (const side of [-1, 1]) {
    for (let z = -8; z <= 3; z += 4.5) {
      const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.8), structureMaterial);
      consoleBase.position.set(side * 5.5, 0.5, z);
      consoleBase.castShadow = true;
      root.add(consoleBase);

      const screenMaterial = side < 0 ? blueGlow : warmGlow;
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.42), screenMaterial);
      screen.position.set(side * 5.5, 0.82, z + 0.405);
      root.add(screen);
    }
  }

  const grid = new THREE.GridHelper(15, 30, 0x1d4ed8, 0x172033);
  grid.position.y = 0.01;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.13;
  });
  root.add(grid);

  return root;
};

const tunePBRMaterials = (object: THREE.Object3D, renderer: THREE.WebGLRenderer) => {
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = true;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (!material) return;

      const standard = material as THREE.MeshStandardMaterial;
      if ('envMapIntensity' in standard) {
        standard.envMapIntensity = 1.35;
      }

      const texturedMaterial = material as THREE.MeshStandardMaterial;
      [
        texturedMaterial.map,
        texturedMaterial.normalMap,
        texturedMaterial.roughnessMap,
        texturedMaterial.metalnessMap,
      ].forEach((texture) => {
        if (texture) texture.anisotropy = Math.min(maxAnisotropy, 8);
      });

      material.needsUpdate = true;
    });
  });
};

export const NPCViewport: React.FC<NPCViewportProps> = ({
  asset,
  onSelect,
  onObjectCountChange,
  onStatusChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let animationFrame = 0;
    let mixer: THREE.AnimationMixer | null = null;
    let activeModel: THREE.Object3D | null = null;
    let loadedEnvironment: THREE.Object3D | null = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030811);
    scene.fog = new THREE.FogExp2(0x030811, 0.017);

    const camera = new THREE.PerspectiveCamera(
      34,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      250,
    );
    camera.position.set(3.15, 2.25, 4.55);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const pixelRatioCap = deviceMemory <= 4 ? 1.2 : 1.65;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
    renderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment();
    const environmentTexture = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
    scene.environment = environmentTexture;
    roomEnvironment.dispose();
    pmremGenerator.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.target.set(0, 1.42, 0);
    controls.minDistance = 1.9;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.enablePan = true;

    const ambient = new THREE.HemisphereLight(0x8dbdff, 0x03060a, 0.56);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffe8ce, 4.0);
    keyLight.position.set(4.2, 7.2, 4.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -2;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 28;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.025;
    scene.add(keyLight);

    const coolRim = new THREE.SpotLight(0x3b82f6, 18, 20, Math.PI / 5, 0.62, 1.3);
    coolRim.position.set(-4.8, 4.3, -3.8);
    coolRim.target.position.set(0, 1.5, 0);
    scene.add(coolRim, coolRim.target);

    const warmRim = new THREE.SpotLight(0xff934d, 11, 18, Math.PI / 5.5, 0.7, 1.5);
    warmRim.position.set(4.6, 3.5, -4.3);
    warmRim.target.position.set(0.2, 1.45, 0);
    scene.add(warmRim, warmRim.target);

    const coolFill = new THREE.PointLight(0x38bdf8, 4.6, 10, 2);
    coolFill.position.set(-2.8, 2.0, 1.8);
    scene.add(coolFill);

    const warmFill = new THREE.PointLight(0xffaa66, 4.2, 9, 2);
    warmFill.position.set(3.0, 2.2, -1.4);
    scene.add(warmFill);

    const hangar = createProceduralHangar();
    scene.add(hangar);

    const environmentLoader = new GLTFLoader();
    environmentLoader.load(
      ENVIRONMENT_URL,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }

        loadedEnvironment = gltf.scene;
        loadedEnvironment.name = 'SciFiHallwayEnvironment';
        fitEnvironmentToScene(loadedEnvironment);
        tunePBRMaterials(loadedEnvironment, renderer);
        loadedEnvironment.position.z -= 2.5;
        scene.add(loadedEnvironment);

        hangar.visible = false;
        onStatusChange?.(`Loaded ${asset.name} • cinematic sci-fi environment ready`);
      },
      undefined,
      (error) => {
        console.warn('[NPCViewport] Environment load failed; using AIW procedural hangar.', error);
        hangar.visible = true;
        onStatusChange?.(`Loaded ${asset.name} • AIW cinematic hangar active`);
      },
    );

    const clock = new THREE.Clock();
    const loader = new GLTFLoader();

    const registerModel = (model: THREE.Object3D, animations: THREE.AnimationClip[] = []) => {
      if (disposed) {
        disposeObject(model);
        return;
      }

      activeModel = model;
      model.name = asset.name;
      model.userData.assetId = asset.id;
      model.userData.modelUrl = asset.modelUrl;

      tunePBRMaterials(model, renderer);
      fitModelToScene(model, asset.type === 'vehicle' ? 1.9 : asset.type === 'prop' ? 2.1 : 2.85);
      scene.add(model);

      const modelBounds = new THREE.Box3().setFromObject(model);
      const modelCenter = modelBounds.getCenter(new THREE.Vector3());
      const targetY = asset.type === 'humanoid' ? Math.max(1.35, modelCenter.y * 0.97) : Math.max(1.0, modelCenter.y);
      controls.target.set(modelCenter.x, targetY, modelCenter.z);

      if (asset.type === 'humanoid') {
        camera.position.set(3.15, 2.28, 4.55);
      } else if (asset.type === 'creature') {
        camera.position.set(4.3, 2.3, 5.8);
      } else {
        camera.position.set(4.7, 2.8, 6.4);
      }
      camera.lookAt(controls.target);
      controls.update();

      if (animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const preferredName = asset.defaultAnimation?.toLowerCase();
        const preferred =
          animations.find((clip) => preferredName && clip.name.toLowerCase() === preferredName) ||
          animations.find((clip) => clip.name.toLowerCase().includes('idle')) ||
          animations[0];

        if (preferred) {
          mixer.clipAction(preferred).reset().fadeIn(0.2).play();
          onStatusChange?.(`Loaded ${asset.name} • animation: ${preferred.name} • cinematic PBR ready`);
        }
      } else {
        onStatusChange?.(`Loaded ${asset.name} • static GLTF • cinematic PBR ready`);
      }

      onObjectCountChange?.(1);
    };

    const loadFallback = (reason: string) => {
      const fallback = createFallbackModel(asset.name);
      registerModel(fallback);
      onStatusChange?.(`Fallback model active: ${reason}`);
    };

    if (asset.modelUrl) {
      onStatusChange?.(`Loading ${asset.name} GLB/GLTF…`);
      loader.load(
        asset.modelUrl,
        (gltf) => registerModel(gltf.scene, gltf.animations),
        (event) => {
          if (event.total > 0) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onStatusChange?.(`Loading ${asset.name}… ${progress}%`);
          }
        },
        (error) => {
          console.error('[NPCViewport] GLTF load failed', error);
          loadFallback('GLB/GLTF failed to load');
        },
      );
    } else {
      loadFallback('no modelUrl configured');
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (event: PointerEvent) => {
      if (!activeModel) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (raycaster.intersectObject(activeModel, true).length > 0) {
        onSelect?.(asset.name);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const resizeObserver = new ResizeObserver(() => {
      if (disposed || !mountRef.current) return;
      const width = Math.max(mountRef.current.clientWidth, 1);
      const height = Math.max(mountRef.current.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    });
    resizeObserver.observe(mount);

    const animate = () => {
      if (disposed) return;
      animationFrame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      mixer?.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();
      mixer?.stopAllAction();

      if (activeModel) {
        scene.remove(activeModel);
        disposeObject(activeModel);
      }

      if (loadedEnvironment) {
        scene.remove(loadedEnvironment);
        disposeObject(loadedEnvironment);
      }

      scene.remove(hangar);
      disposeObject(hangar);
      environmentTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [asset, onObjectCountChange, onSelect, onStatusChange]);

  return <div ref={mountRef} className="h-full w-full bg-black" />;
};

export default NPCViewport;
