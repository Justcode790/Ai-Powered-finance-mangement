import os
import joblib
import pandas as pd
import numpy as np
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

# Model version for tracking
MODEL_VERSION = "v2.0_gradientboosting"


def main():
    base_dir = os.path.dirname(__file__)
    data_path = os.path.join(base_dir, "financial_literacy_youth_dataset_10000.csv")
    model_path = os.path.join(base_dir, "model.pkl")

    print("Loading dataset...")
    df = pd.read_csv(data_path)

    X = df[FEATURES]
    y = df[TARGET]

    print(f"Dataset shape: {X.shape}")
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

    # Evaluate on test set
    print("\nEvaluating model...")
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"\nModel Performance:")
    print(f"  MAE:  {mae:.2f} rupees")
    print(f"  RMSE: {rmse:.2f} rupees")
    print(f"  R²:   {r2:.4f}")

    # Check if MAE meets target (< 500 rupees)
    if mae < 500:
        print(f"\n✓ Model meets target MAE < 500 rupees")
    else:
        print(f"\n✗ Model does not meet target MAE < 500 rupees")
        print(f"  Consider tuning hyperparameters or adding more data")

    # Feature importance
    print("\nFeature Importance:")
    feature_importance = pd.DataFrame({
        'feature': FEATURES,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    print(feature_importance.to_string(index=False))

    # Save model with metadata
    model_data = {
        'model': model,
        'version': MODEL_VERSION,
        'features': FEATURES,
        'metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2)
        }
    }

    joblib.dump(model_data, model_path)
    print(f"\nModel saved to: {model_path}")
    print(f"Model version: {MODEL_VERSION}")


if __name__ == "__main__":
    main()

