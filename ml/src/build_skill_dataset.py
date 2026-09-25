import os
import re
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

DATA_DIR = os.path.join(BASE_DIR, "data")

CLEAN_DATASET = os.path.join(
    DATA_DIR,
    "skills_clean.csv"
)

OUTPUT_DATASET = os.path.join(
    DATA_DIR,
    "skills_model.csv"
)


# ============================================================
# PREREQUISITE HELPERS
# ============================================================

def make_rows(prefix, items, dependencies=None):
    """
    Build curriculum rows.

    items:
        (slug, title, estimated_hours)

    dependencies:
        dict:
            index -> prerequisite index(es)

    IMPORTANT:
    This does NOT create an artificial linear chain.
    Each skill receives only the prerequisite(s) that
    actually make sense for that curriculum.
    """

    rows = []

    for index, (slug, title, hours) in enumerate(items, start=1):

        skill_id = f"{prefix}_{slug}"

        parent_id = ""

        if dependencies and index in dependencies:

            deps = dependencies[index]

            if isinstance(deps, int):
                deps = [deps]

            if deps:
                # Current schema supports one parent_id.
                # Use the primary prerequisite.
                parent_index = deps[0]

                if 1 <= parent_index <= len(items):
                    parent_slug = items[
                        parent_index - 1
                    ][0]

                    parent_id = (
                        f"{prefix}_{parent_slug}"
                    )

        rows.append({
            "skill_id": skill_id,
            "name": title,
            "estimated_hours": hours,
            "parent_id": parent_id,
        })

    return rows


# ============================================================
# CURRICULUM
# ============================================================

CURRICULUM = []


# ============================================================
# PYTHON
# ============================================================

PYTHON_ITEMS = [
    ("fundamentals", "Python Fundamentals", 10),
    ("syntax", "Python Syntax and Control Flow", 8),
    ("types", "Python Data Types and Variables", 8),
    ("collections", "Lists, Tuples, Sets and Dictionaries", 10),
    ("functions", "Functions and Scope", 8),
    ("modules", "Modules and Packages", 8),
    ("exceptions", "Exception Handling", 6),
    ("files", "File Handling and Serialization", 8),
    ("oop", "Object-Oriented Python", 12),
    ("iterators", "Iterators and Iterables", 8),
    ("generators", "Generators", 8),
    ("decorators", "Decorators and Context Managers", 10),
    ("typing", "Type Hints and Static Typing", 8),
    ("dataclasses", "Dataclasses", 6),
    ("venv", "Virtual Environments and Dependency Management", 6),
    ("testing", "Python Testing with Pytest", 10),
    ("logging", "Logging and Debugging", 6),
    ("http", "HTTP Clients and APIs", 8),
    ("sql", "Python and SQL", 10),
    ("async", "Asyncio and Asynchronous Python", 12),
    ("concurrency", "Concurrency and Multiprocessing", 10),
    ("packaging", "Python Packaging and Distribution", 10),
    ("performance", "Python Performance Optimization", 10),
    ("profiling", "Profiling Python Applications", 8),
    ("fastapi", "FastAPI", 12),
    ("django", "Django", 14),
    ("data", "Python for Data Work", 12),
    ("automation", "Python Automation", 8),
    ("security", "Python Security Practices", 10),
    ("architecture", "Python Application Architecture", 12),
    ("production", "Production Python Engineering", 14),
]

PYTHON_DEPS = {
    2: 1,
    3: 1,
    4: 3,
    5: 1,
    6: 5,
    7: 1,
    8: 1,
    9: 5,
    10: 5,
    11: 10,
    12: 9,
    13: 1,
    14: 9,
    15: 1,
    16: 15,
    17: 1,
    18: 1,
    19: 1,
    20: 5,
    21: 20,
    22: 15,
    23: 1,
    24: 23,
    25: 18,
    26: 18,
    27: 1,
    28: 5,
    29: 1,
    30: 9,
    31: 30,
}

CURRICULUM += make_rows(
    "py",
    PYTHON_ITEMS,
    PYTHON_DEPS
)


# ============================================================
# JAVASCRIPT
# ============================================================

JS_ITEMS = [
    ("fundamentals", "JavaScript Fundamentals", 10),
    ("syntax", "JavaScript Syntax and Control Flow", 8),
    ("types", "Types, Coercion and Equality", 8),
    ("functions", "Functions and Scope", 8),
    ("objects", "Objects and Prototypes", 10),
    ("arrays", "Arrays and Collection Methods", 8),
    ("dom", "DOM Manipulation", 10),
    ("events", "Browser Events", 8),
    ("modules", "ES Modules", 8),
    ("async", "Promises and Async Await", 10),
    ("fetch", "Fetch API and HTTP", 8),
    ("storage", "Browser Storage", 6),
    ("errors", "JavaScript Error Handling", 6),
    ("closures", "Closures", 8),
    ("this", "this and Execution Context", 8),
    ("classes", "JavaScript Classes", 8),
    ("tooling", "npm and JavaScript Tooling", 8),
    ("bundlers", "Bundlers and Build Systems", 8),
    ("testing", "JavaScript Testing", 10),
    ("typescript", "TypeScript Fundamentals", 12),
    ("advancedts", "Advanced TypeScript", 12),
    ("performance", "JavaScript Performance", 10),
    ("security", "Browser Security Fundamentals", 8),
    ("node", "Node.js Fundamentals", 12),
    ("backend", "JavaScript Backend Development", 12),
    ("realtime", "WebSockets and Real-Time JavaScript", 10),
    ("patterns", "JavaScript Design Patterns", 10),
    ("architecture", "JavaScript Application Architecture", 12),
    ("fullstack", "Full-Stack JavaScript", 14),
    ("production", "Production JavaScript Engineering", 14),
]

JS_DEPS = {
    2: 1,
    3: 1,
    4: 1,
    5: 4,
    6: 1,
    7: 6,
    8: 7,
    9: 1,
    10: 4,
    11: 10,
    12: 7,
    13: 1,
    14: 4,
    15: 4,
    16: 5,
    17: 1,
    18: 17,
    19: 1,
    20: 1,
    21: 20,
    22: 1,
    23: 1,
    24: 1,
    25: 24,
    26: 10,
    27: 5,
    28: 27,
    29: 25,
    30: 29,
}

