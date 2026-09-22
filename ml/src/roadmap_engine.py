from __future__ import annotations

import pandas as pd
import numpy as np
from pathlib import Path
from collections import defaultdict, deque


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"

SKILLS_FILE = DATA_DIR / "skills_model.csv"


# ============================================================
# DOMAIN CONFIGURATION
# ============================================================

DOMAIN_CONFIG = {
    "python": {
        "keywords": [
            "python",
            "backend",
            "api",
            "pytest",
            "async",
            "oop",
            "programming",
        ],
        "phases": {
            "Python Foundations": [
                "Python Core Syntax & Fundamentals",
                "Variables, Type Hinting & Operators",
                "Control Flow, Loops & Match-Case",
            ],
            "Core Python": [
                "Functions, Scopes & *args, **kwargs",
                "Data Structures & Collections Module",
                "List & Dictionary Comprehensions",
                "Collections Module (Counter, defaultdict, deque)",
            ],
            "Intermediate Python": [
                "Object-Oriented Python (OOP) & Dunder Methods",
                "Classes, @property, and Class/Static Methods",
                "Special Dunder Methods (__str__, __repr__, __enter__)",
                "Python 3.7+ Dataclasses",
                "Iterators, Generators & yield",
            ],
            "Advanced Python": [
                "Environments, Packaging & Pytest",
                "Asynchronous Programming (AsyncIO) & Concurrency",
            ],
        },
    },

    "data_analyst": {
        "keywords": [
            "data analyst",
            "data analysis",
            "sql",
            "pandas",
            "numpy",
            "visualization",
            "statistics",
            "data",
        ],
        "phases": {
            "Foundations": [
                "Core Foundations & SQL Essentials",
                "Python for Data Analysis & Wrangling",
            ],
            "Data Manipulation": [
                "Data Wrangling with NumPy & Pandas",
            ],
            "Analysis & Visualization": [
                "Exploratory Data Analysis & Visualization",
            ],
            "Statistics": [
                "Statistical Inference & Hypothesis Testing",
            ],
            "Data Engineering": [
                "Data Pipelines & Warehousing (dbt, BigQuery/Snowflake)",
            ],
        },
    },

    "ai_ml": {
        "keywords": [
            "ai",
            "machine learning",
            "deep learning",
            "neural network",
            "pytorch",
            "llm",
            "rag",
        ],
        "phases": {
            "Mathematical Foundations": [
                "Linear Algebra & Calculus for Machine Learning",
            ],
            "Deep Learning": [
                "PyTorch Deep Learning & Neural Networks",
            ],
            "Modern AI": [
                "LLMs, Vector Databases & RAG Pipelines",
            ],
        },
    },
}


# ============================================================
# LOAD DATA
# ============================================================

def load_skills() -> pd.DataFrame:
    print("\nLoading Hermes skill database...")

    df = pd.read_csv(SKILLS_FILE)

    required = [
        "skill_id",
        "name",
        "description",
        "estimated_hours",
        "roadmap_id",
        "parent_id",
        "parent_title",
        "node_type",
        "category",
    ]

    missing = [c for c in required if c not in df.columns]

    if missing:
        raise ValueError(
            f"Missing required columns: {missing}"
        )

    df["name"] = df["name"].fillna("").astype(str)
    df["description"] = df["description"].fillna("").astype(str)

    df["estimated_hours"] = pd.to_numeric(
        df["estimated_hours"],
        errors="coerce"
    ).fillna(0)

    df["category"] = (
        df["category"]
        .fillna("unknown")
        .astype(str)
        .str.lower()
    )

    return df


# ============================================================
# DOMAIN DETECTION
# ============================================================

def detect_domain(goal: str) -> str:
    text = goal.lower()

    if any(
        phrase in text
        for phrase in [
            "data analyst",
            "data analysis",
            "business analyst",
        ]
    ):
        return "data_analyst"

    if any(
        phrase in text
        for phrase in [
            "python developer",
            "python programmer",
            "python development",
        ]
    ):
        return "python"

    if any(
        phrase in text
        for phrase in [
            "ai engineer",
            "machine learning engineer",
            "ml engineer",
            "ai developer",
            "machine learning",
        ]
    ):
        return "ai_ml"

    return "general"


# ============================================================
# DUPLICATE / FOUNDATION HANDLING
# ============================================================

def is_foundation_node(row: pd.Series) -> bool:
    name = row["name"].lower()

    return (
        "fundamentals & core theory" in name
        and pd.notna(row["parent_id"])
    )


def remove_foundation_duplicates(
    df: pd.DataFrame,
) -> pd.DataFrame:

    mask = ~df.apply(
        is_foundation_node,
        axis=1
    )

    return df.loc[mask].copy()


# ============================================================
# PREREQUISITE GRAPH
# ============================================================

def build_graph(df: pd.DataFrame):

    children = defaultdict(list)
    parents = {}

    for _, row in df.iterrows():

        skill_id = row["skill_id"]

        parent_id = row["parent_id"]

        if pd.notna(parent_id):
            parent_id = str(parent_id)

            parents[skill_id] = parent_id
            children[parent_id].append(skill_id)

    return children, parents


