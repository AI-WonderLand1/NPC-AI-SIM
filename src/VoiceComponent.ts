import * as THREE from 'three';

// Voice configuration interface
export interface VoiceConfig {
  voiceId: string; // TTS service voice identifier
  pitch?: number; // Pitch adjustment (e.g., 0.0 to 2.0, where 1.0 is normal)
  speed?: number; // Speed adjustment (e.g., 0.5 to 2.0, where 1.0 is normal)
  volume?: number; // Volume (0.0 to 1.0)
  // For ElevenLabs: stability, similarityBoost, style, etc. can be added as needed
  [key: string]: any; // Allow service-specific parameters
}

// Extended voice profile from NPC spec
export interface NPCVoiceProfile {
  enabled: boolean;
  voiceId: string;
  provider: string;
  language: string;
  gender?: string;
  pitch: number;
  speed: number;
  volume: number;
  personality: {
    tone: string;
    emotion: string;
    speakingStyle: string;
  };
  subtitles: boolean;
  spatialAudio: boolean;
  interruptible: boolean;
}

// Abstract TTS service interface
export abstract class TTSService {
  abstract synthesize(text: string, voiceConfig: VoiceConfig): Promise<ArrayBuffer>;
}

// Example implementation for ElevenLabs (requires API key)
// Note: In a real application, you would manage the API key securely (e.g., via environment variables)
export class ElevenLabsTTSService extends TTSService {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async synthesize(text: string, voiceConfig: VoiceConfig): Promise<ArrayBuffer> {
    const voiceId = voiceConfig.voiceId;
    const url = `${this.baseUrl}/text-to-speech/${voiceId}`;

    const requestBody = {
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: voiceConfig.stability ?? 0.5,
        similarity_boost: voiceConfig.similarityBoost ?? 0.5,
        style: voiceConfig.style ?? 0.0,
        use_speaker_boost: true,
      },
      // Adjust for pitch and speed if supported by the API
      // Note: ElevenLabs API does not directly support pitch and speed in the voice settings.
      // You might need to use audio post-processing for pitch/speed, or use a different service.
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }
}

// Placeholder for other services (OpenAI, Azure, Coqui, etc.) can be added similarly.

/**
 * VoiceComponent handles text-to-speech conversion and spatial audio playback for an NPC.
 * It should be associated with a specific NPC's 3D object in the scene.
 * Enhanced to support dialogue integration and animation synchronization.
 */
export class VoiceComponent {
  private audioListener: THREE.AudioListener;
  private positionalAudio: THREE.PositionalAudio;
  private ttsService: TTSService;
  private audioContext: AudioContext;
  private isPlaying: boolean = false;
  private playPromise: Promise<void> | null = null;

  // Animation synchronization callbacks
  public onAnimationStart: (animationName: string) => void = () => {};
  public onAnimationEnd: (animationName: string) => void = () => {};
  public onFacialAnimationStart: (animationName: string) => void = () => {};
  public onFacialAnimationEnd: (animationName: string) => void = () => {};

  constructor(
    ttsService: TTSService,
    audioListener: THREE.AudioListener,
    private defaultVoiceConfig: VoiceConfig = { voiceId: '' }
  ) {
    this.ttsService = ttsService;
    this.audioListener = audioListener;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.positionalAudio = new THREE.PositionalAudio(this.audioListener);
    // Set initial properties
    this.positionalAudio.setRefDistance(1.0);
    // Use string for distance model to avoid type issues with InverseDistanceModel
    this.positionalAudio.setDistanceModel('inverse');
  }

  /**
   * Initialize the VoiceComponent by attaching the positional audio to a 3D object.
   * @param object3D The THREE.Object3D to attach the audio to (usually the NPC's root object)
   */
  public attachToObject(object3D: THREE.Object3D): void {
    object3D.add(this.positionalAudio);
  }

  /**
   * Convert text to speech and play it through the positional audio.
   * Enhanced to support animation synchronization callbacks.
   * @param text The text to convert to speech
   * @param voiceConfig Optional voice configuration overrides (defaults to the instance's default)
   * @param animationName Optional animation to play alongside speech
   * @param facialAnimationName Optional facial animation to play alongside speech
   */
  public async speak(
    text: string, 
    voiceConfig: Partial<VoiceConfig> = {},
    animationName?: string,
    facialAnimationName?: string
  ): Promise<void> {
    // Prevent overlapping speech by waiting for current playback to finish
    if (this.isPlaying && this.playPromise) {
      await this.playPromise;
    }

    this.isPlaying = true;
    this.playPromise = (async () => {
      try {
        // Merge voice configs
        const finalConfig = { ...this.defaultVoiceConfig, ...voiceConfig };
        
        // Trigger animation start callbacks
        if (animationName) {
          this.onAnimationStart(animationName);
        }
        if (facialAnimationName) {
          this.onFacialAnimationStart(facialAnimationName);
        }

        // Synthesize audio
        const audioBuffer = await this.ttsService.synthesize(text, finalConfig);
        
        // Decode audio data
        const decodedAudio = await this.audioContext.decodeAudioData(audioBuffer);
        
        // Set the buffer on the positional audio and play
        this.positionalAudio.setBuffer(decodedAudio);
        this.positionalAudio.play();

        // Note: In a more complete implementation, we would wait for audio to finish
        // using positionalAudio.onEnded, but for now we'll rely on estimated timing
        // in the DialogueManager
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

  /**
   * Set the default voice configuration for this component.
   * @param config The new default voice configuration
   */
  public setDefaultVoiceConfig(config: VoiceConfig): void {
    this.defaultVoiceConfig = config;
  }

  /**
   * Update the position of the audio source (usually called when the NPC moves).
   * This is handled automatically by THREE.PositionalAudio if the object3D moves,
   * but if you need to update it manually, you can use this.
   * @param position The new position
   */
  public setPosition(position: THREE.Vector3): void {
    this.positionalAudio.position.copy(position);
  }

  /**
   * Stop current playback
   */
  public stop(): void {
    this.positionalAudio.stop();
    this.isPlaying = false;
    this.playPromise = null;
  }

  /**
   * Check if currently playing
   */
  public isPlayingAudio(): boolean {
    return this.isPlaying;
  }

  /**
   * Dispose of the VoiceComponent resources.
   */
  public dispose(): void {
    this.positionalAudio.disconnect();
    this.audioContext.close();
  }
}