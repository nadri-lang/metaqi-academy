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
ADMIN_EMAIL = "admin@metaqi.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "user@test.com"
TEST_USER_PASSWORD = "user123"

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

def test_login_test_user():
    """Test 3: POST /api/auth/login - Login with test user credentials"""
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
    """Test 4a: GET /api/auth/me - Verify token authentication with valid token"""
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
    """Test 4b: GET /api/auth/me - Verify token authentication with invalid token"""
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
    """Test 5: GET /api/energy/daily - Get today's energy (no auth required)"""
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
    """Test 6: GET /api/energy/moon/current - Get current month moon energy"""
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
    """Test 7: GET /api/categories - List all categories"""
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
    """Test 8: GET /api/services - List custom services"""
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
    """Test 9: POST /api/favorites - Add favorite (requires auth)"""
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
    """Test 10: GET /api/favorites - Get user favorites (requires auth)"""
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
    
    # Priority tests
    test_register_user()
    test_login_admin()
    test_login_test_user()
    test_get_me_valid_token()
    test_get_me_invalid_token()
    test_get_daily_energy()
    test_get_moon_energy()
    
    # Secondary tests
    test_get_categories()
    test_get_services()
    test_add_favorite()
    test_get_favorites()
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    run_all_tests()
