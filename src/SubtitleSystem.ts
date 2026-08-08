import * as THREE from 'three';

export interface SubtitleOptions {
  fontSize?: number;
  fontFamily?: string;
  textColor?: number;
  backgroundColor?: number;
  backgroundOpacity?: number;
  padding?: number;
  borderRadius?: number;
  maxWidth?: number;
  lineHeight?: number;
}

export interface SubtitleState {
  text: string;
  npcName: string;
  startTime: number;
  endTime: number;
  isVisible: boolean;
}

/**
 * SubtitleSystem handles displaying subtitles for NPC dialogue in 3D space.
 * Uses HTML/CSS overlay positioned above the NPC's head.
 */
export class SubtitleSystem {
  private container: HTMLElement;
  private subtitleElement: HTMLElement | null = null;
  private npcName: string = "NPC";
  private isVisible: boolean = true;
  private fadeTimeout: number | null = null;
  
  // Callbacks
  public onSubtitleShow: (subtitle: HTMLElement) => void = () => {};
  public onSubtitleHide: () => void = () => {};

  constructor(
    private camera: THREE.Camera,
    private renderer: THREE.WebGLRenderer,
    options: SubtitleOptions = {}
  ) {
    // Create container for subtitles
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '1000';
    document.body.appendChild(this.container);

    // Create subtitle element
    this.subtitleElement = document.createElement('div');
    this.subtitleElement.style.position = 'absolute';
    this.subtitleElement.style.display = 'none';
    this.subtitleElement.style.padding = `${options.padding ?? 10}px`;
    this.subtitleElement.style.borderRadius = `${options.borderRadius ?? 5}px`;
    this.subtitleElement.style.backgroundColor = `rgba(${this.hexToRgb((options.backgroundColor ?? 0x000000).toString(16))}, ${options.backgroundOpacity ?? 0.7})`;
    this.subtitleElement.style.color = `#${(options.textColor ?? 0xFFFFFF).toString(16).padStart(6, '0')}`;
    this.subtitleElement.style.fontSize = `${options.fontSize ?? 16}px`;
    this.subtitleElement.style.fontFamily = options.fontFamily ?? 'Arial, sans-serif';
    this.subtitleElement.style.textAlign = 'center';
    this.subtitleElement.style.maxWidth = `${options.maxWidth ?? 80}%`;
    this.subtitleElement.style.lineHeight = `${options.lineHeight ?? 1.4}`;
    this.subtitleElement.style.whiteSpace = 'normal';
    this.subtitleElement.style.wordWrap = 'break-word';
    this.subtitleElement.style.transition = 'opacity 0.3s ease';
    
    this.container.appendChild(this.subtitleElement);
  }

  /**
   * Show a subtitle for an NPC
   * @param npcName Name of the NPC speaking
   * @param text The subtitle text to display
   * @param duration How long to show the subtitle (in seconds)
   * @param position 3D world position where the subtitle should appear (above NPC)
   */
  public showSubtitle(npcName: string, text: string, duration: number = 3, position: THREE.Vector3): void {
    if (!this.isVisible || !this.subtitleElement) return;
    
    this.npcName = npcName;
    
    // Clear any existing fade timeout
    if (this.fadeTimeout !== null) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
    
    // Update subtitle content
    this.subtitleElement.innerHTML = `
      <div><strong>${this.escapeHtml(npcName)}</strong></div>
      <div>${this.escapeHtml(text)}</div>
    `;
    
    // Position the subtitle above the NPC in screen space
    this.updateSubtitlePosition(position);
    
    // Show the subtitle
    this.subtitleElement.style.display = 'block';
    this.subtitleElement.style.opacity = '1';
    
    this.onSubtitleShow(this.subtitleElement);
    
    // Schedule fade out
    this.fadeTimeout = window.setTimeout(() => {
      this.hideSubtitle();
    }, duration * 1000);
  }

  /**
   * Hide the subtitle with fade effect
   */
  public hideSubtitle(): void {
    if (!this.subtitleElement) return;
    
    this.subtitleElement.style.opacity = '0';
    
    // Wait for fade transition to complete before hiding
    this.fadeTimeout = window.setTimeout(() => {
      if (this.subtitleElement) {
        this.subtitleElement.style.display = 'none';
      }
      this.onSubtitleHide();
    }, 300); // Match CSS transition duration
  }

  /**
   * Update subtitle position based on NPC's 3D world position
   */
  private updateSubtitlePosition(worldPosition: THREE.Vector3): void {
    if (!this.subtitleElement || !this.camera) return;
    
    // Convert world position to screen coordinates
    const vector = worldPosition.clone();
    vector.project(this.camera);
    
    const halfWidth = this.renderer.domElement.width / 2;
    const halfHeight = this.renderer.domElement.height / 2;
    
    const x = Math.round(vector.x * halfWidth + halfWidth);
    const y = Math.round(-vector.y * halfHeight + halfHeight);
    
    // Position above the NPC (adjust Y as needed)
    this.subtitleElement.style.left = `${x}px`;
    this.subtitleElement.style.top = `${y - 30}px`; // 30px above
  }

  /**
   * Set subtitle visibility
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    if (!visible && this.subtitleElement) {
      this.hideSubtitle();
    }
  }

  /**
   * Check if subtitles are currently visible
   */
  public isSubtitleVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Dispose of the subtitle system
   */
  public dispose(): void {
    if (this.fadeTimeout !== null) {
      clearTimeout(this.fadeTimeout);
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * Convert hex color to RGB string
   */
  private hexToRgb(hex: string): string {
    // Clean the hex value
    const cleanHex = hex.padStart(6, '0');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}