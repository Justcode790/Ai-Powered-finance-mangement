"""
Simple test to verify the spending analysis endpoint works correctly.
This is a manual test file - run it to verify the implementation.
"""
import sys
import json
from datetime import datetime, timedelta

# Test data
def generate_test_transactions():
    """Generate test transactions with various patterns"""
    transactions = []
    base_date = datetime.now() - timedelta(days=90)
    
    # Food transactions - increasing trend
    for i in range(12):
        transactions.append({
            "transactionId": f"food_{i}",
            "category": "food",
            "amount": 3000 + (i * 200),  # Increasing from 3000 to 5200
            "date": (base_date + timedelta(days=i*7)).isoformat()
        })
    
    # Rent transactions - recurring monthly
    for i in range(3):
        transactions.append({
            "transactionId": f"rent_{i}",
            "category": "rent",
            "amount": 10000,  # Same amount
            "date": (base_date + timedelta(days=i*30)).isoformat()
        })
    
    # Entertainment - with anomaly
    for i in range(8):
        amount = 1000 if i != 5 else 5000  # Anomaly at index 5
        transactions.append({
            "transactionId": f"entertainment_{i}",
            "category": "entertainment",
            "amount": amount,
            "date": (base_date + timedelta(days=i*10)).isoformat()
        })
    
    # Transport - stable
    for i in range(10):
        transactions.append({
            "transactionId": f"transport_{i}",
            "category": "transport",
            "amount": 500 + (i % 3) * 50,  # Stable around 500
            "date": (base_date + timedelta(days=i*8)).isoformat()
        })
    
    return transactions


def test_spending_analysis():
    """Test the spending analysis functions"""
    from model import (
        group_transactions_by_category,
        detect_trends,
        detect_anomalies,
        detect_recurring_expenses,
        generate_insights,
        Transaction
    )
    
    # Generate test data
    test_data = generate_test_transactions()
    transactions = [Transaction(**t) for t in test_data]
    
    print("=" * 60)
    print("TESTING SPENDING PATTERN ANALYSIS")
    print("=" * 60)
    print(f"\nTotal transactions: {len(transactions)}")
    
    # Test 12.1: Group transactions by category
    print("\n--- Task 12.1: Group by Category ---")
    grouped = group_transactions_by_category(transactions)
    for category, txns in grouped.items():
        print(f"{category}: {len(txns)} transactions")
    
    # Test 12.2: Detect trends
    print("\n--- Task 12.2: Trend Detection ---")
    trends = detect_trends(grouped)
    for trend in trends:
        print(f"{trend['category']}: {trend['trend']} ({trend['percentageChange']:+.1f}%)")
    
    # Test 12.3: Detect anomalies
    print("\n--- Task 12.3: Anomaly Detection ---")
    anomalies = detect_anomalies(grouped)
    for anomaly in anomalies:
        print(f"{anomaly['category']}: ₹{anomaly['amount']} (severity: {anomaly['severity']:.2f})")
    
    # Test 12.4: Detect recurring expenses
    print("\n--- Task 12.4: Recurring Expense Detection ---")
    recurring = detect_recurring_expenses(grouped)
    for pattern in recurring:
        print(f"{pattern['category']}: ₹{pattern['amount']} {pattern['frequency']} (confidence: {pattern['confidence']:.2f})")
    
    # Test 12.5: Generate insights
    print("\n--- Task 12.5: Natural Language Insights ---")
    insights = generate_insights(trends, anomalies, recurring)
    for i, insight in enumerate(insights, 1):
        print(f"{i}. [{insight['type']}] {insight['text']}")
        print(f"   Impact: {insight['impact']:.2f}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED SUCCESSFULLY")
    print("=" * 60)
    
    # Verify expected results
    assert len(grouped) == 4, "Should have 4 categories"
    assert len(trends) > 0, "Should detect trends"
    assert len(anomalies) > 0, "Should detect anomalies"
    assert len(recurring) > 0, "Should detect recurring patterns"
    assert len(insights) > 0, "Should generate insights"
    
    # Check that insights are sorted by impact
    impacts = [insight['impact'] for insight in insights]
    assert impacts == sorted(impacts, reverse=True), "Insights should be sorted by impact"
    
    print("\n✓ All assertions passed!")
    return True


if __name__ == "__main__":
    try:
        test_spending_analysis()
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
