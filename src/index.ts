import { compileSmartNPC, NPCProfile, NPCVoiceProfile, NPCDialogue } from './gltfCompiler.js';
import { WebsocketBrain, LiveMouthShapes } from './websocketBrain.js';
import { UpgradedViewport } from './UpgradedViewport.js';
import { VoiceComponent } from './VoiceComponent.js';
import { DialogueManager } from './DialogueManager.js';
import { VoiceProvider, VoiceInfo, VoiceConfig, VoiceGenerationOptions, VoiceResult, voiceProviderRegistry, BrowserTTSProvider, ElevenLabsTTSProvider, createElevenLabsProvider } from './VoiceProvider.js';
import { BrowserTTSWorkerProvider } from './BrowserTTSWorkerProvider.js';
import { SubtitleSystem, SubtitleOptions } from './SubtitleSystem.js';
import { NPCEventEmitter, NPCEventType, NPCEventMap } from './NPCEvents.js';
import { Scene3D } from './components/Scene3D.js';
import { AnimationSync, VisemeData, generateVisemesFromText } from './AnimationSync.js';
import { AISafetyValidator, NPCBehaviorState, AIValidationResult, AISafetyConfig, aiSafetyValidator } from './AISafetyValidator.js';
import { AudioAssetManager, AudioAsset, audioAssetManager } from './AudioAssetManager.js';
import { useSubscription, SubscriptionProvider, subscriptionAPI, type Subscription, type SubscriptionContextType, type SubscriptionAPI } from './components/SubscriptionContext.js';

export { 
  NPCProfile, 
  NPCVoiceProfile, 
  NPCDialogue, 
  LiveMouthShapes, 
  UpgradedViewport, 
  VoiceComponent, 
  VoiceConfig, 
  VoiceGenerationOptions, 
  VoiceResult, 
  DialogueManager, 
  VoiceProvider, 
  VoiceInfo, 
  voiceProviderRegistry,
  BrowserTTSProvider,
  ElevenLabsTTSProvider,
  BrowserTTSWorkerProvider,
  createElevenLabsProvider,
  SubtitleSystem, 
  SubtitleOptions, 
  NPCEventEmitter, 
  NPCEventType, 
  NPCEventMap, 
  Scene3D, 
  AnimationSync,
  VisemeData,
  generateVisemesFromText,
  AISafetyValidator,
  NPCBehaviorState,
  AIValidationResult,
  AISafetyConfig,
  aiSafetyValidator,
  AudioAssetManager,
  AudioAsset,
  audioAssetManager,
  useSubscription, 
  SubscriptionProvider, 
  subscriptionAPI 
};

export type { Subscription, SubscriptionContextType, SubscriptionAPI };

export class CustomNPCEngine {
  private brain: WebsocketBrain | null = null;
  private eventEmitter: NPCEventEmitter = new NPCEventEmitter();
  private dialogueManager: DialogueManager = new DialogueManager();
   
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

  constructor(private cloudServerUrl: string) {
    console.log('[CustomNPCEngine] Initialized with server:', cloudServerUrl);
    this.dialogueManager.onDialogueStart = (d) => this.onDialogueStart(d);
    this.dialogueManager.onDialogueEnd = (d) => this.onDialogueEnd(d);
    this.dialogueManager.onDialogueQueueChanged = (q) => this.onDialogueQueued(q[q.length - 1]);
    this.dialogueManager.onVoiceGenerated = (id, audio) => this.onAudioTrack(audio);
  }

  public async prepareAsset(rawGlb: ArrayBuffer, aiProfile: NPCProfile): Promise<string> {
    console.log('[CustomNPCEngine] Preparing asset for NPC:', aiProfile.npcId);
    const smartBuffer = await compileSmartNPC(rawGlb, aiProfile);
    const blob = new Blob([smartBuffer], { type: "model/gltf-binary" });
    return URL.createObjectURL(blob);
  }

  public startRuntime(npcId: string): void {
    console.log('[CustomNPCEngine] Starting runtime for NPC:', npcId);
    this.brain = new WebsocketBrain(this.cloudServerUrl, npcId, this.dialogueManager);
    
    this.brain.onVoiceData = (audio, visemes) => {
      if (audio.byteLength > 0) this.onAudioTrack(audio);
      this.onMouthMove(visemes);
    };
    this.brain.onDialogueReceived = (dialogue) => this.onDialogueStart(dialogue);
    
    // Emit NPC spawned event
    this.eventEmitter.emit('NPC_SPAWNED', { npcId });
    this.onNpcEvent('NPC_SPAWNED', { npcId });
    
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
    this.onNpcEvent('NPC_DIED', { npcId: "unknown", cause: "engine_destroyed" });
    
    this.brain?.disconnect();
    this.brain = null;
    
    // Clean up event emitter
    this.eventEmitter.removeAllListeners();
  }
  
  public getDialogueManager(): DialogueManager {
    return this.dialogueManager;
  }

