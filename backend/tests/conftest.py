import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://feng-shui-learn.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def admin_token(api_client):
    """Login as admin and return JWT."""
    r = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@metaqi.com", "password": "admin123"},
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data or "token" in data, f"No token in response: {data}"
    return data.get("access_token") or data.get("token")


@pytest.fixture(scope="session")
def user_token(api_client):
    """Login as regular test user."""
    r = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "user@test.com", "password": "user123"},
    )
    if r.status_code != 200:
        pytest.skip(f"User login failed: {r.status_code} {r.text}")
    data = r.json()
    return data.get("access_token") or data.get("token")


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}", "Content-Type": "application/json"}
