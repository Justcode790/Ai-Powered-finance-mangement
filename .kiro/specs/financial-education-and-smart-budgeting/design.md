# Design Document: Financial Education and Smart Budgeting

## Overview

This design extends the Smart Financial Literacy Assistant for Youth with comprehensive financial education content delivery, advanced budgeting capabilities with goal tracking, and enhanced ML-based personalization. The system currently provides basic expense tracking and savings prediction using a RandomForest model. This feature adds three major capabilities:

1. **Education System**: Content repository with articles, tips, and learning modules; personalized recommendations; progress tracking
2. **Budget Manager**: Detailed budget plans with variance tracking, goal management, and template library
3. **Enhanced ML Service**: Advanced prediction models, spending pattern analysis, forecasting, and peer comparisons

The architecture maintains the existing three-tier structure (React frontend, Node.js/Express backend, Python FastAPI ML service) while adding new data models, API endpoints, and ML capabilities.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Education   │  │   Budget     │  │   Goals      │          │
│  │  Dashboard   │  │   Manager    │  │   Tracker    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js/Express Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Education   │  │   Budget     │  │  Prediction  │          │
│  │  Routes      │  │   Routes     │  │  Routes      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MongoDB Data Layer                          │  │
│  │  Articles | Tips | Modules | Budgets | Goals | Progress │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Python FastAPI ML Service                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Savings     │  │  Spending    │  │  Budget      │          │
│  │  Predictor   │  │  Analyzer    │  │  Recommender │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Forecaster  │  │  Peer        │                            │
│  │              │  │  Comparator  │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Education System (Backend)**
- Store and retrieve educational content (articles, tips, modules)
- Track user progress through learning modules
- Generate personalized content recommendations
- Provide contextual tips based on user actions

**Budget Manager (Backend)**
- Create and manage budget plans with category allocations
- Calculate budget variance (actual vs planned spending)
- Manage financial goals with progress tracking
- Provide budget templates for common scenarios

**Enhanced ML Service (Python)**
- Advanced savings prediction with confidence intervals
- Spending pattern analysis and anomaly detection
- Category-level spending forecasts
- Peer comparison analytics
- Budget recommendation generation
- Model performance monitoring

### Technology Stack

- **Frontend**: React, Axios, TailwindCSS
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **ML Service**: Python, FastAPI, scikit-learn, pandas, numpy
- **ML Libraries**: scikit-learn (GradientBoosting, IsolationForest), statsmodels (time series)
- **Authentication**: JWT (existing)

## Components and Interfaces

### Backend API Endpoints

#### Education Content Endpoints

```
GET /api/education/articles
Query params: category, difficulty, search, limit
Response: { articles: [Article] }

GET /api/education/articles/:id
Response: Article

GET /api/education/tips
Query params: category, context
Response: { tips: [Tip] }

GET /api/education/modules
Query params: difficulty
Response: { modules: [Module] }

GET /api/education/modules/:id
Response: Module with lessons

POST /api/education/modules/:id/progress
Body: { lessonId, completed, quizScore }
Response: { progress: ModuleProgress }

GET /api/education/recommendations
Response: { recommendations: [ContentRecommendation] }
```

#### Budget Management Endpoints

```
POST /api/budgets
Body: { period, categoryAllocations, templateId? }
Response: Budget

GET /api/budgets
Query params: period
Response: { budgets: [Budget] }

GET /api/budgets/:id
Response: Budget

PUT /api/budgets/:id
Body: { categoryAllocations }
Response: Budget

GET /api/budgets/:id/variance
Response: { variances: [CategoryVariance] }

GET /api/budgets/templates
Response: { templates: [BudgetTemplate] }
```

#### Goal Management Endpoints

```
POST /api/goals
Body: { name, targetAmount, deadline }
Response: Goal

GET /api/goals
Response: { goals: [Goal] }

PUT /api/goals/:id
Body: { name?, targetAmount?, deadline?, currentAmount? }
Response: Goal

DELETE /api/goals/:id
Response: { success: true }
```

#### Enhanced ML Service Endpoints

