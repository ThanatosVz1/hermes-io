from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer


# ============================================================
# PATHS / MODEL
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "ml" / "data"

SKILLS_FILE = DATA_DIR / "skills_model.csv"
EMBEDDINGS_FILE = DATA_DIR / "skills_embeddings.csv"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")


# ============================================================
# DOMAIN CONFIGURATION
# ============================================================

DOMAIN_CATEGORIES = {
    "python": {"python"},
    "frontend": {"frontend"},
    "backend": {"backend"},
    "data": {"data"},
    "ai_ml": {"ai_ml"},
    "cpp": {"cpp"},
    "devops": {"devops"},
    "blockchain": {"blockchain"},
    "computer_science": {"computer_science"},
    "cybersecurity": {"cybersecurity"},
    "embedded": {"embedded"},
    "game_development": {"game_development"},
    "mobile": {"mobile"},
    "software_engineering": {"software_engineering"},
    "quantum": {"quantum"},
}


DOMAIN_PATTERNS = {
    "cybersecurity": [
        ("cybersecurity", 15),
        ("cyber security", 15),
        ("security engineer", 12),
        ("security analyst", 12),
        ("ethical hacking", 12),
        ("ethical hacker", 12),
        ("penetration testing", 12),
        ("penetration tester", 12),
        ("pentesting", 12),
        ("pentester", 12),
        ("penetration", 9),
        ("owasp", 10),
        ("soc analyst", 10),
        ("security operations", 10),
        ("incident response", 10),
        ("digital forensics", 10),
        ("forensics", 8),
        ("threat hunting", 10),
        ("threat detection", 9),
        ("vulnerability assessment", 10),
        ("vulnerability management", 9),
        ("malware analysis", 10),
        ("network security", 10),
        ("web security", 9),
        ("application security", 10),
        ("appsec", 10),
        ("security auditing", 9),
        ("information security", 12),
        ("infosec", 12),
        ("cyber defense", 12),
        ("cyber defence", 12),
    ],

    "devops": [
        ("devops engineer", 15),
        ("devops", 15),
        ("dev ops", 15),
        ("site reliability engineer", 14),
        ("sre", 13),
        ("cloud engineer", 13),
        ("cloud computing", 9),
        ("kubernetes", 11),
        ("docker", 9),
        ("terraform", 10),
        ("ansible", 9),
        ("ci cd", 10),
        ("continuous integration", 9),
        ("continuous deployment", 9),
        ("jenkins", 8),
        ("aws", 7),
        ("azure", 7),
        ("gcp", 7),
        ("infrastructure", 7),
        ("infrastructure as code", 10),
        ("platform engineer", 12),
        ("platform engineering", 12),
        ("release engineering", 9),
        ("observability", 8),
        ("cloud architecture", 10),
    ],

    "ai_ml": [
        ("machine learning engineer", 15),
        ("ml engineer", 15),
        ("machine learning", 14),
        ("artificial intelligence", 14),
        ("ai engineer", 14),
        ("ai developer", 12),
        ("deep learning", 13),
        ("natural language processing", 12),
        ("nlp", 11),
        ("computer vision", 12),
        ("generative ai", 14),
        ("gen ai", 13),
        ("large language model", 13),
        ("large language models", 13),
        ("llm", 12),
        ("rag", 10),
        ("retrieval augmented generation", 12),
        ("transformers", 10),
        ("pytorch", 9),
        ("tensorflow", 9),
        ("mlops", 10),
        ("reinforcement learning", 12),
        ("data science", 10),
        ("neural networks", 11),
        ("neural network", 11),
    ],

    "python": [
        ("python developer", 15),
        ("python engineer", 14),
        ("python programming", 13),
        ("python", 8),
        ("django", 8),
        ("flask", 8),
        ("fastapi", 8),
    ],

    "frontend": [
        ("frontend developer", 15),
        ("front end developer", 15),
        ("frontend engineer", 14),
        ("front end engineer", 14),
        ("react developer", 15),
        ("react engineer", 14),
        ("web developer", 10),
        ("ui developer", 11),
        ("javascript developer", 12),
        ("typescript developer", 12),
        ("frontend", 12),
        ("front end", 12),
        ("react", 9),
        ("javascript", 8),
        ("typescript", 8),
        ("html css", 8),
        ("web development", 10),
    ],

    "backend": [
        ("backend developer", 15),
        ("back end developer", 15),
        ("backend engineer", 14),
        ("back end engineer", 14),
        ("server side developer", 13),
        ("server side engineer", 13),
        ("api developer", 12),
        ("backend", 12),
        ("back end", 12),
        ("node js developer", 14),
        ("nodejs developer", 14),
        ("java backend", 14),
        ("spring boot developer", 14),
        ("express developer", 12),
        ("backend development", 12),
    ],

    "data": [
        ("data scientist", 15),
        ("data science", 14),
        ("data analyst", 14),
        ("data analytics", 13),
        ("data engineer", 14),
        ("data engineering", 13),
        ("data developer", 11),
        ("database developer", 10),
        ("sql developer", 12),
        ("business intelligence", 12),
        ("bi developer", 11),
        ("data", 6),
        ("sql", 6),
        ("pandas", 7),
        ("spark", 8),
        ("data visualization", 10),
        ("analytics engineer", 12),
    ],

    "cpp": [
        ("c++ developer", 15),
        ("c++ engineer", 15),
        ("cpp developer", 15),
        ("cpp engineer", 15),
        ("c plus plus", 14),
        ("c++", 13),
        ("cpp", 13),
    ],

    "blockchain": [
        ("blockchain developer", 15),
        ("blockchain engineer", 15),
        ("blockchain", 14),
        ("web3 developer", 14),
        ("web3", 13),
        ("smart contract developer", 14),
        ("smart contracts", 13),
        ("solidity developer", 14),
        ("solidity", 12),
        ("ethereum developer", 13),
        ("ethereum", 10),
        ("defi", 11),
        ("decentralized finance", 11),
        ("dapp developer", 13),
        ("dapps", 12),
    ],

    "embedded": [
        ("embedded systems engineer", 15),
        ("embedded engineer", 15),
        ("embedded developer", 15),
        ("embedded systems", 14),
        ("embedded", 13),
        ("arduino", 10),
        ("stm32", 10),
        ("microcontroller", 11),
        ("microcontrollers", 11),
        ("rtos", 10),
        ("firmware engineer", 14),
        ("firmware developer", 14),
        ("firmware", 12),
    ],

    "mobile": [
        ("mobile developer", 15),
        ("mobile engineer", 14),
        ("android developer", 15),
        ("android engineer", 14),
        ("ios developer", 15),
        ("ios engineer", 14),
        ("flutter developer", 14),
        ("react native developer", 14),
        ("mobile development", 13),
        ("android", 10),
        ("ios", 10),
        ("flutter", 10),
        ("react native", 12),
    ],

    "game_development": [
        ("game developer", 15),
        ("game development", 14),
        ("game engineer", 14),
        ("unity developer", 14),
        ("unreal developer", 14),
        ("unity", 11),
        ("unreal engine", 11),
        ("game programming", 13),
        ("game programmer", 13),
        ("godot", 10),
    ],

    "software_engineering": [
        ("software engineer", 15),
        ("software developer", 14),
        ("software engineering", 14),
        ("software architecture", 13),
        ("software architect", 13),
        ("system design", 13),
        ("distributed systems", 13),
        ("design patterns", 10),
        ("clean architecture", 11),
        ("software development", 12),
    ],

    "computer_science": [
        ("computer science", 15),
        ("data structures", 12),
        ("algorithms", 12),
        ("dsa", 12),
        ("competitive programming", 12),
        ("operating systems", 11),
        ("computer networks", 11),
        ("compiler design", 11),
        ("theory of computation", 11),
        ("database systems", 10),
    ],

    "quantum": [
        ("quantum computing", 15),
        ("quantum computer", 14),
        ("quantum developer", 14),
        ("quantum engineer", 14),
        ("qiskit", 13),
        ("quantum", 12),
    ],
}


