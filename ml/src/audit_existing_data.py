import json
from pathlib import Path
from collections import Counter


# --------------------------------------------------
# Locate Hermes project files
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

ROADMAPS_FILE = PROJECT_ROOT / "data" / "roadmaps.json"


# --------------------------------------------------
# Load roadmap data
# --------------------------------------------------

with open(ROADMAPS_FILE, "r", encoding="utf-8") as file:
    roadmaps = json.load(file)


print("=" * 60)
print("HERMES EXISTING DATA AUDIT")
print("=" * 60)

print(f"\nTotal roadmaps: {len(roadmaps)}")


# --------------------------------------------------
# Basic roadmap information
# --------------------------------------------------

all_nodes = []

for roadmap in roadmaps:

    print("\n" + "-" * 60)

    print(f"ID: {roadmap.get('id')}")
    print(f"Goal: {roadmap.get('goal')}")
    print(f"Target role: {roadmap.get('targetRole')}")
    print(f"Skill level: {roadmap.get('skillLevel')}")
    print(f"Interests: {roadmap.get('interests')}")

    nodes = roadmap.get("nodes", [])

    print(f"Top-level nodes: {len(nodes)}")

    all_nodes.extend(nodes)


# --------------------------------------------------
# Recursively collect all nodes
# --------------------------------------------------

def collect_nodes(nodes):

    result = []

    for node in nodes:

        result.append(node)

        children = node.get("children", [])

        if children:
            result.extend(collect_nodes(children))

    return result


all_nodes = []

for roadmap in roadmaps:
    all_nodes.extend(
        collect_nodes(roadmap.get("nodes", []))
    )


# --------------------------------------------------
# Node statistics
# --------------------------------------------------

print("\n" + "=" * 60)
print("NODE STATISTICS")
print("=" * 60)

print(f"\nTotal learning nodes: {len(all_nodes)}")


statuses = Counter(
    node.get("status", "missing")
    for node in all_nodes
)

print("\nNode statuses:")

for status, count in statuses.items():
    print(f"  {status}: {count}")


# --------------------------------------------------
# Estimated hours
# --------------------------------------------------

total_hours = 0

for node in all_nodes:

    hours = node.get("estimatedHours", 0)

    if isinstance(hours, (int, float)):
        total_hours += hours


print(f"\nTotal estimated learning hours: {total_hours}")


# --------------------------------------------------
# Resources
# --------------------------------------------------

resource_types = Counter()

total_resources = 0

for node in all_nodes:

    resources = node.get("resources", [])

    total_resources += len(resources)

    for resource in resources:
        resource_types[
            resource.get("type", "unknown")
        ] += 1


print(f"\nTotal resources: {total_resources}")

print("\nResource types:")

for resource_type, count in resource_types.items():
    print(f"  {resource_type}: {count}")


# --------------------------------------------------
# Missing / suspicious data
# --------------------------------------------------

print("\n" + "=" * 60)
print("DATA QUALITY CHECK")
print("=" * 60)


missing_titles = []

missing_hours = []

missing_resources = []


for node in all_nodes:

    if not node.get("title"):
        missing_titles.append(node.get("id"))

    if "estimatedHours" not in node:
        missing_hours.append(node.get("id"))

    if not node.get("resources"):
        missing_resources.append(node.get("id"))


print(f"\nNodes missing title: {len(missing_titles)}")
print(f"Nodes missing estimated hours: {len(missing_hours)}")
print(f"Nodes missing resources: {len(missing_resources)}")


# --------------------------------------------------
# Print all roadmap goals and top-level skills
# --------------------------------------------------

print("\n" + "=" * 60)
print("ROADMAP → SKILL RELATIONSHIPS")
print("=" * 60)


for roadmap in roadmaps:

    print("\nGoal:")
    print(f"  {roadmap.get('goal')}")

    print("Target role:")
    print(f"  {roadmap.get('targetRole')}")

    print("Skills:")

    for node in roadmap.get("nodes", []):

        print(f"  - {node.get('title')}")


print("\n" + "=" * 60)
print("AUDIT COMPLETE")
print("=" * 60)