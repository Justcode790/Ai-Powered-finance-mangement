"""
Debug test to understand why scores aren't affecting savings
"""
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
        
        # Transport - around 2000
        transactions.append({
            "transactionId": f"transport_{month}",
            "category": "transport",
            "amount": 2000,
            "date": month_date.isoformat()
        })
        
        # Entertainment - around 1500
        transactions.append({
            "transactionId": f"entertainment_{month}",
            "category": "entertainment",
            "amount": 1500,
            "date": month_date.isoformat()
        })
        
        # Shopping - around 2000
        transactions.append({
            "transactionId": f"shopping_{month}",
            "category": "shopping",
            "amount": 2000,
            "date": month_date.isoformat()
        })
        
        # Education - around 1500
        transactions.append({
            "transactionId": f"education_{month}",
            "category": "education",
            "amount": 1500,
            "date": month_date.isoformat()
        })
        
        # Misc - around 1000
        transactions.append({
            "transactionId": f"misc_{month}",
            "category": "misc",
            "amount": 1000,
            "date": month_date.isoformat()
        })
    
    return transactions


transactions = generate_transaction_history(4)
income = 40000

# Test with low scores
print("Testing LOW scores (3.0, 3.0):")
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

print(f"Savings: ₹{result_low['allocations']['savings']:.2f}")
print(f"Percentage: {(result_low['allocations']['savings'] / income * 100):.1f}%")
print(f"Total allocated: ₹{sum(result_low['allocations'].values()):.2f}")
print("\nAll allocations:")
for cat, amt in result_low['allocations'].items():
    print(f"  {cat}: ₹{amt:.2f}")

print("\n" + "="*60)

# Test with high scores
print("Testing HIGH scores (9.0, 9.0):")
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

print(f"Savings: ₹{result_high['allocations']['savings']:.2f}")
print(f"Percentage: {(result_high['allocations']['savings'] / income * 100):.1f}%")
print(f"Total allocated: ₹{sum(result_high['allocations'].values()):.2f}")
print("\nAll allocations:")
for cat, amt in result_high['allocations'].items():
    print(f"  {cat}: ₹{amt:.2f}")

print("\n" + "="*60)
print(f"Difference in savings: ₹{result_high['allocations']['savings'] - result_low['allocations']['savings']:.2f}")
