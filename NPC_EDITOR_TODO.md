# NPC-AI-SIM Editor + Brain TODO

## Source of truth

Do not replace the existing NPC systems just to change the editor architecture.

Keep the current React/Vite/TypeScript application, Three.js/PlayCanvas rendering, dialogue, voice, animation, safety, events, and existing NPC runtime integration.

`NPC_SYSTEM_SPEC.md` remains the authoritative runtime architecture document.

`BEHAVIOR_STUDIO_VISUAL_SPEC.md` remains the authoritative visual/layout document.

This file is the active implementation plan.

---

## Current architecture decision

### Keep

- React 18
- TypeScript
- Vite
- Three.js
- PlayCanvas
- Express + WebSocket backend
- existing dialogue system
- existing voice/TTS system
- existing subtitle system
- existing animation synchronization
- existing NPC events
- existing AI safety validation
- existing 3D viewport/editor shell

### Upgrade

Replace the hand-built graph interaction/rendering logic inside:

`src/components/builder/RightPanel/BehaviorGraphEditor.tsx`

with `@xyflow/react` while preserving the current custom sci-fi visual design.

Preserve and adapt the existing graph concepts:

- `BehaviorNode`
- `NodePin`
- `GraphConnection`

Do not introduce QtNodes into the browser editor.

### Add

Create a native NPC brain runtime under a separate directory such as:

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
        ├── PerceptionNode.cpp
        ├── DialogueNode.cpp
        ├── AnimationNode.cpp
        ├── MemoryNode.cpp
        ├── DecisionNode.cpp
        ├── MoveToNode.cpp
        └── ConditionNode.cpp
