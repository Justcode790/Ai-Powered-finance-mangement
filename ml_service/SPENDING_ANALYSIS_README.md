# Spending Pattern Analysis - Implementation Documentation

## Overview

This document describes the implementation of Task 12: Spending Pattern Analysis in the ML service. The implementation adds a new endpoint `/ml/analyze/spending` that analyzes user transaction data to detect patterns, trends, anomalies, and generate actionable insights.

## Implementation Summary

### Endpoint

**POST /ml/analyze/spending**

Analyzes spending patterns to detect trends, anomalies, and recurring expenses.

**Request Body:**
```json
{
  "userId": "string",
  "transactions": [
    {
      "transactionId": "string",
      "category": "string",
      "amount": number,
      "date": "ISO date string"
    }
  ]
}
```

**Response:**
```json
{
  "patterns": [
    {
      "category": "string",
      "amount": number,
      "frequency": "weekly|monthly",
      "confidence": number
    }
  ],
  "trends": [
    {
      "category": "string",
      "trend": "increasing|decreasing|stable",
      "percentageChange": number
    }
  ],
  "anomalies": [
    {
      "transactionId": "string",
      "category": "string",
      "amount": number,
      "severity": number
    }
  ],
  "insights": [
    {
      "text": "string",
      "category": "string",
      "impact": number,
      "type": "trend|anomaly|recurring"
    }
  ]
}
```

## Sub-Task Implementation Details

### 12.1 Create Spending Analyzer Endpoint

**Implementation:**
- Created `AnalyzeSpendingRequest` Pydantic model for request validation
- Created `Transaction` Pydantic model for transaction data
- Implemented `group_transactions_by_category()` function to organize transactions by category
- Created POST endpoint `/ml/analyze/spending` that orchestrates all analysis functions

**Key Features:**
- Accepts userId and array of transactions
- Groups transactions by category for efficient processing
- Returns comprehensive analysis results

### 12.2 Implement Trend Detection

**Implementation:**
- Function: `detect_trends()`
- Algorithm: Linear regression on monthly spending aggregates
- Time window: Past 3 months

**Logic:**
1. Parse and sort transactions by date
2. Filter to last 3 months
3. Aggregate spending by month
4. Fit linear regression to detect slope
5. Calculate percentage change from first to last month
6. Classify trend based on normalized slope:
   - `increasing`: slope > 5% of average spending
   - `decreasing`: slope < -5% of average spending
   - `stable`: otherwise

**Output:**
```json
{
  "category": "food",
  "trend": "increasing",
  "percentageChange": 25.5
}
```

### 12.3 Implement Anomaly Detection

**Implementation:**
- Function: `detect_anomalies()`
- Algorithms: 
  - IsolationForest (for 5+ transactions)
  - Statistical method (2 standard deviations)

**Logic:**
1. Calculate mean and standard deviation per category
2. Set threshold at mean + 2 * std
3. For categories with 5+ transactions:
   - Apply IsolationForest with 10% contamination
   - Flag transactions predicted as anomalies OR exceeding threshold
4. For categories with 3-4 transactions:
   - Use statistical method only
5. Calculate severity as (amount - mean) / std

**Output:**
```json
{
  "transactionId": "txn_123",
  "category": "entertainment",
  "amount": 5000,
  "severity": 2.65
}
```

### 12.4 Implement Recurring Expense Detection

**Implementation:**
- Function: `detect_recurring_expenses()`
- Algorithm: Amount clustering + interval analysis

**Logic:**
1. Group transactions with similar amounts (within 10% variance)
2. For each amount group with 3+ transactions:
   - Calculate intervals between consecutive transactions
   - Compute average interval and standard deviation
   - Classify frequency:
     - `weekly`: 5-9 days average interval
     - `monthly`: 25-35 days average interval
   - Calculate confidence: 1.0 - (std_interval / avg_interval)
3. Return patterns with confidence > 0.5

**Output:**
```json
{
  "category": "rent",
  "amount": 10000,
  "frequency": "monthly",
  "confidence": 0.95
}
```

### 12.5 Generate Natural Language Insights

**Implementation:**
- Function: `generate_insights()`
- Converts detected patterns into human-readable text
- Prioritizes by potential savings impact

**Logic:**
1. **Trend Insights:**
   - Generate for trends with >10% change
   - Impact = absolute percentage change
   - Examples:
     - "Your food spending increased by 25% over the past 3 months"
     - "Great job! Your transport spending decreased by 15% over the past 3 months"

2. **Anomaly Insights:**
   - Generate for anomalies with severity > 2
   - Impact = severity * 10
   - Example: "Detected unusual entertainment expense of ₹5000"

