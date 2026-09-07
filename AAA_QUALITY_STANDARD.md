# NPC-AI-SIM AAA Quality Standard

This document defines the acceptance bar for visual and runtime presentation in NPC-AI-SIM.

## Source of truth

`NPC_SYSTEM_SPEC.md` remains the authoritative runtime architecture. `NPC_EDITOR_TODO.md` remains the editor implementation plan. This quality standard does not replace either document.

The current master visual target is the user-provided **AI Wonderland NPC Behavior Studio** image.

## AAA means a measurable bar, not a marketing label

A pass is not accepted merely because it is dark, glowy, or "game engine style". The editor should feel like a polished professional character tool at first glance and remain usable under real load.

### 1. Editor chrome
- compact professional menu and tool bars
- clear panel hierarchy with consistent spacing and borders
- readable type at 1080p without oversized dashboard cards
- consistent icon weight and interaction states
- selected, hover, disabled, loading, error, and success states are visually distinct
- no placeholder-looking gradients, giant empty panels, or generic SaaS card layouts

### 2. Character viewport
When WebGL is available:
- physically based materials where source assets support them
- ACES filmic tone mapping and correct sRGB output
- studio-quality key/fill/rim lighting
- contact and cast shadows
- cinematic environment separation from the character silhouette
- idle animation when clips are available
- stable orbit camera and sensible framing per character type
- high-DPI rendering within a bounded performance budget
- graceful loading and asset failure handling

When WebGL is unavailable:
- the editor still looks intentional
- software preview does not resemble a crash/error page
- character identity, status, training state, and important metadata remain visible

### 3. Character assets
The built-in showcase must not depend forever on demo avatars or primitive stand-ins.

Production readiness requires:
- licensed or original high-quality GLB/GLTF character assets
- consistent thumbnail renders generated from the actual models
- PBR material maps where supported
- animation clips for at least idle, walk, run, turn, jump, talk/gesture
- clear provenance/license metadata for every bundled asset

Remote public demo assets are acceptable only as development fallbacks, not as the final AAA showcase library.

### 4. Behavior graph
- graph nodes must look like a professional visual scripting tool
- compact headers, clear pin hierarchy, readable active-flow state
- connections remain legible over a dark graph background
- selection and active runtime flow are immediately distinguishable
- the graph manipulates actual NPC behavior configuration, not decorative mock state

### 5. Inspector
- dense engine-style property editing rather than oversized form cards
- logical sections for Identity, Transform, AI Brain, Navigation, Perception, Voice, Animation, Memory, Interaction, and Runtime
- values write to the actual selected NPC or runtime object where implemented
- units, ranges, validation and reset-to-default affordances where appropriate

### 6. Training Lab
- exactly one system-owned temporary training sandbox
- read-only fixtures and props
- resets between validation runs
- no user scene/world authoring inside NPC-AI-SIM
- training courses map to real capabilities and deterministic tests
- user scenes, environment creation, assets and movie/3D creation remain in WonderPlay/main 3D

### 7. Motion and interaction
- blended locomotion rather than abrupt clip switching
- animation/state synchronization
- look-at and conversation target hooks
- interaction alignment for doors, consoles, pickup/use points and other training fixtures
- interruption handling between dialogue, movement and higher-priority states

### 8. Audio and dialogue
- state-driven dialogue
- asynchronous voice generation/playback
- spatial voice where supported
- subtitle timing and accessibility
- no fake success messages or fake audio
- cache generated audio assets according to the existing source-of-truth architecture

### 9. Performance targets
- renderer quality tier selected from actual device capability
- bounded pixel ratio
- shadow and post-processing quality tiers
- no AI/TTS generation in the render loop
- no white-screen failure if WebGL, model, environment, animation or network loading fails

### 10. Final acceptance
Before calling the editor AAA-ready:
1. compare a fresh production screenshot side by side with the master reference
2. verify real character assets, not development stand-ins
3. verify behavior graph and inspector mutate real runtime state
4. verify Training Lab validation for core movement/navigation/perception/dialogue/interaction courses
5. verify handoff/export to WonderPlay/main 3D
6. verify desktop 1080p visual polish and a reduced-quality fallback path
7. verify production deployment and public HTTPS rendering

Until those checks pass, describe the product as moving toward AAA quality rather than claiming final AAA fidelity.
