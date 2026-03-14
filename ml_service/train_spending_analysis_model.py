"""
Training script for Spending Behavior Analysis Model

This model analyzes spending transactions to detect anomalous spending patterns.
Uses IsolationForest for anomaly detection.

Features: date, amount, category
Derived: day_of_week, month, hour, amount_log, amount_daily, amount_vs_daily_avg, category_onehot
Output: Anomaly label and anomaly score
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from datetime import datetime, timedelta
import os


def load_and_prepare_data():
    """
    Load and prepare synthetic spending transaction data for training.
    In production, this would load from a real dataset.
    """
    # Generate synthetic training data
    np.random.seed(42)
    n_samples = 5000
    
    # Generate dates over past year
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    dates = [start_date + timedelta(days=np.random.randint(0, 365)) for _ in range(n_samples)]
    
    # Categories
    categories = ['Groceries', 'Transport', 'Eating_Out', 'Entertainment', 
                 'Utilities', 'Healthcare', 'Education', 'Miscellaneous', 'Shopping', 'Rent']
    
    # Generate amounts (normal spending)
    category_avg = {
        'Groceries': 3000,
        'Transport': 2000,
        'Eating_Out': 1500,
        'Entertainment': 1000,
        'Utilities': 2500,
        'Healthcare': 1500,
        'Education': 2000,
        'Miscellaneous': 1000,
        'Shopping': 2500,
        'Rent': 10000
    }
    
    data = []
    for i in range(n_samples):
        category = np.random.choice(categories)
        avg_amount = category_avg[category]
        amount = np.random.normal(avg_amount, avg_amount * 0.3)
        amount = max(100, amount)  # Minimum 100
        
        data.append({
            'date': dates[i],
            'amount': round(amount, 2),
            'category': category
        })
    
    df = pd.DataFrame(data)
    
    # Create anomaly labels (5% anomalies)
    df['is_anomaly'] = 0
    n_anomalies = int(n_samples * 0.05)
    anomaly_indices = np.random.choice(df.index, n_anomalies, replace=False)
    
    # Anomalies have extreme amounts (3-5x normal)
    for idx in anomaly_indices:
        category = df.loc[idx, 'category']
        avg_amount = category_avg[category]
        df.loc[idx, 'amount'] = np.random.uniform(avg_amount * 3, avg_amount * 5)
        df.loc[idx, 'is_anomaly'] = 1
    
    return df


def engineer_features(df, encoder=None, fit=True):
    """
    Engineer features from transaction data.
    """
    df = df.copy()
    
    # Temporal features
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['hour'] = df['date'].dt.hour if hasattr(df['date'].dt, 'hour') else 12  # Default to noon if no time
    
    # Amount features
    df['amount_log'] = np.log1p(df['amount'])
    
    # Daily aggregates
    df['date_only'] = df['date'].dt.date
    daily_spending = df.groupby('date_only')['amount'].sum().to_dict()
    df['amount_daily'] = df['date_only'].map(daily_spending)
    
    # Amount vs daily average
    daily_avg = df['amount_daily'].mean()
    df['amount_vs_daily_avg'] = df['amount'] / daily_avg
    
    # One-hot encode top 10 categories
    top_categories = df['category'].value_counts().head(10).index.tolist()
    df['category_filtered'] = df['category'].apply(lambda x: x if x in top_categories else 'Other')
    
    if fit:
        encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        category_encoded = encoder.fit_transform(df[['category_filtered']])
    else:
        category_encoded = encoder.transform(df[['category_filtered']])
    
    category_df = pd.DataFrame(
        category_encoded,
        columns=[f'category_{cat}' for cat in encoder.categories_[0]]
    )
    
    # Combine features - drop original category column
    df = df.drop(columns=['category', 'category_filtered', 'date_only'], errors='ignore')
    df = pd.concat([df.reset_index(drop=True), category_df], axis=1)
    
    return df, encoder


def train_model():
    """
    Train IsolationForest for spending anomaly detection.
    """
    print("Loading and preparing data...")
    df = load_and_prepare_data()
    
    # Engineer features
    print("Engineering features...")
    df, encoder = engineer_features(df, fit=True)
    
    # Define feature columns
    numeric_features = ['day_of_week', 'month', 'hour', 'amount_log', 
                       'amount_daily', 'amount_vs_daily_avg']
    category_features = [col for col in df.columns if col.startswith('category_')]
    feature_cols = numeric_features + category_features
    
    X = df[feature_cols].values  # Convert to numpy array
    y = df['is_anomaly'].values
    
    # Scale features
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    
    # Train IsolationForest
    print("Training IsolationForest...")
    iso_forest = IsolationForest(
        contamination=0.05,
        random_state=42,
        n_estimators=100,
        max_samples='auto'
    )
    iso_forest.fit(X_train)
    
    # Evaluate
    print("\nEvaluating model...")
    y_pred = iso_forest.predict(X_test)
    y_pred = np.where(y_pred == -1, 1, 0)  # Convert to 0/1
    
    print(classification_report(y_test, y_pred))
    
    # Get anomaly scores
    anomaly_scores = iso_forest.decision_function(X_test)
    print(f"\nAnomaly score range: [{anomaly_scores.min():.3f}, {anomaly_scores.max():.3f}]")
    
    # Save model and preprocessing artifacts
    print("\nSaving model and preprocessing artifacts...")
    model_data = {
        'model': iso_forest,
        'scaler': scaler,
        'encoder': encoder,
        'feature_cols': feature_cols,
        'numeric_features': numeric_features,
        'version': '1.0'
    }
    
    joblib.dump(model_data, 'spending_analysis_model.pkl')
    print("Model saved to spending_analysis_model.pkl")
    
    return model_data


if __name__ == '__main__':
    train_model()
