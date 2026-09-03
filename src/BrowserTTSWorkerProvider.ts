import { VoiceProvider, VoiceGenerationOptions, VoiceResult, VoiceInfo, NPCVoiceProfile } from './VoiceProvider.js';

/**
 * Browser TTS Provider that uses a Web Worker for off-main-thread synthesis
 */
export class BrowserTTSWorkerProvider implements VoiceProvider {
  id = 'browser-worker';
  name = 'Browser Speech Synthesis (Worker)';
  private worker: Worker | null = null;
  private voicesLoaded = false;
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }> = new Map();
  private requestId = 0;

  constructor() {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('./ttsWorker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = (error) => {
          console.error('[BrowserTTSWorkerProvider] Worker error:', error);
        };
      } catch (error) {
        console.warn('[BrowserTTSWorkerProvider] Failed to create worker, falling back to main thread:', error);
        this.worker = null;
      }
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { type, id, payload, error } = event.data;
    const pending = this.pendingRequests.get(id);
    
    if (!pending) return;
    
    this.pendingRequests.delete(id);
    
    if (type === 'result') {
      pending.resolve(payload);
    } else if (type === 'error') {
      pending.reject(new Error(error || 'Unknown error'));
    } else if (type === 'voices') {
      pending.resolve(payload as VoiceInfo[]);
    }
  }

  private generateRequestId(): string {
    return `tts_${Date.now()}_${++this.requestId}`;
  }

  async generateSpeech(text: string, options: VoiceGenerationOptions): Promise<VoiceResult> {
    if (!this.worker) {
      // Fallback to main thread synthesis
      return this.fallbackSynthesize(text, options);
    }

    return new Promise((resolve, reject) => {
      const id = this.generateRequestId();
      this.pendingRequests.set(id, { resolve, reject });
      
      this.worker!.postMessage({
        type: 'synthesize',
        id,
        payload: { text, options }
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('TTS synthesis timeout'));
        }
      }, 30000);
    });
  }

  private async fallbackSynthesize(text: string, options: VoiceGenerationOptions): Promise<VoiceResult> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = speechSynthesis.getVoices().find(v => v.name === options.voiceId) || speechSynthesis.getVoices()[0];
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
        audioContext.close();
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
    if (!this.worker) {
      // Fallback
      if (!this.voicesLoaded) {
        // Wait for voices to load
        await new Promise<void>(resolve => {
          if (speechSynthesis.getVoices().length > 0) {
            this.voicesLoaded = true;
            resolve();
          } else {
            speechSynthesis.onvoiceschanged = () => {
              this.voicesLoaded = true;
              resolve();
            };
          }
        });
      }
      return speechSynthesis.getVoices().map(v => ({
        id: v.name,
        name: `${v.name} (${v.lang})`,
        language: v.lang,
        gender: undefined
      }));
    }

    return new Promise((resolve, reject) => {
      const id = this.generateRequestId();
      this.pendingRequests.set(id, { 
        resolve: resolve as any, 
        reject 
      });
      
      this.worker!.postMessage({ type: 'getVoices', id });
      
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Get voices timeout'));
        }
      }, 5000);
    });
  }

  supportsStreaming(): boolean {
    return false;
  }

  validateConfig(config: NPCVoiceProfile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.enabled) errors.push('Voice is disabled');
    if (!('speechSynthesis' in window)) errors.push('Browser TTS not supported');
    if (!this.worker) errors.push('Web Worker not available, using fallback');
    return { valid: errors.length === 0, errors };
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pendingRequests.clear();
  }
}