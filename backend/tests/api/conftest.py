"""
API integration tests run against the REAL Postgres instance (already
ingested + trained in this environment) rather than an empty SQLite DB,
because predict/recommend load real persisted model artifacts from
model_registry and would otherwise have nothing to load.
"""
import os
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/smart_retail_ai"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def api_client():
    return TestClient(app)


@pytest.fixture(scope="module")
def admin_token(api_client):
    api_client.post("/api/v1/auth/register", json={
        "email": "pytest_admin@test.com", "password": "password123", "role": "ADMIN"
    })
    r = api_client.post("/api/v1/auth/login", json={"email": "pytest_admin@test.com", "password": "password123"})
    return r.json()["data"]["access_token"]


@pytest.fixture(scope="module")
def viewer_token(api_client):
    api_client.post("/api/v1/auth/register", json={
        "email": "pytest_viewer@test.com", "password": "password123", "role": "VIEWER"
    })
    r = api_client.post("/api/v1/auth/login", json={"email": "pytest_viewer@test.com", "password": "password123"})
    return r.json()["data"]["access_token"]
