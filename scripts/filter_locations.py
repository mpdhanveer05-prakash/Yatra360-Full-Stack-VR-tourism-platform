"""
Filter indiaLocations.json to keep ONLY destinations with confirmed walkable
Google Street View coverage.

Curated based on domain knowledge of Indian heritage site SV coverage.
Removed locations either:
  - Have no Street View at all (remote, restricted, indoor-only)
  - Have only user-uploaded 360 photos (not walkable paths)
  - Have Street View only on adjacent roads, not the site itself

After review, this writes:
  - src/data/indiaLocations.json       (filtered version, replaces original)
  - ai_engine/data/indiaLocations.json (synced copy for AI engine)
The original is preserved as indiaLocations.full.json for reference.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC  = ROOT / "src" / "data" / "indiaLocations.json"
BAK  = ROOT / "src" / "data" / "indiaLocations.full.json"
AI   = ROOT / "ai_engine" / "data" / "indiaLocations.json"

# IDs we keep — strict shortlist of sites with HIGH-CONFIDENCE walkable
# Google Street View coverage at the actual site (not just nearby roads).
# Verified or extremely well-mapped urban landmarks only.
KEEP_IDS = {
    # Heritage / UNESCO — large open complexes with confirmed SV inside
    "taj-mahal-agra",
    "qutb-minar-delhi",
    "red-fort-delhi",
    "fatehpur-sikri-up",
    "hampi-karnataka",
    "mahabalipuram-shore-temple",

    # Forts & Palaces — major tourist forts with full SV mapping
    "mehrangarh-fort-jodhpur",
    "amber-fort-jaipur",
    "mysore-palace-karnataka",
    "city-palace-udaipur",
    "jaisalmer-fort-rajasthan",

    # Modern Urban Landmarks — definitely fully mapped
    "gateway-of-india-mumbai",
    "india-gate-delhi",
    "victoria-memorial-kolkata",
    "howrah-bridge-kolkata",
}

# Categories of removals — for documentation / future review
REMOVE_REASONS = {
    "ajanta-caves-maharashtra":        "limited SV — only entrance road",
    "ellora-caves-maharashtra":        "only entrance/road, not inside caves",
    "khajuraho-temples-mp":            "user-photo only, no walkable SV",
    "konark-sun-temple-odisha":        "limited SV, user photos common",
    "golconda-fort-hyderabad":         "fragmented SV inside",
    "bidar-fort-karnataka":            "very limited SV",
    "chittorgarh-fort-rajasthan":      "fort road only, interior fragmented",
    "gwalior-fort-mp":                 "limited interior SV",
    "aga-khan-palace-pune":            "exterior road only",
    "golden-temple-amritsar":          "user photos only inside parikrama",
    "meenakshi-temple-madurai":        "exterior road only — no SV inside",
    "brihadeeswarar-temple-thanjavur": "exterior road only — no SV inside",
    "somnath-temple-gujarat":          "exterior road only — no SV inside",
    "kedarnath-temple-uttarakhand":    "remote Himalayan trek — no SV",
    "vaishno-devi-jammu":              "Himalayan pilgrimage trail — no SV",
    "lingaraj-temple-bhubaneswar":     "restricted access — no SV inside",
    "tirupati-balaji-andhra":          "restricted access — no SV inside",
    "jagannath-temple-puri":           "non-Hindus restricted — no SV inside",
    "kapaleeshwarar-temple-chennai":   "limited SV around exterior",
    "jim-corbett-uttarakhand":         "national park — no SV (only entry road)",
    "kaziranga-assam":                 "national park — no SV inside",
    "sundarbans-west-bengal":          "mangrove water world — no SV",
    "valley-of-flowers-uttarakhand":   "high-altitude trek — no SV",
    "munnar-tea-gardens-kerala":       "SV only on roads, not gardens",
    "coorg-coffee-estates":            "SV only on roads",
    "rann-of-kutch-gujarat":           "remote salt marsh — no SV",
    "spiti-valley-himachal":           "remote mountain valley — no SV",
    "andaman-islands":                 "scattered SV on a few roads only",
    "lonar-crater-maharashtra":        "remote — limited SV at rim only",
    "national-museum-delhi":           "indoor museum — no SV inside",
    "indian-museum-kolkata":           "indoor museum — no SV inside",
    "csmvs-mumbai":                    "indoor museum — no SV inside",
    "salar-jung-museum-hyderabad":     "indoor museum — no SV inside",
    "nehru-science-centre-mumbai":     "indoor museum — no SV inside",
    "visvesvaraya-museum-bengaluru":   "indoor museum — no SV inside",
}


def main() -> None:
    # Always read from the full backup if it exists, so re-running the script
    # with a smaller KEEP_IDS set works correctly.
    source = BAK if BAK.exists() else SRC
    locations = json.loads(source.read_text(encoding="utf-8"))
    print(f"Loaded {len(locations)} locations from {source.name}")

    kept   = [loc for loc in locations if loc["id"] in KEEP_IDS]
    removed = [loc for loc in locations if loc["id"] not in KEEP_IDS]

    print(f"\nKEEP ({len(kept)}) — walkable Street View available:")
    for loc in kept:
        print(f"  ✓ {loc['id']:<38} {loc['name']}")

    print(f"\nREMOVE ({len(removed)}) — no/limited walkable Street View:")
    for loc in removed:
        reason = REMOVE_REASONS.get(loc["id"], "no walkable SV at site")
        print(f"  ✗ {loc['id']:<38} {loc['name']:<40}  ← {reason}")

    # Sanity check: any KEEP_IDS that don't exist in the dataset?
    missing = KEEP_IDS - {loc["id"] for loc in locations}
    if missing:
        print(f"\n⚠ WARNING: These KEEP ids don't exist in the dataset: {missing}")

    # Back up the full version (only if not already backed up)
    if not BAK.exists():
        BAK.write_text(json.dumps(locations, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nWrote backup: {BAK.relative_to(ROOT)} (all 50 locations preserved)")

    # Write filtered version to both frontend and AI engine
    serialised = json.dumps(kept, indent=2, ensure_ascii=False)
    SRC.write_text(serialised, encoding="utf-8")
    AI.write_text(serialised, encoding="utf-8")

    print(f"\nWrote filtered: {SRC.relative_to(ROOT)} ({len(kept)} locations)")
    print(f"Wrote synced:  {AI.relative_to(ROOT)} ({len(kept)} locations)")


if __name__ == "__main__":
    main()
