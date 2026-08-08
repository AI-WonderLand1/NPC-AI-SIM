import { compileSmartNPC, NPCProfile, NPCVoiceProfile, NPCDialogue } from './gltfCompiler.js';import { WebsocketBrain, LiveMouthShapes } from './websocketBrain.js';
import { UpgradedViewport } from './UpgradedViewport.js';
import { VoiceComponent, VoiceConfig, TTSService, ElevenLabsTTSService, NPCVoiceProfile as VoiceComponentNPCVoiceProfile } from './VoiceComponent.js';
import { DialogueManager, VoiceProvider, VoiceInfo, VoiceGenerationOptions, VoiceResult } from './DialogueManager.js';
import { SubtitleSystem, SubtitleOptions } from './SubtitleSystem.js';
import { NPCEventEmitter, NPCEventType, NPCEventMap } from './NPCEvents.js';
import { Scene3D } from './components/Scene3D.js';
import { useSubscription, SubscriptionProvider, subscriptionAPI, type Subscription, type SubscriptionContextType, type SubscriptionAPI } from './components/SubscriptionContext.js';
export { NPCProfile, NPCVoiceProfile, NPCDialogue, LiveMouthShapes, UpgradedViewport, VoiceComponent, VoiceConfig, TTSService, ElevenLabsTTSService, DialogueManager, VoiceProvider, VoiceInfo, VoiceGenerationOptions, VoiceResult, SubtitleSystem, SubtitleOptions, NPCEventEmitter, NPCEventType, NPCEventMap, Scene3D, useSubscription, SubscriptionProvider, subscriptionAPI };
export type { Subscription, SubscriptionContextType, SubscriptionAPI };
export class CustomNPCEngine {
  private brain: WebsocketBrain | null = null;
  private eventEmitter: NPCEventEmitter = new NPCEventEmitter();
   
  public onMouthMove: (weights: LiveMouthShapes) => void = () => {};
  public onAudioTrack: (audio: ArrayBuffer) => void = () => {};
  public onDialogueStart: (dialogue: NPCDialogue) => void = () => {};
  public onDialogueEnd: (dialogue: NPCDialogue) => void = () => {};
  public onDialogueQueued: (dialogue: NPCDialogue) => void = () => {};
  public onAnimationStart: (animationName: string) => void = () => {};
  public onAnimationEnd: (animationName: string) => void = () => {};
  public onFacialAnimationStart: (animationName: string) => void = () => {};
  public onFacialAnimationEnd: (animationName: string) => void = () => {};
  public onSubtitleShow: (subtitle: HTMLElement) => void = () => {};
  public onSubtitleHide: () => void = () => {};
  public onNpcEvent: <T extends NPCEventType>(eventType: T, eventData: NPCEventMap[T]) => void = () => {};

  constructor(private cloudServerUrl: string) {}

  public async prepareAsset(rawGlb: ArrayBuffer, aiProfile: NPCProfile): Promise<string> {
    const smartBuffer = await compileSmartNPC(rawGlb, aiProfile);
    const blob = new Blob([smartBuffer], { type: "model/gltf-binary" });
    return URL.createObjectURL(blob);
  }

  public startRuntime(npcId: string): void {
    this.brain = new WebsocketBrain(this.cloudServerUrl, npcId);
    
    this.brain.onVoiceData = (audio, visemes) => {
      if (audio.byteLength > 0) this.onAudioTrack(audio);
      this.onMouthMove(visemes);
    };

    // Emit NPC spawned event
    this.eventEmitter.emit('NPC_SPAWNED', { npcId });
    
    this.brain.connect();
  }

  public talkToNPC(message: string): void {
    this.brain?.sendPlayerInput(message);
    
    // Emit dialogue started event (simplified)
    this.eventEmitter.emit('NPC_DIALOGUE_STARTED', { npcId: "unknown", dialogueId: "user_input" });
  }

  public destroy(): void {
    // Emit NPC died event
    this.eventEmitter.emit('NPC_DIED', { npcId: "unknown", cause: "engine_destroyed" });
    
    this.brain?.disconnect();
    this.brain = null;
    
    // Clean up event emitter
    this.eventEmitter.removeAllListeners();
  }
  
  /**
   * Get the NPC event emitter for subscribing to events
   */
  public getEventEmitter(): NPCEventEmitter {
    return this.eventEmitter;
  }
}