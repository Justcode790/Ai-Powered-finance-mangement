"""
Minimal ML service without statsmodels to avoid compatibility issues.
"""

import os
import sys
import traceback
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Minimal ML Service", version="1.0.0")

# Global variables for models
_model_data = None
_budget_model_data = None

class PredictRequest(BaseModel):
    age: int = Field(..., gt=18)
    income: float = Field(..., gt=0)
    rent: float = 0
    food: float = 0
    transport: float = 0
    entertainment: float = 0
    shopping: float = 0
    education: float = 0
    misc: float = 0
    financial_literacy_score: float = Field(default=5.0, ge=1, le=10)
    saving_habit_score: float = Field(default=5.0, ge=1, le=10)

class Transaction(BaseModel):
    transactionId: str
    category: str
    amount: float
    date: str

class Goal(BaseModel):
    name: str
    targetAmount: float
    currentAmount: float = 0
    deadline: Optional[str] = None

class RecommendBudgetRequest(BaseModel):
    income: float
    transactions: List[Transaction] = []
    goals: Optional[List[Goal]] = []
    financial_literacy_score: float = 5.0
    saving_habit_score: float = 5.0

def load_model():
    """Load the main prediction model."""
    global _model_data
    try:
        model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
        if os.path.exists(model_path):
            _model_data = joblib.load(model_path)
            logger.info("✅ Main model loaded successfully")
        else:
            logger.warning("❌ Main model file not found")
    except Exception as e:
        logger.error(f"❌ Failed to load main model: {e}")

def load_budget_model():
    """Load the budget recommendation model."""
    global _budget_model_data
    try:
        model_path = os.path.join(os.path.dirname(__file__), "budget_model.pkl")
        if os.path.exists(model_path):
            _budget_model_data = joblib.load(model_path)
            logger.info("✅ Budget model loaded successfully")
        else:
            logger.warning("❌ Budget model file not found")
    except Exception as e:
        logger.error(f"❌ Failed to load budget model: {e}")

@app.on_event("startup")
async def startup_event():
    """Startup event with error handling."""
    try:
        logger.info("🚀 Starting Minimal ML Service...")
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Working directory: {os.getcwd()}")
        
        # Check model files
        model_files = ["model.pkl", "budget_model.pkl"]
        for file in model_files:
            if os.path.exists(file):
                logger.info(f"✅ Found {file}")
            else:
                logger.warning(f"❌ Missing {file}")
        
        # Load models
        load_model()
        load_budget_model()
        
        logger.info("✅ Startup complete!")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        logger.error(traceback.format_exc())

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Minimal ML Service Running",
        "status": "healthy",
        "models": {
            "main_model": _model_data is not None,
            "budget_model": _budget_model_data is not None
        },
        "port": os.environ.get("PORT", "unknown")
    }

@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "ok",
        "python_version": sys.version,
        "working_directory": os.getcwd(),
        "available_files": os.listdir('.') if os.path.exists('.') else []
    }

@app.post("/predict")
async def predict(req: PredictRequest):
    """Prediction endpoint with fallback."""
    try:
        # Feature order
        FEATURE_ORDER = [
            "age", "income", "rent", "food", "transport", 
            "entertainment", "shopping", "education", "misc",
            "financial_literacy_score", "saving_habit_score"
        ]
        
        features = np.array([[getattr(req, f) for f in FEATURE_ORDER]], dtype=float)
        
        if _model_data is not None:
            # Use ML model
            if isinstance(_model_data, dict):
                model = _model_data['model']
                version = _model_data.get('version', 'unknown')
            else:
                model = _model_data
                version = 'legacy'
            
            pred = float(model.predict(features)[0])
            
            return {
                "predicted_savings": round(pred, 2),
                "confidence_interval": {
                    "lower": round(pred * 0.9, 2),
                    "upper": round(pred * 1.1, 2)
                },
                "model_version": version
            }
        else:
            # Fallback calculation
            total_expenses = req.rent + req.food + req.transport + req.entertainment + req.shopping + req.education + req.misc
            predicted_savings = max(0, req.income - total_expenses)
            
            return {
                "predicted_savings": round(predicted_savings, 2),
                "confidence_interval": {
                    "lower": round(predicted_savings * 0.8, 2),
                    "upper": round(predicted_savings * 1.2, 2)
                },
                "model_version": "fallback",
                "note": "Using rule-based calculation"
            }
            
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/ml/recommend/budget")
async def recommend_budget(req: RecommendBudgetRequest):
    """Budget recommendation with 50/30/20 rule."""
    try:
        # Apply 50/30/20 rule
        needs_amount = req.income * 0.50  # rent, food, transport, education
        wants_amount = req.income * 0.30  # entertainment, shopping, misc
        savings_amount = req.income * 0.20
        
        # Distribute needs (4 categories)
        needs_per_category = needs_amount / 4
        
        # Distribute wants (3 categories)  
        wants_per_category = wants_amount / 3
        
        allocations = {
            'rent': needs_per_category,
            'food': needs_per_category,
            'transport': needs_per_category,
            'education': needs_per_category,
            'entertainment': wants_per_category,
            'shopping': wants_per_category,
            'misc': wants_per_category,
            'savings': savings_amount
        }
        
        # Adjust based on financial literacy score
        if req.financial_literacy_score >= 8:
            # Increase savings by 5%
            extra_savings = req.income * 0.05
            allocations['savings'] += extra_savings
            # Reduce wants proportionally
            reduction_per_want = extra_savings / 3
            allocations['entertainment'] -= reduction_per_want
            allocations['shopping'] -= reduction_per_want
            allocations['misc'] -= reduction_per_want
        
        # Round allocations
        rounded_allocations = {k: round(v, 2) for k, v in allocations.items()}
        
        # Generate rationale
        rationale = {}
        for category, amount in rounded_allocations.items():
            percentage = (amount / req.income * 100) if req.income > 0 else 0
            rationale[category] = f"{category.capitalize()}: ₹{amount:.0f} ({percentage:.1f}% of income)"
        
        return {
            'allocations': rounded_allocations,
            'rationale': rationale
        }
        
    except Exception as e:
        logger.error(f"Budget recommendation error: {e}")
        raise HTTPException(status_code=500, detail=f"Budget recommendation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)