import pandas as pd
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = PROJECT_ROOT / "ml" / "data" / "skills_embeddings.csv"


def cosine_similarity(a, b):
    return np.dot(a, b) / (
        np.linalg.norm(a) * np.linalg.norm(b)
    )


def calculate_score(query, row, semantic_score):

    query_lower = query.lower()
    name_lower = row["name"].lower()
    category = row["category"]

    score = semantic_score

    # Explicit goal/category signals
    category_keywords = {
        "data": [
            "data analyst",
            "data analysis",
            "analytics",
            "data science",
            "sql",
            "statistics",
            "visualization",
        ],
        "python": [
            "python developer",
            "python programming",
            "python",
        ],
        "frontend": [
            "frontend",
            "front end",
            "web developer",
            "react developer",
        ],
        "backend": [
            "backend",
            "back end",
            "api developer",
        ],
        "cpp": [
            "c++",
            "cpp",
            "systems programming",
        ],
        "ai_ml": [
            "ai engineer",
            "ai developer",
            "machine learning",
            "ml engineer",
            "deep learning",
            "llm",
        ],
    }

    # Category boost
    for keyword in category_keywords.get(category, []):

        if keyword in query_lower:
            score += 0.12
            break

    # Exact/strong name match
    important_terms = query_lower.split()

    for term in important_terms:

        if len(term) >= 4 and term in name_lower:
            score += 0.04

    # Penalize overly generic implementation-detail nodes
    generic_terms = [
        "fundamentals & core theory",
        "advanced edge cases",
        "alternative patterns",
    ]

    for term in generic_terms:

        if term in name_lower:
            score -= 0.05

    return score


def main():

    df = pd.read_csv(INPUT_FILE)

    embedding_columns = [
        column
        for column in df.columns
        if column.startswith("embedding_")
    ]

    embeddings = df[embedding_columns].values

    model = SentenceTransformer(
        "all-MiniLM-L6-v2"
    )

    print("=" * 60)
    print("HERMES SEMANTIC SKILL SEARCH")
    print("=" * 60)

    while True:

        query = input(
            "\nEnter a learning goal "
            "(or type 'exit'): "
        ).strip()

        if query.lower() == "exit":
            break

        if not query:
            continue

        query_embedding = model.encode(query)

        semantic_scores = np.array([
            cosine_similarity(
                query_embedding,
                embedding
            )
            for embedding in embeddings
        ])

        scores = []

        for index, row in df.iterrows():

            final_score = calculate_score(
                query,
                row,
                semantic_scores[index]
            )

            scores.append(final_score)

        results = (
            df.assign(
                semantic_score=semantic_scores,
                final_score=scores
            )
            .sort_values(
                "final_score",
                ascending=False
            )
            .head(5)
        )

        print("\nTop matching skills:\n")

        for _, row in results.iterrows():

            print(
                f"{row['final_score']:.4f} | "
                f"{row['name']} | "
                f"{row['category']}"
            )


if __name__ == "__main__":
    main()