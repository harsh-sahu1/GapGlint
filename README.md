# GapGlint

> **Tagline:** *See the Gaps. Trace the Claims. Decide with Evidence.*

An AI-powered evidence intelligence platform designed to analyze multiple scattered information sources, uncover contradictions and outdated claims, identify missing information (negative space / blind spots), and generate actionable verification checklists for high-stakes decisions.

---

## 🎯 Problem Statement & Alignment

People rely on online information to make important decisions about education, scholarships, visa policies, research grants, and careers. However:
1. **Scattered Information:** Facts are fragmented across websites, official PDFs, and announcements.
2. **Outdated Details:** Superseded regulations remain online without warnings.
3. **Conflicting Claims:** Different sources provide conflicting criteria, deadlines, and fee schedules.
4. **Information Gaps:** Standard search engines and summarizers condense existing text but cannot reveal what is **critically missing** to make an informed decision.

**GapGlint** provides a structured evidence workspace with:
- Multi-source ingestion (Web URLs, multi-page PDFs, and text notes).
- Atomic claim extraction with sentence-level citations.
- Contradiction & obsolescence detection.
- Negative space / gap identification.
- Prioritized verification checklist for primary authorities.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Deep Navy `#060d1f` - `#0f172a`, Electric Blue `#2563eb`, Off-White background `#f8fafc`)
- **Icons:** Lucide React
- **Visualization:** Recharts
- **State & Pipeline:** Custom `useResearch` hook with direct multipart & JSON `/api/analyze` integration
- **Advanced Dashboard:** Decision Readiness Indicator, Evidence Provenance Inspector Drawer, Category & Search Filters, Export Engine (JSON & Markdown)

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **AI Engine:** Google Gemini API (`google-genai` SDK with `gemini-2.5-flash` / `gemini-3.7-flash`)
- **Document Extractors:** PyMuPDF (`pymupdf`) for PDFs, BeautifulSoup4 (`bs4`) + `httpx` for Web URLs
- **Validation:** Pydantic v2 schemas
- **Testing:** Comprehensive test suite (`backend/run_tests.py`)

---

## 🔑 Environment Configuration

Create a `.env` file in `backend/.env` (or copy from `backend/.env.example`):

```bash
# Obtain your API key from Google AI Studio: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> **Security Note:** The `GEMINI_API_KEY` remains strictly protected inside the FastAPI backend and is never sent to the browser or frontend bundle.

---

## 📁 Project Structure

```
GapGlint/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx             # Collapsible deep navy sidebar with live API indicator
│   │   │   ├── Header.tsx              # Sticky header with breadcrumbs and active source pill
│   │   │   ├── MetricCard.tsx          # 4 dynamic metric cards (Sources, Claims, Conflicts, Gaps)
│   │   │   ├── ResearchWorkspace.tsx   # Topic, question, URL ingestion, PDF drop, text note
│   │   │   ├── SourceList.tsx          # Staged multi-source chips with deletion and size
│   │   │   ├── AnalysisTabs.tsx        # 5 synthesis tabs with grounded AI findings & empty states
│   │   │   └── EmptyState.tsx          # Reusable empty states with feature roadmaps
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx        # Dashboard hero, metrics, workspace, analysis matrix
│   │   │   ├── NewResearchPage.tsx     # Investigation studio with quickstart templates
│   │   │   ├── HistoryPage.tsx         # Session audit trail and investigation logs
│   │   │   └── AboutPage.tsx           # Problem statement alignment and architectural tenets
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx     # Responsive layout coordinating sidebar and views
│   │   ├── hooks/
│   │   │   └── useResearch.ts          # State management & /api/analyze execution pipeline
│   │   ├── lib/
│   │   │   └── utils.ts                # Styling merge utility (cn) & byte formatting
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript domain models
│   │   ├── App.tsx                     # Main application entry point
│   │   ├── main.tsx                    # React DOM root mounting
│   │   └── index.css                   # Tailwind imports and custom typography
│   ├── index.html
│   ├── vite.config.ts                  # Vite config with path aliases and /api proxy
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── main.py                         # FastAPI app with CORS and route registration
│   ├── models.py                       # Pydantic schemas (Sources, Claims, Conflicts, Gaps, Checklist)
│   ├── requirements.txt                # Python dependencies
│   ├── .env.example                    # Sample environment variables
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py                   # GET /api/health
│   │   └── analyze.py                  # POST /api/analyze (multipart) & POST /api/analyze/json
│   ├── services/
│   │   ├── __init__.py
│   │   ├── source_extractor.py         # Multi-source extraction (PyMuPDF, BS4, httpx)
│   │   └── gemini_service.py           # Gemini API structured intelligence synthesis
│   ├── utils/
│   │   └── __init__.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_source_extractor.py    # Unit tests for PDF & web extraction
│   │   ├── test_ai_logic.py            # Unit tests for claims, conflicts, gaps schema
│   │   └── test_api_endpoints.py       # API integration & error handling tests
│   ├── run_tests.py                    # Master backend test runner
│   └── test_health.py                  # Standalone health check test
│
├── README.md
└── .gitignore
```

---

## 🚀 Running the Application

### 1. Run the Backend (FastAPI)

Navigate to the `backend/` directory or run from the root:

```bash
# Install dependencies (if not already installed)
pip install -r backend/requirements.txt

