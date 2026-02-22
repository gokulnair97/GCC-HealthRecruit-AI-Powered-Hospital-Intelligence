#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class GCCHealthRecruitTester:
    def __init__(self, base_url="https://saudi-med-hiring.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, status, details=""):
        """Log test result"""
        self.test_results.append({
            "test": name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}" if not endpoint.startswith("http") else endpoint
        default_headers = {'Content-Type': 'application/json'}
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - {name}")
                response_data = {}
                try:
                    response_data = response.json() if response.content else {}
                except:
                    response_data = {}
                self.log_test(name, "PASSED", f"Status: {response.status_code}")
            else:
                print(f"❌ FAILED - {name}")
                print(f"   Expected: {expected_status}, Got: {response.status_code}")
                try:
                    error_details = response.json() if response.content else {"error": "No response content"}
                    print(f"   Response: {error_details}")
                except:
                    print(f"   Response: {response.text[:200] if response.text else 'No response text'}")
                self.log_test(name, "FAILED", f"Expected {expected_status}, got {response.status_code}")
                return False, {}

            return success, response.json() if response.content else {}

        except requests.exceptions.Timeout:
            print(f"❌ TIMEOUT - {name} (30s timeout)")
            self.log_test(name, "FAILED", "Request timeout after 30 seconds")
            return False, {}
        except Exception as e:
            print(f"❌ ERROR - {name}: {str(e)}")
            self.log_test(name, "FAILED", f"Exception: {str(e)}")
            return False, {}

    def test_login_correct_credentials(self):
        """Test login with correct credentials"""
        success, response = self.run_test(
            "Login with correct credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "gokulnair.manoj@gmail.com", "password": "admin1236"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   ✅ Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login_wrong_credentials(self):
        """Test login with wrong credentials"""
        success, response = self.run_test(
            "Login with wrong credentials", 
            "POST",
            "auth/login",
            401,
            data={"email": "wrong@email.com", "password": "wrongpass"}
        )
        return success

    def test_get_hospitals_empty(self):
        """Test GET /api/hospitals returns initial data"""
        success, response = self.run_test(
            "GET /api/hospitals (initial)",
            "GET", 
            "hospitals",
            200
        )
        if success:
            print(f"   Hospitals count: {len(response.get('hospitals', []))}")
        return success

    def test_get_stats(self):
        """Test GET /api/stats"""
        success, response = self.run_test(
            "GET /api/stats",
            "GET",
            "stats", 
            200
        )
        if success:
            print(f"   Total hospitals: {response.get('total_hospitals', 0)}")
            print(f"   Countries: {len(response.get('country_stats', []))}")
            print(f"   Regions: {len(response.get('region_stats', []))}")
        return success

    def test_get_regions(self):
        """Test GET /api/regions"""
        success, response = self.run_test(
            "GET /api/regions",
            "GET",
            "regions",
            200
        )
        if success:
            regions = response.get('regions', {})
            print(f"   GCC Countries: {list(regions.keys())}")
            total_regions = sum(len(regions_list) for regions_list in regions.values())
            print(f"   Total regions: {total_regions}")
        return success

    def test_create_hospital(self):
        """Test POST /api/hospitals - create manual hospital"""
        hospital_data = {
            "name": "Test Hospital Riyadh",
            "email": "info@testhospital.com", 
            "phone": "+966 11 123 4567",
            "location": "King Fahd Road, Riyadh",
            "region": "Riyadh",
            "country": "Saudi Arabia",
            "hr_contact": "Ahmed Al-Rashid",
            "hr_email": "hr@testhospital.com",
            "department": "Human Resources",
            "website": "www.testhospital.com",
            "specialties": "Cardiology, Orthopedics"
        }
        
        success, response = self.run_test(
            "POST /api/hospitals (create manual)",
            "POST",
            "hospitals",
            200,  # Expected 200, but might be 201 
            data=hospital_data
        )
        
        if not success:
            # Try with 201 expected status
            success, response = self.run_test(
                "POST /api/hospitals (create manual - retry 201)",
                "POST", 
                "hospitals",
                201,
                data=hospital_data
            )
            
        if success and 'id' in response:
            self.test_hospital_id = response['id']
            print(f"   Created hospital ID: {self.test_hospital_id}")
        return success

    def test_get_hospitals_after_create(self):
        """Test GET /api/hospitals after creating hospital"""
        success, response = self.run_test(
            "GET /api/hospitals (after create)",
            "GET",
            "hospitals", 
            200
        )
        if success:
            hospitals = response.get('hospitals', [])
            print(f"   Total hospitals: {len(hospitals)}")
            # Look for our test hospital
            test_hospital = next((h for h in hospitals if h.get('name') == 'Test Hospital Riyadh'), None)
            if test_hospital:
                print(f"   ✅ Found test hospital: {test_hospital['name']}")
                if not hasattr(self, 'test_hospital_id'):
                    self.test_hospital_id = test_hospital['id']
            else:
                print(f"   ❌ Test hospital not found in list")
        return success

    def test_get_hospitals_filter_region(self):
        """Test GET /api/hospitals?region=Riyadh"""
        success, response = self.run_test(
            "GET /api/hospitals?region=Riyadh",
            "GET",
            "hospitals?region=Riyadh",
            200
        )
        if success:
            hospitals = response.get('hospitals', [])
            print(f"   Riyadh hospitals: {len(hospitals)}")
        return success

    def test_get_hospitals_search(self):
        """Test GET /api/hospitals?search=hospital"""
        success, response = self.run_test(
            "GET /api/hospitals?search=hospital", 
            "GET",
            "hospitals?search=hospital",
            200
        )
        if success:
            hospitals = response.get('hospitals', [])
            print(f"   Search results: {len(hospitals)}")
        return success

    def test_ai_refresh_riyadh(self):
        """Test POST /api/hospitals/refresh for Riyadh - this uses GPT-5.2"""
        print(f"\n⚠️  AI Refresh Test - This may take 10-20 seconds (GPT-5.2 call)...")
        success, response = self.run_test(
            "POST /api/hospitals/refresh (Riyadh AI)",
            "POST", 
            "hospitals/refresh",
            200,
            data={"region": "Riyadh"}
        )
        if success:
            print(f"   AI Response: {response.get('message', '')}")
            print(f"   Hospitals added: {response.get('count', 0)}")
        return success

    def test_get_hospitals_after_ai_refresh(self):
        """Test GET /api/hospitals after AI refresh"""
        success, response = self.run_test(
            "GET /api/hospitals (after AI refresh)",
            "GET",
            "hospitals",
            200
        )
        if success:
            hospitals = response.get('hospitals', [])
            print(f"   Total hospitals after AI refresh: {len(hospitals)}")
        return success

    def test_export_csv(self):
        """Test GET /api/hospitals/export/csv"""
        success, response = self.run_test(
            "GET /api/hospitals/export/csv",
            "GET", 
            "hospitals/export/csv",
            200
        )
        if success:
            print(f"   CSV export successful")
        return success

    def test_delete_hospital(self):
        """Test DELETE /api/hospitals/{id}"""
        if hasattr(self, 'test_hospital_id'):
            success, response = self.run_test(
                f"DELETE /api/hospitals/{self.test_hospital_id}",
                "DELETE",
                f"hospitals/{self.test_hospital_id}",
                200
            )
            return success
        else:
            print(f"❌ No test hospital ID available for deletion")
            return False

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"🏥 GCC HealthRecruit API Test Results")
        print(f"="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%" if self.tests_run > 0 else "N/A")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if t['status'] == 'FAILED']
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        print(f"="*60)
        return self.tests_passed == self.tests_run

def main():
    """Run all backend API tests"""
    tester = GCCHealthRecruitTester()
    
    print("🚀 Starting GCC HealthRecruit Backend API Tests")
    print(f"🌍 Base URL: {tester.base_url}")
    
    # Run tests in order
    tests = [
        tester.test_login_correct_credentials,
        tester.test_login_wrong_credentials, 
        tester.test_get_hospitals_empty,
        tester.test_get_stats,
        tester.test_get_regions,
        tester.test_create_hospital,
        tester.test_get_hospitals_after_create,
        tester.test_get_hospitals_filter_region,
        tester.test_get_hospitals_search,
        tester.test_ai_refresh_riyadh,  # This may take 10-20 seconds
        tester.test_get_hospitals_after_ai_refresh,
        tester.test_export_csv,
        tester.test_delete_hospital,
    ]
    
    # Execute tests
    for test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            tester.log_test(test_func.__name__, "FAILED", f"Exception: {str(e)}")
    
    # Print final results
    success = tester.print_summary()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())