# AGENTS.md - Operational Guide & Directives for AI and Autonomous Agents

This document establishes the architectural guidelines, development workflows, strict coding conventions, and execution commands for any Artificial Intelligence assistant (e.g., Antigravity, Cursor, GitHub Copilot, Cline, Windsurf, Aider) interacting with, modifying, or debugging this repository.

> [!IMPORTANT]
> **For AI Agents:** Before making code modifications, thoroughly review this guide. Any changes to the database, authentication API, or data models must rigorously respect the principles established here to avoid breaking system integrity or the predictive model pipeline (XGBoost/SHAP).

---

## 🏛️ 1. Ecosystem Overview and Architecture

**Academia Autopoiesis** is a comprehensive containerized platform for academic management, prospect lead capture, and analytical demand forecasting through Explainable Artificial Intelligence (XGBoost + SHAP).

### Technology Stack
| Layer | Main Technology | Version / Key Libraries |
| :--- | :--- | :--- |
| **Frontend** | React + Vite (Node 22 Alpine) | React 19, React Router DOM 7, Recharts, Lucide React |
| **Backend** | Python (3.10+) / Flask | Flask, SQLAlchemy, PyJWT, Bcrypt, Gunicorn, Flask-Mail |
| **Database** | PostgreSQL (15+ Alpine / 18) | Normalized Design (1NF to 3NF), simultaneous OLTP and OLAP |
| **Data Science / AI**| Machine Learning & Analytics | XGBoost 2.0, SHAP 0.43, Pandas, NumPy, Jupyter Lab 4.0 |
| **Orchestration** | Docker & Docker Compose | Distributed containers with persistent volumes |

### Service and Port Mapping (Docker Compose)
* **`frontend`**: Port **`3000`** (Vite development server / Nginx in production).
* **`backend`**: Port **`5000`** (Flask API REST & backend logical engine).
* **`db`**: Port **`5433`** (Localhost) -> **`5432`** (Internal inside PostgreSQL container).
* **`pgadmin`**: Port **`5051`** (Visual database management interface - `admin@autopoiesis.com` / `admin`).
* **`jupyter`**: Port **`8888`** (Jupyter Lab server for ML & data analysis - Token: `autopoiesis`).

---

## 🛠️ 2. Essential Commands for Execution and Testing

AI agents must prioritize running commands within the Docker ecosystem to avoid dependencies and environment mismatches locally.

### Container Management
```bash
# Bring up the entire ecosystem (Recommended)
docker compose up -d --build

# Bring up in development mode with Hot-Reload for live debugging
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Stop containers cleanly without losing PostgreSQL persistent data
docker compose down
```

### Data Ingestion (ETL) & Machine Learning Pipeline
When deploying containers in a clean environment or after schema modifications involving the ML model:
```bash
# 1. Data Ingestion & Seed Generation (~2,000 simulated students, ~3,000 enrollments)
docker exec -it xgboost-course-prediction-backend-1 python import_data.py

# 2. Predictive Model Training & SHAP Explainability Value Calculation
docker exec -it xgboost-course-prediction-backend-1 python ml/train_model.py
```

### Code Quality & Testing Verification
* **Frontend (Lint & Build):**
  ```bash
  cd frontend
  npm run lint       # ESLint validation on React components
  npm run build      # Verification of clean production compile
  ```
* **Backend (Unit / Integration Tests):**
  ```bash
  # Run verification script for dashboard analytical statistics
  python backend/test_stats.py
  
  # Running automated test suite with pytest (see docs/TESTING_GUIDE.md)
  pytest backend/tests
  ```

---

## 🔒 3. Architectural Invariants and Strict Directives

When writing or modifying code, AI agents **MUST RESPECT AND ENFORCE** the following non-negotiable principles:

### 1. Authentication & Security (HTTP-Only Cookies & JWT)
> [!CAUTION]
> **Never store JWT tokens in `localStorage` or `sessionStorage` on the frontend, and never require tokens to be passed via explicit `Authorization: Bearer <token>` headers when the application logic relies on HTTP-Only Cookies.**

