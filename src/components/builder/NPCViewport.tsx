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
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.15 }),
  );
  body.position.y = 1.05;
  body.castShadow = true;
  body.receiveShadow = true;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.65 }),
  );
  head.position.y = 2.08;
  head.castShadow = true;

  group.add(body, head);
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

const fitModelToScene = (model: THREE.Object3D, targetHeight = 2.7) => {
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
    model.scale.setScalar(18 / horizontalSpan);
  }

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;
};

const createProceduralCorridor = () => {
  const root = new THREE.Group();
  root.name = 'ProceduralSciFiCorridor';

  const metal = new THREE.MeshStandardMaterial({
    color: 0x151a22,
    roughness: 0.58,
    metalness: 0.72,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x090d13,
    roughness: 0.7,
    metalness: 0.55,
  });
  const stripMaterial = new THREE.MeshStandardMaterial({
    color: 0x5fb7ff,
    emissive: 0x2d8dff,
    emissiveIntensity: 3.4,
    roughness: 0.25,
    metalness: 0.15,
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.18, 24), metal);
  floor.position.set(0, -0.09, -2);
  floor.receiveShadow = true;
  root.add(floor);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5.5, 24), darkMetal);
  leftWall.position.set(-6, 2.65, -2);
  leftWall.receiveShadow = true;
  root.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 6;
  root.add(rightWall);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(12, 0.22, 24), darkMetal);
  ceiling.position.set(0, 5.35, -2);
  root.add(ceiling);

  for (let z = -12; z <= 8; z += 4) {
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x202833,
      roughness: 0.45,
      metalness: 0.85,
    });

    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.2, 0.24), frameMaterial);
    leftFrame.position.set(-5.72, 2.55, z);
    leftFrame.castShadow = true;
    root.add(leftFrame);

    const rightFrame = leftFrame.clone();
    rightFrame.position.x = 5.72;
    root.add(rightFrame);

    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.22, 0.24), frameMaterial);
    topFrame.position.set(0, 5.0, z);
    root.add(topFrame);

    const leftStrip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 3.3, 0.09), stripMaterial);
    leftStrip.position.set(-5.48, 2.6, z + 0.08);
    root.add(leftStrip);

    const rightStrip = leftStrip.clone();
    rightStrip.position.x = 5.48;
    root.add(rightStrip);
  }

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.65, 1.9, 0.2, 48),
    new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.36,
      metalness: 0.8,
    }),
  );
  platform.position.y = 0.1;
  platform.receiveShadow = true;
  root.add(platform);

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
        standard.envMapIntensity = 1.15;
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
    scene.background = new THREE.Color(0x05070b);
    scene.fog = new THREE.FogExp2(0x05070b, 0.022);

    const camera = new THREE.PerspectiveCamera(
      42,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      250,
    );
    camera.position.set(4.4, 2.65, 6.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const pixelRatioCap = deviceMemory <= 4 ? 1.25 : 1.75;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
    renderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
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
    controls.target.set(0, 1.35, 0);
    controls.minDistance = 2.2;
    controls.maxDistance = 13;
    controls.maxPolarAngle = Math.PI * 0.485;

    const ambient = new THREE.HemisphereLight(0x8fbfff, 0x080b10, 0.72);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff3df, 3.2);
    keyLight.position.set(4.5, 7.5, 4.5);
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

    const rimLight = new THREE.SpotLight(0x4da6ff, 14, 18, Math.PI / 5, 0.65, 1.4);
    rimLight.position.set(-4.5, 4.2, -3.5);
    rimLight.target.position.set(0, 1.4, 0);
    scene.add(rimLight, rimLight.target);

    const warmFill = new THREE.PointLight(0xffa65c, 3.8, 9, 2);
    warmFill.position.set(3.2, 2.3, -1.5);
    scene.add(warmFill);

    const corridor = createProceduralCorridor();
    scene.add(corridor);

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
        scene.add(loadedEnvironment);

        corridor.visible = false;
        onStatusChange?.(`Loaded ${asset.name} • cinematic hallway environment ready`);
      },
      undefined,
      (error) => {
        console.warn('[NPCViewport] Environment load failed; using procedural corridor.', error);
        corridor.visible = true;
        onStatusChange?.(`Loaded ${asset.name} • procedural sci-fi environment active`);
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
      fitModelToScene(model, asset.type === 'vehicle' ? 1.8 : asset.type === 'prop' ? 2.1 : 2.7);
      scene.add(model);

      const modelBounds = new THREE.Box3().setFromObject(model);
      const modelCenter = modelBounds.getCenter(new THREE.Vector3());
      controls.target.set(modelCenter.x, Math.max(1.15, modelCenter.y), modelCenter.z);

      if (animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const preferredName = asset.defaultAnimation?.toLowerCase();
        const preferred =
          animations.find((clip) => preferredName && clip.name.toLowerCase() === preferredName) ||
          animations.find((clip) => clip.name.toLowerCase().includes('idle')) ||
          animations[0];

        if (preferred) {
          mixer.clipAction(preferred).reset().fadeIn(0.2).play();
          onStatusChange?.(`Loaded ${asset.name} • animation: ${preferred.name}`);
        }
      } else {
        onStatusChange?.(`Loaded ${asset.name} • static GLTF`);
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

      scene.remove(corridor);
      disposeObject(corridor);
      environmentTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [asset, onObjectCountChange, onSelect, onStatusChange]);

  return <div ref={mountRef} className="w-full h-full bg-black" />;
};

export default NPCViewport;
