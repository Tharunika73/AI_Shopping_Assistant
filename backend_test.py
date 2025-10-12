import requests
import sys
import json
from datetime import datetime
import time

class AIShoppingAPITester:
    def __init__(self, base_url="https://voicecart-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            details = ""
            
            if not success:
                details = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_data = response.json()
                    details += f" - {error_data}"
                except:
                    details += f" - {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            return success, response.json() if success and response.content else {}

        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.log_test(name, False, error_msg)
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        # Test root endpoint
        self.run_test("Root Endpoint", "GET", "", 200)
        
        # Test health check
        self.run_test("Health Check", "GET", "health", 200)

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test user registration
        test_user = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'user' in response:
                self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
        
        # Test user login
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'user' in response:
                self.user_id = response['user']['id']

    def test_products(self):
        """Test product endpoints"""
        print("\n" + "="*50)
        print("TESTING PRODUCT ENDPOINTS")
        print("="*50)
        
        # Test get all products
        success, response = self.run_test("Get All Products", "GET", "products", 200)
        
        product_id = None
        if success and 'data' in response and len(response['data']) > 0:
            product_id = response['data'][0]['id']
            print(f"   Found {len(response['data'])} products")
        
        # Test get products with filters
        self.run_test("Get Products with Limit", "GET", "products?limit=5", 200)
        self.run_test("Get Products with Search", "GET", "products?search=shirt", 200)
        self.run_test("Get Products with Category", "GET", "products?category=electronics", 200)
        self.run_test("Get Products with Price Filter", "GET", "products?min_price=10&max_price=100", 200)
        self.run_test("Get Products Sorted by Price", "GET", "products?sort=price_asc", 200)
        
        # Test get single product
        if product_id:
            self.run_test(f"Get Product {product_id}", "GET", f"products/{product_id}", 200)
            return product_id
        else:
            self.log_test("Get Single Product", False, "No products available to test")
            return None

    def test_cart_operations(self, product_id):
        """Test cart operations"""
        print("\n" + "="*50)
        print("TESTING CART OPERATIONS")
        print("="*50)
        
        if not self.token:
            self.log_test("Cart Operations", False, "No authentication token")
            return
        
        if not product_id:
            self.log_test("Cart Operations", False, "No product ID available")
            return
        
        # Test get empty cart
        self.run_test("Get Empty Cart", "GET", "cart", 200)
        
        # Test add to cart
        cart_data = {"product_id": product_id, "quantity": 2}
        self.run_test("Add to Cart", "POST", "cart", 200, data=cart_data)
        
        # Test get cart with items
        self.run_test("Get Cart with Items", "GET", "cart", 200)
        
        # Test update cart item
        update_data = {"product_id": product_id, "quantity": 3}
        self.run_test("Update Cart Item", "PUT", "cart", 200, data=update_data)
        
        # Test remove from cart
        self.run_test("Remove from Cart", "DELETE", f"cart/{product_id}", 200)

    def test_wishlist_operations(self, product_id):
        """Test wishlist operations"""
        print("\n" + "="*50)
        print("TESTING WISHLIST OPERATIONS")
        print("="*50)
        
        if not self.token:
            self.log_test("Wishlist Operations", False, "No authentication token")
            return
        
        if not product_id:
            self.log_test("Wishlist Operations", False, "No product ID available")
            return
        
        # Test get empty wishlist
        self.run_test("Get Empty Wishlist", "GET", "wishlist", 200)
        
        # Test add to wishlist
        wishlist_data = {"product_id": product_id}
        self.run_test("Add to Wishlist", "POST", "wishlist", 200, data=wishlist_data)
        
        # Test get wishlist with items
        self.run_test("Get Wishlist with Items", "GET", "wishlist", 200)
        
        # Test remove from wishlist
        self.run_test("Remove from Wishlist", "DELETE", f"wishlist/{product_id}", 200)

    def test_order_operations(self, product_id):
        """Test order operations"""
        print("\n" + "="*50)
        print("TESTING ORDER OPERATIONS")
        print("="*50)
        
        if not self.token:
            self.log_test("Order Operations", False, "No authentication token")
            return
        
        if not product_id:
            self.log_test("Order Operations", False, "No product ID available")
            return
        
        # First add item to cart for checkout
        cart_data = {"product_id": product_id, "quantity": 1}
        success, _ = self.run_test("Add Item for Checkout", "POST", "cart", 200, data=cart_data)
        
        if not success:
            self.log_test("Order Operations", False, "Failed to add item to cart for checkout")
            return
        
        # Test checkout
        order_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "shipping_address": {
                "fullName": "Test User",
                "address": "123 Test St",
                "city": "Test City",
                "zipCode": "12345",
                "phone": "555-0123"
            }
        }
        
        self.run_test("Checkout Order", "POST", "orders/checkout", 200, data=order_data)
        
        # Test get orders
        self.run_test("Get Orders", "GET", "orders", 200)

    def test_ai_functionality(self):
        """Test AI functionality"""
        print("\n" + "="*50)
        print("TESTING AI FUNCTIONALITY")
        print("="*50)
        
        if not self.token:
            self.log_test("AI Functionality", False, "No authentication token")
            return
        
        # Test AI query
        ai_query = {
            "query": "find me wireless headphones",
            "limit": 5
        }
        
        print("   Testing AI query (may take a few seconds)...")
        success, response = self.run_test("AI Query", "POST", "ai/query", 200, data=ai_query)
        
        if success:
            if 'reply_text' in response:
                print(f"   AI Response: {response['reply_text'][:100]}...")
            if 'results' in response:
                print(f"   Found {len(response['results'])} product results")

    def test_admin_operations(self):
        """Test admin operations"""
        print("\n" + "="*50)
        print("TESTING ADMIN OPERATIONS")
        print("="*50)
        
        # Test product sync
        print("   Testing product sync (may take a few seconds)...")
        self.run_test("Sync Products", "POST", "admin/sync-products", 200)

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting AI Shopping Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test basic connectivity first
        self.test_health_endpoints()
        
        # Test admin operations (sync products)
        self.test_admin_operations()
        
        # Test authentication
        self.test_authentication()
        
        # Test products (get a product ID for other tests)
        product_id = self.test_products()
        
        # Test cart operations
        self.test_cart_operations(product_id)
        
        # Test wishlist operations
        self.test_wishlist_operations(product_id)
        
        # Test order operations
        self.test_order_operations(product_id)
        
        # Test AI functionality
        self.test_ai_functionality()
        
        # Print final results
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['name']}: {result['details']}")
        
        print(f"\n⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test function"""
    tester = AIShoppingAPITester()
    success = tester.run_all_tests()
    
    # Save test results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'failed_tests': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())