```

Use:

- C++20
- BehaviorTree.CPP
- blackboard/state data
- JSON brain schema
- WebSocket or authenticated API bridge between the web editor and native runtime

Qt 6 + QtNodes may be considered later only for a separate native debugger/editor. It is not part of the current web editor replacement.

---

## Documentation cleanup

Goal: reduce duplicated and stale Markdown files while keeping clear sources of truth.

### Keep

- [ ] `README.md`
  - keep as the public project overview
  - update architecture after the native brain runtime exists
  - remove stale provider/model claims and examples that no longer match production

- [ ] `NPC_SYSTEM_SPEC.md`
  - keep as the single runtime/architecture source of truth
  - rewrite the current voice-heavy document into a full NPC architecture spec
  - merge Training Lab architecture into this document
  - merge private workspace/isolation architecture into this document
  - add BehaviorTree.CPP/native runtime architecture

- [ ] `BEHAVIOR_STUDIO_VISUAL_SPEC.md`
  - keep as the single visual source of truth
  - merge relevant acceptance criteria from `AAA_QUALITY_STANDARD.md`
  - add graph/font guidance for the updated behavior editor

- [x] `NPC_EDITOR_TODO.md`
  - keep as the active implementation checklist

### Merge, then remove

- [ ] `AAA_QUALITY_STANDARD.md`
  - merge useful measurable visual/runtime acceptance criteria into `BEHAVIOR_STUDIO_VISUAL_SPEC.md`
  - remove afterward to avoid two competing visual-quality documents

- [ ] `NPC_TRAINING_SPEC.md`
  - merge Training Lab rules, course definitions, validation lifecycle, and handoff rules into `NPC_SYSTEM_SPEC.md`
  - remove afterward because it currently only extends the runtime source of truth

- [ ] `PRIVATE_WORKSPACE_ARCHITECTURE.md`
  - merge workspace isolation, team workspace, auth, BYOK/BYOC, and licensing boundaries into `NPC_SYSTEM_SPEC.md`
  - remove afterward so architecture rules are not split across multiple source-of-truth files

### Remove

- [ ] `IMPLEMENTATION_SUMMARY.md`
  - stale historical implementation summary
  - references a WonderPlay landing page and `LandingPage.tsx` that are not part of the current repo structure
  - not a source of truth
  - safe candidate for deletion after final review

### Target Markdown set

After consolidation, the repo should ideally contain only:

```text
README.md
NPC_SYSTEM_SPEC.md
BEHAVIOR_STUDIO_VISUAL_SPEC.md
NPC_EDITOR_TODO.md
```

plus any legally or community-required files that may be added later, such as `SECURITY.md` or `CONTRIBUTING.md`.

---

## Completed editor foundation

- [x] Full-screen `/builder` editor route
- [x] Multi-panel editor layout
- [x] Asset browser + hierarchy
- [x] Details / inspector controls
- [x] Editor menus + transform/play toolbar
- [x] Initial AI Behavior Graph editor
- [x] Debug console
- [x] GLB/GLTF character loading
- [x] Viewport rendering quality pass
- [x] 3D environment/scene foundation
- [x] Engine-style editor shell
- [x] White-screen/WebGL fallback
- [x] First visual polish pass

---

## Phase 1 — Documentation cleanup

- [ ] merge `AAA_QUALITY_STANDARD.md` into `BEHAVIOR_STUDIO_VISUAL_SPEC.md`
- [ ] merge `NPC_TRAINING_SPEC.md` into `NPC_SYSTEM_SPEC.md`
- [ ] merge `PRIVATE_WORKSPACE_ARCHITECTURE.md` into `NPC_SYSTEM_SPEC.md`
- [ ] delete `IMPLEMENTATION_SUMMARY.md`
- [ ] delete merged source documents only after their unique requirements are preserved
- [ ] refresh `README.md`
- [ ] verify no source-of-truth rule was lost during consolidation

---

## Phase 2 — Behavior graph upgrade

- [ ] add `@xyflow/react`
- [ ] replace manual node dragging with XYFlow node handling
- [ ] replace manual Bezier connection rendering with XYFlow edges
- [ ] preserve current node styling and sci-fi graph appearance
- [ ] preserve active-flow visualization
- [ ] preserve node selection and inspector integration
- [ ] preserve AI template/add-node workflow
- [ ] adapt current `BehaviorNode`, `NodePin`, and `GraphConnection` types rather than creating a second graph model
- [ ] add save/load graph serialization
- [ ] verify graph state modifies actual NPC behavior configuration

---

## Phase 3 — Native NPC brain runtime

- [ ] add `native/` C++20 project
- [ ] integrate BehaviorTree.CPP
- [ ] implement authoritative `BrainRuntime`
- [ ] implement blackboard/world-state model
- [ ] implement perception nodes
- [ ] implement memory nodes
- [ ] implement decision/control nodes
- [ ] implement movement/action nodes
- [ ] implement dialogue trigger nodes
- [ ] implement animation trigger nodes
- [ ] create stable JSON brain schema
- [ ] map web graph node types to runtime BehaviorTree nodes
- [ ] keep LLM output advisory and keep runtime state authoritative

---

## Phase 4 — Web ↔ brain bridge

- [ ] define versioned JSON protocol
- [ ] send graph configuration from editor to runtime
- [ ] stream node execution state back to the editor
- [ ] stream blackboard values back to the editor
- [ ] stream runtime errors/diagnostics to Debug Console
- [ ] display `IDLE`, `RUNNING`, `SUCCESS`, `FAILURE`, and `ERROR` states on graph nodes
- [ ] reconnect safely after WebSocket/runtime restart
- [ ] reject incompatible schema versions cleanly

---

## Phase 5 — Visual target

- [ ] match AI Wonderland NPC Behavior Studio panel proportions
- [ ] improve behavior-node visual hierarchy
- [ ] use dense engine-style inspector controls
- [ ] use Share Tech Mono for technical/node labels where appropriate
- [ ] use Roboto Mono or JetBrains Mono for values, blackboard data, IDs, and console text
- [ ] preserve a normal readable sans-serif for general navigation and controls
- [ ] keep viewport as the hero surface
- [ ] avoid generic SaaS cards and excessive glow
- [ ] keep active runtime flow immediately readable

---

## Phase 6 — Training Lab

- [ ] implement one system-owned temporary training sandbox
- [ ] fixed read-only fixtures
- [ ] reset sandbox between validation runs
- [ ] movement course
- [ ] navigation course
- [ ] perception course
- [ ] communication course
- [ ] interaction course
- [ ] social capability tests
- [ ] memory/reasoning hooks
- [ ] real pass/fail diagnostics based on runtime events

---

## Phase 7 — Main 3D handoff

- [ ] save/export NPC brain configuration
- [ ] retain model/rig references
- [ ] retain animation configuration
- [ ] retain behavior graph/state configuration
- [ ] retain perception/navigation configuration
- [ ] retain dialogue/voice profile
- [ ] retain memory/personality configuration
- [ ] retain validated capabilities
- [ ] open/send NPC to WonderPlay/main 3D without making NPC-AI-SIM a general scene editor

---

## Working rules

- work in small verified batches
- run the build after each meaningful batch
- do not replace working NPC systems merely to imitate a screenshot
- do not maintain two competing behavior graph data models
- do not maintain two competing runtime architecture documents
- do not add a native UI framework unless there is a concrete native-tool requirement
- no fake runtime success states, fake audio, or decorative graph execution
