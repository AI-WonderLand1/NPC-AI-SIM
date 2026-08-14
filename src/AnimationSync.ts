import * as THREE from 'three';

export interface VisemeData {
  jawOpen: number;
  mouthFunnel: number;
  mouthPucker: number;
  timestamp: number;
}

export interface AnimationClip {
  name: string;
  duration: number;
  loop: boolean;
  weight: number;
}

export interface FacialAnimationState {
  visemes: VisemeData[];
  currentVisemeIndex: number;
  isPlaying: boolean;
  blendShapeWeights: Map<string, number>;
}

export class AnimationSync {
  private mixer: THREE.AnimationMixer | null = null;
  private root: THREE.Object3D | null = null;
  private facialRoot: THREE.Object3D | null = null;
  private visemeQueue: VisemeData[] = [];
  private currentViseme: VisemeData | null = null;
  private isSpeaking = false;
  private visemeUpdateCallback: ((viseme: VisemeData) => void) | null = null;
  
  // Animation actions
  private idleAction: THREE.AnimationAction | null = null;
  private talkAction: THREE.AnimationAction | null = null;
  private currentAction: THREE.AnimationAction | null = null;
  
  // Blend shapes for facial animation
  private blendShapeMesh: THREE.SkinnedMesh | null = null;
  private blendShapeNames: string[] = [
    'jawOpen', 'mouthFunnel', 'mouthPucker', 
    'browInnerUp', 'browDownLeft', 'browDownRight',
    'eyeBlinkLeft', 'eyeBlinkRight', 'eyeLookUpLeft', 'eyeLookUpRight',
    'eyeLookDownLeft', 'eyeLookDownRight', 'eyeLookInLeft', 'eyeLookInRight',
    'eyeLookOutLeft', 'eyeLookOutRight', 'eyeSquintLeft', 'eyeSquintRight',
    'noseSneerLeft', 'noseSneerRight', 'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight'
  ];

  constructor() {}

  public setRoot(root: THREE.Object3D): void {
    this.root = root;
    this.mixer = new THREE.AnimationMixer(root);
    this.findFacialMesh(root);
    this.setupAnimations();
  }

