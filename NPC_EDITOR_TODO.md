# NPC-AI-SIM Editor UI TODO

Reference target: Unreal-style NPC AI editor shown in the design screenshot.

## Rule
Work through this list **one task at a time**. Do not jump ahead. After each task is completed, mark it done here before starting the next one.

## Progress

- [x] **Task 1 — Make /builder a true full-screen editor route**
  - Hide the WonderPlay website navbar on `/builder`
  - Remove website top padding from `/builder`
  - Give the builder the full browser height
  - Completed in commit: `25847f1981fb6e4a7f054b2dea9b1a8bb9ff729b`

- [ ] **Task 2 — Replace the current BuilderPage shell with the target editor layout**
  - Create a top application menu bar
  - Create a second toolbar row for transform/play/layout controls
  - Create left dock area
  - Create center viewport area
  - Create right AI behavior graph area
  - Create bottom debug console area
  - Use CSS Grid/flex so the editor fills the entire viewport
  - Do not change graphics yet

- [ ] **Task 3 — Build the left Asset Browser + Hierarchy**
  - Asset Browser header/search
  - Character / Animation / Behavior / Environment folders
  - Scene hierarchy tree
  - Resizable/docked panel behavior where practical

- [ ] **Task 4 — Build the Details / Inspector panel**
  - Transform controls
  - Mesh/material sections
  - Character/NPC properties
  - Selection-driven content

- [ ] **Task 5 — Build the top editor menu + toolbars**
  - File / Edit / View / Build / AI / AI Tools / Layout / Help
  - Select / move / rotate / scale
  - Play / pause / stop
  - Layout and viewport controls

- [ ] **Task 6 — Build the AI Behavior Graph Editor**
  - Node canvas
  - Behavior nodes
  - Connection lines
  - Select/move nodes
  - Start/perception/dialogue/animation/expression-style nodes
  - Hook graph state into NPC behavior data

- [ ] **Task 7 — Build the bottom Debug Console**
  - Runtime logs
  - AI decision logs
  - WebSocket/network status
  - Clear/filter controls
  - Collapsible drawer

- [ ] **Task 8 — Remove placeholder primitive NPC rendering**
  - Remove capsule/sphere test character as the primary NPC renderer
  - Keep fallback primitive only for missing/broken assets

- [ ] **Task 9 — Add real GLB/GLTF character loading**
  - GLTFLoader
  - Rigged character support
  - AnimationMixer
  - Asset selection/loading
  - Error/fallback handling

- [ ] **Task 10 — Upgrade viewport rendering quality**
  - Correct color space
  - ACES tone mapping
  - PBR materials
  - Environment lighting / HDRI
  - Better shadows
  - Camera framing
  - Post-processing where performance allows

- [ ] **Task 11 — Add a proper environment/scene**
  - Replace the plain ground-only scene
  - Load environment assets
  - Add lights, props, floor/walls
  - Match the cinematic sci-fi look of the reference

- [ ] **Task 12 — Add production character presentation**
  - Hair/material quality
  - Clothing/armor PBR
  - Facial blendshapes if supported
  - Idle animation
  - Facial expression hooks
  - Lip-sync hooks where available

- [ ] **Task 13 — Wire editor panels to actual NPC runtime data**
  - Hierarchy selection updates Inspector
  - Inspector changes update scene object
  - Behavior Graph updates NPC behavior config
  - Console reports actual runtime events
  - Save/load project state

- [ ] **Task 14 — Final visual polish against the reference**
  - Panel sizing
  - Typography
  - Borders/dividers
  - Spacing
  - Icons
  - Dark editor theme
  - Responsive resizing
  - Remove remaining placeholder UI
  - Compare final layout against the reference image

## Current task
**Task 2 — Replace the current BuilderPage shell with the target editor layout.**