CURRICULUM += make_rows(
    "js",
    JS_ITEMS,
    JS_DEPS
)


# ============================================================
# FRONTEND
# ============================================================

FRONTEND_ITEMS = [
    ("html", "HTML Fundamentals", 8),
    ("semantic", "Semantic HTML", 6),
    ("css", "CSS Fundamentals", 10),
    ("layout", "Flexbox and Grid", 10),
    ("responsive", "Responsive Web Design", 8),
    ("accessibility", "Web Accessibility", 8),
    ("javascript", "JavaScript for Frontend", 12),
    ("dom", "DOM and Browser APIs", 8),
    ("typescript", "TypeScript for Frontend", 10),
    ("git", "Git for Frontend Development", 6),
    ("npm", "Frontend Package Management", 6),
    ("react", "React Fundamentals", 12),
    ("components", "React Components and Props", 8),
    ("state", "React State Management", 10),
    ("hooks", "React Hooks", 10),
    ("forms", "Frontend Forms and Validation", 8),
    ("routing", "Client-Side Routing", 8),
    ("api", "Frontend API Integration", 8),
    ("query", "Server State and Data Fetching", 10),
    ("zustand", "Client State Management", 8),
    ("next", "Next.js", 14),
    ("ssr", "SSR, SSG and Rendering Strategies", 10),
    ("testing", "Frontend Testing", 10),
    ("e2e", "End-to-End Web Testing", 10),
    ("performance", "Frontend Performance Optimization", 12),
    ("pwa", "Progressive Web Apps", 8),
    ("security", "Frontend Security", 8),
    ("designsystem", "Design Systems", 10),
    ("advanced_accessibility", "Advanced Accessibility", 8),
    ("production", "Production Frontend Engineering", 14),
]

FRONTEND_DEPS = {
    2: 1,
    3: 1,
    4: 3,
    5: 4,
    6: 2,
    7: 1,
    8: 7,
    9: 7,
    10: 1,
    11: 10,
    12: 7,
    13: 12,
    14: 13,
    15: 14,
    16: 13,
    17: 12,
    18: 7,
    19: 18,
    20: 14,
    21: 12,
    22: 21,
    23: 12,
    24: 23,
    25: 12,
    26: 5,
    27: 7,
    28: 12,
    29: 6,
    30: 25,
}

CURRICULUM += make_rows(
    "fe",
    FRONTEND_ITEMS,
    FRONTEND_DEPS
)


# ============================================================
# BACKEND
# ============================================================

BACKEND_ITEMS = [
    ("fundamentals", "Backend Development Fundamentals", 10),
    ("http", "HTTP Fundamentals", 8),
    ("rest", "REST API Design", 10),
    ("json", "JSON and Data Serialization", 6),
    ("routing", "Server Routing and Middleware", 8),
    ("validation", "API Validation", 8),
    ("errors", "Backend Error Handling", 8),
    ("sql", "SQL Fundamentals", 12),
    ("postgres", "PostgreSQL", 12),
    ("orm", "ORM and Data Access Patterns", 10),
    ("transactions", "Database Transactions", 10),
    ("indexes", "Database Indexing", 8),
    ("auth", "Authentication", 10),
    ("authorization", "Authorization and RBAC", 8),
    ("jwt", "JWT Authentication", 8),
    ("oauth", "OAuth 2.0 and OpenID Connect", 10),
    ("redis", "Redis and Caching", 10),
    ("queues", "Message Queues", 10),
    ("websockets", "WebSockets", 10),
    ("testing", "Backend Testing", 10),
    ("documentation", "API Documentation", 6),
    ("security", "Backend Security", 12),
    ("docker", "Containerized Backend Services", 10),
    ("observability", "Backend Observability", 10),
    ("scaling", "Backend Scaling", 12),
    ("architecture", "Backend Architecture", 14),
    ("microservices", "Microservices", 14),
    ("distributed", "Distributed Systems Fundamentals", 14),
    ("resilience", "Resilient Backend Systems", 12),
    ("production", "Production Backend Engineering", 16),
]

BACKEND_DEPS = {
    2: 1,
    3: 2,
    4: 1,
    5: 1,
    6: 5,
    7: 5,
    8: 1,
    9: 8,
    10: 9,
    11: 9,
    12: 9,
    13: 5,
    14: 13,
    15: 13,
    16: 15,
    17: 1,
    18: 1,
    19: 5,
    20: 5,
    21: 3,
    22: 13,
    23: 5,
    24: 1,
    25: 24,
    26: 25,
    27: 26,
    28: 27,
    29: 28,
    30: 26,
}

CURRICULUM += make_rows(
    "be",
    BACKEND_ITEMS,
    BACKEND_DEPS
)


# ============================================================
# DATA
# ============================================================

DATA_ITEMS = [
    ("fundamentals", "Data Fundamentals", 8),
    ("excel", "Excel for Data Analysis", 10),
    ("sql", "SQL Fundamentals", 12),
    ("advanced_sql", "Advanced SQL", 12),
    ("database", "Relational Databases", 10),
    ("cleaning", "Data Cleaning", 10),
    ("wrangling", "Data Wrangling", 10),
    ("statistics", "Statistics for Data Analysis", 14),
    ("eda", "Exploratory Data Analysis", 10),
    ("python", "Python for Data Analysis", 12),
    ("numpy", "NumPy", 8),
    ("pandas", "Pandas", 12),
    ("visualization", "Data Visualization", 10),
    ("matplotlib", "Matplotlib", 8),
    ("powerbi", "Power BI", 12),
    ("tableau", "Tableau", 12),
    ("etl", "ETL Pipelines", 10),
    ("elt", "ELT Pipelines", 10),
    ("warehouse", "Data Warehousing", 12),
    ("dimensional", "Dimensional Modeling", 10),
    ("dbt", "dbt", 10),
    ("airflow", "Apache Airflow", 12),
    ("spark", "Apache Spark", 14),
    ("streaming", "Data Streaming", 12),
    ("bigquery", "BigQuery", 10),
    ("snowflake", "Snowflake", 10),
    ("dataengineering", "Data Engineering", 14),
    ("analyticsengineering", "Analytics Engineering", 12),
    ("dataquality", "Data Quality Engineering", 10),
    ("production", "Production Data Engineering", 16),
]

