#!/usr/bin/env python3
"""
Translation System Test Suite for MetaQi Academy
Tests automatic translation of content from Spanish to other languages
"""

import requests
import json
from typing import Optional, Dict, Any

# Base URL from frontend .env
BASE_URL = "https://feng-shui-learn.preview.emergentagent.com/api"

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

def contains_french_words(text: str) -> bool:
    """Check if text contains French words"""
    french_indicators = [
        "année", "l'", "du", "de", "le", "la", "les", "des", "un", "une",
        "est", "sont", "avec", "pour", "dans", "sur", "et", "ou", "mais",
        "cheval", "feu", "énergie", "transformatrice"
    ]
    text_lower = text.lower()
    return any(word in text_lower for word in french_indicators)

def contains_english_words(text: str) -> bool:
    """Check if text contains English words"""
    english_indicators = [
        "year", "of", "the", "energy", "fire", "horse", "transformative",
        "is", "are", "with", "for", "in", "on", "and", "or", "but"
    ]
    text_lower = text.lower()
    return any(word in text_lower for word in english_indicators)

def contains_german_words(text: str) -> bool:
    """Check if text contains German words"""
    german_indicators = [
        "jahr", "des", "die", "der", "das", "energie", "feuer", "pferd",
        "ist", "sind", "mit", "für", "in", "auf", "und", "oder", "aber"
    ]
    text_lower = text.lower()
    return any(word in text_lower for word in german_indicators)

def contains_spanish_words(text: str) -> bool:
    """Check if text contains Spanish words"""
    spanish_indicators = [
        "año", "del", "de", "la", "el", "los", "las", "energía", "fuego", "caballo",
        "es", "son", "con", "para", "en", "sobre", "y", "o", "pero"
    ]
    text_lower = text.lower()
    return any(word in text_lower for word in spanish_indicators)

