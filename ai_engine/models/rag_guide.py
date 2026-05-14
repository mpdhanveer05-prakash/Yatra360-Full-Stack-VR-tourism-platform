"""
Wikipedia RAG guide.

Strategy:
  1. Fetch Wikipedia mobile-sections for the requested slug (language-aware).
  2. Split into ~500-char chunks with section titles.
  3. Build a per-slug TF-IDF index over chunks (cached).
  4. Score the question with cosine similarity → top-k chunks.
  5. Optionally synthesize an answer via Anthropic / OpenAI (env-gated).
     Falls back to extractive "best sentences" if no LLM key set.
"""
from __future__ import annotations

import asyncio
import os
import re
import time
from typing import Any

import httpx
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

USER_AGENT = "Yatra360/1.0 (educational project)"
CACHE_TTL  = 3600  # 1 hour

# Optional LLM (env-gated)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY", "").strip()

# Supported Wikipedia language subdomains for guide answers.
SUPPORTED_LANGS = {"en", "hi", "ta", "bn", "mr"}


# ---------------------------------------------------------------------------
# Per-slug cache: chunks + fitted TF-IDF index
# ---------------------------------------------------------------------------

class _SlugIndex:
    __slots__ = ("chunks", "vectorizer", "matrix", "fetched_at")

    def __init__(self, chunks: list[dict[str, str]]) -> None:
        self.chunks     = chunks
        self.fetched_at = time.time()
        self.vectorizer: TfidfVectorizer | None = None
        self.matrix:     Any = None
        if chunks:
            texts = [c["text"] for c in chunks]
            self.vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=4000,
                stop_words=None,   # multilingual safe
                lowercase=True,
            )
            self.matrix = self.vectorizer.fit_transform(texts)


_cache: dict[str, _SlugIndex] = {}
_cache_lock = asyncio.Lock()


# ---------------------------------------------------------------------------
# Wikipedia fetching (multi-language)
# ---------------------------------------------------------------------------

def _wiki_base(lang: str) -> str:
    lang = lang if lang in SUPPORTED_LANGS else "en"
    return f"https://{lang}.wikipedia.org/api/rest_v1/page"


async def _fetch_sections(slug: str, lang: str) -> list[dict[str, str]]:
    """Fetch and chunk Wikipedia article. Returns list of {text, title}."""
    base = _wiki_base(lang)
    chunks: list[dict[str, str]] = []

    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, timeout=8.0) as client:
        try:
            r = await client.get(f"{base}/mobile-sections/{slug}")
            r.raise_for_status()
            data: dict[str, Any] = r.json()

            all_sections: list[dict[str, Any]] = []
            if "lead" in data:
                all_sections += data["lead"].get("sections", [])
            if "remaining" in data:
                all_sections += data["remaining"].get("sections", [])

            for section in all_sections:
                raw = section.get("text", "") or section.get("content", "")
                plain = re.sub(r"<[^>]+>", " ", raw)
                plain = re.sub(r"\s+", " ", plain).strip()
                title = section.get("line", "Introduction")
                title = re.sub(r"<[^>]+>", "", title).strip()

                for i in range(0, len(plain), 500):
                    chunk = plain[i : i + 500].strip()
                    if chunk:
                        chunks.append({"text": chunk, "title": title})
        except Exception:
            # Fallback to summary
            try:
                r = await client.get(f"{base}/summary/{slug}")
                r.raise_for_status()
                summary: dict[str, Any] = r.json()
                extract = summary.get("extract", "")
                for i in range(0, len(extract), 500):
                    chunk = extract[i : i + 500].strip()
                    if chunk:
                        chunks.append({"text": chunk, "title": "Introduction"})
            except Exception:
                pass

    return chunks


async def _get_index(slug: str, lang: str) -> _SlugIndex:
    key = f"{lang}:{slug}"
    cached = _cache.get(key)
    if cached and time.time() - cached.fetched_at < CACHE_TTL:
        return cached
    async with _cache_lock:
        cached = _cache.get(key)
        if cached and time.time() - cached.fetched_at < CACHE_TTL:
            return cached
        chunks = await _fetch_sections(slug, lang)
        idx = _SlugIndex(chunks)
        _cache[key] = idx
        return idx


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------

def _retrieve(idx: _SlugIndex, question: str, k: int = 4) -> list[tuple[float, dict[str, str]]]:
    if not idx.chunks or idx.vectorizer is None:
        return []
    qv = idx.vectorizer.transform([question])
    sims = cosine_similarity(qv, idx.matrix)[0]   # type: ignore[arg-type]
    top_idx = np.argsort(sims)[::-1][:k]
    out: list[tuple[float, dict[str, str]]] = []
    for i in top_idx:
        score = float(sims[i])
        if score <= 0.0:
            continue
        out.append((score, idx.chunks[int(i)]))
    return out


