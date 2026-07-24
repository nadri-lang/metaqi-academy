#!/usr/bin/env python3
"""
Test Admin Daily Energy CRUD Operations - MetaQi Academy
Tests the upsert functionality for POST /api/energy/daily
"""

import requests
import json
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

# Base URL
BASE_URL = "https://feng-shui-learn.preview.emergentagent.com/api"

# Admin credentials
ADMIN_EMAIL = "nnikholk@gmail.com"
ADMIN_PASSWORD = "admin123"

# Test date
TEST_DATE = "2026-07-28"

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'metaqi_academy')

# Test results
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def print_header(title):
    """Print formatted header"""
    print(f"\n{'='*80}")
    print(f"{title}")
    print(f"{'='*80}")

def print_test(test_num, description):
    """Print test description"""
    print(f"\n[TEST {test_num}] {description}")
    print("-" * 80)

def print_result(success, message, details=None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"Details: {json.dumps(details, indent=2, default=str)}")
    
    if success:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1
    
    test_results["tests"].append({
        "success": success,
        "message": message,
        "details": details
    })

def test_1_admin_login():
    """Test 1: Admin Login to get token"""
    print_test(1, "Admin Login - Get JWT Token")
    
    try:
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user", {})
            
            if token and user.get("role") == "admin":
                print_result(True, "Admin login successful", {
                    "email": user.get("email"),
                    "role": user.get("role"),
                    "token_type": data.get("token_type"),
                    "token_preview": token[:20] + "..." if token else None
                })
                return token
            else:
                print_result(False, "Login succeeded but token or role missing", data)
                return None
        else:
            print_result(False, f"Login failed with status {response.status_code}", {
                "response": response.text
            })
            return None
            
    except Exception as e:
        print_result(False, f"Login error: {str(e)}")
        return None

def test_2_create_daily_energy(token):
    """Test 2: Create Daily Energy for Future Date"""
    print_test(2, f"Create Daily Energy for {TEST_DATE}")
    
    if not token:
        print_result(False, "No admin token available")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "date": TEST_DATE,
            "title": "Energía del Día - Prosperidad",
            "content": "Día favorable para nuevos comienzos y proyectos creativos.",
            "animal": "Dragón de Agua",
            "bazi_relationships": "Madera alimenta Fuego, armonía entre elementos.",
            "recommendations": ["Meditar al amanecer", "Usar colores dorados"],
            "avoid": ["Discusiones", "Decisiones apresuradas"],
            "feng_shui_sectors": ["Este: Prosperidad", "Sur: Fama"],
            "qimen_directions": ["Norte: Puerta Vida"],
            "favorable_hours": ["05:00-07:00: Energía Yang", "11:00-13:00: Máximo poder"]
        }
        
        response = requests.post(f"{BASE_URL}/energy/daily", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Daily energy created successfully", {
                "id": data.get("id"),
                "date": data.get("date"),
                "title": data.get("title"),
                "animal": data.get("animal"),
                "recommendations_count": len(data.get("recommendations", []))
            })
            return True
        else:
            print_result(False, f"Create failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Create error: {str(e)}")
        return False

def test_3_verify_created_energy():
    """Test 3: Verify Created Energy"""
    print_test(3, f"Verify Energy Exists for {TEST_DATE}")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/daily?date={TEST_DATE}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify the data matches what we created
            expected_title = "Energía del Día - Prosperidad"
            expected_animal = "Dragón de Agua"
            
            if data.get("title") == expected_title and data.get("animal") == expected_animal:
                print_result(True, "Energy data verified successfully", {
                    "date": data.get("date"),
                    "title": data.get("title"),
                    "animal": data.get("animal"),
                    "recommendations": data.get("recommendations", [])
                })
                return True
            else:
                print_result(False, "Energy data doesn't match expected values", {
                    "expected_title": expected_title,
                    "actual_title": data.get("title"),
                    "expected_animal": expected_animal,
                    "actual_animal": data.get("animal")
                })
                return False
        else:
            print_result(False, f"Get energy failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Verify error: {str(e)}")
        return False

