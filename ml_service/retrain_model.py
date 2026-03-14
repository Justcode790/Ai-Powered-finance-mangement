"""
Retraining script that combines original training data with accumulated prediction logs
Run this monthly or when model performance degrades
"""
import os
import sys
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


FEATURES = [
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

TARGET = "savings"


def load_original_data():
    """Load the original training dataset"""
    base_dir = os.path.dirname(__file__)
    data_path = os.path.join(base_dir, "financial_literacy_youth_dataset_10000.csv")
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Original dataset not found: {data_path}")
    
    df = pd.read_csv(data_path)
    print(f"Loaded original dataset: {len(df)} samples")
    return df


def load_prediction_logs():
    """
    Load prediction logs from MongoDB (would need to connect to DB)
    For now, this is a placeholder that returns empty DataFrame
    In production, you would:
    1. Connect to MongoDB
    2. Query PredictionLog collection where actualSavings is not null
    3. Extract features and actualSavings
    4. Return as DataFrame
    """
    print("Note: Prediction log loading not implemented yet")
    print("      In production, this would query MongoDB PredictionLog collection")
    
    # Placeholder: return empty DataFrame with correct columns
    return pd.DataFrame(columns=FEATURES + [TARGET])


def combine_datasets(original_df, logs_df):
    """Combine original training data with prediction logs"""
    if len(logs_df) == 0:
        print("No prediction logs available, using only original data")
        return original_df
    
    combined = pd.concat([original_df, logs_df], ignore_index=True)
    print(f"Combined dataset: {len(combined)} samples ({len(logs_df)} from logs)")
    return combined


def train_model(df):
    """Train GradientBoosting model on combined data"""
    X = df[FEATURES]
    y = df[TARGET]

    print(f"\nDataset shape: {X.shape}")
    print(f"Target range: {y.min():.2f} to {y.max():.2f}")

    # Split data 80/20
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("\nTraining GradientBoosting model...")
    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        min_samples_split=20,
        random_state=42,
        verbose=1
    )

    model.fit(X_train, y_train)

    # Evaluate
    print("\nEvaluating model...")
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"\nModel Performance:")
    print(f"  MAE:  {mae:.2f} rupees")
    print(f"  RMSE: {rmse:.2f} rupees")
    print(f"  R²:   {r2:.4f}")

    if mae < 500:
        print(f"\n✓ Model meets target MAE < 500 rupees")
    else:
        print(f"\n✗ Model does not meet target MAE < 500 rupees")

    return model, {'mae': float(mae), 'rmse': float(rmse), 'r2': float(r2)}


def save_model(model, metrics, version_suffix=""):
    """Save model with versioning"""
    base_dir = os.path.dirname(__file__)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    version = f"v2.0_gradientboosting_retrained_{timestamp}{version_suffix}"
    
    model_data = {
        'model': model,
        'version': version,
        'features': FEATURES,
        'metrics': metrics,
        'retrained_at': datetime.now().isoformat()
    }
    
    # Save as current model
    current_path = os.path.join(base_dir, "model.pkl")
    joblib.dump(model_data, current_path)
    print(f"\nModel saved to: {current_path}")
    
    # Also save versioned backup
    backup_path = os.path.join(base_dir, f"model_{version}.pkl")
    joblib.dump(model_data, backup_path)
    print(f"Backup saved to: {backup_path}")
    
    print(f"Model version: {version}")
    
    return version


def main():
    print("=" * 60)
    print("Model Retraining Pipeline")
    print("=" * 60)
    
    try:
        # Load data
        original_df = load_original_data()
        logs_df = load_prediction_logs()
        
        # Combine datasets
        combined_df = combine_datasets(original_df, logs_df)
        
        # Train model
        model, metrics = train_model(combined_df)
        
        # Save model
        version = save_model(model, metrics)
        
        print("\n" + "=" * 60)
        print("Retraining completed successfully!")
        print(f"New model version: {version}")
        print("=" * 60)
        
        return 0
        
    except Exception as e:
        print(f"\nError during retraining: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
