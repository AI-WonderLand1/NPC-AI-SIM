export interface NPCEventMap {
  NPC_SPAWNED: { npcId: string };
  NPC_SEES_PLAYER: { npcId: string; playerPosition: [number, number, number] };
  NPC_HEARS_SOUND: { npcId: string; soundPosition: [number, number, number]; soundLevel: number };
  NPC_LOSES_PLAYER: { npcId: string };
  NPC_PLAYER_ENTERED_AREA: { npcId: string; areaId: string };
  NPC_PLAYER_LEFT_AREA: { npcId: string; areaId: string };
  NPC_ATTACK_STARTED: { npcId: string; target: string };
  NPC_ATTACK_FINISHED: { npcId: string };
  NPC_DAMAGED: { npcId: string; damage: number; source: string };
  NPC_DIED: { npcId: string; cause: string };
  NPC_DIALOGUE_STARTED: { npcId: string; dialogueId: string };
  NPC_DIALOGUE_FINISHED: { npcId: string; dialogueId: string };
}

export type NPCEventType = keyof NPCEventMap;

export interface NPCEventListener<T extends NPCEventType> {
  (event: NPCEventMap[T]): void;
}

export class NPCEventEmitter {
  private listeners: Map<NPCEventType, Set<Function>> = new Map();

  /**
   * Subscribe to an NPC event
   */
  public on<T extends NPCEventType>(eventType: T, listener: NPCEventListener<T>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  /**
   * Unsubscribe from an NPC event
   */
  public off<T extends NPCEventType>(eventType: T, listener: NPCEventListener<T>): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit an NPC event
   */
  public emit<T extends NPCEventType>(eventType: T, eventData: NPCEventMap[T]): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (error) {
          console.error(`Error in NPC event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Check if there are listeners for an event type
   */
  public hasListeners(eventType: NPCEventType): boolean {
    return this.listeners.has(eventType) && this.listeners.get(eventType)!.size > 0;
  }

  /**
   * Remove all listeners
   */
  public removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Remove all listeners for a specific event type
   */
  public removeAllListenersForEvent(eventType: NPCEventType): void {
    this.listeners.delete(eventType);
  }
}