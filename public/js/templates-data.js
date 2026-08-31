// Hermes.io — Curated Roadmap Templates Library (Flow B)
// High-yield, verified learning roadmaps for Careers & Programming Languages (Python, Java, C++, etc.)

window.HERMES_TEMPLATES = [
  // ==========================================
  // PROGRAMMING LANGUAGES TRACKS
  // ==========================================
  {
    id: 'tpl_python_mastery',
    category: 'Programming Languages',
    badge: 'Most Popular',
    title: 'Python Mastery Roadmap (Core to Advanced)',
    description: 'Master Python 3.12+ syntax, Data Structures, OOP, Functional patterns, AsyncIO, Packaging, FastAPI, and Data/AI foundations.',
    targetRole: 'Python Software Engineer',
    interests: 'Python, Backend, Data Science, Scripting',
    estimatedTotalHours: 110,
    difficulty: 'Beginner to Advanced',
    milestonesCount: 7,
    icon: 'code',
    nodes: [
      {
        id: 'node_py_1',
        title: 'Python Core Basics & Syntax',
        description: 'Understand variables, dynamic typing, control flow, loops, functions, and standard I/O in Python 3.12+.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 12,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Beginner Project Checkpoint',
          description: 'Build a command-line expense tracker, interactive text adventure, or automated file organizer.',
          level: 'beginner'
        },
        resources: [
          { type: 'docs', title: 'Python 3 Official Tutorial', url: 'https://docs.python.org/3/tutorial/index.html', isFree: true },
          { type: 'course', title: 'FreeCodeCamp: Python for Beginners Full Course', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', isFree: true },
          { type: 'practice', title: 'Exercism.org — Python Track', url: 'https://exercism.org/tracks/python', isFree: true }
        ],
        children: [
          {
            id: 'node_py_1_1',
            title: 'Variables, Primitive Types & Type Hinting',
            description: 'Int, Float, String, Boolean, NoneType, and modern Python type hints (typing module).',
            status: 'not_started',
            progress: 0,
            estimatedHours: 3,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Real Python: Type Checking in Python Guide', url: 'https://realpython.com/python-type-checking/', isFree: true }],
            children: [],
            isExpandable: false
          },
          {
            id: 'node_py_1_2',
            title: 'Control Flow, Conditionals & Match-Case',
            description: 'If-elif-else branching, truthy/falsy evaluation, and Python 3.10+ structural pattern matching (match-case).',
            status: 'not_started',
            progress: 0,
            estimatedHours: 4,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Structural Pattern Matching Tutorial', url: 'https://docs.python.org/3/tutorial/controlflow.html#match-statements', isFree: true }],
            children: [],
            isExpandable: false
          },
          {
            id: 'node_py_1_3',
            title: 'Functions, *args, **kwargs & Scope',
            description: 'Positional vs keyword arguments, default parameters, LEGB variable scoping, and docstrings.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Defining Functions in Python (Real Python)', url: 'https://realpython.com/defining-your-own-python-function/', isFree: true }],
            children: [],
            isExpandable: false
          }
        ],
        isExpandable: true,
        isExpanded: true
      },
      {
        id: 'node_py_2',
        title: 'Data Structures & Collections',
        description: 'Deep dive into built-in data structures: Lists, Tuples, Dictionaries, Sets, and the Collections module.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Python Official: Data Structures Tutorial', url: 'https://docs.python.org/3/tutorial/datastructures.html', isFree: true },
          { type: 'video', title: 'Corey Schafer: Python Lists, Tuples, and Sets', url: 'https://www.youtube.com/watch?v=W8KRzm-HUcc', isFree: true }
        ],
        children: [
          {
            id: 'node_py_2_1',
            title: 'List & Dict Comprehensions',
            description: 'Concise expressions, conditional filters, nested comprehensions, and set comprehensions.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 4,
            recommendationType: 'recommended',
            resources: [{ type: 'article', title: 'Real Python: When to Use a List Comprehension', url: 'https://realpython.com/list-comprehension-python/', isFree: true }]
          },
          {
            id: 'node_py_2_2',
            title: 'Collections Module (defaultdict, Counter, deque, namedtuple)',
            description: 'High-performance specialized container datatypes for optimization.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Python Collections Documentation', url: 'https://docs.python.org/3/library/collections.html', isFree: true }]
          },
          {
            id: 'node_py_2_3',
            title: 'Iterators, Generators & yield',
            description: 'Iterables protocol, __iter__ and __next__, generator functions, and lazy memory evaluation.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'video', title: 'Generators and yield in Python Explained', url: 'https://www.youtube.com/watch?v=bD05uGo_sVI', isFree: true }]
          }
        ],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_py_3',
        title: 'Object-Oriented Programming (OOP) & Dunder Methods',
        description: 'Classes, inheritance, polymorphism, encapsulation, dataclasses, properties, and special dunder methods (__str__, __repr__, __call__, __enter__).',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Python OOP: Real Python Step-by-Step', url: 'https://realpython.com/python3-object-oriented-programming/', isFree: true },
          { type: 'docs', title: 'Python Dataclasses Guide', url: 'https://docs.python.org/3/library/dataclasses.html', isFree: true }
        ],
        children: [
          {
            id: 'node_py_3_1',
            title: 'Classes, __init__, and @property Decorators',
            description: 'Instance attributes, class attributes, getters/setters with @property.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'article', title: 'Python @property Decorator Guide', url: 'https://realpython.com/python-property/', isFree: true }]
          },
          {
            id: 'node_py_3_2',
            title: 'Inheritance, super(), and MRO',
            description: 'Multiple inheritance, Method Resolution Order (C3 Linearization), and mixins.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'article', title: 'Supercharge Your Classes with super()', url: 'https://realpython.com/python-super/', isFree: true }]
          },
          {
            id: 'node_py_3_3',
            title: 'Dunder Methods & Operator Overloading',
            description: '__eq__, __lt__, __len__, __getitem__, __add__, __enter__/__exit__ for custom context managers.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 7,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Python Data Model: Special Method Names', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-names', isFree: true }]
          }
        ],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_py_4',
        title: 'Modules, Virtual Environments & Packaging',
        description: 'Manage virtual environments (venv, uv, poetry), package dependencies, PyPI packaging, and module imports.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 14,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Intermediate Project Checkpoint',
          description: 'Build a modular CLI tool published on PyPI or a multi-threaded web scraper with rich terminal UI.',
          level: 'intermediate'
        },
        resources: [
          { type: 'docs', title: 'Python Packaging User Guide', url: 'https://packaging.python.org/en/latest/', isFree: true },
          { type: 'docs', title: 'Poetry: Dependency Management for Python', url: 'https://python-poetry.org/docs/', isFree: true }
        ],
        children: [
          {
            id: 'node_py_4_1',
            title: 'uv / Poetry / venv Virtual Environments',
            description: 'Isolate project dependencies and lockfiles.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Astral uv Fast Python Package Manager', url: 'https://docs.astral.sh/uv/', isFree: true }]
          },
          {
            id: 'node_py_4_2',
            title: 'Click / Typer / Argparse for CLI Applications',
            description: 'Build professional command-line interfaces with flags and auto-generated help.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Typer Documentation: CLI with Python Type Hints', url: 'https://typer.tiangolo.com/', isFree: true }]
          },
          {
            id: 'node_py_4_3',
            title: 'Pytest & Unit Testing Best Practices',
            description: 'Fixtures, parametrize, mocking with unittest.mock, and coverage reporting.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 4,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Pytest Official Documentation', url: 'https://docs.pytest.org/', isFree: true }]
          }
        ],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_py_5',
        title: 'Asynchronous Programming (AsyncIO) & Concurrency',
        description: 'Event loops, async/await syntax, coroutines, Tasks, ThreadPoolExecutor vs ProcessPoolExecutor, and GIL awareness.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'AsyncIO Official Documentation', url: 'https://docs.python.org/3/library/asyncio.html', isFree: true },
          { type: 'article', title: 'Real Python: Async IO in Python Complete Walkthrough', url: 'https://realpython.com/async-io-python/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_py_6',
        title: 'Web Backend Engineering (FastAPI / Django)',
        description: 'Build asynchronous REST APIs with FastAPI & Pydantic, SQLAlchemy 2.0 ORM, JWT authentication, and background workers.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'FastAPI Official Documentation & Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/', isFree: true },
          { type: 'docs', title: 'SQLAlchemy 2.0 Unified Tutorial', url: 'https://docs.sqlalchemy.org/en/20/tutorial/index.html', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_py_7',
        title: 'Capstone: Production Asynchronous Microservice & Portfolio',
        description: 'Architect, containerize with Docker, test, and deploy a production Python microservice with caching (Redis) and CI/CD.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Advanced Capstone Milestone',
          description: 'Deploy a high-throughput async API with rate limiting, database migrations, and OpenTelemetry logging.',
          level: 'advanced'
        },
        resources: [
          { type: 'project', title: 'Production FastAPI Docker Boilerplate Spec', url: 'https://github.com/tiangolo/full-stack-fastapi-template', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  },

  {
    id: 'tpl_java_mastery',
    category: 'Programming Languages',
    badge: 'Enterprise Standard',
    title: 'Java Master Roadmap (Core Java to Spring Boot 3)',
    description: 'Master Java 21+ LTS, OOP, JVM memory model, Multithreading & Virtual Threads, Spring Boot 3, Hibernate, and Microservices.',
    targetRole: 'Java Enterprise Developer',
    interests: 'Java, Backend, Spring Boot, Microservices',
    estimatedTotalHours: 130,
    difficulty: 'Beginner to Advanced',
    milestonesCount: 7,
    icon: 'coffee',
    nodes: [
      {
        id: 'node_java_1',
        title: 'Java Core Syntax & OOP Fundamentals',
        description: 'Variables, primitive vs reference types, control structures, encapsulation, inheritance, abstract classes, and interfaces.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Beginner Project Checkpoint',
          description: 'Build a Banking Account Simulation or Student Management Console Application.',
          level: 'beginner'
        },
        resources: [
          { type: 'docs', title: 'Oracle Java Documentation & Tutorials', url: 'https://docs.oracle.com/en/java/', isFree: true },
          { type: 'course', title: 'University of Helsinki: Java Programming MOOC', url: 'https://java-programming.mooc.fi/', isFree: true }
        ],
        children: [
          {
            id: 'node_java_1_1',
            title: 'Types, Operators & Control Flow',
            description: 'Primitives, Switch expressions (Java 17+ pattern matching), Loops.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 4,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Java Language Basics', url: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/index.html', isFree: true }]
          },
          {
            id: 'node_java_1_2',
            title: 'OOP: Interfaces, Abstract Classes & Records',
            description: 'Polymorphism, default interface methods, sealed classes, and Java Records.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'article', title: 'Baeldung: Java Records Guide', url: 'https://www.baeldung.com/java-record-keyword', isFree: true }]
          },
          {
            id: 'node_java_1_3',
            title: 'Exception Handling & Try-with-Resources',
            description: 'Checked vs unchecked exceptions, custom exception hierarchies, and AutoCloseable resources.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Java Exception Handling Best Practices', url: 'https://www.baeldung.com/java-exceptions', isFree: true }]
          }
        ],
        isExpandable: true,
        isExpanded: true
      },
      {
        id: 'node_java_2',
        title: 'Collections Framework & Generics',
        description: 'Master List, Set, Map hierarchies (ArrayList, LinkedList, HashSet, TreeSet, HashMap, ConcurrentHashMap) and Generics.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'article', title: 'Baeldung: Guide to Java Collections Framework', url: 'https://www.baeldung.com/java-collections', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_java_3',
        title: 'Modern Java: Lambdas, Functional Interfaces & Streams API',
        description: 'Functional programming in Java: Predicate, Function, Consumer, Stream pipelines (filter, map, reduce, collectors), and Optional.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'article', title: 'Baeldung: The Java 8+ Stream API Guide', url: 'https://www.baeldung.com/java-8-streams', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_java_4',
        title: 'Concurrency, Multithreading & Virtual Threads (Project Loom)',
        description: 'Threads, ExecutorService, synchronization, locks, volatile, CompletableFuture, and Java 21 lightweight Virtual Threads.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Intermediate Project Checkpoint',
          description: 'Build a multi-threaded web crawler or distributed job scheduler utilizing Java 21 Virtual Threads.',
          level: 'intermediate'
        },
        resources: [
          { type: 'docs', title: 'Java 21 Virtual Threads (Project Loom) Guide', url: 'https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_java_5',
        title: 'JVM Architecture, Garbage Collection & Performance',
        description: 'ClassLoaders, Bytecode, Stack vs Heap memory, G1 / ZGC Garbage Collectors, JIT compiler, and profilers (JConsole, VisualVM).',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'article', title: 'Understanding the JVM Architecture', url: 'https://www.baeldung.com/jvm-vs-jre-vs-jdk', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_java_6',
        title: 'Spring Boot 3, Spring Data JPA & Security',
        description: 'Dependency Injection, Spring MVC REST APIs, Spring Data JPA (Hibernate), PostgreSQL integration, and Spring Security with JWT.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Spring Boot 3 Official Documentation & Quickstart', url: 'https://spring.io/guides', isFree: true },
          { type: 'course', title: 'Amigoscode: Spring Boot 3 Tutorial Series', url: 'https://www.youtube.com/@amigoscode', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_java_7',
        title: 'Production Microservices & Cloud Native Capstone',
        description: 'Microservices architecture with Spring Cloud, Docker, Kafka event streaming, JUnit 5 / Testcontainers, and Kubernetes deployment.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Spring Cloud & Microservices Architectural Guide', url: 'https://spring.io/projects/spring-cloud', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  },

  {
    id: 'tpl_cpp_mastery',
    category: 'Programming Languages',
    badge: 'High Performance',
    title: 'Modern C++ (C++20/23) Systems Engineering',
    description: 'From low-level memory & pointers to Modern C++ (RAII, Smart Pointers, STL, Templates, Concepts, Ranges, and CMake).',
    targetRole: 'C++ Systems Engineer / Game Engine Dev',
    interests: 'C++, Systems Programming, Game Dev, Embedded',
    estimatedTotalHours: 140,
    difficulty: 'Intermediate to Advanced',
    milestonesCount: 7,
    icon: 'cpu',
    nodes: [
      {
        id: 'node_cpp_1',
        title: 'C++ Foundations & Compilation Pipeline',
        description: 'Preprocessor directives, compilation vs linking, header files, header guards, namespaces, primitive types, and I/O streams.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Beginner Project Checkpoint',
          description: 'Build a CLI matrix math engine or memory-efficient text buffer editor.',
          level: 'beginner'
        },
        resources: [
          { type: 'docs', title: 'LearnCpp.com — Outstanding Free Comprehensive Tutorial', url: 'https://www.learncpp.com/', isFree: true },
          { type: 'docs', title: 'cppreference.com — The C++ Standard Reference', url: 'https://en.cppreference.com/w/', isFree: true }
        ],
        children: [
          {
            id: 'node_cpp_1_1',
            title: 'Build Systems & CMake Basics',
            description: 'CMakeLists.txt, target_link_libraries, compiler flags (-Wall, -Wextra), and debug vs release builds.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'An Introduction to Modern CMake', url: 'https://cliutils.gitlab.io/modern-cmake/', isFree: true }]
          },
          {
            id: 'node_cpp_1_2',
            title: 'Functions, Pass-by-Value vs Pass-by-Reference',
            description: 'Constant references (const T&), function overloading, default arguments, and inline functions.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'LearnCpp: Passing Arguments by Reference', url: 'https://www.learncpp.com/cpp-tutorial/pass-by-lvalue-reference/', isFree: true }]
          }
        ],
        isExpandable: true,
        isExpanded: true
      },
      {
        id: 'node_cpp_2',
        title: 'Memory Management, Pointers & References',
        description: 'Stack vs Heap memory, raw pointers, pointer arithmetic, memory alignment, dynamic allocation (new/delete), and avoiding memory leaks.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'video', title: 'The Cherno: Pointers & References in C++', url: 'https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4G5b', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_cpp_3',
        title: 'RAII & Smart Pointers (std::unique_ptr, std::shared_ptr)',
        description: 'Resource Acquisition Is Initialization (RAII), std::unique_ptr, std::shared_ptr, std::weak_ptr, and custom deleters.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'article', title: 'Modern C++ Smart Pointers Guide (LearnCpp)', url: 'https://www.learncpp.com/cpp-tutorial/stdunique_ptr/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_cpp_4',
        title: 'Object-Oriented C++ & Rule of Zero/Three/Five',
        description: 'Constructors, Destructors, Copy/Move constructors, Move assignment, virtual functions, vtables, and abstract interfaces.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Intermediate Project Checkpoint',
          description: 'Implement a custom dynamic array container (`CustomVector<T>`) with full move semantics and allocator support.',
          level: 'intermediate'
        },
        resources: [
          { type: 'docs', title: 'The Rule of Three/Five/Zero (cppreference)', url: 'https://en.cppreference.com/w/cpp/language/rule_of_three', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_cpp_5',
        title: 'Standard Template Library (STL) Containers & Algorithms',
        description: 'std::vector, std::array, std::unordered_map, std::span, iterators, std::sort, std::find, and lambda expressions.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'STL Algorithms Library Documentation', url: 'https://en.cppreference.com/w/cpp/algorithm', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_cpp_6',
        title: 'Templates, Metaprogramming & C++20 Concepts',
        description: 'Function/class templates, template specialization, constexpr, type traits, SFINAE, and C++20 Concepts/Requires clauses.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'C++20 Concepts and Constraints Guide', url: 'https://en.cppreference.com/w/cpp/language/constraints', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_cpp_7',
        title: 'High Performance & Concurrency Capstone (std::thread, SIMD)',
        description: 'Multithreading with std::jthread, mutexes, atomic operations, lock-free queues, profiling with Valgrind/GDB, and game loop / networking capstone.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: 'High-Performance Multithreaded Engine Architecture Spec', url: 'https://github.com/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  },

  // ==========================================
  // ROLE-BASED CAREER TRACKS
  // ==========================================
  {
    id: 'tpl_rust_mastery',
    category: 'Programming Languages',
    badge: 'Memory Safe',
    title: 'Rust Systems Programming (Zero to Production)',
    description: 'Master Ownership, Borrowing, Lifetimes, Pattern Matching, Traits, Async with Tokio, Cargo, and WebAssembly.',
    targetRole: 'Rust Systems Engineer',
    interests: 'Rust, Systems Programming, WebAssembly, Backend',
    estimatedTotalHours: 130,
    difficulty: 'Intermediate to Advanced',
    milestonesCount: 6,
    icon: 'gear-fine',
    nodes: [
      {
        id: 'node_rust_1',
        title: 'Rust Core Foundations & Cargo',
        description: 'Variables, immutability by default, primitive datatypes, functions, and the Cargo build tool.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 14,
        recommendationType: 'recommended',
        projectCallout: { title: 'Beginner Project', description: 'Build a CLI Word Frequency Counter or Guessing Game in Rust.', level: 'beginner' },
        resources: [
          { type: 'docs', title: 'The Rust Programming Language Book', url: 'https://doc.rust-lang.org/book/', isFree: true },
          { type: 'practice', title: 'Rustlings: Interactive Small Exercises', url: 'https://github.com/rust-lang/rustlings', isFree: true }
        ],
        children: [
          { title: 'Variables, Mutability & Shadowing', estimatedHours: 4, recommendationType: 'recommended', resources: [{ type: 'docs', title: 'Rust Book: Variables', url: 'https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html', isFree: true }] },
          { title: 'Control Flow & Match Expressions', estimatedHours: 5, recommendationType: 'recommended', resources: [{ type: 'docs', title: 'Rust Book: Control Flow', url: 'https://doc.rust-lang.org/book/ch03-05-control-flow.html', isFree: true }] }
        ]
      },
      {
        id: 'node_rust_2',
        title: 'Ownership, Borrowing & Lifetimes',
        description: 'Understand the borrow checker, move semantics, references (& vs &mut), slice types, and explicit lifetime annotations (\'a).',
        status: 'not_started',
        progress: 0,
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Understanding Ownership in Rust', url: 'https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html', isFree: true }
        ],
        children: []
      },
      {
        id: 'node_rust_3',
        title: 'Enums, Option, Result & Error Handling',
        description: 'Algebraic datatypes, Option<T>, Result<T, E>, the ? propagation operator, and custom error types with thiserror/anyhow.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Error Handling in Rust', url: 'https://doc.rust-lang.org/book/ch09-00-error-handling.html', isFree: true }
        ],
        children: []
      },
      {
        id: 'node_rust_4',
        title: 'Traits, Generics & Iterators',
        description: 'Define shared behavior with Traits, derive macros, trait bounds (impl Trait, where clauses), and iterator chains.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        projectCallout: { title: 'Intermediate Project', description: 'Build a fast multithreaded grep tool (`minigrep`) with custom filters.', level: 'intermediate' },
        resources: [
          { type: 'docs', title: 'Traits: Defining Shared Behavior', url: 'https://doc.rust-lang.org/book/ch10-02-traits.html', isFree: true }
        ],
        children: []
      },
      {
        id: 'node_rust_5',
        title: 'Smart Pointers & Fearless Concurrency',
        description: 'Box<T>, Rc<T>, Arc<T>, RefCell<T>, Mutex<T>, channels (mpsc), threads, and Send/Sync marker traits.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Fearless Concurrency in Rust', url: 'https://doc.rust-lang.org/book/ch16-00-concurrency.html', isFree: true }
        ],
        children: []
      },
      {
        id: 'node_rust_6',
        title: 'Async Rust with Tokio & Web Microservice Capstone',
        description: 'Async/await, Tokio event loop runtime, building high-throughput HTTP APIs with Axum, and Docker deployment.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Tokio Tutorial: Asynchronous Rust', url: 'https://tokio.rs/tokio/tutorial', isFree: true }
        ],
        children: []
      }
    ]
  },
  {
    id: 'tpl_golang_mastery',
    category: 'Programming Languages',
    badge: 'Cloud Native',
    title: 'Golang Backend & Microservices Engineer',
    description: 'Master Go syntax, Goroutines, Channels, Interfaces, standard library (net/http), Gin, gRPC, and cloud native microservices.',
    targetRole: 'Go Backend Developer',
    interests: 'Golang, Backend, Microservices, Cloud',
    estimatedTotalHours: 110,
    difficulty: 'Beginner to Advanced',
    milestonesCount: 6,
    icon: 'airplane-takeoff',
    nodes: [
      {
        id: 'node_go_1',
        title: 'Go Basics, Syntax & Tooling',
        description: 'Variables, structs, slices, maps, pointers, and Go modules (go mod).',
        status: 'not_started',
        progress: 0,
        estimatedHours: 14,
        recommendationType: 'recommended',
        projectCallout: { title: 'Beginner Project', description: 'Build a CLI task manager or static site generator in Go.', level: 'beginner' },
        resources: [
          { type: 'docs', title: 'A Tour of Go (Official Interactive Tour)', url: 'https://go.dev/tour/welcome/1', isFree: true },
          { type: 'docs', title: 'Effective Go Guide', url: 'https://go.dev/doc/effective_go', isFree: true }
        ],
        children: []
      },
      {
        id: 'node_go_2',
        title: 'Interfaces & Implicit Implementation',
        description: 'Interface contracts, empty interface (any), type assertions, type switches, and composition over inheritance.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [{ type: 'article', title: 'How to use interfaces in Go', url: 'https://jordanorelli.com/post/32665860244/how-to-use-interfaces-in-go', isFree: true }],
        children: []
      },
      {
        id: 'node_go_3',
        title: 'Concurrency: Goroutines & Channels',
        description: 'CSP concurrency model, unbuffered/buffered channels, select statements, sync.WaitGroup, sync.Mutex, and race detector.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'video', title: 'Rob Pike: Go Concurrency Patterns', url: 'https://www.youtube.com/watch?v=f6kdp27TYZs', isFree: true }],
        children: []
      },
      {
        id: 'node_go_4',
        title: 'HTTP REST APIs & Web Frameworks (Gin / Chi)',
        description: 'net/http standard package, middleware, routing with Gin/Chi, JSON serialization, and database connection with sqlx/pgx.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        projectCallout: { title: 'Intermediate Project', description: 'Build a high-performance URL shortener service with Redis caching.', level: 'intermediate' },
        resources: [{ type: 'docs', title: 'Gin Web Framework Documentation', url: 'https://gin-gonic.com/docs/', isFree: true }],
        children: []
      },
      {
        id: 'node_go_5',
        title: 'gRPC, Protocol Buffers & Microservices',
        description: 'Protobuf IDL, code generation with protoc, unary & streaming gRPC APIs, interceptors, and service discovery.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'gRPC-Go Quick Start Guide', url: 'https://grpc.io/docs/languages/go/quickstart/', isFree: true }],
        children: []
      },
      {
        id: 'node_go_6',
        title: 'Production Capstone: Distributed Microservice with Docker & Kubernetes',
        description: 'Deploy a containerized Go microservice cluster with PostgreSQL, Prometheus metrics, and automated unit/integration tests.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'project', title: 'Standard Go Project Layout Spec', url: 'https://github.com/golang-standards/project-layout', isFree: true }],
        children: []
      }
    ]
  },
  {
    id: 'tpl_mobile_dev',
    category: 'Engineering',
    badge: 'Cross-Platform',
    title: 'Mobile App Developer (Flutter & React Native)',
    description: 'Build native iOS and Android apps using cross-platform UI frameworks, native hardware APIs, state management, and offline SQLite.',
    targetRole: 'Mobile Application Engineer',
    interests: 'Mobile, Flutter, React Native, iOS, Android',
    estimatedTotalHours: 120,
    difficulty: 'Beginner to Advanced',
    milestonesCount: 6,
    icon: 'device-mobile',
    nodes: [
      {
        id: 'node_mob_1',
        title: 'Dart / Modern Mobile Foundations',
        description: 'Dart syntax, asynchronous Futures, widgets tree mental model, and mobile layout constraints.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        projectCallout: { title: 'Beginner Project', description: 'Build a Habit Tracker or Weather App with smooth gestures.', level: 'beginner' },
        resources: [
          { type: 'docs', title: 'Flutter Official Documentation & Tutorials', url: 'https://docs.flutter.dev/', isFree: true }
        ],
        children: []
      },
      {
        id: 'node_mob_2',
        title: 'Responsive Mobile UI & Animations',
        description: 'Material 3 / Cupertino widgets, custom painters, implicit & explicit animations, and responsive screen scaling.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Flutter Animations Tutorial', url: 'https://docs.flutter.dev/ui/animations', isFree: true }],
        children: []
      },
      {
        id: 'node_mob_3',
        title: 'State Management (Riverpod / Bloc / Redux)',
        description: 'Architect scalable application state, dependency injection, and reactive UI stream updates.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Riverpod State Management Documentation', url: 'https://riverpod.dev/', isFree: true }],
        children: []
      },
      {
        id: 'node_mob_4',
        title: 'Offline Storage & Local Databases (SQLite / Drift / Hive)',
        description: 'Offline-first architecture, local caching, secure device keychain storage, and data synchronization.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        projectCallout: { title: 'Intermediate Project', description: 'Build an offline-first Podcast player with background audio downloads.', level: 'intermediate' },
        resources: [{ type: 'docs', title: 'Drift (Moor) SQLite for Flutter', url: 'https://drift.simonbinder.eu/', isFree: true }],
        children: []
      },
      {
        id: 'node_mob_5',
        title: 'Native Device APIs (Camera, GPS, Push Notifications)',
        description: 'Integrate native device sensors, push notifications with Firebase FCM, camera feeds, and background tasks.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Firebase Cloud Messaging for Mobile', url: 'https://firebase.google.com/docs/cloud-messaging', isFree: true }],
        children: []
      },
      {
        id: 'node_mob_6',
        title: 'App Store & Google Play Publishing Capstone',
        description: 'Code signing certificates, Play Console / App Store Connect submission, Fastlane CI/CD automation, and crash reporting.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Flutter App Deployment Guidelines', url: 'https://docs.flutter.dev/deployment/android', isFree: true }],
        children: []
      }
    ]
  },
  {
    id: 'tpl_web3_engineer',
    category: 'Engineering',
    badge: 'Decentralized',
    title: 'Blockchain & Web3 Engineer (Solidity & Ethereum)',
    description: 'Master Ethereum Virtual Machine (EVM), Solidity smart contracts, DeFi protocols, security auditing, Hardhat, and Ethers.js.',
    targetRole: 'Smart Contract Developer / Web3 Engineer',
    interests: 'Blockchain, Web3, Solidity, Cryptography',
    estimatedTotalHours: 120,
    difficulty: 'Intermediate to Advanced',
    milestonesCount: 6,
    icon: 'cube',
    nodes: [
      {
        id: 'node_w3_1',
        title: 'Blockchain Fundamentals & Cryptography',
        description: 'Public/private key cryptography, hashing (SHA-256, Keccak-256), consensus mechanisms (PoS), and EVM architecture.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        projectCallout: { title: 'Beginner Project', description: 'Build a basic proof-of-work blockchain simulator in Python or TypeScript.', level: 'beginner' },
        resources: [{ type: 'docs', title: 'Ethereum.org Development Documentation', url: 'https://ethereum.org/en/developers/docs/', isFree: true }],
        children: []
      },
      {
        id: 'node_w3_2',
        title: 'Solidity Smart Contract Development',
        description: 'Data types, memory vs storage vs calldata, modifiers, inheritance, events, and ERC-20 / ERC-721 token standards.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Solidity Official Documentation', url: 'https://docs.soliditylang.org/', isFree: true },
          { type: 'practice', title: 'CryptoZombies: Interactive Solidity Course', url: 'https://cryptozombies.io/', isFree: true }
        ],
        children: []
      },
      {
        id: 'node_w3_3',
        title: 'Hardhat & Foundry Testing Frameworks',
        description: 'Deploying contracts locally, writing comprehensive unit tests with Foundry (Fuzz testing) and Hardhat, and gas optimization.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Foundry Book: Fast Ethereum Toolkit', url: 'https://book.getfoundry.sh/', isFree: true }],
        children: []
      },
      {
        id: 'node_w3_4',
        title: 'Smart Contract Security & Vulnerability Auditing',
        description: 'Reentrancy attacks, integer overflows, front-running, flash loan exploits, OpenZeppelin secure contracts, and Slither static analysis.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        projectCallout: { title: 'Intermediate Project', description: 'Solve capture-the-flag security challenges on Ethernaut (OpenZeppelin).', level: 'intermediate' },
        resources: [{ type: 'practice', title: 'OpenZeppelin Ethernaut Smart Contract Wargames', url: 'https://ethernaut.openzeppelin.com/', isFree: true }],
        children: []
      },
      {
        id: 'node_w3_5',
        title: 'Full-Stack dApp Frontend (Ethers.js / Wagmi / Viem)',
        description: 'Wallet connections (MetaMask/WalletConnect), signing transactions, reading contract state, and decentralized storage (IPFS).',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Wagmi: React Hooks for Ethereum', url: 'https://wagmi.sh/', isFree: true }],
        children: []
      },
      {
        id: 'node_w3_6',
        title: 'DeFi Staking Protocol Capstone Project',
        description: 'Architect, test, and deploy a decentralized staking protocol with automated reward distribution and live frontend UI.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [{ type: 'project', title: 'DeFi Lending & Staking Architecture Spec', url: 'https://github.com/', isFree: true }],
        children: []
      }
    ]
  },
  {
    id: 'tpl_game_dev',
    category: 'Engineering',
    badge: 'Creative & Math',
    title: 'Game Developer (Unreal Engine C++ & Unity C#)',
    description: '3D Math, game loops, physics engines, shaders & rendering pipelines, AI behavior trees, audio, and gameplay programming.',
    targetRole: 'Game Engine / Gameplay Programmer',
    interests: 'Game Dev, C++, C#, Unreal Engine, Unity',
    estimatedTotalHours: 140,
    difficulty: 'Intermediate to Advanced',
    milestonesCount: 6,
    icon: 'game-controller',
    nodes: [
      {
        id: 'node_game_1',
        title: 'Game Programming Math & Vector Physics',
        description: 'Vectors (dot/cross products), matrices, quaternions, coordinate spaces, kinematics, and raycasting.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        projectCallout: { title: 'Beginner Project', description: 'Build a 2D physics simulation or arcade game from scratch.', level: 'beginner' },
        resources: [{ type: 'video', title: 'Freya Holmér: Math for Game Developers Series', url: 'https://www.youtube.com/@acegikmo', isFree: true }],
        children: []
      },
      {
        id: 'node_game_2',
        title: 'Core Engine Architecture & Game Loop',
        description: 'Fixed vs variable timesteps, entity-component systems (ECS), memory pooling, scene graphs, and input managers.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [{ type: 'article', title: 'Game Programming Patterns by Robert Nystrom', url: 'https://gameprogrammingpatterns.com/', isFree: true }],
        children: []
      },
      {
        id: 'node_game_3',
        title: 'Shaders & Computer Graphics (HLSL / GLSL)',
        description: 'Vertex & fragment shaders, lighting models (Phong/PBR), post-processing effects, normal maps, and GPU render pipelines.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [{ type: 'course', title: 'The Book of Shaders Guide', url: 'https://thebookofshaders.com/', isFree: true }],
        children: []
      },
      {
        id: 'node_game_4',
        title: 'Game AI: Behavior Trees, NavMesh & State Machines',
        description: 'Hierarchical state machines, A* pathfinding, NavMesh path generation, and perception systems for NPC AI.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 24,
        recommendationType: 'recommended',
        projectCallout: { title: 'Intermediate Project', description: 'Create an enemy AI squad with flanking behavior in Unreal Engine or Unity.', level: 'intermediate' },
        resources: [{ type: 'docs', title: 'Unreal Engine Behavior Trees Guide', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/behavior-trees-in-unreal-engine', isFree: true }],
        children: []
      },
      {
        id: 'node_game_5',
        title: 'Multiplayer Networking & State Synchronization',
        description: 'Client-side prediction, server reconciliation, lag compensation, UDP socket protocols, and replication.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [{ type: 'article', title: 'Gabriel Gambetta: Fast-Paced Multiplayer Networking', url: 'https://www.gabrielgambetta.com/client-server-game-architecture.html', isFree: true }],
        children: []
      },
      {
        id: 'node_game_6',
        title: 'Capstone: Complete 3D Action Gameplay Showcase',
        description: 'Develop and optimize a complete 3D demo with inventory systems, boss fight AI, audio spatialization, and 60fps profiling.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 30,
        recommendationType: 'recommended',
        resources: [{ type: 'project', title: 'Action RPG Gameplay Architecture Spec', url: 'https://github.com/', isFree: true }],
        children: []
      }
    ]
  },

  // ==========================================
  // ENGINEERING & CAREER TRACKS
  // ==========================================
  {
    id: 'tpl_frontend_dev',
    category: 'Engineering',
    badge: 'Popular',
    title: 'Frontend Developer (React & Modern Web)',
    description: 'Master HTML5, modern ES2024+ JavaScript, React 19, Tailwind CSS, TypeScript, and web performance optimization.',
    targetRole: 'Frontend Engineer',
    interests: 'Web Dev, Frontend, UI/UX',
    estimatedTotalHours: 120,
    difficulty: 'Beginner to Advanced',
    milestonesCount: 6,
    icon: 'code-2',
    nodes: [
      {
        id: 'node_fe_1',
        title: 'Modern Web Foundations & Semantic Architecture',
        description: 'Semantic HTML5, CSS layout engines (Flexbox & Grid), accessible UX principles (WCAG 2.2), and responsive media queries.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Beginner Project Checkpoint',
          description: 'Build an accessible multi-page responsive portfolio and product landing page with CSS Grid.',
          level: 'beginner'
        },
        resources: [
          { type: 'docs', title: 'MDN Web Docs: Learn Web Development', url: 'https://developer.mozilla.org/en-US/docs/Learn', isFree: true },
          { type: 'course', title: 'FreeCodeCamp: Responsive Web Design Certification', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', isFree: true },
          { type: 'practice', title: 'Frontend Mentor: Interactive Layout Challenges', url: 'https://www.frontendmentor.io/', isFree: true }
        ],
        children: [
          {
            id: 'node_fe_1_1',
            title: 'Semantic HTML & Accessibility (a11y)',
            description: 'Landmark elements, ARIA attributes, keyboard navigation, and contrast guidelines.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'W3C Web Accessibility Initiative Guide', url: 'https://www.w3.org/WAI/', isFree: true }],
            children: [],
            isExpandable: false
          },
          {
            id: 'node_fe_1_2',
            title: 'Modern CSS Layouts (Flexbox & Grid)',
            description: 'Two-dimensional grid tracks, alignment properties, container queries, and subgrid.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 10,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'CSS-Tricks: Complete Guide to Flexbox & Grid', url: 'https://css-tricks.com/', isFree: true }],
            children: [],
            isExpandable: false
          }
        ],
        isExpandable: true,
        isExpanded: true
      },
      {
        id: 'node_fe_2',
        title: 'JavaScript Mastery & Async Programming (ES6+)',
        description: 'Closures, lexical scoping, event loop mechanics, Promises, Async/Await, and modern ES module systems.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'JavaScript.info: The Modern JavaScript Tutorial', url: 'https://javascript.info/', isFree: true },
          { type: 'practice', title: 'Exercism: JavaScript Track & Mentorship', url: 'https://exercism.org/tracks/javascript', isFree: true }
        ],
        children: [
          {
            id: 'node_fe_2_1',
            title: 'DOM Manipulation & Event Propagation',
            description: 'Event delegation, capturing, bubbling, custom events, and DOM traversal.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 8,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'MDN: Introduction to Events', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events', isFree: true }]
          },
          {
            id: 'node_fe_2_2',
            title: 'Fetch API, Promises & Async/Await',
            description: 'Consuming REST APIs, error boundaries, AbortController, and parallel Promise.allSettled.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 8,
            recommendationType: 'recommended',
            resources: [{ type: 'article', title: 'JavaScript Promises in Depth', url: 'https://javascript.info/async', isFree: true }]
          }
        ],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_fe_3',
        title: 'React 19 & Component Architecture',
        description: 'Component lifecycles, custom hooks, reactive state, Server Components, and modular design patterns.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 28,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Intermediate Project Checkpoint',
          description: 'Build an interactive Kanban Board or Music Player with global client state and optimistic UI updates.',
          level: 'intermediate'
        },
        resources: [
          { type: 'docs', title: 'React.dev Official Documentation', url: 'https://react.dev/learn', isFree: true },
          { type: 'course', title: 'Full Stack Open — University of Helsinki', url: 'https://fullstackopen.com/en/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_fe_4',
        title: 'TypeScript for Scale & Reliability',
        description: 'Generics, union types, utility types, discriminating unions, and strict compiler configurations.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'TypeScript Official Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', isFree: true },
          { type: 'practice', title: 'Total TypeScript Interactive Exercises by Matt Pocock', url: 'https://www.totaltypescript.com/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_fe_5',
        title: 'Web Performance, Core Web Vitals & Testing',
        description: 'Optimize LCP, INP, CLS, tree shaking, code splitting, dynamic imports, and Vitest/Testing Library test suites.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'web.dev — Core Web Vitals Performance Guide', url: 'https://web.dev/explore/fast', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_fe_6',
        title: 'Capstone: Production SaaS Dashboard with State & APIs',
        description: 'Engineer and deploy a feature-rich, high-performance web app with authentication and offline persistence.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: 'Production React SaaS Blueprint on GitHub', url: 'https://github.com/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  },

  {
    id: 'tpl_data_analyst',
    category: 'Data',
    badge: 'In-Demand',
    title: 'Data Analyst & BI Specialist',
    description: 'Transform raw data into business intelligence using SQL, Python (Pandas/NumPy), Tableau, PowerBI, and statistical modeling.',
    targetRole: 'Data Analyst',
    interests: 'Data Science, Analytics, SQL',
    estimatedTotalHours: 110,
    difficulty: 'Beginner to Intermediate',
    milestonesCount: 6,
    icon: 'bar-chart-3',
    nodes: [
      {
        id: 'node_da_1',
        title: 'Relational Databases & Advanced SQL for Analytics',
        description: 'Complex joins, window functions (ROW_NUMBER, LAG, LEAD), CTEs, aggregations, and query optimization.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'PostgreSQL Documentation & SQL Tutorial', url: 'https://www.postgresql.org/docs/', isFree: true },
          { type: 'practice', title: 'SQLBolt — Interactive Lessons', url: 'https://sqlbolt.com/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_da_2',
        title: 'Python for Data Wrangling (Pandas & NumPy)',
        description: 'Data cleaning, tabular transformations, pivot tables, handling missing values, and vectorized operations.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Pandas User Guide & Tutorials', url: 'https://pandas.pydata.org/docs/user_guide/index.html', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_da_3',
        title: 'Exploratory Data Analysis & Visual Storytelling',
        description: 'Design impactful visual dashboards using Matplotlib, Seaborn, Plotly, and storytelling frameworks.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Seaborn Tutorial & Gallery', url: 'https://seaborn.pydata.org/tutorial.html', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_da_4',
        title: 'Applied Statistics & A/B Testing',
        description: 'Probability distributions, confidence intervals, hypothesis testing, p-values, and designing business A/B experiments.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'course', title: 'Khan Academy Statistics & Probability', url: 'https://www.khanacademy.org/math/statistics-probability', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_da_5',
        title: 'Modern Business Intelligence (Power BI & Tableau)',
        description: 'Build interactive executive dashboards, DAX calculations, automated data refreshes, and KPI scorecards.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Microsoft Power BI Guided Learning & Docs', url: 'https://learn.microsoft.com/en-us/power-bi/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_da_6',
        title: 'Capstone: End-to-End Analytics Case Study & Portfolio',
        description: 'Analyze real-world business dataset, extract actionable insights, and present a C-level executive report.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: 'Kaggle Datasets & Public Analytics Portfolio Template', url: 'https://www.kaggle.com/datasets', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  },

  {
    id: 'tpl_ai_ml_engineer',
    category: 'AI & Machine Learning',
    badge: 'Trending',
    title: 'AI & Machine Learning Engineer (PyTorch & LLMs)',
    description: 'From Linear Algebra and Scikit-Learn to PyTorch Deep Learning, LLMs, LangChain, RAG pipelines, and MLOps deployment.',
    targetRole: 'Machine Learning Engineer',
    interests: 'AI/ML, Deep Learning, Python, LLMs',
    estimatedTotalHours: 150,
    difficulty: 'Intermediate to Advanced',
    milestonesCount: 6,
    icon: 'cpu',
    nodes: [
      {
        id: 'node_ml_1',
        title: 'Math & Foundations for Machine Learning',
        description: 'Linear Algebra (tensors, matrix decomposition), Multivariate Calculus (gradients, backpropagation), and Probability.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [
          { type: 'video', title: '3Blue1Brown: Essence of Linear Algebra Series', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_ml_2',
        title: 'Classical Machine Learning & Feature Engineering',
        description: 'Supervised/unsupervised algorithms, decision trees, ensemble methods (XGBoost/LightGBM), and validation metrics.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 25,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Scikit-Learn User Guide & Tutorials', url: 'https://scikit-learn.org/stable/user_guide.html', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_ml_3',
        title: 'Deep Learning & Neural Networks with PyTorch',
        description: 'Deep neural networks, CNNs for computer vision, RNNs/Transformers for sequences, and PyTorch training loops.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 32,
        recommendationType: 'recommended',
        resources: [
          { type: 'course', title: 'Practical Deep Learning for Coders by Fast.ai', url: 'https://course.fast.ai/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_ml_4',
        title: 'Generative AI, Large Language Models & RAG',
        description: 'Transformer architecture, vector embeddings, vector databases (Chroma/Pinecone), LangChain/LlamaIndex, and fine-tuning with LoRA.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Hugging Face NLP & Transformers Course', url: 'https://huggingface.co/learn/nlp-course', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_ml_5',
        title: 'MLOps, Model Serving & Containerization',
        description: 'Packaging models with Docker, serving via FastAPI/Triton, tracking experiments with MLflow, and monitoring drift.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'course', title: 'Made With ML: Production MLOps Course', url: 'https://madewithml.com/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_ml_6',
        title: 'Capstone: Production AI Application Deployment',
        description: 'Build, evaluate, and deploy a production multimodal AI application with real-time inference and evaluation benchmarks.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 25,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: 'Deploy AI Apps to Hugging Face Spaces & Cloud', url: 'https://huggingface.co/spaces', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  },

  {
    id: 'tpl_devops_cloud',
    category: 'Cloud & Infrastructure',
    badge: 'High Salary',
    title: 'DevOps & Cloud Architect (Docker, K8s, Terraform, AWS/GCP)',
    description: 'Automate infrastructure, CI/CD pipelines, Kubernetes container orchestration, and cloud reliability engineering.',
    targetRole: 'DevOps / Cloud Engineer',
    interests: 'DevOps, Cloud, Linux, Kubernetes',
    estimatedTotalHours: 130,
    difficulty: 'Intermediate to Advanced',
    milestonesCount: 6,
    icon: 'cloud',
    nodes: [
      {
        id: 'node_do_1',
        title: 'Linux Systems Administration & Bash Automation',
        description: 'POSIX command-line mastery, systemd, SSH keys, network routing, DNS, TLS certificates, and robust Bash scripting.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'course', title: 'Linux Journey — Interactive Linux Tutorials', url: 'https://linuxjourney.com/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_do_2',
        title: 'Docker & Containerization Best Practices',
        description: 'Multi-stage builds, container security, Docker Compose orchestration, volume management, and lightweight images.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Docker Official Get Started Guides', url: 'https://docs.docker.com/get-started/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_do_3',
        title: 'Continuous Integration & Continuous Deployment (CI/CD)',
        description: 'Automated test execution, GitHub Actions workflows, matrix builds, artifact promotion, and blue/green deployments.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'GitHub Actions Documentation & Examples', url: 'https://docs.github.com/en/actions', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_do_4',
        title: 'Infrastructure as Code (IaC) with Terraform',
        description: 'Declarative cloud provisioning, state locking, modules, workspace isolation, and policy enforcement.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'HashiCorp Terraform Tutorials & Reference', url: 'https://developer.hashicorp.com/terraform/tutorials', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_do_5',
        title: 'Kubernetes (K8s) Orchestration & Helm Packaging',
        description: 'Pods, Deployments, Services, Ingress controllers, ConfigMaps, Secrets, persistent volumes, and Helm charts.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 28,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Kubernetes Official Interactive Documentation', url: 'https://kubernetes.io/docs/home/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_do_6',
        title: 'Observability & Cloud SRE Capstone',
        description: 'Prometheus & Grafana dashboards, OpenTelemetry distributed tracing, alerting rules, and incident remediation.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Prometheus & Grafana Quickstart Guides', url: 'https://prometheus.io/docs/introduction/overview/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  },

  {
    id: 'tpl_cybersecurity',
    category: 'Security',
    badge: 'Critical',
    title: 'Cybersecurity Specialist & SOC Analyst',
    description: 'Learn network security, Linux hardening, web application security (OWASP Top 10), penetration testing, and incident response.',
    targetRole: 'Cybersecurity Analyst',
    interests: 'Cybersecurity, Networking, Ethical Hacking',
    estimatedTotalHours: 125,
    difficulty: 'Beginner to Advanced',
    milestonesCount: 6,
    icon: 'shield-alert',
    nodes: [
      {
        id: 'node_sec_1',
        title: 'Computer Networks & Packet Inspection (Wireshark)',
        description: 'OSI/TCP-IP layers, IP subnetting, DNS, HTTP/HTTPS, SSL/TLS handshakes, and packet analysis with Wireshark.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'video', title: 'Professor Messer: CompTIA Network+ Training Course', url: 'https://www.professormesser.com/', isFree: true },
          { type: 'practice', title: 'Wireshark Sample Captures & Exercises', url: 'https://wiki.wireshark.org/SampleCaptures', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_sec_2',
        title: 'Linux Hardening & Security Automation',
        description: 'User access control, permissions, iptables/firewalld, secure SSH, auditd logs, and Python/Bash security scripts.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'course', title: 'Linux Journey — Security & Administration', url: 'https://linuxjourney.com/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_sec_3',
        title: 'Web Application Security & OWASP Top 10',
        description: 'Identify and exploit SQL Injection, XSS, CSRF, SSRF, IDOR, and authentication vulnerabilities safely in labs.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [
          { type: 'practice', title: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security', isFree: true },
          { type: 'docs', title: 'OWASP Top 10 Documentation', url: 'https://owasp.org/www-project-top-ten/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_sec_4',
        title: 'Threat Detection, SIEM & SOC Operations',
        description: 'Log ingestion, Splunk/Elasticsearch query syntax, correlation rules, malware triage, and incident response playbooks.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [
          { type: 'practice', title: 'TryHackMe — SOC Analyst Level 1 Track', url: 'https://tryhackme.com/', isFree: false }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_sec_5',
        title: 'Vulnerability Assessment & Penetration Testing Basics',
        description: 'Reconnaissance tools (Nmap, Gobuster), Metasploit framework, privilege escalation, and vulnerability reporting.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [
          { type: 'practice', title: 'Hack The Box: Guided Starting Point Machines', url: 'https://www.hackthebox.com/', isFree: false }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_sec_6',
        title: 'Capstone: Security Audit & Professional Assessment Report',
        description: 'Conduct a comprehensive vulnerability audit on a simulated corporate network and draft an executive report.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 15,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: 'Public Penetration Testing Reports Collection', url: 'https://github.com/juliocesarfort/public-pentesting-reports', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  },

  // ==========================================
  // TYPESCRIPT TRACK
  // ==========================================
  {
    id: 'tpl_typescript_mastery',
    category: 'Programming Languages',
    badge: 'Enterprise Grade',
    title: 'TypeScript Mastery (Foundations to Advanced Typing)',
    description: 'Master TypeScript from type annotations, unions, and interfaces to conditional types, mapped types, template literal types, ASTs, and strict production architecture.',
    targetRole: 'Senior TypeScript Engineer',
    interests: 'TypeScript, JavaScript, Web Dev, Backend',
    estimatedTotalHours: 90,
    difficulty: 'Beginner to Advanced',
    milestonesCount: 6,
    icon: 'code-block',
    nodes: [
      {
        id: 'node_ts_1',
        title: 'TypeScript Basics & Type System Essentials',
        description: 'Understand the compiler (tsc), tsconfig.json options, primitives, union/intersection types, and type inference.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 12,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Beginner Checkpoint',
          description: 'Migrate a vanilla JS utility library to strictly-typed TypeScript with zero "any".',
          level: 'beginner'
        },
        resources: [
          { type: 'docs', title: 'TypeScript Handbook Official Documentation', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', isFree: true },
          { type: 'course', title: 'Total TypeScript — Beginner TypeScript Essentials', url: 'https://www.totaltypescript.com/tutorials/beginners-typescript', isFree: true }
        ],
        children: [
          {
            id: 'node_ts_1_1',
            title: 'Primitive Types, Literals & Type Annotations',
            description: 'string, number, boolean, null, undefined, void, never, and literal types.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 3,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'TypeScript Everyday Types', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html', isFree: true }],
            children: []
          },
          {
            id: 'node_ts_1_2',
            title: 'Interfaces vs Type Aliases & Structural Subtyping',
            description: 'Declaration merging, extending interfaces, intersections, and structural compatibility.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 4,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Interfaces vs Type Aliases Guide', url: 'https://www.typescriptlang.org/docs/handbook/2/objects.html', isFree: true }],
            children: []
          },
          {
            id: 'node_ts_1_3',
            title: 'Strict Mode & tsconfig.json Optimization',
            description: 'noImplicitAny, strictNullChecks, exactOptionalPropertyTypes, and module resolution.',
            status: 'not_started',
            progress: 0,
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'TSConfig Reference Guide', url: 'https://www.typescriptlang.org/tsconfig', isFree: true }],
            children: []
          }
        ],
        isExpandable: true,
        isExpanded: true
      },
      {
        id: 'node_ts_2',
        title: 'Generics & Type Constraints',
        description: 'Generic functions, classes, interfaces, generic constraints (extends), and default type arguments.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'TypeScript Generics Guide', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_ts_3',
        title: 'Advanced Type Manipulation & Mapped Types',
        description: 'keyof, typeof, indexed access types, conditional types, infer keyword, and mapped types.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'practice', title: 'Type Hero: Interactive TypeScript Type Challenges', url: 'https://typehero.dev/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_ts_4',
        title: 'Utility Types & Template Literal Types',
        description: 'Partial, Required, Pick, Omit, Record, ReturnType, Parameters, and string pattern types (`${prefix}_${id}`).',
        status: 'not_started',
        progress: 0,
        estimatedHours: 14,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'TypeScript Utility Types Documentation', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_ts_5',
        title: 'Runtime Validation with Zod & Type-Safe APIs',
        description: 'Schema parsing, type inference from schemas (z.infer), tRPC, and contract-first API development.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Zod TypeScript-First Schema Validation Docs', url: 'https://zod.dev/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_ts_6',
        title: 'Capstone: Type-Safe Monorepo & NPM Library',
        description: 'Publish a dual ESM/CJS typed library using tsdown/tsup, automated declarations, and automated type tests.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 12,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: 'Total TypeScript Library Starter', url: 'https://github.com/mattpocock/ts-reset', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  },

  // ==========================================
  // DATA ENGINEERING TRACK
  // ==========================================
  {
    id: 'tpl_data_engineer',
    category: 'Data Science',
    badge: 'High Demand',
    title: 'Data Engineering & Lakehouse Architect Roadmap',
    description: 'Master large-scale distributed data processing, SQL/BigQuery, Apache Spark, Kafka streaming, Airflow orchestration, dbt transformations, and Lakehouse architectures.',
    targetRole: 'Data Engineer / Lakehouse Architect',
    interests: 'Data Engineering, Big Data, SQL, Python, Cloud',
    estimatedTotalHours: 135,
    difficulty: 'Intermediate to Advanced',
    milestonesCount: 6,
    icon: 'database',
    nodes: [
      {
        id: 'node_de_1',
        title: 'Advanced SQL, Dimensional Modeling & Data Warehousing',
        description: 'Window functions, CTEs, indexing, partition/clustering, star/snowflake schemas, and SCD (Slowly Changing Dimensions).',
        status: 'not_started',
        progress: 0,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'course', title: 'Data Engineering Zoomcamp (Free & Open Source)', url: 'https://github.com/DataTalksClub/data-engineering-zoomcamp', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_de_2',
        title: 'Data Transformation & Analytics Engineering with dbt',
        description: 'dbt models, Jinja templating, testing, lineage graph, documentation, and continuous integration in BigQuery/Snowflake.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'dbt Learn Fundamentals Course & Documentation', url: 'https://courses.getdbt.com/courses/fundamentals', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_de_3',
        title: 'Distributed Batch Processing with Apache Spark & PySpark',
        description: 'RDDs, DataFrames API, Catalyst optimizer, Spark execution model, shuffling, partitioning, and Delta Lake/Iceberg formats.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 28,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Apache Spark Official PySpark Documentation', url: 'https://spark.apache.org/docs/latest/api/python/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_de_4',
        title: 'Data Pipeline Orchestration with Apache Airflow',
        description: 'DAGs, Operators, Sensors, Taskflow API, dynamic DAG generation, scheduling, and error alerting.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Astronomer Airflow Guides & Tutorials', url: 'https://www.astronomer.io/docs/learn/airflow-quickstart', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_de_5',
        title: 'Real-Time Event Streaming with Apache Kafka',
        description: 'Topics, partitions, consumer groups, offsets, schemas (Avro/Protobuf), Kafka Streams, and real-time ingestion.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 25,
        recommendationType: 'recommended',
        resources: [
          { type: 'course', title: 'Confluent Kafka Developer Tutorials', url: 'https://developer.confluent.io/courses/', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      },
      {
        id: 'node_de_6',
        title: 'Capstone: End-to-End Modern Cloud Data Lakehouse Pipeline',
        description: 'Ingest streaming event data via Kafka into Iceberg/Delta Lake, transform with dbt/Spark, orchestrate with Airflow, and expose BI dashboard.',
        status: 'not_started',
        progress: 0,
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: 'Production Data Engineering Pipeline Blueprint', url: 'https://github.com/DataTalksClub/data-engineering-zoomcamp/tree/main/projects', isFree: true }
        ],
        children: [],
        isExpandable: true,
        isExpanded: false
      }
    ]
  }
];
