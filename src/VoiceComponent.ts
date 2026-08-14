import * as THREE from 'three';
import { VoiceProvider, VoiceProviderRegistry, VoiceConfig, VoiceGenerationOptions, VoiceResult, NPCVoiceProfile, BrowserTTSProvider, voiceProviderRegistry } from './VoiceProvider.js';
import { AnimationSync, VisemeData, generateVisemesFromText } from './AnimationSync.js';

/**
 * VoiceComponent handles text-to-speech conversion and spatial audio playback for an NPC.
 * It should be associated with a specific NPC's 3D object in the scene.
 * Enhanced to support dialogue integration and animation synchronization.
 */
export class VoiceComponent {
  private audioListener: THREE.AudioListener;
  private positionalAudio: THREE.PositionalAudio;
  private provider: VoiceProvider;
  private audioContext: AudioContext;
  private animationSync: AnimationSync = new AnimationSync();
  private isPlaying: boolean = false;
  private playPromise: Promise<void> | null = null;

  // Animation synchronization callbacks
  public onAnimationStart: (animationName: string) => void = () => {};
  public onAnimationEnd: (animationName: string) => void = () => {};
  public onFacialAnimationStart: (animationName: string) => void = () => {};
  public onFacialAnimationEnd: (animationName: string) => void = () => {};

  constructor(
    providerOrConfig: VoiceProvider | VoiceConfig = { voiceId: '' },
    audioListener?: THREE.AudioListener,
    private defaultVoiceConfig: VoiceConfig = { voiceId: '' }
  ) {
    if (providerOrConfig && 'id' in providerOrConfig) {
      this.provider = providerOrConfig as VoiceProvider;
    } else {
      this.provider = voiceProviderRegistry.getDefault() || new BrowserTTSProvider();
    }
    
    this.audioListener = audioListener || new THREE.AudioListener();
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.positionalAudio = new THREE.PositionalAudio(this.audioListener);
    this.positionalAudio.setRefDistance(1.0);
    this.positionalAudio.setDistanceModel('inverse');
  }

  public setRootObject(root: THREE.Object3D): void {
    this.animationSync.setRoot(root);
    this.attachToObject(root);
  }

  public async speak(
    text: string,
    options: VoiceGenerationOptions = {},
    animationName?: string,
    facialAnimationName?: string
  ): Promise<void> {
    if (this.isPlaying && this.playPromise) {
      await this.playPromise;
    }

    this.isPlaying = true;
    this.playPromise = (async () => {
      try {
        const finalConfig = { ...this.defaultVoiceConfig, ...options };
        
        if (animationName) {
          this.onAnimationStart(animationName);
        }
        if (facialAnimationName) {
          this.onFacialAnimationStart(facialAnimationName);
        }

        // Apply spatial audio settings
        if (finalConfig.maxDistance !== undefined) {
          this.positionalAudio.setMaxDistance(finalConfig.maxDistance);
        }
        if (finalConfig.refDistance !== undefined) {
          this.positionalAudio.setRefDistance(finalConfig.refDistance);
        }
        if (finalConfig.rolloffFactor !== undefined) {
          this.positionalAudio.setRolloffFactor(finalConfig.rolloffFactor);
        }
        if (finalConfig.spatialAudio !== undefined) {
          this.positionalAudio.setDistanceModel(finalConfig.spatialAudio ? 'inverse' : 'linear');
        }

        const validation = this.provider.validateConfig({ 
          enabled: true, 
          voiceId: finalConfig.voiceId || 'default',
          provider: this.provider.id,
          language: finalConfig.language || 'en-US',
          pitch: finalConfig.pitch ?? 1.0,
          speed: finalConfig.speed ?? 1.0,
          volume: finalConfig.volume ?? 1.0,
          personality: { tone: 'neutral', emotion: 'neutral', speakingStyle: 'neutral' },
          subtitles: true,
          spatialAudio: true,
          interruptible: true
        } as NPCVoiceProfile);
        
        if (!validation.valid) {
          throw new Error(`Voice config invalid: ${validation.errors.join(', ')}`);
        }

        const voiceResult = await this.provider.generateSpeech(text, finalConfig);
        
        const decodedAudio = await this.audioContext.decodeAudioData(voiceResult.audioBuffer);
        
        this.positionalAudio.setBuffer(decodedAudio);
        this.positionalAudio.play();
        
        // Generate visemes for lip sync
        const visemes = generateVisemesFromText(text, voiceResult.duration * 1000);
        this.animationSync.speak(text, visemes);
        
        // Setup viseme callback for real-time lip sync
        this.animationSync.onVisemeUpdate((viseme) => {
          this.onFacialAnimationStart(`viseme_${viseme.timestamp}`);
        });

      } catch (error) {
        console.error('Failed to play voice:', error);
        throw error;
      } finally {
        this.isPlaying = false;
        this.playPromise = null;
      }
    })();

    return this.playPromise;
  }

  public update(deltaTime: number): void {
    this.animationSync.update(deltaTime);
  }

  public stop(): void {
    this.animationSync.stop();
    this.positionalAudio.stop();
    this.isPlaying = false;
    this.playPromise = null;
  }

  public setProvider(provider: VoiceProvider): void {
    this.provider = provider;
  }

  public setDefaultVoiceConfig(config: VoiceConfig): void {
    this.defaultVoiceConfig = config;
  }

  public attachToObject(object3D: THREE.Object3D): void {
    object3D.add(this.positionalAudio);
  }

  public setPosition(position: THREE.Vector3): void {
    this.positionalAudio.position.copy(position);
    this.animationSync.setHeadLookAt(position);
  }

  public isPlayingAudio(): boolean {
    return this.isPlaying;
  }

  public dispose(): void {
    this.animationSync.dispose();
    this.positionalAudio.disconnect();
    this.audioContext.close();
  }
}