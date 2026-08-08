# NPC System Specification

## Overview
This document outlines the architecture for the NPC system in WonderPlay 3D, focusing on the integration of LLM-driven dialogue, while the NPC state machine remains authoritative.

Yes. Since you already have the NPC behavior system + PlayCanvas/WebGL engine + pipeline, I would add voice as a first-class NPC subsystem, not just a text-to-speech button.

Give your coding AI/agent these instructions:


---

NPC Voice System — Implementation Instructions

Build a complete NPC Voice & Dialogue System and integrate it into the existing 3D/NPC pipeline.

Do not create a demo, mock implementation, placeholder audio, fake buttons, or disconnected UI. Use the existing NPC entities, behavior tree, animation system, PlayCanvas/WebGL runtime, asset pipeline, project storage, and existing UI architecture.

1. NPC Voice Properties

Every NPC should have a configurable voice profile:

interface NPCVoiceProfile {
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

Add this to the existing NPC data model rather than creating a separate unrelated NPC system.


---

2. NPC Inspector

Add a Voice section to the existing NPC properties/inspector.

NPC VOICE

Enabled                 [ ON ]

Voice
[ Select Voice ▼ ]

Language
[ English (US) ▼ ]

Voice Provider
[ Provider ▼ ]

Pitch                   [────●────]
Speed                   [───●─────]
Volume                  [────●────]

Personality
Tone                    [ Royal       ▼ ]
Emotion                 [ Calm        ▼ ]
Speaking Style          [ Formal      ▼ ]

☑ Spatial Audio
☑ Subtitles
☑ Interruptible

[ Test Voice ]

The inspector must modify the actual NPC configuration.


---

3. Voice Provider Architecture

Do NOT hard-code the entire application to one voice provider.

Create an abstraction:

interface VoiceProvider {
  id: string;

  generateSpeech(
    text: string,
    options: VoiceGenerationOptions
  ): Promise<VoiceResult>;

  getVoices(): Promise<VoiceInfo[]>;

  supportsStreaming(): boolean;
}

Then implement providers behind that interface.

For example:

Voice System
     │
     ├── Browser TTS
     ├── Cloud TTS Provider
     └── Future Providers

The engine should only communicate with the VoiceProvider interface.

This allows another provider to be added later without rewriting the NPC system.


---

4. Dialogue System

NPCs need actual dialogue data.

Create:

interface NPCDialogue {
  id: string;
  npcId: string;

  text: string;

  emotion?: string;
  priority?: number;

  voice?: NPCVoiceProfile;

  animation?: string;
  facialAnimation?: string;

  interruptible?: boolean;

