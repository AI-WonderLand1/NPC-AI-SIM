# NPC-AI-SIM Editor + Brain TODO

## Locked source of truth

NPC-AI-SIM is a **cognition-first NPC brain builder**.

The permanent visual centerpiece is the sci-fi **Cognitive Core** shown in the approved reference mockup. The editor must visually replicate that reference rather than falling back to a generic SaaS/dashboard look.

AI Playground owns visual workflows, nodes, n8n-style orchestration, multi-agent automation, HTTP/code nodes, triggers, cron and provider-routing workflows.

NPC-AI-SIM owns:

- identity / role
- AI model + reasoning configuration
- personality
- emotion
- memory
- knowledge / RAG
- perception
- voice / dialogue
- actions / capabilities
- relationships
- training / testing
- runtime state inspection
- game-engine/runtime integration
- brain export / handoff

### Explicitly removed from the NPC editor product boundary

- behavior-node canvas
- n8n-style visual workflow graph
- duplicate NPC list in the editor sidebar
- full character-model editor as the primary surface
- movie/cinematic production tooling
- photogrammetry/reality-capture tooling

A character/model may be linked later as a **test subject** for runtime validation, but the brain is the product and the character is only a host for testing.

---

## Visual source of truth

The approved Cognitive Core editor mockup is the primary visual target.

Required shell:

```text
AI WONDERLAND global nav
├── NPC-AI-SIM left navigation
├── permanent Cognitive Core centerpiece
├── right Live NPC / runtime inspector
└── bottom brain configuration workspace
    ├── Details
    ├── AI Brain
    ├── Personality
    ├── Memory
    ├── Perception
    ├── Knowledge / RAG
    ├── Voice
    ├── Actions
    └── Integrations
```

Visual rules:

- use the approved dark sci-fi AI WONDERLAND aesthetic
- dense technical controls, not generic oversized cards
- each major region gets scoped CSS/layout rules
- one scroll owner per panel
- CSS Grid for macro layout
- Flexbox for rows/toolbars
- container/responsive rules per section when needed
- technical values should use a mono/technical font where useful
- general UI text should remain readable
- no decorative telemetry presented as real telemetry
- no duplicate controls merely to fill space
- no behavior graph in NPC-AI-SIM

---

## Current implementation status

### Completed in the cognition-first redesign

- [x] replaced the live `ReferenceEditorShell` behavior-graph layout with the Cognitive Core shell
- [x] removed the behavior graph from the active editor surface
- [x] removed the duplicate NPC list from the active editor shell
- [x] made the Cognitive Core the permanent central visual
- [x] added a dedicated scoped stylesheet: `src/theme/npc-brain-editor.css`
- [x] added right-side Live NPC / cognition inspector structure
- [x] added bottom configuration tabs for brain subsystems
- [x] added Actions / Capabilities catalog instead of graph wiring
- [x] added AI Playground integration surface for advanced workflows
- [x] stopped mounting the character viewport as the primary BuilderPage surface
- [x] left existing Three.js character-rendering code in the repo for later linked-character test use

### Current active route

```text
src/main.tsx
→ src/App.tsx
→ src/components/BuilderPage.tsx
→ src/components/builder/ReferenceEditorShell.tsx
→ src/theme/npc-brain-editor.css
```

---

# Phase 0 — Verify the new shell

- [ ] `npm run build` passes after the cognition-first redesign
- [ ] UpCloud deploy health check passes
- [ ] visually inspect at 1536×1024 against the approved mockup
- [ ] visually inspect at 1920×1080
- [ ] visually inspect at 1366×768
- [ ] fix any clipped bottom tabs or inspector overflow
- [ ] verify no nested-scrollbar mess
- [ ] confirm reduced-width responsive behavior does not crush the Cognitive Core

Do not call the replica complete until the rendered application has been compared against the source image.

---

# Phase 1 — Make the mockup controls real without faking runtime state

## Editor state model

- [ ] create a versioned `NpcBrainConfig` schema
- [ ] move identity/model/personality/memory/perception/voice/action values out of component-local defaults
- [ ] centralize brain configuration state
- [ ] persist editor configuration per NPC/project
- [ ] add undo/redo for configuration changes
- [ ] add dirty/saved state driven by real persistence

## Live inspector truthfulness

- [ ] `DESIGN MODE` when no runtime is connected
- [ ] `ACTIVE TEST` only when an actual test runtime is running
- [ ] current state must come from the runtime
- [ ] current goal must come from the runtime
- [ ] emotion must come from the runtime/emotion system
- [ ] perception values must come from real perception events
- [ ] current action/progress must come from actual action execution
- [ ] memory summary must come from the real memory system
- [ ] runtime system badges must reflect real subsystem connectivity

Never replace missing runtime data with made-up success numbers.

---

# Phase 2 — AI Brain

