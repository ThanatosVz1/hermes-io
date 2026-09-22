import csv
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
INPUT_FILE = PROJECT_ROOT / "ml" / "data" / "skills_clean.csv"

with open(INPUT_FILE, "r", encoding="utf-8") as file:
    rows = csv.DictReader(file)

    for row in rows:
        if row["category"] == "unknown":
            print(
                f'{row["skill_id"]} | '
                f'{row["name"]} | '
                f'{row["node_type"]}'
            )