def test_4_update_daily_energy(token):
    """Test 4: Update Existing Daily Energy (Same Date)"""
    print_test(4, f"Update Daily Energy for {TEST_DATE} (Test Upsert)")
    
    if not token:
        print_result(False, "No admin token available")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Updated payload with different values
        payload = {
            "date": TEST_DATE,
            "title": "Energía del Día - Prosperidad ACTUALIZADA",
            "content": "Contenido actualizado para el día.",
            "animal": "Tigre de Madera",
            "recommendations": ["Nueva recomendación"],
            "avoid": [],
            "feng_shui_sectors": [],
            "qimen_directions": [],
            "favorable_hours": []
        }
        
        response = requests.post(f"{BASE_URL}/energy/daily", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Daily energy updated successfully (upsert worked)", {
                "id": data.get("id"),
                "date": data.get("date"),
                "title": data.get("title"),
                "animal": data.get("animal")
            })
            return True
        else:
            print_result(False, f"Update failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Update error: {str(e)}")
        return False

def test_5_verify_update():
    """Test 5: Verify Update Worked"""
    print_test(5, f"Verify Update for {TEST_DATE}")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/daily?date={TEST_DATE}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify the data was updated
            expected_title = "Energía del Día - Prosperidad ACTUALIZADA"
            expected_animal = "Tigre de Madera"
            
            if data.get("title") == expected_title and data.get("animal") == expected_animal:
                print_result(True, "Update verified successfully", {
                    "date": data.get("date"),
                    "title": data.get("title"),
                    "animal": data.get("animal"),
                    "recommendations": data.get("recommendations", [])
                })
                return True
            else:
                print_result(False, "Update didn't work - data still shows old values", {
                    "expected_title": expected_title,
                    "actual_title": data.get("title"),
                    "expected_animal": expected_animal,
                    "actual_animal": data.get("animal")
                })
                return False
        else:
            print_result(False, f"Get energy failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Verify update error: {str(e)}")
        return False

def test_6_check_no_duplicates():
    """Test 6: Check MongoDB - No Duplicates"""
    print_test(6, f"Check MongoDB for Duplicates on {TEST_DATE}")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Query for documents with the test date
        documents = list(db.daily_energy.find({"date": TEST_DATE}))
        count = len(documents)
        
        if count == 1:
            doc = documents[0]
            print_result(True, f"No duplicates found - exactly 1 document for {TEST_DATE}", {
                "count": count,
                "document_id": str(doc.get("id")),
                "title": doc.get("title"),
                "animal": doc.get("animal")
            })
            return True
        elif count == 0:
            print_result(False, f"No documents found for {TEST_DATE}", {
                "count": count
            })
            return False
        else:
            print_result(False, f"DUPLICATE FOUND - {count} documents for {TEST_DATE}", {
                "count": count,
                "document_ids": [str(doc.get("id")) for doc in documents]
            })
            return False
            
    except Exception as e:
        print_result(False, f"MongoDB check error: {str(e)}")
        return False

def print_summary():
    """Print test summary"""
    print_header("TEST SUMMARY")
    total = test_results["passed"] + test_results["failed"]
    success_rate = (test_results["passed"] / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"Passed: {test_results['passed']} ✅")
    print(f"Failed: {test_results['failed']} ❌")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if test_results["failed"] > 0:
        print(f"\n{'='*80}")
        print("FAILED TESTS:")
        print(f"{'='*80}")
        for test in test_results["tests"]:
            if not test["success"]:
                print(f"  ❌ {test['message']}")
    
    print(f"\n{'='*80}")

def run_all_tests():
    """Run all tests in sequence"""
    print_header("ADMIN DAILY ENERGY CRUD TEST SUITE")
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print(f"Test Date: {TEST_DATE}")
    print(f"MongoDB: {DB_NAME}")
    
    # Run tests in sequence
    token = test_1_admin_login()
    
    if token:
        test_2_create_daily_energy(token)
        test_3_verify_created_energy()
        test_4_update_daily_energy(token)
        test_5_verify_update()
        test_6_check_no_duplicates()
    else:
        print("\n⚠️  Cannot continue tests without admin token")
    
    # Print summary
    print_summary()
    
    # Return exit code
    return 0 if test_results["failed"] == 0 else 1

if __name__ == "__main__":
    exit(run_all_tests())
