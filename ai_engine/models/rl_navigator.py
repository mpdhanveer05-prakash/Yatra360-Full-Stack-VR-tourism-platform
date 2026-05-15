"""
Tabular Q-learning navigator for within-location node traversal.
State = nodeId, Action = target nodeId, Reward = engagement score of destination node.
"""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any

_LOCATIONS_PATH = Path(__file__).parent.parent / "data" / "indiaLocations.json"


def _load_graph() -> dict[str, list[str]]:
    """Returns adjacency dict: {nodeId: [connectedNodeId, ...]}"""
    with open(_LOCATIONS_PATH, encoding="utf-8") as f:
        locations: list[dict[str, Any]] = json.load(f)

    graph: dict[str, list[str]] = {}
    for loc in locations:
        for node in loc.get("nodes", []):
            graph[node["id"]] = node.get("connectedNodes", [])
    return graph


_NODE_GRAPH: dict[str, list[str]] = _load_graph()

# ---------------------------------------------------------------------------
# Q-table stored in memory (per-process). A production system would persist
# this to MongoDB / Redis.
# ---------------------------------------------------------------------------
_Q: dict[str, dict[str, float]] = {}

LR    = 0.3   # learning rate
GAMMA = 0.8   # discount factor
EPS_INIT  = 0.3
EPS_MIN   = 0.05
EPS_DECAY = 0.02


def _get_q(state: str, action: str) -> float:
    return _Q.get(state, {}).get(action, 0.0)


def _set_q(state: str, action: str, value: float) -> None:
    if state not in _Q:
        _Q[state] = {}
    _Q[state][action] = value


def _epsilon(visits: int) -> float:
    return max(EPS_MIN, EPS_INIT - visits * EPS_DECAY)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def suggest_next(current_node_id: str, session_visits: int = 0) -> str | None:
    """ε-greedy policy: return suggested next node or None if no connections."""
    actions = _NODE_GRAPH.get(current_node_id, [])
    if not actions:
        return None

    eps = _epsilon(session_visits)
    if random.random() < eps:
        return random.choice(actions)

    q_vals = {a: _get_q(current_node_id, a) for a in actions}
    return max(q_vals, key=lambda a: q_vals[a])


def update(
    from_node: str,
    to_node: str,
    reward: float,
    next_connections: list[str] | None = None,
) -> None:
    """Bellman update after the user navigates from_node → to_node with engagement reward."""
    connections = next_connections or _NODE_GRAPH.get(to_node, [])

    max_future = max((_get_q(to_node, a) for a in connections), default=0.0) if connections else 0.0

    old_q   = _get_q(from_node, to_node)
    new_q   = old_q + LR * (reward + GAMMA * max_future - old_q)
    _set_q(from_node, to_node, round(new_q, 6))


def get_q_table_snapshot() -> dict[str, dict[str, float]]:
    """Return a copy of the current Q-table (for debugging / persistence)."""
    return {s: dict(actions) for s, actions in _Q.items()}
