# NPC-AI-SIM Editor UI TODO

## Master reference
The posted **SPATIAL COMPOSER: V4.1 — HYBRID PROJECT: AQUATIC ADVENTURE** screenshot is now the master visual target.

The goal is not merely an Unreal-style layout. The browser editor should match the posted reference as closely as practical while remaining NPC-AI-SIM's own React/TypeScript/Three.js implementation.

## Rule
Work in small batches and verify the build after each batch. Do not replace working NPC runtime/Three.js functionality just to imitate the screenshot.

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
- [x] **Task 11 — Proper 3D environment / scene**

## New master-reference pass

- [x] **Task 12 — Replace the shell with the posted Spatial Composer layout**
  - Top title/menu bar matching the reference proportions
  - Second transform/tool shelf
  - Narrow left vertical tool dock
  - Large center 3D viewport
  - Right Outliner stacked above Properties
  - Bottom asset browser + animation timeline area
  - Bottom status bar
  - Keep AI Graph and Console available as bottom tabs instead of permanently taking the right/bottom layout space
  - New shell: `src/components/builder/ReferenceEditorShell.tsx`
  - Commits: `20c8048be2ae2d9c37b5a3e43bc741ebf7ea6733`, `98ffbcdcaea9a670079f388ee91c70a6d44bd5a9`

- [ ] **Task 13 — Pixel-match the editor chrome against the reference**
  - Match panel widths/heights from the screenshot
  - Match dark gray color hierarchy
  - Match borders/dividers and toolbar density
  - Match menu spacing, title block, Outliner rows, Properties tabs and controls
  - Match asset tile sizing, timeline density and status bar
  - Replace generic/placeholder icon treatments where needed
  - Ensure resizing still works without breaking the reference proportions

- [ ] **Task 14 — Match viewport presentation and finish runtime wiring**
  - Production-quality character presentation
  - Better hair/clothing/material PBR where source assets support it
  - Facial blendshapes/expression hooks where supported
  - Idle animation and lip-sync hooks
  - Scene props/accessories closer to the aquatic sci-fi reference
  - Visible transform/camera gizmo treatment
  - Outliner selection updates actual viewport selection
  - Properties update actual selected scene object where supported
  - AI Graph updates NPC behavior configuration
  - Console reports actual runtime events
  - Save/load project state
  - Final screenshot-by-screenshot visual comparison

## Current task
**Task 13 — Pixel-match the editor chrome against the posted Spatial Composer reference.**

## Next batch
**Task 13 only, then build/test before moving into Task 14.**
