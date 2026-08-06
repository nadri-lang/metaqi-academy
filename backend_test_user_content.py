#!/usr/bin/env python3
"""
Backend API Testing Script for MetaQi Academy - User Content Endpoint
Tests authentication and user-specific content retrieval
"""

import requests
import json

# Backend URL from environment
BACKEND_URL = "https://feng-shui-learn.preview.emergentagent.com/api"

# Admin credentials
ADMIN_EMAIL = "nnikholk@gmail.com"
ADMIN_PASSWORD = "admin123"

# Test results storage
test_results = []

def log_test(test_name, passed, details=""):
    """Log test result"""
    status = "✅ PASSED" if passed else "❌ FAILED"
    result = f"{status} - {test_name}"
    if details:
        result += f"\n   Details: {details}"
    test_results.append(result)
    print(result)
    return passed

def test_admin_login():
    """Test 1: Admin Login to get JWT token"""
    print("\n" + "="*80)
    print("TEST 1: Admin Login (nnikholk@gmail.com / admin123)")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user", {})
            
            if token:
                print(f"✅ Login successful")
                print(f"   Token type: {data.get('token_type')}")
                print(f"   User ID: {user.get('id')}")
                print(f"   Email: {user.get('email')}")
                print(f"   Role: {user.get('role')}")
                
                log_test("Admin Login", True, f"JWT token obtained, role={user.get('role')}")
                return token, user.get('id')
            else:
                log_test("Admin Login", False, "No access_token in response")
                return None, None
        else:
            log_test("Admin Login", False, f"Status {response.status_code}: {response.text}")
            return None, None
            
    except Exception as e:
        log_test("Admin Login", False, f"Exception: {str(e)}")
        return None, None

def test_get_user_content_with_auth(token, admin_user_id):
    """Test 2: GET /api/user-content/mine with authentication"""
    print("\n" + "="*80)
    print("TEST 2: GET /api/user-content/mine (with authentication)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/user-content/mine",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            has_content = data.get("has_content")
            content = data.get("content", [])
            
            # Critical validations
            validations = []
            
            # 1. Should return has_content: true
            if has_content:
                validations.append("✅ has_content is true")
            else:
                validations.append("❌ has_content is false (expected true)")
            
            # 2. Should return exactly 1 content item (only admin's content)
            if len(content) == 1:
                validations.append(f"✅ Content array length is 1 (correct)")
            else:
                validations.append(f"❌ Content array length is {len(content)} (expected 1)")
            
            # 3. Verify content belongs to admin user
            if len(content) > 0:
                first_content = content[0]
                content_user_id = first_content.get("user_id")
                content_title = first_content.get("title")
                content_type = first_content.get("type")
                
                print(f"\nContent Details:")
                print(f"   ID: {first_content.get('id')}")
                print(f"   User ID: {content_user_id}")
                print(f"   Title: {content_title}")
                print(f"   Type: {content_type}")
                print(f"   URL: {first_content.get('url')}")
                
                if content_user_id == admin_user_id:
                    validations.append(f"✅ Content user_id matches admin's user_id")
                else:
                    validations.append(f"❌ Content user_id ({content_user_id}) does NOT match admin's user_id ({admin_user_id})")
                
                if content_title == "Admin Test PDF":
                    validations.append(f"✅ Content title is 'Admin Test PDF' (correct)")
                else:
                    validations.append(f"❌ Content title is '{content_title}' (expected 'Admin Test PDF')")
                
                # 4. Verify it does NOT return fake user's content
                fake_user_content = [c for c in content if c.get("user_id") == "fake-user-123"]
                if len(fake_user_content) == 0:
                    validations.append(f"✅ Does NOT return fake user's content (correct)")
                else:
                    validations.append(f"❌ SECURITY ISSUE: Returns content from fake-user-123")
            
            print("\nValidations:")
            for v in validations:
                print(f"   {v}")
            
            all_passed = all("✅" in v for v in validations)
            
            if all_passed:
                log_test("GET /api/user-content/mine (authenticated)", True, 
                        "Returns only admin's content, correct filtering by user_id")
            else:
                failed_validations = [v for v in validations if "❌" in v]
                log_test("GET /api/user-content/mine (authenticated)", False, 
                        f"Failed validations: {', '.join(failed_validations)}")
            
            return all_passed
        else:
            log_test("GET /api/user-content/mine (authenticated)", False, 
                    f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/user-content/mine (authenticated)", False, f"Exception: {str(e)}")
        return False

def test_get_user_content_without_auth():
    """Test 3: GET /api/user-content/mine without authentication"""
    print("\n" + "="*80)
    print("TEST 3: GET /api/user-content/mine (without authentication)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/user-content/mine",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print(f"✅ Correctly returns 401 Unauthorized")
            print(f"Response: {response.text}")
            
            log_test("GET /api/user-content/mine (no auth)", True, 
                    "Correctly returns 401 Unauthorized")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            
            log_test("GET /api/user-content/mine (no auth)", False, 
                    f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        log_test("GET /api/user-content/mine (no auth)", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("USER CONTENT ENDPOINT TESTING")
    print("Testing GET /api/user-content/mine with authentication")
    print("="*80)
    
    # Test 1: Admin Login
    token, admin_user_id = test_admin_login()
    if not token:
        print("\n❌ Cannot proceed without admin token")
        return
    
    # Test 2: Get user content with authentication
    test_get_user_content_with_auth(token, admin_user_id)
    
    # Test 3: Get user content without authentication
    test_get_user_content_without_auth()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed_count = sum(1 for r in test_results if "✅ PASSED" in r)
    failed_count = sum(1 for r in test_results if "❌ FAILED" in r)
    total_count = len(test_results)
    
    print(f"TOTAL: {total_count} tests")
    print(f"PASSED: {passed_count} tests ✅")
    print(f"FAILED: {failed_count} tests ❌")
    print(f"SUCCESS RATE: {(passed_count/total_count*100):.1f}%")
    print("="*80)
    
    print("\nDetailed Results:")
    for result in test_results:
        print(result)
    
    if failed_count == 0:
        print("\n🎉 ALL TESTS PASSED! User Content endpoint working correctly.")
    else:
        print(f"\n⚠️  {failed_count} TEST(S) FAILED. Please review the failures above.")

if __name__ == "__main__":
    main()
