"""
Training script for XGBoost Budget Recommendation Model

This model recommends optimized budgets for 8 spending categories based on user profile.
Uses XGBoost Regressor with multi-output prediction.

Features: Income, Age, Dependents, Occupation, City_Tier, Rent, Loan_Repayment, Insurance, Desired_Savings_Percentage
Outputs: Groceries, Transport, Eating_Out, Entertainment, Utilities, Healthcare, Education, Miscellaneous
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import os


def load_and_prepare_data():
    """
    Load and prepare synthetic budget data for training.
    In production, this would load from a real dataset.
    """
    # Generate synthetic training data
    np.random.seed(42)
    n_samples = 5000
    
    # Generate features
    data = {
        'Income': np.random.randint(20000, 150000, n_samples),
        'Age': np.random.choice(['18-25', '26-35', '36-45', '46-60'], n_samples),
        'Dependents': np.random.randint(0, 5, n_samples),
        'Occupation': np.random.choice(['Student', 'Salaried', 'Self-Employed', 'Freelancer'], n_samples),
        'City_Tier': np.random.choice(['Tier 1', 'Tier 2', 'Tier 3'], n_samples),
        'Rent': np.random.randint(0, 40000, n_samples),
        'Loan_Repayment': np.random.randint(0, 30000, n_samples),
        'Insurance': np.random.randint(0, 5000, n_samples),
        'Desired_Savings_Percentage': np.random.randint(10, 40, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Generate target variables (optimized budgets)
    # Apply 80% cap on current spending to encourage savings
    df['Groceries'] = (df['Income'] * 0.15 * (1 - df['Desired_Savings_Percentage'] / 100)).clip(1000, 20000)
    df['Transport'] = (df['Income'] * 0.10 * (1 - df['Desired_Savings_Percentage'] / 100)).clip(500, 15000)
    df['Eating_Out'] = (df['Income'] * 0.08 * (1 - df['Desired_Savings_Percentage'] / 100)).clip(500, 10000)
    df['Entertainment'] = (df['Income'] * 0.07 * (1 - df['Desired_Savings_Percentage'] / 100)).clip(500, 8000)
    df['Utilities'] = (df['Income'] * 0.05 * (1 - df['Desired_Savings_Percentage'] / 100)).clip(1000, 8000)
    df['Healthcare'] = (df['Income'] * 0.05 * (1 - df['Desired_Savings_Percentage'] / 100)).clip(500, 10000)
    df['Education'] = (df['Income'] * 0.05 * (1 - df['Desired_Savings_Percentage'] / 100)).clip(0, 15000)
    df['Miscellaneous'] = (df['Income'] * 0.05 * (1 - df['Desired_Savings_Percentage'] / 100)).clip(500, 5000)
    
    # Add some noise for realism
    for col in ['Groceries', 'Transport', 'Eating_Out', 'Entertainment', 'Utilities', 'Healthcare', 'Education', 'Miscellaneous']:
        df[col] = df[col] * np.random.uniform(0.8, 1.2, n_samples)
        df[col] = df[col].round(2)
    
    return df


def train_model():
    """
    Train XGBoost model for budget recommendations.
    """
    print("Loading and preparing data...")
    df = load_and_prepare_data()
    
    # Encode categorical features
    print("Encoding categorical features...")
    encoders = {}
    for col in ['Age', 'Occupation', 'City_Tier']:
        le = LabelEncoder()
        df[f'{col}_enc'] = le.fit_transform(df[col])
        encoders[col] = le
    
    # Define features and targets
    feature_cols = ['Income', 'Age_enc', 'Dependents', 'Occupation_enc', 'City_Tier_enc', 
                    'Rent', 'Loan_Repayment', 'Insurance', 'Desired_Savings_Percentage']
    target_cols = ['Groceries', 'Transport', 'Eating_Out', 'Entertainment', 
                   'Utilities', 'Healthcare', 'Education', 'Miscellaneous']
    
    X = df[feature_cols]
    y = df[target_cols]
    
    # Split data
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train XGBoost model (multi-output)
    print("Training XGBoost model...")
    model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    print("\nEvaluating model...")
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"Mean Absolute Error: {mae:.2f}")
    print(f"Root Mean Squared Error: {rmse:.2f}")
    print(f"R² Score: {r2:.4f}")
    
    # Per-category metrics
    print("\nPer-category MAE:")
    for i, col in enumerate(target_cols):
        col_mae = mean_absolute_error(y_test.iloc[:, i], y_pred[:, i])
        print(f"  {col}: {col_mae:.2f}")
    
    # Save model and encoders
    print("\nSaving model and preprocessing artifacts...")
    model_data = {
        'model': model,
        'encoders': encoders,
        'feature_cols': feature_cols,
        'target_cols': target_cols,
        'metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2)
        },
        'version': '1.0'
    }
    
    joblib.dump(model_data, 'budget_model.pkl')
    print("Model saved to budget_model.pkl")
    
    return model_data


if __name__ == '__main__':
    train_model()
