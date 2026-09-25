import os
import numpy as np
import pandas as pd


# ============================================================
# CONFIG
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

SKILLS_FILE = os.path.join(DATA_DIR, "skills_model.csv")

TOP_K = 10


# ============================================================
# DOMAIN CONFIGURATION
# ============================================================

DOMAIN_CATEGORIES = {
    "python": ["python"],
    "frontend": ["frontend"],
    "backend": ["backend"],
    "cpp": ["cpp"],
    "data_analyst": ["data"],
    "data_science": ["data", "ai_ml"],
    "ai_ml": ["ai_ml", "data"],
    "devops": ["devops", "backend"],
}


DOMAIN_KEYWORDS = {
    "python": [
        "python",
        "functions",
        "data structures",
        "object-oriented",
        "oop",
        "pytest",
        "packaging",
        "asyncio",
        "concurrency",
    ],

    "frontend": [
        "html",
        "css",
        "javascript",
        "frontend",
        "react",
        "vue",
        "svelte",
        "dom",
        "state management",
    ],

    "backend": [
        "backend",
        "api",
        "database",
        "server",
        "fastapi",
        "node",
        "rest",
        "graphql",
        "orm",
    ],

    "cpp": [
        "c++",
        "cpp",
        "memory",
        "pointer",
        "reference",
        "raii",
        "smart pointer",
        "stl",
        "template",
        "cmake",
        "concurrency",
    ],

    "data_analyst": [
        "sql",
        "data analysis",
        "data visualization",
        "exploratory data analysis",
        "statistics",
        "statistical inference",
        "hypothesis testing",
        "data wrangling",
        "pandas",
        "numpy",
        "analytics",
        "dashboard",
    ],

    "data_science": [
        "data science",
        "statistics",
        "machine learning",
        "data wrangling",
        "pandas",
        "numpy",
        "data analysis",
        "hypothesis testing",
    ],

    "ai_ml": [
        "machine learning",
        "deep learning",
        "pytorch",
        "neural network",
        "llm",
        "rag",
        "vector database",
        "artificial intelligence",
        "linear algebra",
        "calculus",
    ],

    "devops": [
        "devops",
        "docker",
        "ci/cd",
        "deployment",
        "cloud",
        "kubernetes",
        "infrastructure",
    ],
}


# ============================================================
# LEVEL WEIGHTS
# ============================================================

LEVEL_WEIGHTS = {
    "beginner": {
        "core": 1.30,
        "advanced": 0.55,
    },

    "intermediate": {
        "core": 1.00,
        "advanced": 1.00,
    },

    "advanced": {
        "core": 0.75,
        "advanced": 1.35,
    },
}


# ============================================================
# LOAD DATA
# ============================================================

def load_skills():

    if not os.path.exists(SKILLS_FILE):
        raise FileNotFoundError(
            f"\nFile not found:\n{SKILLS_FILE}\n\n"
            "Run:\n"
            "python ml\\src\\build_skill_dataset.py"
        )

    df = pd.read_csv(SKILLS_FILE)

    required = [
        "skill_id",
        "name",
        "description",
        "estimated_hours",
        "category",
        "node_type",
    ]

    missing = [
        column
        for column in required
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing columns: {missing}"
        )

    df = df.copy()

    df["name"] = df["name"].fillna("").astype(str)
    df["description"] = (
        df["description"]
        .fillna("")
        .astype(str)
    )

    df["category"] = (
        df["category"]
        .fillna("unknown")
        .astype(str)
    )

    df["node_type"] = (
        df["node_type"]
        .fillna("skill")
        .astype(str)
    )

    df["estimated_hours"] = pd.to_numeric(
        df["estimated_hours"],
        errors="coerce"
    ).fillna(0)

    return df


# ============================================================
# DOMAIN DETECTION
# ============================================================

def detect_domain(goal):

    text = goal.lower()

    scores = {}

    for domain, keywords in DOMAIN_KEYWORDS.items():

        score = 0

        for keyword in keywords:

            if keyword in text:
                score += 1

                # Exact career phrase gets extra weight
                if keyword == text:
                    score += 5

        scores[domain] = score

    best_domain = max(
        scores,
        key=scores.get
    )

    if scores[best_domain] == 0:
        return "general"

    return best_domain


# ============================================================
# SKILL RELEVANCE
# ============================================================

def calculate_relevance(
    row,
    domain
):

    text = (
        f"{row['name']} "
        f"{row['description']}"
    ).lower()

    keywords = DOMAIN_KEYWORDS.get(
        domain,
        []
    )

    score = 0

    for keyword in keywords:

        if keyword in text:
            score += 1

    return score


# ============================================================
# BEGINNER PRIORITY
# ============================================================

def calculate_level_score(
    row,
    level
):

    name = row["name"].lower()

    beginner_keywords = [
        "fundamentals",
        "core",
        "foundations",
        "basics",
    ]

    advanced_keywords = [
        "advanced",
        "deep-dive",
        "deep dive",
        "optimization",
        "performance",
        "concurrency",
        "metaprogramming",
        "capstone",
    ]

    beginner_score = 0
    advanced_score = 0

    for keyword in beginner_keywords:

        if keyword in name:
            beginner_score += 1

    for keyword in advanced_keywords:

        if keyword in name:
            advanced_score += 1

    weights = LEVEL_WEIGHTS.get(
        level,
        LEVEL_WEIGHTS["beginner"]
    )

    score = (
        beginner_score * weights["core"]
        - advanced_score * (
            1.0 - weights["advanced"]
        )
    )

    return score


