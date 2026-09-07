import React, { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { NPCAsset } from '../LibraryPage.js';
import type { BrowserGraphicsProfile } from '../../rendering/browserGraphics.js';

interface WebGPUNPCViewportProps {
  asset: NPCAsset;
  profile: BrowserGraphicsProfile;
  onSelect?: (name: string) => void;
  onObjectCountChange?: (count: number) => void;
  onStatusChange?: (status: string) => void;
  onRendererFailure?: (error: unknown) => void;
}

const disposeMaterial = (material: THREE.Material) => {
  Object.values(material).forEach((value) => {
    if (value && typeof value === 'object' && 'isTexture' in value && (value as THREE.Texture).isTexture) {
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

const fitModelToStage = (model: THREE.Object3D, targetHeight = 2.9) => {
  const initialBounds = new THREE.Box3().setFromObject(model);
  const size = initialBounds.getSize(new THREE.Vector3());
  if (size.y > 0) model.scale.setScalar(targetHeight / size.y);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= bounds.min.y;
};

const tuneMaterials = (object: THREE.Object3D, quality: BrowserGraphicsProfile['quality']) => {
  const anisotropy = quality === 'ultra' ? 8 : quality === 'high' ? 4 : 2;
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (!material) return;
      const standard = material as THREE.MeshStandardMaterial;
      if ('envMapIntensity' in standard) standard.envMapIntensity = quality === 'ultra' ? 1.55 : 1.25;
      [standard.map, standard.normalMap, standard.roughnessMap, standard.metalnessMap].forEach((texture) => {
        if (texture) texture.anisotropy = anisotropy;
      });
      material.needsUpdate = true;
    });
  });
};

const createTrainingStage = (quality: BrowserGraphicsProfile['quality']) => {
  const root = new THREE.Group();
  root.name = 'AIWTrainingStage';

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x111821,
    roughness: 0.28,
    metalness: 0.76,
  });
  const structureMaterial = new THREE.MeshStandardMaterial({
    color: 0x172337,
    roughness: 0.38,
    metalness: 0.82,
  });
  const blueGlow = new THREE.MeshStandardMaterial({
    color: 0x5caeff,
    emissive: 0x1268ff,
    emissiveIntensity: quality === 'ultra' ? 5.5 : 3.8,
    roughness: 0.18,
    metalness: 0.15,
  });
  const warmGlow = new THREE.MeshStandardMaterial({
    color: 0xffba79,
    emissive: 0xff6a1a,
    emissiveIntensity: quality === 'ultra' ? 4.5 : 3,
    roughness: 0.22,
    metalness: 0.12,
  });

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.1, 0.2, 64), floorMaterial);
  floor.position.y = -0.1;
  floor.receiveShadow = true;
  root.add(floor);

  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.16, 64), structureMaterial);
  platform.position.y = 0.08;
  platform.receiveShadow = true;
  root.add(platform);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.035, 12, 96), blueGlow);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.18;
  root.add(ring);

  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.2, 0.32), structureMaterial);
    pillar.position.set(side * 4.5, 2.6, -2.7);
    root.add(pillar);

    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.8, 0.1), side < 0 ? blueGlow : warmGlow);
    strip.position.set(side * 4.32, 2.55, -2.5);
    root.add(strip);
  }

  const back = new THREE.Mesh(new THREE.BoxGeometry(10, 5.6, 0.25), structureMaterial);
  back.position.set(0, 2.7, -5.4);
  root.add(back);

  const backBlue = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.06, 0.08), blueGlow);
  backBlue.position.set(-2.3, 4.6, -5.24);
  root.add(backBlue);

  const backWarm = backBlue.clone();
  backWarm.material = warmGlow;
  backWarm.position.x = 2.5;
  root.add(backWarm);

  const grid = new THREE.GridHelper(12, quality === 'ultra' ? 40 : 28, 0x2457c5, 0x16243a);
  grid.position.y = 0.015;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.16;
  });
  root.add(grid);

  return root;
};

