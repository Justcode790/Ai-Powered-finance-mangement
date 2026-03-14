"""
Comprehensive test for the three new ML model endpoints:
1. XGBoost Budget Recommendation
2. Financial Behavior Anomaly Detection
3. Spending Transaction Anomaly Analysis
"""

import requests
import json

BASE_URL = "http://localhost:8000"


def test_xgboost_budget_recommendation():
    """Test the XGBoost budget recommendation endpoint"""
    print("\n" + "="*60)
    print("TEST 1: XGBoost Budget Recommendation")
    print("="*60)
    
    # Test case 1: Young student with low income
    payload1 = {
        "Income": 25000,
        "Age": "18-25",
        "Dependents": 0,
        "Occupation": "Student",
        "City_Tier": "Tier 2",
        "Rent": 5000,
        "Loan_Repayment": 2000,
        "Insurance": 500,
        "Desired_Savings_Percentage": 20
    }
    
    print("\nTest Case 1: Young Student")
    print(f"Input: {json.dumps(payload1, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/ml/recommend/budget-xgboost", json=payload1)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nAllocations:")
        for category, amount in result['allocations'].items():
            print(f"  {category}: ₹{amount:.2f}")
        print(f"\nTotal Allocated: ₹{result['total_allocated']:.2f}")
        print(f"Fixed Expenses: ₹{result['fixed_expenses']:.2f}")
        print(f"Savings: ₹{result['allocations']['Savings']:.2f}")
    else:
        print(f"Error: {response.text}")
    
    # Test case 2: Mid-career professional with higher income
    payload2 = {
        "Income": 80000,
        "Age": "26-35",
        "Dependents": 2,
        "Occupation": "Salaried",
        "City_Tier": "Tier 1",
        "Rent": 20000,
        "Loan_Repayment": 10000,
        "Insurance": 3000,
        "Desired_Savings_Percentage": 30
    }
    
    print("\n" + "-"*60)
    print("Test Case 2: Mid-Career Professional")
    print(f"Input: {json.dumps(payload2, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/ml/recommend/budget-xgboost", json=payload2)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nAllocations:")
        for category, amount in result['allocations'].items():
            print(f"  {category}: ₹{amount:.2f}")
        print(f"\nTotal Allocated: ₹{result['total_allocated']:.2f}")
        print(f"Savings: ₹{result['allocations']['Savings']:.2f}")


