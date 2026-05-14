from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_engine.routers import recommend, navigate, guide

app = FastAPI(
    title="Yatra360 AI Engine",
    description="Recommendation, RL navigation, and Wikipedia RAG guide for Yatra360",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3001",
        "http://localhost:4173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend.router, prefix="/recommend", tags=["recommend"])
app.include_router(navigate.router,  prefix="/navigate",  tags=["navigate"])
app.include_router(guide.router,     prefix="/guide",     tags=["guide"])


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"ok": True, "service": "yatra360-ai"}
