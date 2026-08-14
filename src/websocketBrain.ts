import { DialogueManager, NPCDialogue } from './index.js';

export interface LiveMouthShapes {
  jawOpen: number;
  mouthFunnel: number;
  mouthPucker: number;
}

export class WebsocketBrain {
  private socket: WebSocket | null = null;
  public onVoiceData: (audioChunk: ArrayBuffer, visemes: LiveMouthShapes) => void = () => {};
  public onDialogueReceived: (dialogue: NPCDialogue) => void = () => {};

  constructor(private serverUrl: string, private npcId: string, private dialogueManager: DialogueManager) {}

  public connect(): void {
    this.socket = new WebSocket(`${this.serverUrl}/live-npc?id=${this.npcId}`);
    this.socket.binaryType = "arraybuffer";

    this.socket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.onVoiceData(event.data, { jawOpen: 0.5, mouthFunnel: 0.1, mouthPucker: 0.2 });
      } else {
        const data = JSON.parse(event.data);
        if (data.visemeFrame) {
          this.onVoiceData(new ArrayBuffer(0), data.visemeFrame);
        }
        if (data.type === "dialogue") {
          const dialogue: NPCDialogue = {
            id: data.id || `dlg_${Date.now()}`,
            npcId: this.npcId,
            text: data.text,
            emotion: data.emotion,
            animation: data.animation,
            priority: data.priority ?? 0,
            interruptible: true
          };
          this.dialogueManager.queue(dialogue);
          this.onDialogueReceived(dialogue);
        }
      }
    };
  }

  public sendPlayerInput(textOrAudio: string | Blob): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof textOrAudio === 'string' ? `PLAYER:${textOrAudio}` : textOrAudio);
    }
  }

  public disconnect(): void {
    this.socket?.close();
  }
}