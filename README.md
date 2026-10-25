# SAKSHAM — AICTE Approval Workflow & Compliance Management System
> **Tagline:** Intelligent Scrutiny. Automated Workflows. Transparent Compliance.  
> **Problem Statement ID:** Smart India Hackathon (SIH) 26262 — “Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System”  
> **Statutory Alignment:** AICTE Approval Process Handbook (APH) 2024–25 to 2026–27  
> **Phase:** Phase 1 — Project Foundation & Government-Grade Administrative Portal Shell  

---

## 1. Project Overview & Scope
**SAKSHAM** is a role-based workflow automation and compliance management platform designed from the perspective of AICTE officials, regional officers, and expert committee members who process technical institution approval queues.

### Key Capabilities in Phase 1:
- **Government-Grade Administrative Shell:** Deep navy blue palette (`#0A1B38`), crisp typography, accessible high-contrast tables, and restrained saffron/green indicators.
- **Ten Core Navigable Routes:**
  - `/login`: Formal administrative sign-in with development role persona simulator.
  - `/dashboard`: Unified executive dashboard with mathematically synchronized metrics.
  - `/applications`: Searchable, multi-parameter filterable master application register.
  - `/workflow-queue`: Scrutiny & Re-Scrutiny SLA queues with ageing indicators (>7d breach alerts).
  - `/evc`: Expert Visit Committee inspection tracker and 48-hour report submission countdown.
  - `/compliance`: Time-bound institutional undertakings and 30/60/90-day conditional approvals.
  - `/document-validity`: Land lease tenure (&ge;30y), Fire Safety NOC, and NBA accreditation expiry monitoring.
  - `/reports`: Operational reporting and regional workload distribution charts (Recharts).
  - `/audit`: Forensic, tamper-evident audit trail capturing every officer decision and stage transition.
  - `/admin/rules`: Versioned regulatory rules engine citing specific APH chapters and clauses.
- **Cardinal Regulatory Principle:** SAKSHAM supports authorized human scrutiny, inspection, and verification. **It does NOT and shall NEVER autonomously grant regulatory approval.**
- **Transparent Boundaries:** Uses a coherent, deterministic synthetic dataset. Fully isolated from restricted live AICTE systems.

---

## 2. Technical Architecture & Tech Stack

```
SAKSHAM/
├── client/                     # React 18 + Vite + TypeScript Frontend
│   ├── src/components/         # Layout, StatCard, StatusBadge, ApplicationDetailDrawer
│   ├── src/pages/              # 10 route page components
│   └── src/context/            # AuthContext & Role simulator
├── server/                     # Node.js + Express + TypeScript Backend API
│   ├── src/controllers/        # Health, Applications, Metrics, Rules, Operations
│   ├── src/middleware/         # ErrorHandler, RequestLogger
│   └── prisma/schema.prisma    # PostgreSQL Relational Schema
├── shared/                     # Cross-layer Type Definitions & Shared Mock Data
│   └── src/                    # Single source of truth for entities & metrics
├── docs/                       # Statutory and Architectural Specification Documents
│   ├── PROJECT_CHARTER.md
│   ├── ARCHITECTURE.md
│   ├── SOURCE_REGISTER.md
│   ├── REGULATORY_RULES_REGISTER.md
│   └── IMPLEMENTATION_ROADMAP.md
├── docker-compose.yml          # PostgreSQL 16 container definition
├── .env.example                # Clean configuration placeholders
└── package.json                # Root npm workspaces configuration
```

### Technology Matrix:
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide React, Framer Motion, Recharts, React Hook Form, Zod.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Helmet, Cors, Zod.
- **Database:** PostgreSQL 16 (via Docker Compose).
- **Testing:** Vitest for client and server integration testing.

---

## 3. Quickstart & Installation

### Prerequisites:
- **Node.js:** v18.0.0 or higher (v24+ tested)
- **npm:** v9.0.0 or higher
- **Docker & Docker Compose** (Optional for local PostgreSQL container)

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
*(Windows PowerShell: `Copy-Item .env.example .env`)*

### Step 3 (Optional): Start Local PostgreSQL Container
```bash
npm run docker:up
```

