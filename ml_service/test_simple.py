"""Simple test to check if scores affect savings"""
import requests

BASE_URL = "http://localhost:8000"

# Test with no transactions (pure baseline)
payload_low = {
    "userId": "simple_low",
    "income": 40000,
    "transactions": [],
    "goals": [],
    "financial_literacy_score": 3.0,
    "saving_habit_score": 3.0
}

response_low = requests.post(f"{BASE_URL}/ml/recommend/budget", json=payload_low)
result_low = response_low.json()
print(f"Low scores (3.0, 3.0): Savings = ₹{result_low['allocations']['savings']:.0f}")

payload_high = {
    "userId": "simple_high",
    "income": 40000,
    "transactions": [],
    "goals": [],
    "financial_literacy_score": 9.0,
    "saving_habit_score": 9.0
}

response_high = requests.post(f"{BASE_URL}/ml/recommend/budget", json=payload_high)
result_high = response_high.json()
print(f"High scores (9.0, 9.0): Savings = ₹{result_high['allocations']['savings']:.0f}")

print(f"\nDifference: ₹{result_high['allocations']['savings'] - result_low['allocations']['savings']:.0f}")
