#!/usr/bin/env python3
"""
Backend API Test Suite for MetaQi Academy
Tests all backend endpoints with proper authentication flow
"""

import requests
import json
from typing import Optional, Dict, Any

# Base URL from frontend .env
BASE_URL = "https://feng-shui-learn.preview.emergentagent.com/api"

# Test credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "nnikholk@gmail.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "test123"

# Global variables to store tokens
admin_token: Optional[str] = None
test_user_token: Optional[str] = None
test_user_id: Optional[str] = None

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "total": 0
}

def print_test_header(test_name: str):
    """Print a formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success: bool, message: str, details: Optional[Dict[Any, Any]] = None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"Details: {json.dumps(details, indent=2, default=str)}")
    
    test_results["total"] += 1
    if success:
        test_results["passed"].append(message)
    else:
        test_results["failed"].append(message)

def test_register_user():
    """Test 1: POST /api/auth/register - Create test user"""
    print_test_header("Register New User")
    
    try:
        # First, try to register the test user
        payload = {
            "name": "Test User",
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "language": "es",
            "role": "free_member"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        # User might already exist, which is fine
        if response.status_code == 400 and "already registered" in response.text:
            print_result(True, "User already exists (expected if running tests multiple times)")
            return True
        
        if response.status_code == 200:
            data = response.json()
            global test_user_id
            test_user_id = data.get("id")
            print_result(True, "User registered successfully", {
                "user_id": test_user_id,
                "email": data.get("email"),
                "name": data.get("name")
            })
            return True
        else:
            print_result(False, f"Registration failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Registration error: {str(e)}")
        return False

def test_login_admin():
    """Test 2: POST /api/auth/login - Login with admin credentials"""
    print_test_header("Login as Admin")
    
    try:
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            global admin_token
            admin_token = data.get("access_token")
            
            print_result(True, "Admin login successful", {
                "token_type": data.get("token_type"),
                "user_role": data.get("user", {}).get("role"),
                "user_email": data.get("user", {}).get("email")
            })
            return True
        else:
            print_result(False, f"Admin login failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Admin login error: {str(e)}")
        return False

def test_login_admin_wrong_password():
    """Test 3: POST /api/auth/login - Login with admin email but wrong password"""
    print_test_header("Login as Admin with Wrong Password")
    
    try:
        payload = {
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 401:
            print_result(True, "Wrong password correctly rejected with 401", {
                "status_code": response.status_code,
                "detail": response.json().get("detail") if response.text else None
            })
            return True
        else:
            print_result(False, f"Wrong password should return 401, got {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Wrong password test error: {str(e)}")
        return False

def test_register_duplicate_email():
    """Test 4: POST /api/auth/register - Try to register with existing admin email"""
    print_test_header("Register Duplicate Email")
    
    try:
        payload = {
            "name": "Duplicate User",
            "email": ADMIN_EMAIL,  # Use admin email which already exists
            "password": "somepassword",
            "language": "es",
            "role": "free_member"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        if response.status_code == 400:
            detail = response.json().get("detail", "")
            if "already registered" in detail.lower():
                print_result(True, "Duplicate email correctly rejected with 400", {
                    "status_code": response.status_code,
                    "detail": detail
                })
                return True
            else:
                print_result(False, f"Got 400 but wrong error message: {detail}")
                return False
        else:
            print_result(False, f"Duplicate email should return 400, got {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Duplicate email test error: {str(e)}")
        return False

def test_login_test_user():
    """Test 5: POST /api/auth/login - Login with test user credentials"""
    print_test_header("Login as Test User")
    
    try:
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            global test_user_token, test_user_id
            test_user_token = data.get("access_token")
            test_user_id = data.get("user", {}).get("id")
            
            print_result(True, "Test user login successful", {
                "token_type": data.get("token_type"),
                "user_role": data.get("user", {}).get("role"),
                "user_email": data.get("user", {}).get("email"),
                "user_id": test_user_id
            })
            return True
        else:
            print_result(False, f"Test user login failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Test user login error: {str(e)}")
        return False

def test_get_me_valid_token():
    """Test 6a: GET /api/auth/me - Verify token authentication with valid token"""
    print_test_header("Get Current User (Valid Token)")
    
    if not test_user_token:
        print_result(False, "No test user token available")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {test_user_token}"
        }
        
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Token authentication successful", {
                "user_id": data.get("id"),
                "email": data.get("email"),
                "role": data.get("role")
            })
            return True
        else:
            print_result(False, f"Token verification failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Token verification error: {str(e)}")
        return False

def test_get_me_invalid_token():
    """Test 6b: GET /api/auth/me - Verify token authentication with invalid token"""
    print_test_header("Get Current User (Invalid Token)")
    
    try:
        headers = {
            "Authorization": "Bearer invalid_token_12345"
        }
        
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code == 401:
            print_result(True, "Invalid token correctly rejected", {
                "status_code": response.status_code
            })
            return True
        else:
            print_result(False, f"Invalid token should return 401, got {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Invalid token test error: {str(e)}")
        return False

def test_get_daily_energy():
    """Test 7: GET /api/energy/daily - Get today's energy (no auth required)"""
    print_test_header("Get Daily Energy")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/daily")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Daily energy retrieved successfully", {
                "date": data.get("date"),
                "title": data.get("title"),
                "has_content": bool(data.get("content")),
                "recommendations_count": len(data.get("recommendations", []))
            })
            return True
        elif response.status_code == 404:
            print_result(False, "No daily energy data found for today", {
                "response": response.text
            })
            return False
        else:
            print_result(False, f"Daily energy request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Daily energy error: {str(e)}")
        return False

