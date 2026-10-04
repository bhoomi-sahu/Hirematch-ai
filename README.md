# HireMatch AI - Intelligent Recruitment & Resume Platform

## 🆕 What's New in This Update

This update adds the full PDF resume pipeline, AI matching/screening feature set, an automated test suite, and Docker deployment on top of the existing auth + jobs + applications foundation:

- **Real PDF resume upload & parsing** — candidates upload actual PDF files; text is extracted (`pdf-parse`) and structured (AI-assisted with a deterministic fallback, never fabricates data)
- **Deterministic weighted matching engine** (`backend/src/services/matching/matchEngine.js`) — skills 50% / experience 20% / projects 15% / education 10% / certifications 5%, configurable per job
- **Candidate match analysis page** — animated score ring, matched/missing/partial skills, strengths/weaknesses/recommendations, cached until the resume or job changes
- **Recruiter bulk resume screening** — upload up to 20 resumes at once, live "X/Y completed" progress, ranked/filterable candidate table, shortlist/reject
- **AI resume improvement** — gap-driven suggestions with a side-by-side original vs. suggested view; explicitly refuses to invent skills/experience not present in the resume
- **"Analyze with AI" on job creation** — paste a job description, click one button, and required/preferred skills, experience level, and education requirement are extracted (AI-assisted, deterministic fallback) into editable fields
- **Full dashboard UI** for all three roles: job search/filters/pagination, create/edit job, applicant tables, admin user/job/application management, analytics
- **Admin**: suspend/activate users, platform-wide applications view, AI processing health stats
- **Docker**: `docker compose up` runs MongoDB + backend + frontend together, Nginx proxies `/api` to the backend (no CORS setup needed)
- **Automated test suite**: 146 Jest tests across 11 suites — auth, authorization, the matching engine, resume processing (including corrupted/empty PDF handling), bulk-screening isolation, application flows, and AI failure/fallback handling. Run with `npm test` in `backend/`

### Setup notes for this update
- New env var: `backend/.env` → `RESUME_MAX_SIZE_MB` (default `5`)
- Resume PDFs are stored on disk at `backend/uploads/resumes/` (gitignored) — this folder must exist and be writable
- Run `npm install` again in `backend/` (adds `multer`, `pdf-parse`, `jest`, `supertest`) and in `frontend/` (no new dependencies)
- No AI key configured? Everything still works — resume parsing, job parsing, and improvement suggestions fall back to a deterministic (non-LLM) engine automatically

### Known limitations / what's genuinely still open
- **The test suite runs without a live MongoDB** — it uses mocked Mongoose models (a standard, fast unit-testing approach), so it verifies business logic, authorization, and the matching engine thoroughly, but it does not prove the app works against a real database. Run the app locally against your own MongoDB and click through the flows once before treating this as production-ready.
- **Docker was verified as far as this sandbox allows.** I installed Docker here and the daemon does start, but this sandbox's network only allows a short allowlist of domains (npm/PyPI/GitHub registries) — `docker pull` against Docker Hub gets a `403 Forbidden`, so I could not actually pull the base images (`node:20-alpine`, `nginx:1.27-alpine`, `mongo:7`) or run `docker compose up` end-to-end. The `docker-compose.yml` is YAML-validated and the Dockerfiles follow standard, tested patterns, but you are the first real run of the full build — if anything errors, send me the output.
- No CI pipeline (GitHub Actions, etc.) wired up to run these tests automatically — straightforward to add if wanted.

---

HireMatch AI is a full-stack, AI-powered recruitment and resume intelligence platform designed to connect talent with opportunities through intelligent role-based workflows:

1. **Candidate Portal**: Resume intelligence, automated skill extraction, role recommendations, application tracking.
2. **Recruiter Portal**: Job requisition management, candidate ranking, AI match scoring, pipeline management.
3. **Admin Portal**: Platform governance, user/organization administration, audit logs, and system metrics.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS, React Router v6, Axios, Lucide React
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, dotenv, CORS, centralized error handling
- **Database**: MongoDB (Mongoose ODM)
- **Security & Utilities**: JWT, bcryptjs, Morgan logger, custom ApiError/ApiResponse wrappers
- **AI Engine (Upcoming)**: Backend LLM integration layer with multi-provider support

---

## 📁 Project Structure

```text
hirematch-ai/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and environment configurations
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Error handler, logger, auth guards
│   │   ├── models/          # Mongoose data models
│   │   ├── routes/          # Express API route declarations
│   │   ├── services/        # Business logic & data access
│   │   ├── utils/           # Standardized API response & error utilities
│   │   ├── validators/      # Input validation schemas
│   │   ├── app.js           # Express app configuration
│   │   └── server.js        # Server listener and DB initialization
│   ├── .env.example
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # View pages (Landing, Portals)
│   │   ├── layouts/         # Layout wrappers (Navbar, Footer, Sidebar)
│   │   ├── services/        # Axios API client & endpoints
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React Context state management
│   │   ├── utils/           # Helpers and constants
│   │   ├── routes/          # React Router route definitions
│   │   ├── App.jsx          # Root component
│   │   ├── main.jsx         # React DOM entry
│   │   └── index.css        # Tailwind directives & base styles
│   ├── public/
│   ├── .env.example
│   ├── .env
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── README.md
└── .gitignore
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally on `localhost:27017` or a MongoDB Atlas URI

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Backend runs by default at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend runs by default at: `http://localhost:5173`

---

## 🔑 Environment Variables — What to Actually Set