TECHNOLOGY_PATTERNS = {
    "nodejs": ["node.js", "nodejs", "node js", "express", "nestjs", "nest js"],
    "java": ["java", "spring", "spring boot", "maven", "gradle", "jvm"],
    "go": ["golang", "go programming", "go developer", "go backend", "go engineer"],
    "rust": ["rust programming", "rust developer", "rust engineer", "rust"],
    "csharp": ["c#", "c sharp", ".net", "dotnet", "asp.net"],
    "php": ["php", "laravel", "symfony"],
    "kotlin": ["kotlin", "android kotlin"],
    "swift": ["swift", "swiftui", "ios swift"],
    "react": ["react", "react.js", "reactjs"],
    "nextjs": ["next.js", "nextjs", "next js"],
    "vue": ["vue", "vue.js", "vuejs"],
    "angular": ["angular", "angular.js", "angularjs"],
    "javascript": ["javascript", "java script", "js"],
    "typescript": ["typescript", "type script", "ts"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "gcp": ["gcp", "google cloud", "google cloud platform"],
    "kubernetes": ["kubernetes", "k8s"],
    "docker": ["docker", "docker compose", "containerization", "containers"],
    "terraform": ["terraform", "infrastructure as code", "iac"],
    "ansible": ["ansible"],
    "sql": ["sql", "mysql", "postgresql", "postgres", "database", "databases"],
    "pytorch": ["pytorch"],
    "tensorflow": ["tensorflow"],
    "sklearn": ["scikit learn", "scikit-learn", "sklearn"],
    "spark": ["spark", "apache spark", "pyspark"],
    "computer_vision": ["computer vision", "opencv", "image processing"],
    "generative_ai": [
        "generative ai",
        "gen ai",
        "llm",
        "large language model",
        "rag",
        "retrieval augmented generation",
    ],
}


TRACK_PREFIXES = {
    "nodejs": {"nodejs", "be"},
    "java": {"java", "be"},
    "go": {"go", "be"},
    "rust": {"rust", "be"},
    "csharp": {"csharp", "be"},
    "php": {"php", "be"},
    "kotlin": {"kotlin", "mobile"},
    "swift": {"swift", "mobile"},

    "react": {"react", "js", "fe"},
    "nextjs": {"nextjs", "react", "js", "fe"},
    "vue": {"vue", "js", "fe"},
    "angular": {"angular", "js", "fe"},
    "javascript": {"js", "fe"},
    "typescript": {"js", "ts", "fe"},

    "aws": {"aws", "devops"},
    "azure": {"azure", "devops"},
    "gcp": {"gcp", "devops"},
    "kubernetes": {"kubernetes", "devops"},
    "docker": {"docker", "devops"},
    "terraform": {"terraform", "devops"},
    "ansible": {"ansible", "devops"},

    "sql": {"sql", "data", "be"},

    "pytorch": {"ai"},
    "tensorflow": {"ai"},
    "sklearn": {"ai"},
    "computer_vision": {"ai", "computer"},
    "generative_ai": {"generative", "ai"},
}


GENERIC_PREFIXES = {
    "python": {"py", "python"},
    "frontend": {"fe"},
    "backend": {"be"},
    "data": {"data"},
    "ai_ml": {"ai"},
    "cpp": {"cpp"},
    "devops": {"devops"},
    "blockchain": {"blockchain"},
    "cybersecurity": {"cybersecurity"},
    "embedded": {"embedded"},
    "mobile": {"mobile"},
    "game_development": {"game", "game_development"},
    "software_engineering": {"software", "system"},
    "computer_science": {"cs", "dsa", "computer"},
    "quantum": {"quantum"},
}


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_text(value: Any) -> str:
    if value is None:
        return ""

    text = str(value).lower()

    replacements = {
        "node.js": "nodejs",
        "node js": "nodejs",
        "next.js": "nextjs",
        "next js": "nextjs",
        "react.js": "react",
        "reactjs": "react",
        "vue.js": "vue",
        "vuejs": "vue",
        "angular.js": "angular",
        "angularjs": "angular",
        "c plus plus": "cpp",
        "c++": "cpp",
        "c sharp": "csharp",
        ".net": "dotnet",
        "ci/cd": "ci cd",
        "k8s": "kubernetes",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"[_\-]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text


def contains_phrase(text: str, phrase: str) -> bool:
    text = normalize_text(text)
    phrase = normalize_text(phrase)

    if not phrase:
        return False

    return bool(
        re.search(
            r"(?<![a-z0-9])"
            + re.escape(phrase)
            + r"(?![a-z0-9])",
            text,
        )
    )


def tokenize(text: str) -> Set[str]:
    words = re.findall(
        r"[a-z0-9]+",
        normalize_text(text),
    )

    stop_words = {
        "the",
        "and",
        "for",
        "with",
        "from",
        "into",
        "using",
        "developer",
        "engineer",
        "development",
        "fundamentals",
        "advanced",
        "beginner",
        "intermediate",
        "expert",
        "learn",
        "learning",
        "skill",
        "skills",
    }

    return {
        word
        for word in words
        if len(word) > 1 and word not in stop_words
    }


# ============================================================
# PROFILE / DOMAIN DETECTION
# ============================================================

def build_goal_text(profile: Dict[str, Any]) -> str:
    return (
        f"Goal: {profile.get('goal', '') or ''}\n"
        f"Target role: {profile.get('targetRole', '') or ''}\n"
        f"Interests: {profile.get('interests', '') or ''}\n"
        f"Current skill level: {profile.get('skillLevel', '') or ''}\n"
        f"Skill details: {profile.get('skillDetails', '') or ''}"
    ).strip()


def detect_domain(text: str) -> str:
    normalized = normalize_text(text)
    scores = defaultdict(float)

    for domain, patterns in DOMAIN_PATTERNS.items():
        for phrase, weight in patterns:
            if contains_phrase(normalized, phrase):
                scores[domain] += weight

    for domain in DOMAIN_CATEGORIES:
        readable = domain.replace("_", " ")

        if contains_phrase(normalized, readable):
            scores[domain] += 8

    if not scores:
        return "general"

    best_domain, best_score = max(
        scores.items(),
        key=lambda item: item[1],
    )

    return best_domain if best_score >= 6 else "general"


def detect_technologies(text: str) -> Set[str]:
    normalized = normalize_text(text)
    technologies = set()

    for technology, patterns in TECHNOLOGY_PATTERNS.items():
        for phrase in patterns:
            if contains_phrase(normalized, phrase):
                technologies.add(technology)
                break

    return technologies


# ============================================================
# DATA LOADING
# ============================================================

def find_column(
    df: pd.DataFrame,
    candidates: List[str],
    required: bool = False,
) -> Optional[str]:

    normalized = {}

    for column in df.columns:
        key = re.sub(
            r"[^a-z0-9]",
            "",
            str(column).lower(),
        )
        normalized[key] = column

    for candidate in candidates:
        key = re.sub(
            r"[^a-z0-9]",
            "",
            candidate.lower(),
        )

        if key in normalized:
            return normalized[key]

    if required:
        raise ValueError(
            f"Required column not found. Tried: {candidates}. "
            f"Available columns: {list(df.columns)}"
        )

    return None


def load_skill_data() -> pd.DataFrame:
    if not SKILLS_FILE.exists():
        raise FileNotFoundError(
            f"Skills dataset not found:\n{SKILLS_FILE}"
        )

    df = pd.read_csv(SKILLS_FILE)

    if df.empty:
        raise ValueError("skills_model.csv is empty.")

    id_col = find_column(
        df,
        ["skill_id", "skillId", "id", "skill", "node_id"],
        required=True,
    )

    title_col = find_column(
        df,
        ["skill_name", "skillName", "name", "title", "skill"],
        required=True,
    )

    category_col = find_column(
        df,
        ["category", "domain", "track"],
    )

    description_col = find_column(
        df,
        ["description", "skill_description", "details"],
    )

    parent_id_col = find_column(
        df,
        [
            "parent_id",
            "parentId",
            "parent",
            "prerequisite",
            "prerequisite_id",
        ],
    )

    parent_title_col = find_column(
        df,
        [
            "parent_name",
            "parentName",
            "parent_title",
            "parentTitle",
        ],
    )

    hours_col = find_column(
        df,
        [
            "estimated_hours",
            "estimatedHours",
            "hours",
            "duration",
            "time_hours",
        ],
    )

    result = pd.DataFrame()

    result["skillId"] = (
        df[id_col]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    result["title"] = (
        df[title_col]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    if category_col:
        result["category"] = (
            df[category_col]
            .fillna("unknown")
            .astype(str)
            .str.strip()
            .str.lower()
        )
    else:
        result["category"] = "unknown"

    if description_col:
        result["description"] = (
            df[description_col]
            .fillna("")
            .astype(str)
            .str.strip()
        )
    else:
        result["description"] = ""

    if parent_id_col:
        result["parentId"] = (
            df[parent_id_col]
            .fillna("")
            .astype(str)
            .str.strip()
        )
    else:
        result["parentId"] = ""

    if parent_title_col:
        result["parentTitle"] = (
            df[parent_title_col]
            .fillna("")
            .astype(str)
            .str.strip()
        )
    else:
        result["parentTitle"] = ""

    if hours_col:
        result["estimatedHours"] = (
            pd.to_numeric(
                df[hours_col],
                errors="coerce",
            ).fillna(8.0)
        )
    else:
        result["estimatedHours"] = 8.0

    result = result[
        result["skillId"] != ""
    ].copy()

    result.drop_duplicates(
        subset=["skillId"],
        keep="first",
        inplace=True,
    )

    result.reset_index(
        drop=True,
        inplace=True,
    )

    return result


# ============================================================
# EMBEDDINGS
# ============================================================

def detect_embedding_columns(
    embeddings: pd.DataFrame,
) -> List[str]:

    explicit = [
        column
        for column in embeddings.columns
        if (
            str(column).lower().startswith("embedding")
            or str(column).lower().startswith("emb_")
        )
    ]

    if len(explicit) == 384:
        return explicit

    numeric_columns = list(
        embeddings.select_dtypes(
            include=[np.number]
        ).columns
    )

    metadata_names = {
        "id",
        "skillid",
        "skill_id",
        "estimatedhours",
        "estimated_hours",
        "hours",
        "duration",
        "index",
    }

    filtered = []

    for column in numeric_columns:
        normalized = re.sub(
            r"[^a-z0-9]",
            "",
            str(column).lower(),
        )

        if normalized not in metadata_names:
            filtered.append(column)

    if len(filtered) == 384:
        return filtered

    if len(filtered) > 384:
        return filtered[-384:]

    if len(numeric_columns) == 384:
        return numeric_columns

    if len(numeric_columns) > 384:
        return numeric_columns[-384:]

    raise ValueError(
        "Could not identify 384 embedding dimensions. "
        f"Found {len(numeric_columns)} numeric columns."
    )


def load_embeddings(
    skills: pd.DataFrame,
) -> np.ndarray:

    if not EMBEDDINGS_FILE.exists():
        raise FileNotFoundError(
            f"Embeddings file not found:\n{EMBEDDINGS_FILE}"
        )

    embeddings = pd.read_csv(
        EMBEDDINGS_FILE
    )

    if embeddings.empty:
        raise ValueError(
            "skills_embeddings.csv is empty."
        )

    embedding_columns = detect_embedding_columns(
        embeddings
    )

    matrix = embeddings[
        embedding_columns
    ].to_numpy(
        dtype=np.float32
    )

    embedding_id_col = find_column(
        embeddings,
        [
            "skill_id",
            "skillId",
            "id",
            "node_id",
        ],
    )

    if embedding_id_col:

        embedding_ids = (
            embeddings[embedding_id_col]
            .fillna("")
            .astype(str)
            .str.strip()
        )

        embedding_lookup = {}

        for position, skill_id in enumerate(
            embedding_ids
        ):
            if skill_id:
                embedding_lookup[
                    skill_id
                ] = position

        ordered_rows = []
        missing = []

        for skill_id in skills["skillId"]:

            skill_id = str(skill_id)

            if skill_id in embedding_lookup:
                ordered_rows.append(
                    matrix[
                        embedding_lookup[
                            skill_id
                        ]
                    ]
                )
            else:
                missing.append(skill_id)

        if missing:
            raise ValueError(
                f"Missing embeddings for {len(missing)} skills. "
                f"Examples: {missing[:5]}"
            )

        matrix = np.vstack(
            ordered_rows
        )

    elif len(matrix) != len(skills):
        raise ValueError(
            "Embedding row count does not match "
            "skill dataset row count."
        )

    if matrix.shape[1] != 384:
        raise ValueError(
            f"Expected 384-dimensional embeddings, "
            f"got {matrix.shape[1]}."
        )

    norms = np.linalg.norm(
        matrix,
        axis=1,
        keepdims=True,
    )

    norms[norms == 0] = 1.0

    matrix = matrix / norms

    return matrix.astype(
        np.float32
    )


# ============================================================
# TRACK FILTERING
# ============================================================

def get_track_prefix(skill_id: str) -> str:
    skill_id = str(skill_id)

    if "_" in skill_id:
        return skill_id.split(
            "_",
            1
        )[0].lower()

    return skill_id.lower()


def allowed_track_prefixes(
    domain: str,
    technologies: Set[str],
) -> Set[str]:

    prefixes = set(
        GENERIC_PREFIXES.get(
            domain,
            set(),
        )
    )

    for technology in technologies:
        prefixes.update(
            TRACK_PREFIXES.get(
                technology,
                set(),
            )
        )

    return prefixes


def filter_candidates(
    skills: pd.DataFrame,
    domain: str,
    technologies: Set[str],
) -> pd.DataFrame:

    if domain == "general":
        result = skills.copy()
        result.reset_index(
            drop=True,
            inplace=True,
        )
        return result

    allowed_categories = DOMAIN_CATEGORIES.get(
        domain,
        {domain},
    )

    domain_skills = skills[
        skills["category"].isin(
            allowed_categories
        )
    ].copy()

    if domain_skills.empty:
        result = skills.copy()
        result.reset_index(
            drop=True,
            inplace=True,
        )
        return result

    prefixes = allowed_track_prefixes(
        domain,
        technologies,
    )

    if not prefixes:
        domain_skills.reset_index(
            drop=True,
            inplace=True,
        )
        return domain_skills

    prefix_values = domain_skills[
        "skillId"
    ].apply(
        get_track_prefix
    )

    scoped = domain_skills[
        prefix_values.isin(prefixes)
    ].copy()

    if scoped.empty:
        scoped = domain_skills.copy()

    scoped.reset_index(
        drop=True,
        inplace=True,
    )

    return scoped


# ============================================================
# RANKING
# ============================================================

def lexical_similarity(
    query_tokens: Set[str],
    title: str,
    description: str,
) -> float:

    title_tokens = tokenize(title)
    description_tokens = tokenize(description)

    if not query_tokens:
        return 0.0

    title_overlap = len(
        query_tokens & title_tokens
    )

    description_overlap = len(
        query_tokens & description_tokens
    )

    title_score = (
        title_overlap
        / max(
            1,
            len(query_tokens),
        )
    )

    description_score = (
        description_overlap
        / max(
            1,
            len(query_tokens),
        )
    )

    return min(
        1.0,
        title_score * 0.8
        + description_score * 0.2,
    )


def technology_match_score(
    text: str,
    title: str,
    skill_id: str,
) -> float:

    normalized_text = normalize_text(
        text
    )

    normalized_title = normalize_text(
        title
    )

    prefix = get_track_prefix(
        skill_id
    )

    technologies = detect_technologies(
        normalized_text
    )

    if not technologies:
        return 0.0

    score = 0.0

    for technology in technologies:

        for pattern in TECHNOLOGY_PATTERNS.get(
            technology,
            [],
        ):

            if contains_phrase(
                normalized_title,
                pattern,
            ):
                score = max(
                    score,
                    1.0,
                )

        if prefix in TRACK_PREFIXES.get(
            technology,
            set(),
        ):
            score = max(
                score,
                0.8,
            )

    return score


def rank_candidates(
    skills: pd.DataFrame,
    embeddings: np.ndarray,
    query_embedding: np.ndarray,
    query_text: str,
    domain: str,
    technologies: Set[str],
) -> pd.DataFrame:

    if len(skills) != len(embeddings):
        raise ValueError(
            "Candidate skill count does not match "
            "candidate embedding count: "
            f"{len(skills)} skills vs "
            f"{len(embeddings)} embeddings."
        )

    similarities = (
        embeddings @ query_embedding
    )

    query_tokens = tokenize(
        query_text
    )

    ranking_scores = []

    for position, (_, row) in enumerate(
        skills.iterrows()
    ):

        semantic = float(
            similarities[position]
        )

        lexical = lexical_similarity(
            query_tokens,
            row["title"],
            row["description"],
        )

        technology_score = technology_match_score(
            query_text,
            row["title"],
            row["skillId"],
        )

        domain_bonus = 0.0

        if domain != "general":
            if row["category"] in DOMAIN_CATEGORIES.get(
                domain,
                set(),
            ):
                domain_bonus = 0.20

        score = (
            semantic * 0.65
            + lexical * 0.20
            + technology_score * 0.15
            + domain_bonus
        )

        ranking_scores.append(
            score
        )

    ranked = skills.copy()

    ranked.reset_index(
        drop=True,
        inplace=True,
    )

    ranked["semanticScore"] = similarities
    ranked["rankingScore"] = ranking_scores

    ranked.sort_values(
        by="rankingScore",
        ascending=False,
        inplace=True,
        kind="mergesort",
    )

    ranked.reset_index(
        drop=True,
        inplace=True,
    )

    return ranked


# ============================================================
# DEPENDENCY GRAPH
# ============================================================

def build_graph(
    skills: pd.DataFrame,
) -> Tuple[
    Dict[str, str],
    Dict[str, Set[str]],
]:

    parent_map = {}

    skill_ids = set(
        skills["skillId"]
        .astype(str)
    )

    for _, row in skills.iterrows():

        skill_id = str(
            row["skillId"]
        ).strip()

        parent_id = str(
            row["parentId"]
        ).strip()

        if (
            parent_id
            and parent_id != "nan"
            and parent_id in skill_ids
            and parent_id != skill_id
        ):
            parent_map[
                skill_id
            ] = parent_id

    children_map = defaultdict(set)

    for child, parent in parent_map.items():
        children_map[parent].add(
            child
        )

    return parent_map, children_map


def collect_ancestors(
    skill_id: str,
    parent_map: Dict[str, str],
    allowed_ids: Set[str],
    max_depth: int = 50,
) -> List[str]:

    ancestors = []

    current = skill_id
    visited = {
        skill_id
    }

    depth = 0

    while current in parent_map:

        if depth >= max_depth:
            break

        parent = parent_map[
            current
        ]

        if parent in visited:
            break

        if parent not in allowed_ids:
            break

        ancestors.append(
            parent
        )

        visited.add(
            parent
        )

        current = parent
        depth += 1

    ancestors.reverse()

    return ancestors


def select_with_prerequisites(
    ranked: pd.DataFrame,
    parent_map: Dict[str, str],
    top_k: int,
) -> Set[str]:

    if ranked.empty:
        return set()

    allowed_ids = set(
        ranked["skillId"]
        .astype(str)
    )

    selected = set()

    # First select highly relevant skills
    # while automatically including prerequisites.
    for _, row in ranked.iterrows():

        skill_id = str(
            row["skillId"]
        )

        ancestors = collect_ancestors(
            skill_id,
            parent_map,
            allowed_ids,
        )

        required = (
            ancestors
            + [skill_id]
        )

        new_nodes = [
            node
            for node in required
            if node not in selected
        ]

        if (
            len(selected)
            + len(new_nodes)
            > top_k
        ):
            continue

        selected.update(
            required
        )

        if len(selected) >= top_k:
            break

    # Fill remaining slots with relevant skills.
    if len(selected) < top_k:

        for _, row in ranked.iterrows():

            if len(selected) >= top_k:
                break

            skill_id = str(
                row["skillId"]
            )

            if skill_id not in selected:
                selected.add(
                    skill_id
                )

    return selected


def topological_sort(
    selected_ids: Set[str],
    parent_map: Dict[str, str],
    ranking_lookup: Dict[str, float],
) -> List[str]:

    indegree = {
        node: 0
        for node in selected_ids
    }

    children = defaultdict(list)

    for child in selected_ids:

        parent = parent_map.get(
            child
        )

        if parent in selected_ids:

            indegree[
                child
            ] += 1

            children[
                parent
            ].append(
                child
            )

    # IMPORTANT:
    # Roots are sorted by foundational priority,
    # NOT semantic relevance alone.
    queue = [
        node
        for node, degree in indegree.items()
        if degree == 0
    ]

    queue.sort(
        key=lambda node: (
            foundation_priority(
                node
            ),
            ranking_lookup.get(
                node,
                0.0,
            ),
        ),
        reverse=True,
    )

    ordered = []

    while queue:

        node = queue.pop(0)

        ordered.append(
            node
        )

        for child in children.get(
            node,
            [],
        ):

            indegree[
                child
            ] -= 1

            if indegree[
                child
            ] == 0:

                queue.append(
                    child
                )

        queue.sort(
            key=lambda item: (
                foundation_priority(
                    item
                ),
                ranking_lookup.get(
                    item,
                    0.0,
                ),
            ),
            reverse=True,
        )

    if len(ordered) < len(
        selected_ids
    ):

        remaining = [
            node
            for node in selected_ids
            if node not in ordered
        ]

        remaining.sort(
            key=lambda node:
            ranking_lookup.get(
                node,
                0.0,
            ),
            reverse=True,
        )

        ordered.extend(
            remaining
        )

    return ordered


# ============================================================
# FOUNDATIONAL PRIORITY
# ============================================================

def foundation_priority(
    skill_id: str,
) -> int:

    sid = normalize_text(
        skill_id
    )

    foundational_words = [
        "fundamental",
        "basics",
        "basic",
        "introduction",
        "syntax",
        "core",
        "html",
        "network",
        "linux",
        "programming",
        "data structure",
        "algorithm",
        "database",
        "sql",
        "python",
        "javascript",
    ]

    advanced_words = [
        "production",
        "architecture",
        "distributed",
        "scaling",
        "advanced",
        "optimization",
        "microservices",
        "deployment",
        "penetration",
        "forensics",
        "mlops",
    ]

    score = 0

    for word in foundational_words:
        if word in sid:
            score += 5

    for word in advanced_words:
        if word in sid:
            score -= 3

    return score


def calculate_depth(
    skill_id: str,
    parent_map: Dict[str, str],
    selected_ids: Set[str],
) -> int:

    depth = 0
    current = skill_id
    visited = {
        skill_id
    }

    while True:

        parent = parent_map.get(
            current
        )

        if not parent:
            break

        if parent not in selected_ids:
            break

        if parent in visited:
            break

        visited.add(
            parent
        )

        current = parent
        depth += 1

    return depth


# ============================================================
# DETAILED SKILL KNOWLEDGE
# ============================================================

SKILL_KNOWLEDGE = {

    "html": {
        "topics": [
            "Document structure",
            "Semantic HTML",
            "Forms and validation",
            "Tables and lists",
            "Accessibility",
            "SEO fundamentals",
        ],
        "practical": [
            "Build accessible multi-page HTML interfaces",
            "Create forms with proper labels and validation",
            "Use semantic elements correctly",
        ],
        "tools": [
            "VS Code",
            "Chrome DevTools",
            "W3C Validator",
        ],
    },

    "javascript": {
        "topics": [
            "Variables and data types",
            "Functions and scope",
            "Arrays and objects",
            "DOM manipulation",
            "Events",
            "Asynchronous JavaScript",
            "Promises and async/await",
            "Modules",
        ],
        "practical": [
            "Build interactive browser applications",
            "Consume REST APIs",
            "Handle asynchronous operations",
            "Debug JavaScript applications",
        ],
        "tools": [
            "Node.js",
            "npm",
            "Chrome DevTools",
        ],
    },

    "python": {
        "topics": [
            "Variables and data types",
            "Control flow",
            "Functions",
            "Collections",
            "Object-oriented programming",
            "Modules and packages",
            "Exceptions",
            "File handling",
            "Virtual environments",
        ],
        "practical": [
            "Build command-line programs",
            "Create reusable Python modules",
            "Read and write files",
            "Consume APIs",
            "Debug Python programs",
        ],
        "tools": [
            "Python",
            "pip",
            "venv",
            "VS Code",
            "PyCharm",
        ],
    },

    "react": {
        "topics": [
            "Components",
            "Props",
            "State",
            "Hooks",
            "Event handling",
            "Conditional rendering",
            "Lists and keys",
            "Context",
            "Component architecture",
        ],
        "practical": [
            "Build reusable React components",
            "Manage application state",
            "Connect React applications to APIs",
            "Build production-ready interfaces",
        ],
        "tools": [
            "React",
            "Vite",
            "npm",
            "React DevTools",
        ],
    },

    "sql": {
        "topics": [
            "SELECT queries",
            "Filtering",
            "Sorting",
            "Joins",
            "Aggregation",
            "Subqueries",
            "Indexes",
            "Transactions",
            "Constraints",
            "Database design",
        ],
        "practical": [
            "Design relational schemas",
            "Write complex queries",
            "Optimize database queries",
            "Use transactions safely",
        ],
        "tools": [
            "PostgreSQL",
            "MySQL",
            "DBeaver",
        ],
    },

    "cybersecurity": {
        "topics": [
            "CIA triad",
            "Threats and vulnerabilities",
            "Authentication and authorization",
            "Network security",
            "Web security",
            "Cryptography",
            "Secure coding",
            "Security monitoring",
            "Incident response",
        ],
        "practical": [
            "Identify common security vulnerabilities",
            "Analyze network traffic",
            "Perform basic security assessments",
            "Harden systems and applications",
        ],
        "tools": [
            "Wireshark",
            "Nmap",
            "Burp Suite",
            "Linux",
        ],
    },

    "devops": {
        "topics": [
            "Linux",
            "Networking",
            "Git",
            "CI/CD",
            "Containers",
            "Docker",
            "Kubernetes",
            "Cloud infrastructure",
            "Infrastructure as Code",
            "Monitoring",
        ],
        "practical": [
            "Containerize applications",
            "Build CI/CD pipelines",
            "Deploy applications",
            "Monitor production systems",
        ],
        "tools": [
            "Git",
            "Docker",
            "Kubernetes",
            "Terraform",
            "AWS",
        ],
    },

    "backend": {
        "topics": [
            "HTTP",
            "REST APIs",
            "Routing",
            "Middleware",
            "Authentication",
            "Authorization",
            "Databases",
            "Caching",
            "Testing",
            "Deployment",
        ],
        "practical": [
            "Build REST APIs",
            "Connect applications to databases",
            "Implement authentication",
            "Handle errors correctly",
            "Deploy backend services",
        ],
        "tools": [
            "Node.js",
            "Express",
            "PostgreSQL",
            "Redis",
            "Docker",
        ],
    },

    "ai_ml": {
        "topics": [
            "Python for ML",
            "Linear algebra",
            "Probability and statistics",
            "Data preprocessing",
            "Supervised learning",
            "Unsupervised learning",
            "Model evaluation",
            "Neural networks",
            "Deep learning",
            "Model deployment",
        ],
        "practical": [
            "Prepare datasets",
            "Train machine-learning models",
            "Evaluate models",
            "Build inference pipelines",
            "Deploy ML models",
        ],
        "tools": [
            "Python",
            "NumPy",
            "Pandas",
            "scikit-learn",
            "PyTorch",
        ],
    },

    "cpp": {
        "topics": [
            "C++ syntax",
            "Variables and types",
            "Functions",
            "Pointers and references",
            "Classes",
            "Inheritance",
            "Templates",
            "STL",
            "Memory management",
            "Modern C++",
        ],
        "practical": [
            "Build efficient C++ applications",
            "Use STL containers and algorithms",
            "Manage memory safely",
            "Design object-oriented C++ systems",
        ],
        "tools": [
            "GCC",
            "Clang",
            "CMake",
            "GDB",
        ],
    },
}


def infer_knowledge(
    title: str,
    category: str,
) -> Dict[str, List[str]]:

    normalized = normalize_text(
        title
    )

    # Direct category knowledge.
    if category in SKILL_KNOWLEDGE:
        base = SKILL_KNOWLEDGE[
            category
        ].copy()
    else:
        base = {
            "topics": [],
            "practical": [],
            "tools": [],
        }

    # Technology-specific knowledge.
    technology_rules = {
        "docker": (
            ["Images", "Containers", "Volumes", "Networks", "Dockerfiles"],
            ["Containerize an application", "Create multi-container services"],
            ["Docker", "Docker Compose"],
        ),

        "kubernetes": (
            ["Pods", "Deployments", "Services", "ConfigMaps", "Secrets", "Ingress"],
            ["Deploy an application to Kubernetes", "Scale workloads"],
            ["kubectl", "Kubernetes", "Helm"],
        ),

        "aws": (
            ["IAM", "EC2", "S3", "VPC", "CloudWatch", "Load Balancing"],
            ["Deploy a service on AWS", "Configure cloud resources"],
            ["AWS Console", "AWS CLI"],
        ),

        "typescript": (
            ["Types", "Interfaces", "Generics", "Unions", "Type narrowing"],
            ["Convert JavaScript applications to TypeScript", "Build typed APIs"],
            ["TypeScript", "tsc"],
        ),

        "nextjs": (
            ["Routing", "Layouts", "Server Components", "Data fetching", "Deployment"],
            ["Build a production Next.js application", "Implement routing and data fetching"],
            ["Next.js", "React", "Vercel"],
        ),

        "postgres": (
            ["Schema design", "Indexes", "Transactions", "Query planning", "Constraints"],
            ["Design PostgreSQL schemas", "Optimize PostgreSQL queries"],
            ["PostgreSQL", "psql", "pgAdmin"],
        ),

        "api": (
            ["HTTP methods", "Status codes", "Headers", "Authentication", "Validation"],
            ["Design REST APIs", "Test API endpoints", "Document APIs"],
            ["Postman", "Swagger/OpenAPI"],
        ),

        "testing": (
            ["Unit testing", "Integration testing", "Mocks", "Assertions", "Test coverage"],
            ["Write automated tests", "Build a regression test suite"],
            ["Jest", "Pytest", "Vitest"],
        ),

        "authentication": (
            ["Sessions", "Tokens", "Passwords", "OAuth", "JWT"],
            ["Implement login", "Protect API routes", "Manage sessions"],
            ["JWT", "OAuth 2.0"],
        ),

        "network": (
            ["TCP/IP", "DNS", "HTTP", "Ports", "Routing", "Firewalls"],
            ["Inspect network traffic", "Troubleshoot connectivity"],
            ["Wireshark", "Nmap"],
        ),

        "security": (
            ["Threats", "Vulnerabilities", "Authentication", "Authorization", "Secure configuration"],
            ["Harden an application", "Identify common vulnerabilities"],
            ["OWASP", "Burp Suite"],
        ),

        "machine learning": (
            ["Features", "Labels", "Training", "Validation", "Overfitting", "Evaluation metrics"],
            ["Train and evaluate ML models", "Build a complete ML pipeline"],
            ["scikit-learn", "Pandas", "NumPy"],
        ),

        "deep learning": (
            ["Tensors", "Neural networks", "Backpropagation", "Optimizers", "Regularization"],
            ["Build and train neural networks", "Evaluate deep-learning models"],
            ["PyTorch", "TensorFlow"],
        ),

        "database": (
            ["Schema design", "Keys", "Relationships", "Indexes", "Transactions"],
            ["Design relational databases", "Write optimized queries"],
            ["PostgreSQL", "MySQL"],
        ),

        "redis": (
            ["Keys", "Data structures", "Expiration", "Caching", "Pub/Sub"],
            ["Implement application caching", "Build cache invalidation strategies"],
            ["Redis", "redis-cli"],
        ),
    }

    for keyword, knowledge in technology_rules.items():

        if keyword in normalized:

            topics, practical, tools = knowledge

            base["topics"] = list(
                dict.fromkeys(
                    base["topics"]
                    + topics
                )
            )

            base["practical"] = list(
                dict.fromkeys(
                    base["practical"]
                    + practical
                )
            )

            base["tools"] = list(
                dict.fromkeys(
                    base["tools"]
                    + tools
                )
            )

    # Generic fallback for every possible future skill.
    if not base["topics"]:
        base["topics"] = [
            f"{title} fundamentals",
            f"{title} core concepts",
            f"{title} practical usage",
            f"{title} common patterns",
            f"{title} troubleshooting",
            f"{title} best practices",
        ]

    if not base["practical"]:
        base["practical"] = [
            f"Build a practical project using {title}",
            f"Apply {title} to a realistic problem",
            f"Debug and improve a {title}-based implementation",
        ]

    if not base["tools"]:
        base["tools"] = [
            "VS Code",
            "Git",
            "Official documentation",
        ]

    return base


def build_detailed_description(
    title: str,
    category: str,
    parent_title: Optional[str],
) -> Dict[str, Any]:

    knowledge = infer_knowledge(
        title,
        category,
    )

    if parent_title:
        prerequisite_text = (
            f"Builds on {parent_title}. "
        )
    else:
        prerequisite_text = (
            "This is a foundational or independent skill. "
        )

    description = (
        f"{title} focuses on the concepts and practical abilities "
        f"needed to use this skill effectively in real-world projects. "
        f"{prerequisite_text}"
        f"Learners should understand the underlying concepts, "
        f"practice implementation, debug common problems, "
        f"and apply the skill in a project."
    )

    return {
        "description": description,
        "topics": knowledge["topics"],
        "practicalSkills": knowledge["practical"],
        "tools": knowledge["tools"],
    }


# ============================================================
# PHASE ASSIGNMENT
# ============================================================

def phase_for_skill(
    depth: int,
    title: str,
) -> str:

    normalized = normalize_text(
        title
    )

    advanced_markers = [
        "advanced",
        "production",
        "architecture",
        "distributed",
        "scaling",
        "microservices",
        "optimization",
        "mlops",
        "penetration testing",
        "digital forensics",
        "cloud security",
    ]

    intermediate_markers = [
        "api",
        "authentication",
        "authorization",
        "testing",
        "database",
        "react",
        "typescript",
        "docker",
        "kubernetes",
        "cryptography",
        "vulnerability",
    ]

    if depth >= 4:
        return "Advanced"

    if any(
        marker in normalized
        for marker in advanced_markers
    ):
        return "Advanced"

    if depth >= 2:
        return "Intermediate"

    if any(
        marker in normalized
        for marker in intermediate_markers
    ):
        return "Intermediate"

    return "Foundations"


# ============================================================
# ROADMAP GENERATION
# ============================================================

def generate_roadmap(
    profile: Dict[str, Any],
) -> Dict[str, Any]:

    goal_text = build_goal_text(
        profile
    )

    domain = detect_domain(
        goal_text
    )

    technologies = detect_technologies(
        goal_text
    )

    try:
        top_k = int(
            profile.get(
                "topK",
                30,
            )
        )
    except Exception:
        top_k = 30

    top_k = max(
        1,
        min(
            top_k,
            100,
        ),
    )

    skills = load_skill_data()

    embeddings = load_embeddings(
        skills
    )

    if len(skills) != len(
        embeddings
    ):
        raise ValueError(
            "Global skill/embedding mismatch: "
            f"{len(skills)} skills vs "
            f"{len(embeddings)} embeddings."
        )

    # Load embedding model.
    model = SentenceTransformer(
        MODEL_NAME
    )

    query_embedding = model.encode(
        [goal_text],
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )[0].astype(
        np.float32
    )

    # --------------------------------------------------------
    # DOMAIN FILTER
    # --------------------------------------------------------

    candidate_skills = filter_candidates(
        skills,
        domain,
        technologies,
    )

    if candidate_skills.empty:
        raise ValueError(
            f"No candidate skills found for domain '{domain}'."
        )

    # --------------------------------------------------------
    # ALIGN EMBEDDINGS
    # --------------------------------------------------------

    skill_index = {
        str(skill_id): position
        for position, skill_id in enumerate(
            skills["skillId"]
        )
    }

    candidate_indices = []

    for skill_id in candidate_skills[
        "skillId"
    ]:

        skill_id = str(
            skill_id
        )

        if skill_id not in skill_index:
            raise ValueError(
                f"Skill '{skill_id}' is missing "
                "from the embedding index."
            )

        candidate_indices.append(
            skill_index[skill_id]
        )

    candidate_embeddings = embeddings[
        candidate_indices
    ]

    # --------------------------------------------------------
    # SEMANTIC + LEXICAL + TECHNOLOGY RANKING
    # --------------------------------------------------------

    ranked = rank_candidates(
        candidate_skills,
        candidate_embeddings,
        query_embedding,
        goal_text,
        domain,
        technologies,
    )

    # Keep a large candidate pool before prerequisite
    # expansion.
    candidate_pool_size = min(
        len(ranked),
        max(
            top_k * 4,
            80,
        ),
    )

    ranked = ranked.iloc[
        :candidate_pool_size
    ].copy()

    ranked.reset_index(
        drop=True,
        inplace=True,
    )

    # --------------------------------------------------------
    # GRAPH
    # --------------------------------------------------------

    parent_map, _ = build_graph(
        skills
    )

    allowed_ids = set(
        ranked["skillId"]
        .astype(str)
    )

    filtered_parent_map = {}

    for child, parent in parent_map.items():

        if (
            child in allowed_ids
            and parent in allowed_ids
        ):
            filtered_parent_map[
                child
            ] = parent

    # --------------------------------------------------------
    # SELECT WITH PREREQUISITES
    # --------------------------------------------------------

    selected_ids = select_with_prerequisites(
        ranked,
        filtered_parent_map,
        top_k,
    )

    ranking_lookup = {
        str(row["skillId"]):
        float(row["rankingScore"])
        for _, row in ranked.iterrows()
    }

    # --------------------------------------------------------
    # TOPOLOGICAL ORDER
    # --------------------------------------------------------

    ordered_ids = topological_sort(
        selected_ids,
        filtered_parent_map,
        ranking_lookup,
    )

    # Do not blindly slice here if doing so would remove a
    # prerequisite from an already selected child.
    # Selection already respects top_k, so this is safe.
    ordered_ids = ordered_ids[
        :top_k
    ]

    skill_lookup = {
        str(row["skillId"]): row
        for _, row in skills.iterrows()
    }

    ranked_lookup = {
        str(row["skillId"]): row
        for _, row in ranked.iterrows()
    }

    # --------------------------------------------------------
    # BUILD FINAL OUTPUT
    # --------------------------------------------------------

    output_skills = []

    for order, skill_id in enumerate(
        ordered_ids,
        start=1,
    ):

        row = skill_lookup.get(
            skill_id
        )

        if row is None:
            continue

        parent_id = filtered_parent_map.get(
            skill_id
        )

        if parent_id not in selected_ids:
            parent_id = None

        parent_title = None

        if parent_id:

            parent_row = skill_lookup.get(
                parent_id
            )

            if parent_row is not None:
                parent_title = str(
                    parent_row["title"]
                )

        title = str(
            row["title"]
        ).strip()

        category = str(
            row["category"]
        ).strip()

        detailed = build_detailed_description(
            title,
            category,
            parent_title,
        )

        ranked_row = ranked_lookup.get(
            skill_id
        )

        semantic_score = (
            float(
                ranked_row[
                    "semanticScore"
                ]
            )
            if ranked_row is not None
            else 0.0
        )

        depth = calculate_depth(
            skill_id,
            filtered_parent_map,
            selected_ids,
        )

        phase = phase_for_skill(
            depth,
            title,
        )

        output_skills.append(
            {
                "order": order,
                "skillId": skill_id,
                "title": title,

                "description": detailed[
                    "description"
                ],

                "topics": detailed[
                    "topics"
                ],

                "practicalSkills": detailed[
                    "practicalSkills"
                ],

                "tools": detailed[
                    "tools"
                ],

                "estimatedHours": float(
                    row["estimatedHours"]
                ),

                "category": category,

                "phase": phase,

                "parentId": parent_id,

                "parentTitle": parent_title,

                "semanticScore": round(
                    semantic_score,
                    4,
                ),

                "prerequisiteDepth": depth,
            }
        )

    # --------------------------------------------------------
    # PROJECT CALLOUTS
    # Last skill of each phase gets a capstone-style project.
    # --------------------------------------------------------

    callout_levels = {
        "Foundations": "beginner",
        "Intermediate": "intermediate",
        "Advanced": "advanced",
    }

    for skill in output_skills:
        skill["projectCallout"] = None

    last_in_phase = {}

    for skill in output_skills:
        last_in_phase[skill["phase"]] = skill

    for phase_name, skill in last_in_phase.items():

        level = callout_levels.get(
            phase_name,
            "intermediate",
        )

        tools_text = ", ".join(
            skill.get("tools", [])[:3]
        )

        skill["projectCallout"] = {
            "title": f"{phase_name} Project: {skill['title']}",
            "description": (
                f"Build a small project that applies "
                f"{skill['title']} and the skills before it"
                + (f" using {tools_text}" if tools_text else "")
                + ". Ship it with a short README."
            ),
            "level": level,
        }

    total_hours = sum(
        skill["estimatedHours"]
        for skill in output_skills
    )

    # --------------------------------------------------------
    # PHASE SUMMARY
    # --------------------------------------------------------

    phase_summary = defaultdict(
        lambda: {
            "skillCount": 0,
            "hours": 0.0,
            "skills": [],
        }
    )

    for skill in output_skills:

        phase = skill[
            "phase"
        ]

        phase_summary[
            phase
        ]["skillCount"] += 1

        phase_summary[
            phase
        ]["hours"] += skill[
            "estimatedHours"
        ]

        phase_summary[
            phase
        ]["skills"].append(
            skill["title"]
        )

    phases = []

    phase_order = [
        "Foundations",
        "Intermediate",
        "Advanced",
    ]

    for phase_name in phase_order:

        if phase_name not in phase_summary:
            continue

        phases.append(
            {
                "name": phase_name,
                "skillCount": phase_summary[
                    phase_name
                ]["skillCount"],
                "estimatedHours": round(
                    phase_summary[
                        phase_name
                    ]["hours"],
                    1,
                ),
                "skills": phase_summary[
                    phase_name
                ]["skills"],
            }
        )

    # --------------------------------------------------------
    # FINAL CONTRACT
    # --------------------------------------------------------

    return {
        "success": True,
        "engine": "hermes-ml",

        "goal": goal_text,

        "domain": domain,

        "technologies": sorted(
            technologies
        ),

        "skillCount": len(
            output_skills
        ),

        "totalHours": round(
            total_hours,
            1,
        ),

        "phases": phases,

        "skills": output_skills,
    }


# ============================================================
# STDIN API
# ============================================================

def run_from_stdin() -> None:

    try:

        raw = sys.stdin.read()

        if not raw.strip():
            raise ValueError(
                "No JSON profile received on stdin."
            )

        profile = json.loads(
            raw
        )

        if not isinstance(
            profile,
            dict,
        ):
            raise ValueError(
                "Input JSON must be an object."
            )

        result = generate_roadmap(
            profile
        )

        # IMPORTANT:
        # stdout contains ONLY JSON so Node.js can parse it.
        print(
            json.dumps(
                result,
                ensure_ascii=False,
            )
        )

    except Exception as exc:

        print(
            json.dumps(
                {
                    "success": False,
                    "engine": "hermes-ml",
                    "error": str(exc),
                },
                ensure_ascii=False,
            )
        )

        sys.exit(1)


if __name__ == "__main__":
    run_from_stdin()