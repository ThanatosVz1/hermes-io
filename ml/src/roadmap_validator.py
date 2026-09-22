from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"

SKILLS_FILE = DATA_DIR / "skills_model.csv"


def load_data():
    df = pd.read_csv(SKILLS_FILE)

    df["name"] = df["name"].fillna("").astype(str)
    df["category"] = df["category"].fillna("unknown").astype(str)
    df["estimated_hours"] = pd.to_numeric(
        df["estimated_hours"],
        errors="coerce"
    ).fillna(0)

    return df


def validate_dataset(df):

    errors = []
    warnings = []

    # --------------------------------------------------------
    # 1. Required columns
    # --------------------------------------------------------

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

    for column in required_columns:
        if column not in df.columns:
            errors.append(
                f"Missing required column: {column}"
            )

    if errors:
        return errors, warnings

    # --------------------------------------------------------
    # 2. Duplicate skill names
    # --------------------------------------------------------

    duplicates = (
        df[df["name"].duplicated(keep=False)]
        ["name"]
        .unique()
    )

    for name in duplicates:
        warnings.append(
            f"Duplicate skill name: {name}"
        )

    # --------------------------------------------------------
    # 3. Missing categories
    # --------------------------------------------------------

    missing_category = df[
        (df["category"].isna()) |
        (df["category"].str.strip() == "") |
        (df["category"] == "unknown")
    ]

    for _, row in missing_category.iterrows():
        warnings.append(
            f"Unknown category: {row['name']}"
        )

    # --------------------------------------------------------
    # 4. Invalid hours
    # --------------------------------------------------------

    invalid_hours = df[
        df["estimated_hours"] <= 0
    ]

    for _, row in invalid_hours.iterrows():
        errors.append(
            f"Invalid estimated hours: "
            f"{row['name']}"
        )

    # --------------------------------------------------------
    # 5. Broken parent references
    # --------------------------------------------------------

    skill_ids = set(
        df["skill_id"].astype(str)
    )

    for _, row in df.iterrows():

        parent_id = row["parent_id"]

        if pd.isna(parent_id):
            continue

        if str(parent_id) not in skill_ids:

            errors.append(
                f"Broken parent reference: "
                f"{row['name']} -> {parent_id}"
            )

    # --------------------------------------------------------
    # 6. Parent title consistency
    # --------------------------------------------------------

    lookup = {
        str(row["skill_id"]): row["name"]
        for _, row in df.iterrows()
    }

    for _, row in df.iterrows():

        parent_id = row["parent_id"]

        if pd.isna(parent_id):
            continue

        parent_id = str(parent_id)

        expected_parent = lookup.get(parent_id)

        if expected_parent is None:
            continue

        parent_title = str(
            row["parent_title"]
        )

        if parent_title != expected_parent:

            warnings.append(
                f"Parent title mismatch: "
                f"{row['name']} "
                f"(stored='{parent_title}', "
                f"actual='{expected_parent}')"
            )

    # --------------------------------------------------------
    # 7. Category coverage
    # --------------------------------------------------------

    print("\nCategory coverage:")

    category_counts = (
        df["category"]
        .value_counts()
        .sort_index()
    )

    for category, count in category_counts.items():

        print(
            f"  {category:<12} {count} skills"
        )

        if count < 5:

            warnings.append(
                f"Low category coverage: "
                f"{category} has only {count} skills"
            )

    # --------------------------------------------------------
    # 8. Parent/child structure
    # --------------------------------------------------------

    root_count = df[
        df["parent_id"].isna()
    ].shape[0]

    child_count = df[
        df["parent_id"].notna()
    ].shape[0]

    print(
        f"\nRoot skills:  {root_count}"
    )

    print(
        f"Child skills: {child_count}"
    )

    # --------------------------------------------------------
    # 9. Artificial foundation nodes
    # --------------------------------------------------------

    foundation_nodes = df[
        df["name"].str.contains(
            "Fundamentals & Core Theory",
            case=False,
            na=False
        )
    ]

    if len(foundation_nodes) > 0:

        warnings.append(
            f"Found {len(foundation_nodes)} "
            f"'Fundamentals & Core Theory' nodes. "
            f"These should be reviewed for duplication."
        )

    return errors, warnings


def print_report(errors, warnings):

    print("\n" + "=" * 70)
    print("HERMES ROADMAP DATA VALIDATOR")
    print("=" * 70)

    if not errors and not warnings:

        print("\nSTATUS: PASS")
        print("No structural problems detected.")

        return

    if errors:

        print(
            f"\nERRORS: {len(errors)}"
        )

        for index, error in enumerate(
            errors,
            start=1
        ):

            print(
                f"  {index}. {error}"
            )

    else:

        print("\nERRORS: 0")

    if warnings:

        print(
            f"\nWARNINGS: {len(warnings)}"
        )

        for index, warning in enumerate(
            warnings,
            start=1
        ):

            print(
                f"  {index}. {warning}"
            )

    else:

        print("\nWARNINGS: 0")


def main():

    print(
        "\nLoading Hermes skill database..."
    )

    df = load_data()

    print(
        f"Loaded {len(df)} skills."
    )

    errors, warnings = validate_dataset(df)

    print_report(
        errors,
        warnings
    )

    print("\n" + "=" * 70)

    if errors:

        print(
            "RESULT: FAIL — fix errors before continuing."
        )

    elif warnings:

        print(
            "RESULT: PASS WITH WARNINGS — "
            "dataset is usable but needs improvement."
        )

    else:

        print(
            "RESULT: PASS"
        )


if __name__ == "__main__":
    main()