DATA_DEPS = {
    2: 1,
    3: 1,
    4: 3,
    5: 3,
    6: 1,
    7: 6,
    8: 1,
    9: 8,
    10: 1,
    11: 10,
    12: 11,
    13: 9,
    14: 13,
    15: 13,
    16: 13,
    17: 3,
    18: 3,
    19: 5,
    20: 19,
    21: 19,
    22: 17,
    23: 17,
    24: 1,
    25: 3,
    26: 3,
    27: 17,
    28: 21,
    29: 27,
    30: 27,
}

CURRICULUM += make_rows(
    "data",
    DATA_ITEMS,
    DATA_DEPS
)


# ============================================================
# AI / ML
# ============================================================

AI_ROWS = [
    ("ai_python_ml", "Python for Machine Learning", 12, ""),
    ("ai_numpy", "NumPy for Machine Learning", 10, "ai_python_ml"),
    ("ai_pandas", "Pandas for Machine Learning", 12, "ai_python_ml"),
    ("ai_probability", "Probability Foundations for Machine Learning", 12, ""),
    ("ai_statistics", "Statistics for Machine Learning", 14, "ai_probability"),
    ("ai_linear_algebra", "Linear Algebra for Machine Learning", 16, ""),
    ("ai_calculus", "Calculus and Optimization for Machine Learning", 16, "ai_linear_algebra"),
    ("ai_data_preprocessing", "Machine Learning Data Preprocessing", 10, "ai_pandas"),
    ("ai_ml_fundamentals", "Machine Learning Fundamentals", 14, "ai_statistics"),
    ("ai_supervised", "Supervised Learning Algorithms", 18, "ai_ml_fundamentals"),
    ("ai_unsupervised", "Unsupervised Learning", 14, "ai_ml_fundamentals"),
    ("ai_feature_engineering", "Feature Engineering", 12, "ai_data_preprocessing"),
    ("ai_model_evaluation", "Machine Learning Model Evaluation", 12, "ai_supervised"),
    ("ai_sklearn", "Scikit-learn Machine Learning", 16, "ai_model_evaluation"),
    ("ai_ensemble", "Ensemble Learning", 12, "ai_sklearn"),
    ("ai_deep_learning", "Deep Learning Fundamentals", 18, "ai_calculus"),
    ("ai_pytorch", "PyTorch Deep Learning Engineering", 18, "ai_deep_learning"),
    ("ai_cnn", "Convolutional Neural Networks", 14, "ai_pytorch"),
    ("ai_sequence", "Sequence Models and Recurrent Neural Networks", 14, "ai_pytorch"),
    ("ai_nlp", "Natural Language Processing Fundamentals", 16, "ai_sequence"),
    ("ai_transformers", "Transformers and Attention Mechanisms", 18, "ai_nlp"),
    ("ai_llm", "Large Language Models", 18, "ai_transformers"),
    ("ai_embeddings", "Embeddings and Semantic Search", 12, "ai_llm"),
    ("ai_vector_db", "Vector Databases", 12, "ai_embeddings"),
    ("ai_rag", "Retrieval-Augmented Generation", 18, "ai_vector_db"),
    ("ai_finetuning", "LLM Fine-Tuning", 16, "ai_llm"),
    ("ai_agents", "AI Agents and Tool Calling", 16, "ai_rag"),
    ("ai_evaluation", "LLM Evaluation and AI Quality", 14, "ai_rag"),
    ("ai_deployment", "Machine Learning Model Deployment", 18, "ai_sklearn"),
    ("ai_mlops", "MLOps and Machine Learning Systems", 18, "ai_deployment"),
    ("ai_multimodal", "Multimodal AI", 16, "ai_transformers"),
    ("ai_guardrails", "LLM Safety, Guardrails and Reliability", 12, "ai_evaluation"),
    ("ai_production", "Production Generative AI Systems", 18, "ai_mlops"),
]

for skill_id, name, hours, parent_id in AI_ROWS:
    CURRICULUM.append({
        "skill_id": skill_id,
        "name": name,
        "estimated_hours": hours,
        "parent_id": parent_id,
    })


# ============================================================
# C++
# ============================================================

CPP_ITEMS = [
    ("fundamentals", "C++ Fundamentals", 10),
    ("syntax", "C++ Syntax and Control Flow", 8),
    ("functions", "Functions and References", 8),
    ("pointers", "Pointers and Memory", 12),
    ("arrays", "Arrays, Strings and Containers", 8),
    ("oop", "Object-Oriented C++", 12),
    ("constructors", "Constructors and Destructors", 10),
    ("raii", "RAII and Resource Management", 10),
    ("stl", "STL Containers", 10),
    ("algorithms", "STL Algorithms", 10),
    ("iterators", "Iterators", 8),
    ("templates", "Templates", 12),
    ("exceptions", "Exception Handling", 6),
    ("smartptr", "Smart Pointers", 10),
    ("move", "Move Semantics", 10),
    ("rule5", "Rule of Zero, Three and Five", 8),
    ("lambdas", "Lambdas and Functional C++", 8),
    ("modern", "Modern C++", 12),
    ("memory", "Advanced Memory Management", 12),
    ("concurrency", "C++ Concurrency", 14),
    ("threads", "Threads, Mutexes and Atomics", 12),
    ("cmake", "CMake", 10),
    ("testing", "C++ Testing", 10),
    ("networking", "C++ Networking", 12),
    ("design", "C++ Design Patterns", 10),
    ("algorithms_advanced", "Advanced Algorithms in C++", 14),
    ("performance", "C++ Performance Optimization", 14),
    ("profiling", "C++ Profiling", 10),
    ("metaprogramming", "C++ Metaprogramming", 12),
    ("systems", "Systems Programming with C++", 16),
    ("production", "Production C++ Engineering", 16),
]

