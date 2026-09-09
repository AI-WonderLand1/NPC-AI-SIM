import { NPCDialogue } from './gltfCompiler.js';
import { VoiceGenerationOptions, VoiceProvider, VoiceResult, voiceProviderRegistry } from './VoiceProvider.js';
import { AISafetyValidator, aiSafetyValidator, NPCBehaviorState } from './AISafetyValidator.js';
import { NPCEventType } from './NPCEvents.js';
import { AudioAssetManager, audioAssetManager } from './AudioAssetManager.js';

export class DialogueManager {
  private voiceCache: Map<string, VoiceResult> = new Map();
  private currentDialogue: NPCDialogue | null = null;
  private dialogueQueue: NPCDialogue[] = [];
  private isPlaying = false;
  private playbackGeneration = 0;
  private currentAudioContext: AudioContext | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private currentProviderId: string | null = null;

  public onDialogueStart: (dialogue: NPCDialogue) => void = () => {};
  public onDialogueEnd: (dialogue: NPCDialogue) => void = () => {};
  public onDialogueQueueChanged: (queue: NPCDialogue[]) => void = () => {};
  public onVoiceGenerated: (dialogueId: string, audioBuffer: ArrayBuffer) => void = () => {};
  public onDialogueRejected: (dialogue: NPCDialogue, errors: string[]) => void = () => {};

  private validator: AISafetyValidator = aiSafetyValidator;
  private assetManager: AudioAssetManager = audioAssetManager;

  constructor(private providerId = 'browser') {
    console.log('[DialogueManager] Initialized with provider:', providerId);
  }

  public setValidator(validator: AISafetyValidator): void {
    this.validator = validator;
  }

  public setAssetManager(manager: AudioAssetManager): void {
    this.assetManager = manager;
  }

  public setNPCBehaviorState(state: Partial<NPCBehaviorState>): void {
    this.validator.setNPCState(state);
  }

  private getProvider(requestedProviderId?: string): VoiceProvider {
    const requested = requestedProviderId ? voiceProviderRegistry.get(requestedProviderId) : undefined;
    const configured = voiceProviderRegistry.get(this.providerId);
    const provider = requested || configured || voiceProviderRegistry.getDefault();
    if (!provider) throw new Error('No voice provider is registered');
    return provider;
  }

  public setProvider(providerId: string): void {
    this.providerId = providerId;
  }

  public queue(dialogue: NPCDialogue, context?: { behaviorEvent?: NPCEventType }): void {
    const validation = this.validator.validateDialogue(dialogue, context);

    if (!validation.valid) {
      console.warn('[DialogueManager] Dialogue rejected by safety validator:', validation.errors);
      this.onDialogueRejected(dialogue, validation.errors);
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('[DialogueManager] Dialogue warnings:', validation.warnings);
    }

    const finalDialogue = validation.sanitizedDialogue || dialogue;
    if (finalDialogue.priority === undefined) finalDialogue.priority = 0;

    // Higher priority must run first. Equal priority remains FIFO.
    const insertAt = this.dialogueQueue.findIndex(
      (queued) => finalDialogue.priority! > (queued.priority ?? 0),
    );
    if (insertAt === -1) this.dialogueQueue.push(finalDialogue);
    else this.dialogueQueue.splice(insertAt, 0, finalDialogue);

    this.onDialogueQueueChanged([...this.dialogueQueue]);
    if (!this.isPlaying) void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isPlaying) return;
    if (this.dialogueQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    const generation = this.playbackGeneration;
    this.isPlaying = true;
    const dialogue = this.dialogueQueue.shift()!;
    this.currentDialogue = dialogue;
    this.onDialogueQueueChanged([...this.dialogueQueue]);
    this.onDialogueStart(dialogue);

    try {
      const requestedProvider = dialogue.voice?.provider;
      const provider = this.getProvider(requestedProvider);
      this.currentProviderId = provider.id;
      const cacheKey = this.generateCacheKey(dialogue, provider.id);
      let voiceResult = this.voiceCache.get(cacheKey);

      if (!voiceResult) {
        const voiceConfig = dialogue.voice;
        const options: VoiceGenerationOptions = {
          voiceId: voiceConfig?.voiceId ?? 'default',
          pitch: voiceConfig?.pitch ?? 1,
          speed: voiceConfig?.speed ?? 1,
          volume: voiceConfig?.volume ?? 1,
          stability: 0.5,
          similarityBoost: 0.5,
          style: 0,
          language: voiceConfig?.language ?? 'en-US',
        };

        voiceResult = await provider.generateSpeech(dialogue.text, options);
        if (generation !== this.playbackGeneration) return;

        // Only cache and export bytes that a provider really returned.
        if (voiceResult.audioBuffer.byteLength > 0) {
          this.voiceCache.set(cacheKey, voiceResult);
          this.onVoiceGenerated(dialogue.id, voiceResult.audioBuffer);

          const asset = this.assetManager.saveGeneratedAudio(
            dialogue.text,
            voiceResult.audioBuffer,
            {
              voiceId: voiceConfig?.voiceId ?? 'default',
              provider: provider.id,
              language: voiceConfig?.language ?? 'en-US',
              pitch: voiceConfig?.pitch ?? 1,
              speed: voiceConfig?.speed ?? 1,
              volume: voiceConfig?.volume ?? 1,
              emotion: voiceConfig?.personality?.emotion,
            },
            voiceResult.mimeType ?? 'application/octet-stream',
            voiceResult.duration,
          );
          console.log(`[DialogueManager] Audio saved as asset: ${asset.id}`);
        }
      }

      if (generation !== this.playbackGeneration) return;

      // Browser Web Speech performs playback inside the provider and resolves only
      // when the utterance actually ends. Encoded providers are played here.
      if (!voiceResult.playbackHandled && voiceResult.audioBuffer.byteLength > 0) {
        await this.playGeneratedAudio(voiceResult.audioBuffer);
      }

      if (generation === this.playbackGeneration && this.currentDialogue === dialogue) {
        this.onDialogueEnd(dialogue);
      }
    } catch (error) {
      if (generation === this.playbackGeneration) {
        console.error('[DialogueManager] Dialogue playback failed:', error);
        if (this.currentDialogue === dialogue) this.onDialogueEnd(dialogue);
      }
    } finally {
      if (generation !== this.playbackGeneration) return;
      this.currentDialogue = null;
      this.currentProviderId = null;
      this.isPlaying = false;
      this.cleanupAudioPlayback();
      if (this.dialogueQueue.length > 0) void this.processQueue();
    }
  }

