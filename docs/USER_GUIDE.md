# NPC-AI-SIM User Guide

NPC-AI-SIM is the AI WONDERLAND NPC brain and cognition editor. This guide explains the visible navigation, what each button does, which outside services can be connected, and what is currently configuration-only.

## Main product navigation

The top product bar links NPC-AI-SIM back into the larger AI WONDERLAND platform.

| Item | What it does |
| --- | --- |
| WonderBuild | Opens the main AI WONDERLAND website builder. |
| WonderSpace | Opens the main AI WONDERLAND code/workspace area. |
| AI Playground | Opens the separate multi-model and workflow app. |
| 3D Studio | Opens the main WonderPlay / 3D Hub. |
| NPC-AI-SIM | Keeps you in the NPC brain editor. |
| Marketplace | Disabled in the current build. |

## NPC editor sidebar

| Item | What it does |
| --- | --- |
| Prebuilt NPC Library | Opens reusable AI Wonderland NPC brain presets. Selecting one starts a new NPC brain from that preset. |
| Library | Redirects into the editor flow; the old standalone library page is retired. |
| Create New | Starts a new NPC brain. |
| Editor | Opens the main configuration area. |
| Editor -> Details | Edit NPC identity, role, self concept, tags, and review brain status. |
| Editor -> AI Brain | Configure model/provider and reasoning settings. |
| Editor -> Memory | Configure working and durable-memory behavior. |
| Editor -> Integrations | Configure runtime target and export/handoff settings. |
| Animations | Review animation bindings for runtime events. |
| Voice & Dialogue | Configure voice provider, voice ID, speed, pitch, subtitles, and voice test. |
| Personality | Configure personality/behavior values. |
| Perception | Configure perception settings and sensor-related behavior. |
| Knowledge | Configure knowledge/RAG targets and retrieval behavior. |
| Actions | Enable or disable runtime capabilities the NPC is allowed to request. |
| Training & Skills | Install supported reusable skill courses and review training requirements. |
| Test & Export | Configure runtime target and export the canonical brain JSON. |

## Cognitive stage controls

The center stage is a brain/cognition visualization, not proof that a game runtime performed an action.

| Button | What it does |
| --- | --- |
| Idle | Resets/stops the local cognition test. |
| Think | Runs the reasoning phase. |
| Perceive | Runs the perception phase. |
| Plan | Runs the decision/planning phase. |
| Act | Runs the action-request phase. |
| Custom | Reserved for a future custom runtime phase and currently disabled. |
| Test Brain | Runs a local cognitive test cycle. |
| Run Brain | Runs the local brain test from Quick Controls. |
| Reset | Clears the local test state. |
| Core settings | Jumps to Editor -> AI Brain. |
| Reset local changes | Resets the local brain configuration changes. |

Local cognition is advisory. The authoritative game/runtime layer must decide whether an action is allowed and actually execute it.

## Details and AI Brain

Details shows identity plus a read-only summary of the currently configured model/provider, validation state, memory layer, and simulation context.

Use AI Brain for the editable provider/model and reasoning settings. A model appearing in the configuration does not guarantee that the provider is available; the provider must be configured through AI WONDERLAND's provider/account system.

## Memory

NPC-AI-SIM has working-memory configuration and an optional durable-memory service path.

- Working memory can be used locally by the cognition editor/test runtime.
- Durable memory requires the private memory sidecar.
- The sidecar can use Mem0 and MongoDB.
- The browser must never receive the memory-service token or MongoDB credentials.

## Perception

Perception controls the NPC's configured sensing rules such as sight radius and field of view. The local test can simulate perception events, but a real game/runtime bridge is required for authoritative live world data.

## Knowledge / RAG

The Knowledge area separates world knowledge from autobiographical memory.

Current status:

- knowledge-source counts/configuration are visible
- Add Source is disabled until a real ingestion backend is connected
- the intended durable retrieval target is Mem0 + MongoDB
- the current adapter is not connected
- grounding rules should expose uncertainty instead of inventing world facts

## Voice & Dialogue