- [ ] authoritative model/provider config
- [ ] reasoning depth / budget config
- [ ] confidence threshold
- [ ] replanning interval
- [ ] goal-selection strategy
- [ ] fallback behavior
- [ ] system/core directives
- [ ] context budget
- [ ] safe capability gate before any action reaches the runtime

Provider-routing and complex automation remain in AI Playground. NPC-AI-SIM consumes the provider/runtime interface it needs; it does not rebuild AI Playground.

---

# Phase 3 — Personality + emotion

- [ ] persona/archetype
- [ ] role
- [ ] backstory
- [ ] traits
- [ ] values
- [ ] emotional baseline
- [ ] relationship tendencies
- [ ] personality influences decisions without directly overriding runtime safety
- [ ] emotion state can change from events and memory
- [ ] expose emotion changes in the Live NPC inspector

---

# Phase 4 — Memory

- [ ] working/short-term memory
- [ ] episodic memory
- [ ] semantic memory
- [ ] relationship memory
- [ ] importance scoring
- [ ] forgetting/decay policy
- [ ] retrieval budget
- [ ] persistence layer
- [ ] inspect individual memory entries
- [ ] show what memory influenced a decision when available

---

# Phase 5 — Knowledge / RAG

- [ ] TXT ingestion
- [ ] PDF ingestion
- [ ] world-lore sources
- [ ] character-history sources
- [ ] manuals / rules / canon sources
- [ ] chunking
- [ ] embeddings
- [ ] retrieval top-K
- [ ] relevance threshold
- [ ] source metadata
- [ ] internal grounding trail
- [ ] clear unknown/uncertain behavior when knowledge is insufficient

Knowledge must remain conceptually separate from personality and memory.

---

# Phase 6 — Perception

- [ ] sight radius
- [ ] field of view
- [ ] hearing sensitivity
- [ ] proximity threshold
- [ ] attention timing
- [ ] dynamic/static object awareness
- [ ] target acquisition/loss
- [ ] environment/context events
- [ ] perception event stream to brain runtime
- [ ] real live perception readout in right inspector

---

# Phase 7 — Actions / capabilities

NPC-AI-SIM uses an action catalog, not a node canvas.

Initial capabilities:

- [ ] Think
- [ ] Perceive
- [ ] Plan
- [ ] Speak
- [ ] Follow
- [ ] Greet
- [ ] Patrol
- [ ] Use Object
- [ ] Open Door
- [ ] Sit / use point
- [ ] Defend
- [ ] Attack
- [ ] Flee
- [ ] Custom engine action

Each action needs:

- [ ] enabled/disabled state
- [ ] whether AI may select it
- [ ] requirements
- [ ] parameters
- [ ] cooldown
- [ ] target constraints
- [ ] runtime event name
- [ ] execution status
- [ ] failure reason
- [ ] cancellation support

The brain chooses among allowed capabilities based on perception, memory, personality, goals and context.

---

# Phase 8 — Voice / dialogue

## DialogueManager

- [ ] fix priority ordering so higher-priority dialogue runs first
- [ ] fix `stop()` null callback bug
- [ ] implement real pause/resume or remove the controls
- [ ] tie dialogue completion to actual playback completion
- [ ] make provider selection consistent

## Browser TTS

- [ ] redesign/remove worker-side Web Speech synthesis assumptions
- [ ] do not claim captured WAV data unless real audio bytes exist
- [ ] keep direct browser speech as playback-only fallback
- [ ] use server/provider generation when reusable audio assets are required

## VoiceComponent

- [ ] wait for real audio completion
- [ ] prevent overlapping speech correctly
- [ ] keep provider keys server-side in production
- [ ] connect real viseme timing when available

---

# Phase 9 — Animation / linked character testing

The full character editor is not part of the primary brain-building surface.

Keep existing character-rendering code only for test-host use.

- [ ] add small linked-character/test-subject control
- [ ] attach/detach GLB/GLTF host
- [ ] detect rig/animation availability
- [ ] feed actual GLTF animation clips to animation runtime
- [ ] fix head look-at logic
- [ ] validate brain → action → animation handoff
- [ ] validate brain → dialogue → voice → lip-sync handoff
- [ ] keep WebGPU → WebGL2 fallback for linked-character testing

---

# Phase 10 — Training Lab

`trainingCatalog.ts` is a useful definition layer but not yet a training executor.

- [ ] one system-owned locked Training Lab
- [ ] deterministic fixtures
- [ ] reset between runs
- [ ] movement validation
- [ ] navigation validation
- [ ] perception validation
- [ ] communication validation
- [ ] interaction validation
- [ ] social validation
- [ ] memory/reasoning validation hooks
- [ ] real pass/fail diagnostics from runtime events
- [ ] show training results in NPC-AI-SIM, not in a behavior graph

---

# Phase 11 — Native brain runtime