export const WebGPUNPCViewport: React.FC<WebGPUNPCViewportProps> = ({
  asset,
  profile,
  onSelect,
  onObjectCountChange,
  onStatusChange,
  onRendererFailure,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let renderer: THREE.WebGPURenderer | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let activeModel: THREE.Object3D | null = null;
    let controls: OrbitControls | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let pointerHandler: ((event: PointerEvent) => void) | null = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02060d);
    scene.fog = new THREE.FogExp2(0x02060d, profile.quality === 'ultra' ? 0.012 : 0.018);

    const camera = new THREE.PerspectiveCamera(
      34,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      200,
    );
    camera.position.set(3.15, 2.3, 4.8);

    const stage = createTrainingStage(profile.quality);
    scene.add(stage);

    const hemisphere = new THREE.HemisphereLight(0x8dbdff, 0x02040a, profile.quality === 'ultra' ? 0.72 : 0.55);
    scene.add(hemisphere);

    const key = new THREE.DirectionalLight(0xffe9d6, profile.quality === 'ultra' ? 5.2 : 4.2);
    key.position.set(4.5, 7.5, 4.8);
    key.castShadow = true;
    key.shadow.mapSize.set(profile.quality === 'ultra' ? 2048 : 1024, profile.quality === 'ultra' ? 2048 : 1024);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -2;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 25;
    scene.add(key);

    const coolRim = new THREE.SpotLight(0x2f80ff, profile.quality === 'ultra' ? 22 : 15, 22, Math.PI / 5, 0.62, 1.3);
    coolRim.position.set(-4.6, 4.5, -3.7);
    coolRim.target.position.set(0, 1.5, 0);
    scene.add(coolRim, coolRim.target);

    const warmRim = new THREE.SpotLight(0xff8b4d, profile.quality === 'ultra' ? 15 : 10, 20, Math.PI / 5.5, 0.7, 1.4);
    warmRim.position.set(4.7, 3.7, -4.1);
    warmRim.target.position.set(0.1, 1.45, 0);
    scene.add(warmRim, warmRim.target);

    const clock = new THREE.Clock();
    const loader = new GLTFLoader();

    const start = async () => {
      try {
        const nextRenderer = new THREE.WebGPURenderer({
          antialias: true,
          alpha: false,
          samples: profile.quality === 'ultra' ? 4 : 2,
        });
        renderer = nextRenderer;
        nextRenderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap));
        nextRenderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1));
        nextRenderer.outputColorSpace = THREE.SRGBColorSpace;
        nextRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        nextRenderer.toneMappingExposure = profile.quality === 'ultra' ? 1.16 : 1.08;
        (nextRenderer as unknown as { shadowMap: { enabled: boolean; type?: number } }).shadowMap.enabled = true;

        await nextRenderer.init();
        if (disposed) {
          nextRenderer.dispose();
          return;
        }

        mount.appendChild(nextRenderer.domElement);
        onStatusChange?.(`${profile.label} renderer ready • browser GPU active`);

        controls = new OrbitControls(camera as never, nextRenderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.target.set(0, 1.45, 0);
        controls.minDistance = 1.8;
        controls.maxDistance = 11;
        controls.maxPolarAngle = Math.PI * 0.49;

        const registerModel = (model: THREE.Object3D, animations: THREE.AnimationClip[] = []) => {
          if (disposed) {
            disposeObject(model);
            return;
          }

          activeModel = model;
          model.name = asset.name;
          model.userData.assetId = asset.id;
          tuneMaterials(model, profile.quality);
          fitModelToStage(model, asset.type === 'vehicle' ? 2 : asset.type === 'prop' ? 2.2 : 2.9);
          scene.add(model);

          const bounds = new THREE.Box3().setFromObject(model);
          const center = bounds.getCenter(new THREE.Vector3());
          controls?.target.set(center.x, Math.max(1.35, center.y * 0.96), center.z);
          camera.lookAt(controls?.target ?? center);
          controls?.update();

          if (animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            const preferredName = asset.defaultAnimation?.toLowerCase();
            const preferred =
              animations.find((clip) => preferredName && clip.name.toLowerCase() === preferredName) ||
              animations.find((clip) => clip.name.toLowerCase().includes('idle')) ||
              animations[0];
            preferred && mixer.clipAction(preferred).reset().fadeIn(0.2).play();
            onStatusChange?.(`${asset.name} • ${profile.label} • ${preferred?.name || 'animation'} active`);
          } else {
            onStatusChange?.(`${asset.name} • ${profile.label} • cinematic PBR active`);
          }
          onObjectCountChange?.(1);
        };

        if (asset.modelUrl) {
          onStatusChange?.(`Loading ${asset.name} for ${profile.label}…`);
          loader.load(
            asset.modelUrl,
            (gltf) => registerModel(gltf.scene as unknown as THREE.Object3D, gltf.animations as unknown as THREE.AnimationClip[]),
            undefined,
            (error) => {
              console.error('[WebGPUNPCViewport] GLTF load failed', error);
              onStatusChange?.(`${profile.label} active • character model failed to load`);
              onObjectCountChange?.(0);
            },
          );
        }

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        pointerHandler = (event: PointerEvent) => {
          if (!activeModel || !renderer) return;
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          if (raycaster.intersectObject(activeModel, true).length > 0) onSelect?.(asset.name);
        };
        nextRenderer.domElement.addEventListener('pointerdown', pointerHandler);

        resizeObserver = new ResizeObserver(() => {
          if (disposed || !mountRef.current || !renderer) return;
          const width = Math.max(mountRef.current.clientWidth, 1);
          const height = Math.max(mountRef.current.clientHeight, 1);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        });
        resizeObserver.observe(mount);

        nextRenderer.setAnimationLoop(() => {
          if (disposed) return;
          mixer?.update(Math.min(clock.getDelta(), 0.05));
          controls?.update();
          nextRenderer.render(scene, camera);
        });
      } catch (error) {
        console.error('[WebGPUNPCViewport] renderer initialization failed', error);
        onStatusChange?.('WebGPU unavailable at runtime • switching to WebGL2');
        onRendererFailure?.(error);
      }
    };

    void start();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      controls?.dispose();
      mixer?.stopAllAction();
      if (renderer) {
        renderer.setAnimationLoop(null);
        if (pointerHandler) renderer.domElement.removeEventListener('pointerdown', pointerHandler);
      }
      if (activeModel) {
        scene.remove(activeModel);
        disposeObject(activeModel);
      }
      scene.remove(stage);
      disposeObject(stage);
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [asset, onObjectCountChange, onRendererFailure, onSelect, onStatusChange, profile]);

  return <div ref={mountRef} className="h-full w-full bg-black" />;
};

export default WebGPUNPCViewport;
