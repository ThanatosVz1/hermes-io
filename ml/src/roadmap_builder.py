import os
import sys
from collections import defaultdict

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKILLS_FILE = os.path.join(BASE_DIR, "data", "skills_model.csv")
EMBEDDINGS_FILE = os.path.join(BASE_DIR, "data", "skills_embeddings.csv")

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

TOP_K_RETRIEVAL = 15
MAX_ROADMAP_SKILLS = 15


# ============================================================
# DOMAIN DETECTION
# ============================================================

DOMAIN_KEYWORDS = {
    "python": [
        "python developer",
        "python development",
        "python programmer",
        "backend python",
        "python",
    ],

    "data": [
        "data analyst",
        "data analysis",
        "data analytics",
        "business analyst",
        "data scientist",
        "data science",
        "analytics",
    ],

    "ai_ml": [
        "ai engineer",
        "artificial intelligence",
        "machine learning",
        "ml engineer",
        "machine learning engineer",
        "deep learning",
        "llm engineer",
        "generative ai",
        "genai",
    ],

    "frontend": [
        "frontend developer",
        "front end developer",
        "web developer",
        "react developer",
        "frontend",
        "react",
        "javascript developer",
    ],

    "backend": [
        "backend developer",
        "back end developer",
        "api developer",
        "server developer",
        "backend",
    ],

    "cpp": [
        "c++ developer",
        "cpp developer",
        "c++ programmer",
        "cpp programmer",
        "c++",
        "cpp",
    ],

    "devops": [
        "devops engineer",
        "devops",
        "cloud engineer",
        "deployment engineer",
        "site reliability",
        "sre",
    ],
}


def detect_domain(goal):
    text = goal.lower().strip()

    # Exact / strong phrase matching first
    for domain, keywords in DOMAIN_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                return domain

    # Fallback keyword matching
    if any(word in text for word in ["analyst", "analytics", "dashboard", "reporting"]):
        return "data"

    if any(word in text for word in ["machine learning", "deep learning", "llm", "genai"]):
        return "ai_ml"

    if "python" in text:
        return "python"

    if "react" in text or "frontend" in text:
        return "frontend"

    if "backend" in text or "api" in text:
        return "backend"

    if "c++" in text or "cpp" in text:
        return "cpp"

    if "devops" in text or "cloud" in text:
        return "devops"

    return "general"


# ============================================================
# LOAD DATA
# ============================================================

