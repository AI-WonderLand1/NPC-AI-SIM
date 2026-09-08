# NPC-AI-SIM Editor + Brain TODO

## Source of truth

Do not replace the existing NPC systems merely to change the editor architecture.

Keep the current React/Vite/TypeScript application, current Three.js rendering path, dialogue/voice/animation/event systems that remain useful, and the existing NPC editor shell unless a task below explicitly replaces or removes a stale implementation.

`NPC_SYSTEM_SPEC.md` is the runtime/architecture source of truth.

`BEHAVIOR_STUDIO_VISUAL_SPEC.md` is the visual/layout source of truth.

This file is the active implementation and cleanup plan.

---

## Verified baseline

- [x] repository recursively audited on `main`
- [x] recursive Git tree returned `truncated: false`
- [x] current browser application entry path identified
- [x] current deployment workflow inspected
- [x] last verified baseline build passed in GitHub Actions
- [x] last verified baseline deployment to UpCloud passed health check

Do not perform large destructive cleanup in one commit. Remove stale files in small groups and verify `npm run build` after each group.

---

## Current architecture decision

### Keep

- React 18
- TypeScript
- Vite
- Three.js WebGPU/WebGL rendering
- Express + WebSocket backend for now
- existing dialogue concepts
- existing voice/TTS abstractions after fixes
- subtitle system
- animation synchronization after fixes
- NPC event system
- AI validation/state-consistency concepts after redesign
- current `ReferenceEditorShell`
- current `AdaptiveNPCViewport`
- current Training Lab catalog as a data foundation

### Upgrade

Replace the hand-built graph mechanics in:

`src/components/builder/RightPanel/BehaviorGraphEditor.tsx`

with `@xyflow/react`, while preserving the custom engine-style node appearance.

Preserve and adapt:

- `BehaviorNode`
- `NodePin`
- `GraphConnection`

Do not introduce QtNodes into the browser editor.

### Add later

Create a separate native NPC brain runtime:

```text
native/
├── CMakeLists.txt
├── include/
│   └── npc/
└── src/
    ├── BrainRuntime.cpp
    ├── Blackboard.cpp
    ├── BrainSerializer.cpp
    └── nodes/
```

Use C++20 + BehaviorTree.CPP + a versioned JSON brain schema. Qt 6 + QtNodes is optional later only for a separate native debugger/editor.

---

# Phase 0 — Documentation cleanup

The complete recursive repo scan found eight Markdown files, all at repository root.

## Keep

- [ ] `README.md`
  - rewrite to describe what is actually implemented today
  - fix development instructions
  - distinguish implemented features from planned native brain features
  - describe Three.js WebGPU/WebGL as the current renderer
  - remove stale claims that imply unfinished systems are production-ready

- [ ] `NPC_SYSTEM_SPEC.md`
  - rewrite into one balanced runtime architecture document
  - retain useful voice/dialogue requirements
  - merge Training Lab architecture
  - merge workspace isolation/auth/BYOK rules
  - add future BehaviorTree.CPP/native runtime design
  - clearly mark present implementation versus target architecture

- [ ] `BEHAVIOR_STUDIO_VISUAL_SPEC.md`
  - keep as visual source of truth
  - merge useful measurable acceptance rules from `AAA_QUALITY_STANDARD.md`
  - include font/node/data-column guidance
  - preserve exact NPC Behavior Studio product boundary

- [x] `NPC_EDITOR_TODO.md`
  - active implementation plan

## Merge, then remove

- [ ] `AAA_QUALITY_STANDARD.md`
  - merge unique measurable acceptance requirements into `BEHAVIOR_STUDIO_VISUAL_SPEC.md`
  - delete only after requirements are preserved

- [ ] `NPC_TRAINING_SPEC.md`
  - merge Training Lab rules/courses/validation lifecycle into `NPC_SYSTEM_SPEC.md`
  - delete afterward

- [ ] `PRIVATE_WORKSPACE_ARCHITECTURE.md`
  - merge isolation/team/auth/BYOK/licensing rules into `NPC_SYSTEM_SPEC.md`
  - delete afterward

## Remove

