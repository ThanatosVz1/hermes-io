import json
import csv
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = PROJECT_ROOT / "data" / "roadmaps.json"
OUTPUT_FILE = PROJECT_ROOT / "ml" / "data" / "skills_clean.csv"


def collect_nodes(nodes, roadmap_id, parent_id=None, parent_title=None):
    records = []

    for node in nodes:

        title = node.get("title", "").strip()
        description = node.get("description", "").strip()

        if not title:
            continue

        record = {
            "skill_id": node.get("id", ""),
            "name": title,
            "description": description,
            "estimated_hours": node.get("estimatedHours", 0),
            "roadmap_id": roadmap_id,
            "parent_id": parent_id or "",
            "parent_title": parent_title or "",
            "node_type": classify_node(title),
        }

        records.append(record)

        children = node.get("children", [])

        if children:
            records.extend(
                collect_nodes(
                    children,
                    roadmap_id,
                    node.get("id"),
                    title
                )
            )

    return records


def classify_node(title):
    title_lower = title.lower()

    if "capstone" in title_lower:
        return "project"

    if "mini-project" in title_lower:
        return "project"

    if "checkpoint" in title_lower:
        return "practice"

    if "hands-on" in title_lower:
        return "practice"

    if "tooling" in title_lower:
        return "tooling"

    return "skill"


def infer_category(title, description):

    text = f"{title} {description}".lower()

    categories = {

        "ai_ml": [
            "machine learning",
            "deep learning",
            "pytorch",
            "llm",
            "rag",
            "vector database",
            "neural network",
            "linear algebra",
            "calculus",
            "ai/ml",
            "artificial intelligence",
        ],

        "data": [
            "data analysis",
            "data analyst",
            "data science",
            "data wrangling",
            "pandas",
            "numpy",
            "statistics",
            "statistical inference",
            "hypothesis testing",
            "exploratory data analysis",
            "visualization",
            "analytics",
            "sql",
            "data pipelines",
            "data warehousing",
            "bigquery",
            "snowflake",
            "dbt",
        ],

        "python": [
            "python core",
            "python syntax",
            "python programming",
            "python developer",
            "object-oriented python",
            "python oop",
            "asyncio",
            "pytest",
            "dataclass",
            "args",
            "kwargs",
            "iterators",
            "generators",
            "collections module",
            "dunder methods",
            "property",
            "python environments",
            "python packaging",
        ],

        "cpp": [
            "c++",
            "cmake",
            "stl",
            "raii",
            "smart pointer",
            "templates",
            "jthread",
            "simd",
            "pass-by-value",
            "pass-by-reference",
            "memory management",
            "pointers",
            "references",
            "rule of zero",
            "rule of three",
            "rule of five",
            "object-oriented c++",
            "c++ functions",
            "compilation pipeline",
            "concurrency",
        ],

        "frontend": [
            "html",
            "css",
            "frontend",
            "react",
            "vue",
            "svelte",
            "javascript",
            "dom",
            "tailwind",
            "closure",
            "prototype",
            "hooks",
            "web foundations",
            "design systems",
            "core web vitals",
            "responsive",
            "saas dashboard",
        ],

        "backend": [
            "backend",
            "fastapi",
            "node.js",
            "rest api",
            "graphql",
            "orm",
            "postgresql",
            "prisma",
            "api engineering",
            "database architecture",
        ],

        "devops": [
            "docker",
            "ci/cd",
            "deployment",
            "cloud",
            "github actions",
            "devops",
            "production deployment",
        ],

        "cybersecurity": [
            "security",
            "soc",
            "cybersecurity",
            "siem",
            "network security",
            "comptia",
        ],

        "quantum": [
            "quantum",
            "qiskit",
        ],
    }

    for category, keywords in categories.items():

        for keyword in keywords:

            if keyword in text:
                return category

    return "unknown"


def main():

    with open(INPUT_FILE, "r", encoding="utf-8") as file:
        roadmaps = json.load(file)

    records = []

    for roadmap in roadmaps:

        records.extend(
            collect_nodes(
                roadmap.get("nodes", []),
                roadmap.get("id", "")
            )
        )

    for record in records:

        record["category"] = infer_category(
            record["name"],
            record["description"]
        )

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    fieldnames = [
        "skill_id",
        "name",
        "description",
        "estimated_hours",
        "roadmap_id",
        "parent_id",
        "parent_title",
        "node_type",
        "category"
    ]

    with open(
        OUTPUT_FILE,
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames
        )

        writer.writeheader()
        writer.writerows(records)

    print("=" * 60)
    print("CLEAN DATASET CREATED")
    print("=" * 60)

    print(f"\nTotal records: {len(records)}")

    categories = {}

    for record in records:

        category = record["category"]

        categories[category] = categories.get(
            category, 0
        ) + 1

    print("\nCategories:")

    for category, count in sorted(categories.items()):
        print(f"  {category}: {count}")

    print("\nNode types:")

    node_types = {}

    for record in records:

        node_type = record["node_type"]

        node_types[node_type] = node_types.get(
            node_type, 0
        ) + 1

    for node_type, count in sorted(node_types.items()):
        print(f"  {node_type}: {count}")

    print("\nSaved to:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    main()