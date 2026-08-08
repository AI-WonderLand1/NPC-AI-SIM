import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';

export class UpgradedViewport {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private lightSetup: { key: THREE.DirectionalLight; fill: THREE.DirectionalLight; rim: THREE.DirectionalLight } | null = null;
  private groundPlane: THREE.Mesh | null = null;
  private hdriEnvironment: THREE.Texture | null = null;
  private clock: THREE.Clock;
  private mixers: THREE.AnimationMixer[] = [];
  private depthOfFieldEnabled = false;

  constructor(container: HTMLElement, options: { hdriUrl?: string } = {}) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a); // Dark background

    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 1.5, 3);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // Set tone mapping to ACESFilmic for filmic look
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    // Removed deprecated outputEncoding and sRGBEncoding
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Initialize clock for animations
    this.clock = new THREE.Clock();

    // Set up 3-point lighting
    this.setupLights();

    // Set up environment (HDRI or default)
    if (options.hdriUrl) {
      this.loadHDRI(options.hdriUrl);
    } else {
      this.setupDefaultEnvironment();
    }

    // Set up ground plane with reflection
    this.setupGroundPlane();

    // Set up post-processing
    this.setupPostProcessing();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  private setupLights() {
    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    this.scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    rimLight.position.set(0, -5, 0);
    rimLight.target.position.set(0, 0, 0);
    this.scene.add(rimLight);
    this.scene.add(rimLight.target);

    this.lightSetup = { key: keyLight, fill: fillLight, rim: rimLight };
  }

  private setupDefaultEnvironment() {
    // Create a simple gradient sky and ground for fallback
    const skyColor = new THREE.Color(0x87CEEB); // Light blue
    const groundColor = new THREE.Color(0x1a1a1a); // Dark gray
    // We'll set the background to a solid color for simplicity, or we can use a gradient texture.
    // For now, we'll use a solid dark color and rely on the HDRI for reflections.
    this.scene.background = new THREE.Color(0x1a1a1a);
  }

  private async loadHDRI(url: string) {
    try {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(url);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.background = texture; // Also use as background
      this.hdriEnvironment = texture;
    } catch (error) {
      console.error('Failed to load HDRI:', error);
      this.setupDefaultEnvironment();
    }
  }

  private setupGroundPlane() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.0,
      envMapIntensity: 1.5,
    });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = 0;
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);
  }

  private setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(window.devicePixelRatio);
    this.composer.setSize(window.innerWidth, window.innerHeight);

    // Render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // SSAO
    const ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
    ssaoPass.kernelRadius = 16;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
    this.composer.addPass(ssaoPass);

    // Bloom
    const bloomPass = new BloomPass(1.5, 25, 4.0); // strength, kernelSize, sigma
    this.composer.addPass(bloomPass);

    // FXAA
    const fxaaPass = new FXAAPass();
    this.composer.addPass(fxaaPass);

    // Note: Vignette and Depth of field are not included in this version due to complexity.
    // They can be added as custom shader passes if needed.
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  // Load a model from a URL or Blob and add it to the scene
  public async loadModel(source: string | Blob): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        source instanceof Blob ? URL.createObjectURL(source) : source,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // Ensure material is set up for PBR (if not already)
              if (child.material instanceof THREE.Material) {
                // We assume the GLTF already has PBR materials, but we can enforce some settings
                child.material.needsUpdate = true;
              }
            }
          });
          this.scene.add(model);
          resolve(model);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  // Set up an NPC model with animations (if any)
  public async loadNPCModel(source: string | Blob, npcId: string): Promise<THREE.Group> {
    const model = await this.loadModel(source);
    // You could store the model by npcId for later retrieval
    return model;
  }

  // Toggle depth of field (not implemented in this version)
  public setDepthOfField(enabled: boolean) {
    // Depth of field pass not implemented, so we ignore for now.
    // TODO: Implement if needed.
    this.depthOfFieldEnabled = enabled;
  }

  // Update method to be called per frame
  private update(delta: number) {
    // Update animations
    this.mixers.forEach(mixer => mixer.update(delta));
  }

  // Animation loop
  private animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    this.update(delta);

    // Render the scene with post-processing
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Dispose resources
  public dispose() {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }
  }
}