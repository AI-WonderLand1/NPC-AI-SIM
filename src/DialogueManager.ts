import { NPCDialogue, NPCVoiceProfile } from './gltfCompiler.js';
import { VoiceProvider, VoiceGenerationOptions, VoiceResult, VoiceInfo, voiceProviderRegistry } from './VoiceProvider.js';
import { AISafetyValidator, aiSafetyValidator, NPCBehaviorState } from './AISafetyValidator.js';
import { NPCEventType } from './NPCEvents.js';
import { AudioAssetManager, audioAssetManager } from './AudioAssetManager.js';

export class DialogueManager {
  private voiceCache: Map<string, ArrayBuffer> = new Map();
  private currentDialogue: NPCDialogue | null = null;
  private dialogueQueue: NPCDialogue[] = [];
  private isPlaying: boolean = false;
  
  // Callbacks
  public onDialogueStart: (dialogue: NPCDialogue) => void = () => {};
  public onDialogueEnd: (dialogue: NPCDialogue) => void = () => {};
  public onDialogueQueueChanged: (queue: NPCDialogue[]) => void = () => {};
  public onVoiceGenerated: (dialogueId: string, audioBuffer: ArrayBuffer) => void = () => {};
  public onDialogueRejected: (dialogue: NPCDialogue, errors: string[]) => void = () => {};

  private validator: AISafetyValidator = aiSafetyValidator;
  private assetManager: AudioAssetManager = audioAssetManager;

  constructor(private providerId: string = 'browser') {
    console.log('[DialogueManager] Initialized with provider:', providerId);
  }

  public setValidator(validator: AISafetyValidator): void {
    this.validator = validator;
    console.log('[DialogueManager] Validator updated');
  }

  public setAssetManager(manager: AudioAssetManager): void {
    this.assetManager = manager;
    console.log('[DialogueManager] Asset manager updated');
  }

  public setNPCBehaviorState(state: Partial<NPCBehaviorState>): void {
    this.validator.setNPCState(state);
  }

  private getProvider(): VoiceProvider {
    return voiceProviderRegistry.get(this.providerId) || voiceProviderRegistry.getDefault()!;
  }

  public setProvider(providerId: string): void {
    this.providerId = providerId;
  }

