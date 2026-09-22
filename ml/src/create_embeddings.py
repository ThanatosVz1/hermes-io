import pandas as pd
from pathlib import Path
from sentence_transformers import SentenceTransformer


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = PROJECT_ROOT / "ml" / "data" / "skills_model.csv"
OUTPUT_FILE = PROJECT_ROOT / "ml" / "data" / "skills_embeddings.csv"


def main():

    df = pd.read_csv(INPUT_FILE)

    model = SentenceTransformer(
        "all-MiniLM-L6-v2"
    )

    texts = (
        df["name"].fillna("")
        + ". "
        + df["description"].fillna("")
        + ". Category: "
        + df["category"].fillna("")
    )

    print("=" * 60)
    print("CREATING SKILL EMBEDDINGS")
    print("=" * 60)

    embeddings = model.encode(
        texts.tolist(),
        show_progress_bar=True
    )

    embedding_columns = [
        f"embedding_{i}"
        for i in range(embeddings.shape[1])
    ]

    embedding_df = pd.DataFrame(
        embeddings,
        columns=embedding_columns
    )

    result = pd.concat(
        [df.reset_index(drop=True), embedding_df],
        axis=1
    )

    result.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\nEmbeddings created:")
    print(f"  Skills: {len(result)}")
    print(f"  Vector dimensions: {embeddings.shape[1]}")

    print("\nSaved to:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    main()