# CivicFix --- AI-Powered Civic Infrastructure Reporting & Resolution Platform

CivicFix is a production-style, end-to-end civic infrastructure reporting and resolution platform. It allows citizens to photograph infrastructure issues (potholes, garbage accumulation, broken streetlights, water leakage, damaged roads, fallen trees, damaged public infrastructure) and provides automated AI detection, severity estimation, FAISS vector visual duplicate search, PostGIS geographic filtering, a deterministic 0–100 priority scoring engine, interactive OpenStreetMap/Leaflet map dispatching, and AI-assisted before/after repair photo resolution verification.

---

## 🏛️ Key Features

1. **Multi-Stage AI Computer Vision Pipeline**:
   - **OpenCV**: Image validation, resolution, blur & brightness quality metrics, and visual difference calculation.
   - **PyTorch & YOLO Adapter**: Civic problem object detection & bounding box predictions.
   - **Hugging Face Transformers**: Supporting visual classification.
   - **CLIP Visual Embeddings**: Generates normalized 512-dim visual embeddings for report & repair images.
   - **FAISS Vector Index**: Local vector store for instant visual duplicate retrieval.
2. **PostGIS / Spatial Geographic Duplicate Filter**: Combines FAISS visual similarity + Haversine/PostGIS spatial distance to suggest existing reports for citizens to support instead of duplicating.
3. **Deterministic 0–100 Priority Engine**:
   - Severity Score (0–40)
   - Community Support Count (0–20)
   - Proximity to Important Places (Schools, Hospitals, Transit, Intersections) (0–15)
   - Safety Impact (0–15)
   - Time Unresolved (0–10)
4. **Interactive Leaflet / OpenStreetMap Dispatch Map**: Custom priority markers, radius filters, category filters, and popup support actions.
5. **Authority Dispatch & AI Repair Resolution Verification**: Authority inspectors assign work orders to departments, upload after-repair photos, and run AI verification (OpenCV structural diff + CLIP visual similarity + YOLO problem clearance).
6. **Complete Audit History Timeline**: Tracks every status transition (`REPORTED`, `AI_ANALYZING`, `PENDING_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `RESOLUTION_SUBMITTED`, `AI_VERIFYING`, `RESOLVED`, `REJECTED`, `DUPLICATE`, `REOPENED`).

---

## 🔑 Demo Credentials

For quick evaluation, click the **Demo Login** buttons on the sign-in page or use:

| Role | Email | Password |
|---|---|---|
| **Authority Admin** | `admin@civicfix.gov` | `admin123` |
| **Field Authority** | `authority@civicfix.gov` | `admin123` |
| **Citizen Account** | `citizen@civicfix.com` | `citizen123` |

---

## 🚀 Quick Setup & Run Instructions

### Method 1: Running Locally with Python & Vite (Recommended)

#### 1. Backend Setup:
```bash
cd backend
python -m pip install -r requirements.txt

# Seed Database with demo accounts, issues, images & important places
python -m app.db.seed

# Run Pytest unit tests
python -m pytest tests/

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- Interactive API Swagger Docs: `http://localhost:8000/docs`

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
- Open Web Application: `http://localhost:5173`

---

### Method 2: Running via Docker Compose

```bash
# Spin up PostgreSQL + PostGIS, Backend, and Frontend containers
docker-compose up --build
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet, React-Leaflet, Lucide React Icons, Axios.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, SQLite / PostgreSQL + PostGIS, Pytest.
- **AI/ML**: PyTorch, OpenCV, Hugging Face Transformers, CLIP, FAISS Vector Database, NumPy, Pillow.

---

## 📚 API Endpoints Summary

- **Auth**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- **Citizen**: `POST /api/v1/issues`, `GET /api/v1/issues/mine`, `GET /api/v1/issues/nearby`, `GET /api/v1/issues/{id}`, `POST /api/v1/issues/{id}/support`, `GET /api/v1/issues/{id}/history`
- **Authority**: `GET /api/v1/admin/issues`, `PATCH /api/v1/admin/issues/{id}/status`, `POST /api/v1/admin/issues/{id}/assign`, `POST /api/v1/admin/issues/{id}/merge`, `POST /api/v1/admin/issues/{id}/resolution-photo`, `POST /api/v1/admin/issues/{id}/verify-resolution`
- **Analytics**: `GET /api/v1/admin/dashboard`, `GET /api/v1/admin/analytics/categories`, `GET /api/v1/admin/analytics/status`, `GET /api/v1/admin/analytics/priority`

---

## ⚖️ Known Limitations & Future Roadmap
- Local FAISS vector index runs in CPU single-process mode; for multi-node deployments, Milvus or Pgvector can be plugged in via the vector store adapter interface.
- Commercial cloud object storage (AWS S3 / GCP Storage) can replace local `uploads/` directory via the storage service abstraction.
# CivicInfrastructure
