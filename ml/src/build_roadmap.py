"""
HERMES ROADMAP BUILDER
======================

Takes the skill nodes retrieved by the semantic retrieval layer and converts
them into an ordered learning roadmap.

Pipeline:

User Goal
    ↓
Domain Detection
    ↓
Semantic Retrieval
    ↓
Domain Filtering
    ↓
Deduplication
    ↓
Level Filtering
    ↓
Dependency / hierarchy ordering
    ↓
Roadmap
"""

from __future__ import annotations

import os
import re
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(BASE_DIR, "data")

SKILLS_FILE = os.path.join(DATA_DIR, "skills_model.csv")


# ============================================================
# CONFIGURATION
# ============================================================

DEFAULT_TOP_K = 12


DOMAIN_ALIASES = {
    "python": [
        "python",
        "python developer",
        "python development",
        "django",
        "flask",
        "fastapi",
    ],

    "data": [
        "data analyst",
        "data analysis",
        "data analytics",
        "business analyst",
        "data scientist",
        "data science",
        "sql",
        "pandas",
        "numpy",
    ],

    "ai_ml": [
        "ai engineer",
        "ai developer",
        "artificial intelligence",
        "machine learning",
        "ml engineer",
        "machine learning engineer",
        "deep learning",
        "llm engineer",
        "generative ai",
        "gen ai",
        "rag",
    ],

    "frontend": [
        "frontend",
        "front end",
        "frontend developer",
        "web developer",
        "react developer",
        "javascript developer",
        "ui developer",
    ],

    "backend": [
        "backend",
        "back end",
        "backend developer",
        "api developer",
        "server developer",
    ],

    "cpp": [
        "c++",
        "cpp",
        "c++ developer",
        "systems programmer",
        "systems programming",
    ],

    "devops": [
        "devops",
        "devops engineer",
        "site reliability",
        "sre",
        "cloud engineer",
    ],
}


# ============================================================
# ROADMAP PHASE DEFINITIONS
# ============================================================

PHASE_RULES = {
    "python": [
        (
            "Foundations",
            [
                "core syntax",
                "variables",
                "type hinting",
                "operators",
                "control flow",
                "loops",
                "match-case",
            ],
        ),
        (
            "Functions & Data Structures",
            [
                "functions",
                "args",
                "kwargs",
                "data structures",
                "collections",
                "comprehensions",
            ],
        ),
        (
            "Intermediate Python",
            [
                "iterators",
                "generators",
                "dataclasses",
                "object-oriented",
                "oop",
                "dunder",
                "classes",
                "property",
            ],
        ),
        (
            "Professional Python",
            [
                "packaging",
                "pytest",
                "environment",
                "asyncio",
                "asynchronous",
                "concurrency",
            ],
        ),
    ],

    "data": [
        (
            "Foundations",
            [
                "sql",
                "core foundations",
                "python for data",
                "python for data analysis",
            ],
        ),
        (
            "Data Manipulation",
            [
                "numpy",
                "pandas",
                "data wrangling",
                "data analysis",
            ],
        ),
        (
            "Exploratory Analysis",
            [
                "exploratory",
                "visualization",
            ],
        ),
        (
            "Statistics",
            [
                "statistical",
                "hypothesis",
                "inference",
            ],
        ),
        (
            "Data Engineering",
            [
                "data pipelines",
                "warehousing",
                "dbt",
                "bigquery",
                "snowflake",
            ],
        ),
    ],

    "ai_ml": [
        (
            "Mathematical Foundations",
            [
                "linear algebra",
                "calculus",
            ],
        ),
        (
            "Deep Learning",
            [
                "pytorch",
                "deep learning",
                "neural networks",
            ],
        ),
        (
            "Modern AI",
            [
                "llm",
                "vector database",
                "rag",
                "generative ai",
            ],
        ),
    ],

    "frontend": [
        (
            "Web Foundations",
            [
                "html",
                "css",
                "web foundations",
                "semantic",
                "accessibility",
            ],
        ),
        (
            "JavaScript",
            [
                "javascript",
                "closures",
                "scope",
                "prototype",
                "async",
                "event loop",
            ],
        ),
        (
            "React & State",
            [
                "react",
                "hooks",
                "context",
                "zustand",
                "state management",
            ],
        ),
        (
            "Frontend Engineering",
            [
                "performance",
                "core web vitals",
                "design systems",
                "tailwind",
            ],
        ),
    ],

    "backend": [
        (
            "Backend Foundations",
            [
                "backend",
                "api",
                "web api",
            ],
        ),
        (
            "Database & API Engineering",
            [
                "database",
                "orm",
                "fastapi",
                "api engineering",
            ],
        ),
        (
            "Production Engineering",
            [
                "performance",
                "optimization",
            ],
        ),
    ],

    "cpp": [
        (
            "C++ Foundations",
            [
                "c++ foundations",
                "compilation",
                "build systems",
                "cmake",
            ],
        ),
        (
            "Memory & Resource Management",
            [
                "memory",
                "pointers",
                "references",
                "raii",
                "smart pointers",
            ],
        ),
        (
            "Object-Oriented C++",
            [
                "object-oriented",
                "rule of zero",
                "rule of three",
                "rule of five",
            ],
        ),
        (
            "STL & Generic Programming",
            [
                "stl",
                "containers",
                "algorithms",
                "templates",
                "metaprogramming",
                "concepts",
            ],
        ),
    ],

    "devops": [
        (
            "DevOps Foundations",
            [
                "testing",
                "ci/cd",
            ],
        ),
        (
            "Deployment",
            [
                "deployment",
                "production",
                "docker",
                "cloud",
            ],
        ),
    ],
}