```
POST /ml/predict/savings
Body: { age, income, ...categories, financial_literacy_score, saving_habit_score }
Response: { predicted_savings, confidence_interval: [lower, upper] }

POST /ml/analyze/spending
Body: { userId, transactions: [Transaction] }
Response: { patterns: [Pattern], trends: [Trend], anomalies: [Anomaly], insights: [Insight] }

POST /ml/forecast/spending
Body: { userId, transactions: [Transaction], goals: [Goal] }
Response: { forecasts: { category: { min, expected, max } }, warning?: string }

POST /ml/recommend/budget
Body: { userId, income, transactions: [Transaction], goals: [Goal] }
Response: { allocations: { category: amount }, rationale: { category: string } }

POST /ml/compare/peers
Body: { userId, age, income, transactions: [Transaction] }
Response: { savingsRatePercentile, categoryPercentiles: { category: percentile } }

GET /ml/monitoring/metrics
Response: { mae, rmse, r2, latency_p95, predictions_count, last_updated }
```

## Data Models

### Educational Content Models

#### Article Schema
```javascript
{
  _id: ObjectId,
  title: String (required),
  content: String (required),
  category: String (enum: ['budgeting', 'saving', 'investing', 'debt', 'income', 'planning']),
  difficulty: String (enum: ['beginner', 'intermediate', 'advanced']),
  tags: [String],
  readingTimeMinutes: Number,
  author: String,
  createdAt: Date,
  updatedAt: Date,
  viewCount: Number (default: 0)
}
```

#### Tip Schema
```javascript
{
  _id: ObjectId,
  content: String (required, max: 500),
  category: String (enum: ['budgeting', 'saving', 'investing', 'debt', 'income', 'planning']),
  context: String (enum: ['transaction', 'budget_exceeded', 'goal_achieved', 'general']),
  tags: [String],
  priority: Number (1-10),
  createdAt: Date
}
```

#### Module Schema
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (required),
  difficulty: String (enum: ['beginner', 'intermediate', 'advanced']),
  category: String,
  lessons: [{
    lessonId: String,
    title: String,
    content: String,
    order: Number,
    quiz: {
      questions: [{
        question: String,
        options: [String],
        correctAnswer: Number
      }]
    }
  }],
  estimatedHours: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### ModuleProgress Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  moduleId: ObjectId (ref: 'Module'),
  startedAt: Date,
  completedAt: Date?,
  lessonsCompleted: [String], // lessonIds
  quizScores: [{
    lessonId: String,
    score: Number,
    completedAt: Date
  }],
  overallProgress: Number (0-100)
}
```

### Budget Management Models

#### Budget Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  period: {
    month: Number (1-12),
    year: Number
  },
  categoryAllocations: {
    rent: Number,
    food: Number,
    transport: Number,
    entertainment: Number,
    shopping: Number,
    education: Number,
    misc: Number,
    savings: Number
  },
  totalBudget: Number,
  templateId: ObjectId? (ref: 'BudgetTemplate'),
  createdAt: Date,
  updatedAt: Date
}
```

#### Goal Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  name: String (required),
  targetAmount: Number (required, min: 0),
  currentAmount: Number (default: 0, min: 0),
  deadline: Date (required),
  status: String (enum: ['active', 'completed', 'cancelled'], default: 'active'),
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date?
}
```

#### BudgetTemplate Schema
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  targetUser: String (enum: ['student', 'entry-level', 'freelancer', 'general']),
  categoryPercentages: {
    rent: Number,
    food: Number,
    transport: Number,
    entertainment: Number,
    shopping: Number,
    education: Number,
    misc: Number,
    savings: Number
  },
  usageCount: Number (default: 0),
  createdAt: Date
}
```

### Enhanced Prediction Model