# ============================================================
# DUPLICATE / CHILD NODE PENALTY
# ============================================================

def calculate_structure_penalty(row):

    name = row["name"].lower()

    penalty = 0

    # These are usually supporting nodes rather
    # than primary roadmap skills.
    if "fundamentals & core theory" in name:
        penalty += 0.15

    if "alternative patterns & tooling" in name:
        penalty += 0.30

    if "mini-project & practical checkpoint" in name:
        penalty += 0.25

    return penalty


# ============================================================
# RECOMMENDATION ENGINE
# ============================================================

def recommend_skills(
    df,
    goal,
    level
):

    domain = detect_domain(goal)

    print(
        f"Detected domain: {domain}"
    )

    if domain != "general":

        allowed_categories = DOMAIN_CATEGORIES.get(
            domain,
            []
        )

        candidates = df[
            df["category"].isin(
                allowed_categories
            )
        ].copy()

    else:

        candidates = df.copy()

    # Only actual learning nodes.
    candidates = candidates[
        candidates["node_type"].isin(
            ["skill", "practice"]
        )
    ].copy()

    if candidates.empty:
        return domain, candidates

    # --------------------------------------------------------
    # RELEVANCE
    # --------------------------------------------------------

    candidates["relevance"] = candidates.apply(
        lambda row:
        calculate_relevance(
            row,
            domain
        ),
        axis=1
    )

    # --------------------------------------------------------
    # LEVEL
    # --------------------------------------------------------

    candidates["level_score"] = candidates.apply(
        lambda row:
        calculate_level_score(
            row,
            level
        ),
        axis=1
    )

    # --------------------------------------------------------
    # STRUCTURE PENALTY
    # --------------------------------------------------------

    candidates["structure_penalty"] = candidates.apply(
        calculate_structure_penalty,
        axis=1
    )

    # --------------------------------------------------------
    # NORMALIZED RELEVANCE
    # --------------------------------------------------------

    max_relevance = candidates[
        "relevance"
    ].max()

    if max_relevance > 0:

        candidates["relevance_normalized"] = (
            candidates["relevance"]
            / max_relevance
        )

    else:

        candidates["relevance_normalized"] = 0

    # --------------------------------------------------------
    # FINAL RECOMMENDATION SCORE
    # --------------------------------------------------------

    candidates["recommendation_score"] = (
        candidates["relevance_normalized"] * 0.60
        + candidates["level_score"] * 0.25
        - candidates["structure_penalty"] * 0.15
    )

    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    candidates = candidates.sort_values(
        by=[
            "recommendation_score",
            "relevance",
        ],
        ascending=False
    )

    # --------------------------------------------------------
    # REMOVE DUPLICATE / SUPPORTING NODES
    # --------------------------------------------------------

    selected = []

    selected_names = set()

    for _, row in candidates.iterrows():

        name = row["name"]

        # Avoid exact duplicates
        if name in selected_names:
            continue

        selected.append(row)
        selected_names.add(name)

        if len(selected) >= TOP_K:
            break

    if not selected:
        return domain, candidates.head(TOP_K)

    result = pd.DataFrame(
        selected
    )

    return domain, result


# ============================================================
# DISPLAY
# ============================================================

def display_results(
    goal,
    level,
    domain,
    results
):

    print()
    print("=" * 70)
    print("HERMES SKILL RECOMMENDATION ENGINE")
    print("=" * 70)

    print()
    print(f"Goal: {goal}")
    print(f"Level: {level}")
    print(f"Domain: {domain}")

    print()
    print("Recommended learning skills:")
    print()

    if results.empty:

        print(
            "No relevant skills found."
        )

        return

    for index, (_, row) in enumerate(
        results.iterrows(),
        start=1
    ):

        print(
            f"{index}. {row['name']}"
        )

        print(
            f"   Category: {row['category']}"
        )

        print(
            f"   Type: {row['node_type']}"
        )

        print(
            f"   Hours: {int(row['estimated_hours'])}"
        )

        print(
            f"   Recommendation Score: "
            f"{row['recommendation_score']:.4f}"
        )

        print()


# ============================================================
# MAIN
# ============================================================

def main():

    print(
        "Loading Hermes skill database..."
    )

    print()

    df = load_skills()

    print(
        f"Loaded {len(df)} learning skills."
    )

    print()

    while True:

        try:

            goal = input(
                "Enter career/learning goal "
                "(or type 'exit'): "
            ).strip()

        except KeyboardInterrupt:

            print()
            break

        if not goal:
            continue

        if goal.lower() == "exit":
            break

        level = input(
            "Enter level "
            "(beginner/intermediate/advanced): "
        ).strip().lower()

        if level not in [
            "beginner",
            "intermediate",
            "advanced",
        ]:

            print(
                "Invalid level."
            )

            print()

            continue

        domain, results = recommend_skills(
            df=df,
            goal=goal,
            level=level,
        )

        display_results(
            goal=goal,
            level=level,
            domain=domain,
            results=results,
        )

        print()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()