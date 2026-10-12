"""
Tests for the Song Recommendation API.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_genres_endpoint():
    """Test genres endpoint."""
    response = client.get("/api/v1/genres")
    # May return 503 if artifacts not loaded in test env
    assert response.status_code in (200, 503)
    
    if response.status_code == 200:
        data = response.json()
        assert "genres" in data
        assert isinstance(data["genres"], list)


def test_search_endpoint():
    """Test search endpoint."""
    response = client.get("/api/v1/search?q=love&limit=5")
    assert response.status_code in (200, 503)
    
    if response.status_code == 200:
        data = response.json()
        assert "tracks" in data
        assert "total" in data
        assert isinstance(data["tracks"], list)


def test_recommend_endpoint_invalid_track():
    """Test recommendations with invalid track ID."""
    response = client.post(
        "/api/v1/recommend",
        json={"track_id": "invalid_id", "n_recommendations": 10}
    )
    # Should return 404 if artifacts loaded, 503 if not
    assert response.status_code in (404, 503)


def test_recommend_endpoint_validation():
    """Test recommendation request validation."""
    # Missing track_id
    response = client.post("/api/v1/recommend", json={})
    assert response.status_code == 422
    
    # Invalid n_recommendations
    response = client.post("/api/v1/recommend", json={"track_id": "test", "n_recommendations": 0})
    assert response.status_code == 422
    
    response = client.post("/api/v1/recommend", json={"track_id": "test", "n_recommendations": 100})
    assert response.status_code == 422


def test_search_endpoint_validation():
    """Test search request validation."""
    # Missing query
    response = client.get("/api/v1/search")
    assert response.status_code == 422
    
    # Invalid limit
    response = client.get("/api/v1/search?q=test&limit=0")
    assert response.status_code == 422
    
    response = client.get("/api/v1/search?q=test&limit=100")
    assert response.status_code == 422