- [ ] `IMPLEMENTATION_SUMMARY.md`
  - stale WonderPlay landing-page implementation summary
  - references `LandingPage.tsx`, which is not in the current repo
  - not a source of truth

## Target Markdown set

```text
README.md
NPC_SYSTEM_SPEC.md
BEHAVIOR_STUDIO_VISUAL_SPEC.md
NPC_EDITOR_TODO.md
```

Legal/community files such as `SECURITY.md` or `CONTRIBUTING.md` may be added separately if needed.

---

# Phase 1 — Root repo hygiene

## Confirmed stale/generated files

- [ ] remove `package.json.bak`
- [ ] remove `tsconfig.json.bak`
- [ ] remove committed generated `tmp/server.js`
- [ ] add `tmp/` to `.gitignore`
- [ ] add `*.bak` to `.gitignore`

## Old WonderPlay / photogrammetry remnants

Review as one isolated cleanup commit:

- [ ] remove or relocate `setup.sh` if NPC-AI-SIM no longer owns Meshroom installation
- [ ] remove or relocate `shell.nix` if NPC-AI-SIM no longer owns Blender/COLMAP/Meshroom tooling
- [ ] remove associated `flake.lock` if the Nix environment is removed
- [ ] remove/replace Reality Capture UI code after verifying no external consumer depends on it

Current product boundary says general scene, movie, photogrammetry and 3D production belong in WonderPlay/main 3D, not NPC-AI-SIM.

## Stale metadata/config

- [ ] rewrite or remove `metadata.json`
  - currently identifies the app as `MeshForge Studio`
  - currently describes Meshroom + Blender photogrammetry
- [ ] refresh `.env.example`
  - remove stale Google AI Studio injection comments if production is UpCloud/AI Wonderland
  - document server-side provider variables truthfully
  - remove unused variables
- [ ] review root `types.d.ts`
  - likely obsolete `@google/genai` shim
  - remove only after a build passes without it

## Package/install consistency

- [ ] choose one production package-manager lock strategy
- [ ] if staying with npm: track `package-lock.json` and use `npm ci`
- [ ] if using Bun: change CI/deployment to Bun consistently
- [ ] do not keep `bun.lock` while production installs are intentionally unlocked with npm unless there is a documented reason

## Candidate unused dependencies

Verify with import audit + build before removing:

- [ ] `playcanvas`
- [ ] `@supabase/ssr`
- [ ] `@supabase/supabase-js`
- [ ] `motion`
- [ ] `three-stdlib`

Current active renderer code is Three.js WebGPU/WebGL. Do not claim PlayCanvas integration unless actual code uses it.

---

# Phase 2 — Remove or rewire stale/decorative UI

## Confirmed product-boundary violations / old UI

- [ ] remove `src/components/builder/MovieStudioView.tsx` from NPC-AI-SIM unless there is a concrete NPC-only cinematic need
- [ ] remove `src/components/builder/Pipeline/RealityCapturePipelinePanel.tsx`
  - current implementation simulates COLMAP/Meshroom/Cycles progress with timers and hard-coded success output
- [ ] remove or rewrite `src/components/builder/Pipeline/WonderCanvasStats.tsx`
  - current telemetry values/capability states are hard-coded
- [ ] remove the editable `Environments` sidebar mode from `ReferenceEditorShell`
  - replace with `Training / Skills`
  - NPC-AI-SIM gets exactly one system-owned read-only Training Lab

## Legacy editor components

Audit import consumers, then remove unused legacy components in small groups. Current live browser route uses `ReferenceEditorShell`, not the older `EditorShell` architecture.

Candidates:

- [ ] `src/components/builder/EditorShell.tsx`
- [ ] old drawer/panel components exported only by `src/components/builder/index.ts`
- [ ] obsolete pipeline/content-browser helpers after import verification
- [ ] old viewport wrappers after confirming `AdaptiveNPCViewport` is the single active viewport entry

Update `src/components/builder/index.ts` as stale exports are removed.

## Remove fake-success behavior

Do not present simulated actions as completed production functionality.

- [ ] `Play Test` must run actual NPC/runtime logic or be visibly disabled/preview-only
- [ ] export buttons must perform a real export or be visibly unavailable
- [ ] AI command field must call a real provider/runtime path or be labeled preview-only
- [ ] `AIW GATEWAY READY` must be driven by real gateway/provider state
- [ ] graph active-flow state must come from real execution, not default hard-coded flags
- [ ] debug console success messages must represent real events