### Step 4: Build Shared Types
```bash
npm run build --workspace=shared
```

### Document OCR Verification
Institution uploads are content-checked and verified on the server using PDF.js text extraction and Tesseract.js OCR for scanned PDFs and images. The English Tesseract trained data is installed with the server dependencies; no document content is sent to an external OCR service. To use an alternate local trained-data directory, set `TESSERACT_LANG_PATH` to that directory before starting the server.

Apply the document verification columns to the configured PostgreSQL database before running the updated server:
```bash
npm run db:generate
npm run db:migrate
```

Run these commands from the `PRAVAH` workspace root with PostgreSQL available and `server/.env` configured from `server/.env.example` (including `DATABASE_URL`).
Each upload receives `VERIFIED`, `REJECTED`, or `MANUAL_REVIEW`. OCR checks are not proof of authenticity and do not approve applications; only required documents with `VERIFIED` status pass preliminary submission checks. Documents needing correction or review remain attached to the institution's draft.

---

## 4. Running the Development Environment

### English and Hindi
The frontend language selector is available on the sign-in screen and in both portal headers. Choose English or हिंदी; the selection updates immediately and is saved in browser local storage. Locale catalogs live in `client/src/locales`. The current translations cover shared portal navigation, officer page headings, sign-in labels, status badges, and common loading/error/empty states; page-specific text not yet catalogued remains in English.

The frontend uses Vite's same-origin `/api` proxy to the backend, so the local UI works on the configured frontend port without a hardcoded browser API origin. Vite uses `strictPort`; if port `5173` is occupied, stop the other frontend process instead of launching an unconfigured fallback port. The combined `npm run dev` command stops the other service if either the client or server fails to start.

### Start Both Server & Client Concurrently:
```bash
npm run dev
```
If you see `EADDRINUSE`, stop the previous PRAVAH development server in its terminal with `Ctrl+C`, then run `npm run dev` once. Do not stop unrelated Node processes. On PowerShell, inspect the process owning a port with `Get-NetTCPConnection -LocalPort 5000,5173 -State Listen`; verify its command line is from this project before stopping that specific PID.

### Or Run Services Individually:
- **Frontend Client (Vite Dev Server):**
  ```bash
  npm run dev:client
  ```
  Accessible at: `http://localhost:5173`

- **Backend API Service:**
  ```bash
  npm run dev:server
  ```
  Accessible at: `http://localhost:5000`

---

## 5. API Endpoints & Health Probes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Liveness probe returning service status and uptime seconds. |
| `GET` | `/api/health/ready` | Readiness probe verifying DB configuration & storage readiness. |
| `GET` | `/api/metrics` | Consolidated dashboard metrics mathematically computed. |
| `GET` | `/api/applications` | Master application list with query filters (`search`, `stage`, `region`). |
| `GET` | `/api/applications/:id` | Individual application record details. |
| `GET` | `/api/rules` | Regulatory rules register citing APH clauses. |
| `GET` | `/api/evc` | Expert Visit Committee inspection records. |
| `GET` | `/api/compliance` | Time-bound institutional undertakings. |
| `GET` | `/api/documents` | Document validity and expiry items. |
| `GET` | `/api/audit` | Forensic regulatory audit entries. |

---

## 6. Testing, Linting & Verification Commands

- **Run all automated tests across workspaces:**
  ```bash
  npm test
  ```
- **Type-check and lint all packages:**
  ```bash
  npm run lint
  ```
- **Build production bundles:**
  ```bash
  npm run build
  ```

---

## 7. Regulatory Source Register & Compliance Citations
See full statutory references in:
- `docs/PROJECT_CHARTER.md` — Project mission, SIH 26262 scope, non-negotiable human decision guardrail.
- `docs/ARCHITECTURE.md` — System architecture, state machine, and Prisma schema.
- `docs/SOURCE_REGISTER.md` — Official AICTE APH 2024–27 and court-mandated calendar citations.
- `docs/REGULATORY_RULES_REGISTER.md` — Verification register of regulatory rules and SLA intervals.
- `docs/IMPLEMENTATION_ROADMAP.md` — Phased development plan through Phase 5.