CPP_DEPS = {
    2: 1,
    3: 1,
    4: 1,
    5: 4,
    6: 3,
    7: 6,
    8: 7,
    9: 5,
    10: 9,
    11: 9,
    12: 6,
    13: 1,
    14: 8,
    15: 14,
    16: 7,
    17: 6,
    18: 12,
    19: 8,
    20: 18,
    21: 20,
    22: 1,
    23: 1,
    24: 1,
    25: 6,
    26: 10,
    27: 18,
    28: 27,
    29: 12,
    30: 19,
    31: 27,
}

CURRICULUM += make_rows(
    "cpp",
    CPP_ITEMS,
    CPP_DEPS
)


# ============================================================
# DEVOPS
# ============================================================

DEVOPS_ITEMS = [
    ("fundamentals", "DevOps Fundamentals", 8),
    ("linux", "Linux Fundamentals", 12),
    ("shell", "Linux Shell Scripting", 8),
    ("git", "Git and Version Control", 8),
    ("networking", "Networking Fundamentals", 12),
    ("http", "HTTP and TLS", 8),
    ("docker", "Docker", 12),
    ("compose", "Docker Compose", 8),
    ("cicd", "CI/CD Fundamentals", 10),
    ("githubactions", "GitHub Actions", 10),
    ("jenkins", "Jenkins", 10),
    ("artifacts", "Artifact Management", 8),
    ("terraform", "Terraform and Infrastructure as Code", 14),
    ("ansible", "Ansible", 10),
    ("cloud", "Cloud Fundamentals", 10),
    ("aws", "AWS Fundamentals", 14),
    ("iam", "Cloud IAM", 10),
    ("cloudnetworking", "Cloud Networking", 12),
    ("storage", "Cloud Storage and Databases", 10),
    ("kubernetes", "Kubernetes", 16),
    ("helm", "Helm", 10),
    ("ingress", "Kubernetes Networking and Ingress", 10),
    ("secrets", "Secrets and Configuration Management", 8),
    ("monitoring", "Monitoring", 10),
    ("prometheus", "Prometheus", 10),
    ("grafana", "Grafana", 8),
    ("logging", "Centralized Logging", 10),
    ("security", "DevSecOps", 12),
    ("gitops", "GitOps", 10),
    ("sre", "SRE and Reliability Engineering", 14),
]

DEVOPS_DEPS = {
    2: 1,
    3: 2,
    4: 1,
    5: 1,
    6: 5,
    7: 2,
    8: 7,
    9: 4,
    10: 9,
    11: 9,
    12: 9,
    13: 1,
    14: 2,
    15: 1,
    16: 15,
    17: 16,
    18: 5,
    19: 16,
    20: 15,
    21: 20,
    22: 20,
    23: 20,
    24: 1,
    25: 24,
    26: 24,
    27: 24,
    28: 9,
    29: 4,
    30: 24,
}

CURRICULUM += make_rows(
    "devops",
    DEVOPS_ITEMS,
    DEVOPS_DEPS
)


# ============================================================
# EXTRA TECHNOLOGY TRACKS
# ============================================================