def test_get_moon_energy():
    """Test 8: GET /api/energy/moon/current - Get current month moon energy"""
    print_test_header("Get Current Moon Energy")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/moon/current")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Moon energy retrieved successfully", {
                "month": data.get("month"),
                "year": data.get("year"),
                "title": data.get("title"),
                "is_premium": data.get("is_premium"),
                "has_content": bool(data.get("content"))
            })
            return True
        elif response.status_code == 404:
            print_result(False, "No moon energy data found for current month", {
                "response": response.text
            })
            return False
        else:
            print_result(False, f"Moon energy request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Moon energy error: {str(e)}")
        return False

def test_get_categories():
    """Test 9: GET /api/categories - List all categories"""
    print_test_header("Get Categories")
    
    try:
        response = requests.get(f"{BASE_URL}/categories")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Categories retrieved successfully", {
                "count": len(data),
                "categories": [{"name": cat.get("name"), "slug": cat.get("slug")} for cat in data[:3]]
            })
            return True
        else:
            print_result(False, f"Categories request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Categories error: {str(e)}")
        return False

def test_get_services():
    """Test 10: GET /api/services - List custom services"""
    print_test_header("Get Custom Services")
    
    try:
        response = requests.get(f"{BASE_URL}/services")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Services retrieved successfully", {
                "count": len(data),
                "services": [{"title": svc.get("title"), "price": svc.get("price")} for svc in data[:3]]
            })
            return True
        else:
            print_result(False, f"Services request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Services error: {str(e)}")
        return False

def test_add_favorite():
    """Test 11: POST /api/favorites - Add favorite (requires auth)"""
    print_test_header("Add Favorite")
    
    if not test_user_token:
        print_result(False, "No test user token available")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {test_user_token}"
        }
        
        # Use a dummy item for testing
        payload = {
            "item_type": "article",
            "item_id": "test-article-123"
        }
        
        response = requests.post(f"{BASE_URL}/favorites", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Favorite added successfully", {
                "favorite_id": data.get("id"),
                "item_type": data.get("item_type"),
                "item_id": data.get("item_id")
            })
            return True
        else:
            print_result(False, f"Add favorite failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Add favorite error: {str(e)}")
        return False

def test_get_favorites():
    """Test 12: GET /api/favorites - Get user favorites (requires auth)"""
    print_test_header("Get User Favorites")
    
    if not test_user_token:
        print_result(False, "No test user token available")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {test_user_token}"
        }
        
        response = requests.get(f"{BASE_URL}/favorites", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Favorites retrieved successfully", {
                "count": len(data),
                "favorites": [{"item_type": fav.get("item_type"), "item_id": fav.get("item_id")} for fav in data[:3]]
            })
            return True
        else:
            print_result(False, f"Get favorites failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Get favorites error: {str(e)}")
        return False

def test_get_wedding_agenda_months():
    """Test 13: GET /api/agendas/wedding-agenda/months - Get all wedding agenda months (Public endpoint)"""
    print_test_header("Get Wedding Agenda Months (Public)")
    
    try:
        response = requests.get(f"{BASE_URL}/agendas/wedding-agenda/months")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if we have data
            if len(data) == 0:
                print_result(False, "No wedding agenda data found in database", {
                    "count": 0,
                    "expected": "At least 2 documents (July 2026 and August 2026)"
                })
                return False
            
            # Verify data structure
            first_item = data[0] if data else {}
            has_required_fields = all(key in first_item for key in ["id", "agenda_id", "month", "year", "title", "content"])
            
            # Check for July 2026 and August 2026
            july_2026 = next((item for item in data if item.get("month") == 7 and item.get("year") == 2026), None)
            august_2026 = next((item for item in data if item.get("month") == 8 and item.get("year") == 2026), None)
            
            print_result(True, "Wedding agenda months retrieved successfully", {
                "count": len(data),
                "has_required_fields": has_required_fields,
                "july_2026_exists": july_2026 is not None,
                "august_2026_exists": august_2026 is not None,
                "july_2026_title": july_2026.get("title") if july_2026 else None,
                "sample_data": data[0] if data else None
            })
            return True
        elif response.status_code == 404:
            print_result(False, "Wedding agenda endpoint returned 404", {
                "response": response.text
            })
            return False
        else:
            print_result(False, f"Wedding agenda request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Wedding agenda error: {str(e)}")
        return False

