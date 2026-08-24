# RetailIQ AI: Smart Retail Recommendation & Customer Behavior Analysis System

**RetailIQ AI** is an enterprise-grade retail intelligence platform built with Python, FastAPI, PostgreSQL/SQLite, SQLAlchemy, scikit-learn ML pipelines, and React. It ingests transaction logs from the UCI Online Retail II dataset, computes RFM (Recency, Frequency, Monetary) behavioral vectors, categorizes customer segments via K-Means, predicts 30-day repurchase propensity via Logistic Regression, and serves personalized product recommendations via item-item collaborative filtering.

---

## 🏗 System Architecture

```
   UCI Online Retail II Dataset (ml/data/online_retail_II.xlsx)
                               │
                               ▼
               ML Ingestion & Cleaning Pipeline (ml.preprocessing.ingest)
                               │
                               ▼
                SQLAlchemy Database Models & Alembic Migrations
                     (customers, products, orders, etc.)
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
  RFM Feature Engine    K-Means Clustering   Collaborative Filtering
   (ml.features.rfm)   (ml.segmentation.train) (ml.recommendation.train)
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               ▼
               FastAPI Backend API (Port 8000)
             (JWT Auth, RBAC, Envelope Response)
                               │
                               ▼
               React Frontend (Vite, Port 3000)
          (Executive Dashboard, Customer Intelligence)
```

---

## 📁 Dataset Placement

Place the UCI Online Retail II dataset at the standardized path:
```
ml/data/online_retail_II.xlsx
```
*Note: Large dataset files (`*.xlsx`) and trained `.joblib` artifacts are excluded from Git repository commits via `.gitignore`.*

---

## 🚀 Setup & Execution Guide

### 1. Backend Environment Setup & Dependencies
```bash
# Navigate to backend directory
cd backend

# Install required Python packages
pip install -r requirements.txt
```

### 2. Database Migrations
```bash
# Run Alembic migrations to apply initial schema & tables
alembic upgrade head
```

### 3. Data Ingestion & Pipeline Execution
```bash
# From project root directory:

# 1. Ingest raw Excel dataset into database
python -m ml.preprocessing.ingest --file ml/data/online_retail_II.xlsx

# 2. Compute RFM customer feature vectors
python -m ml.features.rfm

# 3. Train K-Means Customer Segmentation model
python -m ml.segmentation.train

# 4. Train Purchase Prediction model (will_purchase_next_30_days)
python -m ml.prediction.train

# 5. Train Item-Item Collaborative Filtering Recommendation model
python -m ml.recommendation.train
```

### 4. Running Backend Tests
```bash
cd backend
pytest
```
*All 41 unit & integration tests pass cleanly.*

### 5. Running the Backend & Frontend Application

**Backend Server (FastAPI):**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend Application (React/Vite):**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔑 Default Seed Credentials

- **Admin User**: `admin@retail-ai.internal` / `password123` (Role: `ADMIN`)
- **Analyst User**: `analyst@retail-ai.internal` / `password123` (Role: `ANALYST`)
- **Viewer User**: `viewer@retail-ai.internal` / `password123` (Role: `VIEWER`)

---

## 📊 ML Model Specifications & Verified Performance

1. **Customer Segmentation (K-Means)**:
   - Optimal $K$: $2$
   - Silhouette Score: $0.4397$
   - Customer Segments: `High Value` (2,265 customers), `At Risk` (3,587 customers)

2. **Purchase Prediction (Logistic Regression)**:
   - Target: `will_purchase_next_30_days` (temporal cutoff modeling without future leakage)
   - Precision: $0.4220$
   - Recall: $0.7871$
   - F1 Score: $0.5494$
   - ROC-AUC: $0.7741$

3. **Product Recommendations (Item-Item Collaborative Filtering)**:
   - Similarity: Cosine similarity matrix with popularity fallback for cold-start customers
   - Precision@5: $0.0408$
   - Recall@5: $0.0085$
   - HitRate@5: $0.1520$
   - Catalog Coverage: $0.0541$

---

## 🔒 Security & RBAC Standard

- JWT Authentication with configurable `JWT_SECRET_KEY` and algorithm `HS256`.
- Role-Based Access Control enforced at FastAPI endpoint level (`ADMIN`, `ANALYST`, `VIEWER`).
- Envelope standard format: `{ "data": ..., "error": null }`.
