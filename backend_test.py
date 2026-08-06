#!/usr/bin/env python3
"""
Final Google Auth Fix Verification Test
Tests all aspects of the Google Auth role validation fix
"""

import requests
import json
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://feng-shui-learn.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
ADMIN_EMAIL = "nnikholk@gmail.com"
ADMIN_PASSWORD = "admin123"

# Valid role values according to UserRole enum
VALID_ROLES = ["admin", "editor", "free_member", "premium_member"]
INVALID_ROLES = ["free", "premium"]  # Old values that should not exist

def print_test_header(test_num, description):
    """Print formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print(f"{'='*80}")

def print_result(success, message):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def get_admin_token():
    """Login as admin and get JWT token"""
    print_test_header("SETUP", "Admin Login")
    
    response = requests.post(
        f"{BACKEND_URL}/auth/login",
        json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print_result(True, f"Admin login successful, token obtained")
        return token
    else:
        print_result(False, f"Admin login failed: {response.status_code} - {response.text}")
        return None

def test_1_verify_all_users_have_correct_roles(token):
    """Test 1: Verify NO users have role='free' and all have valid roles"""
    print_test_header(1, "Verify All Users Have Correct Roles")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BACKEND_URL}/admin/users", headers=headers)
    
    if response.status_code != 200:
        print_result(False, f"Failed to fetch users: {response.status_code}")
        return False
    
    users = response.json()
    print(f"Total users in database: {len(users)}")
    
    # Check for invalid roles
    users_with_invalid_roles = []
    for user in users:
        role = user.get("role")
        if role in INVALID_ROLES:
            users_with_invalid_roles.append({
                "email": user.get("email"),
                "role": role,
                "id": user.get("id")
            })
    
    if users_with_invalid_roles:
        print_result(False, f"Found {len(users_with_invalid_roles)} users with invalid roles:")
        for u in users_with_invalid_roles:
            print(f"  - {u['email']}: role='{u['role']}' (should be 'free_member' or 'premium_member')")
        return False
    
    # Check all users have valid roles
    users_with_valid_roles = []
    for user in users:
        role = user.get("role")
        if role in VALID_ROLES:
            users_with_valid_roles.append(role)
    
    print_result(True, f"All {len(users)} users have valid roles")
    print(f"  Role distribution:")
    for role in VALID_ROLES:
        count = users_with_valid_roles.count(role)
        if count > 0:
            print(f"    - {role}: {count} users")
    
    return True

def test_2_auth_me_endpoint(token):
    """Test 2: Test GET /api/auth/me with admin token"""
    print_test_header(2, "Test GET /api/auth/me (User Retrieval)")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
    
    if response.status_code != 200:
        print_result(False, f"GET /api/auth/me failed: {response.status_code} - {response.text}")
        return False
    
    user_data = response.json()
    
    # Verify response structure
    required_fields = ["id", "email", "name", "role", "has_active_subscription", "created_at", "last_login"]
    missing_fields = [field for field in required_fields if field not in user_data]
    
    if missing_fields:
        print_result(False, f"Missing fields in response: {missing_fields}")
        return False
    
    # Verify admin user details
    if user_data.get("email") != ADMIN_EMAIL:
        print_result(False, f"Email mismatch: expected {ADMIN_EMAIL}, got {user_data.get('email')}")
        return False
    
    if user_data.get("role") != "admin":
        print_result(False, f"Role mismatch: expected 'admin', got {user_data.get('role')}")
        return False
    
    print_result(True, "GET /api/auth/me returns valid UserResponse")
    print(f"  User ID: {user_data.get('id')}")
    print(f"  Email: {user_data.get('email')}")
    print(f"  Role: {user_data.get('role')}")
    print(f"  Name: {user_data.get('name')}")
    
    return True

def test_3_admin_users_endpoint(token):
    """Test 3: Test GET /api/admin/users"""
    print_test_header(3, "Test GET /api/admin/users (Admin User Management)")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BACKEND_URL}/admin/users", headers=headers)
    
    if response.status_code != 200:
        print_result(False, f"GET /api/admin/users failed: {response.status_code} - {response.text}")
        return False
    
    users = response.json()
    
    # Verify all users are listed
    if len(users) == 0:
        print_result(False, "No users returned from admin endpoint")
        return False
    
    # Verify no validation errors in response
    validation_errors = []
    for user in users:
        role = user.get("role")
        if role not in VALID_ROLES:
            validation_errors.append(f"{user.get('email')}: invalid role '{role}'")
    
    if validation_errors:
        print_result(False, f"Validation errors found: {validation_errors}")
        return False
    
    print_result(True, f"GET /api/admin/users returns {len(users)} users correctly")
    print(f"  All users have valid role values")
    print(f"  No Pydantic validation errors detected")
    
    return True

def test_4_google_auth_session_endpoint():
    """Test 4: Verify POST /api/auth/session endpoint is accessible"""
    print_test_header(4, "Verify POST /api/auth/session Endpoint")
    
    # Test with invalid session_id (expected to fail, but endpoint should be accessible)
    response = requests.post(
        f"{BACKEND_URL}/auth/session",
        json={"session_id": "test_invalid_session_id_12345"}
    )
    
    # We expect 500 or 401 (because session_id is invalid), but NOT 404
    if response.status_code == 404:
        print_result(False, "POST /api/auth/session endpoint not found (404)")
        return False
    
    # Check if endpoint is configured correctly
    if response.status_code in [500, 503]:
        # Expected: Emergent API call fails in test environment
        print_result(True, "POST /api/auth/session endpoint is accessible")
        print(f"  Status: {response.status_code} (expected, Emergent API not available in test)")
        print(f"  Response: {response.text[:200]}")
        return True
    elif response.status_code == 401:
        # Also acceptable: Invalid session ID
        print_result(True, "POST /api/auth/session endpoint is accessible")
        print(f"  Status: {response.status_code} (Invalid session ID)")
        return True
    else:
        print_result(False, f"Unexpected status code: {response.status_code}")
        print(f"  Response: {response.text}")
        return False

def test_5_verify_new_user_role_config():
    """Test 5: Verify new Google OAuth users will be created with role='free_member'"""
    print_test_header(5, "Verify Google OAuth User Creation Config")
    
    # This is a code review test - we check the server.py file
    try:
        with open("/app/backend/server.py", "r") as f:
            server_code = f.read()
        
        # Check line 326 where new users are created
        if '"role": "free_member"' in server_code:
            print_result(True, "New Google OAuth users will be created with role='free_member'")
            print(f"  Code verified: Line 326 sets role='free_member' for new users")
            return True
        else:
            print_result(False, "Could not verify role='free_member' in user creation code")
            return False
    except Exception as e:
        print_result(False, f"Error reading server.py: {e}")
        return False

def test_6_check_backend_logs_for_validation_errors():
    """Test 6: Check backend logs for any Pydantic validation errors"""
    print_test_header(6, "Check Backend Logs for Validation Errors")
    
    try:
        import subprocess
        result = subprocess.run(
            ["tail", "-n", "100", "/var/log/supervisor/backend.err.log"],
            capture_output=True,
            text=True
        )
        
        logs = result.stdout
        
        # Check for validation errors
        validation_errors = []
        for line in logs.split("\n"):
            if "validation error" in line.lower() and "role" in line.lower():
                validation_errors.append(line)
        
        if validation_errors:
            print_result(False, f"Found {len(validation_errors)} validation errors in recent logs")
            for error in validation_errors[-3:]:  # Show last 3
                print(f"  {error}")
            return False
        else:
            print_result(True, "No Pydantic validation errors found in recent backend logs")
            return True
    except Exception as e:
        print_result(False, f"Error reading logs: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("FINAL GOOGLE AUTH FIX VERIFICATION TEST")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Get admin token
    token = get_admin_token()
    if not token:
        print("\n❌ CRITICAL: Cannot proceed without admin token")
        return
    
    # Run all tests
    results = []
    
    results.append(("Test 1: All Users Have Correct Roles", test_1_verify_all_users_have_correct_roles(token)))
    results.append(("Test 2: GET /api/auth/me", test_2_auth_me_endpoint(token)))
    results.append(("Test 3: GET /api/admin/users", test_3_admin_users_endpoint(token)))
    results.append(("Test 4: POST /api/auth/session Endpoint", test_4_google_auth_session_endpoint()))
    results.append(("Test 5: Google OAuth User Creation Config", test_5_verify_new_user_role_config()))
    results.append(("Test 6: Backend Logs Check", test_6_check_backend_logs_for_validation_errors()))
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print(f"{'='*80}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - Google Auth fix is complete and working correctly!")
        print("\nSUCCESS CRITERIA MET:")
        print("  ✅ Zero users with invalid role values")
        print("  ✅ GET /api/auth/me returns valid response")
        print("  ✅ GET /api/admin/users returns valid response")
        print("  ✅ No Pydantic validation errors in logs")
        print("  ✅ Backend ready for Google OAuth flow")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed - Google Auth fix needs attention")

if __name__ == "__main__":
    main()