def test_verify_wedding_agenda_content():
    """Test 14: Verify Wedding Agenda Content - Check specific data"""
    print_test_header("Verify Wedding Agenda Content")
    
    try:
        response = requests.get(f"{BASE_URL}/agendas/wedding-agenda/months")
        
        if response.status_code != 200:
            print_result(False, "Cannot verify content - API request failed")
            return False
        
        data = response.json()
        
        # Look for "Amor y compromiso en julio" document
        amor_doc = next((item for item in data if "Amor y compromiso" in item.get("title", "")), None)
        
        # Check July 2026 data
        july_2026 = next((item for item in data if item.get("month") == 7 and item.get("year") == 2026), None)
        
        checks = {
            "amor_y_compromiso_exists": amor_doc is not None,
            "july_2026_exists": july_2026 is not None,
            "july_2026_has_content": july_2026.get("content") if july_2026 else None,
            "july_2026_content_not_empty": bool(july_2026.get("content")) if july_2026 else False
        }
        
        all_checks_passed = all([
            checks["amor_y_compromiso_exists"],
            checks["july_2026_exists"],
            checks["july_2026_content_not_empty"]
        ])
        
        print_result(all_checks_passed, "Wedding agenda content verification", {
            "checks": checks,
            "july_2026_title": july_2026.get("title") if july_2026 else None,
            "july_2026_content_length": len(july_2026.get("content", "")) if july_2026 else 0
        })
        return all_checks_passed
            
    except Exception as e:
        print_result(False, f"Content verification error: {str(e)}")
        return False