EXTRA_TRACKS = {

    "java": [
        "Java Fundamentals",
        "Object-Oriented Java",
        "Collections",
        "Generics",
        "Exceptions",
        "Streams",
        "Concurrency",
        "JVM Fundamentals",
        "Maven",
        "Gradle",
        "Spring Fundamentals",
        "Spring Boot",
        "REST APIs",
        "Spring Security",
        "JPA and Hibernate",
        "Testing",
        "Microservices",
        "Performance",
        "Production Java",
    ],

    "go": [
        "Go Fundamentals",
        "Packages",
        "Structs and Interfaces",
        "Pointers",
        "Error Handling",
        "Goroutines",
        "Channels",
        "Concurrency",
        "Generics",
        "Testing",
        "HTTP Servers",
        "REST APIs",
        "Database Access",
        "gRPC",
        "Profiling",
        "CLI Development",
        "Production Go",
    ],

    "rust": [
        "Rust Fundamentals",
        "Ownership",
        "Borrowing",
        "Lifetimes",
        "Structs and Enums",
        "Traits",
        "Generics",
        "Error Handling",
        "Collections",
        "Iterators",
        "Closures",
        "Modules and Crates",
        "Cargo",
        "Testing",
        "Async Rust",
        "Tokio",
        "Networking",
        "Database Integration",
        "Web Development",
        "Concurrency",
        "Performance",
        "Production Rust",
    ],

    "csharp": [
        "C# Fundamentals",
        "Object-Oriented C#",
        "Collections",
        "LINQ",
        "Async and Await",
        "Exception Handling",
        "Generics",
        "Delegates and Events",
        ".NET Fundamentals",
        "ASP.NET Core",
        "REST APIs",
        "Entity Framework Core",
        "Authentication",
        "Testing",
        "Dependency Injection",
        "Microservices",
        "Performance",
        "Production .NET",
    ],

    "php": [
        "PHP Fundamentals",
        "Modern PHP",
        "Object-Oriented PHP",
        "Composer",
        "Namespaces",
        "Error Handling",
        "Testing",
        "HTTP",
        "Laravel Fundamentals",
        "Laravel Routing",
        "Eloquent ORM",
        "Authentication",
        "REST APIs",
        "Queues",
        "Caching",
        "Security",
        "Deployment",
        "Production PHP",
    ],

    "kotlin": [
        "Kotlin Fundamentals",
        "Null Safety",
        "Functions",
        "Collections",
        "Object-Oriented Kotlin",
        "Generics",
        "Coroutines",
        "Flow",
        "Testing",
        "Gradle",
        "Ktor",
        "REST APIs",
        "Database Access",
        "Android Kotlin",
        "Production Kotlin",
    ],

    "swift": [
        "Swift Fundamentals",
        "Optionals",
        "Collections",
        "Protocols",
        "Generics",
        "Closures",
        "Error Handling",
        "Concurrency",
        "Async Await",
        "SwiftUI",
        "iOS Architecture",
        "Networking",
        "Persistence",
        "Testing",
        "Production iOS",
    ],

    "sql": [
        "SQL Fundamentals",
        "Filtering and Sorting",
        "Joins",
        "Aggregations",
        "Subqueries",
        "CTEs",
        "Window Functions",
        "Views",
        "Transactions",
        "Indexes",
        "Query Optimization",
        "Stored Procedures",
        "Database Design",
        "Advanced SQL",
    ],

    "react": [
        "React Fundamentals",
        "Components",
        "Props",
        "State",
        "Hooks",
        "Forms",
        "Routing",
        "Data Fetching",
        "State Management",
        "Testing",
        "Performance",
        "Server Components",
        "Next.js",
        "Production React",
    ],

    "nextjs": [
        "Next.js Fundamentals",
        "Routing",
        "Layouts",
        "Server Components",
        "Data Fetching",
        "Server Actions",
        "Authentication",
        "Caching",
        "Middleware",
        "API Routes",
        "Deployment",
        "Performance",
        "Production Next.js",
    ],

    "nodejs": [
        "Node.js Fundamentals",
        "Modules",
        "npm",
        "HTTP",
        "Express",
        "Middleware",
        "REST APIs",
        "Authentication",
        "Databases",
        "Testing",
        "WebSockets",
        "Streams",
        "Worker Threads",
        "Performance",
        "Production Node.js",
    ],

    "kubernetes": [
        "Kubernetes Fundamentals",
        "Pods",
        "Deployments",
        "Services",
        "ConfigMaps",
        "Secrets",
        "Volumes",
        "Ingress",
        "RBAC",
        "Networking",
        "Helm",
        "Autoscaling",
        "Observability",
        "Security",
        "Production Kubernetes",
    ],

    "aws": [
        "AWS Fundamentals",
        "IAM",
        "EC2",
        "S3",
        "VPC",
        "RDS",
        "Lambda",
        "API Gateway",
        "CloudFront",
        "Route 53",
        "ECS",
        "EKS",
        "CloudWatch",
        "SQS",
        "SNS",
        "DynamoDB",
        "Terraform on AWS",
        "Production AWS",
    ],

    "azure": [
        "Azure Fundamentals",
        "Microsoft Entra ID",
        "Virtual Machines",
        "Blob Storage",
        "Virtual Network",
        "Azure SQL",
        "Azure Functions",
        "App Service",
        "AKS",
        "Azure Monitor",
        "Key Vault",
        "Terraform on Azure",
        "Production Azure",
    ],

    "gcp": [
        "GCP Fundamentals",
        "IAM",
        "Compute Engine",
        "Cloud Storage",
        "VPC",
        "Cloud SQL",
        "Cloud Run",
        "GKE",
        "Pub/Sub",
        "BigQuery",
        "Cloud Monitoring",
        "Terraform on GCP",
        "Production GCP",
    ],

    "cybersecurity": [
        "Cybersecurity Fundamentals",
        "Networking Security",
        "Linux Security",
        "Cryptography Fundamentals",
        "Authentication",
        "Web Security",
        "OWASP Top 10",
        "Secure Coding",
        "Vulnerability Assessment",
        "Threat Modeling",
        "Security Monitoring",
        "Incident Response",
        "Digital Forensics",
        "Penetration Testing",
        "Cloud Security",
        "DevSecOps",
    ],

    "system_design": [
        "System Design Fundamentals",
        "Scalability",
        "Availability",
        "Load Balancing",
        "Caching",
        "Databases",
        "Replication",
        "Sharding",
        "Queues",
        "Event Driven Architecture",
        "Distributed Systems",
        "Consistency",
        "CAP Theorem",
        "Microservices",
        "Observability",
        "Reliability",
        "Large Scale Architecture",
    ],

    "dsa": [
        "Algorithmic Complexity",
        "Arrays",
        "Strings",
        "Linked Lists",
        "Stacks",
        "Queues",
        "Hash Tables",
        "Trees",
        "Binary Search Trees",
        "Heaps",
        "Graphs",
        "BFS and DFS",
        "Sorting",
        "Searching",
        "Recursion",
        "Backtracking",
        "Dynamic Programming",
        "Greedy Algorithms",
        "Shortest Paths",
        "Advanced Graph Algorithms",
        "Competitive Programming",
    ],

    "computer_vision": [
        "Computer Vision Fundamentals",
        "Image Processing",
        "OpenCV",
        "Image Classification",
        "CNNs",
        "Object Detection",
        "Image Segmentation",
        "Transfer Learning",
        "Data Augmentation",
        "Vision Transformers",
        "OCR",
        "Pose Estimation",
        "Video Understanding",
        "Multimodal Vision",
        "Production Computer Vision",
    ],

    "generative_ai": [
        "Generative AI Fundamentals",
        "Prompt Engineering",
        "Tokenization",
        "Embeddings",
        "Transformers",
        "Large Language Models",
        "Inference",
        "Structured Outputs",
        "Function Calling",
        "RAG",
        "Vector Databases",
        "Reranking",
        "Fine Tuning",
        "LoRA",
        "Agents",
        "Evaluation",
        "Guardrails",
        "Multimodal AI",
        "Production Generative AI",
    ],

    "mobile": [
        "Mobile Development Fundamentals",
        "Android Fundamentals",
        "Kotlin",
        "Jetpack Compose",
        "Android Architecture",
        "Networking",
        "Persistence",
        "Authentication",
        "Testing",
        "App Performance",
        "iOS Fundamentals",
        "Swift",
        "SwiftUI",
        "iOS Architecture",
        "App Store Deployment",
        "Production Mobile Development",
    ],

    "game_development": [
        "Game Development Fundamentals",
        "Game Loops",
        "Vectors and Mathematics",
        "Physics",
        "Input Systems",
        "2D Development",
        "3D Development",
        "Animation",
        "Audio",
        "Game AI",
        "Pathfinding",
        "Shaders",
        "Networking",
        "Multiplayer",
        "Optimization",
        "Unity",
        "Unreal Engine",
        "Production Game Development",
    ],

    "embedded": [
        "Embedded Systems Fundamentals",
        "C Programming",
        "Microcontrollers",
        "GPIO",
        "Timers",
        "Interrupts",
        "UART",
        "SPI",
        "I2C",
        "ADC and DAC",
        "PWM",
        "RTOS Fundamentals",
        "FreeRTOS",
        "Embedded Networking",
        "Debugging",
        "Firmware Architecture",
        "Embedded Security",
        "Production Embedded Systems",
    ],

    "blockchain": [
        "Blockchain Fundamentals",
        "Cryptography for Blockchain",
        "Transactions",
        "Wallets",
        "Consensus",
        "Bitcoin Architecture",
        "Ethereum Architecture",
        "Smart Contracts",
        "Solidity",
        "Web3 APIs",
        "Token Standards",
        "DeFi Fundamentals",
        "Blockchain Security",
        "Testing Smart Contracts",
        "Production Web3",
    ],
}


