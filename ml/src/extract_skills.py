import json
import csv
from pathlib import Path


# --------------------------------------------------
# Locate project files
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

ROADMAPS_FILE = PROJECT_ROOT / "data" / "roadmaps.json"
OUTPUT_FILE = PROJECT_ROOT / "ml" / "data" / "skills.csv"


# --------------------------------------------------
# Load existing roadmap data
# --------------------------------------------------

with open(ROADMAPS_FILE, "r", encoding="utf-8") as file:
    roadmaps = json.load(file)


# --------------------------------------------------
# Recursively collect learning nodes
# --------------------------------------------------

def collect_nodes(nodes):
    result = []

    for node in nodes:

        result.append(node)

        children = node.get("children", [])

        if children:
            result.extend(
                collect_nodes(children)
            )

    return result


# --------------------------------------------------
# Extract unique skills
# --------------------------------------------------

skills = {}

for roadmap in roadmaps:

    nodes = collect_nodes(
        roadmap.get("nodes", [])
    )

    for node in nodes:

        title = node.get("title")

        if not title:
            continue

        skill_id = node.get("id")

        if not skill_id:
            continue

        if skill_id not in skills:

            skills[skill_id] = {
                "skill_id": skill_id,
                "name": title,
                "description": node.get("description", ""),
                "estimated_hours": node.get(
                    "estimatedHours", 0
                ),
                "roadmap_ids": [
                    roadmap.get("id")
                ]
            }

        else:

            if roadmap.get("id") not in skills[skill_id]["roadmap_ids"]:

                skills[skill_id]["roadmap_ids"].append(
                    roadmap.get("id")
                )


# --------------------------------------------------
# Save CSV
# --------------------------------------------------

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)


with open(
    OUTPUT_FILE,
    "w",
    newline="",
    encoding="utf-8"
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=[
            "skill_id",
            "name",
            "description",
            "estimated_hours",
            "roadmap_ids"
        ]
    )

    writer.writeheader()

    for skill in skills.values():

        row = skill.copy()

        row["roadmap_ids"] = "|".join(
            row["roadmap_ids"]
        )

        writer.writerow(row)


# --------------------------------------------------
# Results
# --------------------------------------------------

print("=" * 60)
print("SKILL EXTRACTION COMPLETE")
print("=" * 60)

print(f"\nUnique skills extracted: {len(skills)}")

print(f"\nDataset saved to:")

print(OUTPUT_FILE)

print("\nNext step:")
print("Review skills.csv before adding ML features.")