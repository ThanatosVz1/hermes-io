"""
HERMES RAG RETRIEVER + ROADMAP BUILDER

This module:
1. Loads the Hermes skill dataset.
2. Loads pre-computed sentence-transformer embeddings.
3. Detects the target career domain.
4. Retrieves relevant skills using semantic + keyword scoring.
5. Builds a structured learning roadmap.
6. Provides a reusable build_roadmap() function for the API layer.

Run:
    python ml/src/rag_retriever.py
"""

from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

SKILLS_FILE = os.path.join(DATA_DIR, "skills_model.csv")
EMBEDDINGS_FILE = os.path.join(DATA_DIR, "skills_embeddings.csv")

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

TOP_K_DEFAULT = 10


# ============================================================
# DOMAIN DEFINITIONS
# ============================================================

DOMAIN_KEYWORDS = {
    "data_analyst": [
        "data analyst",
        "data analysis",
        "data analytics",
        "business analyst",
        "business intelligence",
        "bi analyst",
        "analytics",
        "reporting analyst",
    ],

    "python": [
        "python developer",
        "python programmer",
        "python engineer",
        "python development",
        "python backend",
        "python software developer",
    ],

    "ai_ml": [
        "ai engineer",
        "artificial intelligence engineer",
        "machine learning engineer",
        "ml engineer",
        "machine learning",
        "deep learning",
        "ai developer",
        "generative ai",
        "genai",
        "llm engineer",
        "llm developer",
    ],

    "frontend": [
        "frontend developer",
        "front end developer",
        "frontend engineer",
        "front end engineer",
        "react developer",
        "web developer",
        "ui developer",
        "javascript developer",
    ],

    "backend": [
        "backend developer",
        "back end developer",
        "backend engineer",
        "back end engineer",
        "api developer",
        "server developer",
    ],

    "cpp": [
        "c++ developer",
        "cpp developer",
        "c++ engineer",
        "cpp engineer",
        "c++ programmer",
        "c plus plus",
    ],

    "devops": [
        "devops engineer",
        "devops developer",
        "site reliability engineer",
        "sre",
        "cloud devops",
    ],
}


# ============================================================
# DOMAIN → CATEGORY
# ============================================================

DOMAIN_TO_CATEGORY = {
    "data_analyst": "data",
    "python": "python",
    "ai_ml": "ai_ml",
    "frontend": "frontend",
    "backend": "backend",
    "cpp": "cpp",
    "devops": "devops",
}


# ============================================================
# ROADMAP PHASES
# ============================================================

PHASES = {
    "data_analyst": [
        "Foundations",
        "Data Manipulation",
        "Analysis & Visualization",
        "Statistics",
        "Data Engineering",
    ],

    "python": [
        "Python Foundations",
        "Core Python",
        "Intermediate Python",
        "Advanced Python",
    ],

    "ai_ml": [
        "Mathematical Foundations",
        "Deep Learning",
        "Modern AI",
    ],

    "frontend": [
        "Web Foundations",
        "JavaScript",
        "React",
        "Advanced Frontend",
    ],

    "backend": [
        "Backend Foundations",
        "APIs & Databases",
        "Advanced Backend",
    ],

    "cpp": [
        "C++ Foundations",
        "Memory & OOP",
        "STL & Modern C++",
        "Advanced C++",
    ],

    "devops": [
        "DevOps Foundations",
    ],
}


# ============================================================
# DATASET LOADING
# ============================================================

def load_skills() -> pd.DataFrame:
    """Load and normalize the skill dataset."""

    print("Loading Hermes skill database...")

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

    missing = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing:
        raise ValueError(
            f"skills_model.csv is missing columns: {missing}"
        )

    # Normalize strings
    string_columns = [
        "skill_id",
        "name",
        "description",
        "roadmap_id",
        "parent_id",
        "parent_title",
        "node_type",
        "category",
    ]

    for col in string_columns:
        df[col] = df[col].fillna("").astype(str).str.strip()

    # Normalize hours
    df["estimated_hours"] = pd.to_numeric(
        df["estimated_hours"],
        errors="coerce"
    ).fillna(0)

    print(f"Loaded {len(df)} skills.")

    return df


# ============================================================
# EMBEDDING LOADING
# ============================================================

