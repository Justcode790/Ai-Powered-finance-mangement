#!/usr/bin/env python3
"""
Simple test script to verify ML service can start properly.
Run this before deploying to catch any startup issues.
"""

import sys
import os
import traceback

def test_imports():
    """Test if all required modules can be imported."""
    try:
        import pandas
        import numpy
        import sklearn
        import fastapi
        import uvicorn
        import joblib
        import statsmodels
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_model_files():
    """Test if all required model files exist."""
    required_files = [
        "model.pkl",
        "budget_model.pkl", 
        "anomaly_behavior_model.pkl",
        "spending_analysis_model.pkl"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing model files: {missing_files}")
        return False
    else:
        print("✅ All model files present")
        return True

def test_app_creation():
    """Test if FastAPI app can be created and models loaded."""
    try:
        from model import app, load_model, load_budget_model, load_anomaly_behavior_model, load_spending_analysis_model
        
        # Test model loading
        load_model()
        load_budget_model()
        load_anomaly_behavior_model()
        load_spending_analysis_model()
        
        print("✅ App creation and model loading successful")
        return True
    except Exception as e:
        print(f"❌ App creation failed: {e}")
        traceback.print_exc()
        return False

def main():
    print("🧪 Testing ML Service Deployment Readiness...")
    print("=" * 50)
    
    tests = [
        ("Imports", test_imports),
        ("Model Files", test_model_files),
        ("App Creation", test_app_creation)
    ]
    
    all_passed = True
    for test_name, test_func in tests:
        print(f"\n📋 Testing {test_name}...")
        if not test_func():
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! ML service is ready for deployment.")
        print("\n🚀 Deploy with: uvicorn model:app --host 0.0.0.0 --port $PORT")
    else:
        print("❌ Some tests failed. Fix issues before deploying.")
        sys.exit(1)

if __name__ == "__main__":
    main()