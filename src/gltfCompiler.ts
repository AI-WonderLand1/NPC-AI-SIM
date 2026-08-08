import { WebIO } from '@gltf-transform/core';

export interface NPCVoiceProfile {
  enabled: boolean;
  voiceId: string;
  provider: string;
  language: string;
  gender?: string;
  pitch: number;
  speed: number;
  volume: number;
  personality: {
    tone: string;
    emotion: string;
    speakingStyle: string;
  };
  subtitles: boolean;
  spatialAudio: boolean;
  interruptible: boolean;
}

export interface NPCDialogue {
  id: string;
  npcId: string;
  text: string;
  emotion?: string;
  priority?: number;
  voice?: NPCVoiceProfile;
  animation?: string;
  facialAnimation?: string;
  interruptible?: boolean;
  conditions?: string[]; // Simplified for now, could be expanded to DialogueCondition[]
}

export interface NPCProfile {
  npcId: string;
  personality: string;
  voiceSeed: string;
  greeting: string;
  voiceProfile?: NPCVoiceProfile;
  dialogue?: NPCDialogue[];
}

export async function compileSmartNPC(
  rawGlbBuffer: ArrayBuffer, 
  profile: NPCProfile
): Promise<ArrayBuffer> {
  const io = new WebIO();
  const document = await io.readBinary(new Uint8Array(rawGlbBuffer));
  const root = document.getRoot();

  // Prepare voice profile and dialogue for embedding
  const voiceProfile = profile.voiceProfile ?? {
    enabled: true,
    voiceId: profile.voiceSeed,
    provider: "elevenlabs",
    language: "en-US",
    pitch: 1.0,
    speed: 1.0,
    volume: 1.0,
    personality: {
      tone: "neutral",
      emotion: "calm",
      speakingStyle: "conversational"
    },
    subtitles: true,
    spatialAudio: true,
    interruptible: true
  };

  root.setExtras({
    engineTarget: "custom-npc-runtime v1.0",
    npcConfig: {
      id: profile.npcId,
      behavior: profile.personality,
      voice: profile.voiceSeed,
      initialState: profile.greeting,
      voiceProfile: voiceProfile,
      dialogue: profile.dialogue ?? []
    }
  });

  const optimizedGlbUint8 = await io.writeBinary(document);
  return optimizedGlbUint8.buffer;
}