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
- **AI Engine:** Google Gemini API (`google-genai` SDK with `gemini-3.5-flash-lite`)
- **Document Extractors:** PyMuPDF (`pymupdf`) for PDFs, BeautifulSoup4 (`bs4`) + `httpx` for Web URLs
- **Validation:** Pydantic v2 schemas
- **Testing:** Comprehensive test suite (`backend/run_tests.py`, `backend/validate_real_world.py`)

---

## ☁️ Vercel Production Deployment Guide

GapGlint is architected to deploy as **two independent Vercel projects** from the same GitHub repository:
1. **Backend Project** (`backend/`): FastAPI deployed via Vercel's Python Serverless Runtime.
2. **Frontend Project** (`frontend/`): React + Vite Single Page Application.

```
GitHub Repository (GapGlint)
├── backend/  ───► Vercel Project 1: gapglint-backend (FastAPI Serverless)
└── frontend/ ───► Vercel Project 2: gapglint-frontend (Vite React SPA)
```

---

### Step 1: Deploy Backend to Vercel

1. Log into your [Vercel Dashboard](https://vercel.com/) and click **"Add New..."** ➔ **"Project"**.
2. Select your GitHub repository (`GapGlint`).
3. Configure project settings:
   - **Project Name:** `gapglint-backend` *(or your preferred name)*
   - **Framework Preset:** `Other`
   - **Root Directory:** Click *Edit* and select **`backend`**.
4. Configure **Environment Variables**:
   | Variable | Value | Notes |
   |---|---|---|
   | `GEMINI_API_KEY` | `AIzaSy...` | Your Google AI Studio API key |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Recommended fast production model |
   | `FRONTEND_ORIGINS` | `https://gapglint.vercel.app` | Comma-separated allowed frontend domains |
5. Click **"Deploy"**.
6. Note your deployed Backend URL (e.g., `https://gapglint-backend.vercel.app`).
   - Verify health: `curl https://gapglint-backend.vercel.app/api/health` ➔ `{"status":"healthy","application":"GapGlint"}`.

---

### Step 2: Deploy Frontend to Vercel

1. In the Vercel Dashboard, click **"Add New..."** ➔ **"Project"**.
2. Select the same GitHub repository (`GapGlint`).
3. Configure project settings:
   - **Project Name:** `gapglint` *(or your preferred name)*
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click *Edit* and select **`frontend`**.
4. Configure **Environment Variables**:
   | Variable | Value | Notes |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://gapglint-backend.vercel.app` | The deployed backend URL from Step 1 *(no trailing slash)* |
5. Click **"Deploy"**.
6. Update the backend's `FRONTEND_ORIGINS` variable in Vercel if your frontend domain differs.

---

### 📦 Serverless Request Body Limit (4.5 MB)

> **Important Vercel Limit:** Vercel Serverless Functions enforce a **4.5 MB maximum request payload limit**.
>
> - **PDF Upload Policy:** GapGlint enforces a safe **4 MB file size limit** on PDF uploads on the frontend and backend.
> - **Larger Documents:** For documents larger than 4 MB, users can provide public URLs directly (which the backend fetches asynchronously without hitting the request-body limit) or paste specific text excerpts into the manual notes workspace.

---

## 💻 Local Development Setup

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure .env (copy from .env.example)
# Add your GEMINI_API_KEY
copy .env.example .env

# Start FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:
- **API Root:** `http://127.0.0.1:8000/`
- **Health Check:** `http://127.0.0.1:8000/api/health`
- **Interactive OpenAPI Docs:** `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (React + Vite)

In a second terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`.  
When `VITE_API_BASE_URL` is omitted locally, the Vite dev proxy automatically forwards `/api/*` requests to `http://127.0.0.1:8000`.

To build the frontend for production:
```bash
npm run build
```

---

## 🧪 Post-Deployment Testing Checklist

After deploying both projects to Vercel, run these verification steps:

1. **Backend Health Check**:
   ```bash
   curl -s https://<your-backend-domain>/api/health
   # Expected output: {"status":"healthy","application":"GapGlint"}
   ```
2. **CORS Options Preflight**:
   ```bash
   curl -I -X OPTIONS https://<your-backend-domain>/api/analyze \
     -H "Origin: https://<your-frontend-domain>" \
     -H "Access-Control-Request-Method: POST"
   # Verify Access-Control-Allow-Origin header matches frontend domain
   ```
3. **Frontend Connectivity**:
   - Open your frontend Vercel URL in your browser.
   - Look at the sidebar status badge: verify it shows **"FastAPI: Connected"** (green indicator).
4. **Live Investigation**:
   - Enter a research topic and question.
   - Ingest a web URL (e.g. `https://peps.python.org/pep-0684/`).
   - Ingest a PDF document (< 4 MB).
   - Click **"Synthesize Evidence Matrix"**.
   - Verify that Metric Cards, Extracted Claims, Conflicts, Information Gaps, and Verification Checklist populate with grounded citations.
5. **Report Export**:
   - Click **"Export JSON"** and **"Export Markdown"** on the Overview tab to confirm client-side dossier generation.

---

## 📁 Repository Structure

```
GapGlint/
├── frontend/
│   ├── vercel.json             # Vercel SPA route rewrite rules
│   ├── .env.example            # Environment variable template (VITE_API_BASE_URL)
│   ├── src/
│   │   ├── lib/
│   │   │   └── api.ts          # Centralized API base URL resolver
│   │   ├── components/         # Dashboard, workspace, tabs, evidence drawer
│   │   ├── pages/              # Overview, New Research, History, About
│   │   ├── hooks/
│   │   │   └── useResearch.ts  # Multipart upload & state pipeline (4MB limit enforced)
│   │   ├── App.tsx             # Root component
│   │   └── main.tsx            # DOM root
│   ├── index.html
│   ├── vite.config.ts          # Vite configuration with local /api proxy
│   └── package.json
│
├── backend/
│   ├── vercel.json             # Vercel Python runtime rewrite rules
│   ├── api/
│   │   └── index.py            # Vercel Serverless Function entrypoint
│   ├── main.py                 # FastAPI application with production CORS
│   ├── models.py               # Pydantic schemas (Sources, Claims, Conflicts, Gaps)
│   ├── requirements.txt        # Production dependencies (FastAPI, PyMuPDF, GenAI)
│   ├── .env.example            # Backend env template (GEMINI_API_KEY, FRONTEND_ORIGINS)
│   ├── routes/
│   │   ├── health.py           # GET /api/health
│   │   └── analyze.py          # POST /api/analyze & /api/analyze/json
│   ├── services/
│   │   ├── source_extractor.py # Web URL & PyMuPDF extractors
│   │   └── gemini_service.py   # Google Gemini API structured reasoning
│   └── tests/                  # Unit and endpoint validation suites
│
├── README.md
└── .gitignore
```
