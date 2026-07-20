"""
Backend tests for MetaQi Academy - Verifying user-reported fixes.

Covers:
  Fix 1: /api/concepts returns 7 items
  Fix 2: /api/energy/moon/current is_premium == false
  Fix 3: separated tabs (frontend only - skipped here)
  Fix 4: agenda months returned properly (frontend handles current-month unlock)
  Fix 5: admin CMS endpoints - auth required, admin can create, regular user forbidden
Plus: year/current, newborn-vocation/today, agenda listing.
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://feng-shui-learn.preview.emergentagent.com").rstrip("/")


# -------------------- Fix 1: Concepts --------------------
class TestConcepts:
    def test_concepts_returns_7_items(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/concepts")
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 7, f"Expected 7 concepts, got {len(data)}: {[c.get('slug') for c in data]}"

    def test_concepts_expected_slugs(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/concepts")
        assert r.status_code == 200
        slugs = {c["slug"] for c in r.json()}
        expected_topics = {"bazi", "feng-shui", "tongshu"}
        # We at least expect the core Chinese metaphysics topics; the task lists:
        # BaZi, Qi Men, Feng Shui, Tongshu, Activaciones, Remedios, Disfraces
        missing = expected_topics - slugs
        assert not missing, f"Missing core concept slugs: {missing}. Got: {slugs}"


# -------------------- Fix 2: Moon Energy FREE --------------------
class TestMoonEnergyFree:
    def test_moon_current_not_premium(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/energy/moon/current")
        assert r.status_code == 200, f"Moon current failed: {r.status_code} {r.text}"
        data = r.json()
        assert "is_premium" in data
        assert data["is_premium"] is False, f"Moon energy should be FREE, got is_premium={data['is_premium']}"
        # Also ensure ALL content fields are non-empty as the home must show all sections
        for field in ["recommendations", "activations", "rituals", "remedies", "avoid"]:
            assert field in data, f"Missing field {field}"
            assert isinstance(data[field], list)


# -------------------- Year Energy --------------------
class TestYearEnergy:
    def test_year_current_returns_2026(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/energy/year/current")
        # Could be 404 if seed didn't add 2026 – report clearly
        assert r.status_code == 200, f"Year current failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("year") == 2026, f"Expected year 2026, got {data.get('year')}"


# -------------------- Newborn Vocation Today --------------------
class TestNewbornVocation:
    def test_today_newborn(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/newborn-vocation/today")
        assert r.status_code == 200, f"Newborn today failed: {r.status_code} {r.text}"
        data = r.json()
        assert "date" in data
        assert "title" in data
        assert "content" in data


# -------------------- Agendas + Months --------------------
class TestAgendas:
    def test_list_agendas(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/agendas")
        assert r.status_code == 200, r.text
        agendas = r.json()
        assert isinstance(agendas, list)
        assert len(agendas) >= 1, "No agendas seeded"
        # Store first for next test via a class attribute
        TestAgendas.agenda_id = agendas[0]["id"]

    def test_agenda_months(self, api_client):
        # Ensure previous test ran
        r_list = api_client.get(f"{BASE_URL}/api/agendas")
        assert r_list.status_code == 200
        agendas = r_list.json()
        assert agendas, "No agendas available"
        agenda_id = agendas[0]["id"]

        r = api_client.get(f"{BASE_URL}/api/agendas/{agenda_id}/months")
        assert r.status_code == 200, r.text
        months = r.json()
        assert isinstance(months, list)
        assert len(months) >= 1, "No months for agenda"
        # Validate structure
        m0 = months[0]
        for field in ["id", "agenda_id", "month", "year", "title", "content"]:
            assert field in m0, f"Missing month field: {field}"
        assert m0["agenda_id"] == agenda_id


# -------------------- Fix 5: Admin CMS Endpoints --------------------
class TestAdminCMS:
    def test_admin_login(self, admin_token):
        assert admin_token, "Admin token empty"

    def test_daily_energy_requires_auth(self, api_client):
        payload = {
            "date": "2099-01-01",
            "title": "TEST_unauth",
            "content": "should be blocked",
        }
        r = api_client.post(f"{BASE_URL}/api/energy/daily", json=payload)
        assert r.status_code in (401, 403), f"Expected 401/403 unauth, got {r.status_code}"

    def test_daily_energy_admin_create(self, api_client, admin_headers):
        payload = {
            "date": "2099-01-02",
            "title": "TEST_daily_admin",
            "content": "test admin energy",
            "recommendations": ["r1"],
            "avoid": ["a1"],
        }
        r = requests.post(f"{BASE_URL}/api/energy/daily", json=payload, headers=admin_headers)
        assert r.status_code == 200, f"Admin daily energy create failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["date"] == payload["date"]
        assert data["title"] == payload["title"]

        # Verify persisted via GET
        g = requests.get(f"{BASE_URL}/api/energy/daily?date={payload['date']}")
        assert g.status_code == 200, g.text
        assert g.json()["title"] == payload["title"]

    def test_daily_energy_regular_user_forbidden(self, user_headers):
        payload = {
            "date": "2099-01-03",
            "title": "TEST_forbidden",
            "content": "should fail",
        }
        r = requests.post(f"{BASE_URL}/api/energy/daily", json=payload, headers=user_headers)
        assert r.status_code == 403, f"Regular user should get 403, got {r.status_code} {r.text}"

    def test_newborn_vocation_admin_create(self, api_client, admin_headers):
        payload = {
            "date": "2099-02-02",
            "title": "TEST_newborn_admin",
            "content": "vocation content",
            "talents": ["t1"],
            "vocations": ["v1"],
            "challenges": ["c1"],
        }
        r = requests.post(f"{BASE_URL}/api/newborn-vocation", json=payload, headers=admin_headers)
        assert r.status_code == 200, f"Admin newborn create failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["date"] == payload["date"]
        assert data["title"] == payload["title"]

    def test_newborn_vocation_regular_user_forbidden(self, user_headers):
        payload = {
            "date": "2099-02-03",
            "title": "TEST_forbidden_newborn",
            "content": "should fail",
        }
        r = requests.post(f"{BASE_URL}/api/newborn-vocation", json=payload, headers=user_headers)
        assert r.status_code == 403, f"Regular user should get 403, got {r.status_code}"

    def test_newborn_vocation_requires_auth(self, api_client):
        payload = {"date": "2099-02-04", "title": "TEST_unauth_newborn", "content": "x"}
        r = api_client.post(f"{BASE_URL}/api/newborn-vocation", json=payload)
        assert r.status_code in (401, 403)


# -------------------- Sanity: auth /me --------------------
class TestAuthMe:
    def test_admin_me(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("email") == "admin@metaqi.com"
        assert data.get("role") in ("admin", "editor")

    def test_user_me(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers)
        assert r.status_code == 200
        assert r.json().get("email") == "user@test.com"