# ============================================================
# EXTRA TRACK DEPENDENCY RULES
# ============================================================

def infer_extra_parent(prefix, index, titles):
    """
    Creates a practical DAG-like structure for extra tracks.

    Unlike the old implementation, skill N does NOT
    automatically depend on skill N-1.

    The result intentionally allows multiple independent
    branches.
    """

    if index <= 1:
        return ""

    title = titles[index - 1].lower()

    # Common foundational relationships.
    if any(
        word in title
        for word in [
            "fundamentals",
            "fundamental",
            "architecture",
        ]
    ):
        return f"{prefix}_1"

    # Language concepts.
    language_keywords = [
        "object-oriented",
        "collections",
        "generics",
        "functions",
        "structs",
        "interfaces",
        "pointers",
        "ownership",
        "borrowing",
        "lifetimes",
        "traits",
        "protocols",
        "optionals",
        "closures",
        "error handling",
        "exceptions",
    ]

    if any(
        word in title
        for word in language_keywords
    ):
        return f"{prefix}_1"

    # Web/API concepts.
    if any(
        word in title
        for word in [
            "rest",
            "http",
            "api",
            "routing",
            "middleware",
            "web development",
            "websockets",
        ]
    ):
        candidates = [
            i
            for i, value in enumerate(titles, start=1)
            if any(
                keyword in value.lower()
                for keyword in [
                    "http",
                    "fundamentals",
                    "server",
                    "routing",
                ]
                if i < index
            )
        ]

        if candidates:
            return f"{prefix}_{candidates[-1]}"

    # Database concepts.
    if any(
        word in title
        for word in [
            "database",
            "databases",
            "sql",
            "orm",
            "persistence",
            "eloquent",
            "hibernate",
            "entity framework",
        ]
    ):
        for i in range(index - 1, 0, -1):
            if any(
                word in titles[i - 1].lower()
                for word in [
                    "database",
                    "sql",
                    "persistence",
                    "fundamentals",
                ]
            ):
                return f"{prefix}_{i}"

    # Testing.
    if "testing" in title or "test" in title:
        return f"{prefix}_1"

    # Deployment / production.
    if any(
        word in title
        for word in [
            "production",
            "deployment",
            "performance",
            "profiling",
        ]
    ):
        return f"{prefix}_{max(1, index - 1)}"

    # Security.
    if "security" in title or "authentication" in title:
        return f"{prefix}_1"

    # Async/concurrency.
    if any(
        word in title
        for word in [
            "async",
            "concurrency",
            "coroutines",
            "goroutines",
            "channels",
            "threads",
        ]
    ):
        return f"{prefix}_1"

    # Frameworks generally depend on language fundamentals.
    framework_keywords = [
        "spring",
        "django",
        "laravel",
        "asp.net",
        "ktor",
        "swiftui",
        "react",
        "next.js",
        "express",
        "android",
        "unity",
        "unreal",
        "terraform",
        "kubernetes",
    ]

    if any(
        word in title
        for word in framework_keywords
    ):
        return f"{prefix}_1"

    # Otherwise keep the skill independent.
    return ""


# ============================================================
# GENERATE EXTRA TRACKS
# ============================================================

for prefix, titles in EXTRA_TRACKS.items():

    for index, title in enumerate(
        titles,
        start=1
    ):

        skill_id = f"{prefix}_{index}"

        parent_id = infer_extra_parent(
            prefix,
            index,
            titles
        )

        CURRICULUM.append({
            "skill_id": skill_id,
            "name": title,
            "estimated_hours": (
                6 if index < 5 else 8
            ),
            "parent_id": parent_id,
        })


# ============================================================
# DOMAIN MAPPING
# ============================================================

PREFIX_DOMAIN = {

    "py": "python",
    "js": "frontend",
    "fe": "frontend",
    "be": "backend",
    "data": "data",
    "cpp": "cpp",
    "devops": "devops",

    "ai": "ai_ml",

    "java": "backend",
    "go": "backend",
    "rust": "backend",
    "csharp": "backend",
    "php": "backend",

    "kotlin": "mobile",
    "swift": "mobile",

    "sql": "data",

    "react": "frontend",
    "nextjs": "frontend",
    "nodejs": "backend",

    "kubernetes": "devops",
    "aws": "devops",
    "azure": "devops",
    "gcp": "devops",

    "cybersecurity": "cybersecurity",
    "system": "software_engineering",
    "dsa": "computer_science",
    "computer": "ai_ml",
    "generative": "ai_ml",
    "mobile": "mobile",
    "game": "game_development",
    "embedded": "embedded",
    "blockchain": "blockchain",
}


# ============================================================
# BUILD CANONICAL DATAFRAME
# ============================================================

def build_canonical_dataset():

    title_map = {
        row["skill_id"]: row["name"]
        for row in CURRICULUM
    }

    rows = []

    for row in CURRICULUM:

        skill_id = row["skill_id"]
        name = row["name"]
        parent_id = row["parent_id"]

        prefix = skill_id.split(
            "_",
            1
        )[0]

        category = PREFIX_DOMAIN.get(
            prefix,
            "other"
        )

        parent_title = (
            title_map.get(
                parent_id,
                ""
            )
            if parent_id
            else ""
        )

        description = (
            f"{name}: "
            f"core concepts, practical implementation, "
            f"tools, best practices, troubleshooting, "
            f"and production usage."
        )

        rows.append({
            "skill_id": skill_id,
            "name": name,
            "description": description,
            "estimated_hours": row[
                "estimated_hours"
            ],
            "roadmap_id": (
                f"hermes_{category}"
            ),
            "parent_id": parent_id,
            "parent_title": parent_title,
            "node_type": "skill",
            "category": category,
        })

    return pd.DataFrame(rows)