#### PredictionLog Schema (new)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  modelVersion: String,
  inputFeatures: Object,
  predictedSavings: Number,
  confidenceInterval: {
    lower: Number,
    upper: Number
  },
  actualSavings: Number?, // filled later for accuracy tracking
  predictionDate: Date,
  evaluationDate: Date?,
  latencyMs: Number
}
```

### User Model Extensions

Add to existing User schema:
```javascript
{
  // existing fields...
  learningProgress: {
    completedModules: [ObjectId],
    totalModulesCompleted: Number (default: 0),
    lastActivityDate: Date
  },
  preferences: {
    contentDifficulty: String (enum: ['beginner', 'intermediate', 'advanced']),
    notificationsEnabled: Boolean (default: true)
  }
}
```

## ML Model Specifications

### 1. Advanced Savings Prediction Model

**Algorithm**: Gradient Boosting Regressor (scikit-learn GradientBoostingRegressor)

**Features** (11 total):
- age (numeric)
- income (numeric)
- rent, food, transport, entertainment, shopping, education, misc (numeric)
- financial_literacy_score (1-10)
- saving_habit_score (1-10)

**Target**: savings (numeric)

**Hyperparameters**:
- n_estimators: 200
- max_depth: 5
- learning_rate: 0.1
- subsample: 0.8
- min_samples_split: 20

**Performance Target**: MAE < 500 rupees

**Confidence Intervals**: Use quantile regression or bootstrap aggregation to estimate prediction uncertainty

**Training Schedule**: Monthly retraining with accumulated data

### 2. Spending Pattern Analyzer

**Components**:

a) **Trend Detection**: Linear regression per category over 3-month window
   - Output: slope (increasing/decreasing/stable), percentage change

b) **Anomaly Detection**: IsolationForest per category
   - Flags transactions > 2 standard deviations from mean
   - Output: anomalous transactions with severity score

c) **Recurring Expense Detection**: Frequency analysis
   - Identify expenses with similar amounts at regular intervals
   - Output: recurring patterns with frequency and amount

### 3. Spending Forecaster

**Algorithm**: ARIMA or Exponential Smoothing per category

**Input**: Historical spending by category (minimum 3 months)

**Output**: Next month forecast with min/expected/max ranges

**Approach**:
- Fit time series model per category
- Generate point forecast and prediction intervals
- Aggregate across categories
- Compare total forecast to income for warnings

### 4. Budget Recommendation Engine

**Algorithm**: Rule-based with ML-informed adjustments

**Base Rules**:
- Apply 50/30/20 rule (needs/wants/savings)
- Needs: rent, food, transport, education
- Wants: entertainment, shopping, misc
- Savings: minimum 20% of income

**ML Adjustments**:
- Analyze historical spending patterns
- Identify categories with consistent overspending
- Adjust allocations based on user's financial literacy score
- Consider active goals for savings allocation

**Output**: Category allocations with rationale strings

### 5. Peer Comparison Analytics

**Approach**: Aggregate statistics with privacy protection

**Peer Groups**: Defined by age brackets (18-22, 23-27, 28-35) and income quartiles

**Metrics**:
- Savings rate percentile
- Category spending percentiles
- Minimum group size: 50 users

**Privacy**: All data anonymized, only percentiles returned

### 6. Model Performance Monitoring

**Metrics Tracked**:
- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- R² score
- Prediction latency (p50, p95, p99)
- Prediction count

**Storage**: Time-series database or MongoDB collection

**Alerting**: Trigger retraining when MAE > 1000 rupees

**Rollback**: Version models, allow rollback if performance degrades

## Implementation Approach

### Phase 1: Data Models and Storage

1. Create MongoDB schemas for Article, Tip, Module, ModuleProgress
2. Create schemas for Budget, Goal, BudgetTemplate
3. Create PredictionLog schema
4. Extend User schema with learning progress
5. Seed database with initial content (10 articles, 20 tips, 3 modules, 3 templates)

### Phase 2: Education System Backend

1. Implement education routes (articles, tips, modules)
2. Implement progress tracking endpoints
3. Build recommendation engine (collaborative filtering + content-based)
4. Implement contextual tip delivery logic
5. Add search and filtering capabilities

### Phase 3: Budget Management Backend

1. Implement budget CRUD endpoints
2. Build variance calculation logic
3. Implement goal management endpoints
4. Create budget template system
5. Add budget validation (total <= income)

### Phase 4: Enhanced ML Service

1. Upgrade savings prediction model to GradientBoosting
2. Implement confidence interval estimation
3. Build spending pattern analyzer
4. Implement spending forecaster
5. Create budget recommendation engine
6. Build peer comparison analytics
7. Add model monitoring endpoints

### Phase 5: Frontend Integration

1. Create Education Dashboard component
2. Build Budget Manager UI with variance visualization
3. Create Goal Tracker component
4. Integrate ML insights into existing dashboard
5. Add contextual tip display
6. Build module progress tracker

### Phase 6: Testing and Optimization

1. Unit tests for all new endpoints
2. Property-based tests for ML models
3. Integration tests for recommendation engine
4. Performance testing for search and analytics
5. Model accuracy validation

## Error Handling

### Backend Error Handling

**Validation Errors** (400):
- Missing required fields
- Invalid enum values
- Budget total exceeds income
- Goal deadline in past
- Invalid date ranges

**Authentication Errors** (401):
- Missing or invalid JWT token
- Expired session

**Not Found Errors** (404):
- Article/Module/Budget/Goal not found
- User not found

**Server Errors** (500):
- Database connection failures
- ML service unavailable (fallback to rule-based)
- Unexpected exceptions

### ML Service Error Handling

**Input Validation**:
- Feature value ranges (age > 18, income > 0, scores 1-10)
- Missing features
- Invalid data types

**Model Errors**:
- Model file not found (return clear error message)
- Prediction failures (log and return 500)
- Insufficient data for forecasting (return message)

**Fallback Strategies**:
- If ML model unavailable, use rule-based prediction
- If forecasting fails, use simple moving average
- If peer comparison has insufficient data, skip feature

### Frontend Error Handling

**Network Errors**:
- Display user-friendly messages
- Retry logic for transient failures
- Offline mode indicators

**Validation Errors**:
- Client-side validation before submission
- Display field-level error messages
- Prevent invalid form submissions

## Testing Strategy

### Unit Testing

**Backend Tests** (Jest/Mocha):
- Route handlers with mocked database
- Validation logic
- Variance calculation
- Goal progress calculation
- Template application logic

**ML Service Tests** (pytest):
- Model loading and prediction
- Feature preprocessing
- Confidence interval calculation
- Anomaly detection
- Forecast generation

### Property-Based Testing

Property-based tests will be implemented using:
- **Backend**: fast-check (JavaScript)
- **ML Service**: Hypothesis (Python)

Each test will run minimum 100 iterations and reference design properties with tags:
```javascript
// Feature: financial-education-and-smart-budgeting, Property 1: Budget validation
```

Properties will be defined in the Correctness Properties section below.

### Integration Testing

- End-to-end API tests with test database
- ML service integration tests
- Recommendation engine with sample data
- Search functionality with various queries

### Performance Testing

- Search response time < 200ms
- Prediction latency < 500ms
- Concurrent user load testing
- Database query optimization


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 1.1, 1.2, 1.3 (data persistence) can be combined into a single round-trip property for all content types
- Properties 1.4 and 1.5 (enum validation) can be combined into a single validation property
- Properties 4.4 and 4.5 are implementation details of 4.3 (variance classification)
- Property 7.5 is covered by requirement 12 (peer comparison)
- Property 14.2 is redundant with 1.6 (filtering)
- Property 13.1 is the same as 6.7 (prediction logging)

The following properties provide unique validation value:

### Property 1: Content Persistence Round-Trip

*For any* educational content (article, tip, or module) with valid fields, storing it and then retrieving it should return an equivalent object with all fields preserved.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Content Category and Difficulty Validation

*For any* content creation request with invalid category or difficulty values, the system should reject the request and return a validation error.

**Validates: Requirements 1.4, 1.5**

### Property 3: Content Filtering Correctness

*For any* set of educational content and any filter criteria (category, difficulty, tags), all returned results should match the specified filter criteria.

**Validates: Requirements 1.6, 14.2**

### Property 4: Progress Tracking Persistence

*For any* module progress update (lesson completion, quiz score), storing the update and then retrieving the progress should reflect the update accurately.

**Validates: Requirements 1.7, 10.5**

### Property 5: Recommendation Count Limit

*For any* recommendation request, the number of returned recommendations should be at most 5.

**Validates: Requirements 2.6**

### Property 6: Difficulty-Matched Recommendations

*For any* user with a financial literacy score, at least 80% of recommended content should match the user's difficulty level (beginner: score 1-4, intermediate: 5-7, advanced: 8-10).

**Validates: Requirements 2.2**

### Property 7: Low Savings Rate Triggers Saving Content

*For any* user with savings rate below 15%, at least one recommendation should be from the 'saving' category.

**Validates: Requirements 2.3**

### Property 8: Overspending Triggers Category-Specific Content

*For any* spending category where actual spending exceeds budget by more than 10%, at least one recommendation should be tagged with that category.

**Validates: Requirements 2.4**

### Property 9: Budget Creation Requires All Categories

*For any* budget creation request, the created budget should contain allocation amounts for all seven spending categories (rent, food, transport, entertainment, shopping, education, misc) plus savings.

**Validates: Requirements 3.1**

### Property 10: Budget Total Cannot Exceed Income

*For any* budget creation request where the sum of category allocations exceeds the user's income, the system should reject the request with a validation error.

**Validates: Requirements 3.2**

### Property 11: Budget Persistence Round-Trip

*For any* valid budget with user ID, period, and category allocations, storing it and then retrieving it should return an equivalent budget with all fields preserved.

**Validates: Requirements 3.3**

### Property 12: AI Budget Ensures Minimum Savings

*For any* AI-assisted budget recommendation, the savings allocation should be at least 20% of the user's income.

**Validates: Requirements 3.6**

### Property 13: Budget Update Persistence

*For any* existing budget and valid allocation updates, updating the budget and then retrieving it should reflect the new allocations.

**Validates: Requirements 3.7**

### Property 14: Variance Calculation Formula

*For any* budget category with budgeted amount B and actual spending A, the calculated variance should equal (A - B).

**Validates: Requirements 4.2**

### Property 15: Variance Status Classification

*For any* budget variance V and budgeted amount B, the status should be: 'under' if V < -0.05*B, 'on_track' if -0.05*B ≤ V ≤ 0.05*B, 'over' if 0.05*B < V ≤ 0.10*B, and 'critical' if V > 0.10*B.

**Validates: Requirements 4.3**

### Property 16: Budget Exceeded Triggers Notification

*For any* budget category where actual spending exceeds the budgeted amount (variance > 0), a notification should be created for the user.

**Validates: Requirements 4.6**

### Property 17: Goal Persistence Round-Trip

*For any* valid goal with name, target amount, and future deadline, storing it and then retrieving it should return an equivalent goal with all fields preserved.

**Validates: Requirements 5.1**

### Property 18: Goal Deadline Must Be Future

*For any* goal creation request with a deadline in the past, the system should reject the request with a validation error.

**Validates: Requirements 5.2**

### Property 19: Goal Progress Calculation

*For any* goal with target amount T and current amount C, the calculated progress should equal (C / T) × 100.

**Validates: Requirements 5.3**

### Property 20: Goal Response Includes Progress and Remaining

*For any* goal retrieval, the response should include both progress percentage and remaining amount (target - current).

**Validates: Requirements 5.4**

### Property 21: Required Monthly Savings Calculation

*For any* goal with remaining amount R and deadline D months away, the required monthly savings should equal R / D.

**Validates: Requirements 5.5**

### Property 22: Goal Achievement Updates Status

*For any* goal where current amount becomes greater than or equal to target amount, the status should be updated to 'completed'.

**Validates: Requirements 5.6**

### Property 23: Goal Deletion Removes Record

*For any* existing goal, deleting it should result in the goal no longer being retrievable.

**Validates: Requirements 5.7**

### Property 24: Prediction Includes Confidence Intervals

*For any* savings prediction request, the response should include both a predicted value and confidence intervals (lower and upper bounds).

**Validates: Requirements 6.4**

### Property 25: Prediction Logging

*For any* prediction request, a log entry should be created containing input features, output prediction, and timestamp.

**Validates: Requirements 6.7, 13.1**

### Property 26: Spending Trend Classification

*For any* spending history for a category, the detected trend should be classified as exactly one of: 'increasing', 'decreasing', or 'stable'.

**Validates: Requirements 7.2**

### Property 27: Trend Increase Quantification

*For any* spending trend classified as 'increasing', the analysis should include a percentage increase value greater than 0.

**Validates: Requirements 7.4**

### Property 28: Insight Prioritization by Impact

*For any* set of spending insights, they should be ordered by potential savings impact in descending order (highest impact first).

**Validates: Requirements 7.7**

### Property 29: Budget Recommendations Include All Categories

*For any* budget recommendation request, the response should include allocation amounts for all seven spending categories plus savings.

**Validates: Requirements 8.1**

### Property 30: Budget Recommendations Follow 50/30/20 Rule

*For any* budget recommendation, the allocation should approximately follow the 50/30/20 rule: needs (rent + food + transport + education) should be 45-55% of income, wants (entertainment + shopping + misc) should be 25-35% of income, and savings should be 18-25% of income.

**Validates: Requirements 8.2**

### Property 31: Recommendations Consider Goals

*For any* budget recommendation where the user has active financial goals, the savings allocation should be at least equal to the sum of required monthly savings for all goals.

**Validates: Requirements 8.4**

### Property 32: Recommendations Include Rationale

*For any* budget recommendation, each category allocation should have an associated rationale string explaining the allocation.

**Validates: Requirements 8.5**

### Property 33: Overspending Categories Get Reduced Allocations

*For any* category where the user's average historical spending exceeds their previous budget by more than 20%, the recommended allocation should be less than or equal to the historical average.

**Validates: Requirements 8.6**

### Property 34: Transaction Triggers Category-Specific Tip

*For any* transaction in a spending category, the contextual tip returned should be tagged with that category.

**Validates: Requirements 9.1**

### Property 35: Budget Exceeded Triggers Category Tips

*For any* category where spending exceeds budget, the tips provided should be tagged with that category and focus on spending reduction.

**Validates: Requirements 9.2**

### Property 36: Tip Rotation Prevents Repetition

*For any* sequence of N tip requests (N ≥ 10) in the same context, no tip should appear more than once.

**Validates: Requirements 9.4**

### Property 37: Helpful Tip Tracking

*For any* tip marked as helpful by a user, a record should be created linking the user, tip, and timestamp.

**Validates: Requirements 9.7**

### Property 38: Module Start Creates Progress Record

*For any* user starting a learning module, a progress record should be created with the module ID, user ID, and start timestamp.

**Validates: Requirements 10.1**

### Property 39: Lesson Completion Updates Progress

*For any* lesson completion in a module, the lesson ID should be added to the user's completed lessons list for that module.

**Validates: Requirements 10.2**

### Property 40: All Lessons Completed Marks Module Complete

*For any* module with N lessons, when a user completes the Nth lesson, the module status should be updated to 'completed'.

**Validates: Requirements 10.3**

### Property 41: Overall Learning Progress Calculation

*For any* user with C completed modules out of T total modules, the overall learning progress should equal (C / T) × 100.

**Validates: Requirements 10.4**

### Property 42: High Quiz Score Updates Literacy Score

*For any* module completion where the quiz score exceeds 80%, the user's financial literacy score should increase by at least 0.5 points (capped at 10).

**Validates: Requirements 10.6**

### Property 43: Forecast Includes All Categories

*For any* spending forecast request, the response should include forecasts (min, expected, max) for all seven spending categories.

**Validates: Requirements 11.1**

### Property 44: Forecast Includes Range Values

*For any* category forecast, it should include three values: minimum, expected, and maximum, where min ≤ expected ≤ max.

**Validates: Requirements 11.3**

### Property 45: Forecast Exceeding Income Triggers Warning

*For any* spending forecast where the sum of expected values across all categories exceeds the user's income, the response should include a warning flag.

**Validates: Requirements 11.4**

### Property 46: Forecast Accuracy Tracking

*For any* forecast where actual spending data becomes available, the system should calculate and store the accuracy (absolute error between forecast and actual).

**Validates: Requirements 11.7**

### Property 47: Peer Comparison Includes Savings Rate

*For any* peer comparison request, the response should include the user's savings rate percentile (0-100).

**Validates: Requirements 12.2**

### Property 48: Peer Comparison Includes All Categories

*For any* peer comparison request, the response should include percentiles for all seven spending categories.

**Validates: Requirements 12.3**

### Property 49: Peer Comparison Requires Minimum Group Size

*For any* peer comparison request where the peer group (same age bracket and income quartile) has fewer than 50 users, the system should return an error or empty result indicating insufficient data.

**Validates: Requirements 12.5**

### Property 50: Peer Comparison Returns Percentiles

*For any* peer comparison value, it should be a percentile between 0 and 100 inclusive.

**Validates: Requirements 12.6**

### Property 51: Actual vs Predicted Storage

*For any* prediction where actual savings data becomes available, the system should store both the predicted and actual values for accuracy calculation.

**Validates: Requirements 13.2**

### Property 52: Monitoring Metrics Completeness

*For any* monitoring endpoint request, the response should include MAE, RMSE, R² score, and prediction count.

**Validates: Requirements 13.3**

### Property 53: Accuracy Degradation Triggers Alert

*For any* monitoring check where MAE exceeds 1000 rupees, an alert should be triggered or logged.

**Validates: Requirements 13.4**

### Property 54: Prediction Latency Tracking

*For any* prediction request, the latency should be tracked and stored. Requests exceeding 500ms should be flagged.

**Validates: Requirements 13.6**

### Property 55: Search Results Match Query

*For any* text search query Q and result R, the result's title, content, or tags should contain Q (case-insensitive).

**Validates: Requirements 14.1**

### Property 56: Search Snippet Contains Query Term

*For any* search result with a snippet, the snippet should contain the search query term.

**Validates: Requirements 14.4**

### Property 57: Sort Order Correctness

*For any* search results sorted by date, each result's date should be greater than or equal to the next result's date (descending order).

**Validates: Requirements 14.5**

### Property 58: Empty Search Provides Suggestions

*For any* search query that returns zero results, the response should include at least one suggested alternative query or related topic.

**Validates: Requirements 14.6**

### Property 59: Template Persistence Round-Trip

*For any* budget template with category percentages, storing it and then retrieving it should return an equivalent template with all percentages preserved.

**Validates: Requirements 15.2**

### Property 60: Template Application Calculates Amounts

*For any* budget template with category percentages P and user income I, applying the template should produce allocations where each category amount equals P × I.

**Validates: Requirements 15.3**

### Property 61: Template Includes Description

*For any* budget template, it should include a non-empty description field.

**Validates: Requirements 15.5**

### Property 62: Template Usage Tracking

*For any* budget created from a template, the template's usage count should increment by 1.

**Validates: Requirements 15.6**

### Property 63: Custom Template Creation

*For any* user-created custom budget, the user should be able to save it as a personal template and retrieve it later with all allocations preserved.

**Validates: Requirements 15.7**


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties across all inputs using randomized data
- Both approaches are complementary and necessary

### Unit Testing

Unit tests focus on specific scenarios and integration points:

**Backend Unit Tests (Jest)**:
- Article/Tip/Module CRUD operations with specific data
- Budget creation with edge cases (zero income, negative amounts)
- Goal deadline validation (past dates, far future dates)
- Variance calculation with specific budget/spending pairs
- Recommendation engine with specific user profiles
- Search functionality with empty queries, special characters
- Template application with specific income values

**ML Service Unit Tests (pytest)**:
- Model loading and initialization
- Feature preprocessing and validation
- Specific prediction scenarios (high income, low income, zero spending)
- Anomaly detection with known outliers
- Forecast generation with insufficient data
- Peer comparison with edge cases (single user, exact threshold)

**Example Unit Tests**:
```javascript
// Specific example: student budget template
test('student template allocates correctly for 20000 income', () => {
  const template = getTemplate('student');
  const budget = applyTemplate(template, 20000);
  expect(budget.rent).toBe(6000); // 30%
  expect(budget.food).toBe(4000); // 20%
  expect(budget.savings).toBe(4000); // 20%
});

