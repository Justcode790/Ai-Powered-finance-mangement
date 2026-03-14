"""
Test spending forecast functionality
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def generate_test_transactions():
    """Generate 4 months of test transaction data"""
    transactions = []
    categories = ['rent', 'food', 'transport', 'entertainment', 'shopping']
    
    # Generate transactions for the past 4 months
    for month_offset in range(4):
        date = datetime.now() - timedelta(days=30 * (3 - month_offset))
        
        # Add transactions for each category
        transactions.append({
            "transactionId": f"txn_rent_{month_offset}",
            "category": "rent",
            "amount": 8000 + (month_offset * 200),  # Slightly increasing
            "date": date.isoformat()
        })
        
        transactions.append({
            "transactionId": f"txn_food_{month_offset}",
            "category": "food",
            "amount": 3000 + (month_offset * 100),
            "date": date.isoformat()
        })
        
        transactions.append({
            "transactionId": f"txn_transport_{month_offset}",
            "category": "transport",
            "amount": 1500 - (month_offset * 50),  # Slightly decreasing
            "date": date.isoformat()
        })
        
        transactions.append({
            "transactionId": f"txn_entertainment_{month_offset}",
            "category": "entertainment",
            "amount": 2000,  # Stable
            "date": date.isoformat()
        })
        
        transactions.append({
            "transactionId": f"txn_shopping_{month_offset}",
            "category": "shopping",
            "amount": 1500 + (month_offset * 300),  # Increasing
            "date": date.isoformat()
        })
    
    return transactions


def test_forecast_endpoint():
    """Test the forecast spending endpoint"""
    print("Testing /ml/forecast/spending endpoint...")
    
    # Generate test data
    transactions = generate_test_transactions()
    
    # Test case 1: Basic forecast without goals
    print("\n1. Testing basic forecast (no goals, no income)...")
    payload = {
        "userId": "test_user_1",
        "transactions": transactions,
        "goals": []
    }
    
    response = requests.post(f"{BASE_URL}/ml/forecast/spending", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        # Verify response structure
        assert 'forecasts' in result, "Missing 'forecasts' in response"
        assert 'totalExpected' in result, "Missing 'totalExpected' in response"
        assert 'requiredSavings' in result, "Missing 'requiredSavings' in response"
        
        # Verify all categories are present
        expected_categories = ['rent', 'food', 'transport', 'entertainment', 'shopping', 'education', 'misc']
        for category in expected_categories:
            assert category in result['forecasts'], f"Missing category: {category}"
            forecast = result['forecasts'][category]
            assert 'min' in forecast, f"Missing 'min' for {category}"
            assert 'expected' in forecast, f"Missing 'expected' for {category}"
            assert 'max' in forecast, f"Missing 'max' for {category}"
            assert forecast['min'] <= forecast['expected'] <= forecast['max'], \
                f"Invalid range for {category}: {forecast}"
        
        print("✓ Basic forecast test passed")
    else:
        print(f"Error: {response.text}")
        return False
    
    # Test case 2: Forecast with goals
    print("\n2. Testing forecast with goals...")
    future_date = (datetime.now() + timedelta(days=180)).isoformat()
    payload = {
        "userId": "test_user_2",
        "transactions": transactions,
        "goals": [
            {
                "name": "Emergency Fund",
                "targetAmount": 50000,
                "currentAmount": 20000,
                "deadline": future_date
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/ml/forecast/spending", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        # Verify required savings is calculated
        assert result['requiredSavings'] > 0, "Required savings should be > 0 with active goals"
        print(f"✓ Required savings calculated: ₹{result['requiredSavings']}")
    else:
        print(f"Error: {response.text}")
        return False
    
    # Test case 3: Forecast with income (should trigger warning)
    print("\n3. Testing forecast with income (warning scenario)...")
    payload = {
        "userId": "test_user_3",
        "transactions": transactions,
        "goals": [],
        "income": 10000  # Low income to trigger warning
    }
    
    response = requests.post(f"{BASE_URL}/ml/forecast/spending", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        # Check if warning is present when spending exceeds income
        if result['totalExpected'] > 10000:
            assert 'warning' in result, "Warning should be present when spending exceeds income"
            print(f"✓ Warning triggered: {result['warning']}")
        else:
            print("✓ No warning needed (spending within income)")
    else:
        print(f"Error: {response.text}")
        return False
    
    # Test case 4: Insufficient data
    print("\n4. Testing insufficient transaction history...")
    payload = {
        "userId": "test_user_4",
        "transactions": transactions[:2],  # Only 2 transactions
        "goals": []
    }
    
    response = requests.post(f"{BASE_URL}/ml/forecast/spending", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        assert 'error' in result, "Should return error for insufficient data"
        print("✓ Insufficient data error handled correctly")
    else:
        print(f"Error: {response.text}")
        return False
    
    print("\n✅ All forecast tests passed!")
    return True


def test_monitoring_endpoint():
    """Test the forecast accuracy monitoring endpoint"""
    print("\n\nTesting /ml/monitoring/forecast-accuracy endpoint...")
    
    response = requests.get(f"{BASE_URL}/ml/monitoring/forecast-accuracy")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        # Verify response structure
        assert 'totalForecasts' in result, "Missing 'totalForecasts'"
        assert 'evaluatedForecasts' in result, "Missing 'evaluatedForecasts'"
        
        print("✓ Monitoring endpoint test passed")
        return True
    else:
        print(f"Error: {response.text}")
        return False


if __name__ == "__main__":
    print("Starting ML Service Forecast Tests")
    print("=" * 50)
    
    try:
        # Test forecast endpoint
        if test_forecast_endpoint():
            # Test monitoring endpoint
            test_monitoring_endpoint()
            print("\n" + "=" * 50)
            print("All tests completed successfully! ✅")
        else:
            print("\n" + "=" * 50)
            print("Some tests failed ❌")
    except Exception as e:
        print(f"\nTest failed with exception: {e}")
        import traceback
        traceback.print_exc()