  private findFacialMesh(root: THREE.Object3D): void {
    root.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        const hasVisemes = this.blendShapeNames.some(name => name in child.morphTargetDictionary!);
        if (hasVisemes) {
          this.blendShapeMesh = child;
          this.facialRoot = child;
          console.log('[AnimationSync] Found facial mesh with visemes:', child.name);
        }
      }
    });
  }

  private setupAnimations(): void {
    if (!this.root || !this.mixer) return;
    
    // Look for existing animations in the model
    this.root.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.animations) {
        child.animations.forEach((clip: THREE.AnimationClip) => {
          const action = this.mixer!.clipAction(clip);
          if (clip.name.toLowerCase().includes('idle')) {
            this.idleAction = action;
            action.loop = THREE.LoopRepeat;
            action.clampWhenFinished = false;
          } else if (clip.name.toLowerCase().includes('talk') || clip.name.toLowerCase().includes('speak')) {
            this.talkAction = action;
            action.loop = THREE.LoopRepeat;
            action.clampWhenFinished = false;
          }
        });
      }
    });

    // If no talk animation found, we'll use facial blendshapes only
    if (!this.talkAction && this.blendShapeMesh) {
      console.log('[AnimationSync] No talk animation found, using blendshapes for lip sync');
    }
  }

  public update(deltaTime: number): void {
    this.mixer?.update(deltaTime);
    this.updateVisemes(deltaTime);
  }

  public speak(text: string, visemes: VisemeData[]): void {
    this.visemeQueue = visemes;
    this.currentViseme = null;
    this.isSpeaking = true;
    
    // Start talk animation if available
    if (this.talkAction) {
      this.crossFadeTo(this.talkAction, 0.2);
    } else if (this.idleAction) {
      // Keep idle but enable facial animation
      this.idleAction.enabled = true;
      this.idleAction.play();
    }
  }

  public stop(): void {
    this.isSpeaking = false;
    this.visemeQueue = [];
    this.currentViseme = null;
    
    // Return to idle animation
    if (this.idleAction) {
      this.crossFadeTo(this.idleAction, 0.3);
    }
    
    // Reset visemes
    this.setViseme({ jawOpen: 0, mouthFunnel: 0, mouthPucker: 0, timestamp: Date.now() });
  }

  private updateVisemes(deltaTime: number): void {
    if (!this.isSpeaking || this.visemeQueue.length === 0) return;
    
    const now = Date.now();
    
    // Find current viseme based on timestamp
    while (this.visemeQueue.length > 1 && this.visemeQueue[1].timestamp <= now) {
      this.visemeQueue.shift();
    }
    
    if (this.visemeQueue.length > 0) {
      const targetViseme = this.visemeQueue[0];
      this.interpolateViseme(targetViseme, 0.1);
    }
  }

  private interpolateViseme(target: VisemeData, factor: number): void {
    if (!this.currentViseme) {
      this.currentViseme = { ...target };
    } else {
      this.currentViseme.jawOpen += (target.jawOpen - this.currentViseme.jawOpen) * factor;
      this.currentViseme.mouthFunnel += (target.mouthFunnel - this.currentViseme.mouthFunnel) * factor;
      this.currentViseme.mouthPucker += (target.mouthPucker - this.currentViseme.mouthPucker) * factor;
    }
    
    this.setViseme(this.currentViseme);
    this.visemeUpdateCallback?.(this.currentViseme);
  }

  private setViseme(viseme: VisemeData): void {
    if (!this.blendShapeMesh) return;
    
    const morphTargets = this.blendShapeMesh.morphTargetDictionary;
    const influences = this.blendShapeMesh.morphTargetInfluences;
    
    if (morphTargets && influences) {
      if ('jawOpen' in morphTargets) {
        influences[morphTargets.jawOpen] = THREE.MathUtils.clamp(viseme.jawOpen, 0, 1);
      }
      if ('mouthFunnel' in morphTargets) {
        influences[morphTargets.mouthFunnel] = THREE.MathUtils.clamp(viseme.mouthFunnel, 0, 1);
      }
      if ('mouthPucker' in morphTargets) {
        influences[morphTargets.mouthPucker] = THREE.MathUtils.clamp(viseme.mouthPucker, 0, 1);
      }
    }
  }

  private crossFadeTo(targetAction: THREE.AnimationAction, duration: number): void {
    if (this.currentAction === targetAction) return;
    
    if (this.currentAction) {
      this.currentAction.fadeOut(duration);
    }
    
    targetAction.reset().fadeIn(duration).play();
    this.currentAction = targetAction;
  }

  public onVisemeUpdate(callback: (viseme: VisemeData) => void): void {
    this.visemeUpdateCallback = callback;
  }

  public playAnimation(name: string, loop = false, fadeDuration = 0.2): void {
    if (!this.mixer || !this.root) return;
    
    // Find animation clip by name
    let clip: THREE.AnimationClip | null = null;
    this.root.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.animations) {
        const found = child.animations.find((c: THREE.AnimationClip) => c.name === name);
        if (found) clip = found;
      }
    });
    
    if (clip) {
      const action = this.mixer.clipAction(clip);
      action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
      action.clampWhenFinished = !loop;
      this.crossFadeTo(action, fadeDuration);
    }
  }

  public setHeadLookAt(target: THREE.Vector3): void {
    if (!this.facialRoot) return;
    
    const headBone = this.findBone(this.facialRoot, 'head') || this.findBone(this.root!, 'head');
    if (headBone) {
      const worldTarget = target.clone();
      headBone.getWorldPosition(worldTarget);
      headBone.lookAt(worldTarget);
    }
  }

  private findBone(root: THREE.Object3D, name: string): THREE.Bone | null {
    let result: THREE.Bone | null = null;
    root.traverse((child) => {
      if (child instanceof THREE.Bone && child.name.toLowerCase().includes(name.toLowerCase())) {
        result = child;
      }
    });
    return result;
  }

  public dispose(): void {
    this.mixer?.uncacheRoot(this.root!);
    this.stop();
  }
}

// Helper to generate visemes from text (simplified - in production use a proper viseme generator)
export function generateVisemesFromText(text: string, duration: number): VisemeData[] {
  const visemes: VisemeData[] = [];
  const words = text.split(' ');
  const timePerWord = duration / words.length;
  
  let currentTime = 0;
  
  for (const word of words) {
    const wordVisemes = wordToVisemes(word);
    for (const v of wordVisemes) {
      visemes.push({
        ...v,
        timestamp: currentTime + Date.now()
      });
      currentTime += timePerWord / wordVisemes.length;
    }
    currentTime += timePerWord * 0.1; // Small pause between words
  }
  
  return visemes;
}

function wordToVisemes(word: string): VisemeData[] {
  // Simplified viseme mapping - in production use a proper phoneme-to-viseme map
  const visemes: VisemeData[] = [];
  const lower = word.toLowerCase();
  
  // Vowels - jaw open
  if (/[aeiou]/.test(lower)) {
    visemes.push({ jawOpen: 0.6, mouthFunnel: 0.2, mouthPucker: 0.1, timestamp: 0 });
  }
  // Bilabials - mouth pucker
  if (/[bp]/.test(lower)) {
    visemes.push({ jawOpen: 0.1, mouthFunnel: 0.1, mouthPucker: 0.8, timestamp: 0 });
  }
  // Labiodentals - mouth funnel
  if (/[fv]/.test(lower)) {
    visemes.push({ jawOpen: 0.2, mouthFunnel: 0.7, mouthPucker: 0.1, timestamp: 0 });
  }
  // Default
  if (visemes.length === 0) {
    visemes.push({ jawOpen: 0.3, mouthFunnel: 0.1, mouthPucker: 0.1, timestamp: 0 });
  }
  
  return visemes;
}