* The system uses **HTTP-Only Cookies** transferred between client and server to mitigate XSS vulnerabilities and attacks.
* **Frontend:** All authenticated API requests must use the centralized wrapper **`fetchApi`** ([src/api.js](file:///C:/Users/pipe-/Repositorio%20Local/xgboost-course-prediction/frontend/src/api.js)), which automatically injects the `credentials: 'include'` configuration.
* **Backend:** Every transactional or administrative route in Flask must be protected by the **`@admin_required`** decorator or validated via token cookie verification.

### 2. Database & Normalization (3NF & Soft Deletions)
* **Strict Normalization (3NF):** All demographic information (Birth Date, Department/State, Phone, Occupation) exclusively belongs to the **`usuarios`** table. The **`inscripciones`** table serves as a transactional many-to-many junction entity that inherits demographic associations rationally and freezes the actual price paid in `costo_real_bs`.
* **Prohibition of Hard Deletion:** **Never** execute explicit `DELETE` SQL statements on historical records (such as academic programs or enrollments/subscriptions). Always implement **soft deletion** (`eliminado = True`) to ensure that historical datasets powering the XGBoost ML pipeline remain intact without mathematical distortion.
* **Status vs. Visibility:** Academic programs maintain an `activo` boolean flag to manage public UI catalog visibility and an `eliminado` flag to hide them administratively in the dashboard without breaking N:M relationships or historical ML records.

### 3. Machine Learning & Explainable AI (XGBoost + SHAP)
* **Demand & Explainability:** The predictive engine does not just predict *how much* student demand a course will experience using an `XGBoostRegressor`; it also calculates *why* using Shapley values (`shap` library). These values are persisted in **`JSONb`** format within PostgreSQL to generate natural language visual explanations in frontend charts (Recharts).
* **Impact on Preprocessing:** Any modification to the data structures of programs, enrollments, or users must be synchronized with Feature Engineering scripts ([ml/feature_engineering.py](file:///C:/Users/pipe-/Repositorio%20Local/xgboost-course-prediction/backend/utils/feature_engineering.py) and `train_model.py`) to prevent breaking geometric transformations (cyclical sine/cosine representation of weeks/months).

### 4. Design Standards & UI (Frontend)
* **Premium & Academic Aesthetics:** The design must leave a lasting visual impression (WOW effect). Implement modern practices aligned with *Academia Autopoiesis* identity:
  * **Strict Color Palette:** Deep Purple (`#7f2b80`) and Cyan (`#038fba`).
  * **Glassmorphism:** Translucent panels with background blurring (`backdrop-filter: blur(...)`), subtle shadows, and visual depth on interface cards and authentication dialogs.
  * **Responsiveness (Mobile-First):** Flexible grid layouts and adaptive navigation elements (such as hamburger navigation on mobile and auto-collapsing sidebar in Dashboard views).
  * **Typography & Iconography:** Clean modern sans-serif fonts (Inter/Outfit) and standardized usage of **`lucide-react`** icons.
* **Local Persistence & Asset Loading:** Use `localStorage` exclusively for non-sensitive user UI preferences (e.g., table vs grid view modes on dashboards) and implement lazy-loading for heavy components and graphic assets.

---

## 📂 4. Project Navigation Map

```text
xgboost-course-prediction/
├── backend/
│   ├── app.py                   # Main Flask REST API application file (Public and administrative endpoints)
│   ├── import_data.py           # ETL Script: Ingestion of json programs, generation of mock students & enrollments
│   ├── db.py                    # SQLAlchemy database configuration and session management
│   ├── ml/                      # Artificial Intelligence and Machine Learning engine
│   │   ├── train_model.py       # Preprocessing, XGBoost model training, and SHAP JSONB calculation
│   │   ├── predict.py           # On-demand runtime inference endpoint logic
│   │   └── *.joblib / *.pkl     # Serialized models and SHAP explainability binaries
│   ├── notebooks/               # Jupyter Lab experimental notebooks (Explainable XGBoost study cases)
│   └── utils/                   # Helper modules (Multi-threaded email broadcasting, dashboard statistics)
├── frontend/
│   ├── src/
│   │   ├── api.js               # Centralized fetch API wrapper supporting HTTP-Only cookie credentials
│   │   ├── components/          # Reusable UI components (Tables, Cards, Modals, Navbar)
│   │   ├── pages/               # SPA application views (Landing, Login, Administrative Dashboard Module)
│   │   ├── context/             # React Context providers (ThemeContext, UI state management)
│   │   └── utils/               # Formatting tools, validations, and frontend utility functions
│   └── package.json             # Vite configuration, React 19 dependencies, Recharts, Lucide icons
├── db/
│   └── init/                    # PostgreSQL schema initialization scripts (01_schema.sql)
├── docs/                        # Extensive technical docs (ARCHITECTURE.md, ML_AI_SYSTEM.md, TESTING_GUIDE.md)
├── docker-compose.yml           # Main microservice configuration for Docker Compose
└── ml_tables.sql                # DDL schema definitions for ML analytics and prediction feature storage
```

---

## 🧪 5. Operational Workflow & Validation for AI Agents

When handling tasks or features within this repository, adhere strictly to the following execution sequence:

1. **Scope Assessment:**
   * Identify whether the task impacts the UI presentation layer (`frontend`), transactional routing (`backend`), or analytical intelligence engine (`backend/ml` & `db`).
2. **Adhere to Established Design Patterns:**
   * Backend REST API responses in `backend/app.py` must consistently return standard structured JSON: `{"success": true/false, "data": {...}, "message": "..."}`.
   * Never instantiate standalone raw `fetch()` calls directly inside React components; always import and invoke `fetchApi(...)` from `src/api.js`.
3. **Security & RBAC QA Verification:**
   When working with access authorization or dashboard data exposure, test and validate logic mentally or operationally against institutional seed credentials:
   * 👑 **Primary Administrator (Full access to Dashboard & AI):** `juandiegomc.sis@gmail.com` | Pass: `admin123`
   * 🎓 **Test Student Account (Restricted from Admin Dashboard):** `mcj2027302@est.univalle.edu` | Pass: `1234567` (or National ID/CI `7654322`)
4. **Post-Implementation Verification:**
   * If Python or Node dependencies or Dockerfile instructions were altered, provide verification steps or verify compilation and builds via terminal scripts to ensure zero syntax or build regressions.
   * If data ingestion logic (`import_data.py`) or predictive schema tables are modified, proactively suggest or execute retraining the XGBoost ML model via `train_model.py`.
5. **Preservation of Academic Comments & Documentation:**
   * Maintain pre-existing analytical and architectural code annotations (such as *Fundamento / Rationale* blocks and algebraic SHAP explanations) designed to substantiate technical decisions for university code tribunals and engineering reviewers.
