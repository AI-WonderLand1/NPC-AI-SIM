# NPC-AI-SIM Durable Memory Service

This service is the private durable-memory adapter for NPC-AI-SIM.

```text
NPC browser/editor
      ↓
Node NPC server
      ↓ private HTTP + bearer token
FastAPI memory service
      ├─ Mem0 → MongoDB memory/vector store
      └─ PyMongo → structured NPC relationships
```

## Why it is separate

The browser must never receive `MONGODB_URI`, the memory-service bearer token, or memory-provider credentials. Working memory also remains inside the NPC runtime and is not written to MongoDB on every perception frame or intermediate reasoning step.

The first adapter intentionally follows the documented Mem0 + MongoDB Python integration instead of forcing an unrelated JavaScript memory implementation into the Node process.

## Current HTTP contract

- `GET /health`
- `POST /v1/memory/remember`
- `POST /v1/memory/recall`
- `DELETE /v1/memory/{npc_id}/{memory_id}`
- `GET /v1/relationships/{npc_id}/{subject_id}`
- `PUT /v1/relationships/{npc_id}/{subject_id}`

When `MEMORY_SERVICE_TOKEN` is configured, every route requires `Authorization: Bearer <token>`.

## Local setup

Requires Python 3.11+.

```bash
python3 -m venv .venv-memory
source .venv-memory/bin/activate
python -m pip install -r memory_service/requirements.txt
cp memory_service/.env.example memory_service/.env
```

Fill the server-side values in `memory_service/.env`, then run:

```bash
uvicorn memory_service.app:app --host 127.0.0.1 --port 8788
```

In the Node server environment:

```bash
MEM0_SERVICE_URL=http://127.0.0.1:8788
MEM0_SERVICE_TOKEN=<same-private-token>
```

The Node server exposes only sanitized provider health to the browser. Raw memory-service URLs, tokens, MongoDB URIs, and provider error details must remain server-side.

## Durable-memory behavior

`remember` returns an array because Mem0 may extract several durable facts from one conversation/event. NPC-AI-SIM keeps working memory separate and only promotes information that passes the configured memory policy.

Relationship state is stored as structured authoritative data in MongoDB rather than being inferred exclusively from semantic memories.

## Not production-complete yet

- the sidecar is not automatically deployed by the current UpCloud workflow
- production MongoDB/OpenAI/service-token secrets still need to be configured
- authenticated user/project-scoped memory APIs are not exposed to the browser yet
- the runtime still needs to call remember/recall during actual NPC cognition cycles
- provider abstraction beyond the initial documented OpenAI-backed Mem0 configuration is still future work
