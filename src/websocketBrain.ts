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
    console.log('[WebsocketBrain] Connecting to:', `${this.serverUrl}/live-npc?id=${this.npcId}`);
    this.socket = new WebSocket(`${this.serverUrl}/live-npc?id=${this.npcId}`);
    this.socket.binaryType = "arraybuffer";

    this.socket.onopen = () => {
      console.log('[WebsocketBrain] Connected to server');
    };

    this.socket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        console.log('[WebsocketBrain] Received audio data:', event.data.byteLength, 'bytes');
        this.onVoiceData(event.data, { jawOpen: 0.5, mouthFunnel: 0.1, mouthPucker: 0.2 });
      } else {
        const data = JSON.parse(event.data);
        if (data.visemeFrame) {
          this.onVoiceData(new ArrayBuffer(0), data.visemeFrame);
        }
        if (data.type === "dialogue") {
          console.log('[WebsocketBrain] Received dialogue from server:', data);
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

    this.socket.onerror = (error) => {
      console.error('[WebsocketBrain] Connection error:', error);
    };

    this.socket.onclose = () => {
      console.log('[WebsocketBrain] Disconnected from server');
    };
  }

  public sendPlayerInput(textOrAudio: string | Blob): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = typeof textOrAudio === 'string' ? `PLAYER:${textOrAudio}` : textOrAudio;
      console.log('[WebsocketBrain] Sending player input:', message);
      this.socket.send(message);
    }
  }

  public disconnect(): void {
    console.log('[WebsocketBrain] Disconnecting...');
    this.socket?.close();
  }
}