# ============================================================
# NORMALIZE EXISTING DATA
# ============================================================

def normalize_existing_dataset(df):

    if df.empty:
        return pd.DataFrame()

    aliases = {
        "title": "name",
        "skill_name": "name",
        "hours": "estimated_hours",
        "estimated_time": "estimated_hours",
        "parent": "parent_id",
        "parent_skill": "parent_title",
    }

    rename_map = {}

    for column in df.columns:

        if column in aliases:
            rename_map[column] = aliases[column]

    df = df.rename(
        columns=rename_map
    )

    defaults = {
        "skill_id": "",
        "name": "",
        "description": "",
        "estimated_hours": 6,
        "roadmap_id": "",
        "parent_id": "",
        "parent_title": "",
        "node_type": "skill",
        "category": "",
    }

    for column, default in defaults.items():

        if column not in df.columns:
            df[column] = default

    return df


# ============================================================
# LOAD EXISTING DATA
# ============================================================

def load_existing_dataset():

    if not os.path.exists(
        CLEAN_DATASET
    ):
        return pd.DataFrame()

    print(
        "Loading existing cleaned dataset..."
    )

    try:

        df = pd.read_csv(
            CLEAN_DATASET
        )

    except Exception as exc:

        print(
            f"Warning: could not read existing dataset: {exc}"
        )

        return pd.DataFrame()

    return normalize_existing_dataset(
        df
    )


# ============================================================
# MERGE EXISTING UNIQUE SKILLS
# ============================================================

def merge_existing_skills(
    canonical_df,
    existing_df
):

    if existing_df.empty:
        return canonical_df

    canonical_ids = set(
        canonical_df[
            "skill_id"
        ]
        .astype(str)
    )

    canonical_names = set(
        canonical_df[
            "name"
        ]
        .astype(str)
        .str.lower()
        .str.strip()
    )

    additions = []

    for _, row in existing_df.iterrows():

        skill_id = str(
            row["skill_id"]
        ).strip()

        name = str(
            row["name"]
        ).strip()

        if not name:
            continue

        if skill_id in canonical_ids:
            continue

        if name.lower() in canonical_names:
            continue

        if (
            "fundamentals & core theory"
            in name.lower()
        ):
            continue

        if skill_id.lower().startswith(
            (
                "node_ai_",
                "legacy_",
            )
        ):
            continue

        category = str(
            row["category"]
        ).strip().lower()

        if not category:
            continue

        additions.append({
            "skill_id": (
                skill_id
                or re.sub(
                    r"[^a-z0-9]+",
                    "_",
                    name.lower()
                ).strip("_")
            ),
            "name": name,
            "description": str(
                row["description"]
            ).strip(),
            "estimated_hours": pd.to_numeric(
                row["estimated_hours"],
                errors="coerce"
            ),
            "roadmap_id": str(
                row["roadmap_id"]
            ),
            "parent_id": str(
                row["parent_id"]
            ).strip(),
            "parent_title": str(
                row["parent_title"]
            ).strip(),
            "node_type": "skill",
            "category": category,
        })

    if additions:

        print(
            f"Preserving {len(additions)} "
            "unique existing skills."
        )

        canonical_df = pd.concat(
            [
                canonical_df,
                pd.DataFrame(additions),
            ],
            ignore_index=True
        )

    return canonical_df


# ============================================================
# REPAIR EXISTING PREREQUISITES
# ============================================================

def repair_prerequisites(df):

    """
    Prevent old datasets from reintroducing broken
    artificial prerequisite chains.

    Canonical curriculum relationships are authoritative.

    For preserved external skills, remove references
    to deleted/nonexistent nodes.
    """

    df = df.copy()

    valid_ids = set(
        df["skill_id"].astype(str)
    )

    canonical_ids = {
        row["skill_id"]
        for row in CURRICULUM
    }

    canonical_parent_map = {
        row["skill_id"]: row["parent_id"]
        for row in CURRICULUM
    }

    for index, row in df.iterrows():

        skill_id = str(
            row["skill_id"]
        ).strip()

        if skill_id in canonical_ids:

            parent_id = canonical_parent_map.get(
                skill_id,
                ""
            )

            if (
                parent_id
                and parent_id in valid_ids
            ):
                df.at[
                    index,
                    "parent_id"
                ] = parent_id
            else:
                df.at[
                    index,
                    "parent_id"
                ] = ""

            continue

        parent_id = str(
            row["parent_id"]
        ).strip()

        if (
            parent_id
            and parent_id not in valid_ids
        ):
            df.at[
                index,
                "parent_id"
            ] = ""

    return df


# ============================================================
# FINALIZE
# ============================================================

