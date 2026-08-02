#!/usr/bin/env python3
"""
Password Recovery Flow Test for MetaQi Academy
Tests admin's ability to change user passwords
"""

import requests
import json
from typing import Optional, Dict, Any

# Base URL from frontend .env
BASE_URL = "https://feng-shui-learn.preview.emergentagent.com/api"

# Test credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "nnikholk@gmail.com"
ADMIN_PASSWORD = "admin123"

# Test user credentials
TEST_USER_EMAIL = "password_test_user@example.com"
INITIAL_PASSWORD = "testpass123"
NEW_PASSWORD = "newpass456"

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

def test_1_register_test_user():
    """Test 1: Create a test user with initial password"""
    print_test_header("Test 1: Register Test User with Initial Password")
    
    global test_user_id
    
    try:
        payload = {
            "name": "Password Test User",
            "email": TEST_USER_EMAIL,
            "password": INITIAL_PASSWORD,
            "language": "es",
            "role": "free_member"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        # User might already exist, delete and recreate
        if response.status_code == 400 and "already registered" in response.text:
            print("User already exists, will use existing user")
            # Login to get user ID
            login_response = requests.post(f"{BASE_URL}/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": INITIAL_PASSWORD
            })
            
            if login_response.status_code == 200:
                data = login_response.json()
                test_user_id = data.get("user", {}).get("id")
                print_result(True, "Using existing test user", {
                    "user_id": test_user_id,
                    "email": TEST_USER_EMAIL
                })
                return True
            else:
                # User exists but password might be different, need admin to reset
                print("User exists but can't login with initial password, will need admin to reset")
                print_result(True, "User exists (will reset password via admin)")
                return True
        
        if response.status_code == 200:
            data = response.json()
            test_user_id = data.get("id")
            print_result(True, "Test user registered successfully", {
                "user_id": test_user_id,
                "email": data.get("email"),
                "initial_password": INITIAL_PASSWORD
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

def test_2_login_admin():
    """Test 2: Login with admin account to get admin token"""
    print_test_header("Test 2: Admin Login")
    
    global admin_token
    
    try:
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            admin_token = data.get("access_token")
            user_data = data.get("user", {})
            
            if admin_token and user_data.get("role") == "admin":
                print_result(True, "Admin login successful", {
                    "email": user_data.get("email"),
                    "role": user_data.get("role"),
                    "token_type": data.get("token_type")
                })
                return True
            else:
                print_result(False, "Admin login succeeded but token or role missing", {
                    "has_token": bool(admin_token),
                    "role": user_data.get("role")
                })
                return False
        else:
            print_result(False, f"Admin login failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Admin login error: {str(e)}")
        return False

def test_3_get_test_user_id():
    """Test 3: Get test user ID using admin endpoint"""
    print_test_header("Test 3: Get Test User ID")
    
    global test_user_id
    
    if not admin_token:
        print_result(False, "Admin token not available")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/admin/users",
            params={"email": TEST_USER_EMAIL},
            headers=headers
        )
        
        if response.status_code == 200:
            users = response.json()
            if users and len(users) > 0:
                test_user_id = users[0].get("id")
                print_result(True, "Test user ID retrieved successfully", {
                    "user_id": test_user_id,
                    "email": users[0].get("email"),
                    "role": users[0].get("role")
                })
                return True
            else:
                print_result(False, "Test user not found in admin users list")
                return False
        else:
            print_result(False, f"Failed to get users with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Error getting user ID: {str(e)}")
        return False

def test_4_admin_change_password():
    """Test 4: Admin changes test user's password to new password"""
    print_test_header("Test 4: Admin Changes User Password")
    
    if not admin_token or not test_user_id:
        print_result(False, "Admin token or test user ID not available")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user_id}",
            params={"new_password": NEW_PASSWORD},
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Password changed successfully by admin", {
                "user_id": test_user_id,
                "new_password": NEW_PASSWORD,
                "response": data
            })
            return True
        else:
            print_result(False, f"Password change failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Error changing password: {str(e)}")
        return False

