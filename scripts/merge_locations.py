"""
Merge the full Indian heritage dataset (50 locations) with the world
landmarks dataset (20 locations) into a single deduped dataset.

The destination has the world dataset's Taj Mahal entry replaced by the
richer Indian-dataset version, so we don't lose the multi-node tour for
Taj Mahal that already exists in the original data.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT     = Path(__file__).resolve().parent.parent
FULL_IN  = ROOT / "src" / "data" / "indiaLocations.full.json"
CUR_IN   = ROOT / "src" / "data" / "indiaLocations.json"
OUT_FE   = ROOT / "src" / "data" / "indiaLocations.json"
OUT_AI   = ROOT / "ai_engine" / "data" / "indiaLocations.json"

india  = json.loads(FULL_IN.read_text(encoding="utf-8"))
world  = json.loads(CUR_IN.read_text(encoding="utf-8"))

# Merge: keep all India entries (rich tour nodes); add world entries
# that aren't already in India.
india_ids = {l["id"] for l in india}
unique_world = [l for l in world if l["id"] not in india_ids]
merged = india + unique_world

serialised = json.dumps(merged, indent=2, ensure_ascii=False)
OUT_FE.write_text(serialised, encoding="utf-8")
OUT_AI.write_text(serialised, encoding="utf-8")

print(f"Merged dataset: {len(merged)} locations")
print(f"  India:  {len(india)}")
print(f"  World:  {len(unique_world)} (Taj Mahal kept from India copy)")
print(f"  TOTAL:  {len(merged)}")
print()
print(f"Wrote: {OUT_FE.relative_to(ROOT)}")
print(f"Wrote: {OUT_AI.relative_to(ROOT)}")