def _extractive_answer(chunks: list[tuple[float, dict[str, str]]], question: str) -> str:
    """Pull best sentences from top chunks when no LLM is available."""
    q_words = set(re.findall(r"\w{3,}", question.lower()))
    sentences: list[tuple[float, str]] = []
    for score, ch in chunks:
        for s in re.split(r"(?<=[.!?])\s+", ch["text"]):
            s = s.strip()
            if len(s) < 25:
                continue
            ws = set(re.findall(r"\w{3,}", s.lower()))
            overlap = len(q_words & ws)
            sentences.append((score * (1.0 + 0.3 * overlap), s))
    sentences.sort(key=lambda t: t[0], reverse=True)
    picked = [s for _, s in sentences[:4]]
    return " ".join(picked).strip()


# ---------------------------------------------------------------------------
# Optional LLM synthesis
# ---------------------------------------------------------------------------

LANG_NAMES = {
    "en": "English", "hi": "Hindi", "ta": "Tamil",
    "bn": "Bengali", "mr": "Marathi",
}


def _build_prompt(
    question: str,
    context_chunks: list[tuple[float, dict[str, str]]],
    history: list[dict[str, str]],
    lang: str,
) -> tuple[str, str]:
    """Returns (system, user) prompt strings."""
    context = "\n\n".join(
        f"[{i+1}] {ch['title']}: {ch['text']}"
        for i, (_, ch) in enumerate(context_chunks)
    )
    history_str = ""
    if history:
        turns = []
        for h in history[-6:]:
            role = "User" if h.get("role") == "user" else "Guide"
            turns.append(f"{role}: {h.get('content', '').strip()}")
        history_str = "\n".join(turns) + "\n"

    lang_name = LANG_NAMES.get(lang, "English")
    system = (
        f"You are an expert virtual guide for Indian heritage sites. "
        f"Answer in {lang_name}. Use ONLY the provided Wikipedia context — "
        f"do not invent facts. Keep answers to 2–4 sentences. "
        f"If the context doesn't cover the question, say so briefly."
    )
    user = (
        f"{history_str}"
        f"Wikipedia context:\n{context}\n\n"
        f"Question: {question}\n\nAnswer:"
    )
    return system, user


async def _synthesize_anthropic(system: str, user: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 400,
                    "system": system,
                    "messages": [{"role": "user", "content": user}],
                },
            )
            r.raise_for_status()
            data = r.json()
            blocks = data.get("content", [])
            for b in blocks:
                if b.get("type") == "text":
                    return (b.get("text") or "").strip()
    except Exception:
        return None
    return None


async def _synthesize_openai(system: str, user: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "max_tokens": 400,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user",   "content": user},
                    ],
                },
            )
            r.raise_for_status()
            data = r.json()
            return (data["choices"][0]["message"]["content"] or "").strip()
    except Exception:
        return None


async def _synthesize(system: str, user: str) -> str | None:
    if ANTHROPIC_API_KEY:
        return await _synthesize_anthropic(system, user)
    if OPENAI_API_KEY:
        return await _synthesize_openai(system, user)
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def answer_question(
    question: str,
    location_slug: str,
    node_label: str = "",
    history: list[dict[str, str]] | None = None,
    lang: str = "en",
) -> dict[str, Any]:
    lang = lang if lang in SUPPORTED_LANGS else "en"
    idx = await _get_index(location_slug, lang)

    if not idx.chunks:
        return {
            "answer": "Detailed information about this location is currently unavailable.",
            "sourceSection": "",
            "confidence": 0.0,
            "synth": "none",
        }

    full_q = f"{node_label} {question}".strip() if node_label else question
    retrieved = _retrieve(idx, full_q, k=4)

    if not retrieved:
        return {
            "answer": idx.chunks[0]["text"][:400],
            "sourceSection": idx.chunks[0]["title"],
            "confidence": 0.2,
            "synth": "fallback",
        }

    # LLM synthesis first (if keys present), else extractive
    system, user = _build_prompt(question, retrieved, history or [], lang)
    synthesized = await _synthesize(system, user)
    if synthesized:
        answer = synthesized
        synth = "anthropic" if ANTHROPIC_API_KEY else "openai"
    else:
        answer = _extractive_answer(retrieved, question) or retrieved[0][1]["text"][:400]
        synth = "extractive"

    best_score = retrieved[0][0]
    return {
        "answer": answer.strip(),
        "sourceSection": retrieved[0][1]["title"],
        "confidence": round(min(best_score * 2.0, 1.0), 3),
        "synth": synth,
    }
