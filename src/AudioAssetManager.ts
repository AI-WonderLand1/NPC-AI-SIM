// Import removed - using native ArrayBuffer

export interface AudioAsset {
  id: string;
  name: string;
  audioBuffer: ArrayBuffer;
  mimeType: string;
  duration: number;
  createdAt: string;
  metadata: {
    text: string;
    voiceId: string;
    provider: string;
    language: string;
    pitch: number;
    speed: number;
    volume: number;
    emotion?: string;
    source: 'generated' | 'uploaded';
    duration?: number;
  };
}

export class AudioAssetManager {
  private assets: Map<string, AudioAsset> = new Map();
  private assetIndex: Map<string, string> = new Map(); // text+voice -> assetId

  /**
   * Save generated audio as a project asset
   */
  public saveGeneratedAudio(
    text: string,
    audioBuffer: ArrayBuffer,
    voiceConfig: {
      voiceId: string;
      provider: string;
      language: string;
      pitch: number;
      speed: number;
      volume: number;
      emotion?: string;
    },
    mimeType: string = 'audio/wav',
    duration?: number
  ): AudioAsset {
    const cacheKey = this.generateCacheKey(text, voiceConfig);
    
    // Check if already exists
    if (this.assetIndex.has(cacheKey)) {
      const existingId = this.assetIndex.get(cacheKey)!;
      return this.assets.get(existingId)!;
    }
    
    const id = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const asset: AudioAsset = {
      id,
      name: `Voice_${voiceConfig.voiceId}_${text.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}`,
      audioBuffer: audioBuffer.slice(0), // Clone buffer
      mimeType,
      duration: duration || text.length * 0.05,
      createdAt: new Date().toISOString(),
      metadata: {
        text,
        voiceId: voiceConfig.voiceId,
        provider: voiceConfig.provider,
        language: voiceConfig.language,
        pitch: voiceConfig.pitch,
        speed: voiceConfig.speed,
        volume: voiceConfig.volume,
        emotion: voiceConfig.emotion,
        source: 'generated'
      }
    };
    
    this.assets.set(id, asset);
    this.assetIndex.set(cacheKey, id);
    
    console.log(`[AudioAssetManager] Saved audio asset: ${asset.name} (${id})`);
    
    return asset;
  }

  /**
   * Get asset by ID
   */
  public getAsset(id: string): AudioAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Find asset by text and voice config
   */
  public findAsset(text: string, voiceConfig: { voiceId: string; provider: string; language: string; pitch: number; speed: number; volume: number }): AudioAsset | undefined {
    const cacheKey = this.generateCacheKey(text, voiceConfig);
    const id = this.assetIndex.get(cacheKey);
    return id ? this.assets.get(id) : undefined;
  }

  /**
   * Get all assets
   */
  public getAllAssets(): AudioAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Export assets for project storage
   */
  public exportAssets(): { id: string; data: ArrayBuffer; metadata: AudioAsset['metadata'] }[] {
    return Array.from(this.assets.values()).map(asset => ({
      id: asset.id,
      data: asset.audioBuffer.slice(0),
      metadata: asset.metadata
    }));
  }

  /**
   * Import assets from project storage
   */
  public importAssets(assets: { id: string; data: ArrayBuffer; metadata: AudioAsset['metadata'] }[]): void {
    for (const asset of assets) {
      const audioAsset: AudioAsset = {
        id: asset.id,
        name: `Voice_${asset.metadata.voiceId}_${asset.metadata.text.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}`,
        audioBuffer: asset.data,
        mimeType: 'audio/wav',
        duration: asset.metadata.duration || asset.metadata.text.length * 0.05,
        createdAt: new Date().toISOString(),
        metadata: asset.metadata
      };
      this.assets.set(asset.id, audioAsset);
      this.assetIndex.set(this.generateCacheKey(asset.metadata.text, asset.metadata), asset.id);
    }
    console.log(`[AudioAssetManager] Imported ${assets.length} audio assets`);
  }

  /**
   * Delete asset
   */
  public deleteAsset(id: string): boolean {
    const asset = this.assets.get(id);
    if (asset) {
      this.assetIndex.delete(this.generateCacheKey(asset.metadata.text, asset.metadata));
      this.assets.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Clear all assets
   */
  public clear(): void {
    this.assets.clear();
    this.assetIndex.clear();
  }

  /**
   * Get cache key for text + voice config
   */
  private generateCacheKey(text: string, voiceConfig: { voiceId: string; provider: string; language: string; pitch: number; speed: number; volume: number }): string {
    const parts = [
      text,
      voiceConfig.voiceId,
      voiceConfig.provider,
      voiceConfig.language,
      Math.round(voiceConfig.pitch * 10) / 10,
      Math.round(voiceConfig.speed * 10) / 10,
      Math.round(voiceConfig.volume * 10) / 10
    ];
    
    let hash = 0;
    const str = parts.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `voice_${Math.abs(hash).toString(36)}`;
  }
}

// Singleton instance
export const audioAssetManager = new AudioAssetManager();