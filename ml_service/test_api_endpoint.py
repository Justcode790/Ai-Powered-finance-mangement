"""
Integration test for the /ml/analyze/spending API endpoint
"""
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import json

from model import app

client = TestClient(app)


def generate_test_data():
    """Generate test transaction data"""
    transactions = []
    base_date = datetime.now() - timedelta(days=90)
    
    # Food - increasing trend
    for i in range(12):
        transactions.append({
            "transactionId": f"food_{i}",
            "category": "food",
            "amount": 3000 + (i * 200),
            "date": (base_date + timedelta(days=i*7)).isoformat()
        })
    
    # Rent - recurring monthly
    for i in range(3):
        transactions.append({
            "transactionId": f"rent_{i}",
            "category": "rent",
            "amount": 10000,
            "date": (base_date + timedelta(days=i*30)).isoformat()
        })
    
    # Entertainment - with anomaly
    for i in range(8):
        amount = 1000 if i != 5 else 5000
        transactions.append({
            "transactionId": f"entertainment_{i}",
            "category": "entertainment",
            "amount": amount,
            "date": (base_date + timedelta(days=i*10)).isoformat()
        })
    
    return transactions


def test_analyze_spending_endpoint():
    """Test the POST /ml/analyze/spending endpoint"""
    print("=" * 60)
    print("TESTING /ml/analyze/spending API ENDPOINT")
    print("=" * 60)
    
    # Prepare request
    transactions = generate_test_data()
    request_data = {
        "userId": "test_user_123",
        "transactions": transactions
    }
    
    # Make request
    response = client.post("/ml/analyze/spending", json=request_data)
    
    # Check response
    print(f"\nStatus Code: {response.status_code}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    # Parse response
    data = response.json()
    
    # Verify response structure
    assert "patterns" in data, "Response should contain 'patterns'"
    assert "trends" in data, "Response should contain 'trends'"
    assert "anomalies" in data, "Response should contain 'anomalies'"
    assert "insights" in data, "Response should contain 'insights'"
    
    print("\n--- Response Structure ---")
    print(f"Patterns: {len(data['patterns'])} items")
    print(f"Trends: {len(data['trends'])} items")
    print(f"Anomalies: {len(data['anomalies'])} items")
    print(f"Insights: {len(data['insights'])} items")
    
    # Display sample results
    print("\n--- Sample Trends ---")
    for trend in data['trends'][:3]:
        print(f"  {trend['category']}: {trend['trend']} ({trend['percentageChange']:+.1f}%)")
    
    print("\n--- Sample Anomalies ---")
    for anomaly in data['anomalies'][:3]:
        print(f"  {anomaly['category']}: ₹{anomaly['amount']} (severity: {anomaly['severity']})")
    
    print("\n--- Sample Insights ---")
    for insight in data['insights'][:5]:
        print(f"  [{insight['type']}] {insight['text']}")
    
    print("\n" + "=" * 60)
    print("✓ API ENDPOINT TEST PASSED")
    print("=" * 60)
    
    return True


def test_empty_transactions():
    """Test with empty transactions list"""
    print("\n--- Testing Empty Transactions ---")
    request_data = {
        "userId": "test_user_456",
        "transactions": []
    }
    
    response = client.post("/ml/analyze/spending", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert len(data['patterns']) == 0
    assert len(data['trends']) == 0
    assert len(data['anomalies']) == 0
    assert len(data['insights']) == 0
    
    print("✓ Empty transactions handled correctly")


def test_minimal_transactions():
    """Test with minimal transactions (edge case)"""
    print("\n--- Testing Minimal Transactions ---")
    request_data = {
        "userId": "test_user_789",
        "transactions": [
            {
                "transactionId": "txn_1",
                "category": "food",
                "amount": 500,
                "date": datetime.now().isoformat()
            }
        ]
    }
    
    response = client.post("/ml/analyze/spending", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    # With only 1 transaction, we shouldn't detect much
    print(f"  Patterns: {len(data['patterns'])}")
    print(f"  Trends: {len(data['trends'])}")
    print(f"  Anomalies: {len(data['anomalies'])}")
    
    print("✓ Minimal transactions handled correctly")


if __name__ == "__main__":
    try:
        test_analyze_spending_endpoint()
        test_empty_transactions()
        test_minimal_transactions()
        print("\n" + "=" * 60)
        print("ALL API TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
