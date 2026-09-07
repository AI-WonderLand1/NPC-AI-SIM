# NPC-AI-SIM Training Lab Specification

## Relationship to the existing source of truth

This document extends `NPC_SYSTEM_SPEC.md`. It does not replace it.

The NPC state machine / behavior system remains authoritative. Dialogue, voice, perception, animation, events, memory, and AI integration continue to follow the existing NPC system specification.

## Product boundary

NPC-AI-SIM trains and validates NPC capabilities.

DreamMakerHub / WonderPlay remains responsible for user-owned scenes, environments, cinematic/movie 3D work, and world building.

NPC-AI-SIM gets one temporary system-owned Training Lab only.

### Training Lab rules

- system owned
- read only to users
- automatically reset between validation runs
- cannot be renamed, deleted, exported as a user scene, or replaced
- contains fixed test props and interaction targets
- exists only to validate NPC behavior and capabilities

## Unreal-style conceptual mapping

NPC-AI-SIM should expose simple user-facing skill training while using professional game-AI concepts underneath.

| NPC-AI-SIM concept | Runtime concept |
| --- | --- |
| Behavior Graph | authoritative Behavior Tree / StateTree-style control |
| Navigation course | nav/pathfinding tasks and reachability validation |
| Perception course | sight, hearing, proximity and event sensors |
| Interaction course | smart-object-style interaction definitions and slots |
| Animation course | animation state, motion hooks and action synchronization |
| Dialogue course | state-driven dialogue, voice, interruption and subtitles |
| Validation run | deterministic sandbox test with pass/fail diagnostics |

## Training Lab fixtures

The temporary sandbox should provide fixed fixtures such as:

- start pad / spawn point
- straight walking lane
- turning markers
- low jump obstacle
- navigation obstacle cluster
- patrol markers
- follow target
- sight target
- sound emitter
- conversation target
- door interaction target
- button / console interaction target
- pickup object
- sit / use point
- optional threat / reaction target

These are system assets, not user project assets.

## Courses

### Movement

- Idle
- Walk
- Run
- Turn
- Stop
- Jump

### Navigation

- Reach Target
- Follow
- Patrol
- Avoid Obstacles
- Repath Around Blockage

### Perception

- See Target
- Hear Sound
- Proximity Trigger
- Lose / Reacquire Target

### Communication

- Speak
- Listen and Respond
- Interrupt Dialogue
- Subtitle / voice synchronization

### Interaction

- Open Door
- Use Button / Console
- Pick Up Object
- Use / Sit Point

### Social

- Greet
- Follow Player
- React to Relationship / State
- Conversation context hooks

### Advanced

- Combat reaction hooks
- Memory hooks
- reasoning/decision hooks
- future adaptive-learning-agent courses

## Important implementation rule

A normal course is not automatically machine-learning retraining.

A course may install or configure:

- behavior graph nodes
- conditions and transitions
- navigation tasks
- perception rules
- event bindings
- animations
- interaction definitions
- dialogue/voice triggers
- validation tests

True adaptive training should be a separate advanced subsystem later.

## Validation lifecycle

1. Load the selected NPC into the temporary Training Lab.
2. Reset all system fixtures to their canonical state.
3. Enable the runtime capabilities needed by the selected course.
4. Execute the course scenario.
5. Record real runtime events and diagnostics.
6. Produce pass/fail/partial status with actionable reasons.
7. Persist the NPC capability configuration, not the temporary scene state.
8. Reset the lab.

## User flow

Library / Create NPC
→ Editor
→ Training / Skills
→ Run selected course
→ Inspect behavior graph + diagnostics
→ Test NPC
→ Save capability configuration
→ Send / Open in WonderPlay 3D Studio

There is no separate user scene picker inside NPC-AI-SIM.

## Main 3D handoff

The exported/saved NPC package should retain:

- identity
- model/rig references
- animations
- behavior graph/state config
- navigation capability config
- perception config
- interaction capabilities
- dialogue and voice profile
- memory/personality config
- validated skill/capability list

WonderPlay then places that NPC into user-owned scenes and environments.