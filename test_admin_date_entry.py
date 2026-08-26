"""
Regression tests for ticket #235632 -- "no me deja introducir informacion ...
para el 29 de agosto".

The admin date fields are free text. Two failure modes made scheduled content
vanish:
  1. a date that is not a real calendar day was accepted and stored, so the
     entry could never be found again;
  2. saving a *new* entry onto a date that already had content replaced it
     silently and reported success.

Usage:
  ADMIN_EMAIL=... ADMIN_PASSWORD=... python test_admin_date_entry.py
"""
import os
import sys

import requests

BASE = os.environ.get("BACKEND_URL", "http://localhost:8001") + "/api"
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
VOCATION = BASE + "/admin/newborn-vocation"

failures = []


def check(name, ok, detail=""):
    print(("  PASS  " if ok else "  FAIL  ") + name + ("" if ok or not detail else " :: " + str(detail)))
    if not ok:
        failures.append(name)


def login():
    r = requests.post(BASE + "/auth/login", timeout=30,
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    r.raise_for_status()
    return {"Authorization": "Bearer " + r.json()["access_token"]}


def body(date, title):
    return {"date": date, "title": title, "content": "contenido de prueba",
            "talents": ["t"], "vocations": ["v"], "challenges": ["c"]}


def main():
    h = login()
    # Far-future dates so the suite can never collide with real content.
    probe, other = "2099-08-29", "2099-08-20"
    requests.delete(VOCATION + "/" + probe, headers=h, timeout=30)
    requests.delete(VOCATION + "/" + other, headers=h, timeout=30)

    try:
        print("\n[1] malformed / impossible dates are refused")
        for bad in ["2099-08-9", "2099--08-2", "2099-02-31", "2099-13-01", "29-08-2099", ""]:
            r = requests.post(VOCATION, json=body(bad, "x"), headers=h, timeout=30)
            check("rejects " + repr(bad), r.status_code == 422, r.status_code)

        print("\n[2] a far-future date is accepted and readable back")
        r = requests.post(VOCATION, json=body(probe, "Vocacion 29"), headers=h,
                          params={"intent": "create"}, timeout=30)
        check("create " + probe + " succeeds", r.status_code == 200, r.text[:200])
        allv = requests.get(VOCATION + "/all", headers=h, timeout=30).json()
        found = [v for v in allv if v["date"] == probe]
        check(probe + " appears in the admin list", len(found) == 1)
        check("stored title is intact", found and found[0]["title"] == "Vocacion 29")

        print("\n[3] a create that would land on an occupied date is refused, not silently applied")
        r = requests.post(VOCATION, json=body(probe, "SOBRESCRITO"), headers=h,
                          params={"intent": "create"}, timeout=30)
        check("second create on same date -> 409", r.status_code == 409, r.status_code)
        after = [v for v in requests.get(VOCATION + "/all", headers=h, timeout=30).json()
                 if v["date"] == probe]
        check("original content survived the refused write",
              after and after[0]["title"] == "Vocacion 29",
              after[0]["title"] if after else "missing")

        print("\n[4] an explicit update still overwrites")
        r = requests.post(VOCATION, json=body(probe, "Actualizado"), headers=h,
                          params={"intent": "update"}, timeout=30)
        check("update succeeds", r.status_code == 200, r.status_code)
        after = [v for v in requests.get(VOCATION + "/all", headers=h, timeout=30).json()
                 if v["date"] == probe]
        check("update applied", after and after[0]["title"] == "Actualizado")

        print("\n[5] callers that send no intent keep the old upsert behaviour")
        # Installed mobile builds predate the intent parameter; they must not break.
        r = requests.post(VOCATION, json=body(probe, "Legacy"), headers=h, timeout=30)
        check("legacy upsert succeeds", r.status_code == 200, r.status_code)
        after = [v for v in requests.get(VOCATION + "/all", headers=h, timeout=30).json()
                 if v["date"] == probe]
        check("legacy upsert applied", after and after[0]["title"] == "Legacy")

        print("\n[6] the refused create did not leak onto a neighbouring date")
        neighbours = [v for v in requests.get(VOCATION + "/all", headers=h, timeout=30).json()
                      if v["date"] == other]
        check(other + " was never written", len(neighbours) == 0)

    finally:
        requests.delete(VOCATION + "/" + probe, headers=h, timeout=30)
        requests.delete(VOCATION + "/" + other, headers=h, timeout=30)

    print("\n" + ("ALL PASSED" if not failures else "FAILED: " + ", ".join(failures)))
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
