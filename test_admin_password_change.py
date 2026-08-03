#!/usr/bin/env python3
"""
Admin Password Change Flow Test
Tests the complete admin password change functionality with edge cases
"""

import requests
import json
from typing import Optional, Dict, Any

# Base URL from frontend .env
BASE_URL = "https://feng-shui-learn.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "nnikholk@gmail.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "passwordtest@test.com"
INITIAL_PASSWORD = "initialpass123"

# Global variables
admin_token: Optional[str] = None
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

def test_1_create_test_user():
    """Test 1: Create a new test user with initial password"""
    print_test_header("Test 1: Create Test User")
    
    try:
        payload = {
            "name": "Password Test User",
            "email": TEST_USER_EMAIL,
            "password": INITIAL_PASSWORD,
            "language": "es",
            "role": "free_member"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        # User might already exist from previous test runs
        if response.status_code == 400 and "already registered" in response.text:
            print_result(True, "User already exists (will use existing user)", {
                "email": TEST_USER_EMAIL,
                "note": "This is expected if tests were run before"
            })
            return True
        
        if response.status_code == 200:
            data = response.json()
            global test_user_id
            test_user_id = data.get("id")
            print_result(True, "Test user created successfully", {
                "email": TEST_USER_EMAIL,
                "user_id": test_user_id,
                "initial_password": INITIAL_PASSWORD
            })
            return True
        else:
            print_result(False, f"User creation failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"User creation error: {str(e)}")
        return False

def test_2_admin_login():
    """Test 2: Login with admin credentials to get admin token"""
    print_test_header("Test 2: Admin Login")
    
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
                "email": ADMIN_EMAIL,
                "token_type": data.get("token_type"),
                "role": data.get("user", {}).get("role"),
                "token_preview": admin_token[:20] + "..." if admin_token else None
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

def test_3_get_user_id():
    """Test 3: Get test user's ID via GET /api/admin/users?email=passwordtest@test.com"""
    print_test_header("Test 3: Get Test User ID")
    
    global test_user_id
    
    if not admin_token:
        print_result(False, "No admin token available")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }
        
        response = requests.get(
            f"{BASE_URL}/admin/users",
            params={"email": TEST_USER_EMAIL},
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Response might be a list or a single user object
            if isinstance(data, list):
                if len(data) > 0:
                    user = data[0]
                    test_user_id = user.get("id")
                    print_result(True, "Test user ID retrieved successfully", {
                        "email": user.get("email"),
                        "user_id": test_user_id,
                        "role": user.get("role")
                    })
                    return True
                else:
                    print_result(False, "No user found with that email", {
                        "email": TEST_USER_EMAIL
                    })
                    return False
            else:
                # Single user object
                test_user_id = data.get("id")
                print_result(True, "Test user ID retrieved successfully", {
                    "email": data.get("email"),
                    "user_id": test_user_id,
                    "role": data.get("role")
                })
                return True
        else:
            print_result(False, f"Get user request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Get user ID error: {str(e)}")
        return False

def test_4_admin_change_password():
    """Test 4: Admin changes the password via PUT /api/admin/users/{user_id}?new_password=changedpass456"""
    print_test_header("Test 4: Admin Changes User Password")
    
    if not admin_token or not test_user_id:
        print_result(False, "Missing admin token or test user ID")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }
        
        new_password = "changedpass456"
        
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user_id}",
            params={"new_password": new_password},
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Admin successfully changed user password", {
                "user_id": test_user_id,
                "new_password": new_password,
                "user_email": data.get("email")
            })
            return True
        else:
            print_result(False, f"Password change failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Password change error: {str(e)}")
        return False

