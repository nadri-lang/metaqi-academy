"""
Export a content/config snapshot of the live app through the HTTP API,
for use when direct mongodump access is blocked (e.g. Atlas IP allowlist).

NOT a full 1:1 database backup — see README note below and the caller's
own notes on what's excluded (password hashes, per-user favorites/course
progress, translation cache, sessions, raw visitor logs).

Usage:
    set BACKEND_URL=https://your-backend-host
    set ADMIN_EMAIL=admin@example.com
    set ADMIN_PASSWORD=...
    python export_via_api.py [output_dir]

Credentials are read from environment variables only - never pass them
as command-line arguments (they'd end up in shell history) and never
hardcode them in this file.
"""
import json
import os
import sys
from datetime import datetime, date
from pathlib import Path

import requests

BACKEND_URL = os.environ.get("BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

if not BACKEND_URL or not ADMIN_EMAIL or not ADMIN_PASSWORD:
    print("Missing BACKEND_URL / ADMIN_EMAIL / ADMIN_PASSWORD environment variables.")
    sys.exit(1)

API = f"{BACKEND_URL}/api"
session = requests.Session()
session.headers.update({"Content-Type": "application/json"})


def login():
    resp = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    resp.raise_for_status()
    token = resp.json()["access_token"]
    session.headers.update({"Authorization": f"Bearer {token}"})


def fetch(path, params=None, label=None):
    label = label or path
    try:
        resp = session.get(f"{API}{path}", params=params or {})
        resp.raise_for_status()
        data = resp.json()
        count = len(data) if isinstance(data, list) else 1
        print(f"  OK  {label} ({count} item{'s' if count != 1 else ''})")
        return data
    except requests.HTTPError as e:
        print(f"  SKIP {label}: HTTP {e.response.status_code}")
        return None
    except Exception as e:
        print(f"  SKIP {label}: {e}")
        return None


# (output key, path, params)
# Endpoints capped at 100-1000 results server-side (see .to_list(N) in
# server.py) - fine for this app's current data volume, but re-check if
# any collection is approaching that size before trusting this as complete.
ENDPOINTS = [
    ("categories", "/categories", {}),
    ("articles", "/articles", {"limit": 10000}),
    ("courses_published", "/courses", {"is_published": True}),
    ("courses_unpublished", "/courses", {"is_published": False}),
    ("pages", "/pages", {}),
    ("faq", "/faq", {}),
    ("concepts", "/concepts", {}),
    ("agendas", "/agendas", {}),
    ("settings", "/settings", {}),
    ("app_config", "/app-config", {}),
    ("bazi_service_config", "/bazi-service/config", {}),
    ("moon_energy", "/energy/moon", {}),
    ("year_energy", "/energy/year", {}),
    ("admin_users", "/admin/users", {}),
    ("admin_purchases", "/admin/purchases", {}),
    ("payments", "/payments", {}),
    ("service_requests", "/service-requests", {}),
    ("admin_bazi_reports", "/admin/bazi-reports", {}),
    ("admin_newborn_vocation", "/admin/newborn-vocation/all", {}),
    ("admin_analytics", "/admin/analytics", {}),
]


def main():
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(f"export_{datetime.now():%Y%m%d_%H%M%S}")
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Logging in as {ADMIN_EMAIL} at {BACKEND_URL} ...")
    login()
    print(f"Exporting to {out_dir}/\n")

    manifest = {"backend_url": BACKEND_URL, "exported_at": datetime.utcnow().isoformat(), "collections": {}}
    users = None

    for key, path, params in ENDPOINTS:
        data = fetch(path, params, label=key)
        if data is None:
            continue
        with open(out_dir / f"{key}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        manifest["collections"][key] = len(data) if isinstance(data, list) else 1
        if key == "admin_users":
            users = data

    # /admin/user-content has no bulk endpoint - it's per-user by email only,
    # so fetch it once per user found above.
    if users:
        print("  Fetching per-user content (/admin/user-content)...")
        user_content = {}
        for u in users:
            email = u.get("email")
            if not email:
                continue
            result = fetch("/admin/user-content", {"email": email}, label=f"user-content:{email}")
            if result and result.get("content"):
                user_content[email] = result["content"]
        if user_content:
            with open(out_dir / "admin_user_content_by_email.json", "w", encoding="utf-8") as f:
                json.dump(user_content, f, ensure_ascii=False, indent=2, default=str)
            manifest["collections"]["admin_user_content_by_email"] = sum(len(v) for v in user_content.values())

    with open(out_dir / "_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"\nDone. Wrote {len(manifest['collections'])} files to {out_dir}/")
    print("Note: this is a content/config snapshot, not a full DB backup -")
    print("password hashes, per-user favorites/course_progress, translation_cache,")
    print("user_sessions and raw visitor_logs are not included.")


if __name__ == "__main__":
    main()