# ============================================================
# DOMAIN FILTERING
# ============================================================

def filter_domain(
    df: pd.DataFrame,
    domain: str,
) -> pd.DataFrame:

    if domain == "general":
        return df.copy()

    config = DOMAIN_CONFIG[domain]

    categories = {
        "python": "python",
        "data_analyst": "data",
        "ai_ml": "ai_ml",
    }

    category = categories.get(domain)

    if category:
        result = df[
            df["category"] == category
        ].copy()

        if len(result) > 0:
            return result

    return df.copy()


# ============================================================
# PHASE ASSIGNMENT
# ============================================================

def assign_phase(
    skill_name: str,
    domain: str,
):

    if domain not in DOMAIN_CONFIG:
        return "General"

    phases = DOMAIN_CONFIG[domain]["phases"]

    for phase, skills in phases.items():

        if skill_name in skills:
            return phase

    return "Additional Skills"


# ============================================================
# PREREQUISITE ORDERING
# ============================================================

def prerequisite_depth(
    skill_id,
    lookup,
    cache=None,
):

    if cache is None:
        cache = {}

    if skill_id in cache:
        return cache[skill_id]

    row = lookup.get(skill_id)

    if row is None:
        return 0

    parent_id = row["parent_id"]

    if pd.isna(parent_id):
        cache[skill_id] = 0
        return 0

    depth = 1 + prerequisite_depth(
        str(parent_id),
        lookup,
        cache,
    )

    cache[skill_id] = depth

    return depth


# ============================================================
# BUILD ROADMAP
# ============================================================

def build_roadmap(
    df: pd.DataFrame,
    domain: str,
    max_skills: int = 15,
):

    df = filter_domain(df, domain)

    # Remove artificial "Fundamentals & Core Theory"
    # duplicate nodes.
    df = remove_foundation_duplicates(df)

    if domain in DOMAIN_CONFIG:

        ordered_names = []

        for phase_skills in DOMAIN_CONFIG[
            domain
        ]["phases"].values():

            ordered_names.extend(
                phase_skills
            )

        order_map = {
            name: index
            for index, name in enumerate(
                ordered_names
            )
        }

        df["_phase_order"] = (
            df["name"]
            .map(order_map)
            .fillna(9999)
        )

    else:
        df["_phase_order"] = 9999

    lookup = {
        row["skill_id"]: row
        for _, row in df.iterrows()
    }

    depth_cache = {}

    df["_depth"] = df["skill_id"].apply(
        lambda x: prerequisite_depth(
            x,
            lookup,
            depth_cache,
        )
    )

    # Important:
    # prerequisites first, then configured phase order.
    df = df.sort_values(
        [
            "_phase_order",
            "_depth",
            "name",
        ],
        ascending=[
            True,
            True,
            True,
        ],
    )

    df = df.head(max_skills).copy()

    df["phase"] = df["name"].apply(
        lambda x: assign_phase(
            x,
            domain,
        )
    )

    return df


# ============================================================
# DISPLAY
# ============================================================

def display_roadmap(
    df: pd.DataFrame,
    goal: str,
    level: str,
    domain: str,
):

    print("\n" + "=" * 70)
    print("HERMES LEARNING ROADMAP")
    print("=" * 70)

    print(f"\nGoal:   {goal}")
    print(f"Level:  {level}")
    print(f"Domain: {domain}")

    total_hours = int(
        df["estimated_hours"].sum()
    )

    print(
        f"\nTotal skills: {len(df)}"
    )

    print(
        f"Estimated learning time: "
        f"{total_hours} hours"
    )

    print("\n" + "-" * 70)

    grouped = df.groupby(
        "phase",
        sort=False
    )

    for phase, skills in grouped:

        print(
            f"PHASE — {phase}"
        )

        print("-" * 70)

        for index, (_, row) in enumerate(
            skills.iterrows(),
            start=1,
        ):

            print(
                f"\n{index}. {row['name']}"
            )

            print(
                f"   Category: "
                f"{row['category']}"
            )

            print(
                f"   Hours: "
                f"{int(row['estimated_hours'])}"
            )

            parent = row["parent_title"]

            if (
                pd.notna(parent)
                and str(parent).strip()
            ):
                print(
                    f"   Prerequisite: "
                    f"{parent}"
                )


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_skills()

    print(
        f"Loaded {len(df)} learning skills."
    )

    while True:

        print()

        goal = input(
            "Enter career/learning goal "
            "(or type 'exit'): "
        ).strip()

        if goal.lower() == "exit":
            break

        level = input(
            "Enter level "
            "(beginner/intermediate/advanced): "
        ).strip().lower()

        domain = detect_domain(goal)

        roadmap = build_roadmap(
            df=df,
            domain=domain,
            max_skills=15,
        )

        display_roadmap(
            roadmap,
            goal,
            level,
            domain,
        )


if __name__ == "__main__":
    main()