def finalize_dataset(df):

    df = df.copy()

    df["skill_id"] = (
        df["skill_id"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    df["name"] = (
        df["name"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    df["description"] = (
        df["description"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    df["parent_id"] = (
        df["parent_id"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    df["estimated_hours"] = pd.to_numeric(
        df["estimated_hours"],
        errors="coerce"
    ).fillna(6)

    df = df[
        df["name"].str.len() > 0
    ].copy()

    df = df.drop_duplicates(
        subset=["skill_id"],
        keep="first"
    )

    df["_normalized_name"] = (
        df["name"]
        .str.lower()
        .str.strip()
    )

    df = df.drop_duplicates(
        subset=[
            "_normalized_name"
        ],
        keep="first"
    )

    df = df.drop(
        columns=[
            "_normalized_name"
        ]
    )

    # Repair prerequisites before titles.
    df = repair_prerequisites(
        df
    )

    # Repair parent titles.
    title_map = dict(
        zip(
            df["skill_id"],
            df["name"]
        )
    )

    valid_ids = set(
        df["skill_id"]
    )

    for index, row in df.iterrows():

        parent_id = str(
            row["parent_id"]
        ).strip()

        if not parent_id:

            df.at[
                index,
                "parent_title"
            ] = ""

            continue

        if parent_id not in valid_ids:

            df.at[
                index,
                "parent_id"
            ] = ""

            df.at[
                index,
                "parent_title"
            ] = ""

            continue

        df.at[
            index,
            "parent_title"
        ] = title_map[
            parent_id
        ]

    # Canonical skills first.
    df["_canonical"] = df[
        "skill_id"
    ].isin(
        {
            row["skill_id"]
            for row in CURRICULUM
        }
    )

    df = df.sort_values(
        by=[
            "_canonical",
            "category",
            "name",
        ],
        ascending=[
            False,
            True,
            True,
        ]
    )

    df = df.drop(
        columns=[
            "_canonical"
        ]
    )

    columns = [
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

    return df[
        columns
    ].reset_index(
        drop=True
    )


# ============================================================
# VALIDATION
# ============================================================

def validate_dataset(df):

    print()
    print("=" * 60)
    print("DATASET VALIDATION")
    print("=" * 60)

    print()
    print(
        f"Total learning skills: {len(df)}"
    )

    print()
    print("Categories:")

    counts = (
        df["category"]
        .value_counts()
        .sort_index()
    )

    for category, count in counts.items():

        print(
            f"  {category}: {count}"
        )

    print()
    print(
        "Prerequisite relationships:"
    )

    with_parent = df[
        df["parent_id"]
        .fillna("")
        .astype(str)
        .str.len()
        > 0
    ]

    print(
        f"  {len(with_parent)} skills "
        "have prerequisites."
    )

    valid_ids = set(
        df["skill_id"]
    )

    broken = []

    for _, row in with_parent.iterrows():

        if row["parent_id"] not in valid_ids:

            broken.append(
                f"{row['name']} -> "
                f"{row['parent_id']}"
            )

    print()
    print(
        "Broken parent references:"
    )

    if broken:

        for item in broken:

            print(
                f"  {item}"
            )

    else:

        print("  None")

    print()
    print("Duplicate names:")

    duplicate_names = (
        df["name"]
        .str.lower()
        .duplicated()
    )

    print(
        "  None"
        if not duplicate_names.any()
        else "  WARNING: duplicates found."
    )

    # --------------------------------------------------------
    # Detect suspicious artificial chains.
    # --------------------------------------------------------

    print()
    print(
        "Prerequisite quality:"
    )

    suspicious = 0

    for prefix in [
        "py",
        "js",
        "fe",
        "be",
        "data",
        "cpp",
        "devops",
    ]:

        track = df[
            df["skill_id"]
            .str.startswith(
                prefix + "_"
            )
        ].copy()

        if len(track) < 5:
            continue

        position = {
            skill_id: i
            for i, skill_id
            in enumerate(
                track["skill_id"].tolist(),
                start=1
            )
        }

        sequential = 0

        for _, row in track.iterrows():

            parent = str(
                row["parent_id"]
            ).strip()

            if not parent:
                continue

            current_position = position.get(
                row["skill_id"]
            )

            parent_position = position.get(
                parent
            )

            if (
                current_position
                and parent_position
                and parent_position == current_position - 1
            ):
                sequential += 1

        ratio = (
            sequential / max(1, len(track) - 1)
        )

        if ratio > 0.85:

            suspicious += 1

            print(
                f"  WARNING: {prefix} still appears "
                f"overly linear ({ratio:.0%})."
            )

    if suspicious == 0:

        print(
            "  No major artificial linear chains detected."
        )

    print()
    print("Canonical curriculum:")

    canonical_prefixes = [
        "py",
        "js",
        "fe",
        "be",
        "data",
        "ai",
        "cpp",
        "devops",
    ]

    for prefix in canonical_prefixes:

        count = sum(
            1
            for row in CURRICULUM
            if row["skill_id"].startswith(
                prefix + "_"
            )
        )

        print(
            f"  {prefix}: {count}"
        )

    print()
    print(
        "AI/ML curriculum integrity:"
    )

    expected_ai = {
        row["skill_id"]
        for row in CURRICULUM
        if row["skill_id"].startswith(
            "ai_"
        )
    }

    actual_ai = set(
        df[
            df["skill_id"]
            .str.startswith("ai_")
        ]["skill_id"]
    )

    missing = (
        expected_ai - actual_ai
    )

    wrong_category = df[
        df["skill_id"]
        .isin(expected_ai)
        & (
            df["category"]
            != "ai_ml"
        )
    ]

    if not missing and wrong_category.empty:

        print(
            "  All AI/ML curriculum nodes "
            "are present and correctly classified."
        )

    else:

        if missing:

            print(
                "  Missing:"
            )

            for item in sorted(
                missing
            ):
                print(
                    f"    {item}"
                )

        if not wrong_category.empty:

            print(
                "  Incorrect categories:"
            )

            for _, row in (
                wrong_category.iterrows()
            ):

                print(
                    f"    {row['skill_id']} "
                    f"-> {row['category']}"
                )

    print()
    print("=" * 60)


# ============================================================
# MAIN
# ============================================================

def main():

    os.makedirs(
        DATA_DIR,
        exist_ok=True
    )

    print()
    print("=" * 60)
    print(
        "HERMES SKILL KNOWLEDGE BASE BUILDER"
    )
    print("=" * 60)

    print()
    print(
        f"Canonical curriculum skills: "
        f"{len(CURRICULUM)}"
    )

    # Build authoritative curriculum.
    df = build_canonical_dataset()

    # Preserve useful unique skills.
    existing = load_existing_dataset()

    df = merge_existing_skills(
        df,
        existing
    )

    # Final cleanup and prerequisite repair.
    df = finalize_dataset(
        df
    )

    # Save model dataset.
    df.to_csv(
        OUTPUT_DATASET,
        index=False
    )

    # Keep clean dataset synchronized.
    df.to_csv(
        CLEAN_DATASET,
        index=False
    )

    validate_dataset(
        df
    )

    print()
    print("=" * 60)
    print(
        "SKILL MODEL DATASET CREATED"
    )
    print("=" * 60)

    print()
    print(
        f"Total skills: {len(df)}"
    )

    print()
    print(
        "Saved:"
    )

    print(
        OUTPUT_DATASET
    )

    print(
        CLEAN_DATASET
    )

    print()


if __name__ == "__main__":
    main()