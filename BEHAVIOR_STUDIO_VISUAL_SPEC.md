# AI Wonderland NPC Behavior Studio — Visual Source of Truth

This file defines the exact editor composition to preserve while NPC runtime behavior continues to follow `NPC_SYSTEM_SPEC.md`.

## Non-negotiable reference layout

The latest user-provided AI Wonderland NPC Behavior Studio screenshot is the master visual target.

Desktop composition:

- Global AI Wonderland product navbar across the full top edge.
  - AI Wonderland brand at left.
  - WonderBuild, WonderSpace, AI Playground, 3D Studio, NPC-AI-SIM, Marketplace.
  - NPC-AI-SIM highlighted.
  - Search, notifications and user/account cluster at right.
- NPC tool sidebar on the left.
  - NPC-AI-SIM title.
  - Library, Create New, Editor, Animations, Voice & Dialogue, Behavior Graph, Training & Skills, Test & Export.
  - My NPCs character cards with portrait thumbnails.
  - New NPC button at bottom.
- Center workspace.
  - Compact project/tool row.
  - Tabs: Viewport, Animation, Dialogue, Behavior, Audio.
  - Large cinematic character viewport as the visual focus.
  - Bottom-center split into Details/Properties/AI Settings on the left and Asset Browser on the right.
- Right workspace.
  - Behavior Graph fills the upper section.
  - Console / AI Assistant / Tasks fills only the lower-right section.
- The bottom console must NOT span beneath the center viewport.

## Visual quality rules

- The viewport is the hero surface. No dashboard-style hero card inside it.
- No large software-preview marketing card, no giant character name, no feature cards inside the viewport.
- When WebGL is unavailable, fallback must still preserve the exact viewport composition and use a cinematic still/neutral preview treatment rather than a cartoon avatar or dashboard.
- Do not use DiceBear/cartoon avatars in the primary editor presentation.
- Keep dense professional game-engine proportions.
- Use subtle dark navy/charcoal panels with crisp borders and controlled blue/violet accents.
- Avoid excessive neon glows, oversized rounded cards, or SaaS dashboard spacing.
- Behavior nodes should look like compact engine graph nodes, not generic cards.
- Inspector controls should be compact and data-dense.
- Asset Browser should show grid thumbnails similar to a game engine content browser.

## Product boundary

NPC-AI-SIM owns NPC creation, behavior, training, validation, voice/dialogue, animation and export.

The one Training Lab is system-owned and read-only. It is not a user scene editor.

User-owned scenes, environments, asset creation and movie/3D production remain in WonderPlay/main 3D.

## Runtime source of truth

`NPC_SYSTEM_SPEC.md` remains authoritative for runtime architecture. This file governs visual composition only.
