from __future__ import annotations

import os
import secrets
from datetime import datetime, timezone
from threading import RLock
from typing import Any, Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Response, status
from mem0 import Memory
from pydantic import BaseModel, Field
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

load_dotenv()

MemoryKind = Literal["episodic", "semantic", "relationship"]


class RecallRequest(BaseModel):
    npcId: str = Field(min_length=1, max_length=256)
    text: str | None = Field(default=None, max_length=12000)
    kinds: list[Literal["working", "episodic", "semantic", "relationship"]] | None = None
    relatedEntityIds: list[str] | None = None
    tags: list[str] | None = None
    limit: int = Field(default=6, ge=1, le=100)
    minimumImportance: float | None = Field(default=None, ge=0, le=1)
    minimumConfidence: float | None = Field(default=None, ge=0, le=1)


class RememberRequest(BaseModel):
    npcId: str = Field(min_length=1, max_length=256)
    kind: MemoryKind
    content: str = Field(min_length=1, max_length=50000)
    summary: str | None = Field(default=None, max_length=12000)
    importance: float = Field(ge=0, le=1)
    emotionalWeight: float = Field(ge=-1, le=1)
    confidence: float = Field(ge=0, le=1)
    tags: list[str] = Field(default_factory=list)
    relatedEntityIds: list[str] = Field(default_factory=list)
    sourceIds: list[str] = Field(default_factory=list)


class RelationshipStateModel(BaseModel):
    subjectId: str = Field(min_length=1, max_length=256)
    displayName: str | None = Field(default=None, max_length=512)
    trust: float = Field(ge=0, le=1)
    familiarity: float = Field(ge=0, le=1)
    respect: float = Field(ge=0, le=1)
    attachment: float = Field(ge=0, le=1)
    suspicion: float = Field(ge=0, le=1)
    conflict: float = Field(ge=0, le=1)
    interactionCount: int = Field(ge=0)
    tags: list[str] = Field(default_factory=list)
    lastInteractionAt: str | None = None