def test_5_login_with_old_password():
    """Test 5: Verify old password no longer works"""
    print_test_header("Test 5: Verify Old Password No Longer Works")
    
    try:
        payload = {
            "email": TEST_USER_EMAIL,
            "password": INITIAL_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 401:
            print_result(True, "Old password correctly rejected (401 Unauthorized)", {
                "old_password": INITIAL_PASSWORD,
                "status": response.status_code
            })
            return True
        elif response.status_code == 200:
            print_result(False, "Old password still works (should have been rejected)", {
                "old_password": INITIAL_PASSWORD
            })
            return False
        else:
            print_result(False, f"Unexpected status code {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Error testing old password: {str(e)}")
        return False

def test_6_login_with_new_password():
    """Test 6: Login with test user using NEW password"""
    print_test_header("Test 6: Login with New Password")
    
    try:
        payload = {
            "email": TEST_USER_EMAIL,
            "password": NEW_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user_data = data.get("user", {})
            
            if token and user_data.get("email") == TEST_USER_EMAIL:
                print_result(True, "Login with new password successful", {
                    "email": user_data.get("email"),
                    "token_type": data.get("token_type"),
                    "has_valid_token": bool(token),
                    "user_id": user_data.get("id")
                })
                return True
            else:
                print_result(False, "Login succeeded but token or email missing", {
                    "has_token": bool(token),
                    "email": user_data.get("email")
                })
                return False
        else:
            print_result(False, f"Login with new password failed with status {response.status_code}", {
                "response": response.text,
                "new_password": NEW_PASSWORD
            })
            return False
            
    except Exception as e:
        print_result(False, f"Login error: {str(e)}")
        return False

def test_7_password_with_spaces():
    """Test 7: Password with trailing/leading spaces should be trimmed"""
    print_test_header("Test 7: Password with Spaces (Edge Case)")
    
    if not admin_token or not test_user_id:
        print_result(False, "Admin token or test user ID not available")
        return False
    
    try:
        # Change password to one with spaces
        password_with_spaces = "  spacepass123  "
        trimmed_password = "spacepass123"
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user_id}",
            params={"new_password": password_with_spaces},
            headers=headers
        )
        
        if response.status_code != 200:
            print_result(False, f"Failed to set password with spaces: {response.status_code}")
            return False
        
        # Try to login with trimmed password
        login_response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": trimmed_password
        })
        
        if login_response.status_code == 200:
            print_result(True, "Password spaces trimmed correctly (can login with trimmed version)", {
                "password_with_spaces": password_with_spaces,
                "trimmed_password": trimmed_password
            })
            return True
        else:
            print_result(False, "Cannot login with trimmed password (spaces not trimmed)", {
                "password_with_spaces": password_with_spaces,
                "trimmed_password": trimmed_password,
                "status": login_response.status_code
            })
            return False
            
    except Exception as e:
        print_result(False, f"Error testing password with spaces: {str(e)}")
        return False

def test_8_empty_password():
    """Test 8: Empty password field should not change the password"""
    print_test_header("Test 8: Empty Password Field (Edge Case)")
    
    if not admin_token or not test_user_id:
        print_result(False, "Admin token or test user ID not available")
        return False
    
    try:
        # First, set a known password
        known_password = "knownpass123"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Set known password
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user_id}",
            params={"new_password": known_password},
            headers=headers
        )
        
        if response.status_code != 200:
            print_result(False, f"Failed to set known password: {response.status_code}")
            return False
        
        # Try to change password with empty string
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user_id}",
            params={"new_password": ""},
            headers=headers
        )
        
        # Should either reject the request or not change the password
        # Try to login with known password
        login_response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": known_password
        })
        
        if login_response.status_code == 200:
            print_result(True, "Empty password correctly ignored (old password still works)", {
                "known_password": known_password,
                "empty_password_request_status": response.status_code
            })
            return True
        else:
            print_result(False, "Empty password changed the password (should be ignored)", {
                "known_password": known_password,
                "login_status": login_response.status_code
            })
            return False
            
    except Exception as e:
        print_result(False, f"Error testing empty password: {str(e)}")
        return False

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {test_results['total']}")
    print(f"Passed: {len(test_results['passed'])} ✅")
    print(f"Failed: {len(test_results['failed'])} ❌")
    print(f"Success Rate: {len(test_results['passed'])/test_results['total']*100:.1f}%")
    
    if test_results['failed']:
        print("\n❌ FAILED TESTS:")
        for i, test in enumerate(test_results['failed'], 1):
            print(f"  {i}. {test}")
    
    if test_results['passed']:
        print("\n✅ PASSED TESTS:")
        for i, test in enumerate(test_results['passed'], 1):
            print(f"  {i}. {test}")
    
    print("="*80)

def main():
    """Run all password recovery tests"""
    print("\n" + "="*80)
    print("PASSWORD RECOVERY FLOW TEST SUITE")
    print("MetaQi Academy - Backend API Testing")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print(f"Test User Email: {TEST_USER_EMAIL}")
    print("="*80)
    
    # Run tests in sequence
    test_1_register_test_user()
    test_2_login_admin()
    test_3_get_test_user_id()
    test_4_admin_change_password()
    test_5_login_with_old_password()
    test_6_login_with_new_password()
    test_7_password_with_spaces()
    test_8_empty_password()
    
    # Print summary
    print_summary()
    
    # Return exit code
    return 0 if len(test_results['failed']) == 0 else 1

if __name__ == "__main__":
    exit(main())
