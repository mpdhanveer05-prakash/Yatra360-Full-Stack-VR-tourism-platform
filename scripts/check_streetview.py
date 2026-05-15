"""
Check Google Street View availability for each location in indiaLocations.json.

Uses the Street View Metadata API (free, no quota cost) to determine:
  - Status OK + Google copyright    → walkable Street View ✓
  - Status OK + non-Google copyright → user-uploaded 360 photo only (not walkable)
  - Status ZERO_RESULTS / NOT_FOUND  → no Street View at all

The script prints a categorised report and writes two files:
  - scripts/streetview_report.json  — full results per location
  - src/data/indiaLocations.filtered.json  — only walkable-SV locations

After reviewing the report, you can replace src/data/indiaLocations.json
with the .filtered.json version.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC  = ROOT / "src" / "data" / "indiaLocations.json"
OUT_FILTERED = ROOT / "src" / "data" / "indiaLocations.filtered.json"
OUT_REPORT   = ROOT / "scripts" / "streetview_report.json"

# Read the Maps key from .env or env var
def load_api_key() -> str:
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("VITE_GOOGLE_MAPS_KEY"):
                _, val = line.split("=", 1)
                return val.strip().strip('"').strip("'")
    key = os.environ.get("VITE_GOOGLE_MAPS_KEY") or os.environ.get("GOOGLE_MAPS_KEY")
    if not key:
        sys.exit("ERROR: VITE_GOOGLE_MAPS_KEY not found in .env or environment")
    return key


def check_location(api_key: str, lat: float, lng: float, *, radius: int = 1000) -> dict:
    """Hit the Street View metadata API. Returns parsed JSON."""
    params = {
        "location": f"{lat},{lng}",
        "radius":   str(radius),
        "source":   "outdoor",
        "key":      api_key,
    }
    url = "https://maps.googleapis.com/maps/api/streetview/metadata?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"status": "ERROR", "error": str(e)}


def categorise(meta: dict) -> str:
    """Return one of: 'walkable', 'user_photo', 'no_sv', 'error'."""
    status = meta.get("status", "")
    if status != "OK":
        if status in ("ZERO_RESULTS", "NOT_FOUND"):
            return "no_sv"
        return "error"
    copyright_str = (meta.get("copyright") or "").lower()
    # Google's own Street View cars: "© Google" or "(c) Google"
    if "google" in copyright_str:
        return "walkable"
    # User-uploaded 360 photos: shows photographer name
    return "user_photo"


def main() -> None:
    api_key = load_api_key()
    locations = json.loads(SRC.read_text(encoding="utf-8"))
    print(f"Checking Street View coverage for {len(locations)} locations…\n")

    report = []
    buckets: dict[str, list[str]] = {"walkable": [], "user_photo": [], "no_sv": [], "error": []}

    for i, loc in enumerate(locations, 1):
        meta = check_location(api_key, loc["lat"], loc["lng"], radius=1000)
        category = categorise(meta)
        report.append({
            "id":         loc["id"],
            "name":       loc["name"],
            "lat":        loc["lat"],
            "lng":        loc["lng"],
            "status":     meta.get("status"),
            "copyright":  meta.get("copyright"),
            "pano_id":    meta.get("pano_id"),
            "category":   category,
        })
        buckets[category].append(f'{loc["id"]}  ({loc["name"]})')
        marker = {"walkable": "✓", "user_photo": "○", "no_sv": "✗", "error": "?"}[category]
        print(f"  [{i:>2}/50] {marker} {category:<10} {loc['id']:<35} {loc['name']}")
        time.sleep(0.05)  # gentle pacing

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    for cat in ("walkable", "user_photo", "no_sv", "error"):
        print(f"\n{cat.upper()} ({len(buckets[cat])}):")
        for name in buckets[cat]:
            print(f"  · {name}")

    # ── Write outputs ────────────────────────────────────────────────────────
    OUT_REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    walkable_ids = {r["id"] for r in report if r["category"] == "walkable"}
    filtered = [loc for loc in locations if loc["id"] in walkable_ids]
    OUT_FILTERED.write_text(json.dumps(filtered, indent=2), encoding="utf-8")

    print(f"\nWrote {OUT_REPORT} ({len(report)} entries)")
    print(f"Wrote {OUT_FILTERED} ({len(filtered)} walkable locations kept)")


if __name__ == "__main__":
    main()