# Start the FastAPI server
cd backend
python -m uvicorn main:app --reload --port 8000
```

The API will be available at:
- **Root:** `http://127.0.0.1:8000/`
- **Health check:** `http://127.0.0.1:8000/api/health`
- **Swagger Documentation:** `http://127.0.0.1:8000/docs`

Expected Health Response:
```json
{
  "status": "healthy",
  "application": "GapGlint"
}
```

### 2. Run the Frontend (Vite + React)

In a separate terminal:

```bash
cd frontend

# Start Vite dev server
npm run dev
```

The application will run at `http://localhost:5173/`.  
The Vite proxy routes `/api/*` directly to `http://127.0.0.1:8000`.

To build for production:
```bash
cd frontend
npm run build
```

### 3. Run Backend Test Suite

To run all extraction, schema validation, and API endpoint integration tests:

```bash
python backend/run_tests.py
```

Expected output:
```
============================================================
GAPGLINT PHASE 2: COMPREHENSIVE TEST SUITE
============================================================
...
Ran 8 tests in 0.056s
OK
Running API Endpoint & Error Handling Suite...
[PASS] GET /api/health returned healthy status
[PASS] Empty topic rejected with 400
[PASS] Empty sources rejected with 400
[PASS] Missing API key cleanly handled with error description
ALL_ENDPOINT_TESTS_COMPLETED_SUCCESSFULLY
============================================================
ALL BACKEND TEST SUITES COMPLETED WITH 100% SUCCESS!
============================================================
```

In a separate terminal:

```bash
cd frontend

# Start Vite dev server
npm run dev
```

The application will run at `http://localhost:5173/`.  
The Vite proxy routes `/api/*` directly to `http://127.0.0.1:8000`.

To build for production:
```bash
cd frontend
npm run build
```

---

## 🧪 Verification & Testing Status

| Component | Status | Details |
|---|---|---|
| **FastAPI Health Endpoint** | ✅ Verified | `GET /api/health` returns `{"status":"healthy","application":"GapGlint"}` |
| **Backend Test Suite** | ✅ Verified | `python backend/test_health.py` passes |
| **Frontend TypeScript Build** | ✅ Verified | `npm run build` compiles 1,593 modules with 0 errors |
| **Collapsible Sidebar** | ✅ Verified | Smooth toggle, 4 main navigation sections, live API status |
| **Metric Cards** | ✅ Verified | Initially displays zero (0) as requested |
| **Multi-URL Ingestion** | ✅ Verified | Validation, duplicate prevention, removable source chips |
| **PDF Upload** | ✅ Verified | Drag-and-drop & file picker, `.pdf` validation, size limits |
| **Manual Excerpts** | ✅ Verified | Text staging with character counting |
| **Analysis Tabs** | ✅ Verified | 5 tabs with attractive empty states tailored to problem statement |