# ============================================================
# LOAD DATA
# ============================================================

def load_skills() -> pd.DataFrame:
    """Load the cleaned learning-skill dataset."""

    if not os.path.exists(SKILLS_FILE):
        raise FileNotFoundError(
            f"Could not find skills dataset:\n{SKILLS_FILE}"
        )

    df = pd.read_csv(SKILLS_FILE)

    required_columns = [
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

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "skills_model.csv is missing required columns: "
            + ", ".join(missing)
        )

    return df.copy()


# ============================================================
# DOMAIN DETECTION
# ============================================================

def detect_domain(goal: str) -> str:
    """
    Detect the most likely career domain from the user's goal.

    Uses explicit career phrases first, then keyword matching.
    """

    text = goal.lower().strip()

    # Strong exact phrases first
    if "data analyst" in text:
        return "data"

    if "data scientist" in text:
        return "data"

    if "ai engineer" in text:
        return "ai_ml"

    if "machine learning engineer" in text:
        return "ai_ml"

    if "ml engineer" in text:
        return "ai_ml"

    if "python developer" in text:
        return "python"

    if "frontend developer" in text:
        return "frontend"

    if "front end developer" in text:
        return "frontend"

    if "backend developer" in text:
        return "backend"

    if "back end developer" in text:
        return "backend"

    if "devops engineer" in text:
        return "devops"

    if "c++ developer" in text:
        return "cpp"

    # General keyword scoring
    scores = {}

    for domain, keywords in DOMAIN_ALIASES.items():
        score = 0

        for keyword in keywords:
            if keyword in text:
                # Longer phrases receive more weight.
                score += max(1, len(keyword.split()))

        scores[domain] = score

    if not scores:
        return "general"

    best_domain = max(scores, key=scores.get)

    if scores[best_domain] == 0:
        return "general"

    return best_domain


# ============================================================
# TEXT HELPERS
# ============================================================

def normalize_text(value) -> str:
    if pd.isna(value):
        return ""

    return re.sub(
        r"\s+",
        " ",
        str(value).lower().strip(),
    )


def combined_skill_text(row: pd.Series) -> str:
    """
    Build a searchable text representation of a skill.
    """

    parts = [
        row.get("name", ""),
        row.get("description", ""),
        row.get("parent_title", ""),
        row.get("category", ""),
    ]

    return normalize_text(" ".join(map(str, parts)))


# ============================================================
# DUPLICATE REMOVAL
# ============================================================