  // Behavior trigger methods - emit events and queue appropriate dialogue
  public onPlayerSpotted(playerPosition: [number, number, number]): void {
    this.eventEmitter.emit('NPC_SEES_PLAYER', { npcId: "unknown", playerPosition });
    this.onNpcEvent('NPC_SEES_PLAYER', { npcId: "unknown", playerPosition });
    
    this.dialogueManager.queue({
      id: `spot_${Date.now()}`,
      npcId: "unknown",
      text: "Target acquired. Engaging.",
      emotion: "alert",
      animation: "anim_run",
      priority: 10,
      interruptible: false
    });
  }

  public onPlayerLost(): void {
    this.eventEmitter.emit('NPC_LOSES_PLAYER', { npcId: "unknown" });
    this.onNpcEvent('NPC_LOSES_PLAYER', { npcId: "unknown" });
    
    this.dialogueManager.queue({
      id: `lost_${Date.now()}`,
      npcId: "unknown",
      text: "Target lost. Returning to patrol.",
      emotion: "neutral",
      animation: "anim_patrol",
      priority: 5
    });
  }

  public onAttackStarted(target: string): void {
    this.eventEmitter.emit('NPC_ATTACK_STARTED', { npcId: "unknown", target });
    this.onNpcEvent('NPC_ATTACK_STARTED', { npcId: "unknown", target });
    
    this.dialogueManager.queue({
      id: `attack_${Date.now()}`,
      npcId: "unknown",
      text: "Eliminate the target!",
      emotion: "aggressive",
      animation: "anim_attack_1",
      priority: 20,
      interruptible: false
    });
  }

  public onAttackFinished(): void {
    this.eventEmitter.emit('NPC_ATTACK_FINISHED', { npcId: "unknown" });
    this.onNpcEvent('NPC_ATTACK_FINISHED', { npcId: "unknown" });
  }

  public onDamaged(damage: number, source: string): void {
    this.eventEmitter.emit('NPC_DAMAGED', { npcId: "unknown", damage, source });
    this.onNpcEvent('NPC_DAMAGED', { npcId: "unknown", damage, source });
    
    if (damage > 30) {
      this.dialogueManager.queue({
        id: `damage_${Date.now()}`,
        npcId: "unknown",
        text: "Critical damage sustained!",
        emotion: "pain",
        animation: "anim_shield",
        priority: 15,
        interruptible: true
      });
    }
  }

  public onHeal(amount: number): void {
    this.dialogueManager.queue({
      id: `heal_${Date.now()}`,
      npcId: "unknown",
      text: "Systems restoring.",
      emotion: "relieved",
      animation: "anim_idle",
      priority: 5
    });
  }

  public onStunned(): void {
    this.dialogueManager.queue({
      id: `stun_${Date.now()}`,
      npcId: "unknown",
      text: "Systems... disrupted.",
      emotion: "confused",
      animation: "anim_idle",
      priority: 10
    });
  }

  public onCommandReceived(command: string): void {
    this.dialogueManager.queue({
      id: `cmd_${Date.now()}`,
      npcId: "unknown",
      text: `Command received: ${command}.`,
      emotion: "neutral",
      animation: "anim_idle",
      priority: 8
    });
  }

  public onPlayerEnteredArea(areaId: string): void {
    this.eventEmitter.emit('NPC_PLAYER_ENTERED_AREA', { npcId: "unknown", areaId });
    this.onNpcEvent('NPC_PLAYER_ENTERED_AREA', { npcId: "unknown", areaId });
  }

  public onPlayerLeftArea(areaId: string): void {
    this.eventEmitter.emit('NPC_PLAYER_LEFT_AREA', { npcId: "unknown", areaId });
    this.onNpcEvent('NPC_PLAYER_LEFT_AREA', { npcId: "unknown", areaId });
  }

  // Interruption handling methods
  public onPlayerAttacked(): void {
    this.dialogueManager.interruptAndQueue({
      id: `attacked_${Date.now()}`,
      npcId: "unknown",
      text: "Under attack!",
      emotion: "fearful",
      animation: "anim_shield",
      priority: 999,
      interruptible: false
    });
  }

  public onWalkAway(distance: number): void {
    if (distance > 15) {
      this.dialogueManager.interrupt('player walked away');
      this.dialogueManager.queue({
        id: `walkaway_${Date.now()}`,
        npcId: "unknown",
        text: "Target out of range.",
        emotion: "neutral",
        animation: "anim_patrol",
        priority: 5
      });
    }
  }

  public onBehaviorChange(newBehavior: string): void {
    // Interrupt non-critical dialogue when behavior changes
    this.dialogueManager.interrupt(`behavior changed to ${newBehavior}`);
  }

  /**
   * Get the NPC event emitter for subscribing to events
   */
  public getEventEmitter(): NPCEventEmitter {
    return this.eventEmitter;
  }
}