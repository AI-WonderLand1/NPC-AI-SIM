import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { NPCAsset } from '../LibraryPage.js';

interface NPCViewportProps {
  asset: NPCAsset;
  onSelect?: (name: string) => void;
  onObjectCountChange?: (count: number) => void;
  onStatusChange?: (status: string) => void;
}

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

const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (!material) return;
      Object.values(material).forEach((value) => {
        if (value && typeof value === 'object' && 'isTexture' in value && (value as THREE.Texture).isTexture) {
          (value as THREE.Texture).dispose();
        }
      });
      material.dispose();
    });
  });
};

const fitModelToScene = (model: THREE.Object3D, targetHeight = 2.7) => {
  const firstBox = new THREE.Box3().setFromObject(model);
  const size = firstBox.getSize(new THREE.Vector3());

  if (size.y > 0) {
    const scale = targetHeight / size.y;
    model.scale.setScalar(scale);
  }

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const minY = box.min.y;

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= minY;
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080a0f);
    scene.fog = new THREE.Fog(0x080a0f, 10, 32);

    const camera = new THREE.PerspectiveCamera(
      45,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      200,
    );
    camera.position.set(4.2, 2.8, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.35, 0);
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI * 0.49;

    const hemi = new THREE.HemisphereLight(0xbad7ff, 0x151922, 1.7);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(4, 7, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 30;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x5ba7ff, 1.8);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.92, metalness: 0.03 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'EditorFloor';
    scene.add(floor);

    const grid = new THREE.GridHelper(40, 40, 0x334155, 0x1f2937);
    grid.position.y = 0.002;
    scene.add(grid);

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

      model.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = true;
      });

      fitModelToScene(model, asset.type === 'vehicle' ? 1.8 : asset.type === 'prop' ? 2.1 : 2.7);
      scene.add(model);

      if (animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const preferredName = asset.defaultAnimation?.toLowerCase();
        const preferred =
          animations.find((clip) => preferredName && clip.name.toLowerCase() === preferredName) ||
          animations.find((clip) => clip.name.toLowerCase().includes('idle')) ||
          animations[0];

        if (preferred) {
          const action = mixer.clipAction(preferred);
          action.reset().fadeIn(0.2).play();
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

      const hits = raycaster.intersectObject(activeModel, true);
      if (hits.length > 0) onSelect?.(asset.name);
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

      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [asset, onObjectCountChange, onSelect, onStatusChange]);

  return <div ref={mountRef} className="w-full h-full bg-black" />;
};

export default NPCViewport;