def remove_duplicate_skills(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove duplicate / near-duplicate learning nodes.

    Priority:
        1. Keep the node with the more useful estimated_hours.
        2. Prefer the non-'Fundamentals & Core Theory' version when
           both are effectively the same skill.
    """

    if df.empty:
        return df

    work = df.copy()

    work["_name_normalized"] = (
        work["name"]
        .fillna("")
        .astype(str)
        .str.lower()
        .str.strip()
    )

    work["_is_fundamentals"] = work["_name_normalized"].str.startswith(
        "fundamentals & core theory"
    )

    # First remove exact names.
    work = (
        work.sort_values(
            by=["_is_fundamentals", "estimated_hours"],
            ascending=[True, False],
        )
        .drop_duplicates(
            subset=["_name_normalized"],
            keep="first",
        )
    )

    # Remove obvious "Fundamentals & Core Theory of X" duplicates
    # where X itself exists.
    names = set(
        work["_name_normalized"].tolist()
    )

    remove_ids = []

    for index, row in work.iterrows():

        name = row["_name_normalized"]

        prefix = "fundamentals & core theory of "

        if name.startswith(prefix):
            base_name = name[len(prefix):].strip()

            if base_name in names:
                remove_ids.append(index)

    work = work.drop(index=remove_ids)

    return work.drop(
        columns=["_name_normalized", "_is_fundamentals"],
        errors="ignore",
    )


# ============================================================
# DOMAIN FILTERING
# ============================================================

def filter_domain(
    df: pd.DataFrame,
    domain: str,
) -> pd.DataFrame:
    """
    Restrict results to the target domain.

    If the dataset does not contain enough domain skills,
    progressively relax the filter.
    """

    if domain == "general":
        return df.copy()

    domain_df = df[
        df["category"]
        .fillna("")
        .astype(str)
        .str.lower()
        == domain
    ].copy()

    # If the domain exists, use it.
    if len(domain_df) >= 3:
        return domain_df

    return df.copy()


# ============================================================
# LEVEL FILTERING
# ============================================================

def level_score(
    row: pd.Series,
    level: str,
) -> float:
    """
    Estimate how suitable a skill is for the requested level.

    This is intentionally conservative because the source dataset
    does not contain an explicit difficulty column.
    """

    text = combined_skill_text(row)

    beginner_terms = [
        "fundamentals",
        "foundations",
        "core",
        "syntax",
        "variables",
        "control flow",
        "sql essentials",
        "html",
        "css",
    ]

    intermediate_terms = [
        "object-oriented",
        "oop",
        "api",
        "database",
        "pandas",
        "numpy",
        "visualization",
        "statistics",
        "async",
        "react",
        "state management",
    ]

    advanced_terms = [
        "advanced",
        "performance",
        "optimization",
        "metaprogramming",
        "deep learning",
        "llm",
        "vector database",
        "rag",
        "warehousing",
        "ci/cd",
    ]

    score = 0.0

    if level == "beginner":
        for term in beginner_terms:
            if term in text:
                score += 0.12

        for term in advanced_terms:
            if term in text:
                score -= 0.10

    elif level == "intermediate":
        for term in intermediate_terms:
            if term in text:
                score += 0.10

    elif level == "advanced":
        for term in advanced_terms:
            if term in text:
                score += 0.15

    return score


# ============================================================
# PHASE DETECTION
# ============================================================

def detect_phase(
    name: str,
    domain: str,
) -> Tuple[int, str]:
    """
    Determine which roadmap phase a skill belongs to.
    """

    text = normalize_text(name)

    rules = PHASE_RULES.get(domain, [])

    if not rules:
        return 0, "Core Skills"

    for phase_index, (phase_name, keywords) in enumerate(rules):
        for keyword in keywords:
            if keyword in text:
                return phase_index, phase_name

    # Unknown skills go after known foundational material.
    return len(rules), "Additional Skills"


# ============================================================
# PREREQUISITE ORDERING
# ============================================================

def prerequisite_score(
    row: pd.Series,
    domain: str,
) -> float:
    """
    Gives foundational skills a higher priority.

    Lower score = should generally appear earlier.
    """

    phase_index, _ = detect_phase(
        row["name"],
        domain,
    )

    return float(phase_index)


# ============================================================
# BUILD ROADMAP
# ============================================================

def build_roadmap(
    df: pd.DataFrame,
    goal: str,
    level: str,
    top_k: int = DEFAULT_TOP_K,
) -> Dict:
    """
    Build an ordered roadmap from the skill dataset.

    NOTE:
    This function expects the dataframe to already contain a
    'similarity' column if semantic retrieval has been performed.
    """

    if df.empty:
        return {
            "goal": goal,
            "level": level,
            "domain": detect_domain(goal),
            "phases": [],
        }

    domain = detect_domain(goal)

    work = df.copy()

    # --------------------------------------------------------
    # Domain filtering
    # --------------------------------------------------------

    work = filter_domain(
        work,
        domain,
    )

    # --------------------------------------------------------
    # Deduplication
    # --------------------------------------------------------

    work = remove_duplicate_skills(work)

    # --------------------------------------------------------
    # Level scoring
    # --------------------------------------------------------

    work["_level_score"] = work.apply(
        lambda row: level_score(row, level),
        axis=1,
    )

    # --------------------------------------------------------
    # Semantic score
    # --------------------------------------------------------

    if "similarity" not in work.columns:
        work["similarity"] = 0.0

    work["similarity"] = pd.to_numeric(
        work["similarity"],
        errors="coerce",
    ).fillna(0.0)

    # --------------------------------------------------------
    # Phase
    # --------------------------------------------------------

    phase_info = work["name"].apply(
        lambda name: detect_phase(
            name,
            domain,
        )
    )

    work["_phase_index"] = phase_info.apply(
        lambda value: value[0]
    )

    work["_phase_name"] = phase_info.apply(
        lambda value: value[1]
    )

    # --------------------------------------------------------
    # Final recommendation score
    # --------------------------------------------------------

    #
    # Semantic relevance is still the strongest signal.
    #
    # Level fit modifies it.
    #
    # Phase ordering does NOT directly overpower semantic relevance.
    #

    work["_recommendation_score"] = (
        work["similarity"] * 0.75
        + work["_level_score"] * 0.25
    )

    # --------------------------------------------------------
    # Sort by phase first, relevance second
    # --------------------------------------------------------

    work = work.sort_values(
        by=[
            "_phase_index",
            "_recommendation_score",
            "estimated_hours",
        ],
        ascending=[
            True,
            False,
            True,
        ],
    )

    # --------------------------------------------------------
    # Limit total skills
    # --------------------------------------------------------

    work = work.head(top_k)

    # --------------------------------------------------------
    # Rebuild phase groups
    # --------------------------------------------------------

    phases = []

    for (
        phase_index,
        phase_name,
    ), group in work.groupby(
        ["_phase_index", "_phase_name"],
        sort=True,
    ):

        skills = []

        for position, (_, row) in enumerate(
            group.iterrows(),
            start=1,
        ):

            skills.append(
                {
                    "position": position,
                    "skill_id": str(row["skill_id"]),
                    "name": str(row["name"]),
                    "description": str(row["description"]),
                    "category": str(row["category"]),
                    "node_type": str(row["node_type"]),
                    "estimated_hours": float(
                        row["estimated_hours"]
                    ),
                    "similarity": round(
                        float(row["similarity"]),
                        4,
                    ),
                    "recommendation_score": round(
                        float(
                            row["_recommendation_score"]
                        ),
                        4,
                    ),
                    "parent_id": (
                        None
                        if pd.isna(row["parent_id"])
                        else str(row["parent_id"])
                    ),
                    "parent_title": (
                        None
                        if pd.isna(row["parent_title"])
                        else str(row["parent_title"])
                    ),
                }
            )

        phases.append(
            {
                "phase": int(phase_index) + 1,
                "title": phase_name,
                "skills": skills,
            }
        )

    total_hours = sum(
        skill["estimated_hours"]
        for phase in phases
        for skill in phase["skills"]
    )

    return {
        "goal": goal,
        "level": level,
        "domain": domain,
        "total_skills": sum(
            len(phase["skills"])
            for phase in phases
        ),
        "total_hours": total_hours,
        "phases": phases,
    }


# ============================================================
# DISPLAY
# ============================================================

def print_roadmap(roadmap: Dict) -> None:

    print()
    print("=" * 70)
    print("HERMES LEARNING ROADMAP")
    print("=" * 70)

    print()
    print(f"Goal:   {roadmap['goal']}")
    print(f"Level:  {roadmap['level']}")
    print(f"Domain: {roadmap['domain']}")

    print()
    print(
        f"Total skills: {roadmap['total_skills']}"
    )

    print(
        f"Estimated learning time: "
        f"{roadmap['total_hours']:.0f} hours"
    )

    print()

    for phase in roadmap["phases"]:

        print("-" * 70)
        print(
            f"PHASE {phase['phase']} — "
            f"{phase['title']}"
        )
        print("-" * 70)

        for skill in phase["skills"]:

            print(
                f"\n{skill['position']}. "
                f"{skill['name']}"
            )

            print(
                f"   Category: {skill['category']}"
            )

            print(
                f"   Hours: {skill['estimated_hours']:.0f}"
            )

            print(
                f"   Relevance: "
                f"{skill['similarity']:.4f}"
            )


# ============================================================
# SEMANTIC RETRIEVAL INTEGRATION
# ============================================================

def load_embeddings() -> Tuple[pd.DataFrame, np.ndarray]:
    """
    Load skills_model.csv together with the corresponding
    embeddings generated by create_embeddings.py.
    """

    embeddings_file = os.path.join(
        DATA_DIR,
        "skills_embeddings.csv",
    )

    if not os.path.exists(embeddings_file):
        raise FileNotFoundError(
            f"Embeddings file not found:\n"
            f"{embeddings_file}\n\n"
            f"Run:\n"
            f"python ml\\src\\create_embeddings.py"
        )

    df = pd.read_csv(
        embeddings_file
    )

    vector_columns = [
        column
        for column in df.columns
        if column.startswith("embedding_")
    ]

    if not vector_columns:
        raise ValueError(
            "No embedding columns found in skills_embeddings.csv"
        )

    # Sort embedding_0, embedding_1, ...
    vector_columns.sort(
        key=lambda column: int(
            column.split("_")[1]
        )
    )

    embeddings = (
        df[vector_columns]
        .apply(
            pd.to_numeric,
            errors="coerce",
        )
        .fillna(0.0)
        .to_numpy(
            dtype=np.float32
        )
    )

    return df, embeddings


def cosine_similarity(
    query_embedding: np.ndarray,
    embeddings: np.ndarray,
) -> np.ndarray:

    query_norm = np.linalg.norm(
        query_embedding
    )

    embedding_norms = np.linalg.norm(
        embeddings,
        axis=1,
    )

    if query_norm == 0:
        return np.zeros(
            len(embeddings),
            dtype=np.float32,
        )

    safe_norms = np.where(
        embedding_norms == 0,
        1.0,
        embedding_norms,
    )

    return (
        embeddings @ query_embedding
    ) / (
        safe_norms * query_norm
    )


# ============================================================
# MODEL LOADING
# ============================================================

def load_embedding_model():
    """
    Load SentenceTransformer lazily.
    """

    try:
        from sentence_transformers import (
            SentenceTransformer,
        )
    except ImportError:
        raise ImportError(
            "sentence-transformers is not installed.\n"
            "Install it with:\n"
            "pip install sentence-transformers"
        )

    model_name = (
        "sentence-transformers/"
        "all-MiniLM-L6-v2"
    )

    print()
    print(
        f"Loading model: {model_name}"
    )

    return SentenceTransformer(
        model_name
    )


# ============================================================
# RETRIEVE + BUILD
# ============================================================

def retrieve_and_build(
    goal: str,
    level: str,
    top_k: int = DEFAULT_TOP_K,
) -> Dict:

    embeddings_df, embeddings = (
        load_embeddings()
    )

    model = load_embedding_model()

    query_embedding = model.encode(
        goal,
        convert_to_numpy=True,
        normalize_embeddings=False,
    ).astype(
        np.float32
    )

    similarities = cosine_similarity(
        query_embedding,
        embeddings,
    )

    embeddings_df = embeddings_df.copy()

    embeddings_df["similarity"] = (
        similarities
    )

    roadmap = build_roadmap(
        embeddings_df,
        goal,
        level,
        top_k=top_k,
    )

    return roadmap


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("HERMES ROADMAP BUILDER")
    print("=" * 70)

    while True:

        print()

        goal = input(
            "Enter career/learning goal "
            "(or type 'exit'): "
        ).strip()

        if goal.lower() == "exit":
            break

        if not goal:
            print(
                "Goal cannot be empty."
            )
            continue

        level = input(
            "Enter level "
            "(beginner/intermediate/advanced): "
        ).strip().lower()

        if level not in {
            "beginner",
            "intermediate",
            "advanced",
        }:

            print(
                "Invalid level. "
                "Use beginner, intermediate, "
                "or advanced."
            )

            continue

        try:

            roadmap = retrieve_and_build(
                goal=goal,
                level=level,
                top_k=12,
            )

            print_roadmap(
                roadmap
            )

        except Exception as exc:

            print()
            print(
                "ERROR:"
            )
            print(exc)


if __name__ == "__main__":
    main()