  /**
   * Add dialogue to the queue with AI safety validation
   */
  public queue(dialogue: NPCDialogue, context?: { behaviorEvent?: NPCEventType }): void {
    // Validate dialogue through AI safety layer
    const validation = this.validator.validateDialogue(dialogue, context);
    
    if (!validation.valid) {
      console.warn('[DialogueManager] Dialogue rejected by safety validator:', validation.errors);
      this.onDialogueRejected(dialogue, validation.errors);
      return;
    }

    // Log warnings
    if (validation.warnings.length > 0) {
      console.warn('[DialogueManager] Dialogue warnings:', validation.warnings);
    }

    // Use sanitized dialogue if available
    const finalDialogue = validation.sanitizedDialogue || dialogue;
    
    if (finalDialogue.priority === undefined) finalDialogue.priority = 0;
    
    console.log('[DialogueManager] Queued dialogue:', finalDialogue.id, finalDialogue.text.substring(0, 50), 'priority:', finalDialogue.priority);
    
    let inserted = false;
    for (let i = 0; i < this.dialogueQueue.length; i++) {
      if (finalDialogue.priority < this.dialogueQueue[i].priority!) {
        this.dialogueQueue.splice(i, 0, finalDialogue);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.dialogueQueue.push(finalDialogue);
    }
    
    this.onDialogueQueueChanged([...this.dialogueQueue]);
    
    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  /**
   * Process the next dialogue in queue
   */
  private async processQueue(): Promise<void> {
    if (this.dialogueQueue.length === 0) {
      console.log('[DialogueManager] Queue empty, stopping');
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const dialogue = this.dialogueQueue.shift()!;
    this.onDialogueQueueChanged([...this.dialogueQueue]);
    this.currentDialogue = dialogue;

    console.log('[DialogueManager] Processing dialogue:', dialogue.id, dialogue.text.substring(0, 50));

    try {
      this.onDialogueStart(dialogue);
      
      const cacheKey = this.generateCacheKey(dialogue);
      let audioBuffer: ArrayBuffer | null = this.voiceCache.get(cacheKey) ?? null;
      
      if (audioBuffer === null) {
        const voiceConfig = dialogue.voice ?? {
          enabled: true,
          voiceId: "default",
          provider: "elevenlabs",
          language: "en-US",
          pitch: 1.0,
          speed: 1.0,
          volume: 1.0,
          personality: {
            tone: "neutral",
            emotion: "calm",
            speakingStyle: "conversational"
          },
          subtitles: true,
          spatialAudio: true,
          interruptible: true
        };
        
        const options: VoiceGenerationOptions = {
          voiceId: voiceConfig.voiceId,
          pitch: voiceConfig.pitch,
          speed: voiceConfig.speed,
          volume: voiceConfig.volume,
          stability: 0.5,
          similarityBoost: 0.5,
          style: 0.0,
          language: voiceConfig.language
        };
        
        const provider = this.getProvider();
        const voiceResult = await provider.generateSpeech(dialogue.text, options);
        
        audioBuffer = voiceResult.audioBuffer;
        
        if (audioBuffer !== null) {
          this.voiceCache.set(cacheKey, audioBuffer);
          this.onVoiceGenerated(dialogue.id, audioBuffer);
          
          // Save generated audio as project asset
          const voiceConfig = dialogue.voice ?? {
            voiceId: "default",
            provider: "elevenlabs",
            language: "en-US",
            pitch: 1.0,
            speed: 1.0,
            volume: 1.0,
            personality: {
              tone: "neutral",
              emotion: "calm",
              speakingStyle: "conversational"
            }
          };
          
          const asset = this.assetManager.saveGeneratedAudio(
            dialogue.text,
            audioBuffer,
            {
              voiceId: voiceConfig.voiceId,
              provider: voiceConfig.provider,
              language: voiceConfig.language,
              pitch: voiceConfig.pitch,
              speed: voiceConfig.speed,
              volume: voiceConfig.volume,
              emotion: voiceConfig.personality?.emotion
            },
            'audio/wav',
            voiceResult.duration
          );
          
          console.log(`[DialogueManager] Audio saved as asset: ${asset.id}`);
        }
      }
      
      const estimatedDuration = dialogue.text.length * 0.05;
      await new Promise(resolve => setTimeout(resolve, estimatedDuration * 1000));
      
      this.onDialogueEnd(dialogue);
    } catch (error) {
      console.error("Error processing dialogue:", error);
      this.onDialogueEnd(dialogue);
    } finally {
      this.currentDialogue = null;
      await this.processQueue();
    }
  }

  public skip(): void {
    if (this.currentDialogue) {
      this.onDialogueEnd(this.currentDialogue);
      this.currentDialogue = null;
    }
    this.processQueue();
  }

  public stop(): void {
    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.isPlaying = false;
    this.onDialogueQueueChanged([]);
    this.onDialogueEnd(this.currentDialogue!);
  }

  /**
   * Interrupt current dialogue and optionally queue a new one
   * Used when NPC behavior changes (e.g., player attacks, NPC dies)
   */
  public interrupt(reason: string = 'interrupted'): void {
    if (this.currentDialogue) {
      this.onDialogueEnd(this.currentDialogue);
    }
    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.isPlaying = false;
    this.onDialogueQueueChanged([]);
    console.log(`[DialogueManager] Interrupted: ${reason}`);
  }

  /**
   * Interrupt and queue a high-priority dialogue immediately
   */
  public interruptAndQueue(dialogue: NPCDialogue): void {
    this.interrupt('replaced by higher priority');
    dialogue.priority = 999; // Highest priority
    this.queue(dialogue);
  }

  public pause(): void {
    // Pause current playback - would need integration with VoiceComponent
  }

  public resume(): void {
    // Resume paused playback
  }

  public clear(): void {
    this.dialogueQueue = [];
    if (!this.currentDialogue) {
      this.isPlaying = false;
    }
    this.onDialogueQueueChanged([]);
  }

  public getCurrentDialogue(): NPCDialogue | null {
    return this.currentDialogue;
  }

  public getDialogueQueue(): NPCDialogue[] {
    return [...this.dialogueQueue];
  }

  private generateCacheKey(dialogue: NPCDialogue): string {
    const voice = dialogue.voice ?? {
      voiceId: "default",
      provider: "elevenlabs",
      language: "en-US",
      pitch: 1.0,
      speed: 1.0,
      volume: 1.0,
      personality: {
        tone: "neutral",
        emotion: "calm",
        speakingStyle: "conversational"
      }
    };
    
    // Create stable key using only essential parameters
    const keyParts = [
      dialogue.text,
      voice.voiceId,
      voice.provider,
      voice.language,
      Math.round(voice.pitch * 10) / 10, // Round to 1 decimal
      Math.round(voice.speed * 10) / 10,
      Math.round(voice.volume * 10) / 10,
      voice.personality.tone,
      voice.personality.emotion,
      voice.personality.speakingStyle
    ];
    
    // Simple hash function for stable key
    let hash = 0;
    const str = keyParts.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `voice_${Math.abs(hash).toString(36)}`;
  }
}