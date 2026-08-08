import { NPCDialogue, NPCVoiceProfile } from './gltfCompiler.js';

export interface VoiceGenerationOptions {
  voiceId?: string;
  pitch?: number;
  speed?: number;
  volume?: number;
}

export interface VoiceResult {
  audioBuffer: ArrayBuffer;
  duration: number; // in seconds
}

export abstract class VoiceProvider {
  abstract id: string;

  abstract generateSpeech(
    text: string,
    options: VoiceGenerationOptions
  ): Promise<VoiceResult>;

  abstract getVoices(): Promise<VoiceInfo[]>;

  abstract supportsStreaming(): boolean;
}

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender?: string;
}

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

  constructor(private ttsService: any) {} // TTSService would be injected

  /**
   * Add dialogue to the queue
   */
  public queue(dialogue: NPCDialogue): void {
    // Insert based on priority (lower number = higher priority)
    if (dialogue.priority === undefined) dialogue.priority = 0;
    
    let inserted = false;
    for (let i = 0; i < this.dialogueQueue.length; i++) {
      if (dialogue.priority < this.dialogueQueue[i].priority!) {
        this.dialogueQueue.splice(i, 0, dialogue);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.dialogueQueue.push(dialogue);
    }
    
    this.onDialogueQueueChanged([...this.dialogueQueue]);
    
    // Start playing if not already
    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  /**
   * Process the next dialogue in queue
   */
  private async processQueue(): Promise<void> {
    if (this.dialogueQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const dialogue = this.dialogueQueue.shift()!;
    this.onDialogueQueueChanged([...this.dialogueQueue]);
    this.currentDialogue = dialogue;

    try {
      this.onDialogueStart(dialogue);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(dialogue);
      let audioBuffer: ArrayBuffer | null = this.voiceCache.get(cacheKey) ?? null;
      
      if (audioBuffer === null) {
        // Generate voice
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
          volume: voiceConfig.volume
        };
        
        const voiceResult = await this.ttsService.synthesize(
          dialogue.text,
          options
        );
        
        audioBuffer = voiceResult.audioBuffer;
        
        // Cache the generated audio
        if (audioBuffer !== null) {
          this.voiceCache.set(cacheKey, audioBuffer);
          this.onVoiceGenerated(dialogue.id, audioBuffer);
        }
      }
      
      // Here we would typically return the audio buffer to be played by VoiceComponent
      // For now, we'll just indicate that dialogue has completed
      // In a real implementation, this would integrate with VoiceComponent.play()
      
      // Simulate playback duration (in reality, this would be based on audio length)
      const estimatedDuration = dialogue.text.length * 0.05; // Rough estimate: 50ms per character
      await new Promise(resolve => setTimeout(resolve, estimatedDuration * 1000));
      
      this.onDialogueEnd(dialogue);
    } catch (error) {
      console.error("Error processing dialogue:", error);
      this.onDialogueEnd(dialogue); // Still call end even on error
    } finally {
      this.currentDialogue = null;
      // Process next in queue
      await this.processQueue();
    }
  }

  /**
   * Skip current dialogue and move to next
   */
  public skip(): void {
    if (this.currentDialogue) {
      this.onDialogueEnd(this.currentDialogue);
      this.currentDialogue = null;
    }
    // Process next in queue
    this.processQueue();
  }

  /**
   * Stop all dialogue and clear queue
   */
  public stop(): void {
    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.isPlaying = false;
    this.onDialogueQueueChanged([]);
    this.onDialogueEnd(this.currentDialogue!); // Notify end of current if any
  }

  /**
   * Pause current dialogue
   */
  public pause(): void {
    // Implementation would pause audio playback
    // For now, just a placeholder
  }

  /**
   * Resume paused dialogue
   */
  public resume(): void {
    // Implementation would resume audio playback
    // For now, just a placeholder
  }

  /**
   * Clear the dialogue queue
   */
  public clear(): void {
    this.dialogueQueue = [];
    if (!this.currentDialogue) {
      this.isPlaying = false;
    }
    this.onDialogueQueueChanged([]);
  }

  /**
   * Get current dialogue
   */
  public getCurrentDialogue(): NPCDialogue | null {
    return this.currentDialogue;
  }

  /**
   * Get dialogue queue
   */
  public getDialogueQueue(): NPCDialogue[] {
    return [...this.dialogueQueue];
  }

  /**
   * Generate cache key for dialogue
   */
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
    
    return `${dialogue.text}|${voice.voiceId}|${voice.provider}|${voice.language}|${voice.pitch}|${voice.speed}|${voice.volume}|${voice.personality.tone}|${voice.personality.emotion}|${voice.personality.speakingStyle}`;
  }
}