  conditions?: DialogueCondition[];
}

Example:

{
  "id": "guard_warning_01",
  "npcId": "knight_sentinel",
  "text": "Halt! You are entering restricted territory.",
  "emotion": "warning",
  "animation": "point",
  "priority": 10
}


---

5. Behavior → Dialogue → Voice

Connect the voice system directly to the existing NPC behavior tree.

For example:

PLAYER ENTERS AREA
        ↓
NPC DETECTS PLAYER
        ↓
Behavior Tree
        ↓
WARNING STATE
        ↓
Select Dialogue
        ↓
Generate/Load Voice
        ↓
Play Animation
        ↓
Play Voice
        ↓
Display Subtitle

The NPC should not simply play random dialogue.

Dialogue must be triggered by actual NPC state.


---

6. NPC Events

Add events such as:

NPC_SPAWNED
NPC_SEES_PLAYER
NPC_HEARS_SOUND
NPC_LOSES_PLAYER
NPC_PLAYER_ENTERED_AREA
NPC_PLAYER_LEFT_AREA
NPC_ATTACK_STARTED
NPC_ATTACK_FINISHED
NPC_DAMAGED
NPC_DIED
NPC_DIALOGUE_STARTED
NPC_DIALOGUE_FINISHED

Allow the behavior system to trigger dialogue from these events.


---

7. Voice + Animation Synchronization

This is important.

When an NPC speaks:

Voice
 ↓
Dialogue State
 ↓
Facial Animation
 ↓
Body Animation
 ↓
Subtitle

At minimum support:

Idle talking animation

Head movement

Looking at conversation target

Gesture animation

Emotion animation


If your character system supports facial animation/blendshapes, connect speech to it.

If it doesn't, create a clean interface so facial animation can be added later.


---

8. Spatial 3D Voice

Since you're using PlayCanvas/WebGL, voice should behave like an actual 3D sound.

NPC voice should originate from the NPC's world position.

NPC
 │
 └── Audio Source
       │
       ├── Position
       ├── Volume
       ├── Max Distance
       ├── Rolloff
       └── Spatialization

Example:

interface NPCVoiceAudio {
  spatial: boolean;
  maxDistance: number;
  refDistance: number;
  rolloffFactor: number;
}

The player should hear the NPC naturally based on distance.


---

9. Dialogue UI

Add a clean subtitle system.

Example:

┌─────────────────────────────────────────────┐
│                                             │
│             KNIGHT SENTINEL                 │
│                                             │
│   "Halt! You are entering restricted       │
│    territory."                              │
│                                             │
└─────────────────────────────────────────────┘

Support:

NPC name

Dialogue text

Timing

Fade in/out

Skip

Continue

Dialogue queue

Multiple speakers

Subtitle toggle

Accessibility settings


Do not make subtitles mandatory if the player disables them.


---

10. Dialogue Queue

NPCs should be able to speak multiple lines without overlapping audio.

Line 1
 ↓
Voice finishes
 ↓
Animation finishes / timing
 ↓
Line 2
 ↓
Voice finishes
 ↓
Line 3

Implement:

DialogueManager
├── queue()
├── play()
├── pause()
├── resume()
├── skip()
├── stop()
└── clear()

Only one dialogue instance should control a given NPC at a time.


---

11. Interruptions

Your NPC system already has behaviors such as patrol/attack.

Voice needs to respect those states.

Example:

NPC TALKING
     ↓
PLAYER ATTACKS NPC
     ↓
Dialogue interrupted
     ↓
Voice stops/fades
     ↓
Attack behavior activated
     ↓
Attack animation

Likewise:

NPC TALKING
     ↓
PLAYER WALKS AWAY
     ↓
Distance threshold reached
     ↓
Voice fades/stops


---

12. AI Dialogue Generation

Add an optional AI dialogue layer.

The NPC should have:

NPC Personality
       ↓
Current Situation
       ↓
Memory / Context
       ↓
Behavior State
       ↓
AI Dialogue
       ↓
Voice

Example NPC configuration:

Name: Knight Sentinel

Personality:
  Loyal
  Serious
  Suspicious

Role:
  Royal Guard

Current Goal:
  Protect Castle Gate

Relationship:
  Player = Unknown

Behavior:
  Patrol → Detect → Warn → Attack

The AI can then generate contextually appropriate dialogue.


---

13. AI Safety/Control Layer

Do not allow generated dialogue to bypass the game's actual state.

AI should suggest/generate dialogue, while the NPC state machine remains authoritative.

For example:

Behavior System
      ↓
Current State = WARNING
      ↓
AI receives:
  NPC personality
  Current location
  Player relationship
  Current event
      ↓
AI generates dialogue
      ↓
Dialogue validation
      ↓
Voice generation
      ↓
Playback

The AI should never arbitrarily change the NPC's behavior simply because it generated a sentence.


---

14. Voice Caching

Do not regenerate identical dialogue every time.

Create:

Dialogue
   ↓
Hash
   ↓
Voice Cache
   ↓
Existing Audio?
   ├── YES → Play
   └── NO → Generate → Cache → Play

Cache based on things such as:

provider
voiceId
text
language
pitch
speed
emotion

This will dramatically reduce unnecessary TTS generation.


---

15. Audio Asset Pipeline

Generated voice should become a real asset.

Voice Generation
      ↓
Audio File
      ↓
Asset Pipeline
      ↓
Project Storage
      ↓
NPC Dialogue Asset
      ↓
PlayCanvas Audio

Don't permanently bury generated audio inside the NPC code.

It should appear in the project's asset system.


---

16. Voice Testing

Add:

Test Voice

to the NPC inspector.

It should use the currently selected:

Voice

Pitch

Speed

Emotion

Personality


and generate/play an actual sample.

No fake success messages.


---

17. Debugging

Add voice events to the existing console:

[Voice] NPC voice initialized
[Voice] Voice provider: ...
[Voice] Loading voice: ...
[Voice] Dialogue queued: guard_warning_01
[Voice] Audio generated
[Voice] Audio cached
[Voice] Spatial audio attached
[Voice] Playback started
[Voice] Playback completed

Errors must be real and actionable.

For example:

[Voice Error]
Unable to generate speech.

Provider: ...
Reason: ...
Request ID: ...

Never silently fall back to a fake audio file.


---

18. Performance

Do not generate voice directly on the render loop.

Voice generation should be asynchronous:

NPC Event
   ↓
Dialogue Manager
   ↓
Voice Cache
   ↓
Async Generation
   ↓
Audio Buffer
   ↓
PlayCanvas Audio

The 3D renderer must remain responsive while voice is being generated.

Preload likely dialogue where appropriate.


---

19. Final NPC Architecture

Your finished system should look roughly like:

NPC
│
├── Identity
│
├── Transform
│
├── Model
│
├── Animation
│
├── AI Brain
│
├── Behavior Tree
│
├── Navigation
│
├── Perception
│
├── Memory
│
├── Dialogue
│
│    ├── Dialogue Manager
│    ├── Context
│    ├── Conditions
│    └── Queue
│
├── Voice
│    ├── Voice Profile
│    ├── Provider
│    ├── TTS
│    ├── Cache
│    └── Spatial Audio
│
└── Audio/Animation Sync

And the full runtime flow:

PLAYER
  ↓
NPC PERCEPTION
  ↓
AI / BEHAVIOR TREE
  ↓
NPC STATE
  ↓
DIALOGUE DECISION
  ↓
AI DIALOGUE GENERATION
  ↓
DIALOGUE VALIDATION
  ↓
VOICE CACHE
  ↓
TTS IF NEEDED
  ↓
3D SPATIAL AUDIO
  ↓
ANIMATION
  ↓
SUBTITLES
  ↓
PLAYER HEARS NPC

Most importantly: integrate this into your existing NPC plugin and PlayCanvas/WebGL engine. Do not build another separate NPC framework. The NPC already exists; you're adding voice, dialogue, audio, and AI conversational behavior to it.

That would turn what you're showing in the screenshots from an NPC behavior tester into something much closer to an actual AI character creation system.