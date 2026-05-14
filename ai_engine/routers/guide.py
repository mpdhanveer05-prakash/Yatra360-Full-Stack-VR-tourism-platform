from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ai_engine.models.rag_guide import answer_question

router = APIRouter()


class GuideMessage(BaseModel):
    role:    str   # "user" | "guide"
    content: str


class GuideRequest(BaseModel):
    question:     str
    locationSlug: str
    nodeLabel:    str  = ""
    lang:         str  = "en"
    history:      list[GuideMessage] = Field(default_factory=list)


class GuideResponse(BaseModel):
    answer:        str
    sourceSection: str
    confidence:    float
    synth:         str  # "anthropic" | "openai" | "extractive" | "fallback" | "none"


@router.post("", response_model=GuideResponse)
async def guide(body: GuideRequest) -> Any:
    return await answer_question(
        question=body.question,
        location_slug=body.locationSlug,
        node_label=body.nodeLabel,
        lang=body.lang,
        history=[m.model_dump() for m in body.history],
    )