def test_5_verify_old_password_fails():
    """Test 5: Verify old password fails - Try login with 'initialpass123' - should return 401"""
    print_test_header("Test 5: Verify Old Password Fails")
    
    try:
        payload = {
            "email": TEST_USER_EMAIL,
            "password": INITIAL_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 401:
            print_result(True, "Old password correctly rejected with 401", {
                "email": TEST_USER_EMAIL,
                "old_password": INITIAL_PASSWORD,
                "status_code": response.status_code,
                "detail": response.json().get("detail") if response.text else None
            })
            return True
        else:
            print_result(False, f"Old password should return 401, got {response.status_code}", {
                "response": response.text,
                "note": "Old password should no longer work after admin changed it"
            })
            return False
            
    except Exception as e:
        print_result(False, f"Old password verification error: {str(e)}")
        return False

def test_6_verify_new_password_works():
    """Test 6: Verify new password works - Try login with 'changedpass456' - should return 200 with JWT token"""
    print_test_header("Test 6: Verify New Password Works")
    
    try:
        payload = {
            "email": TEST_USER_EMAIL,
            "password": "changedpass456"
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            
            print_result(True, "New password works correctly - login successful", {
                "email": TEST_USER_EMAIL,
                "new_password": "changedpass456",
                "token_type": data.get("token_type"),
                "has_token": bool(token),
                "token_preview": token[:20] + "..." if token else None
            })
            return True
        else:
            print_result(False, f"New password login failed with status {response.status_code}", {
                "response": response.text,
                "note": "New password should work after admin changed it"
            })
            return False
            
    except Exception as e:
        print_result(False, f"New password verification error: {str(e)}")
        return False

def test_7_password_with_spaces():
    """Test 7: Test with spaces - Admin changes password to '  newpass789  ' (with leading/trailing spaces)"""
    print_test_header("Test 7: Password Change with Spaces")
    
    if not admin_token or not test_user_id:
        print_result(False, "Missing admin token or test user ID")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }
        
        # Password with leading and trailing spaces
        password_with_spaces = "  newpass789  "
        
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user_id}",
            params={"new_password": password_with_spaces},
            headers=headers
        )
        
        if response.status_code == 200:
            print_result(True, "Admin changed password with spaces", {
                "user_id": test_user_id,
                "password_with_spaces": repr(password_with_spaces),
                "note": "Password has leading/trailing spaces"
            })
            return True
        else:
            print_result(False, f"Password change with spaces failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Password with spaces error: {str(e)}")
        return False

def test_8_login_with_trimmed_password():
    """Test 8: Login with trimmed password - Try 'newpass789' (without spaces) - should succeed"""
    print_test_header("Test 8: Login with Trimmed Password")
    
    try:
        # Try to login with trimmed version (no spaces)
        payload = {
            "email": TEST_USER_EMAIL,
            "password": "newpass789"  # No spaces
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            
            print_result(True, "Login with trimmed password successful", {
                "email": TEST_USER_EMAIL,
                "password_used": "newpass789",
                "note": "Spaces were trimmed on save, so login without spaces works",
                "has_token": bool(token)
            })
            return True
        else:
            print_result(False, f"Login with trimmed password failed with status {response.status_code}", {
                "response": response.text,
                "note": "Should work because backend trims spaces on save"
            })
            return False
            
    except Exception as e:
        print_result(False, f"Trimmed password login error: {str(e)}")
        return False

def test_9_empty_password():
    """Test 9: Test password change when sending empty string (should be ignored)"""
    print_test_header("Test 9: Empty Password (Edge Case)")
    
    if not admin_token or not test_user_id:
        print_result(False, "Missing admin token or test user ID")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }
        
        # Try to change password to empty string
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user_id}",
            params={"new_password": ""},
            headers=headers
        )
        
        # Should either return 400 (validation error) or ignore the change
        if response.status_code == 400:
            print_result(True, "Empty password correctly rejected with 400", {
                "status_code": response.status_code,
                "detail": response.json().get("detail") if response.text else None
            })
            return True
        elif response.status_code == 200:
            # If it returns 200, verify that old password still works
            login_response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": TEST_USER_EMAIL, "password": "newpass789"}
            )
            
            if login_response.status_code == 200:
                print_result(True, "Empty password ignored - old password still works", {
                    "note": "Backend ignored empty password, old password unchanged"
                })
                return True
            else:
                print_result(False, "Empty password accepted but broke authentication", {
                    "response": response.text
                })
                return False
        else:
            print_result(False, f"Unexpected status code {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Empty password test error: {str(e)}")
        return False

