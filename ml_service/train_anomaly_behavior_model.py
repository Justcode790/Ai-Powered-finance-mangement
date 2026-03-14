"""
Training script for Financial Behavior Anomaly Detection Model

This model detects anomalous financial behavior from social media/tweet data.
Uses IsolationForest for anomaly detection + RandomForestClassifier for classification.

Features: tweet_content, topic_tags, likes, retweets, replies, sentiment_score, emotion, financial_behavior
Derived: tweet_len, engagement, sent_mag, tag_count, emotion_encoded, financial_behavior_encoded, TF-IDF (50 features)
Output: Anomaly label and anomaly score
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import os


def load_and_prepare_data():
    """
    Load and prepare synthetic financial behavior data for training.
    In production, this would load from a real dataset.
    """
    # Generate synthetic training data
    np.random.seed(42)
    n_samples = 3000
    
    # Sample tweet content
    tweet_samples = [
        "Just spent all my savings on crypto",
        "Investing in stocks for long term",
        "Bought a new car on loan",
        "Saving money for retirement",
        "Gambling at casino tonight",
        "Started a side business",
        "Paying off my credit card debt",
        "Impulse shopping spree today"
    ]
    
    emotions = ['happy', 'sad', 'angry', 'neutral', 'excited', 'worried']
    behaviors = ['saving', 'investing', 'spending', 'gambling', 'borrowing', 'earning']
    
    data = {
        'tweet_content': np.random.choice(tweet_samples, n_samples),
        'topic_tags': [','.join(np.random.choice(['finance', 'money', 'investment', 'savings', 'debt'], 
                                                  np.random.randint(1, 4))) for _ in range(n_samples)],
        'likes': np.random.randint(0, 1000, n_samples),
        'retweets': np.random.randint(0, 500, n_samples),
        'replies': np.random.randint(0, 200, n_samples),
        'sentiment_score': np.random.uniform(-1, 1, n_samples),
        'emotion': np.random.choice(emotions, n_samples),
        'financial_behavior': np.random.choice(behaviors, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Create anomaly labels (10% anomalies)
    df['is_anomaly'] = np.random.choice([0, 1], n_samples, p=[0.9, 0.1])
    
    # Anomalies have extreme values
    anomaly_mask = df['is_anomaly'] == 1
    df.loc[anomaly_mask, 'likes'] = np.random.randint(2000, 5000, anomaly_mask.sum())
    df.loc[anomaly_mask, 'sentiment_score'] = np.random.choice([-0.9, 0.9], anomaly_mask.sum())
    
    return df


def engineer_features(df, vectorizer=None, fit=True):
    """
    Engineer features from raw data.
    """
    df = df.copy()
    
    # Derived features
    df['tweet_len'] = df['tweet_content'].str.len()
    df['engagement'] = df['likes'] + df['retweets'] + df['replies']
    df['sent_mag'] = df['sentiment_score'].abs()
    df['tag_count'] = df['topic_tags'].str.count(',') + 1
    
    # TF-IDF features
    if fit:
        vectorizer = TfidfVectorizer(max_features=50, stop_words='english')
        tfidf_features = vectorizer.fit_transform(df['tweet_content'])
    else:
        tfidf_features = vectorizer.transform(df['tweet_content'])
    
    tfidf_df = pd.DataFrame(
        tfidf_features.toarray(),
        columns=[f'tfidf_{i}' for i in range(tfidf_features.shape[1])]
    )
    
    # Combine features
    df = pd.concat([df.reset_index(drop=True), tfidf_df], axis=1)
    
    return df, vectorizer


def train_model():
    """
    Train IsolationForest + RandomForest for anomaly detection.
    """
    print("Loading and preparing data...")
    df = load_and_prepare_data()
    
    # Engineer features
    print("Engineering features...")
    df, vectorizer = engineer_features(df, fit=True)
    
    # Encode categorical features
    print("Encoding categorical features...")
    encoders = {}
    for col in ['emotion', 'financial_behavior']:
        le = LabelEncoder()
        df[f'{col}_encoded'] = le.fit_transform(df[col])
        encoders[col] = le
    
    # Define feature columns
    numeric_features = ['likes', 'retweets', 'replies', 'sentiment_score', 
                       'tweet_len', 'engagement', 'sent_mag', 'tag_count',
                       'emotion_encoded', 'financial_behavior_encoded']
    tfidf_features = [col for col in df.columns if col.startswith('tfidf_')]
    feature_cols = numeric_features + tfidf_features
    
    X = df[feature_cols]
    y = df['is_anomaly']
    
    # Scale features
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    
    # Train IsolationForest
    print("Training IsolationForest...")
    iso_forest = IsolationForest(
        contamination=0.1,
        random_state=42,
        n_estimators=100
    )
    iso_forest.fit(X_train)
    
    # Get anomaly scores
    anomaly_scores_train = iso_forest.decision_function(X_train)
    anomaly_scores_test = iso_forest.decision_function(X_test)
    
    # Train RandomForest classifier
    print("Training RandomForest classifier...")
    rf_classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    rf_classifier.fit(X_train, y_train)
    
    # Evaluate
    print("\nEvaluating models...")
    
    # IsolationForest predictions
    iso_pred = iso_forest.predict(X_test)
    iso_pred = np.where(iso_pred == -1, 1, 0)  # Convert to 0/1
    
    # RandomForest predictions
    rf_pred = rf_classifier.predict(X_test)
    
    print("\nIsolationForest Results:")
    print(classification_report(y_test, iso_pred))
    
    print("\nRandomForest Results:")
    print(classification_report(y_test, rf_pred))
    
    # Save models and preprocessing artifacts
    print("\nSaving models and preprocessing artifacts...")
    model_data = {
        'iso_forest': iso_forest,
        'rf_classifier': rf_classifier,
        'scaler': scaler,
        'vectorizer': vectorizer,
        'encoders': encoders,
        'feature_cols': feature_cols,
        'numeric_features': numeric_features,
        'version': '1.0'
    }
    
    joblib.dump(model_data, 'anomaly_behavior_model.pkl')
    print("Model saved to anomaly_behavior_model.pkl")
    
    return model_data


if __name__ == '__main__':
    train_model()