| Control | What it does |
| --- | --- |
| Provider | Select Browser TTS, ElevenLabs, OpenAI, or Custom. |
| Voice ID | Stores the provider-specific voice identifier. |
| Speed | Changes configured speaking speed. |
| Pitch | Changes configured pitch. |
| Interruptible | Controls whether dialogue may be interrupted. |
| Subtitles | Toggles subtitle configuration. |
| Test Voice | Performs a voice test. Browser TTS works locally when supported by the browser. Other providers require a configured server-side provider before they can be tested here. |

## Actions

Actions define what the NPC may request from the authoritative runtime. Clicking an action tile toggles whether that capability is enabled.

Examples include movement, follow/patrol, speaking/greeting, object interaction, doors, sitting, defense, attack, and flee when those capabilities exist in the brain configuration.

An enabled action is permission/configuration. It is not proof that a game engine executed the action.

## Animations

Animations are presentation bindings for runtime state/actions. They do not grant permissions or teach skills.

Current animation bindings expect a linked GLB/GLTF character/runtime host. The current editor shows bindings and runtime events, but character-host animation playback remains dependent on the external runtime.

## Training & Skills

Training installs reusable capability packages and defines validation requirements.

| Button / state | Meaning |
| --- | --- |
| Install Skill Course | Adds the supported capability hooks for that course to the NPC brain config. |
| Skill Installed | The package is in the config; runtime validation may still be pending. |
| Future Adaptive Training | Disabled because the adaptive runner is not implemented yet. |

The System Training Lab is system-owned, locked, non-exportable, and intended for deterministic validation.

## Test & Export / Integrations

| Control | What it does |
| --- | --- |
| Runtime Target | Selects Generic, Godot, Unreal, Unity, or Custom as the intended runtime adapter target. |
| Export Brain JSON | Downloads the validated versioned NPC brain configuration. |
| AI Playground handoff | Enables/disables handoff configuration and opens AI Playground. The navigation works, but NPC data handoff is separate until the cross-product protocol is implemented. |
| Runtime Events | Configures whether runtime lifecycle events should be emitted once a real bridge exists. |

Runtime targets are configuration choices. The current repository does not claim that a live Godot, Unreal, Unity, or custom bridge is connected.

## Outside services

| Service | Purpose | Current rule |
| --- | --- | --- |
| dreammakerhub.website | Central AI WONDERLAND account, provider catalog, billing/usage authority. | Real provider calls use the signed-in AI WONDERLAND account contract. |
| Gemini / Google AI | Existing server-side NPC intelligence, vision, and video provider path. | Requires server-side GEMINI_API_KEY. |
| Mem0 | Optional semantic/durable memory layer. | Runs through the private memory service. |
| MongoDB | Optional durable memory storage target. | Credentials stay in the memory service environment. |
| AI Playground | Advanced agents, workflows, triggers, APIs, and orchestration. | Navigation works; automatic NPC data handoff is not yet implemented. |
| Browser TTS | Local browser voice testing. | Works when the browser supports speech synthesis. |
| ElevenLabs | Optional voice provider selection. | Needs a configured server-side provider before real testing. |
| OpenAI | Optional voice/model provider selection. | Needs configured account/server provider access. |
| Godot | Runtime target configuration. | Bridge not connected by this editor alone. |
| Unreal | Runtime target configuration. | Bridge not connected by this editor alone. |
| Unity | Runtime target configuration. | Bridge not connected by this editor alone. |
| Custom runtime | Runtime target configuration. | Requires a separate adapter/bridge. |

## Persistence

Current NPC brain drafts are seeded and persisted in browser localStorage for the editor flow. That local persistence is not a substitute for a production account-backed runtime database.

## What this repository can do

- create and configure NPC brain records
- edit identity, role, self concept, tags, personality, memory, perception, and knowledge configuration
- configure model/provider choices
- locally simulate cognition phases
- enable/disable action capabilities
- configure animation bindings
- install supported skill-course capability hooks
- configure voice behavior and test Browser TTS
- choose a target runtime adapter type
- export validated brain JSON

## What this repository does not yet prove

- that a game engine executed an NPC action
- that a live character/animation host is connected
- that Knowledge Add Source has a working ingestion backend
- that adaptive training is implemented
- that external voice providers are connected merely because they appear in the dropdown
- that AI Playground automatically received NPC brain data

Those states must be reported separately so the UI does not confuse configuration with a completed external action.