def load_skills():
    if not os.path.exists(SKILLS_FILE):
        raise FileNotFoundError(
            f"Skills dataset not found:\n{SKILLS_FILE}"
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

    missing = [c for c in required_columns if c not in df.columns]

    if missing:
        raise ValueError(
            f"skills_model.csv is missing columns: {missing}"
        )

    df["estimated_hours"] = pd.to_numeric(
        df["estimated_hours"],
        errors="coerce"
    ).fillna(0)

    df["parent_id"] = df["parent_id"].fillna("").astype(str)
    df["skill_id"] = df["skill_id"].astype(str)
    df["category"] = df["category"].fillna("").astype(str)
    df["name"] = df["name"].fillna("").astype(str)
    df["description"] = df["description"].fillna("").astype(str)

    return df


def load_embeddings():
    if not os.path.exists(EMBEDDINGS_FILE):
        raise FileNotFoundError(
            f"Embeddings file not found:\n{EMBEDDINGS_FILE}\n\n"
            f"Run:\n"
            f"python ml\\src\\create_embeddings.py"
        )

    df = pd.read_csv(EMBEDDINGS_FILE)

    vector_columns = [
        column
        for column in df.columns
        if column.startswith("embedding_")
    ]

    if not vector_columns:
        raise ValueError("No embedding columns found.")

    embeddings = df[vector_columns].to_numpy(dtype=np.float32)

    return df, embeddings


# ============================================================
# EMBEDDING SEARCH
# ============================================================

def semantic_search(goal, model, embeddings_df, embeddings, skills_df):
    query_embedding = model.encode(
        goal,
        normalize_embeddings=True
    )

    query_embedding = np.asarray(
        query_embedding,
        dtype=np.float32
    )

    skill_embeddings = np.asarray(
        embeddings,
        dtype=np.float32
    )

    similarities = np.dot(
        skill_embeddings,
        query_embedding
    )

    result = embeddings_df.copy()

    result["similarity"] = similarities

    # Keep only IDs that exist in skills_model.csv
    valid_ids = set(skills_df["skill_id"].astype(str))

    result["skill_id"] = result["skill_id"].astype(str)

    result = result[
        result["skill_id"].isin(valid_ids)
    ].copy()

    # Merge metadata safely
    metadata_columns = [
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

    metadata = skills_df[metadata_columns].copy()

    # Remove duplicate metadata IDs if any
    metadata = metadata.drop_duplicates(
        subset=["skill_id"]
    )

    # Remove columns already present in embeddings dataframe
    existing_metadata = [
        c for c in metadata_columns
        if c not in result.columns or c == "skill_id"
    ]

    result = result.drop(
        columns=[
            c for c in metadata_columns
            if c in result.columns and c != "skill_id"
        ],
        errors="ignore"
    )

    result = result.merge(
        metadata,
        on="skill_id",
        how="inner"
    )

    result = result.sort_values(
        "similarity",
        ascending=False
    )

    return result.head(TOP_K_RETRIEVAL).copy()


# ============================================================
# DOMAIN FILTERING
# ============================================================

def filter_by_domain(results, domain):
    if domain == "general":
        return results.copy()

    domain_results = results[
        results["category"] == domain
    ].copy()

    # If semantic search failed to retrieve enough domain
    # results, return what we have rather than producing
    # an empty roadmap.
    if len(domain_results) >= 3:
        return domain_results

    return results.copy()


# ============================================================
# PREREQUISITE / PARENT EXPANSION
# ============================================================

def build_skill_lookup(skills_df):
    return {
        str(row["skill_id"]): row
        for _, row in skills_df.iterrows()
    }


def add_parents(results, skills_df):
    """
    Add parent nodes required by retrieved child nodes.

    Example:

    Variables, Type Hinting & Operators
        parent ->
    Python Core Syntax & Fundamentals

    The parent is automatically added.
    """

    lookup = build_skill_lookup(skills_df)

    selected = {
        str(row["skill_id"]): row
        for _, row in results.iterrows()
    }

    changed = True

    while changed:
        changed = False

        current_rows = list(selected.values())

        for row in current_rows:
            parent_id = str(row.get("parent_id", "")).strip()

            if not parent_id:
                continue

            if parent_id not in lookup:
                continue

            if parent_id in selected:
                continue

            parent = lookup[parent_id]

            parent_copy = parent.copy()

            # Parent wasn't retrieved semantically,
            # so give it a neutral relevance score.
            parent_copy["similarity"] = 0.0

            selected[parent_id] = parent_copy

            changed = True

    expanded = pd.DataFrame(
        list(selected.values())
    )

    return expanded


# ============================================================
# REMOVE DUPLICATES / BAD NODES
# ============================================================

def clean_selected_skills(df):
    if df.empty:
        return df

    df = df.copy()

    # Only learning skills should enter the roadmap.
    if "node_type" in df.columns:
        df = df[
            df["node_type"].astype(str).str.lower() == "skill"
        ]

    # Remove duplicate IDs.
    df = df.drop_duplicates(
        subset=["skill_id"]
    )

    # Remove obviously empty names.
    df = df[
        df["name"].astype(str).str.strip() != ""
    ]

    return df


# ============================================================
# DEPENDENCY DEPTH
# ============================================================

def calculate_depth(skill_id, lookup, memo=None, visiting=None):
    """
    Calculates how deep a skill is in the prerequisite tree.

    Root skill:
        depth = 0

    Child:
        depth = 1

    Grandchild:
        depth = 2
    """

    if memo is None:
        memo = {}

    if visiting is None:
        visiting = set()

    skill_id = str(skill_id)

    if skill_id in memo:
        return memo[skill_id]

    if skill_id in visiting:
        # Protect against accidental cyclic data.
        return 0

    if skill_id not in lookup:
        return 0

    visiting.add(skill_id)

    row = lookup[skill_id]

    parent_id = str(
        row.get("parent_id", "")
    ).strip()

    if not parent_id or parent_id not in lookup:
        depth = 0
    else:
        depth = 1 + calculate_depth(
            parent_id,
            lookup,
            memo,
            visiting
        )

    visiting.remove(skill_id)

    memo[skill_id] = depth

    return depth


def add_dependency_depth(df, skills_df):
    lookup = build_skill_lookup(skills_df)

    memo = {}

    df = df.copy()

    df["dependency_depth"] = df["skill_id"].apply(
        lambda skill_id: calculate_depth(
            skill_id,
            lookup,
            memo
        )
    )

    return df


# ============================================================
# ROADMAP PHASES
# ============================================================

PHASE_NAMES = {
    "python": {
        0: "Python Foundations",
        1: "Core Python",
        2: "Intermediate Python",
        3: "Advanced Python",
    },

    "data": {
        0: "Foundations",
        1: "Data Manipulation",
        2: "Analysis & Visualization",
        3: "Statistics",
        4: "Data Engineering",
    },

    "ai_ml": {
        0: "Mathematical Foundations",
        1: "Machine Learning",
        2: "Deep Learning",
        3: "Modern AI",
    },

    "frontend": {
        0: "Web Foundations",
        1: "JavaScript",
        2: "Frontend Frameworks",
        3: "Production Frontend",
    },

    "backend": {
        0: "Backend Foundations",
        1: "APIs & Databases",
        2: "Production Backend",
    },

    "cpp": {
        0: "C++ Foundations",
        1: "Memory & Resource Management",
        2: "Object-Oriented C++",
        3: "Modern C++",
    },

    "devops": {
        0: "DevOps Foundations",
        1: "CI/CD & Production",
    },

    "general": {
        0: "Foundations",
        1: "Core Skills",
        2: "Intermediate Skills",
        3: "Advanced Skills",
    },
}


def infer_phase(row, domain):
    name = row["name"].lower()
    depth = int(row.get("dependency_depth", 0))

    # --------------------------------------------------------
    # DATA ANALYST
    # --------------------------------------------------------

    if domain == "data":

        if any(
            keyword in name
            for keyword in [
                "sql",
                "core foundations",
                "python for data",
                "fundamentals & core theory of python",
            ]
        ):
            return 0

        if any(
            keyword in name
            for keyword in [
                "numpy",
                "pandas",
                "wrangling",
                "data manipulation",
            ]
        ):
            return 1

        if any(
            keyword in name
            for keyword in [
                "exploratory",
                "visualization",
                "analysis",
            ]
        ):
            return 2

        if any(
            keyword in name
            for keyword in [
                "statistical",
                "hypothesis",
                "inference",
            ]
        ):
            return 3

        if any(
            keyword in name
            for keyword in [
                "pipeline",
                "warehouse",
                "dbt",
                "bigquery",
                "snowflake",
            ]
        ):
            return 4

        return min(depth, 4)

    # --------------------------------------------------------
    # PYTHON
    # --------------------------------------------------------

    if domain == "python":

        if any(
            keyword in name
            for keyword in [
                "core syntax",
                "variables",
                "control flow",
            ]
        ):
            return 0

        if any(
            keyword in name
            for keyword in [
                "function",
                "data structure",
                "comprehension",
                "collection",
            ]
        ):
            return 1

        if any(
            keyword in name
            for keyword in [
                "object-oriented",
                "oop",
                "class",
                "dataclass",
                "dunder",
                "iterator",
                "generator",
            ]
        ):
            return 2

        if any(
            keyword in name
            for keyword in [
                "async",
                "concurrency",
                "packaging",
                "pytest",
            ]
        ):
            return 3

        return min(depth, 3)

    # --------------------------------------------------------
    # AI / ML
    # --------------------------------------------------------

    if domain == "ai_ml":

        if any(
            keyword in name
            for keyword in [
                "linear algebra",
                "calculus",
            ]
        ):
            return 0

        if "machine learning" in name:
            return 1

        if any(
            keyword in name
            for keyword in [
                "pytorch",
                "deep learning",
                "neural network",
            ]
        ):
            return 2

        if any(
            keyword in name
            for keyword in [
                "llm",
                "vector database",
                "rag",
            ]
        ):
            return 3

        return min(depth, 3)

    # --------------------------------------------------------
    # FRONTEND
    # --------------------------------------------------------

    if domain == "frontend":

        if any(
            keyword in name
            for keyword in [
                "web foundations",
                "semantic html",
                "css",
                "flexbox",
                "grid",
            ]
        ):
            return 0

        if any(
            keyword in name
            for keyword in [
                "javascript",
                "closures",
                "async",
                "event loop",
                "prototype",
            ]
        ):
            return 1

        if any(
            keyword in name
            for keyword in [
                "react",
                "hooks",
                "state management",
                "context api",
                "frontend framework",
            ]
        ):
            return 2

        return 3

    # --------------------------------------------------------
    # C++
    # --------------------------------------------------------

    if domain == "cpp":

        if any(
            keyword in name
            for keyword in [
                "c++ foundations",
                "compilation",
                "cmake",
                "functions",
            ]
        ):
            return 0

        if any(
            keyword in name
            for keyword in [
                "memory",
                "pointer",
                "raii",
                "smart pointer",
            ]
        ):
            return 1

        if any(
            keyword in name
            for keyword in [
                "object-oriented",
                "rule of",
                "stl",
            ]
        ):
            return 2

        return 3

    # Generic fallback
    return min(depth, 3)


def assign_phases(df, domain):
    df = df.copy()

    df["phase"] = df.apply(
        lambda row: infer_phase(
            row,
            domain
        ),
        axis=1
    )

    return df


# ============================================================
# SELECT FINAL ROADMAP
# ============================================================

def select_final_skills(df, domain):
    if df.empty:
        return df

    df = df.copy()

    # Phase first.
    # Dependency depth second.
    # Semantic relevance third.
    df = df.sort_values(
        by=[
            "phase",
            "dependency_depth",
            "similarity",
        ],
        ascending=[
            True,
            True,
            False,
        ]
    )

    selected = []

    # Always prioritize stronger semantic matches.
    # But avoid filling the roadmap with unrelated
    # categories when the requested domain is known.
    for _, row in df.iterrows():

        if domain != "general":
            if row["category"] != domain:
                continue

        selected.append(row)

        if len(selected) >= MAX_ROADMAP_SKILLS:
            break

    result = pd.DataFrame(selected)

    return result


# ============================================================
# DISPLAY
# ============================================================

def phase_name(domain, phase_number):
    names = PHASE_NAMES.get(
        domain,
        PHASE_NAMES["general"]
    )

    return names.get(
        phase_number,
        f"Phase {phase_number + 1}"
    )


def print_roadmap(
    goal,
    level,
    domain,
    roadmap
):
    print()
    print("=" * 70)
    print("HERMES LEARNING ROADMAP")
    print("=" * 70)

    print()
    print(f"Goal:   {goal}")
    print(f"Level:  {level}")
    print(f"Domain: {domain}")

    if roadmap.empty:
        print()
        print("No suitable roadmap skills found.")
        print()
        return

    total_hours = roadmap["estimated_hours"].sum()

    print()
    print(f"Total skills: {len(roadmap)}")
    print(
        f"Estimated learning time: "
        f"{int(total_hours)} hours"
    )

    print()

    for phase_number in sorted(
        roadmap["phase"].unique()
    ):

        phase_df = roadmap[
            roadmap["phase"] == phase_number
        ]

        print("-" * 70)
        print(
            f"PHASE {phase_number + 1} "
            f"— {phase_name(domain, phase_number)}"
        )
        print("-" * 70)

        for index, (_, row) in enumerate(
            phase_df.iterrows(),
            start=1
        ):
            print()
            print(
                f"{index}. {row['name']}"
            )

            print(
                f"   Category: {row['category']}"
            )

            print(
                f"   Hours: "
                f"{int(row['estimated_hours'])}"
            )

            print(
                f"   Relevance: "
                f"{float(row['similarity']):.4f}"
            )

            parent_title = str(
                row.get("parent_title", "")
            ).strip()

            if parent_title:
                print(
                    f"   Prerequisite: "
                    f"{parent_title}"
                )

    print()


# ============================================================
# MAIN
# ============================================================

def build_roadmap(
    goal,
    level,
    model,
    skills_df,
    embeddings_df,
    embeddings
):
    domain = detect_domain(goal)

    # --------------------------------------------------------
    # Semantic retrieval
    # --------------------------------------------------------

    results = semantic_search(
        goal,
        model,
        embeddings_df,
        embeddings,
        skills_df
    )

    # --------------------------------------------------------
    # Domain filtering
    # --------------------------------------------------------

    results = filter_by_domain(
        results,
        domain
    )

    # --------------------------------------------------------
    # Add prerequisite parents
    # --------------------------------------------------------

    results = add_parents(
        results,
        skills_df
    )

    # --------------------------------------------------------
    # Clean
    # --------------------------------------------------------

    results = clean_selected_skills(
        results
    )

    # --------------------------------------------------------
    # Dependency depth
    # --------------------------------------------------------

    results = add_dependency_depth(
        results,
        skills_df
    )

    # --------------------------------------------------------
    # Phase assignment
    # --------------------------------------------------------

    results = assign_phases(
        results,
        domain
    )

    # --------------------------------------------------------
    # Final selection
    # --------------------------------------------------------

    results = select_final_skills(
        results,
        domain
    )

    return domain, results


def main():

    print("=" * 70)
    print("HERMES ROADMAP BUILDER")
    print("=" * 70)

    # --------------------------------------------------------
    # Load database
    # --------------------------------------------------------

    print()
    print("Loading Hermes skill database...")

    skills_df = load_skills()

    print(
        f"Loaded {len(skills_df)} learning skills."
    )

    # --------------------------------------------------------
    # Load embeddings
    # --------------------------------------------------------

    embeddings_df, embeddings = load_embeddings()

    print(
        f"Embedding dimensions: "
        f"{embeddings.shape[1]}"
    )

    # --------------------------------------------------------
    # Load model ONCE
    # --------------------------------------------------------

    print()
    print(
        f"Loading model: {MODEL_NAME}"
    )

    model = SentenceTransformer(
        MODEL_NAME
    )

    # --------------------------------------------------------
    # Interactive mode
    # --------------------------------------------------------

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
                "Please enter a learning goal."
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
                "Using beginner."
            )

            level = "beginner"

        try:

            domain, roadmap = build_roadmap(
                goal,
                level,
                model,
                skills_df,
                embeddings_df,
                embeddings
            )

            print_roadmap(
                goal,
                level,
                domain,
                roadmap
            )

        except Exception as exc:

            print()
            print(
                "ERROR WHILE BUILDING ROADMAP:"
            )
            print(str(exc))
            print()


if __name__ == "__main__":
    main()