def test_behavior_anomaly_detection():
    """Test the financial behavior anomaly detection endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Financial Behavior Anomaly Detection")
    print("="*60)
    
    # Test case 1: Normal behavior
    payload1 = {
        "tweet_content": "Started investing in mutual funds for long term wealth",
        "topic_tags": "finance,investment,savings",
        "likes": 150,
        "retweets": 30,
        "replies": 10,
        "sentiment_score": 0.7,
        "emotion": "happy",
        "financial_behavior": "investing"
    }
    
    print("\nTest Case 1: Normal Financial Behavior")
    print(f"Tweet: {payload1['tweet_content']}")
    print(f"Sentiment: {payload1['sentiment_score']}, Emotion: {payload1['emotion']}")
    
    response = requests.post(f"{BASE_URL}/ml/detect/behavior-anomaly", json=payload1)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nResult:")
        print(f"  Is Anomaly: {result['is_anomaly']}")
        print(f"  Anomaly Score: {result['anomaly_score']}")
        print(f"  Confidence: {result['confidence']}")
        print(f"  Interpretation: {result['interpretation']}")
    else:
        print(f"Error: {response.text}")
    
    # Test case 2: Potentially anomalous behavior
    payload2 = {
        "tweet_content": "Lost all my savings gambling at the casino tonight",
        "topic_tags": "gambling,money,loss",
        "likes": 5000,
        "retweets": 2000,
        "replies": 500,
        "sentiment_score": -0.9,
        "emotion": "worried",
        "financial_behavior": "gambling"
    }
    
    print("\n" + "-"*60)
    print("Test Case 2: Potentially Anomalous Behavior")
    print(f"Tweet: {payload2['tweet_content']}")
    print(f"Sentiment: {payload2['sentiment_score']}, Emotion: {payload2['emotion']}")
    print(f"Engagement: {payload2['likes']} likes, {payload2['retweets']} retweets")
    
    response = requests.post(f"{BASE_URL}/ml/detect/behavior-anomaly", json=payload2)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nResult:")
        print(f"  Is Anomaly: {result['is_anomaly']}")
        print(f"  Anomaly Score: {result['anomaly_score']}")
        print(f"  Confidence: {result['confidence']}")
        print(f"  Interpretation: {result['interpretation']}")
    else:
        print(f"Error: {response.text}")


def test_spending_anomaly_analysis():
    """Test the spending transaction anomaly analysis endpoint"""
    print("\n" + "="*60)
    print("TEST 3: Spending Transaction Anomaly Analysis")
    print("="*60)
    
    # Test case 1: Normal spending
    payload1 = {
        "date": "2024-01-15T10:30:00Z",
        "amount": 2500,
        "category": "Groceries"
    }
    
    print("\nTest Case 1: Normal Spending")
    print(f"Transaction: ₹{payload1['amount']} on {payload1['category']}")
    
    response = requests.post(f"{BASE_URL}/ml/analyze/spending-anomaly", json=payload1)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nResult:")
        print(f"  Is Anomaly: {result['is_anomaly']}")
        print(f"  Anomaly Score: {result['anomaly_score']}")
        print(f"  Severity: {result['severity']}")
        print(f"  Interpretation: {result['interpretation']}")
    else:
        print(f"Error: {response.text}")
    
    # Test case 2: Potentially anomalous spending
    payload2 = {
        "date": "2024-01-20T22:00:00Z",
        "amount": 45000,
        "category": "Entertainment"
    }
    
    print("\n" + "-"*60)
    print("Test Case 2: Potentially Anomalous Spending")
    print(f"Transaction: ₹{payload2['amount']} on {payload2['category']}")
    
    response = requests.post(f"{BASE_URL}/ml/analyze/spending-anomaly", json=payload2)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nResult:")
        print(f"  Is Anomaly: {result['is_anomaly']}")
        print(f"  Anomaly Score: {result['anomaly_score']}")
        print(f"  Severity: {result['severity']}")
        print(f"  Interpretation: {result['interpretation']}")
    else:
        print(f"Error: {response.text}")
    
    # Test case 3: Very high spending
    payload3 = {
        "date": "2024-01-25T14:00:00Z",
        "amount": 150000,
        "category": "Shopping"
    }
    
    print("\n" + "-"*60)
    print("Test Case 3: Very High Spending")
    print(f"Transaction: ₹{payload3['amount']} on {payload3['category']}")
    
    response = requests.post(f"{BASE_URL}/ml/analyze/spending-anomaly", json=payload3)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nResult:")
        print(f"  Is Anomaly: {result['is_anomaly']}")
        print(f"  Anomaly Score: {result['anomaly_score']}")
        print(f"  Severity: {result['severity']}")
        print(f"  Interpretation: {result['interpretation']}")
    else:
        print(f"Error: {response.text}")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("COMPREHENSIVE ML MODEL ENDPOINT TESTS")
    print("="*60)
    print("\nTesting three new ML model endpoints:")
    print("1. XGBoost Budget Recommendation")
    print("2. Financial Behavior Anomaly Detection")
    print("3. Spending Transaction Anomaly Analysis")
    
    try:
        # Test all endpoints
        test_xgboost_budget_recommendation()
        test_behavior_anomaly_detection()
        test_spending_anomaly_analysis()
        
        print("\n" + "="*60)
        print("ALL TESTS COMPLETED")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n" + "="*60)
        print("ERROR: Could not connect to ML service")
        print("="*60)
        print("\nPlease ensure the ML service is running:")
        print("  cd ml_service")
        print("  uvicorn model:app --reload")
        print("\nThen run this test again.")


if __name__ == "__main__":
    main()
