#!/usr/bin/env python3
"""
Password Reset Flow Testing for MetaQi Academy
Tests the complete self-service password reset functionality
"""

import requests
import json
from datetime import datetime, timedelta
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# Configuration
BACKEND_URL = "https://feng-shui-learn.preview.emergentagent.com/api"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Test user credentials
TEST_EMAIL = "passwordtest@test.com"
INITIAL_PASSWORD = "initialpass123"
NEW_PASSWORD = "newpass456"

# MongoDB connection
mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

# Test results tracking
test_results = {"passed": 0, "failed": 0, "total": 0}

def print_test_header(test_num, description):
    """Print formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print(f"{'='*80}")

def print_result(success, message, details=None):
    """Print test result"""
    global test_results
    test_results["total"] += 1
    if success:
        test_results["passed"] += 1
        status = "✅ PASSED"
    else:
        test_results["failed"] += 1
        status = "❌ FAILED"
    
    print(f"{status}: {message}")
    if details:
        print(f"Details: {json.dumps(details, indent=2, default=str)}")

def cleanup_test_user():
    """Remove test user and reset tokens from database"""
    db.users.delete_many({"email": TEST_EMAIL})
    db.password_reset_tokens.delete_many({"user_email": TEST_EMAIL})
    print(f"Cleaned up test user: {TEST_EMAIL}")

def create_test_user():
    """Create test user via API"""
    response = requests.post(
        f"{BACKEND_URL}/auth/register",
        json={
            "name": "Password Test User",
            "email": TEST_EMAIL,
            "password": INITIAL_PASSWORD,
            "language": "es"
        }
    )
    return response

def test_1_request_password_reset():
    """Test 1: Request password reset for existing user"""
    print_test_header(1, "Request Password Reset (Existing User)")
    
    response = requests.post(
        f"{BACKEND_URL}/auth/forgot-password",
        json={"email": TEST_EMAIL}
    )
    
    success = response.status_code == 200
    print_result(
        success,
        f"Password reset requested for {TEST_EMAIL}",
        {
            "status_code": response.status_code,
            "response": response.json() if response.status_code == 200 else response.text
        }
    )
    
    # Check if token was created in database
    token_record = db.password_reset_tokens.find_one({"user_email": TEST_EMAIL})
    if token_record:
        print_result(
            True,
            "Reset token created in database",
            {
                "token_length": len(token_record["token"]),
                "expires_at": token_record["expires_at"],
                "used": token_record["used"]
            }
        )
        return token_record["token"]
    else:
        print_result(False, "No reset token found in database")
        return None

def test_2_request_reset_nonexistent_email():
    """Test 2: Request password reset for non-existent email (security test)"""
    print_test_header(2, "Request Password Reset (Non-existent Email - Security Test)")
    
    response = requests.post(
        f"{BACKEND_URL}/auth/forgot-password",
        json={"email": "nonexistent@example.com"}
    )
    
    # Should still return 200 to not reveal email existence
    success = response.status_code == 200
    print_result(
        success,
        "Endpoint returns 200 even for non-existent email (security feature)",
        {
            "status_code": response.status_code,
            "response": response.json() if response.status_code == 200 else response.text
        }
    )
    
    # Verify no token was created
    token_record = db.password_reset_tokens.find_one({"user_email": "nonexistent@example.com"})
    print_result(
        token_record is None,
        "No token created for non-existent email",
        {"token_found": token_record is not None}
    )

def test_3_validate_valid_token(token):
    """Test 3: Validate a valid reset token"""
    print_test_header(3, "Validate Valid Reset Token")
    
    if not token:
        print_result(False, "No token available for validation")
        return False
    
    response = requests.get(f"{BACKEND_URL}/auth/validate-reset-token/{token}")
    
    success = response.status_code == 200
    data = response.json() if success else None
    
    print_result(
        success and data and data.get("valid") == True and data.get("email") == TEST_EMAIL,
        "Token validation successful",
        {
            "status_code": response.status_code,
            "response": data if data else response.text
        }
    )
    
    return success

def test_4_validate_invalid_token():
    """Test 4: Validate an invalid token"""
    print_test_header(4, "Validate Invalid Token")
    
    invalid_token = "invalid_token_12345"
    response = requests.get(f"{BACKEND_URL}/auth/validate-reset-token/{invalid_token}")
    
    success = response.status_code == 404
    print_result(
        success,
        "Invalid token correctly rejected with 404",
        {
            "status_code": response.status_code,
            "response": response.json() if response.status_code in [400, 404] else response.text
        }
    )

def test_5_reset_password_with_weak_password(token):
    """Test 5: Try to reset password with weak password (< 6 chars)"""
    print_test_header(5, "Reset Password with Weak Password (< 6 chars)")
    
    if not token:
        print_result(False, "No token available for testing")
        return False
    
    response = requests.post(
        f"{BACKEND_URL}/auth/reset-password",
        json={
            "token": token,
            "new_password": "12345"  # Only 5 characters
        }
    )
    
    success = response.status_code == 400
    print_result(
        success,
        "Weak password correctly rejected with 400",
        {
            "status_code": response.status_code,
            "response": response.json() if response.status_code == 400 else response.text
        }
    )

def test_6_reset_password_success(token):
    """Test 6: Reset password successfully"""
    print_test_header(6, "Reset Password Successfully")
    
    if not token:
        print_result(False, "No token available for password reset")
        return False
    
    response = requests.post(
        f"{BACKEND_URL}/auth/reset-password",
        json={
            "token": token,
            "new_password": NEW_PASSWORD
        }
    )
    
    success = response.status_code == 200
    data = response.json() if success else None
    
    print_result(
        success and data and data.get("email") == TEST_EMAIL,
        "Password reset successful",
        {
            "status_code": response.status_code,
            "response": data if data else response.text
        }
    )
    
    # Verify token is marked as used
    token_record = db.password_reset_tokens.find_one({"token": token})
    if token_record:
        print_result(
            token_record["used"] == True,
            "Token marked as used in database",
            {"used": token_record["used"]}
        )
    
    return success

def test_7_try_reuse_token(token):
    """Test 7: Try to use the same token again (should fail)"""
    print_test_header(7, "Try to Reuse Token (Should Fail)")
    
    if not token:
        print_result(False, "No token available for testing")
        return False
    
    response = requests.post(
        f"{BACKEND_URL}/auth/reset-password",
        json={
            "token": token,
            "new_password": "anotherpass123"
        }
    )
    
    success = response.status_code == 400
    data = response.json() if response.status_code in [400, 404] else None
    
    print_result(
        success and data and "utilizado" in data.get("detail", "").lower(),
        "Token reuse correctly rejected with 'already used' error",
        {
            "status_code": response.status_code,
            "response": data if data else response.text
        }
    )

def test_8_login_with_old_password():
    """Test 8: Verify old password no longer works"""
    print_test_header(8, "Login with Old Password (Should Fail)")
    
    response = requests.post(
        f"{BACKEND_URL}/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": INITIAL_PASSWORD
        }
    )
    
    success = response.status_code == 401
    print_result(
        success,
        "Old password correctly rejected",
        {
            "status_code": response.status_code,
            "response": response.json() if response.status_code == 401 else response.text
        }
    )

def test_9_login_with_new_password():
    """Test 9: Verify new password works"""
    print_test_header(9, "Login with New Password (Should Succeed)")
    
    response = requests.post(
        f"{BACKEND_URL}/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": NEW_PASSWORD
        }
    )
    
    success = response.status_code == 200
    data = response.json() if success else None
    
    print_result(
        success and data and "access_token" in data and data.get("token_type") == "bearer",
        "Login with new password successful",
        {
            "status_code": response.status_code,
            "has_token": "access_token" in data if data else False,
            "token_type": data.get("token_type") if data else None
        }
    )

def test_10_expired_token():
    """Test 10: Test with expired token"""
    print_test_header(10, "Validate Expired Token")
    
    # Create a token that's already expired
    expired_token = "expired_test_token_12345678901234567890"
    user = db.users.find_one({"email": TEST_EMAIL})
    
    if not user:
        print_result(False, "Test user not found")
        return
    
    # Insert expired token
    expired_token_record = {
        "id": "expired_token_id",
        "user_id": user["id"],
        "user_email": TEST_EMAIL,
        "token": expired_token,
        "expires_at": datetime.utcnow() - timedelta(hours=2),  # Expired 2 hours ago
        "used": False,
        "created_at": datetime.utcnow() - timedelta(hours=3)
    }
    db.password_reset_tokens.insert_one(expired_token_record)
    
    # Try to validate expired token
    response = requests.get(f"{BACKEND_URL}/auth/validate-reset-token/{expired_token}")
    
    success = response.status_code == 400
    data = response.json() if response.status_code in [400, 404] else None
    
    print_result(
        success and data and "expirado" in data.get("detail", "").lower(),
        "Expired token correctly rejected",
        {
            "status_code": response.status_code,
            "response": data if data else response.text
        }
    )
    
    # Cleanup expired token
    db.password_reset_tokens.delete_one({"token": expired_token})

def test_11_token_length_security():
    """Test 11: Verify token is long and random (security test)"""
    print_test_header(11, "Token Length and Randomness (Security Test)")
    
    # Get all tokens for test user
    tokens = list(db.password_reset_tokens.find({"user_email": TEST_EMAIL}))
    
    if not tokens:
        print_result(False, "No tokens found for security test")
        return
    
    token = tokens[0]["token"]
    token_length = len(token)
    
    # Token should be at least 32 characters (secrets.token_urlsafe(32) generates ~43 chars)
    success = token_length >= 32
    print_result(
        success,
        f"Token length is sufficient for security (length: {token_length})",
        {
            "token_length": token_length,
            "token_sample": token[:10] + "..." + token[-10:],
            "requirement": "≥ 32 characters"
        }
    )

def run_all_tests():
    """Run all password reset flow tests"""
    print("\n" + "="*80)
    print("METAQI ACADEMY - PASSWORD RESET FLOW TESTING")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Test Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("="*80)
    
    # Cleanup and setup
    print("\n[SETUP] Cleaning up previous test data...")
    cleanup_test_user()
    
    print("\n[SETUP] Creating test user...")
    response = create_test_user()
    if response.status_code != 200:
        print(f"❌ Failed to create test user: {response.status_code} - {response.text}")
        return
    print(f"✅ Test user created: {TEST_EMAIL}")
    
    # Run tests
    token = test_1_request_password_reset()
    test_2_request_reset_nonexistent_email()
    test_3_validate_valid_token(token)
    test_4_validate_invalid_token()
    test_5_reset_password_with_weak_password(token)
    test_6_reset_password_success(token)
    test_7_try_reuse_token(token)
    test_8_login_with_old_password()
    test_9_login_with_new_password()
    test_10_expired_token()
    test_11_token_length_security()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {test_results['total']}")
    print(f"Passed: {test_results['passed']} ✅")
    print(f"Failed: {test_results['failed']} ❌")
    success_rate = (test_results['passed'] / test_results['total'] * 100) if test_results['total'] > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    print("="*80)
    
    # Cleanup
    print("\n[CLEANUP] Removing test data...")
    cleanup_test_user()
    print("✅ Cleanup complete")

if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        mongo_client.close()
