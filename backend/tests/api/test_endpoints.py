def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_list_customers(api_client, viewer_token):
    r = api_client.get("/api/v1/customers?limit=5", headers=auth_header(viewer_token))
    assert r.status_code == 200
    body = r.json()
    assert body["error"] is None
    assert len(body["data"]) == 5
    assert "external_id" in body["data"][0]


def test_get_customer_not_found(api_client, viewer_token):
    r = api_client.get("/api/v1/customers/999999999", headers=auth_header(viewer_token))
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "CUSTOMER_NOT_FOUND"


def test_get_customer_features(api_client, viewer_token):
    r = api_client.get("/api/v1/customers/1/features", headers=auth_header(viewer_token))
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["customer_id"] == 1
    assert data["frequency"] >= 1


def test_get_customer_segment(api_client, viewer_token):
    r = api_client.get("/api/v1/customers/1/segment", headers=auth_header(viewer_token))
    assert r.status_code == 200
    assert r.json()["data"]["segment_label"] in ("High Value", "At Risk", "Loyal", "Occasional")


def test_predict_purchase(api_client, admin_token):
    r = api_client.post("/api/v1/predict/purchase", json={"customer_id": 1}, headers=auth_header(admin_token))
    assert r.status_code == 200
    data = r.json()["data"]
    assert 0.0 <= data["probability"] <= 1.0
    assert isinstance(data["prediction"], bool)
    assert "model_version" in data
    assert "confidence" not in data  # spec rule: never call it "confidence"


def test_predict_viewer_allowed(api_client, viewer_token):
    r = api_client.post("/api/v1/predict/purchase", json={"customer_id": 1}, headers=auth_header(viewer_token))
    assert r.status_code == 200


def test_predict_unknown_customer_features_missing(api_client, admin_token):
    r = api_client.post("/api/v1/predict/purchase", json={"customer_id": 999999999}, headers=auth_header(admin_token))
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "FEATURES_NOT_FOUND"


def test_recommend(api_client, admin_token):
    r = api_client.post("/api/v1/recommend", json={"customer_id": 1, "top_n": 3}, headers=auth_header(admin_token))
    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data["recommendations"]) == 3
    for rec in data["recommendations"]:
        assert rec["reason"]  # every recommendation must have a grounded reason
        assert rec["product_id"] != 0


def test_recommend_viewer_allowed(api_client, viewer_token):
    r = api_client.post("/api/v1/recommend", json={"customer_id": 1, "top_n": 3}, headers=auth_header(viewer_token))
    assert r.status_code == 200


def test_dashboard_executive(api_client, viewer_token):
    r = api_client.get("/api/v1/dashboard/executive", headers=auth_header(viewer_token))
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["total_customers"] > 0
    assert data["total_orders"] > 0
    assert data["total_revenue"] > 0


def test_dashboard_segments(api_client, viewer_token):
    r = api_client.get("/api/v1/dashboard/segments", headers=auth_header(viewer_token))
    assert r.status_code == 200
    assert len(r.json()["data"]) >= 1


def test_dashboard_products(api_client, viewer_token):
    r = api_client.get("/api/v1/dashboard/products", headers=auth_header(viewer_token))
    assert r.status_code == 200
    assert len(r.json()["data"]) > 0


def test_dashboard_model_metrics_allowed(api_client, viewer_token, admin_token):
    r = api_client.get("/api/v1/dashboard/model-metrics", headers=auth_header(viewer_token))
    assert r.status_code == 200

    r = api_client.get("/api/v1/dashboard/model-metrics", headers=auth_header(admin_token))
    assert r.status_code == 200
    names = {m["model_name"] for m in r.json()["data"]}
    assert {"customer_segmentation", "purchase_prediction", "recommendation"}.issubset(names)


def test_eda_analytics_endpoints(api_client, viewer_token):
    r_sales = api_client.get("/api/v1/dashboard/analytics/monthly-sales", headers=auth_header(viewer_token))
    assert r_sales.status_code == 200
    assert len(r_sales.json()["data"]) > 0

    r_countries = api_client.get("/api/v1/dashboard/analytics/countries", headers=auth_header(viewer_token))
    assert r_countries.status_code == 200
    assert len(r_countries.json()["data"]) > 0

    r_rfm = api_client.get("/api/v1/dashboard/analytics/rfm-stats", headers=auth_header(viewer_token))
    assert r_rfm.status_code == 200
    assert "avg_recency" in r_rfm.json()["data"]


def test_unauthenticated_requests_rejected(api_client):
    r = api_client.get("/api/v1/dashboard/executive")
    assert r.status_code == 401

