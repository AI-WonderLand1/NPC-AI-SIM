# NPC-AI-SIM Private Workspace Architecture

This document is a product/source-of-truth rule for NPC-AI-SIM and its integration with AI Wonderland.

## Non-negotiable user experience

Users stay inside AI Wonderland / DreamMakerHub. They do not leave the site to use NPC-AI-SIM, training, behavior editing, 3D preview, asset browsing, export, or team collaboration.

The platform must not require end users to sign into or use the founder/owner's personal cloud, Epic, GitHub, or other provider account.

## Workspace isolation

Default workspace model:

- one private runtime workspace/pod per user
- the pod is isolated from other users by namespace/workspace identity, storage boundary, runtime credentials, network policy, and authorization
- user projects/assets/configuration are mounted only into that user's workspace
- temporary Training Lab state is isolated per workspace and resettable
- no cross-user browsing or accidental shared filesystem
- no shared global writable project directory

## Team workspaces

Teams are the only intentional sharing boundary.

- a team workspace/pod is scoped to an explicit team/project
- access is controlled by membership and project roles
- team members may share NPCs, behavior graphs, training results, assets and project state only inside that team boundary
- personal workspaces remain private from the team unless the user explicitly moves/copies content into the team project

## Authentication and accounts

- users authenticate to AI Wonderland
- AI Wonderland session identity maps to the workspace identity
- infrastructure provisioning uses platform-managed service identities, not the founder's personal account credentials
- users are never asked to log into the founder's Epic, GitHub, cloud, Supabase, OpenRouter, or other personal account
- provider integrations use either platform-managed credentials or encrypted BYOK/BYOC credentials owned by the user/team
- raw provider keys are never exposed to the browser after storage

## Runtime architecture

Target flow:

1. User signs into AI Wonderland.
2. User opens NPC-AI-SIM without leaving the site.
3. Backend resolves user/team workspace identity.
4. Scheduler starts or resumes an isolated workspace/pod.
5. Project storage is attached only to that workspace.
6. NPC editor, behavior runtime, training sandbox, preview and export operate through authenticated platform APIs/websockets.
7. Workspace may suspend when idle and resume later with persisted project state.

The browser UI should remain under AI Wonderland domains/subdomains and use the same auth/session experience.

## Unreal-style architecture rule

NPC-AI-SIM may reproduce professional game-engine concepts and workflows such as behavior trees/state machines, perception, navigation, smart-object-style interactions, animation graphs, training/validation levels and editor panels.

Do not copy Unreal Engine source code into NPC-AI-SIM merely to imitate those systems. Unreal Engine code is governed by Epic's EULA and copying it can cause the resulting product/code to become subject to that license. Prefer independent implementations using our React/TypeScript/Three.js/PlayCanvas/runtime stack and compatible open-source libraries.

If Unreal itself is ever used as a backend renderer/training worker, keep it as a separately licensed backend component with legal/licensing review. Do not expose Unreal Editor/Engine Tools to end users through NPC-AI-SIM unless the applicable Epic license expressly permits that distribution model.

## Product boundary

NPC-AI-SIM owns NPC creation, behavior, training, validation, animation, voice/dialogue, memory, perception and export.

The system-owned Training Lab is private and read-only from the user's perspective.

WonderPlay/main 3D owns user-created scenes, environments, movie/cinematic work and general world building.