There are **three separate `.env` files** in this project. Only the backend one has anything you truly must set.

### `backend/.env` (required)
```env
PORT=5000
NODE_ENV=development

# Your MongoDB connection string. Options:
#  - Local MongoDB installed on your machine:
MONGODB_URI=mongodb://127.0.0.1:27017/hirematch_ai
#  - MongoDB Atlas (free tier): get this from Atlas → Connect → Drivers
# MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hirematch_ai

CORS_ORIGIN=http://localhost:5173

# Any long random string — this signs your login tokens. Generate one with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=paste_a_long_random_string_here
JWT_EXPIRES_IN=7d

# Optional. Powers live AI resume parsing / improvement text via Gemini.
# Get a free key at https://aistudio.google.com/app/apikey
# Leave AI_API_KEY blank and the app still works fully — it automatically
# falls back to a deterministic (non-AI) parser/matcher instead.
AI_PROVIDER=gemini
AI_API_KEY=

RESUME_MAX_SIZE_MB=5
```

**You must set at minimum:** `MONGODB_URI` (point it at a real, reachable MongoDB) and `JWT_SECRET`. Everything else has a working default.

### `frontend/.env` (usually leave as-is for local dev)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
Only change this if your backend isn't running on `localhost:5000`.

### Root `.env` (Docker only — see below)
Only needed if you use `docker compose up`. Same idea as `backend/.env` but read by Compose instead.

---

## 🐳 Running with Docker

This spins up MongoDB, the backend, and the frontend together — no local Node.js or MongoDB install needed, just Docker Desktop.

### 1. Create the root `.env` file
```bash
cp .env.example .env
```
Open it and set at minimum:
```env
JWT_SECRET=paste_a_long_random_string_here
AI_API_KEY=                 # optional — leave blank to use the deterministic fallback
```
You do **not** need to set `MONGODB_URI` here — Docker Compose wires the backend to the `mongodb` container automatically.

### 2. Build and start everything
```bash
docker compose up --build
```
First run downloads base images and installs dependencies inside the containers, so it takes a few minutes. Subsequent runs are much faster (`docker compose up` without `--build`).

### 3. Open the app
- Frontend: **http://localhost:3000**
- Backend API directly: **http://localhost:5000/api/health**

The frontend container's Nginx proxies all `/api/*` calls straight to the backend container, so there's no CORS to configure and no host/IP guessing.

### What's running
| Service | Container | Exposed on host |
|---|---|---|
| MongoDB 7 | `hirematch-mongodb` | not exposed (internal only) |
| Backend (Node/Express) | `hirematch-backend` | `localhost:5000` |
| Frontend (Nginx serving the Vite build) | `hirematch-frontend` | `localhost:3000` |

Data persists in two named Docker volumes (`mongo_data`, `backend_uploads`) — stopping/restarting containers won't lose your database or uploaded resumes. To wipe everything and start fresh:
```bash
docker compose down -v
```

### Useful commands
```bash
docker compose up -d          # run in the background
docker compose logs -f backend   # tail backend logs
docker compose ps             # see container status/health
docker compose down           # stop everything (keeps data)
```

---

## 🩺 Health Check Verification

The backend exposes a comprehensive health endpoint at:
`GET /api/health`

Response schema:
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2026-09-08T15:20:00.000Z",
    "uptime": 12.34,
    "environment": "development",
    "database": {
      "status": "connected",
      "host": "localhost",
      "name": "jobmatch_ai"
    },
    "memory": {
      "rss": "...",
      "heapTotal": "...",
      "heapUsed": "..."
    }
  }
}
```

---

## 🧪 Testing

The backend has an automated Jest test suite: **146 tests across 11 suites**, all passing.

```bash
cd backend
npm test              # run once
npm run test:watch    # re-run on file changes
npm run test:coverage # with a coverage report
```

### What's covered
| Area | File |
|---|---|
| Matching engine (scoring, weights, alias normalization, edge cases) | `tests/unit/matchEngine.test.js` |
| Deterministic resume parser (regex extraction, never invents data) | `tests/unit/aiService.test.js` |
| Deterministic job-description parser (Analyze with AI fallback) | `tests/unit/aiJobParser.test.js` |
| AI failure handling (bad HTTP status, malformed JSON, timeouts, no API key) | `tests/unit/aiFailureHandling.test.js` |
| Auth (register, login, duplicate email, wrong password, suspended accounts) | `tests/unit/authService.test.js` |
| JWT + role-based authorization middleware | `tests/unit/authMiddleware.test.js` |
| Jobs (CRUD, ownership, cascade delete, filtering/pagination) | `tests/unit/jobService.test.js` |
| Applications (apply flow, matching integration, status updates, ownership) | `tests/unit/applicationService.test.js` |
| Resume processing (corrupted PDFs, empty/image-only PDFs, ownership) | `tests/unit/resumeService.test.js` |
| Bulk screening (batch status aggregation, per-file failure isolation) | `tests/unit/bulkScreenService.test.js` |
| Route wiring (health check, 404s, auth-required routes) | `tests/integration/routes.test.js` |

### How it's tested (important to know)
These are **fast unit/integration tests that mock the MongoDB layer** — they don't require a running database, which is why they run in under 2 seconds and work in any CI environment. They thoroughly verify business logic, authorization rules, and the matching engine's math. What they **don't** prove is that the app works end-to-end against a real MongoDB — for that, run the app locally (or via Docker) and click through the flows, or extend this suite with `mongodb-memory-server` / a real test database for full integration coverage.