3. **Recurring Pattern Insights:**
   - Generate for patterns with confidence > 0.7
   - Impact = annual impact / 1000 (for scaling)
   - Example: "You have a recurring monthly rent expense of approximately ₹10000"

4. **Prioritization:**
   - Sort all insights by impact (descending)
   - Higher impact insights appear first

**Output:**
```json
{
  "text": "Your food spending increased by 25% over the past 3 months",
  "category": "food",
  "impact": 25.0,
  "type": "trend"
}
```

## Technical Details

### Dependencies Added
- `datetime`, `timedelta`: Date handling
- `defaultdict`: Efficient grouping
- `typing.List`, `typing.Dict`, `typing.Any`: Type hints
- `sklearn.ensemble.IsolationForest`: Anomaly detection
- `sklearn.linear_model.LinearRegression`: Trend detection

### Error Handling
- Gracefully handles missing or invalid dates
- Handles categories with insufficient data (< 2-3 transactions)
- Fallback to statistical method if IsolationForest fails
- Handles edge cases (zero spending, single transaction)

### Performance Considerations
- Efficient grouping using defaultdict
- Linear time complexity for most operations
- IsolationForest only applied when sufficient data (5+ transactions)
- Minimal memory footprint

## Testing

### Unit Tests
File: `test_spending_analysis.py`

Tests all sub-tasks with synthetic data:
- 12.1: Transaction grouping
- 12.2: Trend detection (increasing, stable)
- 12.3: Anomaly detection (outliers)
- 12.4: Recurring expense detection (weekly, monthly)
- 12.5: Insight generation and prioritization

### Integration Tests
File: `test_api_endpoint.py`

Tests the API endpoint:
- Full request/response cycle
- Empty transactions handling
- Minimal transactions edge case
- Response structure validation

### Running Tests
```bash
cd ml_service
python test_spending_analysis.py
python test_api_endpoint.py
```

## Validation Against Requirements

### Requirement 7.1 ✓
"THE ML_Service SHALL analyze spending patterns to identify recurring expenses in each Spending_Category"
- Implemented in `detect_recurring_expenses()`
- Identifies weekly and monthly recurring patterns

### Requirement 7.2 ✓
"THE ML_Service SHALL detect spending trends: increasing, decreasing, or stable over the past 3 months"
- Implemented in `detect_trends()`
- Uses linear regression for trend classification

### Requirement 7.3 ✓
"THE ML_Service SHALL identify anomalous spending events that deviate significantly from user patterns"
- Implemented in `detect_anomalies()`
- Uses IsolationForest and statistical methods

### Requirement 7.4 ✓
"WHEN spending increases in a category, THE ML_Service SHALL quantify the increase percentage"
- Implemented in `detect_trends()`
- Returns `percentageChange` field

### Requirement 7.6 ✓
"THE ML_Service SHALL generate natural language insights describing detected patterns"
- Implemented in `generate_insights()`
- Converts patterns to readable text

### Requirement 7.7 ✓
"THE ML_Service SHALL prioritize insights by potential savings impact"
- Implemented in `generate_insights()`
- Sorts insights by impact score (descending)

## Example Usage

### Python Client
```python
import requests

response = requests.post(
    "http://localhost:8000/ml/analyze/spending",
    json={
        "userId": "user123",
        "transactions": [
            {
                "transactionId": "txn1",
                "category": "food",
                "amount": 3000,
                "date": "2024-01-15T10:00:00Z"
            },
            # ... more transactions
        ]
    }
)

data = response.json()
print(f"Found {len(data['insights'])} insights")
for insight in data['insights']:
    print(f"- {insight['text']}")
```

### JavaScript/Node.js Client
```javascript
const response = await fetch('http://localhost:8000/ml/analyze/spending', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    transactions: [
      {
        transactionId: 'txn1',
        category: 'food',
        amount: 3000,
        date: '2024-01-15T10:00:00Z'
      }
      // ... more transactions
    ]
  })
});

const data = await response.json();
console.log(`Found ${data.insights.length} insights`);
```

## Future Enhancements

1. **Seasonal Pattern Detection**: Detect yearly recurring patterns (e.g., holiday spending)
2. **Category Correlation**: Identify spending patterns across categories
3. **Predictive Insights**: Forecast future spending based on detected patterns
4. **Personalized Thresholds**: Adjust anomaly detection based on user behavior
5. **Multi-currency Support**: Handle transactions in different currencies
6. **Caching**: Cache analysis results for frequently accessed data

## Maintenance Notes

- Model parameters (thresholds, confidence levels) are configurable
- Add new insight types by extending `generate_insights()`
- Extend frequency detection by adding new interval ranges
- Monitor performance with large transaction datasets (1000+ transactions)

## Contact

For questions or issues related to this implementation, refer to the main project documentation or contact the development team.