def load_embeddings() -> Tuple[pd.DataFrame, np.ndarray]:
    """
    Load embeddings safely.

    IMPORTANT:
    Never select columns using positional slicing because the
    metadata columns contain strings.

    Only embedding_0 ... embedding_383 are converted to float.
    """

    if not os.path.exists(EMBEDDINGS_FILE):
        raise FileNotFoundError(
            f"Embeddings file not found:\n{EMBEDDINGS_FILE}"
        )

    df = pd.read_csv(EMBEDDINGS_FILE)

    embedding_columns = [
        col
        for col in df.columns
        if re.fullmatch(r"embedding_\d+", str(col))
    ]

    if not embedding_columns:
        raise ValueError(
            "No embedding_* columns found in skills_embeddings.csv"
        )

    # Sort numerically:
    # embedding_2 must come before embedding_10
    embedding_columns.sort(
        key=lambda x: int(x.split("_")[1])
    )

    embedding_df = df[embedding_columns].apply(
        pd.to_numeric,
        errors="coerce"
    )

    if embedding_df.isna().any().any():
        bad_count = int(embedding_df.isna().sum().sum())

        raise ValueError(
            f"Found {bad_count} invalid values inside embedding columns."
        )

    embeddings = embedding_df.to_numpy(
        dtype=np.float32
    )

    # Normalize embeddings for cosine similarity.
    norms = np.linalg.norm(
        embeddings,
        axis=1,
        keepdims=True
    )

    norms[norms == 0] = 1.0

    embeddings = embeddings / norms

    print(f"Embedding dimensions: {embeddings.shape[1]}")

    return df, embeddings


# ============================================================
# MODEL
# ============================================================

def load_model() -> SentenceTransformer:
    """Load the sentence transformer model."""

    print()
    print(f"Loading model: {MODEL_NAME}")

    model = SentenceTransformer(MODEL_NAME)

    return model


# ============================================================
# DOMAIN DETECTION
# ============================================================

