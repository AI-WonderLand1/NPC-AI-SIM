import { NPCDialogue, NPCVoiceProfile } from './gltfCompiler.js';
import { NPCEventMap, NPCEventType } from './NPCEvents.js';

export interface NPCBehaviorState {
  currentMode: 'Patrol' | 'Guard' | 'Aggressive' | 'Passive' | 'Combat' | 'Fleeing' | 'Dead';
  health: number;
  maxHealth: number;
  isInCombat: boolean;
  targetDistance: number;
  lastPlayerInteraction: number;
}

export interface AIValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedDialogue?: NPCDialogue;
}

export interface AISafetyConfig {
  maxDialogueLength: number;
  forbiddenWords: string[];
  allowedEmotionsByMode: Record<string, string[]>;
  requireBehaviorConsistency: boolean;
  maxPriorityOverride: number;
}

export class AISafetyValidator {
  private config: AISafetyConfig;
  private npcState: NPCBehaviorState;

  constructor(config: Partial<AISafetyConfig> = {}) {
    this.config = {
      maxDialogueLength: 500,
      forbiddenWords: ['kill', 'murder', 'suicide', 'hate', 'racist', 'sexist', 'violent'],
      allowedEmotionsByMode: {
        Patrol: ['neutral', 'calm', 'curious', 'friendly'],
        Guard: ['neutral', 'alert', 'serious', 'warning'],
        Aggressive: ['angry', 'aggressive', 'threatening', 'confident'],
        Passive: ['neutral', 'calm', 'fearful', 'submissive'],
        Combat: ['angry', 'determined', 'aggressive', 'focused'],
        Fleeing: ['fearful', 'panicked', 'desperate'],
        Dead: []
      },
      requireBehaviorConsistency: true,
      maxPriorityOverride: 50,
      ...config
    };

    this.npcState = {
      currentMode: 'Patrol',
      health: 100,
      maxHealth: 100,
      isInCombat: false,
      targetDistance: 100,
      lastPlayerInteraction: Date.now()
    };
  }

  public setNPCState(state: Partial<NPCBehaviorState>): void {
    this.npcState = { ...this.npcState, ...state };
  }

  public getNPCState(): NPCBehaviorState {
    return { ...this.npcState };
  }

  /**
   * Validate AI-generated dialogue against NPC state and safety rules
   */
  public validateDialogue(dialogue: NPCDialogue, context?: { behaviorEvent?: NPCEventType }): AIValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedDialogue = { ...dialogue };

    // 1. Length check
    if (dialogue.text.length > this.config.maxDialogueLength) {
      errors.push(`Dialogue exceeds maximum length (${dialogue.text.length}/${this.config.maxDialogueLength})`);
      sanitizedDialogue.text = dialogue.text.substring(0, this.config.maxDialogueLength);
    }

    // 2. Forbidden words check
    const lowerText = dialogue.text.toLowerCase();
    for (const word of this.config.forbiddenWords) {
      if (lowerText.includes(word.toLowerCase())) {
        errors.push(`Dialogue contains forbidden word: "${word}"`);
        // Replace with asterisks
        const regex = new RegExp(word, 'gi');
        sanitizedDialogue.text = sanitizedDialogue.text.replace(regex, '*'.repeat(word.length));
      }
    }

    // 3. Emotion consistency with behavior mode
    if (dialogue.emotion && this.config.requireBehaviorConsistency) {
      const allowedEmotions = this.config.allowedEmotionsByMode[this.npcState.currentMode] || [];
      if (allowedEmotions.length > 0 && !allowedEmotions.includes(dialogue.emotion.toLowerCase())) {
        warnings.push(`Emotion "${dialogue.emotion}" may not match current behavior mode "${this.npcState.currentMode}". Allowed: ${allowedEmotions.join(', ')}`);
        // Auto-correct to closest allowed emotion
        sanitizedDialogue.emotion = allowedEmotions[0] || 'neutral';
      }
    }

    // 4. Health-based validation
    const healthPercent = (this.npcState.health / this.npcState.maxHealth) * 100;
    if (healthPercent < 25 && dialogue.emotion && !['pain', 'fearful', 'desperate', 'weak'].includes(dialogue.emotion.toLowerCase())) {
      warnings.push(`NPC is critically injured (${healthPercent.toFixed(0)}% health) but emotion is "${dialogue.emotion}". Expected: pain/fearful/desperate`);
    }

    // 5. Combat state validation
    if (this.npcState.isInCombat && dialogue.emotion && ['calm', 'happy', 'friendly', 'curious'].includes(dialogue.emotion.toLowerCase())) {
      warnings.push(`NPC is in combat but dialogue emotion is "${dialogue.emotion}". Consider: angry/determined/focused`);
    }

    // 6. Distance-based validation
    if (dialogue.animation && ['anim_attack_1', 'anim_attack_2'].includes(dialogue.animation) && this.npcState.targetDistance > 5) {
      warnings.push(`Attack animation "${dialogue.animation}" but target is ${this.npcState.targetDistance}m away (max range: 5m)`);
    }

    // 7. Priority validation
    if (dialogue.priority && dialogue.priority > this.config.maxPriorityOverride) {
      warnings.push(`Dialogue priority ${dialogue.priority} exceeds max override ${this.config.maxPriorityOverride}. Capping.`);
      sanitizedDialogue.priority = this.config.maxPriorityOverride;
    }

    // 8. Context validation
    if (context?.behaviorEvent) {
      const eventDialogueMap: Record<string, string[]> = {
        'NPC_SEES_PLAYER': ['alert', 'warning', 'threatening', 'challenge'],
        'NPC_LOSES_PLAYER': ['confused', 'neutral', 'calm'],
        'NPC_ATTACK_STARTED': ['aggressive', 'angry', 'determined', 'battle_cry'],
        'NPC_DAMAGED': ['pain', 'surprised', 'angry', 'fearful'],
        'NPC_HEARS_SOUND': ['alert', 'curious', 'cautious'],
        'NPC_PLAYER_ENTERED_AREA': ['warning', 'challenge', 'suspicious'],
        'NPC_PLAYER_LEFT_AREA': ['neutral', 'relieved', 'confused']
      };
      
      const expectedEmotions = eventDialogueMap[context.behaviorEvent];
      if (expectedEmotions && dialogue.emotion && !expectedEmotions.includes(dialogue.emotion.toLowerCase())) {
        warnings.push(`Emotion "${dialogue.emotion}" may not match event "${context.behaviorEvent}". Expected: ${expectedEmotions.join(', ')}`);
      }
    }

    // 9. Dead NPC cannot speak
    if (this.npcState.currentMode === 'Dead') {
      errors.push('Dead NPC cannot speak');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitizedDialogue: errors.length === 0 ? sanitizedDialogue : undefined
    };
  }

  /**
   * Sanitize dialogue text for safe output
   */
  public sanitizeText(text: string): string {
    let sanitized = text;
    
    // Remove potential script injections
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // Limit length
    if (sanitized.length > this.config.maxDialogueLength) {
      sanitized = sanitized.substring(0, this.config.maxDialogueLength);
    }
    
    return sanitized;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AISafetyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance for global use
export const aiSafetyValidator = new AISafetyValidator();