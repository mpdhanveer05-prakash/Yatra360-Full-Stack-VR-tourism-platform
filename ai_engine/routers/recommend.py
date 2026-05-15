from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from models.hybrid_recommender import get_recommendations, get_cold_start

router = APIRouter()


class HistoryEntry(BaseModel):
    locationId: str
    score: float = 0.0


class RecommendRequest(BaseModel):
    userId: str = ""
    currentLocationId: str = ""
    userVector: dict[str, float] = {}
    history: list[HistoryEntry] = []
    region: str | None = None
    n: int = 3


class RecommendItem(BaseModel):
    id: str
    name: str
    score: float
    reason: str


class RecommendResponse(BaseModel):
    recommendations: list[RecommendItem]


@router.post("", response_model=RecommendResponse)
async def recommend(body: RecommendRequest) -> Any:
    history_dicts = [{"locationId": h.locationId, "engagementScore": h.score} for h in body.history]

    if not body.userVector and not body.history:
        recs = get_cold_start(region=body.region, n=body.n)
    else:
        recs = get_recommendations(
            user_vector=body.userVector,
            current_location_id=body.currentLocationId,
            history=history_dicts,
            n=body.n,
        )

    return {"recommendations": recs}
