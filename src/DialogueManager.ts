import { NPCDialogue, NPCVoiceProfile } from './gltfCompiler.js';
import { VoiceProvider, VoiceGenerationOptions, VoiceResult, VoiceInfo, voiceProviderRegistry } from './VoiceProvider.js';

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

  constructor(private providerId: string = 'browser') {}

  private getProvider(): VoiceProvider {
    return voiceProviderRegistry.get(this.providerId) || voiceProviderRegistry.getDefault()!;
  }

  public setProvider(providerId: string): void {
    this.providerId = providerId;
  }

  /**
   * Add dialogue to the queue
   */
  public queue(dialogue: NPCDialogue): void {
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

  public pause(): void {
  }

  public resume(): void {
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
    
    return `${dialogue.text}|${voice.voiceId}|${voice.provider}|${voice.language}|${voice.pitch}|${voice.speed}|${voice.volume}|${voice.personality.tone}|${voice.personality.emotion}|${voice.personality.speakingStyle}`;
  }
}