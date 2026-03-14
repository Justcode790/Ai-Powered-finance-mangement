"""Trace through the budget recommendation logic"""
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
        transactions.append({"transactionId": f"rent_{month}", "category": "rent", "amount": 12000, "date": month_date.isoformat()})
        transactions.append({"transactionId": f"food_{month}", "category": "food", "amount": 4000 + (month * 50), "date": month_date.isoformat()})
        transactions.append({"transactionId": f"transport_{month}", "category": "transport", "amount": 2000, "date": month_date.isoformat()})
        transactions.append({"transactionId": f"entertainment_{month}", "category": "entertainment", "amount": 1500, "date": month_date.isoformat()})
        transactions.append({"transactionId": f"shopping_{month}", "category": "shopping", "amount": 2000, "date": month_date.isoformat()})
        transactions.append({"transactionId": f"education_{month}", "category": "education", "amount": 1500, "date": month_date.isoformat()})
        transactions.append({"transactionId": f"misc_{month}", "category": "misc", "amount": 1000, "date": month_date.isoformat()})
    return transactions

transactions = generate_transaction_history(4)
income = 40000

# Calculate historical averages manually
print("Historical averages:")
print("  rent: 12000")
print("  food: 4075 (average of 4000, 4050, 4100, 4150)")
print("  transport: 2000")
print("  entertainment: 1500")
print("  shopping: 2000")
print("  education: 1500")
print("  misc: 1000")
print("  Total: 24075")

print("\nBaseline 50/30/20:")
print("  Needs (50%): 20000 (5000 each for 4 categories)")
print("  Wants (30%): 12000 (4000 each for 3 categories)")
print("  Savings (20%): 8000")

print("\nAdjusted with historical (70% historical + 30% baseline):")
print("  rent: 0.7*12000 + 0.3*5000 = 9900")
print("  food: 0.7*4075 + 0.3*5000 = 4352.5")
print("  transport: 0.7*2000 + 0.3*5000 = 2900")
print("  education: 0.7*1500 + 0.3*5000 = 2550")
print("  entertainment: 0.7*1500 + 0.3*4000 = 2250")
print("  shopping: 0.7*2000 + 0.3*4000 = 2600")
print("  misc: 0.7*1000 + 0.3*4000 = 1900")
print("  Total spending: 26452.5")

print("\nML-informed adjustments:")
print("  Low scores (3.0, 3.0): target savings = 20% = 8000")
print("  High scores (9.0, 9.0): target savings = 30% = 12000")
print("  Total needed (low): 26452.5 + 8000 = 34452.5 (fits in 40000)")
print("  Total needed (high): 26452.5 + 12000 = 38452.5 (fits in 40000)")

print("\nExpected results:")
print("  Low scores: savings should be 8000")
print("  High scores: savings should be 12000")

print("\n" + "="*60)
print("ACTUAL RESULTS:")
print("="*60)

# Test with high scores
payload_high = {
    "userId": "trace_high",
    "income": income,
    "transactions": transactions,
    "goals": [],
    "financial_literacy_score": 9.0,
    "saving_habit_score": 9.0
}

response_high = requests.post(f"{BASE_URL}/ml/recommend/budget", json=payload_high)
result_high = response_high.json()

print("\nHIGH SCORES (9.0, 9.0):")
for cat, amount in result_high['allocations'].items():
    print(f"  {cat}: ₹{amount:.2f}")
print(f"Total: ₹{sum(result_high['allocations'].values()):.2f}")