  private async playGeneratedAudio(audioBuffer: ArrayBuffer): Promise<void> {
    if (typeof window === 'undefined') return;

    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) throw new Error('Web Audio is unavailable');

    const context = new AudioContextCtor();
    const decoded = await context.decodeAudioData(audioBuffer.slice(0));
    const source = context.createBufferSource();
    source.buffer = decoded;
    source.connect(context.destination);
    this.currentAudioContext = context;
    this.currentAudioSource = source;

    await new Promise<void>((resolve) => {
      source.addEventListener('ended', () => resolve(), { once: true });
      source.start();
    });
  }

  private cancelPlayback(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      this.currentAudioSource?.stop();
    } catch {
      // Already stopped.
    }
    this.cleanupAudioPlayback();
  }

  private cleanupAudioPlayback(): void {
    this.currentAudioSource?.disconnect();
    this.currentAudioSource = null;
    if (this.currentAudioContext && this.currentAudioContext.state !== 'closed') {
      void this.currentAudioContext.close();
    }
    this.currentAudioContext = null;
  }

  public skip(): void {
    const active = this.currentDialogue;
    this.playbackGeneration += 1;
    this.cancelPlayback();
    this.currentDialogue = null;
    this.currentProviderId = null;
    this.isPlaying = false;
    if (active) this.onDialogueEnd(active);
    if (this.dialogueQueue.length > 0) void this.processQueue();
  }

  public stop(): void {
    const active = this.currentDialogue;
    this.playbackGeneration += 1;
    this.cancelPlayback();
    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.currentProviderId = null;
    this.isPlaying = false;
    this.onDialogueQueueChanged([]);
    if (active) this.onDialogueEnd(active);
  }

  public interrupt(reason = 'interrupted'): void {
    this.stop();
    console.log(`[DialogueManager] Interrupted: ${reason}`);
  }

  public interruptAndQueue(dialogue: NPCDialogue): void {
    this.interrupt('replaced by higher priority');
    dialogue.priority = 999;
    this.queue(dialogue);
  }

  /** Returns true only when the active playback path was actually paused. */
  public pause(): boolean {
    if (this.currentProviderId === 'browser' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      return true;
    }
    if (this.currentAudioContext?.state === 'running') {
      void this.currentAudioContext.suspend();
      return true;
    }
    return false;
  }

  /** Returns true only when the active playback path was actually resumed. */
  public resume(): boolean {
    if (this.currentProviderId === 'browser' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      return true;
    }
    if (this.currentAudioContext?.state === 'suspended') {
      void this.currentAudioContext.resume();
      return true;
    }
    return false;
  }

  public clear(): void {
    this.dialogueQueue = [];
    this.onDialogueQueueChanged([]);
  }

  public getCurrentDialogue(): NPCDialogue | null {
    return this.currentDialogue;
  }

  public getDialogueQueue(): NPCDialogue[] {
    return [...this.dialogueQueue];
  }

  private generateCacheKey(dialogue: NPCDialogue, providerId: string): string {
    const voice = dialogue.voice;
    const keyParts = [
      dialogue.text,
      providerId,
      voice?.voiceId ?? 'default',
      voice?.language ?? 'en-US',
      Math.round((voice?.pitch ?? 1) * 10) / 10,
      Math.round((voice?.speed ?? 1) * 10) / 10,
      Math.round((voice?.volume ?? 1) * 10) / 10,
      voice?.personality?.tone ?? 'neutral',
      voice?.personality?.emotion ?? 'neutral',
      voice?.personality?.speakingStyle ?? 'conversational',
    ];

    let hash = 0;
    const value = keyParts.join('|');
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(index);
      hash |= 0;
    }
    return `voice_${Math.abs(hash).toString(36)}`;
  }
}
