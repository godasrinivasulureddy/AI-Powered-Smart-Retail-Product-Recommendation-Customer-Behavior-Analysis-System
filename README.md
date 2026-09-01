# RetailIQ AI: Smart Retail Recommendation & Customer Behavior Analysis System

[![GitHub Repository](https://img.shields.io/badge/GitHub-retailiq--ai-blue.svg)](https://github.com/godasrinivasulureddy/retailiq-ai)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E.svg)](https://scikit-learn.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![Pytest](https://img.shields.io/badge/Tests-42%2F42%20Passing-brightgreen.svg)](https://docs.pytest.org/)

**RetailIQ AI** is an enterprise-grade retail intelligence platform built with Python, FastAPI, PostgreSQL/SQLite, SQLAlchemy, scikit-learn ML pipelines, and React. It ingests transaction logs from the UCI Online Retail II dataset (1,067,371 raw transaction rows), computes RFM (Recency, Frequency, Monetary) behavioral vectors, categorizes customer segments via K-Means clustering, predicts 30-day repurchase propensity via Logistic Regression, and serves personalized product recommendations via item-item collaborative filtering.

---

## 🌟 Key Platform Modules & Features

1. **Public Glassmorphic Landing Page**: Premium pre-login showcase featuring core capabilities, structured workflows, and quick login navigation.
2. **Executive Overview & KPI Telemetry**: Real-time gross revenue ($19.70M), valid order count (39,520), total profiled customers (5,852), and System Average Order Value ($498.52).
3. **Exploratory Data Analysis (EDA) Suite**:
   - **Monthly Revenue Trend (2009–2011)**: High-contrast SVG line/area chart with hover tooltips and dynamic tick spacing.
   - **Top Geographic Markets**: Revenue and customer buyer count breakdown across international markets.
   - **Top Products by Volume**: StockCode demand ranking by total units sold.
   - **Customer RFM Binned Distributions**: SQL-aggregated customer distributions across Recency, Frequency, and Monetary spend ranges.
4. **Customer Behavioral Profiling (RFM)**: Recency, Frequency, and Monetary vector extraction powering K-Means customer segmentation ($K=2$).
5. **30-Day Purchase Propensity Predictor**: Interactive simulator and real-time classifier evaluating customer repurchase likelihood.
6. **Item-Item Collaborative Filtering Engine**: Cosine similarity product recommendation engine with popular store fallback for cold-start visitors.
7. **Production Model Registry**: Active model versioning, training timestamps, and statistical evaluation metrics tracking.
8. **Interactive REST API Console**: Built-in API sandbox for testing live endpoints with masked passwords and protected JWT access tokens.
9. **One-Click Application Launcher**: Includes [`run_project.bat`](run_project.bat) to launch both backend and frontend servers simultaneously.

---

## 🏗 System Architecture

```text
   UCI Online Retail II Dataset (ml/data/online_retail_II.xlsx)
                              │
                              ▼
               ML Ingestion & Cleaning Pipeline (ml.preprocessing.ingest)
                              │
                              ▼
                PostgreSQL / SQLite Database Tables
     (customers: 5,852 | orders: 39,520 | products: 4,898)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  RFM Feature Engine   K-Means Clustering   Collaborative Filtering
   (ml.features.rfm)  (ml.segmentation.train) (ml.recommendation.train)
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
               FastAPI Backend API (Port 8000)
            (JWT Auth, RBAC, Envelope Standard)
                              │
                              ▼
               React Frontend (Vite, Port 3000)
          (Executive Dashboard, Customer Intelligence)
```

---

## 🚀 One-Click Quick Start (Windows)

Simply double-click [`run_project.bat`](run_project.bat) in the project root directory. It will automatically start:
- **Backend API**: `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
- **Frontend App**: `http://localhost:3000`

---

## 🛠 Manual Installation & Setup Guide

### 1. Dataset Placement
Place the raw UCI Online Retail II Excel dataset at:
```text
ml/data/online_retail_II.xlsx
```
*(Note: Large dataset files and `.joblib` model binaries are excluded from Git commits via `.gitignore`.)*

### 2. Backend Setup & Dependencies
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run Alembic database migrations
alembic upgrade head
```

### 3. Pipeline Execution
```bash
# From project root directory:

# 1. Ingest raw Excel dataset into database
python -m ml.preprocessing.ingest --file ml/data/online_retail_II.xlsx

# 2. Compute RFM customer feature vectors
python -m ml.features.rfm

# 3. Train K-Means Customer Segmentation model (K=2)
python -m ml.segmentation.train

# 4. Train Purchase Prediction model (will_purchase_next_30_days)
python -m ml.prediction.train

# 5. Train Item-Item Collaborative Filtering Recommendation model
python -m ml.recommendation.train
```

### 4. Running Tests
```bash
cd backend
pytest
```
*All 42 backend unit and integration tests pass cleanly.*

### 5. Launching Applications
```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 🔑 Default Seed Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@retail-ai.internal` | `password123` | Full system read/write access |
| **Analyst** | `analyst@retail-ai.internal` | `password123` | Analytics, predictions & recommendations |
| **Viewer** | `viewer@retail-ai.internal` | `password123` | Read-only dashboard telemetry |

---

## 📊 ML Model Specifications & Verified Metrics

| Model Task | Algorithm / Pipeline | Primary Metric | Performance Value | Notes / Segment Distribution |
|---|---|---|:---:|---|
| **Customer Segmentation** | K-Means Clustering ($K=2$) | Silhouette Score | **`0.4397`** | **High Value**: 2,266 customers ($38.72\%$) <br> **At Risk**: 3,586 customers ($61.28\%$) |
| **Purchase Propensity** | Logistic Regression Classifier | Test ROC-AUC <br> Test PR-AUC <br> Test F1-Score | **`0.7818`** <br> **`0.6126`** <br> **`0.5435`** | Target: `will_purchase_next_30_days` <br> Test Recall: $75.74\%$ |
| **Product Recommendation** | Item-Item Cosine Similarity CF | Hit Rate@5 <br> Precision@5 | **`15.20%`** <br> **`4.08%`** | Matrix: 4,600 Items $\times$ 5,691 Customers <br> Popularity fallback for cold-start |

---

## 🔒 Security & API Architecture

- **Authentication**: JWT Bearer Access & Refresh Tokens (`HS256`).
- **Authorization**: Role-Based Access Control (`ADMIN`, `ANALYST`, `VIEWER`).
- **Response Standard**: Envelope format `{ "data": ..., "error": null }`.
- **Security Sanitization**: Password masking (`••••••••••••`) and protected token outputs in the interactive API Console.