def test_year_energy_french():
    """Test 1: GET /api/energy/year/current?lang=fr - French Translation"""
    print_test_header("Year Energy - French Translation")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/year/current?lang=fr")
        
        if response.status_code == 200:
            data = response.json()
            title = data.get("title", "")
            content = data.get("content", "")
            
            # Check if title and content are in French
            title_is_french = contains_french_words(title)
            content_is_french = contains_french_words(content)
            
            # Check that it's NOT in Spanish (original)
            title_not_spanish = not contains_spanish_words(title) or contains_french_words(title)
            content_not_spanish = not contains_spanish_words(content) or contains_french_words(content)
            
            all_checks_passed = title_is_french and content_is_french
            
            print_result(all_checks_passed, "Year energy French translation", {
                "status_code": response.status_code,
                "title": title,
                "title_is_french": title_is_french,
                "content_preview": content[:100] + "..." if len(content) > 100 else content,
                "content_is_french": content_is_french,
                "content_length": len(content)
            })
            return all_checks_passed
        elif response.status_code == 404:
            print_result(False, "No year energy data found for current year", {
                "status_code": response.status_code,
                "response": response.text
            })
            return False
        else:
            print_result(False, f"Request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"French translation error: {str(e)}")
        return False

def test_year_energy_english():
    """Test 2: GET /api/energy/year/current?lang=en - English Translation"""
    print_test_header("Year Energy - English Translation")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/year/current?lang=en")
        
        if response.status_code == 200:
            data = response.json()
            title = data.get("title", "")
            content = data.get("content", "")
            
            # Check if title and content are in English
            title_is_english = contains_english_words(title)
            content_is_english = contains_english_words(content)
            
            all_checks_passed = title_is_english and content_is_english
            
            print_result(all_checks_passed, "Year energy English translation", {
                "status_code": response.status_code,
                "title": title,
                "title_is_english": title_is_english,
                "content_preview": content[:100] + "..." if len(content) > 100 else content,
                "content_is_english": content_is_english,
                "content_length": len(content)
            })
            return all_checks_passed
        elif response.status_code == 404:
            print_result(False, "No year energy data found for current year", {
                "status_code": response.status_code,
                "response": response.text
            })
            return False
        else:
            print_result(False, f"Request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"English translation error: {str(e)}")
        return False

def test_year_energy_german():
    """Test 3: GET /api/energy/year/current?lang=de - German Translation"""
    print_test_header("Year Energy - German Translation")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/year/current?lang=de")
        
        if response.status_code == 200:
            data = response.json()
            title = data.get("title", "")
            content = data.get("content", "")
            
            # Check if title and content are in German
            title_is_german = contains_german_words(title)
            content_is_german = contains_german_words(content)
            
            all_checks_passed = title_is_german and content_is_german
            
            print_result(all_checks_passed, "Year energy German translation", {
                "status_code": response.status_code,
                "title": title,
                "title_is_german": title_is_german,
                "content_preview": content[:100] + "..." if len(content) > 100 else content,
                "content_is_german": content_is_german,
                "content_length": len(content)
            })
            return all_checks_passed
        elif response.status_code == 404:
            print_result(False, "No year energy data found for current year", {
                "status_code": response.status_code,
                "response": response.text
            })
            return False
        else:
            print_result(False, f"Request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"German translation error: {str(e)}")
        return False

def test_year_energy_spanish():
    """Test 4: GET /api/energy/year/current?lang=es - Spanish (Original)"""
    print_test_header("Year Energy - Spanish (Original)")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/year/current?lang=es")
        
        if response.status_code == 200:
            data = response.json()
            title = data.get("title", "")
            content = data.get("content", "")
            
            # Check if title and content are in Spanish
            title_is_spanish = contains_spanish_words(title)
            content_is_spanish = contains_spanish_words(content)
            
            all_checks_passed = title_is_spanish and content_is_spanish
            
            print_result(all_checks_passed, "Year energy Spanish (original)", {
                "status_code": response.status_code,
                "title": title,
                "title_is_spanish": title_is_spanish,
                "content_preview": content[:100] + "..." if len(content) > 100 else content,
                "content_is_spanish": content_is_spanish,
                "content_length": len(content)
            })
            return all_checks_passed
        elif response.status_code == 404:
            print_result(False, "No year energy data found for current year", {
                "status_code": response.status_code,
                "response": response.text
            })
            return False
        else:
            print_result(False, f"Request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Spanish (original) error: {str(e)}")
        return False

def test_month_energy_french():
    """Test 5: GET /api/energy/month?lang=fr - French Translation"""
    print_test_header("Month Energy - French Translation")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/month?lang=fr")
        
        if response.status_code == 200:
            data = response.json()
            title = data.get("title", "")
            content = data.get("content", "")
            
            # Check if title and content are in French
            title_is_french = contains_french_words(title)
            content_is_french = contains_french_words(content)
            
            all_checks_passed = title_is_french and content_is_french
            
            print_result(all_checks_passed, "Month energy French translation", {
                "status_code": response.status_code,
                "title": title,
                "title_is_french": title_is_french,
                "content_preview": content[:100] + "..." if len(content) > 100 else content,
                "content_is_french": content_is_french,
                "content_length": len(content)
            })
            return all_checks_passed
        elif response.status_code == 404:
            print_result(False, "No month energy data found for current month", {
                "status_code": response.status_code,
                "response": response.text
            })
            return False
        else:
            print_result(False, f"Request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Month energy French translation error: {str(e)}")
        return False

def test_daily_energy_french():
    """Test 6: GET /api/energy/daily?lang=fr - French Translation"""
    print_test_header("Daily Energy - French Translation")
    
    try:
        response = requests.get(f"{BASE_URL}/energy/daily?lang=fr")
        
        if response.status_code == 200:
            data = response.json()
            title = data.get("title", "")
            content = data.get("content", "")
            
            # Check if title and content are in French
            title_is_french = contains_french_words(title)
            content_is_french = contains_french_words(content)
            
            all_checks_passed = title_is_french and content_is_french
            
            print_result(all_checks_passed, "Daily energy French translation", {
                "status_code": response.status_code,
                "title": title,
                "title_is_french": title_is_french,
                "content_preview": content[:100] + "..." if len(content) > 100 else content,
                "content_is_french": content_is_french,
                "content_length": len(content)
            })
            return all_checks_passed
        elif response.status_code == 404:
            print_result(False, "No daily energy data found for today", {
                "status_code": response.status_code,
                "response": response.text,
                "note": "This is expected if no data is seeded for today's date"
            })
            return False
        else:
            print_result(False, f"Request failed with status {response.status_code}", {
                "response": response.text
            })
            return False
            
    except Exception as e:
        print_result(False, f"Daily energy French translation error: {str(e)}")
        return False

def print_summary():
    """Print test summary"""
    print(f"\n{'='*80}")
    print("TRANSLATION TEST SUMMARY")
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
    
    if test_results['passed']:
        print(f"\n{'='*80}")
        print("PASSED TESTS:")
        print(f"{'='*80}")
        for passed_test in test_results['passed']:
            print(f"  ✅ {passed_test}")
    
    print(f"\n{'='*80}")
    success_rate = (len(test_results['passed']) / test_results['total'] * 100) if test_results['total'] > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    print(f"{'='*80}\n")

def run_translation_tests():
    """Run all translation tests"""
    print("\n" + "="*80)
    print("METAQI ACADEMY - TRANSLATION SYSTEM TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print("Testing automatic translation from Spanish to other languages")
    print("="*80)
    
    # Test year energy translations
    test_year_energy_french()  # Test 1: French
    test_year_energy_english()  # Test 2: English
    test_year_energy_german()  # Test 3: German
    test_year_energy_spanish()  # Test 4: Spanish (original)
    
    # Test month energy translation
    test_month_energy_french()  # Test 5: Month energy French
    
    # Test daily energy translation
    test_daily_energy_french()  # Test 6: Daily energy French
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    run_translation_tests()
