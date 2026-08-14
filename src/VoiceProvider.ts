import { NPCVoiceProfile } from './gltfCompiler.js';

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
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
}

export interface VoiceConfig {
  voiceId: string;
  pitch?: number;
  speed?: number;
  volume?: number;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  language?: string;
  [key: string]: any;
}

export interface VoiceGenerationOptions {
  voiceId?: string;
  pitch?: number;
  speed?: number;
  volume?: number;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  language?: string;
  [key: string]: any;
}

export interface VoiceResult {
  audioBuffer: ArrayBuffer;
  duration: number;
}

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender?: string;
  previewUrl?: string;
}

export interface VoiceProvider {
  id: string;
  name: string;
  generateSpeech(text: string, options: VoiceGenerationOptions): Promise<VoiceResult>;
  getVoices(): Promise<VoiceInfo[]>;
  supportsStreaming(): boolean;
  validateConfig(config: NPCVoiceProfile): { valid: boolean; errors: string[] };
}

export class BrowserTTSProvider implements VoiceProvider {
  id = 'browser';
  name = 'Browser Speech Synthesis';
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.voices = speechSynthesis.getVoices();
    this.voicesLoaded = true;
  }

  async generateSpeech(text: string, options: VoiceGenerationOptions): Promise<VoiceResult> {
    return new Promise((resolve, reject) => {
      if (!this.voicesLoaded) {
        this.loadVoices();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      const voice = this.voices.find(v => v.name === options.voiceId) || this.voices[0];
      if (voice) utterance.voice = voice;
      
      utterance.pitch = options.pitch ?? 1.0;
      utterance.rate = options.speed ?? 1.0;
      utterance.volume = options.volume ?? 1.0;
      utterance.lang = options.language ?? 'en-US';

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(dest.stream);
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const arrayBuffer = await blob.arrayBuffer();
        resolve({
          audioBuffer: arrayBuffer,
          duration: text.length * 0.05
        });
      };

      mediaRecorder.start();
      speechSynthesis.speak(utterance);

      utterance.onend = () => {
        mediaRecorder.stop();
        audioContext.close();
      };

      utterance.onerror = (e) => {
        mediaRecorder.stop();
        audioContext.close();
        reject(new Error(`Browser TTS error: ${e.error}`));
      };
    });
  }

  async getVoices(): Promise<VoiceInfo[]> {
    if (!this.voicesLoaded) this.loadVoices();
    return this.voices.map(v => ({
      id: v.name,
      name: `${v.name} (${v.lang})`,
      language: v.lang,
      gender: undefined
    }));
  }

  supportsStreaming(): boolean {
    return false;
  }

  validateConfig(config: NPCVoiceProfile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.enabled) errors.push('Voice is disabled');
    if (!('speechSynthesis' in window)) errors.push('Browser TTS not supported');
    return { valid: errors.length === 0, errors };
  }
}

export class ElevenLabsTTSProvider implements VoiceProvider {
  id = 'elevenlabs';
  name = 'ElevenLabs';
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private voicesCache: VoiceInfo[] | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSpeech(text: string, options: VoiceGenerationOptions): Promise<VoiceResult> {
    const voiceId = options.voiceId || 'rachel';
    const url = `${this.baseUrl}/text-to-speech/${voiceId}`;

    const requestBody = {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.5,
        style: options.style ?? 0.0,
        use_speaker_boost: true,
      },
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
      const error = await response.text();
      throw new Error(`ElevenLabs TTS failed: ${response.status} ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      audioBuffer: arrayBuffer,
      duration: text.length * 0.05
    };
  }

  async getVoices(): Promise<VoiceInfo[]> {
    if (this.voicesCache) return this.voicesCache;

    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: { 'xi-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ElevenLabs voices');
    }

    const data = await response.json();
    this.voicesCache = data.voices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      language: v.labels?.language || 'en',
      gender: v.labels?.gender,
      previewUrl: v.preview_url,
    }));

    return this.voicesCache!;
  }

  supportsStreaming(): boolean {
    return true;
  }

  validateConfig(config: NPCVoiceProfile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.enabled) errors.push('Voice is disabled');
    if (!this.apiKey) errors.push('ElevenLabs API key required');
    if (config.provider !== 'elevenlabs') errors.push('Provider mismatch');
    return { valid: errors.length === 0, errors };
  }
}

export class VoiceProviderRegistry {
  private providers: Map<string, VoiceProvider> = new Map();

  register(provider: VoiceProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): VoiceProvider | undefined {
    return this.providers.get(id);
  }

  getDefault(): VoiceProvider | undefined {
    return this.providers.get('browser') || this.providers.values().next().value;
  }

  getAll(): VoiceProvider[] {
    return Array.from(this.providers.values());
  }

  async getAllVoices(): Promise<Map<string, VoiceInfo[]>> {
    const result = new Map<string, VoiceInfo[]>();
    for (const [id, provider] of this.providers) {
      try {
        result.set(id, await provider.getVoices());
      } catch {
        result.set(id, []);
      }
    }
    return result;
  }
}

export const voiceProviderRegistry = new VoiceProviderRegistry();

if (typeof window !== 'undefined') {
  voiceProviderRegistry.register(new BrowserTTSProvider());
  // Register worker provider as alternative
  try {
    const { BrowserTTSWorkerProvider } = await import('./BrowserTTSWorkerProvider.js');
    voiceProviderRegistry.register(new BrowserTTSWorkerProvider());
  } catch {
    // Worker not supported in this environment
  }
}

export function createElevenLabsProvider(apiKey: string): ElevenLabsTTSProvider {
  const provider = new ElevenLabsTTSProvider(apiKey);
  voiceProviderRegistry.register(provider);
  return provider;
}