def normalize_text(text: str) -> str:
    """Normalize user text for matching."""

    text = str(text).lower().strip()

    text = re.sub(
        r"[^a-z0-9+# ]+",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text


def detect_domain(goal: str) -> str:
    """
    Detect the most likely career domain.

    Exact career phrases receive higher priority than
    individual keyword matches.
    """

    text = normalize_text(goal)

    scores = {
        domain: 0
        for domain in DOMAIN_KEYWORDS
    }

    for domain, keywords in DOMAIN_KEYWORDS.items():

        for keyword in keywords:

            keyword_normalized = normalize_text(keyword)

            if keyword_normalized == text:
                scores[domain] += 100

            elif keyword_normalized in text:
                # Longer phrases are more informative.
                scores[domain] += 20 + len(
                    keyword_normalized.split()
                )

    best_domain = max(
        scores,
        key=scores.get
    )

    if scores[best_domain] == 0:

        # Conservative fallback.
        if any(
            word in text
            for word in [
                "data",
                "analytics",
                "sql",
                "pandas",
                "excel",
            ]
        ):
            return "data_analyst"

        if any(
            word in text
            for word in [
                "ai",
                "machine",
                "learning",
                "llm",
            ]
        ):
            return "ai_ml"

        if "python" in text:
            return "python"

        if any(
            word in text
            for word in [
                "frontend",
                "react",
                "javascript",
                "web",
            ]
        ):
            return "frontend"

        if any(
            word in text
            for word in [
                "backend",
                "api",
                "server",
            ]
        ):
            return "backend"

        if "devops" in text:
            return "devops"

        if any(
            word in text
            for word in [
                "c++",
                "cpp",
                "c plus plus",
            ]
        ):
            return "cpp"

        return "general"

    return best_domain


# ============================================================
# KEYWORD SCORE
# ============================================================

def keyword_score(
    goal: str,
    skill_name: str,
    description: str = "",
) -> float:
    """
    Calculate lexical relevance.

    Returns approximately 0 → 1.
    """

    goal_text = normalize_text(goal)

    skill_text = normalize_text(
        f"{skill_name} {description}"
    )

    if not goal_text or not skill_text:
        return 0.0

    goal_words = set(
        goal_text.split()
    )

    skill_words = set(
        skill_text.split()
    )

    if not goal_words:
        return 0.0

    overlap = len(
        goal_words & skill_words
    )

    score = overlap / len(goal_words)

    # Exact name phrase match gets a boost.
    name_normalized = normalize_text(
        skill_name
    )

    if name_normalized in goal_text:
        score += 0.5

    return min(score, 1.0)


# ============================================================
# SEMANTIC SEARCH
# ============================================================

def semantic_search(
    goal: str,
    level: str,
    skills_df: pd.DataFrame,
    embeddings: np.ndarray,
    model: SentenceTransformer,
    top_k: int = TOP_K_DEFAULT,
) -> pd.DataFrame:
    """
    Retrieve relevant skills.

    Ranking:
        semantic similarity
        + keyword relevance
        + domain/category relevance
        + beginner/intermediate/advanced heuristics
    """

    domain = detect_domain(goal)

    target_category = DOMAIN_TO_CATEGORY.get(
        domain
    )

    # --------------------------------------------------------
    # Encode query
    # --------------------------------------------------------

    query_embedding = model.encode(
        goal,
        convert_to_numpy=True,
        normalize_embeddings=True
    ).astype(np.float32)

    # --------------------------------------------------------
    # Cosine similarity
    # --------------------------------------------------------

    semantic_scores = np.dot(
        embeddings,
        query_embedding
    )

    result = skills_df.copy()

    result["semantic_score"] = semantic_scores

    # --------------------------------------------------------
    # Keyword score
    # --------------------------------------------------------

    result["keyword_score"] = result.apply(
        lambda row: keyword_score(
            goal,
            row["name"],
            row["description"]
        ),
        axis=1
    )

    # --------------------------------------------------------
    # Category relevance
    # --------------------------------------------------------

    result["domain_score"] = np.where(
        result["category"] == target_category,
        1.0,
        0.0
    )

    # --------------------------------------------------------
    # Level adjustment
    # --------------------------------------------------------

    level = normalize_text(level)

    result["level_score"] = 0.0

    if level == "beginner":

        beginner_terms = [
            "fundamentals",
            "foundations",
            "syntax",
            "essentials",
            "variables",
            "control flow",
            "functions",
            "data structures",
            "wrangling",
        ]

        for term in beginner_terms:
            result.loc[
                result["name"]
                .str.lower()
                .str.contains(
                    term,
                    regex=False
                ),
                "level_score"
            ] += 0.03

    elif level == "intermediate":

        intermediate_terms = [
            "object-oriented",
            "oop",
            "visualization",
            "statistics",
            "api",
            "database",
            "react",
            "pandas",
            "async",
        ]

        for term in intermediate_terms:
            result.loc[
                result["name"]
                .str.lower()
                .str.contains(
                    term,
                    regex=False
                ),
                "level_score"
            ] += 0.03

    elif level == "advanced":

        advanced_terms = [
            "advanced",
            "performance",
            "optimization",
            "concurrency",
            "deep learning",
            "llm",
            "vector",
            "warehousing",
            "deployment",
        ]

        for term in advanced_terms:
            result.loc[
                result["name"]
                .str.lower()
                .str.contains(
                    term,
                    regex=False
                ),
                "level_score"
            ] += 0.03

    # --------------------------------------------------------
    # Combined score
    # --------------------------------------------------------

    result["score"] = (
        result["semantic_score"] * 0.45
        + result["keyword_score"] * 0.20
        + result["domain_score"] * 0.30
        + result["level_score"] * 0.05
    )

    # --------------------------------------------------------
    # Strong domain filtering
    # --------------------------------------------------------

    if target_category:

        domain_results = result[
            result["category"] == target_category
        ].copy()

        # If there are enough domain skills, don't pollute
        # the roadmap with unrelated categories.
        if len(domain_results) >= min(top_k, 3):
            result = domain_results

    # --------------------------------------------------------
    # Remove duplicate names
    # --------------------------------------------------------

    result = result.drop_duplicates(
        subset=["name"],
        keep="first"
    )

    # --------------------------------------------------------
    # Sort
    # --------------------------------------------------------

    result = result.sort_values(
        by="score",
        ascending=False
    )

    return result.head(top_k).reset_index(drop=True)


# ============================================================
# ROADMAP SELECTION
# ============================================================

def select_roadmap_skills(
    retrieved: pd.DataFrame,
    domain: str,
    level: str,
) -> pd.DataFrame:
    """
    Select skills appropriate for the roadmap.

    For beginner roadmaps, avoid letting advanced/optional
    skills dominate merely because their embeddings are similar.
    """

    if retrieved.empty:
        return retrieved

    df = retrieved.copy()

    # --------------------------------------------------------
    # Domain-specific maximum sizes
    # --------------------------------------------------------

    limits = {
        "data_analyst": {
            "beginner": 8,
            "intermediate": 8,
            "advanced": 8,
        },

        "python": {
            "beginner": 14,
            "intermediate": 14,
            "advanced": 14,
        },

        "ai_ml": {
            "beginner": 3,
            "intermediate": 3,
            "advanced": 3,
        },

        "frontend": {
            "beginner": 13,
            "intermediate": 13,
            "advanced": 13,
        },

        "backend": {
            "beginner": 3,
            "intermediate": 3,
            "advanced": 3,
        },

        "cpp": {
            "beginner": 13,
            "intermediate": 13,
            "advanced": 13,
        },

        "devops": {
            "beginner": 1,
            "intermediate": 1,
            "advanced": 1,
        },
    }

    max_skills = limits.get(
        domain,
        {}
    ).get(
        normalize_text(level),
        10
    )

    return df.head(max_skills).copy()


# ============================================================
# PHASE ASSIGNMENT
# ============================================================

def determine_phase(
    skill: pd.Series,
    domain: str,
    position: int,
) -> str:

    name = str(
        skill.get("name", "")
    ).lower()

    parent_title = str(
        skill.get("parent_title", "")
    ).lower()

    combined = f"{name} {parent_title}"

    phases = PHASES.get(
        domain,
        ["Foundations"]
    )

    # --------------------------------------------------------
    # DATA ANALYST
    # --------------------------------------------------------

    if domain == "data_analyst":

        if any(
            term in combined
            for term in [
                "sql",
                "python for data",
                "foundation",
            ]
        ):
            return phases[0]

        if any(
            term in combined
            for term in [
                "pandas",
                "numpy",
                "wrangling",
            ]
        ):
            return phases[1]

        if any(
            term in combined
            for term in [
                "exploratory",
                "visualization",
            ]
        ):
            return phases[2]

        if any(
            term in combined
            for term in [
                "statistical",
                "hypothesis",
            ]
        ):
            return phases[3]

        if any(
            term in combined
            for term in [
                "pipeline",
                "warehouse",
                "dbt",
                "bigquery",
                "snowflake",
            ]
        ):
            return phases[4]

    # --------------------------------------------------------
    # PYTHON
    # --------------------------------------------------------

    elif domain == "python":

        if any(
            term in combined
            for term in [
                "syntax",
                "variables",
                "control flow",
                "foundation",
            ]
        ):
            return phases[0]

        if any(
            term in combined
            for term in [
                "function",
                "data structure",
                "collection",
                "comprehension",
            ]
        ):
            return phases[1]

        if any(
            term in combined
            for term in [
                "object-oriented",
                "oop",
                "class",
                "dunder",
                "dataclass",
                "iterator",
                "generator",
            ]
        ):
            return phases[2]

        if any(
            term in combined
            for term in [
                "environment",
                "packaging",
                "pytest",
                "async",
                "concurrency",
            ]
        ):
            return phases[3]

    # --------------------------------------------------------
    # AI / ML
    # --------------------------------------------------------

    elif domain == "ai_ml":

        if any(
            term in combined
            for term in [
                "linear algebra",
                "calculus",
                "mathematical",
            ]
        ):
            return phases[0]

        if any(
            term in combined
            for term in [
                "pytorch",
                "neural",
                "deep learning",
            ]
        ):
            return phases[1]

        if any(
            term in combined
            for term in [
                "llm",
                "vector",
                "rag",
            ]
        ):
            return phases[2]

    # --------------------------------------------------------
    # FRONTEND
    # --------------------------------------------------------

    elif domain == "frontend":

        if any(
            term in combined
            for term in [
                "html",
                "css",
                "web foundation",
            ]
        ):
            return phases[0]

        if any(
            term in combined
            for term in [
                "javascript",
                "async",
                "closure",
                "prototype",
            ]
        ):
            return phases[1]

        if "react" in combined:
            return phases[2]

        return phases[3]

    # --------------------------------------------------------
    # BACKEND
    # --------------------------------------------------------

    elif domain == "backend":

        if any(
            term in combined
            for term in [
                "backend",
                "database",
                "architecture",
            ]
        ):
            return phases[0]

        if any(
            term in combined
            for term in [
                "api",
                "fastapi",
                "orm",
            ]
        ):
            return phases[1]

        return phases[2]

    # --------------------------------------------------------
    # C++
    # --------------------------------------------------------

    elif domain == "cpp":

        if any(
            term in combined
            for term in [
                "foundation",
                "cmake",
                "compilation",
                "function",
            ]
        ):
            return phases[0]

        if any(
            term in combined
            for term in [
                "memory",
                "pointer",
                "raii",
                "smart pointer",
                "object-oriented",
            ]
        ):
            return phases[1]

        if any(
            term in combined
            for term in [
                "stl",
                "container",
                "template",
            ]
        ):
            return phases[2]

        return phases[3]

    # --------------------------------------------------------
    # DEFAULT
    # --------------------------------------------------------

    return phases[
        min(position, len(phases) - 1)
    ]


# ============================================================
# CLEAN VALUE
# ============================================================

def clean_value(value: Any) -> Any:
    """Convert numpy/pandas values into JSON-safe values."""

    if value is None:
        return None

    if isinstance(value, float):
        if np.isnan(value):
            return None

        return float(value)

    if isinstance(value, np.generic):
        value = value.item()

        if isinstance(value, float) and np.isnan(value):
            return None

        return value

    return value


# ============================================================
# BUILD ROADMAP
# ============================================================

def build_roadmap(
    goal: str,
    level: str,
    top_k: int = TOP_K_DEFAULT,
    verbose: bool = False,
) -> Dict[str, Any]:
    """
    Main reusable roadmap function.

    This is the function that the FastAPI backend will call later.

    Example:

        roadmap = build_roadmap(
            "become a data analyst",
            "beginner"
        )
    """

    goal = str(goal).strip()
    level = str(level).strip().lower()

    if not goal:
        raise ValueError("Goal cannot be empty.")

    if level not in {
        "beginner",
        "intermediate",
        "advanced",
    }:
        raise ValueError(
            "Level must be beginner, intermediate, or advanced."
        )

    # --------------------------------------------------------
    # Load resources
    # --------------------------------------------------------

    skills_df = load_skills()

    embeddings_df, embeddings = load_embeddings()

    # --------------------------------------------------------
    # Ensure row alignment
    # --------------------------------------------------------

    if len(skills_df) != len(embeddings):
        raise ValueError(
            "skills_model.csv and skills_embeddings.csv "
            f"have different row counts: "
            f"{len(skills_df)} vs {len(embeddings)}"
        )

    # --------------------------------------------------------
    # Model
    # --------------------------------------------------------

    model = load_model()

    # --------------------------------------------------------
    # Domain
    # --------------------------------------------------------

    domain = detect_domain(goal)

    # --------------------------------------------------------
    # Retrieval
    # --------------------------------------------------------

    retrieved = semantic_search(
        goal=goal,
        level=level,
        skills_df=skills_df,
        embeddings=embeddings,
        model=model,
        top_k=top_k,
    )

    # --------------------------------------------------------
    # Roadmap selection
    # --------------------------------------------------------

    roadmap_skills = select_roadmap_skills(
        retrieved,
        domain,
        level,
    )

    # --------------------------------------------------------
    # Build phases
    # --------------------------------------------------------

    phases_dict: Dict[str, List[Dict[str, Any]]] = {}

    phase_order = PHASES.get(
        domain,
        ["Foundations"]
    )

    for index, (_, skill) in enumerate(
        roadmap_skills.iterrows()
    ):

        phase = determine_phase(
            skill,
            domain,
            index
        )

        if phase not in phases_dict:
            phases_dict[phase] = []

        prerequisite = skill.get(
            "parent_title",
            ""
        )

        prerequisite = clean_value(
            prerequisite
        )

        # Don't expose empty prerequisites.
        if prerequisite == "":
            prerequisite = None

        skill_data = {
            "skill_id": clean_value(
                skill.get("skill_id")
            ),

            "name": clean_value(
                skill.get("name")
            ),

            "description": clean_value(
                skill.get("description")
            ),

            "category": clean_value(
                skill.get("category")
            ),

            "node_type": clean_value(
                skill.get("node_type")
            ),

            "estimated_hours": clean_value(
                skill.get("estimated_hours")
            ),

            "relevance": round(
                float(
                    skill.get("score", 0)
                ),
                4
            ),

            "prerequisite": prerequisite,
        }

        phases_dict[phase].append(
            skill_data
        )

    # --------------------------------------------------------
    # Preserve logical phase order
    # --------------------------------------------------------

    ordered_phases = []

    for phase_name in phase_order:

        if phase_name not in phases_dict:
            continue

        skills = phases_dict[
            phase_name
        ]

        if not skills:
            continue

        ordered_phases.append({
            "name": phase_name,
            "skills": skills,
        })

    # --------------------------------------------------------
    # Totals
    # --------------------------------------------------------

    total_skills = sum(
        len(phase["skills"])
        for phase in ordered_phases
    )

    total_hours = sum(
        float(
            skill["estimated_hours"] or 0
        )
        for phase in ordered_phases
        for skill in phase["skills"]
    )

    roadmap = {
        "goal": goal,
        "level": level,
        "domain": domain,

        "total_skills": total_skills,

        "estimated_hours": int(
            round(total_hours)
        ),

        "phases": ordered_phases,
    }

    if verbose:
        display_roadmap(
            roadmap
        )

    return roadmap


# ============================================================
# DISPLAY
# ============================================================

def display_roadmap(
    roadmap: Dict[str, Any]
) -> None:

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
        f"{roadmap['estimated_hours']} hours"
    )

    print()

    for phase in roadmap["phases"]:

        print("-" * 70)
        print(
            f"PHASE — {phase['name']}"
        )
        print("-" * 70)

        for index, skill in enumerate(
            phase["skills"],
            start=1
        ):

            print()
            print(
                f"{index}. {skill['name']}"
            )

            print(
                f"   Category: "
                f"{skill['category']}"
            )

            print(
                f"   Hours: "
                f"{skill['estimated_hours']}"
            )

            print(
                f"   Relevance: "
                f"{skill['relevance']}"
            )

            if skill.get(
                "prerequisite"
            ):
                print(
                    f"   Prerequisite: "
                    f"{skill['prerequisite']}"
                )

    print()


