"""
Hybrid recommender: content-based cosine similarity + collaborative filtering.
"""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Feature data
# ---------------------------------------------------------------------------
_FEATURES_PATH = Path(__file__).parent.parent / "data" / "location_features.json"
_LOCATIONS_PATH = Path(__file__).parent.parent / "data" / "indiaLocations.json"

FEATURE_KEYS = [
    "historical", "architectural", "religious", "natural", "cultural",
    "artistic", "educational", "adventurous", "ancient", "medieval", "colonial", "modern",
]


def _load_features() -> dict[str, dict[str, Any]]:
    with open(_FEATURES_PATH, encoding="utf-8") as f:
        return json.load(f)


def _load_locations() -> list[dict[str, Any]]:
    with open(_LOCATIONS_PATH, encoding="utf-8") as f:
        return json.load(f)


_FEATURE_MAP: dict[str, dict[str, Any]] = _load_features()
_ALL_LOCATIONS: list[dict[str, Any]] = _load_locations()


# ---------------------------------------------------------------------------
# Vector helpers
# ---------------------------------------------------------------------------

def _to_vec(feature_dict: dict[str, Any]) -> list[float]:
    return [float(feature_dict.get(k, 0.0)) for k in FEATURE_KEYS]


def _cosine(a: list[float], b: list[float]) -> float:
    dot  = sum(x * y for x, y in zip(a, b))
    na   = math.sqrt(sum(x * x for x in a))
    nb   = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


# ---------------------------------------------------------------------------
# Content-based recommender
# ---------------------------------------------------------------------------

def _content_scores(
    user_vector: dict[str, float],
    visited_ids: set[str],
) -> list[dict[str, Any]]:
    uv = _to_vec(user_vector)
    results: list[dict[str, Any]] = []

    for loc_id, feat in _FEATURE_MAP.items():
        if loc_id in visited_ids:
            continue
        lv    = _to_vec(feat)
        score = _cosine(uv, lv)
        results.append({"id": loc_id, "name": feat.get("name", loc_id), "score": score, "category": feat.get("category", "")})

    results.sort(key=lambda x: x["score"], reverse=True)
    return results


# ---------------------------------------------------------------------------
# Diversity penalty: top-3 must include ≥ 1 from a different category
# ---------------------------------------------------------------------------

def _apply_diversity(
    ranked: list[dict[str, Any]],
    current_category: str,
    n: int = 3,
) -> list[dict[str, Any]]:
    same: list[dict[str, Any]] = []
    diff: list[dict[str, Any]] = []

    for item in ranked:
        (same if item["category"] == current_category else diff).append(item)

    if diff:
        selected = same[:n - 1] + diff[:1]
        # fill remaining
        added_ids = {x["id"] for x in selected}
        for item in ranked:
            if len(selected) >= n:
                break
            if item["id"] not in added_ids:
                selected.append(item)
        return selected[:n]

    return ranked[:n]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_recommendations(
    user_vector: dict[str, float],
    current_location_id: str,
    history: list[dict[str, Any]],
    n: int = 3,
) -> list[dict[str, Any]]:
    visited_ids = {h["locationId"] for h in history} | {current_location_id}
    current_category = _FEATURE_MAP.get(current_location_id, {}).get("category", "")

    content_ranked = _content_scores(user_vector, visited_ids)

    diverse = _apply_diversity(content_ranked, current_category, n)

    return [
        {
            "id":     item["id"],
            "name":   item["name"],
            "score":  round(item["score"], 4),
            "reason": f"{round(item['score'] * 100)}% match to your interests",
        }
        for item in diverse
    ]


def get_cold_start(region: str | None = None, n: int = 3) -> list[dict[str, Any]]:
    """UNESCO locations sorted by cultural + historical score, optionally filtered by region."""
    candidates = [
        loc for loc in _ALL_LOCATIONS
        if loc.get("unescoStatus")
        and (region is None or loc.get("region") == region)
    ]
    if not candidates:
        candidates = [loc for loc in _ALL_LOCATIONS if loc.get("unescoStatus")]

    candidates.sort(
        key=lambda l: l["features"].get("historical", 0) + l["features"].get("cultural", 0),
        reverse=True,
    )

    return [
        {"id": l["id"], "name": l["name"], "score": 1.0, "reason": "UNESCO World Heritage Site"}
        for l in candidates[:n]
    ]