Use C++20 + BehaviorTree.CPP as an execution/control layer where appropriate.

Target structure:

```text
native/
├── CMakeLists.txt
├── include/
│   └── npc/
└── src/
    ├── BrainRuntime.cpp
    ├── Blackboard.cpp
    ├── BrainSerializer.cpp
    ├── Perception.cpp
    ├── Memory.cpp
    └── actions/
```

- [ ] authoritative `BrainRuntime`
- [ ] blackboard/world state
- [ ] perception integration
- [ ] memory integration
- [ ] goal/decision layer
- [ ] action execution layer
- [ ] dialogue triggers
- [ ] animation triggers
- [ ] versioned JSON brain schema
- [ ] LLM output advisory; runtime remains authoritative over actions

QtNodes is **not** required for the browser editor. Qt 6 + QtNodes remains optional only if a separate native debugger is ever justified.

---

# Phase 12 — Web ↔ runtime bridge

- [ ] versioned protocol
- [ ] send brain configuration to runtime
- [ ] stream runtime state to Live NPC inspector
- [ ] stream perception events
- [ ] stream memory events
- [ ] stream action start/progress/success/failure/cancel
- [ ] stream runtime diagnostics/errors
- [ ] safe reconnect after restart
- [ ] reject incompatible schema versions cleanly

No web behavior graph is required for this bridge.

---

# Phase 13 — AI Playground handoff

AI Playground is the advanced automation escape hatch.

Expose from NPC-AI-SIM:

- [ ] NPC ID
- [ ] available actions/capabilities
- [ ] perception events
- [ ] memory hooks
- [ ] dialogue hooks
- [ ] runtime events
- [ ] game-engine events

AI Playground may then orchestrate external workflows without duplicating its node system inside NPC-AI-SIM.

---

# Phase 14 — Repo cleanup

## Documentation

Target root documentation set:

```text
README.md
NPC_SYSTEM_SPEC.md
BEHAVIOR_STUDIO_VISUAL_SPEC.md
NPC_EDITOR_TODO.md
```

- [ ] rewrite `README.md`
- [ ] rewrite/consolidate `NPC_SYSTEM_SPEC.md`
- [ ] update `BEHAVIOR_STUDIO_VISUAL_SPEC.md` to the Cognitive Core source-of-truth layout
- [ ] merge useful requirements from `AAA_QUALITY_STANDARD.md`, then remove it
- [ ] merge training requirements from `NPC_TRAINING_SPEC.md`, then remove it
- [ ] merge workspace/security rules from `PRIVATE_WORKSPACE_ARCHITECTURE.md`, then remove it
- [ ] remove stale `IMPLEMENTATION_SUMMARY.md`

## Root hygiene

- [ ] remove `package.json.bak`
- [ ] remove `tsconfig.json.bak`
- [ ] remove committed generated `tmp/server.js`
- [ ] add `tmp/` to `.gitignore`
- [ ] add `*.bak` to `.gitignore`
- [ ] rewrite/remove stale `metadata.json` (`MeshForge Studio`)
- [ ] remove/relocate Meshroom/COLMAP setup files if no longer part of NPC-AI-SIM

## Old product-boundary code

After verifying import consumers:

- [ ] remove obsolete behavior-graph active-path code
- [ ] remove `MovieStudioView.tsx` from NPC-AI-SIM
- [ ] remove `RealityCapturePipelinePanel.tsx`
- [ ] remove/rebuild hard-coded `WonderCanvasStats.tsx`
- [ ] remove unused old builder shells/panels
- [ ] keep old Three.js character viewport code only if used for linked-character test mode

---

# Phase 15 — Backend/security correctness

- [ ] fix README/runtime script mismatch
- [ ] choose a real combined dev command if client + API are both required
- [ ] server respects `process.env.PORT`
- [ ] remove hard-coded deployment host fallback
- [ ] keep build-before-deploy gate
- [ ] keep post-deploy `/api/health` verification
- [ ] remove/implement fake `/api/contact`
- [ ] remove/replace in-memory subscription endpoints if unused
- [ ] authentication before multi-user production claims
- [ ] server-side encrypted provider credentials
- [ ] raw stored provider keys never returned to browser
- [ ] rate limits/payload limits for expensive endpoints
- [ ] validate API request schemas

---

# Working rules

- the approved Cognitive Core mockup is the visual source of truth
- do not reintroduce a behavior-node canvas into NPC-AI-SIM
- AI Playground owns n8n/workflow/node orchestration
- do not add generic SaaS styling in place of the reference design
- do not use screenshots as fake UI backgrounds
- build the actual layout/components
- do not display fabricated telemetry as real telemetry
- do not delete files without checking active import/export consumers
- work in small verified batches
- run `npm run build` after meaningful changes
- keep deployment health checks passing
- preserve useful existing systems while removing stale product-boundary code
- label planned functionality as planned until it is wired and tested