_MEMORY: Memory | None = None
_MEMORY_LOCK = RLock()
_MONGO_CLIENT: MongoClient | None = None
_RELATIONSHIPS: Collection | None = None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def require_service_token(authorization: str | None = Header(default=None)) -> None:
    expected = os.getenv("MEMORY_SERVICE_TOKEN", "").strip()
    if not expected:
        return

    prefix = "Bearer "
    if not authorization or not authorization.startswith(prefix):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing memory service bearer token")

    supplied = authorization[len(prefix):]
    if not secrets.compare_digest(supplied, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid memory service bearer token")


app = FastAPI(
    title="NPC-AI-SIM Memory Service",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
    dependencies=[Depends(require_service_token)],
)


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is not configured")
    return value


def get_mongo_client() -> MongoClient:
    global _MONGO_CLIENT
    if _MONGO_CLIENT is None:
        uri = required_env("MONGODB_URI")
        timeout_ms = int(os.getenv("MONGODB_TIMEOUT_MS", "5000"))
        _MONGO_CLIENT = MongoClient(uri, serverSelectionTimeoutMS=timeout_ms)
    return _MONGO_CLIENT


def get_relationship_collection() -> Collection:
    global _RELATIONSHIPS
    if _RELATIONSHIPS is None:
        client = get_mongo_client()
        db_name = os.getenv("MEM0_DB_NAME", "npc_ai_sim")
        collection_name = os.getenv("NPC_RELATIONSHIP_COLLECTION", "npc_relationships")
        _RELATIONSHIPS = client[db_name][collection_name]
        _RELATIONSHIPS.create_index(
            [("npcId", ASCENDING), ("subjectId", ASCENDING)],
            unique=True,
            name="npc_relationship_unique",
        )
    return _RELATIONSHIPS


def get_memory() -> Memory:
    global _MEMORY
    if _MEMORY is not None:
        return _MEMORY

    with _MEMORY_LOCK:
        if _MEMORY is not None:
            return _MEMORY

        mongo_uri = required_env("MONGODB_URI")
        required_env("OPENAI_API_KEY")

        db_name = os.getenv("MEM0_DB_NAME", "npc_ai_sim")
        collection_name = os.getenv("MEM0_COLLECTION_NAME", "npc_memories")
        embedding_dims = int(os.getenv("MEM0_EMBEDDING_DIMS", "1536"))
        history_path = os.getenv("MEM0_HISTORY_DB_PATH", "./memory_service/data/mem0-history.db")
        llm_model = os.getenv("MEM0_LLM_MODEL", "gpt-4o-mini")
        embedding_model = os.getenv("MEM0_EMBEDDING_MODEL", "text-embedding-3-small")

        history_dir = os.path.dirname(history_path)
        if history_dir:
            os.makedirs(history_dir, exist_ok=True)

        config = {
            "llm": {
                "provider": "openai",
                "config": {
                    "model": llm_model,
                    "temperature": 0.1,
                    "max_tokens": 2000,
                },
            },
            "embedder": {
                "provider": "openai",
                "config": {
                    "model": embedding_model,
                    "embedding_dims": embedding_dims,
                },
            },
            "vector_store": {
                "provider": "mongodb",
                "config": {
                    "mongo_uri": mongo_uri,
                    "db_name": db_name,
                    "collection_name": collection_name,
                    "embedding_model_dims": embedding_dims,
                },
            },
            "history_db_path": history_path,
        }

        _MEMORY = Memory.from_config(config)
        return _MEMORY


def metadata_for(input_data: RememberRequest) -> dict[str, Any]:
    return {
        "npcId": input_data.npcId,
        "kind": input_data.kind,
        "summary": input_data.summary,
        "importance": input_data.importance,
        "emotionalWeight": input_data.emotionalWeight,
        "confidence": input_data.confidence,
        "tags": input_data.tags,
        "relatedEntityIds": input_data.relatedEntityIds,
        "sourceIds": input_data.sourceIds,
    }


def memory_record_to_domain(record: dict[str, Any], npc_id: str, fallback_metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    metadata = record.get("metadata") or fallback_metadata or {}
    kind = metadata.get("kind", "semantic")
    if kind not in {"episodic", "semantic", "relationship"}:
        kind = "semantic"

    source_ids = metadata.get("sourceIds") or []
    sources = [{"type": "event", "id": source_id} for source_id in source_ids]

    created_at = record.get("created_at") or record.get("createdAt") or utc_now()
    last_accessed_at = record.get("updated_at") or record.get("updatedAt")

    return {
        "id": str(record.get("id") or record.get("memory_id") or ""),
        "npcId": npc_id,
        "kind": kind,
        "content": record.get("memory") or record.get("content") or "",
        "summary": metadata.get("summary"),
        "importance": float(metadata.get("importance", 0.5)),
        "emotionalWeight": float(metadata.get("emotionalWeight", 0.0)),
        "confidence": float(metadata.get("confidence", 0.5)),
        "tags": metadata.get("tags") or [],
        "relatedEntityIds": metadata.get("relatedEntityIds") or [],
        "sources": sources,
        "createdAt": str(created_at),
        "lastAccessedAt": str(last_accessed_at) if last_accessed_at else None,
        "expiresAt": str(record.get("expiration_date")) if record.get("expiration_date") else None,
        "storeRef": str(record.get("id") or record.get("memory_id") or ""),
    }


def passes_local_filters(memory: dict[str, Any], query: RecallRequest) -> bool:
    if query.kinds and memory["kind"] not in query.kinds:
        return False

    if query.tags:
        memory_tags = set(memory.get("tags") or [])
        if not memory_tags.intersection(query.tags):
            return False

    if query.relatedEntityIds:
        related = set(memory.get("relatedEntityIds") or [])
        if not related.intersection(query.relatedEntityIds):
            return False

    if query.minimumImportance is not None and memory["importance"] < query.minimumImportance:
        return False

    if query.minimumConfidence is not None and memory["confidence"] < query.minimumConfidence:
        return False

    return True


@app.get("/health")
def health() -> dict[str, Any]:
    configured = bool(os.getenv("MONGODB_URI", "").strip() and os.getenv("OPENAI_API_KEY", "").strip())
    if not configured:
        return {
            "provider": "mem0-mongodb",
            "connected": False,
            "durable": False,
            "details": "MONGODB_URI and/or OPENAI_API_KEY are not configured",
        }

    try:
        client = get_mongo_client()
        client.admin.command("ping")
        get_relationship_collection()
        get_memory()
        return {
            "provider": "mem0-mongodb",
            "connected": True,
            "durable": True,
            "details": "MongoDB reachable and Mem0 initialized",
        }
    except Exception as exc:
        return {
            "provider": "mem0-mongodb",
            "connected": False,
            "durable": False,
            "details": f"Memory service unavailable: {type(exc).__name__}",
        }


@app.post("/v1/memory/remember")
def remember(input_data: RememberRequest) -> dict[str, list[dict[str, Any]]]:
    memory = get_memory()
    metadata = metadata_for(input_data)

    try:
        result = memory.add(
            input_data.content,
            agent_id=input_data.npcId,
            metadata=metadata,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Mem0 remember failed: {type(exc).__name__}") from exc

    extracted = result.get("results", []) if isinstance(result, dict) else []
    memories: list[dict[str, Any]] = []

    for item in extracted:
        hydrated = item
        memory_id = item.get("id") if isinstance(item, dict) else None
        if memory_id:
            try:
                fetched = memory.get(memory_id=memory_id)
                if fetched:
                    hydrated = fetched
            except Exception:
                pass

        if isinstance(hydrated, dict):
            memories.append(memory_record_to_domain(hydrated, input_data.npcId, metadata))

    return {"memories": memories}


@app.post("/v1/memory/recall")
def recall(query: RecallRequest) -> dict[str, list[dict[str, Any]]]:
    memory = get_memory()

    try:
        if query.text and query.text.strip():
            raw = memory.search(
                query=query.text.strip(),
                filters={"agent_id": query.npcId},
                top_k=min(max(query.limit * 3, query.limit), 100),
            )
        else:
            raw = memory.get_all(
                filters={"agent_id": query.npcId},
                top_k=min(max(query.limit * 3, query.limit), 100),
            )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Mem0 recall failed: {type(exc).__name__}") from exc

    records = raw.get("results", []) if isinstance(raw, dict) else []
    mapped = [memory_record_to_domain(record, query.npcId) for record in records if isinstance(record, dict)]
    filtered = [entry for entry in mapped if passes_local_filters(entry, query)]
    return {"memories": filtered[: query.limit]}


@app.delete("/v1/memory/{npc_id}/{memory_id}", status_code=204)
def forget(npc_id: str, memory_id: str) -> Response:
    memory = get_memory()

    try:
        existing = memory.get(memory_id=memory_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Memory not found")

        existing_agent = existing.get("agent_id") if isinstance(existing, dict) else None
        metadata = existing.get("metadata") or {} if isinstance(existing, dict) else {}
        metadata_npc = metadata.get("npcId") if isinstance(metadata, dict) else None
        if existing_agent not in {None, npc_id} and metadata_npc != npc_id:
            raise HTTPException(status_code=404, detail="Memory not found")

        memory.delete(memory_id=memory_id)
        return Response(status_code=204)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Mem0 delete failed: {type(exc).__name__}") from exc


@app.get("/v1/relationships/{npc_id}/{subject_id}")
def get_relationship(npc_id: str, subject_id: str) -> dict[str, Any]:
    try:
        document = get_relationship_collection().find_one(
            {"npcId": npc_id, "subjectId": subject_id},
            {"_id": 0, "npcId": 0, "updatedAt": 0},
        )
        return {"relationship": document}
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="Relationship store unavailable") from exc


@app.put("/v1/relationships/{npc_id}/{subject_id}")
def upsert_relationship(npc_id: str, subject_id: str, relationship: RelationshipStateModel) -> dict[str, Any]:
    if relationship.subjectId != subject_id:
        raise HTTPException(status_code=400, detail="Relationship subjectId does not match URL")

    document = relationship.model_dump()
    document.update({"npcId": npc_id, "updatedAt": utc_now()})

    try:
        get_relationship_collection().replace_one(
            {"npcId": npc_id, "subjectId": subject_id},
            document,
            upsert=True,
        )
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="Relationship store unavailable") from exc

    document.pop("npcId", None)
    document.pop("updatedAt", None)
    return {"relationship": document}
