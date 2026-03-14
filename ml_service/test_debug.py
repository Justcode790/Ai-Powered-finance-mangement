"""Debug test to understand the budget recommendation logic"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def generate_transaction_history(months=4):
    """Generate realistic transaction history"""
    transactions = []
    base_date = datetime.now() - timedelta(days=30 * months)
    
    for month in range(months):
        month_date = base_date + timedelta(days=30 * month)
        
        # Rent - stable at 12000
        transactions.append({
            "transactionId": f"rent_{month}",
            "category": "rent",
            "amount": 12000,
            "date": month_date.isoformat()
        })
        
        # Food - around 4000
        transactions.append({
            "transactionId": f"food_{month}",
            "category": "food",
            "amount": 4000 + (month * 50),
            "date": month_date.isoformat()
        })
    
    return transactions

transactions = generate_transaction_history(4)
income = 40000

# Test with low scores
payload_low = {
    "userId": "debug_low",
    "income": income,
    "transactions": transactions,
    "goals": [],
    "financial_literacy_score": 3.0,
    "saving_habit_score": 3.0
}

response_low = requests.post(f"{BASE_URL}/ml/recommend/budget", json=payload_low)
result_low = response_low.json()

print("LOW SCORES:")
print(f"Allocations: {json.dumps(result_low['allocations'], indent=2)}")
print(f"Savings: ₹{result_low['allocations']['savings']:.0f} ({result_low['allocations']['savings']/income*100:.1f}%)")

# Test with high scores
payload_high = {
    "userId": "debug_high",
    "income": income,
    "transactions": transactions,
    "goals": [],
    "financial_literacy_score": 9.0,
    "saving_habit_score": 9.0
}

response_high = requests.post(f"{BASE_URL}/ml/recommend/budget", json=payload_high)
result_high = response_high.json()

print("\nHIGH SCORES:")
print(f"Allocations: {json.dumps(result_high['allocations'], indent=2)}")
print(f"Savings: ₹{result_high['allocations']['savings']:.0f} ({result_high['allocations']['savings']/income*100:.1f}%)")

print(f"\nDifference in savings: ₹{result_high['allocations']['savings'] - result_low['allocations']['savings']:.0f}")
