# NPC-AI-SIM Editor UI TODO

## Source of truth

Do not delete or replace the existing NPC architecture. `NPC_SYSTEM_SPEC.md` remains authoritative for NPC runtime behavior, dialogue, voice, events, state-machine control, animation/audio synchronization, caching, safety, and PlayCanvas/WebGL integration.

The editor work must extend that system, not create a second NPC framework.

## Current master visual target

The latest user-provided **AI Wonderland NPC Behavior Studio** image is the current visual target for the editor.

The browser editor should match that image as closely as practical while remaining NPC-AI-SIM's own React/TypeScript/Three.js implementation. The older Spatial Composer reference remains useful historical design context, but it is no longer the primary visual target.

### Visual rules from the current target

- dark professional engine chrome, not generic dashboard styling
- compact top menu/toolbars
- character/NPC browser on the left
- large cinematic NPC viewport in the center
- AI behavior graph as a first-class editor surface
- details/inspector controls that feel like an engine, not a form page
- bottom diagnostics/debug/runtime area
- strong blue/cyan/violet accent lighting
- high-quality character/environment presentation when hardware supports WebGL
- graceful software-preview fallback on machines without WebGL

## Product boundary

NPC-AI-SIM creates, configures, trains, tests, and exports NPCs.

It does **not** become another user scene/world editor. User-owned assets, scenes, environments, and movie/3D creation remain in the main DreamMakerHub/WonderPlay 3D system.

NPC-AI-SIM may contain exactly one system-owned temporary training sandbox and system-owned training props. Users cannot edit, delete, replace, or publish those training-scene assets.

## Unreal-style NPC architecture direction

Use the same conceptual separation found in professional game-engine AI workflows, adapted to NPC-AI-SIM:

- authoritative NPC state machine / behavior graph
- navigation/pathfinding capability layer
- perception layer: sight, hearing, proximity, events
- interaction definitions / smart-object-style interaction points
- animation and motion capabilities
- dialogue and voice driven by actual NPC state
- reusable capability/training modules
- deterministic validation in the temporary training sandbox
- AI/LLM may suggest dialogue or decisions, but does not override authoritative runtime state

Do not market every course as model retraining. Most courses install/configure reusable runtime capabilities, rules, graph nodes, animation hooks, interaction definitions, and validation tests. Actual adaptive/learning-agent training can be added later as a separate advanced system.

## Completed foundation

- [x] **Task 1 — True full-screen /builder editor route**
- [x] **Task 2 — Initial multi-panel editor layout**
- [x] **Task 3 — Asset browser + hierarchy**
- [x] **Task 4 — Details / inspector controls**
- [x] **Task 5 — Editor menus + transform/play toolbar**
- [x] **Task 6 — AI Behavior Graph editor**
- [x] **Task 7 — Debug console**
- [x] **Task 8 — Remove primitive NPC as primary renderer**
- [x] **Task 9 — Real GLB/GLTF character loading**
- [x] **Task 10 — Viewport rendering quality upgrade**
- [x] **Task 11 — Proper 3D environment / scene foundation**
- [x] **Task 12 — Replace shell with engine-style reference layout**
- [x] **Task 12A — White-screen recovery and WebGL fallback**
- [x] **Task 12B — First visual polish pass**

## Current implementation pass

- [ ] **Task 13 — Pixel-match AI Wonderland NPC Behavior Studio chrome**
  - match panel widths/heights and toolbar density
  - match dark gray/blue hierarchy and dividers
  - improve NPC asset tiles and character browser
  - improve behavior-node visual hierarchy and graph spacing
  - improve inspector grouping and control density
  - improve bottom diagnostics/runtime presentation
  - keep all existing runtime behavior intact

- [ ] **Task 14 — System-owned Training Lab**
  - one temporary read-only sandbox
  - fixed system props and interaction targets
  - reset sandbox between validation runs
  - no user scene creation inside NPC-AI-SIM
  - add Training / Skills view instead of user-editable Environments
  - expose validation status per capability

- [ ] **Task 15 — Skill/capability courses**
  - Movement: idle, walk, run, jump, turn, stop
  - Navigation: follow, patrol, avoid obstacles, reach target
  - Perception: see, hear, proximity, lose target
  - Communication: talk, listen/respond, subtitles, interruption
  - Interaction: doors, buttons/consoles, pickup/use objects, sit/use points
  - Social: greet, follow, react, relationship hooks
  - Combat/reaction hooks where appropriate
  - Memory/reasoning hooks where appropriate
  - each course maps to actual behavior/runtime capabilities and tests

- [ ] **Task 16 — Main 3D handoff**
  - save/export NPC capabilities and configuration
  - send/open NPC in WonderPlay / main 3D Studio
  - real user scenes remain owned by the main 3D system
  - NPC keeps behavior, perception, voice, animation, memory, and capability config

- [ ] **Task 17 — Final viewport/runtime fidelity**
  - production-quality character presentation
  - PBR/material polish where source assets support it
  - facial/blendshape hooks where supported
  - idle/lip-sync hooks
  - visible transform/camera gizmo treatment
  - graph updates actual NPC behavior configuration
  - diagnostics report actual runtime events
  - save/load project state
  - screenshot-by-screenshot comparison against the current master image

## Current task

**Task 13 + Task 14 foundation only.** Preserve the runtime source of truth, add the Unreal-style training architecture, and continue matching the current AI Wonderland NPC Behavior Studio image.

## Working rule

Work in small batches and verify the build after each batch. Do not replace working NPC runtime/Three.js functionality merely to imitate the screenshot.