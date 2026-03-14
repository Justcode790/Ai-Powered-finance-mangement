"""
Comprehensive test for Task 13: Implement spending forecast in ML service
Tests all sub-tasks:
- 13.1: Create spending forecaster endpoint
- 13.2: Implement time series forecasting per category
- 13.4: Implement forecast validation and warnings
- 13.6: Implement forecast accuracy tracking
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def generate_monthly_transactions(months=4):
    """Generate realistic monthly transaction data"""
    transactions = []
    base_date = datetime.now() - timedelta(days=30 * months)
    
    for month in range(months):
        month_date = base_date + timedelta(days=30 * month)
        
        # Rent - stable
        transactions.append({
            "transactionId": f"rent_{month}",
            "category": "rent",
            "amount": 8000,
            "date": month_date.isoformat()
        })
        
        # Food - slightly increasing
        transactions.append({
            "transactionId": f"food_{month}",
            "category": "food",
            "amount": 3000 + (month * 100),
            "date": month_date.isoformat()
        })
        
        # Transport - decreasing
        transactions.append({
            "transactionId": f"transport_{month}",
            "category": "transport",
            "amount": 2000 - (month * 100),
            "date": month_date.isoformat()
        })
        
        # Entertainment - stable
        transactions.append({
            "transactionId": f"entertainment_{month}",
            "category": "entertainment",
            "amount": 1500,
            "date": month_date.isoformat()
        })
        
        # Shopping - increasing
        transactions.append({
            "transactionId": f"shopping_{month}",
            "category": "shopping",
            "amount": 1000 + (month * 200),
            "date": month_date.isoformat()
        })
        
        # Education - occasional
        if month % 2 == 0:
            transactions.append({
                "transactionId": f"education_{month}",
                "category": "education",
                "amount": 2000,
                "date": month_date.isoformat()
            })
    
    return transactions


def test_subtask_13_1():
    """
    Test 13.1: Create spending forecaster endpoint
    - POST /ml/forecast/spending endpoint exists
    - Accepts userId, transactions, goals
    - Requires minimum 3 months of transaction history
    """
    print("\n" + "="*60)
    print("TEST 13.1: Create spending forecaster endpoint")
    print("="*60)
    
    # Test 1: Endpoint exists and accepts correct payload
    print("\n✓ Testing endpoint exists...")
    transactions = generate_monthly_transactions(4)
    
    payload = {
        "userId": "user_13_1",
        "transactions": transactions,
        "goals": []
    }
    
    response = requests.post(f"{BASE_URL}/ml/forecast/spending", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    print("  ✓ Endpoint exists and responds")
    
    # Test 2: Minimum 3 months requirement
    print("\n✓ Testing minimum 3 months requirement...")
    insufficient_transactions = generate_monthly_transactions(2)
    
    payload = {
        "userId": "user_13_1_insufficient",
        "transactions": insufficient_transactions,
        "goals": []
    }
    
    response = requests.post(f"{BASE_URL}/ml/forecast/spending", json=payload)
    assert response.status_code == 200, "Should return 200 with error message"
    result = response.json()
    assert 'error' in result, "Should return error for insufficient data"
    assert 'Insufficient' in result['message'], "Error message should mention insufficient data"
    print("  ✓ Minimum 3 months requirement enforced")
    
    # Test 3: Accepts goals parameter
    print("\n✓ Testing goals parameter acceptance...")
    future_date = (datetime.now() + timedelta(days=180)).isoformat()
    
    payload = {
        "userId": "user_13_1_goals",
        "transactions": transactions,
        "goals": [
            {
                "name": "Vacation",
                "targetAmount": 30000,
                "currentAmount": 10000,
                "deadline": future_date
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/ml/forecast/spending", json=payload)
    assert response.status_code == 200, "Should accept goals parameter"
    result = response.json()
    assert 'requiredSavings' in result, "Should return required savings"
    print(f"  ✓ Goals parameter accepted, required savings: ₹{result['requiredSavings']}")
    
    print("\n✅ SUBTASK 13.1 PASSED")
    return True


def test_subtask_13_2():
    """
    Test 13.2: Implement time series forecasting per category
    - For each spending category, extract monthly spending amounts
    - Fit ARIMA or Exponential Smoothing model
    - Generate next month forecast with prediction intervals
    - Return min (lower bound), expected (point forecast), max (upper bound)
    """
    print("\n" + "="*60)
    print("TEST 13.2: Implement time series forecasting per category")
    print("="*60)
    
    transactions = generate_monthly_transactions(4)
    
    payload = {
        "userId": "user_13_2",
        "transactions": transactions,
        "goals": []
    }
    
    response = requests.post(f"{BASE_URL}/ml/forecast/spending", json=payload)
    assert response.status_code == 200, "Forecast request should succeed"
    result = response.json()
    
    # Test 1: Forecasts for all categories
    print("\n✓ Testing forecasts for all categories...")
    assert 'forecasts' in result, "Response should contain forecasts"
    
    expected_categories = ['rent', 'food', 'transport', 'entertainment', 'shopping', 'education', 'misc']
    for category in expected_categories:
        assert category in result['forecasts'], f"Missing forecast for {category}"
    print(f"  ✓ All {len(expected_categories)} categories present")
    
    # Test 2: Each forecast has min, expected, max
    print("\n✓ Testing forecast structure (min, expected, max)...")
    for category, forecast in result['forecasts'].items():
        assert 'min' in forecast, f"Missing 'min' for {category}"
        assert 'expected' in forecast, f"Missing 'expected' for {category}"
        assert 'max' in forecast, f"Missing 'max' for {category}"
        
        # Verify range validity: min <= expected <= max
        assert forecast['min'] <= forecast['expected'], \
            f"{category}: min ({forecast['min']}) > expected ({forecast['expected']})"
        assert forecast['expected'] <= forecast['max'], \
            f"{category}: expected ({forecast['expected']}) > max ({forecast['max']})"
        
        print(f"  ✓ {category}: min={forecast['min']}, expected={forecast['expected']}, max={forecast['max']}")
    
    # Test 3: Forecasts are reasonable (non-negative)
    print("\n✓ Testing forecast values are non-negative...")
    for category, forecast in result['forecasts'].items():
        assert forecast['min'] >= 0, f"{category} min should be non-negativ