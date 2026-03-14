import os
import joblib
import numpy as np
import pandas as pd
import time
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Any, Optional
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA


FEATURE_ORDER = [
    "age",
    "income",
    "rent",
    "food",
    "transport",
    "entertainment",
    "shopping",
    "education",
    "misc",
    "financial_literacy_score",
    "saving_habit_score",
]


class PredictRequest(BaseModel):
    age: int = Field(..., gt=18)
    income: float = Field(..., gt=0)
    rent: float
    food: float
    transport: float
    entertainment: float
    shopping: float
    education: float
    misc: float
    financial_literacy_score: float = Field(..., ge=1, le=10)
    saving_habit_score: float = Field(..., ge=1, le=10)


class Transaction(BaseModel):
    transactionId: str
    category: str
    amount: float
    date: str  # ISO format date string


class Goal(BaseModel):
    name: str
    targetAmount: float
    currentAmount: float
    deadline: str  # ISO format date string


class AnalyzeSpendingRequest(BaseModel):
    userId: str
    transactions: List[Transaction]


class ForecastSpendingRequest(BaseModel):
    userId: str
    transactions: List[Transaction]
    goals: Optional[List[Goal]] = []
    income: Optional[float] = None


class RecommendBudgetRequest(BaseModel):
    userId: str
    income: float = Field(..., gt=0)
    transactions: List[Transaction]
    goals: Optional[List[Goal]] = []
    financial_literacy_score: Optional[float] = Field(default=5.0, ge=1, le=10)
    saving_habit_score: Optional[float] = Field(default=5.0, ge=1, le=10)


class XGBoostBudgetRequest(BaseModel):
    Income: float = Field(..., gt=0)
    Age: str = Field(..., description="Age bracket: 18-25, 26-35, 36-45, 46-60")
    Dependents: int = Field(..., ge=0, le=10)
    Occupation: str = Field(..., description="Student, Salaried, Self-Employed, Freelancer")
    City_Tier: str = Field(..., description="Tier 1, Tier 2, Tier 3")
    Rent: float = Field(..., ge=0)
    Loan_Repayment: float = Field(..., ge=0)
    Insurance: float = Field(..., ge=0)
    Desired_Savings_Percentage: int = Field(..., ge=10, le=50)


class FinancialBehaviorRequest(BaseModel):
    tweet_content: str
    topic_tags: str = Field(..., description="Comma-separated tags")
    likes: int = Field(..., ge=0)
    retweets: int = Field(..., ge=0)
    replies: int = Field(..., ge=0)
    sentiment_score: float = Field(..., ge=-1, le=1)
    emotion: str = Field(..., description="happy, sad, angry, neutral, excited, worried")
    financial_behavior: str = Field(..., description="saving, investing, spending, gambling, borrowing, earning")


class SpendingTransactionRequest(BaseModel):
    date: str = Field(..., description="ISO format date string")
    amount: float = Field(..., gt=0)
    category: str = Field(..., description="Spending category")


app = FastAPI(title="Savings Prediction ML Service")

_model_data = None
_budget_model_data = None
_anomaly_behavior_model_data = None
_spending_analysis_model_data = None
_forecast_accuracy = {
    'forecasts': [],  # Store forecasts with actual data when available
    'weekly_updates': []  # Track when forecasts are updated
}


def load_model():
    global _model_data
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"model.pkl not found at {model_path}. Run train_model.py to create it."
        )
    _model_data = joblib.load(model_path)
    
    # Handle both old format (just model) and new format (dict with metadata)
    if isinstance(_model_data, dict):
        print(f"Loaded model version: {_model_data.get('version', 'unknown')}")
        print(f"Model metrics: {_model_data.get('metrics', {})}")
    else:
        print("Loaded legacy model format")


def load_budget_model():
    global _budget_model_data
    model_path = os.path.join(os.path.dirname(__file__), "budget_model.pkl")
    if os.path.exists(model_path):
        _budget_model_data = joblib.load(model_path)
        print(f"Loaded budget model version: {_budget_model_data.get('version', 'unknown')}")
    else:
        print("Warning: budget_model.pkl not found. Run train_budget_model.py to create it.")


def load_anomaly_behavior_model():
    global _anomaly_behavior_model_data
    model_path = os.path.join(os.path.dirname(__file__), "anomaly_behavior_model.pkl")
    if os.path.exists(model_path):
        _anomaly_behavior_model_data = joblib.load(model_path)
        print(f"Loaded anomaly behavior model version: {_anomaly_behavior_model_data.get('version', 'unknown')}")
    else:
        print("Warning: anomaly_behavior_model.pkl not found. Run train_anomaly_behavior_model.py to create it.")


def load_spending_analysis_model():
    global _spending_analysis_model_data
    model_path = os.path.join(os.path.dirname(__file__), "spending_analysis_model.pkl")
    if os.path.exists(model_path):
        _spending_analysis_model_data = joblib.load(model_path)
        print(f"Loaded spending analysis model version: {_spending_analysis_model_data.get('version', 'unknown')}")
    else:
        print("Warning: spending_analysis_model.pkl not found. Run train_spending_analysis_model.py to create it.")


