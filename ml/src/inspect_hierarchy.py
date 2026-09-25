import json
from pathlib import Path


# --------------------------------------------------
# Locate Hermes data
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

ROADMAPS_FILE = PROJECT_ROOT / "data" / "roadmaps.json"


# --------------------------------------------------
# Load data
# --------------------------------------------------

with open(ROADMAPS_FILE, "r", encoding="utf-8") as file:
    roadmaps = json.load(file)


# --------------------------------------------------
# Display hierarchy
# --------------------------------------------------

def print_nodes(nodes, depth=0, parent=None):

    for node in nodes:

        title = node.get("title", "Untitled")
        node_id = node.get("id", "NO_ID")

        indent = "    " * depth

        print(
            f"{indent}├── {title}"
        )

        print(
            f"{indent}│   ID: {node_id}"
        )

        if parent:
            print(
                f"{indent}│   Parent: {parent}"
            )

        children = node.get("children", [])

        if children:
            print_nodes(
                children,
                depth + 1,
                title
            )


# --------------------------------------------------
# Main
# --------------------------------------------------

print("=" * 70)
print("HERMES ROADMAP HIERARCHY")
print("=" * 70)


for roadmap in roadmaps:

    print("\n")
    print("#" * 70)

    print(f"Goal: {roadmap.get('goal')}")
    print(f"Target role: {roadmap.get('targetRole')}")
    print(f"Level: {roadmap.get('skillLevel')}")

    print("#" * 70)

    nodes = roadmap.get("nodes", [])

    print_nodes(nodes)


print("\n")
print("=" * 70)
print("HIERARCHY INSPECTION COMPLETE")
print("=" * 70)