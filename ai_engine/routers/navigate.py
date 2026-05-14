from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from ai_engine.models.rl_navigator import suggest_next, update, get_q_table_snapshot

router = APIRouter()


class NextRequest(BaseModel):
    currentNodeId: str
    sessionVisits: int = 0


class UpdateRequest(BaseModel):
    fromNodeId: str
    toNodeId: str
    reward: float
    nextConnections: list[str] = []


class NextResponse(BaseModel):
    suggestedNodeId: str | None


class UpdateResponse(BaseModel):
    ok: bool


@router.post("/next", response_model=NextResponse)
async def navigate_next(body: NextRequest) -> Any:
    suggested = suggest_next(body.currentNodeId, body.sessionVisits)
    return {"suggestedNodeId": suggested}


@router.post("/update", response_model=UpdateResponse)
async def navigate_update(body: UpdateRequest) -> Any:
    update(
        from_node=body.fromNodeId,
        to_node=body.toNodeId,
        reward=body.reward,
        next_connections=body.nextConnections or None,
    )
    return {"ok": True}


@router.get("/qtable")
async def q_table() -> Any:
    return get_q_table_snapshot()