---

# Phase 3 — Current web/backend correctness

## Development/runtime scripts

- [ ] fix README claim that `npm run dev` starts Vite + Express on port 3000
- [ ] choose a real combined development command if both client and API are required
- [ ] make server respect `process.env.PORT` instead of hard-coding only `3000`
- [ ] verify production `dist` package paths
- [ ] verify `package.json` `main`, `module`, and `types` fields point to files actually emitted by TypeScript/Vite

## Deployment workflow

- [ ] remove hard-coded UpCloud IP fallback from workflow
- [ ] require repository/environment variables for deployment host
- [ ] keep build-before-deploy gate
- [ ] keep `/api/health` post-deploy verification

## Stale endpoints/features

- [ ] remove or implement `/api/contact`
  - currently logs input and returns success without real delivery/persistence
- [ ] remove or replace in-memory subscription endpoints
  - no payment/auth/persistence
  - current `BuilderPage` ignores subscription props anyway
- [ ] remove dead subscription plumbing from `App.tsx`, `Scene3D.tsx`, `SubscriptionContext.tsx` if subscriptions are not currently part of this repo

---

# Phase 4 — Voice/dialogue/runtime bug fixes

These should be fixed before the native brain work so the existing runtime foundation is trustworthy.

## DialogueManager

- [ ] fix priority ordering so higher-priority dialogue actually runs first
- [ ] fix `stop()` calling `onDialogueEnd()` with null
- [ ] implement real pause/resume or remove exposed stubs
- [ ] tie dialogue completion to actual audio playback completion instead of text-length timeout
- [ ] make provider/config selection consistent

## Browser TTS

- [ ] redesign `BrowserTTSWorkerProvider`
  - Web Speech synthesis is a Window API and must not be treated as a normal worker-side API
- [ ] remove fake/off-path worker synthesis implementation
- [ ] fix Browser TTS audio handling
  - current MediaStreamDestination is not connected to the browser speech output
  - do not claim a captured WAV unless actual audio bytes are produced
- [ ] keep browser speech as direct playback if capture is not supported
- [ ] use server/provider APIs when an actual reusable audio asset is required

## VoiceComponent

- [ ] wait for real audio completion before clearing playing state
- [ ] ensure Three.js positional audio uses valid decoded audio from the selected provider
- [ ] prevent overlapping speech correctly
- [ ] keep provider keys out of client-side provider objects in production

## AnimationSync

- [ ] feed actual GLTF animation clips into the animation system
- [ ] do not rely on animation clips being attached to `SkinnedMesh.animations`
- [ ] fix head look-at calculation so the head looks at the requested target rather than its own world position
- [ ] keep simplified text visemes clearly marked as fallback only

## WebSocket brain

- [ ] remove circular import through `./index.js`
- [ ] import `DialogueManager` and dialogue types directly
- [ ] remove hard-coded mouth-shape behavior once real audio/viseme data exists
- [ ] use actual `npcId` consistently instead of `unknown`
- [ ] replace random server viseme frames with real runtime/audio timing

## Audio asset persistence

- [ ] keep `AudioAssetManager` interface if useful
- [ ] add real persistence/project storage before calling generated audio a saved project asset
- [ ] keep in-memory Map storage documented as temporary only

## AI validation

- [ ] redesign `AISafetyValidator` domain rules
- [ ] do not globally reject ordinary game/NPC combat vocabulary such as `kill` merely because it appears in dialogue
- [ ] separate content policy, game-state consistency, and sanitization concerns
- [ ] ensure sanitization result is actually used when intended

---

# Phase 5 — Behavior graph upgrade

- [ ] add `@xyflow/react`
- [ ] replace manual node dragging with XYFlow
- [ ] replace manual Bézier connection rendering with XYFlow edges
- [ ] preserve current custom node styling
- [ ] preserve active-flow appearance
- [ ] preserve node selection and inspector integration
- [ ] preserve add-node/template workflow
- [ ] adapt current `BehaviorNode`, `NodePin`, `GraphConnection` types
- [ ] add graph save/load serialization
- [ ] make graph state update actual NPC behavior configuration
- [ ] remove decorative execution state once real runtime status exists

