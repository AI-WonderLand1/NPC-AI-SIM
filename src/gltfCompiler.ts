import { WebIO } from '@gltf-transform/core';
export interface NPCProfile {
  npcId: string;
  personality: string;
  voiceSeed: string;
  greeting: string;
}
export async function compileSmartNPC(
  rawGlbBuffer: ArrayBuffer, 
  profile: NPCProfile
): Promise<ArrayBuffer> {
  const io = new WebIO();
  const document = await io.readBinary(new Uint8Array(rawGlbBuffer));
  const root = document.getRoot();

  root.setExtras({
    engineTarget: "custom-npc-runtime v1.0",
    npcConfig: {
      id: profile.npcId,
      behavior: profile.personality,
      voice: profile.voiceSeed,
      initialState: profile.greeting
    }
  });

  const optimizedGlbUint8 = await io.writeBinary(document);
  return optimizedGlbUint8.buffer;
}