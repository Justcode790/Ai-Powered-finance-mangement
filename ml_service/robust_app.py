"""
Robust ML service with better error handling for deployment.
"""

import os
import sys
import traceback
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Robust ML Service", version="1.0.0")

# Global variables for models
_models_loaded = False
_model_data = None
_budget_model_data = None
_anomaly_behavior_model_data = None
_spending_analysis_model_data = None

class PredictRequest(BaseModel):
    age: int
    income: float
    rent: float = 0
    food: float = 0
    transport: float = 0
    entertainment: float = 0
    shopping: float = 0
    education: float = 0
    misc: float = 0
    financial_literacy_score: float = 5.0
    saving_habit_score: float = 5.0

def safe_load_model(model_path: str, model_name: str):
    """Safely load a model with error handling."""
    try:
        if not os.path.exists(model_path):
            logger.warning(f"{model_name} not found at {model_path}")
            return None
        
        import joblib
        model = joblib.load(model_path)
        logger.info(f"✅ {model_name} loaded successfully")
        return model
    except Exception as e:
        logger.error(f"❌ Failed to load {model_name}: {e}")
        return None

def load_all_models():
    """Load all models with error handling."""
    global _models_loaded, _model_data, _budget_model_data, _anomaly_behavior_model_data, _spending_analysis_model_data
    
    logger.info("🔄 Loading ML models...")
    
    # Load main model
    _model_data = safe_load_model("model.pkl", "Main Model")
    
    # Load budget model
    _budget_model_data = safe_load_model("budget_model.pkl", "Budget Model")
    
    # Load anomaly model
    _anomaly_behavior_model_data = safe_load_model("anomaly_behavior_model.pkl", "Anomaly Model")
    
    # Load spending analysis model
    _spending_analysis_model_data = safe_load_model("spending_analysis_model.pkl", "Spending Model")
    
    _models_loaded = True
    logger.info("🎉 Model loading complete")

@app.on_event("startup")
async def startup_event():
    """Startup event with comprehensive error handling."""
    try:
        logger.info("🚀 Starting ML Service...")
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Working directory: {os.getcwd()}")
        logger.info(f"Files in directory: {os.listdir('.')}")
        
        # Check if model files exist
        model_files = ["model.pkl", "budget_model.pkl", "anomaly_behavior_model.pkl", "spending_analysis_model.pkl"]
        for file in model_files:
            if os.path.exists(file):
                logger.info(f"✅ Found {file}")
            else:
                logger.warning(f"❌ Missing {file}")
        
        # Load models
        load_all_models()
        
        logger.info("✅ Startup complete!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        logger.error(traceback.format_exc())
        # Don't raise - let the service start even if models fail

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Robust ML Service Running",
        "status": "healthy",
        "models_loaded": _models_loaded,
        "port": os.environ.get("PORT", "unknown"),
        "available_models": {
            "main_model": _model_data is not None,
            "budget_model": _budget_model_data is not None,
            "anomaly_model": _anomaly_behavior_model_data is not None,
            "spending_model": _spending_analysis_model_data is not None
        }
    }

@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "ok",
        "models_loaded": _models_loaded,
        "working_directory": os.getcwd(),
        "python_version": sys.version
    }

@app.post("/predict")
async def predict(req: PredictRequest):
    """Basic prediction endpoint."""
    if _model_data is None:
        # Fallback calculation if model not loaded
        predicted_savings = max(0, req.income - req.rent - req.food - req.transport - req.entertainment - req.shopping - req.education - req.misc)
        return {
            "predicted_savings": round(predicted_savings, 2),
            "confidence_interval": {
                "lower": round(predicted_savings * 0.8, 2),
                "upper": round(predicted_savings * 1.2, 2)
            },
            "model_version": "fallback",
            "note": "Using fallback calculation - main model not available"
        }
    
    try:
        import numpy as np
        
        # Feature order from original model
        features = np.array([[
            req.age, req.income, req.rent, req.food, req.transport,
            req.entertainment, req.shopping, req.education, req.misc,
            req.financial_literacy_score, req.saving_habit_score
        ]], dtype=float)
        
        # Make prediction
        if isinstance(_model_data, dict):
            model = _model_data['model']
        else:
            model = _model_data
            
        pred = float(model.predict(features)[0])
        
        return {
            "predicted_savings": round(pred, 2),
            "confidence_interval": {
                "lower": round(pred * 0.9, 2),
                "upper": round(pred * 1.1, 2)
            },
            "model_version": "ml_model"
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)