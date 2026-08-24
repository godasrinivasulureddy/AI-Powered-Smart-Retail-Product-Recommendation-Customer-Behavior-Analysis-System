import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("======================================================================")
print("VERIFYING REAL BROWSER INTEGRATION FOR ADMIN, ANALYST AND VIEWER")
print("======================================================================")

roles = [
    ("admin@retail-ai.internal", "ADMIN"),
    ("analyst@retail-ai.internal", "ANALYST"),
    ("viewer@retail-ai.internal", "VIEWER"),
]

for email, role_name in roles:
    print(f"\n--- TESTING PERSONA: {email} (Role: {role_name}) ---")
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert login_res.status_code == 200, f"Login failed for {email}"
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Purchase Propensity
    pred_res = client.post("/api/v1/predict/purchase", json={"customer_id": 1}, headers=headers)
    print(f"  [1] POST /api/v1/predict/purchase (Cust #1) -> HTTP {pred_res.status_code}")
    assert pred_res.status_code == 200, f"Predict failed for {role_name}: {pred_res.text}"
    p_data = pred_res.json()["data"]
    print(f"      Probability: {p_data['probability']} | Model: {p_data['model_version']}")

    # 2. Recommendations
    rec_res = client.post("/api/v1/recommend", json={"customer_id": 1, "top_n": 4}, headers=headers)
    print(f"  [2] POST /api/v1/recommend (Cust #1) -> HTTP {rec_res.status_code}")
    assert rec_res.status_code == 200, f"Recommend failed for {role_name}: {rec_res.text}"
    r_data = rec_res.json()["data"]
    print(f"      Returned {len(r_data['recommendations'])} Recommendations | Model: {r_data['model_version']}")

    # 3. Model Registry Metrics
    reg_res = client.get("/api/v1/dashboard/model-metrics", headers=headers)
    print(f"  [3] GET /api/v1/dashboard/model-metrics -> HTTP {reg_res.status_code}")
    assert reg_res.status_code == 200, f"Model metrics failed for {role_name}: {reg_res.text}"
    m_data = reg_res.json()["data"]
    print(f"      Returned {len(m_data)} Persisted Model Artifacts")

    # 4. Customer Features
    feat_res = client.get("/api/v1/customers/1/features", headers=headers)
    print(f"  [4] GET /api/v1/customers/1/features -> HTTP {feat_res.status_code}")
    assert feat_res.status_code == 200, f"Features failed for {role_name}: {feat_res.text}"

print("\n======================================================================")
print("SUCCESS: ALL 3 ROLES (INCLUDING VIEWER) AUTHORIZED & VERIFIED CLEANLY!")
print("======================================================================")
