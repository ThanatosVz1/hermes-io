import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ROADMAPS_FILE = PROJECT_ROOT / "data" / "roadmaps.json"

with open(ROADMAPS_FILE, "r", encoding="utf-8") as file:
    roadmaps = json.load(file)

print("=" * 70)
print("HERMES DATA SCHEMA INSPECTION")
print("=" * 70)

print("\nROADMAP FIELDS:")
print(list(roadmaps[0].keys()))

print("\nFIRST ROADMAP:")
print(json.dumps(roadmaps[0], indent=2, ensure_ascii=False)[:12000])

print("\n" + "=" * 70)
print("SCHEMA INSPECTION COMPLETE")
print("=" * 70)