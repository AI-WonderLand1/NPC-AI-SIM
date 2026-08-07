export interface LiveMouthShapes {
  jawOpen: number;
  mouthFunnel: number;
  mouthPucker: number;
}
export class WebsocketBrain {
  private socket: WebSocket | null = null;
  public onVoiceData: (audioChunk: ArrayBuffer, visemes: LiveMouthShapes) => void = () => {};

  constructor(private serverUrl: string, private npcId: string) {}

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
      }
    };
  }

  public sendPlayerInput(textOrAudio: string | Blob): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(textOrAudio);
    }
  }

  public disconnect(): void {
    this.socket?.close();
  }
}