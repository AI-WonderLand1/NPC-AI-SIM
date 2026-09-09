import * as THREE from 'three';
import {
  BrowserTTSProvider,
  NPCVoiceProfile,
  VoiceConfig,
  VoiceGenerationOptions,
  VoiceProvider,
  voiceProviderRegistry,
} from './VoiceProvider.js';
import { AnimationSync, generateVisemesFromText } from './AnimationSync.js';

/**
 * VoiceComponent handles TTS playback and spatial audio for a linked NPC test host.
 * Browser Web Speech is playback-only; encoded providers use THREE.PositionalAudio.
 */
export class VoiceComponent {
  private audioListener: THREE.AudioListener;
  private positionalAudio: THREE.PositionalAudio;
  private provider: VoiceProvider;
  private audioContext: AudioContext;
  private animationSync: AnimationSync = new AnimationSync();
  private isPlaying = false;
  private playPromise: Promise<void> | null = null;
  private playbackGeneration = 0;

  public onAnimationStart: (animationName: string) => void = () => {};
  public onAnimationEnd: (animationName: string) => void = () => {};
  public onFacialAnimationStart: (animationName: string) => void = () => {};
  public onFacialAnimationEnd: (animationName: string) => void = () => {};

  constructor(
    providerOrConfig: VoiceProvider | VoiceConfig = { voiceId: '' },
    audioListener?: THREE.AudioListener,
    private defaultVoiceConfig: VoiceConfig = { voiceId: '' },
  ) {
    if (providerOrConfig && 'id' in providerOrConfig) {
      this.provider = providerOrConfig as VoiceProvider;
    } else {
      this.provider = voiceProviderRegistry.getDefault() || new BrowserTTSProvider();
      this.defaultVoiceConfig = { ...this.defaultVoiceConfig, ...(providerOrConfig as VoiceConfig) };
    }

    this.audioListener = audioListener || new THREE.AudioListener();
    this.audioContext = this.audioListener.context;
    this.positionalAudio = new THREE.PositionalAudio(this.audioListener);
    this.positionalAudio.setRefDistance(1);
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
    facialAnimationName?: string,
  ): Promise<void> {
    if (this.isPlaying && this.playPromise) {
      await this.playPromise;
    }

    const generation = ++this.playbackGeneration;
    this.isPlaying = true;

    this.playPromise = (async () => {
      const finalConfig = { ...this.defaultVoiceConfig, ...options };

      try {
        if (animationName) this.onAnimationStart(animationName);
        if (facialAnimationName) this.onFacialAnimationStart(facialAnimationName);

        if (finalConfig.maxDistance !== undefined) this.positionalAudio.setMaxDistance(finalConfig.maxDistance);
        if (finalConfig.refDistance !== undefined) this.positionalAudio.setRefDistance(finalConfig.refDistance);
        if (finalConfig.rolloffFactor !== undefined) this.positionalAudio.setRolloffFactor(finalConfig.rolloffFactor);
        if (finalConfig.spatialAudio !== undefined) {
          this.positionalAudio.setDistanceModel(finalConfig.spatialAudio ? 'inverse' : 'linear');
        }

        const validation = this.provider.validateConfig({
          enabled: true,
          voiceId: finalConfig.voiceId || 'default',
          provider: this.provider.id,
          language: finalConfig.language || 'en-US',
          pitch: finalConfig.pitch ?? 1,
          speed: finalConfig.speed ?? 1,
          volume: finalConfig.volume ?? 1,
          personality: { tone: 'neutral', emotion: 'neutral', speakingStyle: 'neutral' },
          subtitles: true,
          spatialAudio: true,
          interruptible: true,
        } as NPCVoiceProfile);

        if (!validation.valid) {
          throw new Error(`Voice config invalid: ${validation.errors.join(', ')}`);
        }

        // Browser Web Speech handles playback internally. Start approximate visual
        // mouth timing before awaiting it, but do not present that timing as phoneme-accurate.
        if (this.provider.id === 'browser') {
          const estimatedMs = Math.max(text.length * 50, 250);
          this.startLipSync(text, estimatedMs);
        }

        const voiceResult = await this.provider.generateSpeech(text, finalConfig);
        if (generation !== this.playbackGeneration) return;

        if (!voiceResult.playbackHandled && voiceResult.audioBuffer.byteLength > 0) {
          this.startLipSync(text, Math.max(voiceResult.duration * 1000, 250));
          await this.playEncodedAudio(voiceResult.audioBuffer, generation);
        }
      } catch (error) {
        if (generation === this.playbackGeneration) {
          console.error('[VoiceComponent] Failed to play voice:', error);
          throw error;
        }
      } finally {
        if (generation === this.playbackGeneration) {
          this.animationSync.stop();
          if (animationName) this.onAnimationEnd(animationName);
          if (facialAnimationName) this.onFacialAnimationEnd(facialAnimationName);
          this.isPlaying = false;
          this.playPromise = null;
        }
      }
    })();

    return this.playPromise;
  }

  private startLipSync(text: string, durationMs: number): void {
    const visemes = generateVisemesFromText(text, durationMs);
    this.animationSync.speak(text, visemes);
    this.animationSync.onVisemeUpdate((viseme) => {
      this.onFacialAnimationStart(`viseme_${viseme.timestamp}`);
    });
  }

  private async playEncodedAudio(audioBuffer: ArrayBuffer, generation: number): Promise<void> {
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    const decodedAudio = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
    if (generation !== this.playbackGeneration) return;

    this.positionalAudio.setBuffer(decodedAudio);
    this.positionalAudio.play();

    const source = this.positionalAudio.source as AudioBufferSourceNode | null;
    if (!source) return;

    await new Promise<void>((resolve) => {
      source.addEventListener('ended', () => resolve(), { once: true });
    });
  }

  public update(deltaTime: number): void {
    this.animationSync.update(deltaTime);
  }

  public stop(): void {
    this.playbackGeneration += 1;
    this.animationSync.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      if (this.positionalAudio.isPlaying) this.positionalAudio.stop();
    } catch {
      // Source was already stopped.
    }
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
    this.stop();
    this.animationSync.dispose();
    this.positionalAudio.disconnect();
    if (this.audioContext.state !== 'closed') void this.audioContext.close();
  }
}