// Edge case: goal deadline exactly today
test('goal with deadline today is rejected', () => {
  const today = new Date();
  expect(() => createGoal('Save', 10000, today)).toThrow('Deadline must be in future');
});
```

### Property-Based Testing

Property tests verify universal properties using randomized inputs:

**Backend Property Tests (fast-check)**:
- Minimum 100 iterations per test
- Each test tagged with feature name and property number
- Generators for valid/invalid data

**ML Service Property Tests (Hypothesis)**:
- Minimum 100 iterations per test
- Custom strategies for financial data (positive amounts, valid ranges)
- Shrinking to find minimal failing examples

**Example Property Tests**:

```javascript
// Feature: financial-education-and-smart-budgeting, Property 10: Budget Total Cannot Exceed Income
fc.assert(
  fc.property(
    fc.record({
      income: fc.integer({ min: 10000, max: 100000 }),
      allocations: fc.record({
        rent: fc.integer({ min: 0, max: 50000 }),
        food: fc.integer({ min: 0, max: 30000 }),
        transport: fc.integer({ min: 0, max: 20000 }),
        entertainment: fc.integer({ min: 0, max: 15000 }),
        shopping: fc.integer({ min: 0, max: 15000 }),
        education: fc.integer({ min: 0, max: 20000 }),
        misc: fc.integer({ min: 0, max: 10000 }),
        savings: fc.integer({ min: 0, max: 30000 })
      })
    }),
    ({ income, allocations }) => {
      const total = Object.values(allocations).reduce((a, b) => a + b, 0);
      if (total > income) {
        expect(() => createBudget(income, allocations)).toThrow();
      } else {
        const budget = createBudget(income, allocations);
        expect(budget).toBeDefined();
      }
    }
  ),
  { numRuns: 100 }
);
```

```python
# Feature: financial-education-and-smart-budgeting, Property 14: Variance Calculation Formula
@given(
    budgeted=st.floats(min_value=0, max_value=50000),
    actual=st.floats(min_value=0, max_value=50000)
)
def test_variance_calculation(budgeted, actual):
    variance = calculate_variance(budgeted, actual)
    expected = actual - budgeted
    assert abs(variance - expected) < 0.01  # floating point tolerance