---

# Phase 6 — Native NPC brain runtime

- [ ] add `native/` C++20 project
- [ ] integrate BehaviorTree.CPP
- [ ] implement authoritative `BrainRuntime`
- [ ] implement blackboard/world state
- [ ] perception nodes
- [ ] memory nodes
- [ ] decision/control nodes
- [ ] movement/action nodes
- [ ] dialogue trigger nodes
- [ ] animation trigger nodes
- [ ] stable versioned JSON brain schema
- [ ] map web graph nodes to BehaviorTree.CPP runtime nodes
- [ ] LLM output remains advisory; authoritative runtime state controls NPC actions

---

# Phase 7 — Web ↔ native brain bridge

- [ ] define versioned protocol
- [ ] send graph config to runtime
- [ ] stream node execution state back to editor
- [ ] stream blackboard values
- [ ] stream runtime diagnostics/errors
- [ ] show real `IDLE`, `RUNNING`, `SUCCESS`, `FAILURE`, `ERROR` graph states
- [ ] safe reconnect after runtime/WebSocket restart
- [ ] reject incompatible schema versions cleanly

---

# Phase 8 — Workspace/security architecture

- [ ] authentication must exist before multi-user production claims
- [ ] map AI Wonderland identity to user/team workspace
- [ ] platform-managed or user/team BYOK credentials stored server-side/encrypted
- [ ] raw stored provider keys are never returned to browser
- [ ] remove direct-browser provider-key paths for production providers
- [ ] isolate user/team runtime and project storage boundaries
- [ ] preserve one read-only system Training Lab per runtime/workspace
- [ ] add rate limits and payload limits appropriate to expensive AI/image/video endpoints
- [ ] validate API input schemas instead of trusting arbitrary request bodies

---

# Phase 9 — Visual target

- [ ] match AI Wonderland NPC Behavior Studio panel proportions
- [ ] improve behavior-node hierarchy
- [ ] dense engine-style inspector controls
- [ ] use Share Tech Mono where appropriate for technical/node labels
- [ ] use Roboto Mono or JetBrains Mono for values, IDs, blackboard, console
- [ ] readable sans-serif for general controls
- [ ] explicitly load chosen fonts instead of only listing fallbacks
- [ ] keep viewport as hero surface
- [ ] no generic SaaS cards
- [ ] no excessive glow
- [ ] no DiceBear/cartoon avatars in final primary editor presentation
- [ ] replace remote Three.js demo characters with licensed/original production assets
- [ ] preserve real WebGPU → WebGL fallback behavior

---

# Phase 10 — Training Lab

Current `trainingCatalog.ts` is a useful data definition, but it is not yet a validation runtime.

- [ ] one system-owned temporary Training Lab
- [ ] fixed locked fixtures
- [ ] reset between runs
- [ ] implement actual training scenario runner
- [ ] movement validation
- [ ] navigation validation
- [ ] perception validation
- [ ] communication validation
- [ ] interaction validation
- [ ] social validation
- [ ] memory/reasoning hooks
- [ ] real pass/fail diagnostics based on runtime events

---

# Phase 11 — Main 3D handoff

- [ ] save/export NPC brain configuration
- [ ] retain model/rig refs
- [ ] retain animations
- [ ] retain behavior graph/state config
- [ ] retain perception/navigation config
- [ ] retain dialogue/voice profile
- [ ] retain memory/personality
- [ ] retain validated capabilities
- [ ] open/send NPC to WonderPlay/main 3D
- [ ] do not turn NPC-AI-SIM back into a general scene/movie/photogrammetry editor

---

# Working rules

- work in small verified batches
- run `npm run build` after every meaningful cleanup batch
- keep deployment health check passing
- do not delete a file merely because it looks old; confirm active import/export consumers first
- remove fake or simulated success behavior rather than presenting it as production functionality
- do not maintain two competing behavior graph models
- do not maintain multiple competing runtime architecture documents
- do not add native UI frameworks without a concrete native-tool requirement
- preserve working features while replacing stale architecture
- label planned functionality as planned until it is actually wired and tested
