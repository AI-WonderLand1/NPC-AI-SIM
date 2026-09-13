# NPC-AI-SIM

NPC-AI-SIM is the AI Wonderland NPC cognition authoring application. Its job is to define and test NPC brains: personality, perception, memory, decisions, actions, voice configuration, and the contract used by an authoritative runtime.

It is not the general DreamMakerHub world editor and it is not the AI-PLAYGROUND workflow builder.

## Repository role

NPC-AI-SIM owns:

- NPC brain/cognition authoring
- personality and behavioral configuration
- perception inputs
- advisory AI reasoning
- memory integration
- action/capability configuration
- voice-related NPC configuration
- reusable/prebuilt NPC brain presets inside the editor
- versioned web-to-runtime NPC contracts

The current application opens directly into the editor. Old standalone library and docs routes redirect back to the builder/editor instead of maintaining duplicate product surfaces.

## Runtime model

AI model output is advisory. The model may recommend an event, command, animation, or mode change, but the authoritative game/runtime layer must validate and execute allowed actions.

```text
NPC editor / runtime context
        ↓
NPC-AI-SIM API
        ↓
AI perception/reasoning
        ↓
advisory structured result
        ↓
authoritative runtime validates
        ↓
action/state change is executed or rejected
```

This separation is deliberate. An AI response does not prove that an action was executed.

## Current API

| Route | Purpose |
|---|---|
| `POST /api/gemini/npc-intelligence` | advisory NPC reasoning/decision metadata |
| `POST /api/gemini/npc-vision` | advisory image/perception analysis |
| `POST /api/gemini/npc-video` | advisory video/perception analysis |
| `GET /api/health` | application health plus memory subsystem status |
| `GET /api/memory/health` | memory-provider health status |

The AI endpoints include payload validation and in-process rate limiting. Provider configuration is server-first. Raw request provider keys are disabled unless an operator explicitly enables that fallback.

## Memory architecture

The TypeScript NPC runtime can connect to the optional memory sidecar:

```text
NPC-AI-SIM
    ↓
server memory provider
    ↓
private memory service
    ↓
Mem0 / MongoDB-backed durable memory
```

See:

- [`src/brain/memory/serverMemoryProvider.ts`](src/brain/memory/serverMemoryProvider.ts)
- [`memory_service/app.py`](memory_service/app.py)
- [`.env.example`](.env.example)

The normal NPC deployment workflow validates the memory-service Python syntax, but it does **not** automatically deploy the memory sidecar. A production deployment that needs durable memory must run and secure that service separately.

## What is intentionally not active

The following older surfaces are intentionally not treated as current production features:

- standalone NPC library page
- simulated contact/subscription endpoints
- the old `/live-npc` WebSocket implementation
- fake/random live NPC telemetry

WebSocket upgrades are currently rejected until a real versioned web-to-runtime bridge is implemented.

## Tech stack

- React 18
- TypeScript
- Vite
- Express 5
- Three.js
- PlayCanvas
- Google GenAI SDK
- Supabase client libraries
- GLTF Transform
- Motion

## Local development

### Recommended runtime

The current CI/deployment workflow verifies the project with Node.js 22.

### Install

```bash
git clone https://github.com/AI-WonderLand1/NPC-AI-SIM.git
cd NPC-AI-SIM
npm install
cp .env.example .env
```

### Frontend-only development

```bash
npm run dev
```

This starts the Vite development frontend.

### Full production-like local path

```bash
npm run build
npm run verify:cognition
npm start
```

The compiled Express server serves the built client and API on port 3000 by default.

## Production deployment

The current production path uses GitHub Actions and UpCloud:

```text
main
  ↓
verify memory-sidecar syntax
  ↓
install + build
  ↓
verify cognition runtime
  ↓
SSH to UpCloud
  ↓
sync repository
  ↓
build again on the VM
  ↓
systemd service on port 3000
  ↓
/api/health verification
```

See [`.github/workflows/deploy-upcloud.yml`](.github/workflows/deploy-upcloud.yml).

## Security status

The server currently provides:

- disabled Express `x-powered-by`
- request-size limits
- MIME allowlists for image/video perception requests
- structured-response parsing
- rate limiting
- server-first provider configuration

Important limitation: the Gemini-backed endpoints are not yet protected by full AI Wonderland user authentication, entitlement checks, and per-user provider quotas. Do not treat a deployment containing paid provider credentials as safe for unrestricted public use until those controls are enforced.

The current in-memory rate limiter also depends on correct reverse-proxy IP handling when deployed behind nginx or another proxy.

## Related repositories

- `dreammakerhub.website` — umbrella platform, projects, WonderBuild, IDE integration, and main world/3D tooling
- `AI-PLAYGROUND` — multi-model AI and visual workflow/orchestration tooling

Cross-repo integrations should use explicit versioned contracts rather than copying NPC cognition logic into the other repositories.

## Current development status

NPC-AI-SIM is under active development. The editor and advisory cognition API are present, while the native runtime bridge, durable-memory deployment path, full auth/entitlements, and broader integration testing still need production hardening.

See [`NPC_EDITOR_TODO.md`](NPC_EDITOR_TODO.md) for the current implementation plan.

## License

Prosperity Public License 3.0.0. See [`LICENSE`](LICENSE) for the full terms.