```

### Integration Testing

**API Integration Tests**:
- End-to-end flows: user creates budget → adds transactions → views variance
- Recommendation engine with real database queries
- ML service integration with backend
- Search across multiple content types

**ML Pipeline Tests**:
- Training → prediction → monitoring flow
- Forecast generation → accuracy tracking
- Peer comparison with aggregated data

### Performance Testing

**Response Time Requirements**:
- Search queries: < 200ms (Requirement 14.7)
- ML predictions: < 500ms (Requirement 13.6)
- API endpoints: < 1000ms for 95th percentile

**Load Testing**:
- Concurrent users: 100 simultaneous requests
- Database query optimization for large datasets
- ML model inference optimization

**Test Scenarios**:
- 1000 articles with full-text search
- 10000 transactions for variance calculation
- 1000 users for peer comparison aggregation

### Test Data Management

**Seed Data**:
- 10 articles across all categories and difficulty levels
- 20 tips for various contexts
- 3 learning modules with lessons and quizzes
- 3 budget templates (student, entry-level, freelancer)
- Sample user profiles with varying literacy scores

**Test Database**:
- Separate test database for integration tests
- Reset between test suites
- Fixtures for common scenarios

### Continuous Testing

**Pre-commit Hooks**:
- Run unit tests
- Linting and formatting

**CI/CD Pipeline**:
- Unit tests on every commit
- Property tests on every commit
- Integration tests on pull requests
- Performance tests on staging deployment

**ML Model Testing**:
- Validate model accuracy on test set before deployment
- A/B testing for new model versions
- Rollback capability if accuracy degrades

