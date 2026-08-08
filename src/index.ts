import { compileSmartNPC, NPCProfile } from './gltfCompiler.js';import { WebsocketBrain, LiveMouthShapes } from './websocketBrain.js';
import { UpgradedViewport } from './UpgradedViewport.js';
import { VoiceComponent, VoiceConfig, TTSService, ElevenLabsTTSService } from './VoiceComponent.js';
export { NPCProfile, LiveMouthShapes, UpgradedViewport, VoiceComponent, VoiceConfig, TTSService, ElevenLabsTTSService };
export class CustomNPCEngine {
  private brain: WebsocketBrain | null = null;
  
  public onMouthMove: (weights: LiveMouthShapes) => void = () => {};
  public onAudioTrack: (audio: ArrayBuffer) => void = () => {};

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

    this.brain.connect();
  }

  public talkToNPC(message: string): void {
    this.brain?.sendPlayerInput(message);
  }

  public destroy(): void {
    this.brain?.disconnect();
    this.brain = null;
  }
}