def estimate_confidence_interval(model, features, confidence=0.90):
    """
    Estimate confidence interval using bootstrap aggregation approach
    For GradientBoosting, we use the estimators to get prediction variance
    """
    try:
        # Get the actual model
        if isinstance(_model_data, dict):
            gb_model = _model_data['model']
        else:
            gb_model = _model_data
        
        # For GradientBoosting, we can use staged predictions
        # to estimate uncertainty
        predictions = []
        
        # Use subsets of estimators to create prediction variance
        n_estimators = len(gb_model.estimators_)
        step = max(1, n_estimators // 10)  # Use 10 samples
        
        for i in range(step, n_estimators + 1, step):
            # Predict using first i estimators
            pred = gb_model.predict(features, n_iter=i)[0]
            predictions.append(pred)
        
        predictions = np.array(predictions)
        mean_pred = np.mean(predictions)
        std_pred = np.std(predictions)
        
        # Calculate confidence interval
        # For 90% confidence, use 1.645 standard deviations
        z_score = 1.645 if confidence == 0.90 else 1.96  # 90% or 95%
        margin = z_score * std_pred
        
        lower = max(0, mean_pred - margin)  # Savings can't be negative
        upper = mean_pred + margin
        
        return float(lower), float(upper)
    except Exception as e:
        print(f"Error estimating confidence interval: {e}")
        # Fallback: use ±10% of prediction
        if isinstance(_model_data, dict):
            model = _model_data['model']
        else:
            model = _model_data
        pred = model.predict(features)[0]
        return float(pred * 0.9), float(pred * 1.1)


# Helper functions for spending pattern analysis

def group_transactions_by_category(transactions: List[Transaction]) -> Dict[str, List[Transaction]]:
    """Group transactions by category"""
    grouped = defaultdict(list)
    for txn in transactions:
        grouped[txn.category].append(txn)
    return dict(grouped)


def detect_trends(transactions_by_category: Dict[str, List[Transaction]]) -> List[Dict[str, Any]]:
    """
    Detect spending trends for each category over the past 3 months.
    Uses linear regression to determine if spending is increasing, decreasing, or stable.
    """
    trends = []
    threshold = 0.05  # 5% threshold for trend classification
    
    for category, txns in transactions_by_category.items():
        if len(txns) < 2:
            continue
        
        # Parse dates and sort transactions
        txns_with_dates = []
        for txn in txns:
            try:
                date = datetime.fromisoformat(txn.date.replace('Z', '+00:00'))
                txns_with_dates.append((date, txn.amount))
            except:
                continue
        
        if len(txns_with_dates) < 2:
            continue
        
        txns_with_dates.sort(key=lambda x: x[0])
        
        # Filter to last 3 months
        three_months_ago = datetime.now() - timedelta(days=90)
        recent_txns = [(d, a) for d, a in txns_with_dates if d >= three_months_ago]
        
        if len(recent_txns) < 2:
            continue
        
        # Group by month and calculate monthly totals
        monthly_spending = defaultdict(float)
        for date, amount in recent_txns:
            month_key = (date.year, date.month)
            monthly_spending[month_key] += amount
        
        if len(monthly_spending) < 2:
            continue
        
        # Prepare data for linear regression
        months = sorted(monthly_spending.keys())
        X = np.array([[i] for i in range(len(months))])
        y = np.array([monthly_spending[m] for m in months])
        
        # Fit linear regression
        model = LinearRegression()
        model.fit(X, y)
        slope = model.coef_[0]
        
        # Calculate percentage change from first to last month
        first_month_spending = y[0]
        last_month_spending = y[-1]
        
        if first_month_spending > 0:
            percentage_change = ((last_month_spending - first_month_spending) / first_month_spending) * 100
        else:
            percentage_change = 0
        
        # Classify trend based on slope relative to average spending
        avg_spending = np.mean(y)
        normalized_slope = slope / avg_spending if avg_spending > 0 else 0
        
        if normalized_slope > threshold:
            trend = 'increasing'
        elif normalized_slope < -threshold:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        trends.append({
            'category': category,
            'trend': trend,
            'percentageChange': round(percentage_change, 2)
        })
    
    return trends


def detect_anomalies(transactions_by_category: Dict[str, List[Transaction]]) -> List[Dict[str, Any]]:
    """
    Detect anomalous transactions using IsolationForest and statistical methods.
    Flags transactions > 2 standard deviations from category mean.
    """
    anomalies = []
    
    for category, txns in transactions_by_category.items():
        if len(txns) < 3:  # Need at least 3 transactions for meaningful anomaly detection
            continue
        
        amounts = np.array([txn.amount for txn in txns])
        mean_amount = np.mean(amounts)
        std_amount = np.std(amounts)
        
        # Statistical method: 2 standard deviations
        threshold = mean_amount + 2 * std_amount
        
        # IsolationForest method (if we have enough data)
        if len(txns) >= 5:
            try:
                iso_forest = IsolationForest(contamination=0.1, random_state=42)
                X = amounts.reshape(-1, 1)
                predictions = iso_forest.fit_predict(X)
                
                for i, (txn, pred) in enumerate(zip(txns, predictions)):
                    # pred == -1 means anomaly
                    if pred == -1 or txn.amount > threshold:
                        # Calculate severity based on how far from mean
                        if std_amount > 0:
                            severity = (txn.amount - mean_amount) / std_amount
                        else:
                            severity = 0
                        
                        anomalies.append({
                            'transactionId': txn.transactionId,
                            'category': category,
                            'amount': round(txn.amount, 2),
                            'severity': round(max(0, severity), 2)
                        })
            except:
                # Fallback to statistical method only
                for txn in txns:
                    if txn.amount > threshold:
                        if std_amount > 0:
                            severity = (txn.amount - mean_amount) / std_amount
                        else:
                            severity = 0
                        
                        anomalies.append({
                            'transactionId': txn.transactionId,
                            'category': category,
                            'amount': round(txn.amount, 2),
                            'severity': round(max(0, severity), 2)
                        })
        else:
            # Use statistical method only
            for txn in txns:
                if txn.amount > threshold:
                    if std_amount > 0:
                        severity = (txn.amount - mean_amount) / std_amount
                    else:
                        severity = 0
                    
                    anomalies.append({
                        'transactionId': txn.transactionId,
                        'category': category,
                        'amount': round(txn.amount, 2),
                        'severity': round(max(0, severity), 2)
                    })
    
    return anomalies


def detect_recurring_expenses(transactions_by_category: Dict[str, List[Transaction]]) -> List[Dict[str, Any]]:
    """
    Detect recurring expenses by identifying transactions with similar amounts
    at regular intervals (weekly, monthly).
    """
    recurring_patterns = []
    
    for category, txns in transactions_by_category.items():
        if len(txns) < 3:
            continue
        
        # Parse dates and sort
        txns_with_dates = []
        for txn in txns:
            try:
                date = datetime.fromisoformat(txn.date.replace('Z', '+00:00'))
                txns_with_dates.append((date, txn.amount))
            except:
                continue
        
        if len(txns_with_dates) < 3:
            continue
        
        txns_with_dates.sort(key=lambda x: x[0])
        
        # Group transactions by similar amounts (within 10% variance)
        amount_groups = []
        for date, amount in txns_with_dates:
            placed = False
            for group in amount_groups:
                group_avg = np.mean([a for _, a in group])
                if abs(amount - group_avg) / group_avg <= 0.10:
                    group.append((date, amount))
                    placed = True
                    break
            if not placed:
                amount_groups.append([(date, amount)])
        
        # Check each group for regular intervals
        for group in amount_groups:
            if len(group) < 3:
                continue
            
            dates = [d for d, _ in group]
            amounts = [a for _, a in group]
            avg_amount = np.mean(amounts)
            
            # Calculate intervals between consecutive transactions
            intervals = []
            for i in range(1, len(dates)):
                interval_days = (dates[i] - dates[i-1]).days
                intervals.append(interval_days)
            
            if not intervals:
                continue
            
            avg_interval = np.mean(intervals)
            std_interval = np.std(intervals)
            
            # Determine frequency and confidence
            frequency = None
            confidence = 0
            
            # Weekly: ~7 days
            if 5 <= avg_interval <= 9:
                frequency = 'weekly'
                confidence = 1.0 - min(std_interval / avg_interval, 1.0) if avg_interval > 0 else 0
            # Monthly: ~30 days
            elif 25 <= avg_interval <= 35:
                frequency = 'monthly'
                confidence = 1.0 - min(std_interval / avg_interval, 1.0) if avg_interval > 0 else 0
            
            if frequency and confidence > 0.5:
                recurring_patterns.append({
                    'category': category,
                    'amount': round(avg_amount, 2),
                    'frequency': frequency,
                    'confidence': round(confidence, 2)
                })
    
    return recurring_patterns


def generate_insights(
    trends: List[Dict[str, Any]],
    anomalies: List[Dict[str, Any]],
    recurring_patterns: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate natural language insights from detected patterns, trends, and anomalies.
    Prioritize by potential savings impact.
    """
    insights = []
    
    # Generate trend insights
    for trend_data in trends:
        category = trend_data['category']
        trend = trend_data['trend']
        pct_change = trend_data['percentageChange']
        
        if trend == 'increasing' and abs(pct_change) > 10:
            text = f"Your {category} spending increased by {abs(pct_change):.0f}% over the past 3 months"
            impact = abs(pct_change)
            insights.append({
                'text': text,
                'category': category,
                'impact': impact,
                'type': 'trend'
            })
        elif trend == 'decreasing' and abs(pct_change) > 10:
            text = f"Great job! Your {category} spending decreased by {abs(pct_change):.0f}% over the past 3 months"
            impact = abs(pct_change)
            insights.append({
                'text': text,
                'category': category,
                'impact': impact,
                'type': 'trend'
            })
    
    # Generate anomaly insights
    for anomaly in anomalies:
        if anomaly['severity'] > 2:  # Only report significant anomalies
            category = anomaly['category']
            amount = anomaly['amount']
            text = f"Detected unusual {category} expense of ₹{amount:.0f}"
            impact = anomaly['severity'] * 10  # Scale severity for prioritization
            insights.append({
                'text': text,
                'category': category,
                'impact': impact,
                'type': 'anomaly'
            })
    
    # Generate recurring expense insights
    for pattern in recurring_patterns:
        category = pattern['category']
        amount = pattern['amount']
        frequency = pattern['frequency']
        confidence = pattern['confidence']
        
        if confidence > 0.7:
            text = f"You have a recurring {frequency} {category} expense of approximately ₹{amount:.0f}"
            impact = amount * (12 if frequency == 'monthly' else 52)  # Annual impact
            insights.append({
                'text': text,
                'category': category,
                'impact': impact / 1000,  # Scale down for prioritization
                'type': 'recurring'
            })
    
    # Sort by impact (descending)
    insights.sort(key=lambda x: x['impact'], reverse=True)
    
    return insights


def prepare_monthly_spending_data(transactions: List[Transaction]) -> Dict[str, pd.Series]:
    """
    Prepare monthly spending data per category for time series forecasting.
    Returns a dictionary mapping category to pandas Series of monthly spending.
    """
    # Parse transactions and group by category and month
    category_monthly = defaultdict(lambda: defaultdict(float))
    
    for txn in transactions:
        try:
            date = datetime.fromisoformat(txn.date.replace('Z', '+00:00'))
            month_key = (date.year, date.month)
            category_monthly[txn.category][month_key] += txn.amount
        except:
            continue
    
    # Convert to pandas Series for each category
    category_series = {}
    for category, monthly_data in category_monthly.items():
        if len(monthly_data) >= 3:  # Need at least 3 months
            # Sort by date
            sorted_months = sorted(monthly_data.keys())
            amounts = [monthly_data[m] for m in sorted_months]
            
            # Create date index
            dates = [datetime(year, month, 1) for year, month in sorted_months]
            series = pd.Series(amounts, index=pd.DatetimeIndex(dates))
            category_series[category] = series
    
    return category_series


def forecast_category_spending(series: pd.Series) -> Dict[str, float]:
    """
    Forecast next month spending for a single category using time series models.
    Returns dict with min, expected, max values.
    """
    try:
        # Try ARIMA first (works well for trending data)
        try:
            # Use simple ARIMA(1,1,1) model
            model = ARIMA(series, order=(1, 1, 1))
            fitted = model.fit()
            forecast = fitted.forecast(steps=1)
            forecast_value = float(forecast.iloc[0])
            
            # Get prediction interval (80% confidence)
            forecast_result = fitted.get_forecast(steps=1)
            pred_int = forecast_result.conf_int(alpha=0.2)  # 80% confidence
            
            min_val = float(pred_int.iloc[0, 0])
            max_val = float(pred_int.iloc[0, 1])
            
        except:
            # Fallback to Exponential Smoothing
            model = ExponentialSmoothing(
                series,
                seasonal_periods=None,
                trend='add',
                seasonal=None
            )
            fitted = model.fit()
            forecast_value = float(fitted.forecast(steps=1).iloc[0])
            
            # Estimate prediction interval using historical variance
            residuals = series - fitted.fittedvalues
            std_error = np.std(residuals)
            min_val = forecast_value - 1.28 * std_error  # 80% confidence
            max_val = forecast_value + 1.28 * std_error
        
        # Ensure non-negative values
        min_val = max(0, min_val)
        max_val = max(min_val, max_val)
        forecast_value = max(0, forecast_value)
        
        return {
            'min': round(min_val, 2),
            'expected': round(forecast_value, 2),
            'max': round(max_val, 2)
        }
        
    except Exception as e:
        # Fallback: use simple moving average
        mean_spending = float(series.mean())
        std_spending = float(series.std())
        
        return {
            'min': round(max(0, mean_spending - std_spending), 2),
            'expected': round(mean_spending, 2),
            'max': round(mean_spending + std_spending, 2)
        }


def calculate_required_monthly_savings(goals: List[Goal]) -> float:
    """
    Calculate total required monthly savings to meet all active goals.
    """
    total_required = 0.0
    current_date = datetime.now()
    
    for goal in goals:
        try:
            deadline = datetime.fromisoformat(goal.deadline.replace('Z', '+00:00'))
            remaining_amount = goal.targetAmount - goal.currentAmount
            
            if remaining_amount > 0 and deadline > current_date:
                # Calculate months until deadline
                months_remaining = max(1, (deadline.year - current_date.year) * 12 + 
                                      (deadline.month - current_date.month))
                required_monthly = remaining_amount / months_remaining
                total_required += required_monthly
        except:
            continue
    
    return total_required


def store_forecast(user_id: str, forecasts: Dict[str, Dict[str, float]], forecast_month: tuple):
    """
    Store forecast data for later accuracy tracking.
    forecast_month is a tuple of (year, month)
    """
    global _forecast_accuracy
    
    _forecast_accuracy['forecasts'].append({
        'userId': user_id,
        'forecastMonth': forecast_month,
        'forecasts': forecasts,
        'createdAt': datetime.now().isoformat(),
        'actual': None  # Will be filled when actual data is available
    })
    
    # Keep only last 100 forecasts to prevent memory issues
    if len(_forecast_accuracy['forecasts']) > 100:
        _forecast_accuracy['forecasts'] = _forecast_accuracy['forecasts'][-100:]


def update_forecast_accuracy(user_id: str, forecast_month: tuple, actual_spending: Dict[str, float]):
    """
    Update forecast with actual spending data and calculate accuracy.
    Returns the calculated accuracy metrics.
    """
    global _forecast_accuracy
    
    for forecast_entry in _forecast_accuracy['forecasts']:
        if (forecast_entry['userId'] == user_id and 
            forecast_entry['forecastMonth'] == forecast_month and
            forecast_entry['actual'] is None):
            
            # Store actual spending
            forecast_entry['actual'] = actual_spending
            forecast_entry['evaluatedAt'] = datetime.now().isoformat()
            
            # Calculate accuracy per category
            accuracies = {}
            for category, forecast in forecast_entry['forecasts'].items():
                if category in actual_spending:
                    actual = actual_spending[category]
                    expected = forecast['expected']
                    absolute_error = abs(expected - actual)
                    
                    accuracies[category] = {
                        'expected': expected,
                        'actual': actual,
                        'absoluteError': round(absolute_error, 2)
                    }
            
            forecast_entry['accuracies'] = accuracies
            return accuracies
    
    return None


def get_forecast_accuracy_metrics() -> Dict[str, Any]:
    """
    Calculate aggregate forecast accuracy metrics from stored forecasts.
    """
    global _forecast_accuracy
    
    evaluated_forecasts = [f for f in _forecast_accuracy['forecasts'] if f.get('actual') is not None]
    
    if not evaluated_forecasts:
        return {
            'totalForecasts': len(_forecast_accuracy['forecasts']),
            'evaluatedForecasts': 0,
            'metrics': None
        }
    
    # Collect all errors
    all_errors = []
    category_errors = defaultdict(list)
    
    for forecast_entry in evaluated_forecasts:
        if 'accuracies' in forecast_entry:
            for category, accuracy in forecast_entry['accuracies'].items():
                error = accuracy['absoluteError']
                all_errors.append(error)
                category_errors[category].append(error)
    
    if not all_errors:
        return {
            'totalForecasts': len(_forecast_accuracy['forecasts']),
            'evaluatedForecasts': len(evaluated_forecasts),
            'metrics': None
        }
    
    # Calculate aggregate metrics
    mae = np.mean(all_errors)
    rmse = np.sqrt(np.mean([e**2 for e in all_errors]))
    
    # Calculate per-category metrics
    category_metrics = {}
    for category, errors in category_errors.items():
        category_metrics[category] = {
            'mae': round(np.mean(errors), 2),
            'count': len(errors)
        }
    
    return {
        'totalForecasts': len(_forecast_accuracy['forecasts']),
        'evaluatedForecasts': len(evaluated_forecasts),
        'metrics': {
            'mae': round(mae, 2),
            'rmse': round(rmse, 2),
            'byCategory': category_metrics
        },
        'lastUpdated': datetime.now().isoformat()
    }


def calculate_historical_spending_averages(transactions: List[Transaction]) -> Dict[str, float]:
    """
    Calculate average spending per category from historical transactions.
    """
    category_totals = defaultdict(float)
    category_counts = defaultdict(int)
    
    # Group by category and month to get monthly averages
    category_monthly = defaultdict(lambda: defaultdict(float))
    
    for txn in transactions:
        try:
            date = datetime.fromisoformat(txn.date.replace('Z', '+00:00'))
            month_key = (date.year, date.month)
            category_monthly[txn.category][month_key] += txn.amount
        except:
            continue
    
    # Calculate average monthly spending per category
    averages = {}
    for category, monthly_data in category_monthly.items():
        if monthly_data:
            avg = sum(monthly_data.values()) / len(monthly_data)
            averages[category] = avg
    
    return averages


def identify_overspending_categories(
    historical_averages: Dict[str, float],
    previous_budget: Optional[Dict[str, float]] = None
) -> Dict[str, bool]:
    """
    Identify categories where user consistently overspends.
    A category is overspending if historical avg > previous budget by 20%.
    """
    overspending = {}
    
    if not previous_budget:
        return overspending
    
    for category, avg_spending in historical_averages.items():
        if category in previous_budget:
            budget_amount = previous_budget[category]
            if budget_amount > 0:
                overspend_ratio = (avg_spending - budget_amount) / budget_amount
                overspending[category] = overspend_ratio > 0.20
            else:
                overspending[category] = False
        else:
            overspending[category] = False
    
    return overspending


def apply_50_30_20_rule(income: float) -> Dict[str, float]:
    """
    Apply the 50/30/20 rule as baseline budget allocation.
    - Needs (50%): rent, food, transport, education
    - Wants (30%): entertainment, shopping, misc
    - Savings (20%)
    """
    needs_amount = income * 0.50
    wants_amount = income * 0.30
    savings_amount = income * 0.20
    
    # Distribute needs across 4 categories (default equal distribution)
    needs_categories = ['rent', 'food', 'transport', 'education']
    needs_per_category = needs_amount / len(needs_categories)
    
    # Distribute wants across 3 categories (default equal distribution)
    wants_categories = ['entertainment', 'shopping', 'misc']
    wants_per_category = wants_amount / len(wants_categories)
    
    allocations = {}
    for category in needs_categories:
        allocations[category] = needs_per_category
    for category in wants_categories:
        allocations[category] = wants_per_category
    allocations['savings'] = savings_amount
    
    return allocations


def adjust_allocations_with_historical_data(
    baseline_allocations: Dict[str, float],
    historical_averages: Dict[str, float],
    income: float
) -> Dict[str, float]:
    """
    Adjust baseline allocations based on historical spending patterns.
    For categories with historical data, use a weighted average of baseline and historical.
    """
    adjusted = baseline_allocations.copy()
    
    for category, baseline_amount in baseline_allocations.items():
        if category == 'savings':
            continue  # Don't adjust savings yet
        
        if category in historical_averages:
            historical_amount = historical_averages[category]
            # Use 70% historical, 30% baseline for more realistic recommendations
            adjusted[category] = (0.7 * historical_amount) + (0.3 * baseline_amount)
    
    # Recalculate savings to ensure total doesn't exceed income
    total_spending = sum(v for k, v in adjusted.items() if k != 'savings')
    adjusted['savings'] = max(0, income - total_spending)
    
    return adjusted


def apply_ml_informed_adjustments(
    allocations: Dict[str, float],
    historical_averages: Dict[str, float],
    financial_literacy_score: float,
    saving_habit_score: float,
    income: float
) -> Dict[str, float]:
    """
    Apply ML-informed adjustments based on user behavior scores.
    - Higher financial literacy → more aggressive savings
    - Higher saving habit → more savings allocation
    - Overspending categories → cap at historical average
    """
    adjusted = allocations.copy()
    
    # Adjust savings based on scores FIRST to determine target
    # Base savings: 20% of income
    # Financial literacy bonus: up to +5% (score 8-10)
    # Saving habit bonus: up to +5% (score 8-10)
    base_savings_rate = 0.20
    
    if financial_literacy_score >= 8:
        base_savings_rate += 0.05
    elif financial_literacy_score >= 6:
        base_savings_rate += 0.02
    
    if saving_habit_score >= 8:
        base_savings_rate += 0.05
    elif saving_habit_score >= 6:
        base_savings_rate += 0.02
    
    # Cap savings rate at 30% to keep recommendations realistic
    base_savings_rate = min(0.30, base_savings_rate)
    
    target_savings = income * base_savings_rate
    
    # Now adjust spending categories to fit the target savings
    # Identify overspending categories (historical avg > current allocation by 20%)
    for category, allocation in allocations.items():
        if category == 'savings':
            continue
        
        if category in historical_averages:
            historical_avg = historical_averages[category]
            if allocation > 0 and historical_avg > allocation * 1.20:
                # Cap at historical average for realistic recommendations
                adjusted[category] = min(allocation, historical_avg)
    
    # Calculate total spending after adjustments (excluding savings)
    total_spending = sum(v for k, v in adjusted.items() if k != 'savings')
    
    # Ensure we don't exceed income by reducing wants if necessary
    if total_spending + target_savings > income:
        # Reduce wants categories proportionally to fit target savings
        wants_categories = ['entertainment', 'shopping', 'misc']
        wants_total = sum(adjusted.get(cat, 0) for cat in wants_categories)
        
        if wants_total > 0:
            reduction_needed = (total_spending + target_savings) - income
            # Ensure reduction doesn't make wants negative
            reduction_needed = min(reduction_needed, wants_total)
            reduction_ratio = max(0, 1 - (reduction_needed / wants_total))
            
            for category in wants_categories:
                if category in adjusted:
                    adjusted[category] = adjusted[category] * reduction_ratio
            
            # Recalculate total spending after wants reduction
            total_spending = sum(v for k, v in adjusted.items() if k != 'savings')
        
        # If still over budget, reduce needs categories proportionally (except rent)
        if total_spending + target_savings > income:
            needs_categories = ['food', 'transport', 'education']  # Exclude rent as it's usually fixed
            needs_total = sum(adjusted.get(cat, 0) for cat in needs_categories)
            
            if needs_total > 0:
                reduction_needed = (total_spending + target_savings) - income
                reduction_needed = min(reduction_needed, needs_total)
                reduction_ratio = max(0, 1 - (reduction_needed / needs_total))
                
                for category in needs_categories:
                    if category in adjusted:
                        adjusted[category] = adjusted[category] * reduction_ratio
                
                # Recalculate total spending after needs reduction
                total_spending = sum(v for k, v in adjusted.items() if k != 'savings')
    
    # Set savings to target rate
    adjusted['savings'] = target_savings
    
    # Final safety check: ensure total doesn't exceed income
    total_allocated = sum(adjusted.values())
    if total_allocated > income:
        # Last resort: reduce savings to fit within income
        adjusted['savings'] = max(0, income - sum(v for k, v in adjusted.items() if k != 'savings'))
    
    return adjusted


def incorporate_goals_into_budget(
    allocations: Dict[str, float],
    goals: List[Goal],
    income: float
) -> Dict[str, float]:
    """
    Adjust budget to ensure savings allocation meets goal requirements.
    If goals require more than current savings, reduce wants proportionally.
    """
    adjusted = allocations.copy()
    
    # Calculate required monthly savings for goals
    required_savings = calculate_required_monthly_savings(goals)
    
    current_savings = adjusted.get('savings', 0)
    
    if required_savings > current_savings:
        # Need to increase savings
        additional_savings_needed = required_savings - current_savings
        
        # Reduce wants categories proportionally
        wants_categories = ['entertainment', 'shopping', 'misc']
        wants_total = sum(adjusted.get(cat, 0) for cat in wants_categories)
        
        if wants_total > 0:
            reduction_ratio = max(0, 1 - (additional_savings_needed / wants_total))
            
            for category in wants_categories:
                if category in adjusted:
                    adjusted[category] = adjusted[category] * reduction_ratio
        
        # Recalculate savings to meet goal requirements
        total_spending = sum(v for k, v in adjusted.items() if k != 'savings')
        adjusted['savings'] = max(required_savings, income - total_spending)
    
    # If no goals or goals don't require more savings, keep the savings from ML adjustments
    return adjusted


def generate_allocation_rationale(
    allocations: Dict[str, float],
    income: float,
    historical_averages: Dict[str, float],
    goals: List[Goal]
) -> Dict[str, str]:
    """
    Generate rationale strings explaining each category allocation.
    """
    rationale = {}
    
    required_goal_savings = calculate_required_monthly_savings(goals)
    
    for category, amount in allocations.items():
        percentage = (amount / income * 100) if income > 0 else 0
        
        if category == 'savings':
            if goals and required_goal_savings > 0:
                rationale[category] = (
                    f"Savings: ₹{amount:.0f} ({percentage:.0f}% of income, "
                    f"includes ₹{required_goal_savings:.0f} for your financial goals)"
                )
            else:
                rationale[category] = (
                    f"Savings: ₹{amount:.0f} ({percentage:.0f}% of income, "
                    f"recommended for financial security)"
                )
        else:
            if category in historical_averages:
                historical_avg = historical_averages[category]
                rationale[category] = (
                    f"{category.capitalize()}: ₹{amount:.0f} ({percentage:.0f}% of income, "
                    f"based on your typical spending of ₹{historical_avg:.0f})"
                )
            else:
                rationale[category] = (
                    f"{category.capitalize()}: ₹{amount:.0f} ({percentage:.0f}% of income, "
                    f"recommended allocation)"
                )
    
    return rationale


@app.on_event("startup")
async def _startup():
    load_model()
    load_budget_model()
    load_anomaly_behavior_model()
    load_spending_analysis_model()


@app.get("/")
async def root():
    model_loaded = _model_data is not None
    version = "unknown"
    metrics = {}
    
    if isinstance(_model_data, dict):
        version = _model_data.get('version', 'unknown')
        metrics = _model_data.get('metrics', {})
    
    return {
        "message": "ML service running",
        "model_loaded": model_loaded,
        "version": version,
        "metrics": metrics
    }


@app.post("/predict")
async def predict(req: PredictRequest):
    start_time = time.time()
    
    features = np.array([[getattr(req, f) for f in FEATURE_ORDER]], dtype=float)
    
    # Get model
    if isinstance(_model_data, dict):
        model = _model_data['model']
        version = _model_data.get('version', 'unknown')
    else:
        model = _model_data
        version = 'legacy'
    
    # Make prediction
    pred = float(model.predict(features)[0])
    
    # Estimate confidence interval
    lower, upper = estimate_confidence_interval(model, features)
    
    # Calculate latency
    latency_ms = (time.time() - start_time) * 1000
    
    return {
        "predicted_savings": round(pred, 2),
        "confidence_interval": {
            "lower": round(lower, 2),
            "upper": round(upper, 2)
        },
        "model_version": version,
        "latency_ms": round(latency_ms, 2)
    }


@app.post("/ml/analyze/spending")
async def analyze_spending(req: AnalyzeSpendingRequest):
    """
    Analyze spending patterns to detect trends, anomalies, and recurring expenses.
    Returns insights prioritized by potential savings impact.
    """
    # Group transactions by category
    transactions_by_category = group_transactions_by_category(req.transactions)
    
    # Detect trends
    trends = detect_trends(transactions_by_category)
    
    # Detect anomalies
    anomalies = detect_anomalies(transactions_by_category)
    
    # Detect recurring expenses
    recurring_patterns = detect_recurring_expenses(transactions_by_category)
    
    # Generate natural language insights
    insights = generate_insights(trends, anomalies, recurring_patterns)
    
    return {
        'patterns': recurring_patterns,
        'trends': trends,
        'anomalies': anomalies,
        'insights': insights
    }


@app.post("/ml/forecast/spending")
async def forecast_spending(req: ForecastSpendingRequest):
    """
    Forecast spending for each category for the next month.
    Requires minimum 3 months of transaction history.
    Returns forecasts with min/expected/max ranges and warnings if needed.
    """
    # Validate minimum transaction history
    if len(req.transactions) < 3:
        return {
            'error': 'Insufficient transaction history',
            'message': 'Minimum 3 months of transaction data required for forecasting'
        }
    
    # Prepare monthly spending data per category
    category_series = prepare_monthly_spending_data(req.transactions)
    
    # Check if we have enough data
    if not category_series:
        return {
            'error': 'Insufficient data',
            'message': 'Unable to generate forecasts with available transaction history'
        }
    
    # Generate forecasts for each category
    forecasts = {}
    total_expected = 0.0
    
    # Standard spending categories
    all_categories = ['rent', 'food', 'transport', 'entertainment', 'shopping', 'education', 'misc']
    
    for category in all_categories:
        if category in category_series:
            forecast = forecast_category_spending(category_series[category])
            forecasts[category] = forecast
            total_expected += forecast['expected']
        else:
            # No data for this category, use zero forecast
            forecasts[category] = {
                'min': 0.0,
                'expected': 0.0,
                'max': 0.0
            }
    
    # Calculate required monthly savings for goals
    required_savings = 0.0
    if req.goals:
        required_savings = calculate_required_monthly_savings(req.goals)
    
    # Add required savings to total expected spending
    total_with_savings = total_expected + required_savings
    
    # Check if forecast exceeds income
    warning = None
    if req.income and total_with_savings > req.income:
        warning = "Forecasted spending exceeds income"
    
    # Store forecast for accuracy tracking
    next_month = datetime.now() + timedelta(days=30)
    forecast_month = (next_month.year, next_month.month)
    store_forecast(req.userId, forecasts, forecast_month)
    
    response = {
        'forecasts': forecasts,
        'totalExpected': round(total_expected, 2),
        'requiredSavings': round(required_savings, 2)
    }
    
    if warning:
        response['warning'] = warning
    
    return response


@app.get("/ml/monitoring/forecast-accuracy")
async def get_forecast_accuracy():
    """
    Get forecast accuracy metrics for monitoring.
    Returns aggregate accuracy statistics across all evaluated forecasts.
    """
    metrics = get_forecast_accuracy_metrics()
    return metrics


@app.post("/ml/recommend/budget")
async def recommend_budget(req: RecommendBudgetRequest):
    """
    Generate personalized budget recommendations using 50/30/20 rule with ML-informed adjustments.
    
    Algorithm:
    1. Apply 50/30/20 rule as baseline (needs/wants/savings)
    2. Analyze historical spending patterns
    3. Adjust allocations based on historical averages
    4. Apply ML-informed adjustments based on financial literacy and saving habit scores
    5. Incorporate financial goals into savings allocation
    6. Generate rationale for each allocation
    
    Returns allocations and rationale for all categories.
    """
    # Step 1: Calculate historical spending averages
    historical_averages = calculate_historical_spending_averages(req.transactions)
    
    # Step 2: Apply 50/30/20 rule as baseline
    baseline_allocations = apply_50_30_20_rule(req.income)
    
    # Step 3: Adjust with historical data
    adjusted_allocations = adjust_allocations_with_historical_data(
        baseline_allocations,
        historical_averages,
        req.income
    )
    
    # Step 4: Apply ML-informed adjustments
    ml_adjusted_allocations = apply_ml_informed_adjustments(
        adjusted_allocations,
        historical_averages,
        req.financial_literacy_score,
        req.saving_habit_score,
        req.income
    )
    
    # Step 5: Incorporate financial goals
    final_allocations = incorporate_goals_into_budget(
        ml_adjusted_allocations,
        req.goals or [],
        req.income
    )
    
    # Step 6: Generate rationale
    rationale = generate_allocation_rationale(
        final_allocations,
        req.income,
        historical_averages,
        req.goals or []
    )
    
    # Round all allocations to 2 decimal places
    rounded_allocations = {k: round(v, 2) for k, v in final_allocations.items()}
    
    return {
        'allocations': rounded_allocations,
        'rationale': rationale
    }



@app.post("/ml/recommend/budget-xgboost")
async def recommend_budget_xgboost(req: XGBoostBudgetRequest):
    """
    Generate budget recommendations using pre-trained XGBoost model.
    
    This endpoint uses the XGBoost multi-output regressor trained on user profiles
    to recommend optimized budgets for 8 spending categories.
    
    Features: Income, Age, Dependents, Occupation, City_Tier, Rent, Loan_Repayment, Insurance, Desired_Savings_Percentage
    Outputs: Groceries, Transport, Eating_Out, Entertainment, Utilities, Healthcare, Education, Miscellaneous
    """
    if _budget_model_data is None:
        return {
            'error': 'Model not loaded',
            'message': 'Budget model not available. Run train_budget_model.py to create it.'
        }
    
    try:
        # Extract model components
        model = _budget_model_data['model']
        encoders = _budget_model_data['encoders']
        feature_cols = _budget_model_data['feature_cols']
        target_cols = _budget_model_data['target_cols']
        
        # Encode categorical features
        age_enc = encoders['Age'].transform([req.Age])[0]
        occupation_enc = encoders['Occupation'].transform([req.Occupation])[0]
        city_tier_enc = encoders['City_Tier'].transform([req.City_Tier])[0]
        
        # Prepare feature vector
        features = np.array([[
            req.Income,
            age_enc,
            req.Dependents,
            occupation_enc,
            city_tier_enc,
            req.Rent,
            req.Loan_Repayment,
            req.Insurance,
            req.Desired_Savings_Percentage
        ]])
        
        # Make prediction
        predictions = model.predict(features)[0]
        
        # Build response
        allocations = {}
        rationale = {}
        
        for i, category in enumerate(target_cols):
            amount = round(float(predictions[i]), 2)
            allocations[category] = amount
            percentage = (amount / req.Income * 100) if req.Income > 0 else 0
            rationale[category] = f"{category}: ₹{amount:.0f} ({percentage:.1f}% of income, ML-optimized based on your profile)"
        
        # Calculate savings
        total_allocated = sum(allocations.values())
        savings = max(0, req.Income - req.Rent - req.Loan_Repayment - req.Insurance - total_allocated)
        allocations['Savings'] = round(savings, 2)
        
        savings_pct = (savings / req.Income * 100) if req.Income > 0 else 0
        rationale['Savings'] = f"Savings: ₹{savings:.0f} ({savings_pct:.1f}% of income, after fixed expenses)"
        
        return {
            'allocations': allocations,
            'rationale': rationale,
            'model_version': _budget_model_data.get('version', 'unknown'),
            'total_allocated': round(total_allocated, 2),
            'fixed_expenses': round(req.Rent + req.Loan_Repayment + req.Insurance, 2)
        }
        
    except Exception as e:
        return {
            'error': 'Prediction failed',
            'message': str(e)
        }


@app.post("/ml/detect/behavior-anomaly")
async def detect_behavior_anomaly(req: FinancialBehaviorRequest):
    """
    Detect anomalous financial behavior from social media/tweet data.
    
    Uses IsolationForest + RandomForest to identify unusual financial behavior patterns.
    
    Features: tweet_content, topic_tags, likes, retweets, replies, sentiment_score, emotion, financial_behavior
    Output: Anomaly label (0=normal, 1=anomaly) and anomaly score
    """
    if _anomaly_behavior_model_data is None:
        return {
            'error': 'Model not loaded',
            'message': 'Anomaly behavior model not available. Run train_anomaly_behavior_model.py to create it.'
        }
    
    try:
        # Extract model components
        iso_forest = _anomaly_behavior_model_data['iso_forest']
        rf_classifier = _anomaly_behavior_model_data['rf_classifier']
        scaler = _anomaly_behavior_model_data['scaler']
        vectorizer = _anomaly_behavior_model_data['vectorizer']
        encoders = _anomaly_behavior_model_data['encoders']
        numeric_features = _anomaly_behavior_model_data['numeric_features']
        
        # Create dataframe
        df = pd.DataFrame([{
            'tweet_content': req.tweet_content,
            'topic_tags': req.topic_tags,
            'likes': req.likes,
            'retweets': req.retweets,
            'replies': req.replies,
            'sentiment_score': req.sentiment_score,
            'emotion': req.emotion,
            'financial_behavior': req.financial_behavior
        }])
        
        # Engineer features
        df['tweet_len'] = df['tweet_content'].str.len()
        df['engagement'] = df['likes'] + df['retweets'] + df['replies']
        df['sent_mag'] = df['sentiment_score'].abs()
        df['tag_count'] = df['topic_tags'].str.count(',') + 1
        
        # TF-IDF features
        tfidf_features = vectorizer.transform(df['tweet_content'])
        tfidf_df = pd.DataFrame(
            tfidf_features.toarray(),
            columns=[f'tfidf_{i}' for i in range(tfidf_features.shape[1])]
        )
        df = pd.concat([df.reset_index(drop=True), tfidf_df], axis=1)
        
        # Encode categorical features
        df['emotion_encoded'] = encoders['emotion'].transform(df['emotion'])
        df['financial_behavior_encoded'] = encoders['financial_behavior'].transform(df['financial_behavior'])
        
        # Prepare feature vector
        tfidf_cols = [col for col in df.columns if col.startswith('tfidf_')]
        feature_cols = numeric_features + tfidf_cols
        X = df[feature_cols].values
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Get predictions
        iso_pred = iso_forest.predict(X_scaled)[0]
        iso_score = float(iso_forest.decision_function(X_scaled)[0])
        rf_pred = rf_classifier.predict(X_scaled)[0]
        rf_proba = rf_classifier.predict_proba(X_scaled)[0]
        
        # Convert IsolationForest prediction (-1 = anomaly, 1 = normal)
        is_anomaly_iso = 1 if iso_pred == -1 else 0
        
        # Ensemble: anomaly if either model flags it
        is_anomaly = 1 if (is_anomaly_iso == 1 or rf_pred == 1) else 0
        
        # Confidence score (higher = more anomalous)
        confidence = float(rf_proba[1]) if len(rf_proba) > 1 else 0.0
        
        return {
            'is_anomaly': is_anomaly,
            'anomaly_score': round(iso_score, 4),
            'confidence': round(confidence, 4),
            'isolation_forest_prediction': is_anomaly_iso,
            'random_forest_prediction': int(rf_pred),
            'interpretation': 'Anomalous behavior detected' if is_anomaly else 'Normal behavior',
            'model_version': _anomaly_behavior_model_data.get('version', 'unknown')
        }
        
    except Exception as e:
        return {
            'error': 'Detection failed',
            'message': str(e)
        }


@app.post("/ml/analyze/spending-anomaly")
async def analyze_spending_anomaly(req: SpendingTransactionRequest):
    """
    Analyze a spending transaction to detect anomalous spending patterns.
    
    Uses IsolationForest to identify unusual spending transactions based on
    amount, category, and temporal patterns.
    
    Features: date, amount, category
    Output: Anomaly label (0=normal, 1=anomaly) and anomaly score
    """
    if _spending_analysis_model_data is None:
        return {
            'error': 'Model not loaded',
            'message': 'Spending analysis model not available. Run train_spending_analysis_model.py to create it.'
        }
    
    try:
        # Extract model components
        model = _spending_analysis_model_data['model']
        scaler = _spending_analysis_model_data['scaler']
        encoder = _spending_analysis_model_data['encoder']
        numeric_features = _spending_analysis_model_data['numeric_features']
        
        # Parse date
        try:
            date = datetime.fromisoformat(req.date.replace('Z', '+00:00'))
        except:
            date = datetime.now()
        
        # Create dataframe
        df = pd.DataFrame([{
            'date': date,
            'amount': req.amount,
            'category': req.category
        }])
        
        # Engineer features
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['hour'] = df['date'].dt.hour
        df['amount_log'] = np.log1p(df['amount'])
        
        # For single transaction, use amount as daily spending
        df['amount_daily'] = df['amount']
        
        # Use a typical daily average (this would be calculated from historical data in production)
        typical_daily_avg = 2000.0
        df['amount_vs_daily_avg'] = df['amount'] / typical_daily_avg
        
        # One-hot encode category
        df['category_filtered'] = df['category']
        category_encoded = encoder.transform(df[['category_filtered']])
        category_df = pd.DataFrame(
            category_encoded,
            columns=[f'category_{cat}' for cat in encoder.categories_[0]]
        )
        
        # Build feature vector matching training data
        # Start with numeric features
        feature_values = []
        for feat in numeric_features:
            feature_values.append(df[feat].values[0])
        
        # Add category one-hot features
        for col in category_df.columns:
            feature_values.append(category_df[col].values[0])
        
        X = np.array([feature_values])
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Get prediction
        prediction = model.predict(X_scaled)[0]
        anomaly_score = float(model.decision_function(X_scaled)[0])
        
        # Convert prediction (-1 = anomaly, 1 = normal)
        is_anomaly = 1 if prediction == -1 else 0
        
        # Severity based on score (more negative = more anomalous)
        severity = 'high' if anomaly_score < -0.3 else 'medium' if anomaly_score < -0.1 else 'low'
        
        return {
            'is_anomaly': is_anomaly,
            'anomaly_score': round(anomaly_score, 4),
            'severity': severity,
            'interpretation': f'Anomalous spending detected ({severity} severity)' if is_anomaly else 'Normal spending pattern',
            'amount': req.amount,
            'category': req.category,
            'model_version': _spending_analysis_model_data.get('version', 'unknown')
        }
        
    except Exception as e:
        return {
            'error': 'Analysis failed',
            'message': str(e)
        }
