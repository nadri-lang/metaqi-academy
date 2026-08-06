#!/usr/bin/env python3
"""
Backend API Testing Script for MetaQi Academy - Newborn Vocation Admin Endpoints
Tests date format validation and CRUD operations
"""

import requests
import json
from datetime import datetime

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
    """Test 1: Admin Login"""
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
            
            print(f"Token Type: {data.get('token_type')}")
            print(f"User Email: {user.get('email')}")
            print(f"User Role: {user.get('role')}")
            
            if token and user.get("role") == "admin":
                log_test("Admin Login", True, f"Token obtained, role={user.get('role')}")
                return token
            else:
                log_test("Admin Login", False, "Token missing or role is not admin")
                return None
        else:
            log_test("Admin Login", False, f"Status {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        log_test("Admin Login", False, f"Exception: {str(e)}")
        return None

def test_create_vocation_aug5(token):
    """Test 2: Create vocation for 2026-08-05 with correct date format"""
    print("\n" + "="*80)
    print("TEST 2: Create Vocation for 2026-08-05 (correct date format with leading zeros)")
    print("="*80)
    
    try:
        payload = {
            "date": "2026-08-05",
            "title": "Test Vocation Aug 5",
            "content": "Content for Aug 5",
            "talents": ["Talent 1"],
            "vocations": ["Vocation 1"],
            "challenges": ["Challenge 1"]
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/admin/newborn-vocation",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify date format
            returned_date = data.get("date")
            if returned_date == "2026-08-05":
                log_test("Create Vocation Aug 5", True, f"Date format correct: {returned_date}")
                return data
            else:
                log_test("Create Vocation Aug 5", False, f"Date format incorrect: {returned_date} (expected 2026-08-05)")
                return None
        else:
            log_test("Create Vocation Aug 5", False, f"Status {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        log_test("Create Vocation Aug 5", False, f"Exception: {str(e)}")
        return None

def test_create_vocation_aug6(token):
    """Test 3: Create vocation for 2026-08-06 with DIFFERENT content"""
    print("\n" + "="*80)
    print("TEST 3: Create Vocation for 2026-08-06 (different content)")
    print("="*80)
    
    try:
        payload = {
            "date": "2026-08-06",
            "title": "Test Vocation Aug 6",
            "content": "Different content for Aug 6",
            "talents": ["Talent 2"],
            "vocations": ["Vocation 2"],
            "challenges": ["Challenge 2"]
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/admin/newborn-vocation",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify date format and content
            returned_date = data.get("date")
            returned_content = data.get("content")
            
            if returned_date == "2026-08-06" and returned_content == "Different content for Aug 6":
                log_test("Create Vocation Aug 6", True, f"Date format correct: {returned_date}, content is different")
                return data
            else:
                log_test("Create Vocation Aug 6", False, f"Date or content incorrect")
                return None
        else:
            log_test("Create Vocation Aug 6", False, f"Status {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        log_test("Create Vocation Aug 6", False, f"Exception: {str(e)}")
        return None

def test_get_all_vocations(token):
    """Test 4: Get all scheduled vocations"""
    print("\n" + "="*80)
    print("TEST 4: Get All Scheduled Vocations")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/admin/newborn-vocation/all",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total vocations: {len(data)}")
            
            # Find our test vocations
            aug5_found = False
            aug6_found = False
            date_format_issues = []
            
            for vocation in data:
                date = vocation.get("date")
                print(f"  - Date: {date}, Title: {vocation.get('title')}")
                
                # Check date format (YYYY-MM-DD with leading zeros)
                if date and not is_valid_date_format(date):
                    date_format_issues.append(date)
                
                if date == "2026-08-05":
                    aug5_found = True
                    aug5_content = vocation.get("content")
                    print(f"    Aug 5 Content: {aug5_content}")
                    
                if date == "2026-08-06":
                    aug6_found = True
                    aug6_content = vocation.get("content")
                    print(f"    Aug 6 Content: {aug6_content}")
            
            # Verify both vocations exist and have different content
            if aug5_found and aug6_found:
                if date_format_issues:
                    log_test("Get All Vocations", False, f"Date format issues found: {date_format_issues}")
                    return False
                else:
                    log_test("Get All Vocations", True, f"Both vocations found with correct date format")
                    return True
            else:
                log_test("Get All Vocations", False, f"Aug 5 found: {aug5_found}, Aug 6 found: {aug6_found}")
                return False
        else:
            log_test("Get All Vocations", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Get All Vocations", False, f"Exception: {str(e)}")
        return False

def test_update_vocation_aug5(token):
    """Test 5: Update existing vocation (same date, different content)"""
    print("\n" + "="*80)
    print("TEST 5: Update Vocation for 2026-08-05 (same date, different content)")
    print("="*80)
    
    try:
        payload = {
            "date": "2026-08-05",
            "title": "UPDATED Aug 5",
            "content": "Updated content",
            "talents": [],
            "vocations": [],
            "challenges": []
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/admin/newborn-vocation",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify update worked
            returned_title = data.get("title")
            returned_content = data.get("content")
            
            if returned_title == "UPDATED Aug 5" and returned_content == "Updated content":
                log_test("Update Vocation Aug 5", True, "Update successful, content changed")
                return True
            else:
                log_test("Update Vocation Aug 5", False, f"Update failed, title={returned_title}, content={returned_content}")
                return False
        else:
            log_test("Update Vocation Aug 5", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Update Vocation Aug 5", False, f"Exception: {str(e)}")
        return False

def test_delete_vocation_aug6(token):
    """Test 6: Delete vocation by date"""
    print("\n" + "="*80)
    print("TEST 6: Delete Vocation for 2026-08-06")
    print("="*80)
    
    try:
        response = requests.delete(
            f"{BACKEND_URL}/admin/newborn-vocation/2026-08-06",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            log_test("Delete Vocation Aug 6", True, "Deletion successful")
            return True
        else:
            log_test("Delete Vocation Aug 6", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Delete Vocation Aug 6", False, f"Exception: {str(e)}")
        return False

def test_verify_deletion(token):
    """Test 7: Verify deletion - Aug 6 should not exist"""
    print("\n" + "="*80)
    print("TEST 7: Verify Deletion (Aug 6 should not exist)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/admin/newborn-vocation/all",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total vocations: {len(data)}")
            
            # Check if Aug 6 still exists
            aug6_found = False
            for vocation in data:
                date = vocation.get("date")
                if date == "2026-08-06":
                    aug6_found = True
                    print(f"  ❌ Aug 6 still exists: {vocation}")
            
            if not aug6_found:
                log_test("Verify Deletion", True, "Aug 6 successfully deleted")
                return True
            else:
                log_test("Verify Deletion", False, "Aug 6 still exists after deletion")
                return False
        else:
            log_test("Verify Deletion", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Verify Deletion", False, f"Exception: {str(e)}")
        return False

def is_valid_date_format(date_str):
    """Check if date is in YYYY-MM-DD format with leading zeros"""
    try:
        # Check format with regex
        import re
        pattern = r'^\d{4}-\d{2}-\d{2}$'
        if not re.match(pattern, date_str):
            return False
        
        # Verify it's a valid date
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False

def test_invalid_date_missing_day_zero(token):
    """Test 2: Try to create with INVALID date (missing leading zero in day)"""
    print("\n" + "="*80)
    print("TEST 2: Create with INVALID date '2026-08-6' (missing leading zero in day)")
    print("="*80)
    
    try:
        payload = {
            "date": "2026-08-6",
            "title": "Invalid Date Test",
            "content": "This should be rejected",
            "talents": [],
            "vocations": [],
            "challenges": []
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/admin/newborn-vocation",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 422:
            data = response.json()
            error_detail = str(data.get("detail", ""))
            print(f"Validation Error: {error_detail}")
            
            # Check if error message mentions date format
            if "fecha" in error_detail.lower() or "date" in error_detail.lower() or "formato" in error_detail.lower():
                log_test("Invalid Date (2026-08-6)", True, f"Correctly rejected with 422: {error_detail}")
                return True
            else:
                log_test("Invalid Date (2026-08-6)", False, f"422 returned but error message unclear: {error_detail}")
                return False
        else:
            log_test("Invalid Date (2026-08-6)", False, f"Expected 422, got {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Invalid Date (2026-08-6)", False, f"Exception: {str(e)}")
        return False

def test_invalid_date_missing_month_zero(token):
    """Test 3: Try to create with INVALID date (missing leading zero in month)"""
    print("\n" + "="*80)
    print("TEST 3: Create with INVALID date '2026-8-06' (missing leading zero in month)")
    print("="*80)
    
    try:
        payload = {
            "date": "2026-8-06",
            "title": "Invalid Month Test",
            "content": "This should be rejected",
            "talents": [],
            "vocations": [],
            "challenges": []
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/admin/newborn-vocation",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 422:
            data = response.json()
            error_detail = str(data.get("detail", ""))
            print(f"Validation Error: {error_detail}")
            
            # Check if error message mentions date format
            if "fecha" in error_detail.lower() or "date" in error_detail.lower() or "formato" in error_detail.lower():
                log_test("Invalid Date (2026-8-06)", True, f"Correctly rejected with 422: {error_detail}")
                return True
            else:
                log_test("Invalid Date (2026-8-06)", False, f"422 returned but error message unclear: {error_detail}")
                return False
        else:
            log_test("Invalid Date (2026-8-06)", False, f"Expected 422, got {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Invalid Date (2026-8-06)", False, f"Exception: {str(e)}")
        return False

def test_valid_date_format(token):
    """Test 4: Create with VALID date format"""
    print("\n" + "="*80)
    print("TEST 4: Create with VALID date '2026-08-15' (correct format)")
    print("="*80)
    
    try:
        payload = {
            "date": "2026-08-15",
            "title": "Valid Date Test",
            "content": "This should work",
            "talents": ["Test"],
            "vocations": ["Test"],
            "challenges": []
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/admin/newborn-vocation",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify date format
            returned_date = data.get("date")
            if returned_date == "2026-08-15":
                log_test("Valid Date (2026-08-15)", True, f"Correctly accepted with 200, date={returned_date}")
                return data
            else:
                log_test("Valid Date (2026-08-15)", False, f"Date format incorrect: {returned_date}")
                return None
        else:
            log_test("Valid Date (2026-08-15)", False, f"Expected 200, got {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        log_test("Valid Date (2026-08-15)", False, f"Exception: {str(e)}")
        return None

def test_verify_all_dates_format(token):
    """Test 5: Verify ALL dates in database have correct format"""
    print("\n" + "="*80)
    print("TEST 5: Verify ALL dates match regex ^\\d{4}-\\d{2}-\\d{2}$")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/admin/newborn-vocation/all",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total vocations: {len(data)}")
            
            invalid_dates = []
            
            for vocation in data:
                date = vocation.get("date")
                title = vocation.get("title", "")
                
                # Check date format (YYYY-MM-DD with leading zeros)
                if date and not is_valid_date_format(date):
                    invalid_dates.append({"date": date, "title": title})
                    print(f"  ❌ Invalid date format: {date} (title: {title})")
                else:
                    print(f"  ✅ Valid date format: {date} (title: {title})")
            
            if not invalid_dates:
                log_test("Verify All Dates Format", True, f"All {len(data)} dates have correct format")
                return True
            else:
                log_test("Verify All Dates Format", False, f"Found {len(invalid_dates)} invalid dates: {invalid_dates}")
                return False
        else:
            log_test("Verify All Dates Format", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Verify All Dates Format", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("NEWBORN VOCATION DATE FORMAT VALIDATION TESTING")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nTesting Pydantic validator for date format (YYYY-MM-DD with leading zeros)")
    
    # Test 1: Admin Login
    token = test_admin_login()
    if not token:
        print("\n❌ CRITICAL: Admin login failed. Cannot proceed with tests.")
        return
    
    # Test 2: Invalid date (missing leading zero in day)
    test_invalid_date_missing_day_zero(token)
    
    # Test 3: Invalid date (missing leading zero in month)
    test_invalid_date_missing_month_zero(token)
    
    # Test 4: Valid date format
    test_valid_date_format(token)
    
    # Test 5: Verify all dates in database
    test_verify_all_dates_format(token)
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed_count = sum(1 for result in test_results if "✅ PASSED" in result)
    failed_count = sum(1 for result in test_results if "❌ FAILED" in result)
    total_count = len(test_results)
    
    for result in test_results:
        print(result)
    
    print("\n" + "="*80)
    print(f"TOTAL: {total_count} tests")
    print(f"PASSED: {passed_count} tests ✅")
    print(f"FAILED: {failed_count} tests ❌")
    print(f"SUCCESS RATE: {(passed_count/total_count*100):.1f}%")
    print("="*80)
    
    if failed_count == 0:
        print("\n🎉 ALL TESTS PASSED! Newborn Vocation Admin endpoints working correctly.")
    else:
        print(f"\n⚠️  {failed_count} TEST(S) FAILED. Please review the failures above.")

if __name__ == "__main__":
    main()
