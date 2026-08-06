#!/usr/bin/env python3
"""
Backend Test Suite for MetaQi Academy
Testing BaZi Reports Multiple-Reports-Per-User Functionality
"""

import requests
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://feng-shui-learn.preview.emergentagent.com/api"
ADMIN_EMAIL = "nnikholk@gmail.com"
ADMIN_PASSWORD = "admin123"

def print_test_header(test_num, description):
    """Print formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print(f"{'='*80}")

def print_result(success, message):
    """Print test result"""
    status = "✅ PASSED" if success else "❌ FAILED"
    print(f"{status}: {message}")

def test_admin_login():
    """Test 1: Admin Login"""
    print_test_header(1, "Admin Login")
    
    try:
        print(f"\n📝 POST {BACKEND_URL}/auth/login")
        print(f"   Body: {{'email': '{ADMIN_EMAIL}', 'password': '***'}}")
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        if response.status_code != 200:
            print_result(False, f"Login failed: {response.status_code} - {response.text}")
            return False, None
        
        data = response.json()
        token = data.get("access_token")
        
        print(f"   ✓ Status: 200 OK")
        print(f"   ✓ Token type: {data.get('token_type')}")
        print(f"   ✓ Access token: {token[:30]}...")
        print(f"   ✓ User email: {data.get('user', {}).get('email')}")
        print(f"   ✓ User role: {data.get('user', {}).get('role')}")
        
        print_result(True, "Admin login successful, JWT token obtained")
        return True, token
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False, None

def test_create_first_report(token):
    """Test 2: Create First BaZi Report for User"""
    print_test_header(2, "Create First BaZi Report for User")
    
    try:
        print(f"\n📝 POST {BACKEND_URL}/admin/bazi-reports")
        print(f"   Headers: Authorization: Bearer {token[:30]}...")
        
        report_data = {
            "user_email": ADMIN_EMAIL,
            "report_content": "Test BaZi Report #1 - This is the first report for testing multiple reports per user functionality.",
            "is_published": True
        }
        print(f"   Body: {json.dumps(report_data, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/admin/bazi-reports",
            headers={"Authorization": f"Bearer {token}"},
            json=report_data
        )
        
        if response.status_code != 200:
            print_result(False, f"Create report failed: {response.status_code} - {response.text}")
            return False, None
        
        data = response.json()
        report_id = data.get("id")
        
        print(f"   ✓ Status: 200 OK")
        print(f"   ✓ Report ID: {report_id}")
        print(f"   ✓ User email: {data.get('user_email')}")
        print(f"   ✓ Is published: {data.get('is_published')}")
        print(f"   ✓ Report content length: {len(data.get('report_content', ''))} chars")
        
        print_result(True, f"First report created successfully with ID: {report_id}")
        return True, report_id
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False, None

def test_create_second_report(token):
    """Test 3: Create SECOND BaZi Report for SAME User (Critical Test)"""
    print_test_header(3, "Create SECOND BaZi Report for SAME User (Should NOT Return 400)")
    
    try:
        print(f"\n📝 POST {BACKEND_URL}/admin/bazi-reports")
        print(f"   Headers: Authorization: Bearer {token[:30]}...")
        print(f"   ⚠️  CRITICAL: Creating second report for SAME user ({ADMIN_EMAIL})")
        
        report_data = {
            "user_email": ADMIN_EMAIL,
            "report_content": "Test BaZi Report #2 - This is the SECOND report for the same user. This proves multiple reports per user works!",
            "is_published": True
        }
        print(f"   Body: {json.dumps(report_data, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/admin/bazi-reports",
            headers={"Authorization": f"Bearer {token}"},
            json=report_data
        )
        
        if response.status_code == 400:
            print(f"   ❌ Status: 400 Bad Request")
            print(f"   ❌ Response: {response.text}")
            print_result(False, "CRITICAL BUG: Cannot create multiple reports per user (returns 400)")
            return False, None
        
        if response.status_code != 200:
            print_result(False, f"Create second report failed: {response.status_code} - {response.text}")
            return False, None
        
        data = response.json()
        report_id = data.get("id")
        
        print(f"   ✓ Status: 200 OK")
        print(f"   ✓ Report ID: {report_id}")
        print(f"   ✓ User email: {data.get('user_email')}")
        print(f"   ✓ Is published: {data.get('is_published')}")
        print(f"   ✓ Report content length: {len(data.get('report_content', ''))} chars")
        
        print_result(True, f"SECOND report created successfully with DIFFERENT ID: {report_id}")
        return True, report_id
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False, None

def test_search_user_reports(token):
    """Test 4: Search User Reports (Should Return Array)"""
    print_test_header(4, "Search User Reports - GET /admin/bazi-reports/search")
    
    try:
        print(f"\n📝 GET {BACKEND_URL}/admin/bazi-reports/search?email={ADMIN_EMAIL}")
        print(f"   Headers: Authorization: Bearer {token[:30]}...")
        
        response = requests.get(
            f"{BACKEND_URL}/admin/bazi-reports/search",
            headers={"Authorization": f"Bearer {token}"},
            params={"email": ADMIN_EMAIL}
        )
        
        if response.status_code != 200:
            print_result(False, f"Search failed: {response.status_code} - {response.text}")
            return False, []
        
        data = response.json()
        reports = data.get("reports", [])
        user = data.get("user", {})
        
        print(f"   ✓ Status: 200 OK")
        print(f"   ✓ User ID: {user.get('id')}")
        print(f"   ✓ User email: {user.get('email')}")
        print(f"   ✓ User name: {user.get('name')}")
        print(f"   ✓ Reports count: {len(reports)}")
        
        if not isinstance(reports, list):
            print_result(False, f"CRITICAL: 'reports' is not an array, it's a {type(reports).__name__}")
            return False, []
        
        if len(reports) < 2:
            print(f"   ⚠️  WARNING: Expected at least 2 reports, found {len(reports)}")
        
        for idx, report in enumerate(reports, 1):
            print(f"\n   Report #{idx}:")
            print(f"      - ID: {report.get('id')}")
            print(f"      - Content preview: {report.get('report_content', '')[:60]}...")
            print(f"      - Is published: {report.get('is_published')}")
        
        print_result(True, f"Search returned {len(reports)} reports as an array")
        return True, reports
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False, []

def test_get_my_bazi_reports(token):
    """Test 5: Get My BaZi Reports (Should Return Array)"""
    print_test_header(5, "Get My BaZi Reports - GET /my-bazi-report")
    
    try:
        print(f"\n📝 GET {BACKEND_URL}/my-bazi-report")
        print(f"   Headers: Authorization: Bearer {token[:30]}...")
        
        response = requests.get(
            f"{BACKEND_URL}/my-bazi-report",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            print_result(False, f"Get my reports failed: {response.status_code} - {response.text}")
            return False
        
        data = response.json()
        has_reports = data.get("has_reports")
        reports = data.get("reports", [])
        
        print(f"   ✓ Status: 200 OK")
        print(f"   ✓ has_reports: {has_reports}")
        print(f"   ✓ reports count: {len(reports)}")
        
        # Check for old single-report structure
        if "report" in data and not isinstance(data["report"], list):
            print_result(False, "CRITICAL: Response has 'report' (singular) instead of 'reports' (plural)")
            return False
        
        if not isinstance(reports, list):
            print_result(False, f"CRITICAL: 'reports' is not an array, it's a {type(reports).__name__}")
            return False
        
        if has_reports and len(reports) == 0:
            print_result(False, "CRITICAL: has_reports=true but reports array is empty")
            return False
        
        if len(reports) < 2:
            print(f"   ⚠️  WARNING: Expected at least 2 reports, found {len(reports)}")
        
        for idx, report in enumerate(reports, 1):
            print(f"\n   Report #{idx}:")
            print(f"      - ID: {report.get('id')}")
            print(f"      - Content preview: {report.get('report_content', '')[:60]}...")
            print(f"      - Is published: {report.get('is_published')}")
        
        print_result(True, f"Endpoint returns has_reports={has_reports} and {len(reports)} reports as array")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_update_specific_report(token, report_id):
    """Test 6: Update Specific Report by ID"""
    print_test_header(6, "Update Specific Report by ID")
    
    try:
        print(f"\n📝 PUT {BACKEND_URL}/admin/bazi-reports/{report_id}")
        print(f"   Headers: Authorization: Bearer {token[:30]}...")
        
        update_data = {
            "report_content": "UPDATED: This report has been updated to verify the PUT endpoint works correctly.",
            "is_published": True
        }
        print(f"   Body: {json.dumps(update_data, indent=2)}")
        
        response = requests.put(
            f"{BACKEND_URL}/admin/bazi-reports/{report_id}",
            headers={"Authorization": f"Bearer {token}"},
            json=update_data
        )
        
        if response.status_code != 200:
            print_result(False, f"Update report failed: {response.status_code} - {response.text}")
            return False
        
        data = response.json()
        
        print(f"   ✓ Status: 200 OK")
        print(f"   ✓ Report ID: {data.get('id')}")
        print(f"   ✓ Updated content: {data.get('report_content')[:80]}...")
        print(f"   ✓ Is published: {data.get('is_published')}")
        
        if data.get('id') != report_id:
            print_result(False, f"CRITICAL: Report ID changed after update (was {report_id}, now {data.get('id')})")
            return False
        
        if "UPDATED:" not in data.get('report_content', ''):
            print_result(False, "CRITICAL: Report content was not updated")
            return False
        
        print_result(True, f"Report {report_id} updated successfully")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("BAZI REPORTS MULTIPLE-REPORTS-PER-USER TEST SUITE")
    print("Testing: Admin can create multiple BaZi reports for a single user")
    print("="*80)
    
    results = {}
    
    # Test 1: Admin Login
    success, token = test_admin_login()
    results["Test 1: Admin Login"] = success
    
    if not success or not token:
        print("\n❌ CRITICAL: Cannot proceed without admin token")
        return
    
    # Test 2: Create First Report
    success, first_report_id = test_create_first_report(token)
    results["Test 2: Create First Report"] = success
    
    # Test 3: Create Second Report (CRITICAL TEST)
    success, second_report_id = test_create_second_report(token)
    results["Test 3: Create SECOND Report for SAME User"] = success
    
    # Test 4: Search User Reports
    success, reports = test_search_user_reports(token)
    results["Test 4: Search User Reports (Returns Array)"] = success
    
    # Test 5: Get My BaZi Reports
    success = test_get_my_bazi_reports(token)
    results["Test 5: Get My BaZi Reports (Returns Array)"] = success
    
    # Test 6: Update Specific Report
    if first_report_id:
        success = test_update_specific_report(token, first_report_id)
        results["Test 6: Update Specific Report by ID"] = success
    else:
        results["Test 6: Update Specific Report by ID"] = False
        print_result(False, "Skipped - no report ID available")
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    print(f"{'='*80}")
    
    # Critical Validations
    print("\n" + "="*80)
    print("CRITICAL VALIDATIONS")
    print("="*80)
    
    critical_checks = {
        "✅ Creating multiple reports for same user does NOT return 400": results.get("Test 3: Create SECOND Report for SAME User", False),
        "✅ Search endpoint returns 'reports' array (not single 'report')": results.get("Test 4: Search User Reports (Returns Array)", False),
        "✅ /my-bazi-report returns 'has_reports' and 'reports' (plural)": results.get("Test 5: Get My BaZi Reports (Returns Array)", False),
        "✅ Can update specific report by ID": results.get("Test 6: Update Specific Report by ID", False),
    }
    
    for check, passed in critical_checks.items():
        print(check if passed else check.replace("✅", "❌"))
    
    all_critical_passed = all(critical_checks.values())
    print(f"\n{'='*80}")
    if all_critical_passed:
        print("🎉 ALL CRITICAL VALIDATIONS PASSED - MULTIPLE REPORTS PER USER WORKING!")
    else:
        print("⚠️ SOME CRITICAL VALIDATIONS FAILED - REVIEW FAILED TESTS")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
