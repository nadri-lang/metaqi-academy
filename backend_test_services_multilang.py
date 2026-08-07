#!/usr/bin/env python3
"""
Backend API Testing Script for MetaQi Academy - Services Multilanguage Implementation
Tests the translation system for custom services
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
service_id = None

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

def test_create_service_with_translations(token):
    """Test 2: Create a service with translations"""
    print("\n" + "="*80)
    print("TEST 2: Create Service with Translations (en, fr)")
    print("="*80)
    
    try:
        payload = {
            "title": "Servicio de Prueba",
            "description": "Descripción en español",
            "includes": ["Característica 1", "Característica 2"],
            "translations": {
                "en": {
                    "title": "Test Service",
                    "description": "Description in English",
                    "includes": ["Feature 1", "Feature 2"]
                },
                "fr": {
                    "title": "Service de Test",
                    "description": "Description en français",
                    "includes": ["Fonctionnalité 1", "Fonctionnalité 2"]
                }
            },
            "price": 50.0,
            "is_active": True
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/services",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            global service_id
            service_id = data.get("id")
            
            # Verify translations object is stored
            translations = data.get("translations", {})
            has_en = "en" in translations
            has_fr = "fr" in translations
            
            if service_id and has_en and has_fr:
                log_test("Create Service with Translations", True, 
                        f"Service created with ID={service_id}, translations stored (en, fr)")
                return service_id
            else:
                log_test("Create Service with Translations", False, 
                        f"Missing data: id={service_id}, has_en={has_en}, has_fr={has_fr}")
                return None
        else:
            log_test("Create Service with Translations", False, 
                    f"Status {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        log_test("Create Service with Translations", False, f"Exception: {str(e)}")
        return None

def test_get_services_spanish():
    """Test 3: GET /api/services?lang=es (Spanish - default)"""
    print("\n" + "="*80)
    print("TEST 3: GET /api/services?lang=es (Spanish - default)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/services?lang=es",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total services: {len(data)}")
            
            # Find our test service
            test_service = None
            for service in data:
                if service.get("id") == service_id:
                    test_service = service
                    break
            
            if test_service:
                title = test_service.get("title")
                description = test_service.get("description")
                includes = test_service.get("includes", [])
                
                print(f"Title: {title}")
                print(f"Description: {description}")
                print(f"Includes: {includes}")
                
                # Verify Spanish content
                if title == "Servicio de Prueba" and "español" in description:
                    log_test("GET Services Spanish", True, 
                            f"Spanish content returned correctly: title='{title}'")
                    return True
                else:
                    log_test("GET Services Spanish", False, 
                            f"Spanish content incorrect: title='{title}', description='{description}'")
                    return False
            else:
                log_test("GET Services Spanish", False, f"Test service not found in list")
                return False
        else:
            log_test("GET Services Spanish", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET Services Spanish", False, f"Exception: {str(e)}")
        return False

def test_get_services_english():
    """Test 4: GET /api/services?lang=en (English)"""
    print("\n" + "="*80)
    print("TEST 4: GET /api/services?lang=en (English)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/services?lang=en",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total services: {len(data)}")
            
            # Find our test service
            test_service = None
            for service in data:
                if service.get("id") == service_id:
                    test_service = service
                    break
            
            if test_service:
                title = test_service.get("title")
                description = test_service.get("description")
                includes = test_service.get("includes", [])
                
                print(f"Title: {title}")
                print(f"Description: {description}")
                print(f"Includes: {includes}")
                
                # Verify English content
                if (title == "Test Service" and 
                    "English" in description and 
                    "Feature 1" in includes):
                    log_test("GET Services English", True, 
                            f"English translation applied correctly: title='{title}', includes={includes}")
                    return True
                else:
                    log_test("GET Services English", False, 
                            f"English translation incorrect: title='{title}', description='{description}', includes={includes}")
                    return False
            else:
                log_test("GET Services English", False, f"Test service not found in list")
                return False
        else:
            log_test("GET Services English", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET Services English", False, f"Exception: {str(e)}")
        return False

def test_get_services_french():
    """Test 5: GET /api/services?lang=fr (French)"""
    print("\n" + "="*80)
    print("TEST 5: GET /api/services?lang=fr (French)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/services?lang=fr",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total services: {len(data)}")
            
            # Find our test service
            test_service = None
            for service in data:
                if service.get("id") == service_id:
                    test_service = service
                    break
            
            if test_service:
                title = test_service.get("title")
                description = test_service.get("description")
                includes = test_service.get("includes", [])
                
                print(f"Title: {title}")
                print(f"Description: {description}")
                print(f"Includes: {includes}")
                
                # Verify French content
                if (title == "Service de Test" and 
                    "français" in description):
                    log_test("GET Services French", True, 
                            f"French translation applied correctly: title='{title}'")
                    return True
                else:
                    log_test("GET Services French", False, 
                            f"French translation incorrect: title='{title}', description='{description}'")
                    return False
            else:
                log_test("GET Services French", False, f"Test service not found in list")
                return False
        else:
            log_test("GET Services French", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET Services French", False, f"Exception: {str(e)}")
        return False

def test_get_services_german_fallback():
    """Test 6: GET /api/services?lang=de (German - no translation, should fallback to Spanish)"""
    print("\n" + "="*80)
    print("TEST 6: GET /api/services?lang=de (German - fallback to Spanish)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/services?lang=de",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total services: {len(data)}")
            
            # Find our test service
            test_service = None
            for service in data:
                if service.get("id") == service_id:
                    test_service = service
                    break
            
            if test_service:
                title = test_service.get("title")
                description = test_service.get("description")
                
                print(f"Title: {title}")
                print(f"Description: {description}")
                
                # Verify fallback to Spanish (original)
                if title == "Servicio de Prueba" and "español" in description:
                    log_test("GET Services German (Fallback)", True, 
                            f"Correctly fell back to Spanish: title='{title}'")
                    return True
                else:
                    log_test("GET Services German (Fallback)", False, 
                            f"Fallback incorrect: title='{title}', description='{description}'")
                    return False
            else:
                log_test("GET Services German (Fallback)", False, f"Test service not found in list")
                return False
        else:
            log_test("GET Services German (Fallback)", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET Services German (Fallback)", False, f"Exception: {str(e)}")
        return False

def test_get_service_by_id_english():
    """Test 7: GET /api/services/{service_id}?lang=en (Single service in English)"""
    print("\n" + "="*80)
    print(f"TEST 7: GET /api/services/{service_id}?lang=en (Single service in English)")
    print("="*80)
    
    if not service_id:
        log_test("GET Service by ID English", False, "No service_id available")
        return False
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/services/{service_id}?lang=en",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            title = data.get("title")
            description = data.get("description")
            includes = data.get("includes", [])
            
            print(f"Title: {title}")
            print(f"Description: {description}")
            print(f"Includes: {includes}")
            
            # Verify English content
            if (title == "Test Service" and 
                "English" in description and 
                "Feature 1" in includes):
                log_test("GET Service by ID English", True, 
                        f"English translation applied correctly for single service")
                return True
            else:
                log_test("GET Service by ID English", False, 
                        f"English translation incorrect: title='{title}', description='{description}'")
                return False
        else:
            log_test("GET Service by ID English", False, f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET Service by ID English", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("SERVICES MULTILANGUAGE IMPLEMENTATION TESTING")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nTesting CustomService translations object and lang parameter")
    
    # Test 1: Admin Login
    token = test_admin_login()
    if not token:
        print("\n❌ CRITICAL: Admin login failed. Cannot proceed with tests.")
        return
    
    # Test 2: Create service with translations
    created_service_id = test_create_service_with_translations(token)
    if not created_service_id:
        print("\n❌ CRITICAL: Service creation failed. Cannot proceed with tests.")
        return
    
    # Test 3: GET services in Spanish (default)
    test_get_services_spanish()
    
    # Test 4: GET services in English
    test_get_services_english()
    
    # Test 5: GET services in French
    test_get_services_french()
    
    # Test 6: GET services in German (fallback to Spanish)
    test_get_services_german_fallback()
    
    # Test 7: GET single service by ID in English
    test_get_service_by_id_english()
    
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
        print("\n🎉 ALL TESTS PASSED! Services multilanguage implementation working correctly.")
    else:
        print(f"\n⚠️  {failed_count} TEST(S) FAILED. Please review the failures above.")

if __name__ == "__main__":
    main()