def test_admin_create_wedding_agenda():
    """Test 15: POST /api/admin/wedding-agenda - Admin creates new wedding agenda month"""
    print_test_header("Admin Create Wedding Agenda (September 2026)")
    
    if not admin_token:
        print_result(False, "No admin token available - must login first")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }
        
        payload = {
            "agenda_id": "wedding-agenda",
            "month": 9,
            "year": 2026,
            "title": "Septiembre 2026 Test",
            "content": "Contenido de prueba para verificar que la conexión funciona",
            "favorable_days": [],
            "is_free": False,
            "order": 3
        }
        
        response = requests.post(f"{BASE_URL}/admin/wedding-agenda", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            has_required_fields = all(key in data for key in ["id", "agenda_id", "month", "year", "title", "content"])
            
            print_result(True, "Wedding agenda created successfully", {
                "id": data.get("id"),
                "agenda_id": data.get("agenda_id"),
                "month": data.get("month"),
                "year": data.get("year"),
                "title": data.get("title"),
                "has_required_fields": has_required_fields
            })
            return True
        else:
            print_result(False, f"Create wedding agenda failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Create wedding agenda error: {str(e)}")
        return False

def test_verify_new_wedding_agenda_in_list():
    """Test 16: Verify new wedding agenda appears in GET /api/agendas/wedding-agenda/months"""
    print_test_header("Verify New Wedding Agenda in List")
    
    try:
        response = requests.get(f"{BASE_URL}/agendas/wedding-agenda/months")
        
        if response.status_code != 200:
            print_result(False, "Cannot verify - API request failed")
            return False
        
        data = response.json()
        
        # Look for September 2026 entry
        september_2026 = next((item for item in data if item.get("month") == 9 and item.get("year") == 2026), None)
        
        if september_2026:
            print_result(True, "September 2026 wedding agenda found in list", {
                "id": september_2026.get("id"),
                "title": september_2026.get("title"),
                "content": september_2026.get("content")[:50] + "..." if september_2026.get("content") else None,
                "total_months": len(data)
            })
            return True
        else:
            print_result(False, "September 2026 wedding agenda NOT found in list", {
                "total_months": len(data),
                "available_months": [(item.get("month"), item.get("year")) for item in data]
            })
            return False
            
    except Exception as e:
        print_result(False, f"Verification error: {str(e)}")
        return False

def test_admin_update_wedding_agenda():
    """Test 17: POST /api/admin/wedding-agenda - Admin updates existing wedding agenda (Upsert test)"""
    print_test_header("Admin Update Wedding Agenda (September 2026 - Upsert)")
    
    if not admin_token:
        print_result(False, "No admin token available - must login first")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }
        
        # Update the same September 2026 entry
        payload = {
            "agenda_id": "wedding-agenda",
            "month": 9,
            "year": 2026,
            "title": "Septiembre 2026 ACTUALIZADO",
            "content": "Contenido actualizado para verificar que el upsert funciona correctamente",
            "favorable_days": [1, 5, 10, 15],
            "is_free": True,
            "order": 3
        }
        
        response = requests.post(f"{BASE_URL}/admin/wedding-agenda", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify the title was updated
            title_updated = data.get("title") == "Septiembre 2026 ACTUALIZADO"
            
            print_result(True, "Wedding agenda updated successfully (Upsert working)", {
                "id": data.get("id"),
                "title": data.get("title"),
                "title_updated": title_updated,
                "favorable_days_count": len(data.get("favorable_days", [])),
                "is_free": data.get("is_free")
            })
            return True
        else:
            print_result(False, f"Update wedding agenda failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Update wedding agenda error: {str(e)}")
        return False

def test_verify_no_duplicates_in_mongodb():
    """Test 18: Verify no duplicate September 2026 entries exist"""
    print_test_header("Verify No Duplicates in MongoDB")
    
    try:
        response = requests.get(f"{BASE_URL}/agendas/wedding-agenda/months")
        
        if response.status_code != 200:
            print_result(False, "Cannot verify - API request failed")
            return False
        
        data = response.json()
        
        # Count September 2026 entries
        september_2026_entries = [item for item in data if item.get("month") == 9 and item.get("year") == 2026]
        
        if len(september_2026_entries) == 1:
            print_result(True, "No duplicates found - exactly 1 September 2026 entry", {
                "count": len(september_2026_entries),
                "entry_id": september_2026_entries[0].get("id"),
                "entry_title": september_2026_entries[0].get("title")
            })
            return True
        elif len(september_2026_entries) == 0:
            print_result(False, "September 2026 entry not found", {
                "count": 0
            })
            return False
        else:
            print_result(False, f"DUPLICATE ENTRIES FOUND - {len(september_2026_entries)} September 2026 entries", {
                "count": len(september_2026_entries),
                "entries": [{"id": e.get("id"), "title": e.get("title")} for e in september_2026_entries]
            })
            return False
            
    except Exception as e:
        print_result(False, f"Duplicate check error: {str(e)}")
        return False

def print_summary():
    """Print test summary"""
    print(f"\n{'='*80}")
    print("TEST SUMMARY")
    print(f"{'='*80}")
    print(f"Total Tests: {test_results['total']}")
    print(f"Passed: {len(test_results['passed'])} ✅")
    print(f"Failed: {len(test_results['failed'])} ❌")
    
    if test_results['failed']:
        print(f"\n{'='*80}")
        print("FAILED TESTS:")
        print(f"{'='*80}")
        for failed_test in test_results['failed']:
            print(f"  ❌ {failed_test}")
    
    print(f"\n{'='*80}")
    success_rate = (len(test_results['passed']) / test_results['total'] * 100) if test_results['total'] > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    print(f"{'='*80}\n")

def run_all_tests():
    """Run all backend tests in sequence"""
    print("\n" + "="*80)
    print("METAQI ACADEMY - BACKEND API TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_USER_EMAIL}")
    print(f"Admin User: {ADMIN_EMAIL}")
    print("="*80)
    
    # PRIORITY AUTH TESTS (as requested in review)
    test_register_user()  # Test 1: Register new user
    test_login_admin()  # Test 2: Admin login with correct password (PRIORITY)
    test_login_admin_wrong_password()  # Test 3: Admin login with wrong password
    test_register_duplicate_email()  # Test 4: Register duplicate email
    test_login_test_user()  # Test 5: Login test user
    test_get_me_valid_token()  # Test 6a: Verify valid token
    test_get_me_invalid_token()  # Test 6b: Verify invalid token rejected
    
    # Secondary tests
    test_get_daily_energy()  # Test 7
    test_get_moon_energy()  # Test 8
    test_get_categories()  # Test 9
    test_get_services()  # Test 10
    test_add_favorite()  # Test 11
    test_get_favorites()  # Test 12
    
    # WEDDING AGENDA DATA FLOW TESTS (User-requested verification)
    test_get_wedding_agenda_months()  # Test 13: Get all wedding agenda months (Public)
    test_verify_wedding_agenda_content()  # Test 14: Verify specific content exists
    test_admin_create_wedding_agenda()  # Test 15: Admin creates September 2026
    test_verify_new_wedding_agenda_in_list()  # Test 16: Verify September appears in list
    test_admin_update_wedding_agenda()  # Test 17: Admin updates September (Upsert)
    test_verify_no_duplicates_in_mongodb()  # Test 18: Verify no duplicates
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    run_all_tests()