# ============================================================
# RETRIEVAL DEBUG DISPLAY
# ============================================================

def display_retrieval(
    goal: str,
    level: str,
    domain: str,
    retrieved: pd.DataFrame,
) -> None:

    print()
    print("=" * 70)
    print("HERMES RAG RETRIEVAL")
    print("=" * 70)

    print()
    print(f"Goal: {goal}")
    print(f"Level: {level}")
    print(f"Detected domain: {domain}")

    print()
    print("Retrieved skill nodes:")
    print()

    for index, (_, row) in enumerate(
        retrieved.iterrows(),
        start=1
    ):

        print(
            f"{index}. {row['name']}"
        )

        print(
            f"   Category: "
            f"{row['category']}"
        )

        print(
            f"   Type: "
            f"{row['node_type']}"
        )

        print(
            f"   Hours: "
            f"{int(row['estimated_hours'])}"
        )

        print(
            f"   Score: "
            f"{row['score']:.4f}"
        )

        print()


# ============================================================
# MAIN CLI
# ============================================================

def main():

    print()
    print("=" * 70)
    print("HERMES ROADMAP BUILDER")
    print("=" * 70)
    print()

    while True:

        try:

            goal = input(
                "Enter career/learning goal "
                "(or type 'exit'): "
            ).strip()

        except (
            KeyboardInterrupt,
            EOFError,
        ):
            print()
            break

        if goal.lower() == "exit":
            break

        if not goal:
            print(
                "Please enter a career goal."
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

            roadmap = build_roadmap(
                goal=goal,
                level=level,
                verbose=True,
            )

        except Exception as error:

            print()
            print(
                "ERROR:",
                str(error)
            )

            print()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()