def test_10_whitespace_only_password():
    """Test 10: Test password change when sending only spaces '   ' (should be ignored)"""
    print_test_header("Test 10: Whitespace-Only Password (Edge Case)")
    
    if not admin_token or not test_user_id:
        print_result(False, "Missing admin token or test user ID")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }
        
        # Try to change password to only spaces
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user_id}",
            params={"new_password": "   "},
            headers=headers
        )
        
        # Should either return 400 (validation error) or ignore the change
        if response.status_code == 400:
            print_result(True, "Whitespace-only password correctly rejected with 400", {
                "status_code": response.status_code,
                "detail": response.json().get("detail") if response.text else None
            })
            return True
        elif response.status_code == 200:
            # If it returns 200, verify that old password still works
            login_response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": TEST_USER_EMAIL, "password": "newpass789"}
            )
            
            if login_response.status_code == 200:
                print_result(True, "Whitespace-only password ignored - old password still works", {
                    "note": "Backend ignored whitespace-only password, old password unchanged"
                })
                return True
            else:
                print_result(False, "Whitespace-only password accepted but broke authentication", {
                    "response": response.text
                })
                return False
        else:
            print_result(False, f"Unexpected status code {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Whitespace-only password test error: {str(e)}")
        return False

def test_11_login_with_spaces_vs_without():
    """Test 11: Test login with password that has spaces vs without spaces (both should work after trim)"""
    print_test_header("Test 11: Login with Spaces vs Without Spaces")
    
    # First, set a password with spaces
    if not admin_token or not test_user_id:
        print_result(False, "Missing admin token or test user ID")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }
        
        # Set password with spaces
        password_with_spaces = "  finalpass999  "
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user_id}",
            params={"new_password": password_with_spaces},
            headers=headers
        )
        
        if response.status_code != 200:
            print_result(False, f"Failed to set password with spaces: {response.status_code}")
            return False
        
        print(f"  ℹ️  Set password: {repr(password_with_spaces)}")
        
        # Try login with spaces
        login_with_spaces = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_USER_EMAIL, "password": "  finalpass999  "}
        )
        
        # Try login without spaces
        login_without_spaces = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_USER_EMAIL, "password": "finalpass999"}
        )
        
        with_spaces_works = login_with_spaces.status_code == 200
        without_spaces_works = login_without_spaces.status_code == 200
        
        if with_spaces_works and without_spaces_works:
            print_result(True, "Both login attempts work (with and without spaces)", {
                "login_with_spaces": "SUCCESS",
                "login_without_spaces": "SUCCESS",
                "note": "Backend trims spaces on both save and login"
            })
            return True
        elif without_spaces_works and not with_spaces_works:
            print_result(True, "Login without spaces works (spaces trimmed on save)", {
                "login_with_spaces": "FAILED",
                "login_without_spaces": "SUCCESS",
                "note": "This is expected behavior - spaces trimmed on save"
            })
            return True
        else:
            print_result(False, "Unexpected login behavior", {
                "login_with_spaces": "SUCCESS" if with_spaces_works else "FAILED",
                "login_without_spaces": "SUCCESS" if without_spaces_works else "FAILED"
            })
            return False
            
    except Exception as e:
        print_result(False, f"Login comparison test error: {str(e)}")
        return False

def print_summary():
    """Print test summary"""
    print(f"\n{'='*80}")
    print("TEST SUMMARY - ADMIN PASSWORD CHANGE FLOW")
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
    """Run all admin password change tests in sequence"""
    print("\n" + "="*80)
    print("ADMIN PASSWORD CHANGE FLOW - COMPREHENSIVE TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin User: {ADMIN_EMAIL}")
    print(f"Test User: {TEST_USER_EMAIL}")
    print(f"Initial Password: {INITIAL_PASSWORD}")
    print("="*80)
    
    # Run all tests in sequence
    test_1_create_test_user()
    test_2_admin_login()
    test_3_get_user_id()
    test_4_admin_change_password()
    test_5_verify_old_password_fails()
    test_6_verify_new_password_works()
    test_7_password_with_spaces()
    test_8_login_with_trimmed_password()
    test_9_empty_password()
    test_10_whitespace_only_password()
    test_11_login_with_spaces_vs_without()
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    run_all_tests()
