# CounterPilot — Retail Operating System

> **Tagline:** *Run your shop through conversation, not complicated software.*

CounterPilot is an AI-powered business operating assistant designed for small Indian retail shops (kirana stores, stationery, electronics, and general retail). 

This repository contains the implementation of **Phase 1: Project Foundation**, which establishes the core technical architecture, database foundation, REST API, and modern responsive dashboard shell.

---

## 1. Architecture Overview

CounterPilot is engineered with a clean, decoupled architecture:

```
CounterPilot/
├── frontend/               # React + TypeScript + Vite + Tailwind CSS + React Router
│   ├── src/
│   │   ├── components/     # Reusable UI badges, tables, spinners, empty states
│   │   ├── layouts/        # AppLayout, Sidebar navigation, TopNavbar with shop workspace
│   │   ├── pages/          # Dashboard, Inventory, Sales, Transactions, Assistant, Settings
│   │   ├── services/       # Typed API client layer for backend communication
│   │   ├── types/          # Shared TypeScript domain interfaces
│   │   ├── App.tsx         # Route configuration
│   │   └── main.tsx        # React entrypoint
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                # Python + FastAPI + SQLAlchemy + Pydantic
│   ├── app/
│   │   ├── api/            # API router & modular routes (/health, /products)
│   │   ├── core/           # Configuration (pydantic-settings) & error handling
│   │   ├── database/       # Engine, session dependency, and idempotent seed script
│   │   ├── models/         # SQLAlchemy models (Product, InventoryTransaction)
│   │   ├── schemas/        # Pydantic request/response validation schemas
│   │   ├── services/       # Business logic layer (ProductService)
│   │   └── main.py         # FastAPI application entrypoint with lifespan events
│   ├── tests/              # Pytest test suite with isolated SQLite fixtures
│   ├── requirements.txt    # Python dependencies
│   ├── pytest.ini          # Pytest configuration
│   └── .env.example        # Backend environment template
│
├── .gitignore              # Ignores .venv, node_modules, .env, *.db, cache
├── .env.example            # Root environment reference
└── README.md
```

### Key Technical Decisions

- **Strict Decimal-Compatible Currency & Stock:** SQLite and SQLAlchemy use `Numeric(precision=10, scale=2, asdecimal=True)` and Python's `Decimal` to completely prevent floating-point rounding errors in retail pricing and billing.
- **Data Integrity & Non-Destructive Deletion:** Foreign key constraints between `Product` and `InventoryTransaction` are configured with `ondelete="RESTRICT"`, preventing accidental destruction of historical stock audits. Soft-deletion is also supported via `is_active`.
- **Database CHECK Constraints:** Both SQL-level constraints and Pydantic validation guarantee non-negative prices, non-negative stocks, and restricted transaction types.
- **Repeatable Idempotent Seeding:** Initial retail sample data (10 realistic Indian FMCG products) is seeded safely without creating duplicates upon re-execution.
- **Zero Heavy Infrastructure:** Uses local SQLite, eliminating Docker, Redis, or cloud dependencies in Phase 1.

---

## 2. Prerequisites

- **Node.js**: `v18+` (Tested on `v22.23.2`)
- **Python**: `3.10+` (Tested on `Python 3.12.10` / `Python 3.14`)
- **Package Managers**: `npm` and `uv` (or `pip` / `venv`)

---

## 3. Quick Start & Setup

### A. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   Using `uv` (recommended):
   ```bash
   uv venv .venv
   .venv\Scripts\activate   # On Windows
   # source .venv/bin/activate  # On macOS/Linux
   ```

   Or using standard `python`:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # On Windows
   # source .venv/bin/activate  # On macOS/Linux
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   # or: uv pip install -r requirements.txt
   ```

4. **Environment Configuration:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

5. **Start the FastAPI backend server:**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   The backend will automatically create `counterpilot.db` and idempotently seed the initial 10 Indian retail products on startup.
   - API Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
   - Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### B. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Default: `VITE_API_BASE_URL=http://localhost:8000/api`)*

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```

   Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 4. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status check (`{"status": "ok", "application": "CounterPilot"}`) |
| `GET` | `/api/products` | Paginated product listing with `page`, `page_size`, `search`, `category`, and `low_stock` filters |
| `GET` | `/api/products/summary` | Real-time foundational metrics: total products, low stock count, category count |
| `GET` | `/api/products/{id}` | Detailed product record by ID |
| `POST` | `/api/products` | Create new product with Pydantic validation and initial audit transaction |

---

## 5. Running Automated Tests

Backend tests are implemented with `pytest` using isolated in-memory SQLite fixtures (`StaticPool`):

```bash
cd backend
.venv\Scripts\pytest -v
```

**Test Coverage Includes:**
- System health check endpoint verification (`GET /api/health`).
- Product listing with pagination, search, and low stock threshold filtering.
- Seed idempotency verification (running multiple times produces 0 duplicate records).
- Decimal price and stock validation (Pydantic 422 responses on negative inputs).
- SQLite database CHECK constraints (IntegrityError on invalid database insertions).
- Referential integrity and restricted deletion of products with historical inventory transactions.

---

## 6. Frontend Build Verification

To verify the production build of the React frontend:

```bash
cd frontend
npm run build
```

This validates TypeScript types (`tsc -b`) and generates production assets in `frontend/dist/`.

---

## 7. Next Steps for Phase 2

With the technical foundation in place, recommended milestones for Phase 2 are:
1. **Sales & Billing Workflow:** Fast counter checkout with itemized cart and automatic inventory stock deduction.
2. **Conversational AI Assistant:** Integrating natural language understanding for voice and chat queries ("Which items are low in stock?", "Record 2 packets of Maggi sold").
3. **Receipt Generation:** Thermal print formatting (58mm/80mm) and WhatsApp/UPI shareable receipts.
4. **Supplier Invoice Intake:** Parsing paper supplier invoices to automate bulk stock restocks.

