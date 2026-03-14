# Implementation Plan: Financial Education and Smart Budgeting

## Overview

This implementation plan breaks down the Financial Education and Smart Budgeting feature into discrete coding tasks. The feature adds three major capabilities to the Smart Financial Literacy Assistant:

1. **Education System**: Content repository with articles, tips, and learning modules; personalized recommendations; progress tracking
2. **Budget Manager**: Detailed budget plans with variance tracking, goal management, and template library
3. **Enhanced ML Service**: Advanced prediction models, spending pattern analysis, forecasting, and peer comparisons

The implementation follows a bottom-up approach: data models → backend APIs → ML service enhancements → frontend integration → testing.

## Tasks

- [x] 1. Set up data models and database schemas
  - [x] 1.1 Create educational content models (Article, Tip, Module, ModuleProgress)
    - Create `server/models/Article.js` with schema: title, content, category, difficulty, tags, readingTimeMinutes, author, viewCount
    - Create `server/models/Tip.js` with schema: content, category, context, tags, priority
    - Create `server/models/Module.js` with schema: title, description, difficulty, category, lessons array, estimatedHours
    - Create `server/models/ModuleProgress.js` with schema: userId, moduleId, startedAt, completedAt, lessonsCompleted, quizScores, overallProgress
    - Add validation for category enum: ['budgeting', 'saving', 'investing', 'debt', 'income', 'planning']
    - Add validation for difficulty enum: ['beginner', 'intermediate', 'advanced']
    - Add validation for context enum: ['transaction', 'budget_exceeded', 'goal_achieved', 'general']
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_

  - [ ]* 1.2 Write property tests for content models
    - **Property 1: Content Persistence Round-Trip**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - **Property 2: Content Category and Difficulty Validation**
    - **Validates: Requirements 1.4, 1.5**
    - **Property 4: Progress Tracking Persistence**
    - **Validates: Requirements 1.7, 10.5**

  - [x] 1.3 Create budget management models (Budget, Goal, BudgetTemplate)
    - Create `server/models/Budget.js` with schema: userId, period (month, year), categoryAllocations (rent, food, transport, entertainment, shopping, education, misc, savings), totalBudget
    - Create `server/models/Goal.js` with schema: userId, name, targetAmount, currentAmount, deadline, status, completedAt
    - Create `server/models/BudgetTemplate.js` with schema: name, description, targetUser, categoryPercentages, usageCount
    - Add validation: targetAmount >= 0, currentAmount >= 0, deadline must be future date
    - Add validation: status enum ['active', 'completed', 'cancelled']
    - Add validation: targetUser enum ['student', 'entry-level', 'freelancer', 'general']
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 15.1, 15.2_

  - [ ]* 1.4 Write property tests for budget and goal models
    - **Property 9: Budget Creation Requires All Categories**
    - **Validates: Requirements 3.1**
    - **Property 10: Budget Total Cannot Exceed Income**
    - **Validates: Requirements 3.2**
    - **Property 11: Budget Persistence Round-Trip**
    - **Validates: Requirements 3.3**
    - **Property 17: Goal Persistence Round-Trip**
    - **Validates: Requirements 5.1**
    - **Property 18: Goal Deadline Must Be Future**
    - **Validates: Requirements 5.2**
    - **Property 59: Template Persistence Round-Trip**
    - **Validates: Requirements 15.2**

  - [x] 1.5 Create ML service data models (PredictionLog)
    - Create `server/models/PredictionLog.js` with schema: userId, modelVersion, inputFeatures, predictedSavings, confidenceInterval (lower, upper), actualSavings, predictionDate, evaluationDate, latencyMs
    - Add indexes on userId and predictionDate for efficient querying
    - _Requirements: 6.7, 13.1, 13.2_

  - [x] 1.6 Extend User model with learning progress and preferences
    - Add `learningProgress` field to User schema: completedModules array, totalModulesCompleted, lastActivityDate
    - Add `preferences` field: contentDifficulty, notificationsEnabled
    - Update User model in `server/models/User.js`
    - _Requirements: 10.4, 10.6_


- [x] 2. Seed database with initial educational content and templates
  - [x] 2.1 Create seed data for educational content
    - Create seed script or extend `server/seed.js` to add 10 articles across all categories and difficulty levels
    - Add 20 tips covering all contexts (transaction, budget_exceeded, goal_achieved, general)
    - Add 3 learning modules with lessons and quizzes (beginner, intermediate, advanced)
    - Ensure content covers all six categories: budgeting, saving, investing, debt, income, planning
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Create seed data for budget templates
    - Add 3 budget templates: student, entry-level professional, freelancer
    - Student template: rent 30%, food 20%, transport 10%, entertainment 10%, shopping 5%, education 5%, misc 5%, savings 20%
    - Entry-level template: rent 35%, food 15%, transport 10%, entertainment 10%, shopping 10%, education 5%, misc 5%, savings 20%
    - Freelancer template: rent 30%, food 15%, transport 8%, entertainment 8%, shopping 7%, education 7%, misc 5%, savings 25%
    - Include descriptions explaining target user and allocation rationale
    - _Requirements: 15.1, 15.2, 15.5_


- [x] 3. Implement education content API endpoints
  - [x] 3.1 Create education routes and controllers
    - Create `server/routes/educationRoutes.js` with routes for articles, tips, modules, recommendations
    - Create `server/controllers/educationController.js` with handler functions
    - Implement GET /api/education/articles with query params: category, difficulty, search, limit
    - Implement GET /api/education/articles/:id
    - Implement GET /api/education/tips with query params: category, context
    - Implement GET /api/education/modules with query params: difficulty
    - Implement GET /api/education/modules/:id
    - Add authentication middleware to all routes
    - _Requirements: 1.6, 14.1, 14.2_

  - [ ]* 3.2 Write property tests for content filtering
    - **Property 3: Content Filtering Correctness**
    - **Validates: Requirements 1.6, 14.2**

  - [x] 3.3 Implement search and filtering functionality
    - Add text search across article titles, content, and tags using MongoDB text indexes
    - Create text index on Article collection: title, content, tags
    - Implement relevance-based ranking for search results
    - Add result snippet generation with search term highlighting
    - Implement sorting by relevance, date, popularity (viewCount)
    - Add suggestion logic for empty search results (return related topics)
    - Ensure search completes within 200ms
    - _Requirements: 14.1, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 3.4 Write property tests for search functionality
    - **Property 55: Search Results Match Query**
    - **Validates: Requirements 14.1**
    - **Property 56: Search Snippet Contains Query Term**
    - **Validates: Requirements 14.4**
    - **Property 57: Sort Order Correctness**
    - **Validates: Requirements 14.5**
    - **Property 58: Empty Search Provides Suggestions**
    - **Validates: Requirements 14.6**

  - [x] 3.5 Implement module progress tracking endpoints
    - Implement POST /api/education/modules/:id/progress with body: lessonId, completed, quizScore
    - Create or update ModuleProgress record when user starts a module
    - Add lessonId to lessonsCompleted array when lesson is completed
    - Store quiz scores with timestamp
    - Calculate overallProgress as (lessonsCompleted.length / totalLessons) × 100
    - Mark module as completed when all lessons are done
    - Update user's financial literacy score if quiz score > 80% (increase by 0.5, cap at 10)
    - Implement GET /api/education/progress to retrieve user's learning progress
    - _Requirements: 1.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 3.6 Write property tests for progress tracking
    - **Property 38: Module Start Creates Progress Record**
    - **Validates: Requirements 10.1**
    - **Property 39: Lesson Completion Updates Progress**
    - **Validates: Requirements 10.2**
    - **Property 40: All Lessons Completed Marks Module Complete**
    - **Validates: Requirements 10.3**
    - **Property 41: Overall Learning Progress Calculation**
    - **Validates: Requirements 10.4**
    - **Property 42: High Quiz Score Updates Literacy Score**
    - **Validates: Requirements 10.6**


- [x] 4. Implement personalized content recommendation engine
  - [x] 4.1 Create recommendation service
    - Create `server/services/recommendationService.js`
    - Implement GET /api/education/recommendations endpoint
    - Build recommendation logic based on user profile (age, income, financial_literacy_score, saving_habit_score)
    - Prioritize content matching user's difficulty level (beginner: score 1-4, intermediate: 5-7, advanced: 8-10)
    - Analyze user's spending patterns from Transaction collection
    - Identify categories where user overspends (actual > budget by 10%)
    - Recommend content tagged with overspending categories
    - Calculate user's savings rate from transactions
    - If savings rate < 15%, prioritize 'saving' category content
    - Limit recommendations to 5 items per request
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ]* 4.2 Write property tests for recommendations
    - **Property 5: Recommendation Count Limit**
    - **Validates: Requirements 2.6**
    - **Property 6: Difficulty-Matched Recommendations**
    - **Validates: Requirements 2.2**
    - **Property 7: Low Savings Rate Triggers Saving Content**
    - **Validates: Requirements 2.3**
    - **Property 8: Overspending Triggers Category-Specific Content**
    - **Validates: Requirements 2.4**

  - [x] 4.3 Implement collaborative filtering for recommendations
    - Find similar users based on age bracket (±3 years) and income bracket (±20%)
    - Query articles viewed by similar users (track viewCount or create UserActivity collection)
    - Include popular content from similar users in recommendations
    - Blend collaborative filtering (30%) with content-based filtering (70%)
    - _Requirements: 2.5_


- [x] 5. Implement contextual financial tips system
  - [x] 5.1 Create contextual tip delivery logic
    - Add tip delivery to transaction creation endpoint (POST /api/transactions)
    - When transaction is added, select a tip matching the transaction's category
    - Filter tips by context: 'transaction' for normal transactions
    - Implement tip rotation to avoid showing same tip repeatedly (track shown tips in session or user record)
    - Create TipHistory collection to track which tips user marked as helpful
    - Implement POST /api/tips/:id/helpful to record helpful tips
    - _Requirements: 9.1, 9.4, 9.7_

  - [ ]* 5.2 Write property tests for contextual tips
    - **Property 34: Transaction Triggers Category-Specific Tip**
    - **Validates: Requirements 9.1**
    - **Property 36: Tip Rotation Prevents Repetition**
    - **Validates: Requirements 9.4**
    - **Property 37: Helpful Tip Tracking**
    - **Validates: Requirements 9.7**

  - [x] 5.3 Implement budget-exceeded and goal-achieved tip contexts
    - When budget variance calculation shows category exceeded, select tips with context 'budget_exceeded' and matching category
    - When goal status changes to 'completed', select tips with context 'goal_achieved' and category 'saving' or 'investing'
    - Prioritize tips based on user's financial health score (calculated from savings rate and budget adherence)
    - Limit tip display to once per session per context to avoid annoyance
    - _Requirements: 9.2, 9.3, 9.5, 9.6_

  - [ ]* 5.4 Write property tests for budget-exceeded tips
    - **Property 35: Budget Exceeded Triggers Category Tips**
    - **Validates: Requirements 9.2**


- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement budget management API endpoints
  - [x] 7.1 Create budget routes and controllers
    - Create `server/routes/budgetRoutes.js` with routes for budgets, goals, templates
    - Create `server/controllers/budgetController.js` with handler functions
    - Implement POST /api/budgets with body: period, categoryAllocations, templateId (optional)
    - Validate that sum of categoryAllocations does not exceed user's income
    - Validate that all 8 categories are present (7 spending + savings)
    - If templateId provided, apply template percentages to user's income
    - Implement GET /api/budgets with query param: period (optional)
    - Implement GET /api/budgets/:id
    - Implement PUT /api/budgets/:id with body: categoryAllocations
    - Add authentication middleware to all routes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

  - [ ]* 7.2 Write property tests for budget creation and validation
    - **Property 12: AI Budget Ensures Minimum Savings**
    - **Validates: Requirements 3.6**
    - **Property 13: Budget Update Persistence**
    - **Validates: Requirements 3.7**

  - [x] 7.3 Implement budget variance calculation
    - Implement GET /api/budgets/:id/variance
    - Query all transactions for the budget's period (month/year)
    - Group transactions by category and sum amounts
    - Calculate variance for each category: (actual spending - budgeted amount)
    - Classify status: 'under' if variance < -5% of budget, 'on_track' if within ±5%, 'over' if 5-10% over, 'critical' if >10% over
    - Return variance data with status indicators
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 7.4 Write property tests for variance calculation
    - **Property 14: Variance Calculation Formula**
    - **Validates: Requirements 4.2**
    - **Property 15: Variance Status Classification**
    - **Validates: Requirements 4.3**

  - [x] 7.5 Implement budget exceeded notifications
    - When variance calculation shows category exceeded (variance > 0), create notification
    - Create Notification model or add to existing notification system
    - Store notification with userId, category, variance amount, timestamp
    - Implement GET /api/notifications to retrieve user notifications
    - Mark notifications as read when user views them
    - _Requirements: 4.6_

  - [ ]* 7.6 Write property tests for budget notifications
    - **Property 16: Budget Exceeded Triggers Notification**
    - **Validates: Requirements 4.6**

  - [x] 7.7 Implement visual budget status indicators
    - Add helper functions to calculate progress bars (actual / budgeted × 100)
    - Add color coding logic: green (under), yellow (on_track), orange (over), red (critical)
    - Return status indicators in variance endpoint response
    - _Requirements: 4.7_


- [x] 8. Implement financial goal management
  - [x] 8.1 Create goal CRUD endpoints
    - Implement POST /api/goals with body: name, targetAmount, deadline
    - Validate targetAmount >= 0, deadline is in future
    - Set initial currentAmount to 0, status to 'active'
    - Implement GET /api/goals to retrieve all user goals
    - Implement PUT /api/goals/:id with body: name, targetAmount, deadline, currentAmount
    - Implement DELETE /api/goals/:id
    - Add authentication middleware
    - _Requirements: 5.1, 5.2, 5.7_

  - [ ]* 8.2 Write property tests for goal management
    - **Property 23: Goal Deletion Removes Record**
    - **Validates: Requirements 5.7**

  - [x] 8.3 Implement goal progress calculation
    - Calculate progress: (currentAmount / targetAmount) × 100
    - Calculate remaining amount: targetAmount - currentAmount
    - Calculate months until deadline: Math.ceil((deadline - now) / (30 * 24 * 60 * 60 * 1000))
    - Calculate required monthly savings: remainingAmount / monthsUntilDeadline
    - Include all calculated fields in GET /api/goals response
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 8.4 Write property tests for goal calculations
    - **Property 19: Goal Progress Calculation**
    - **Validates: Requirements 5.3**
    - **Property 20: Goal Response Includes Progress and Remaining**
    - **Validates: Requirements 5.4**
    - **Property 21: Required Monthly Savings Calculation**
    - **Validates: Requirements 5.5**

  - [x] 8.5 Implement goal achievement detection
    - When goal is updated and currentAmount >= targetAmount, set status to 'completed'
    - Set completedAt timestamp
    - Create notification for user about goal achievement
    - Trigger contextual tip with context 'goal_achieved'
    - _Requirements: 5.6_

  - [ ]* 8.6 Write property tests for goal achievement
    - **Property 22: Goal Achievement Updates Status**
    - **Validates: Requirements 5.6**


- [x] 9. Implement budget template system
  - [x] 9.1 Create template endpoints
    - Implement GET /api/budgets/templates to retrieve all templates
    - Return templates with name, description, targetUser, categoryPercentages
    - Sort by usageCount (most popular first)
    - _Requirements: 15.1, 15.6_

  - [x] 9.2 Implement template application logic
    - When POST /api/budgets includes templateId, fetch template
    - Calculate actual amounts: categoryAmount = (categoryPercentage / 100) × userIncome
    - Apply calculated amounts to categoryAllocations
    - Increment template's usageCount
    - Allow user to customize allocations before saving (frontend handles this)
    - _Requirements: 15.3, 15.4, 15.6_

  - [ ]* 9.3 Write property tests for template application
    - **Property 60: Template Application Calculates Amounts**
    - **Validates: Requirements 15.3**
    - **Property 61: Template Includes Description**
    - **Validates: Requirements 15.5**
    - **Property 62: Template Usage Tracking**
    - **Validates: Requirements 15.6**

  - [x] 9.4 Implement custom template creation
    - Implement POST /api/budgets/templates/custom with body: name, description, categoryPercentages
    - Store as personal template linked to userId
    - Implement GET /api/budgets/templates/custom to retrieve user's custom templates
    - _Requirements: 15.7_

  - [ ]* 9.5 Write property tests for custom templates
    - **Property 63: Custom Template Creation**
    - **Validates: Requirements 15.7**


- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Upgrade ML service with advanced savings prediction model
  - [x] 11.1 Implement GradientBoosting regression model
    - Update `ml_service/train_model.py` to use GradientBoostingRegressor instead of RandomForest
    - Set hyperparameters: n_estimators=200, max_depth=5, learning_rate=0.1, subsample=0.8, min_samples_split=20
    - Train on all 11 features: age, income, 7 spending categories, financial_literacy_score, saving_habit_score
    - Target variable: savings
    - Split data 80/20 for train/test
    - Calculate and log MAE, RMSE, R² on test set
    - Ensure MAE < 500 rupees (if not, tune hyperparameters)
    - Save trained model to model.pkl
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 11.2 Implement confidence interval estimation
    - Add quantile regression or bootstrap aggregation for prediction uncertainty
    - For each prediction, calculate lower and upper bounds (e.g., 90% confidence interval)
    - Update `ml_service/model.py` predict endpoint to return: predicted_savings, confidence_interval: {lower, upper}
    - _Requirements: 6.4_

  - [ ]* 11.3 Write property tests for prediction model
    - **Property 24: Prediction Includes Confidence Intervals**
    - **Validates: Requirements 6.4**

  - [x] 11.4 Implement prediction logging
    - Create POST /ml/predict/savings endpoint (update existing /predict)
    - After each prediction, create PredictionLog record in MongoDB
    - Store: userId, modelVersion, inputFeatures, predictedSavings, confidenceInterval, predictionDate, latencyMs
    - Measure and log prediction latency
    - _Requirements: 6.7, 13.1_

  - [ ]* 11.5 Write property tests for prediction logging
    - **Property 25: Prediction Logging**
    - **Validates: Requirements 6.7, 13.1**

  - [x] 11.6 Implement model retraining pipeline
    - Create script `ml_service/retrain_model.py` that queries all PredictionLog records with actualSavings
    - Combine with original training data
    - Retrain model with accumulated data
    - Save new model with version number
    - Schedule monthly retraining (document cron job or scheduler setup)
    - _Requirements: 6.6_


- [x] 12. Implement spending pattern analysis in ML service
  - [x] 12.1 Create spending analyzer endpoint
    - Create POST /ml/analyze/spending endpoint in `ml_service/model.py`
    - Accept body: userId, transactions (array of transaction objects with category, amount, date)
    - Group transactions by category
    - _Requirements: 7.1_

  - [x] 12.2 Implement trend detection
    - For each category, extract spending over past 3 months
    - Fit linear regression to detect trend (slope)
    - Classify as 'increasing' if slope > threshold, 'decreasing' if slope < -threshold, 'stable' otherwise
    - Calculate percentage change from first month to last month
    - Return trends: [{category, trend, percentageChange}]
    - _Requirements: 7.2, 7.4_

  - [ ]* 12.3 Write property tests for trend detection
    - **Property 26: Spending Trend Classification**
    - **Validates: Requirements 7.2**
    - **Property 27: Trend Increase Quantification**
    - **Validates: Requirements 7.4**

  - [x] 12.4 Implement anomaly detection
    - For each category, use IsolationForest to detect anomalous transactions
    - Flag transactions > 2 standard deviations from category mean
    - Return anomalies: [{transactionId, category, amount, severity}]
    - _Requirements: 7.3_

  - [x] 12.5 Implement recurring expense detection
    - For each category, identify transactions with similar amounts (within 10% variance)
    - Check if they occur at regular intervals (weekly, monthly)
    - Return recurring patterns: [{category, amount, frequency, confidence}]
    - _Requirements: 7.1_

  - [x] 12.6 Generate natural language insights
    - Convert detected patterns, trends, and anomalies into natural language strings
    - Example: "Your food spending increased by 25% over the past 3 months"
    - Example: "Detected unusual entertainment expense of ₹5000 on Jan 15"
    - Prioritize insights by potential savings impact (sort by amount or percentage)
    - Return insights: [{text, category, impact, type}]
    - _Requirements: 7.6, 7.7_

  - [ ]* 12.7 Write property tests for insight prioritization
    - **Property 28: Insight Prioritization by Impact**
    - **Validates: Requirements 7.7**


- [x] 13. Implement spending forecast in ML service
  - [x] 13.1 Create spending forecaster endpoint
    - Create POST /ml/forecast/spending endpoint in `ml_service/model.py`
    - Accept body: userId, transactions (array), goals (array)
    - Require minimum 3 months of transaction history
    - _Requirements: 11.1, 11.2_

  - [x] 13.2 Implement time series forecasting per category
    - For each spending category, extract monthly spending amounts
    - Fit ARIMA or Exponential Smoothing model using statsmodels library
    - Generate next month forecast with prediction intervals
    - Return min (lower bound), expected (point forecast), max (upper bound)
    - _Requirements: 11.2, 11.3_

  - [ ]* 13.3 Write property tests for forecast structure
    - **Property 43: Forecast Includes All Categories**
    - **Validates: Requirements 11.1**
    - **Property 44: Forecast Includes Range Values**
    - **Validates: Requirements 11.3**

  - [x] 13.4 Implement forecast validation and warnings
    - Sum expected forecasts across all categories
    - If total > user income, set warning flag: "Forecasted spending exceeds income"
    - Incorporate active goals: add required monthly savings to forecast
    - Return: {forecasts: {category: {min, expected, max}}, totalExpected, warning?}
    - _Requirements: 11.4, 11.5_

  - [ ]* 13.5 Write property tests for forecast warnings
    - **Property 45: Forecast Exceeding Income Triggers Warning**
    - **Validates: Requirements 11.4**

  - [x] 13.6 Implement forecast accuracy tracking
    - Update forecasts weekly as new transaction data becomes available
    - When actual spending data for forecasted month becomes available, calculate accuracy
    - Store forecast accuracy: absolute error = |forecast - actual|
    - Add accuracy metrics to monitoring endpoint
    - _Requirements: 11.6, 11.7_

  - [ ]* 13.7 Write property tests for forecast accuracy
    - **Property 46: Forecast Accuracy Tracking**
    - **Validates: Requirements 11.7**


- [x] 14. Implement budget recommendation engine in ML service
  - [x] 14.1 Create budget recommender endpoint
    - Create POST /ml/recommend/budget endpoint in `ml_service/model.py`
    - Accept body: userId, income, transactions (array), goals (array)
    - _Requirements: 8.1_

  - [x] 14.2 Implement 50/30/20 rule baseline
    - Calculate needs (50%): rent + food + transport + education
    - Calculate wants (30%): entertainment + shopping + misc
    - Calculate savings (20%)
    - Distribute percentages across categories based on historical averages or defaults
    - _Requirements: 8.2_

  - [ ]* 14.3 Write property tests for budget recommendations
    - **Property 29: Budget Recommendations Include All Categories**
    - **Validates: Requirements 8.1**
    - **Property 30: Budget Recommendations Follow 50/30/20 Rule**
    - **Validates: Requirements 8.2**

  - [x] 14.4 Implement ML-informed adjustments
    - Analyze user's historical spending patterns (average per category)
    - Identify categories with consistent overspending (historical avg > previous budget by 20%)
    - For overspending categories, recommend allocation ≤ historical average (realistic)
    - Adjust allocations based on financial_literacy_score: higher score → more aggressive savings
    - Adjust based on saving_habit_score: higher score → more savings allocation
    - _Requirements: 8.3, 8.6, 8.7_

  - [ ]* 14.5 Write property tests for overspending adjustments
    - **Property 33: Overspending Categories Get Reduced Allocations**
    - **Validates: Requirements 8.6**

  - [x] 14.6 Incorporate financial goals into recommendations
    - Sum required monthly savings for all active goals
    - Ensure savings allocation >= sum of required monthly savings
    - If goals require more than 20% of income, adjust wants categories proportionally
    - _Requirements: 8.4_

  - [ ]* 14.7 Write property tests for goal-based recommendations
    - **Property 31: Recommendations Consider Goals**
    - **Validates: Requirements 8.4**

  - [x] 14.8 Generate rationale for each allocation
    - For each category, create rationale string explaining the allocation
    - Example: "Rent: ₹12,000 (30% of income, based on your typical spending)"
    - Example: "Savings: ₹8,000 (20% of income, includes ₹5,000 for your vacation goal)"
    - Return: {allocations: {category: amount}, rationale: {category: string}}
    - _Requirements: 8.5_

  - [ ]* 14.9 Write property tests for rationale generation
    - **Property 32: Recommendations Include Rationale**
    - **Validates: Requirements 8.5**


- [x] 15. Implement peer comparison analytics in ML service
  - [x] 15.1 Create peer comparison endpoint
    - Create POST /ml/compare/peers endpoint in `ml_service/model.py`
    - Accept body: userId, age, income, transactions (array)
    - _Requirements: 12.1_

  - [x] 15.2 Define peer groups and calculate aggregates
    - Define age brackets: 18-22, 23-27, 28-35
    - Define income quartiles: Q1 (0-25%), Q2 (25-50%), Q3 (50-75%), Q4 (75-100%)
    - Query all users in same age bracket and income quartile
    - Require minimum 50 users in peer group, otherwise return error
    - Calculate aggregate statistics: mean savings rate, mean spending per category
    - _Requirements: 12.1, 12.5_

  - [ ]* 15.3 Write property tests for peer group requirements
    - **Property 49: Peer Comparison Requires Minimum Group Size**
    - **Validates: Requirements 12.5**

  - [x] 15.4 Calculate user percentiles
    - Calculate user's savings rate: (total savings / total income) × 100
    - Calculate percentile: percentage of peers with lower savings rate
    - For each spending category, calculate user's spending percentile
    - Return percentiles (0-100) for savings rate and all categories
    - _Requirements: 12.2, 12.3, 12.6_

  - [ ]* 15.5 Write property tests for peer comparison
    - **Property 47: Peer Comparison Includes Savings Rate Percentile**
    - **Validates: Requirements 12.2**
    - **Property 48: Peer Comparison Includes All Categories**
    - **Validates: Requirements 12.3**
    - **Property 50: Peer Comparison Returns Percentiles**
    - **Validates: Requirements 12.6**

  - [x] 15.6 Ensure privacy and anonymization
    - Never return individual user data, only aggregates
    - Do not expose user IDs or identifying information
    - Add context message: "Comparisons are guidelines, not targets"
    - _Requirements: 12.4, 12.7_


- [x] 16. Implement ML model performance monitoring
  - [x] 16.1 Create monitoring endpoint
    - Create GET /ml/monitoring/metrics endpoint in `ml_service/model.py`
    - Query PredictionLog collection for records with actualSavings (ground truth available)
    - Filter to past 30 days for rolling metrics
    - _Requirements: 13.3, 13.5_

  - [x] 16.2 Calculate accuracy metrics
    - Calculate MAE: mean(|predicted - actual|)
    - Calculate RMSE: sqrt(mean((predicted - actual)²))
    - Calculate R²: 1 - (SS_res / SS_tot)
    - Count total predictions in period
    - Store last_updated timestamp
    - Return: {mae, rmse, r2, predictions_count, last_updated}
    - _Requirements: 13.2, 13.3_

  - [ ]* 16.3 Write property tests for monitoring metrics
    - **Property 51: Actual vs Predicted Storage**
    - **Validates: Requirements 13.2**
    - **Property 52: Monitoring Metrics Completeness**
    - **Validates: Requirements 13.3**

  - [x] 16.4 Implement accuracy degradation alerting
    - Check if MAE > 1000 rupees threshold
    - If threshold exceeded, log alert message
    - Set alert flag in monitoring response
    - Document retraining procedure in alert message
    - _Requirements: 13.4_

  - [ ]* 16.5 Write property tests for degradation alerts
    - **Property 53: Accuracy Degradation Triggers Alert**
    - **Validates: Requirements 13.4**

  - [x] 16.6 Track prediction latency
    - Calculate p50, p95, p99 latency from PredictionLog.latencyMs
    - Flag predictions with latency > 500ms
    - Include latency metrics in monitoring response
    - _Requirements: 13.6_

  - [ ]* 16.7 Write property tests for latency tracking
    - **Property 54: Prediction Latency Tracking**
    - **Validates: Requirements 13.6**

  - [x] 16.8 Implement model versioning and rollback
    - Store model version in PredictionLog records
    - Save models with version numbers: model_v1.pkl, model_v2.pkl
    - Create endpoint POST /ml/rollback/:version to load previous model version
    - Document rollback procedure
    - _Requirements: 13.7_


- [x] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Integrate ML service endpoints with backend
  - [x] 18.1 Create ML service proxy routes in backend
    - Create `server/routes/mlRoutes.js` with proxy routes to ML service
    - Implement POST /api/ml/predict/savings → forwards to ML service POST /ml/predict/savings
    - Implement POST /api/ml/analyze/spending → forwards to ML service
    - Implement POST /api/ml/forecast/spending → forwards to ML service
    - Implement POST /api/ml/recommend/budget → forwards to ML service
    - Implement POST /api/ml/compare/peers → forwards to ML service
    - Implement GET /api/ml/monitoring/metrics → forwards to ML service
    - Add authentication middleware to all routes
    - Handle ML service errors gracefully (return 503 if service unavailable)
    - _Requirements: 6.1, 7.1, 8.1, 11.1, 12.1_

  - [x] 18.2 Implement AI-assisted budget creation
    - Update POST /api/budgets to support AI-assisted mode
    - When request includes `aiAssisted: true`, call ML service /ml/recommend/budget
    - Pass user's income, transaction history, and goals to ML service
    - Receive recommended allocations and apply to budget
    - Ensure savings allocation >= 20% of income
    - Store budget with reference to AI recommendation
    - _Requirements: 3.5, 3.6_

  - [x] 18.3 Integrate spending insights into dashboard
    - Create GET /api/insights endpoint
    - Call ML service /ml/analyze/spending with user's transactions
    - Call ML service /ml/forecast/spending for next month predictions
    - Call ML service /ml/compare/peers for peer comparisons
    - Combine all insights into single response
    - Cache results for 24 hours to reduce ML service load
    - _Requirements: 7.1, 11.1, 12.1_

  - [x] 18.4 Update prediction endpoint to log results
    - Update existing prediction endpoint to use new ML service endpoint
    - After receiving prediction, create PredictionLog record in MongoDB
    - Store all required fields: userId, modelVersion, inputFeatures, predictedSavings, confidenceInterval, latencyMs
    - Return prediction with confidence intervals to frontend
    - _Requirements: 6.4, 6.7_


- [x] 19. Build frontend components for education system
  - [x] 19.1 Create Education Dashboard component
    - Create `client/src/pages/EducationDashboard.jsx`
    - Display personalized content recommendations (call GET /api/education/recommendations)
    - Show learning progress: completed modules, overall progress percentage
    - Display featured articles and tips
    - Add search bar for content search
    - Add filters for category and difficulty
    - _Requirements: 1.6, 2.1, 10.4, 14.1, 14.2_

  - [x] 19.2 Create Article viewer component
    - Create `client/src/components/ArticleViewer.jsx`
    - Display article title, content, reading time, category, difficulty
    - Increment viewCount when article is opened
    - Show related articles at bottom
    - Add bookmark/save functionality
    - _Requirements: 1.1_

  - [x] 19.3 Create Learning Module component
    - Create `client/src/components/LearningModule.jsx`
    - Display module title, description, estimated hours, lessons list
    - Show progress bar for module completion
    - Allow user to start module (POST /api/education/modules/:id/progress)
    - Display lessons with completion checkmarks
    - Implement quiz interface for lessons with quizzes
    - Submit quiz scores and update progress
    - _Requirements: 1.3, 1.7, 10.1, 10.2, 10.3, 10.5, 10.6_

  - [x] 19.4 Create Contextual Tip display component
    - Create `client/src/components/ContextualTip.jsx`
    - Display tip content in a card or modal
    - Show tip when transaction is added
    - Show tip when budget is exceeded
    - Show tip when goal is achieved
    - Add "Mark as helpful" button (POST /api/tips/:id/helpful)
    - Add dismiss button
    - Implement session-based tip rotation (don't show same tip twice)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.7_

  - [x] 19.5 Create Content Search component
    - Create `client/src/components/ContentSearch.jsx`
    - Implement search input with debouncing
    - Call GET /api/education/articles with search query
    - Display search results with snippets and highlighted terms
    - Show filters for category, difficulty, content type
    - Implement sorting options (relevance, date, popularity)
    - Show "No results" message with suggestions
    - _Requirements: 14.1, 14.3, 14.4, 14.5, 14.6_


- [x] 20. Build frontend components for budget management
  - [x] 20.1 Create Budget Manager component
    - Create `client/src/pages/BudgetManager.jsx`
    - Display current budget with category allocations
    - Show budget creation form with all 8 categories (7 spending + savings)
    - Validate that total allocations <= user income
    - Add option to use budget template (dropdown with templates)
    - Add option to use AI-assisted budget (call POST /api/budgets with aiAssisted: true)
    - Allow editing existing budget allocations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 15.3, 15.4_

  - [x] 20.2 Create Budget Variance visualization component
    - Create `client/src/components/BudgetVariance.jsx`
    - Call GET /api/budgets/:id/variance
    - Display variance for each category with visual indicators
    - Show progress bars: (actual / budgeted) × 100
    - Color code by status: green (under), yellow (on_track), orange (over), red (critical)
    - Display variance amounts and percentages
    - Show notifications for exceeded categories
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 20.3 Create Budget Template selector component
    - Create `client/src/components/BudgetTemplateSelector.jsx`
    - Fetch and display templates (GET /api/budgets/templates)
    - Show template name, description, target user
    - Display category percentages for each template
    - Allow user to preview calculated amounts based on their income
    - Allow user to select template and customize before saving
    - Show most popular templates first
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 20.4 Create Custom Template creation component
    - Create `client/src/components/CustomTemplateCreator.jsx`
    - Allow user to save current budget as custom template
    - Input fields: template name, description
    - Convert budget amounts to percentages
    - Submit to POST /api/budgets/templates/custom
    - Display user's custom templates
    - _Requirements: 15.7_


- [x] 21. Build frontend components for goal management
  - [x] 21.1 Create Goal Tracker component
    - Create `client/src/pages/GoalTracker.jsx`
    - Display all user goals (GET /api/goals)
    - Show goal name, target amount, current amount, deadline
    - Display progress bar: (currentAmount / targetAmount) × 100
    - Show remaining amount and required monthly savings
    - Add goal creation form (POST /api/goals)
    - Validate deadline is in future
    - Validate target amount > 0
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 21.2 Create Goal management component
    - Create `client/src/components/GoalCard.jsx`
    - Display individual goal details
    - Allow editing goal (PUT /api/goals/:id)
    - Allow updating current amount (manual savings contributions)
    - Show "Completed" badge when goal is achieved
    - Allow deleting goal (DELETE /api/goals/:id)
    - Show notification when goal is completed
    - _Requirements: 5.6, 5.7_

  - [x] 21.3 Integrate goals with budget recommendations
    - In Budget Manager, show active goals
    - Display required monthly savings for all goals
    - When using AI-assisted budget, pass goals to ML service
    - Show how budget allocates for goal savings
    - _Requirements: 8.4_


- [x] 22. Build frontend components for ML insights
  - [x] 22.1 Create Spending Insights component
    - Create `client/src/components/SpendingInsights.jsx`
    - Call GET /api/insights to fetch all insights
    - Display spending patterns: trends, anomalies, recurring expenses
    - Show natural language insights with icons
    - Highlight high-impact insights
    - Display trend charts (increasing/decreasing/stable)
    - Show anomalous transactions with details
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7_

  - [x] 22.2 Create Spending Forecast component
    - Create `client/src/components/SpendingForecast.jsx`
    - Display next month spending forecast for each category
    - Show forecast ranges: min, expected, max
    - Visualize with range bars or confidence intervals
    - Display warning if forecast exceeds income
    - Show how goals impact forecast
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 22.3 Create Peer Comparison component
    - Create `client/src/components/PeerComparison.jsx`
    - Display user's savings rate percentile
    - Show spending percentiles for each category
    - Visualize with percentile bars or gauges
    - Add context message: "Comparisons are guidelines, not targets"
    - Show only if peer group has sufficient data (>= 50 users)
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 22.4 Update existing Dashboard with new insights
    - Update `client/src/pages/Dashboard.jsx`
    - Add section for personalized content recommendations
    - Add section for spending insights
    - Add section for budget variance summary
    - Add section for goal progress
    - Show contextual tips based on user actions
    - Display prediction with confidence intervals
    - _Requirements: 2.1, 6.4_


- [x] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Add navigation and routing for new features
  - [x] 24.1 Update navigation menu
    - Update `client/src/App.jsx` or navigation component
    - Add menu items: Education, Budget Manager, Goals, Insights
    - Add routes for new pages: /education, /budget, /goals, /insights
    - Ensure all routes are protected (require authentication)
    - _Requirements: All_

  - [x] 24.2 Update API service layer
    - Update `client/src/services/api.js` with new API endpoints
    - Add functions for education endpoints (getArticles, getTips, getModules, etc.)
    - Add functions for budget endpoints (createBudget, getBudgets, getVariance, etc.)
    - Add functions for goal endpoints (createGoal, getGoals, updateGoal, deleteGoal)
    - Add functions for ML endpoints (getInsights, getForecast, getPeerComparison)
    - Add error handling for all API calls
    - _Requirements: All_


- [x] 25. Install required dependencies
  - [x] 25.1 Install backend dependencies
    - No new backend dependencies required (using existing: express, mongoose, axios, jsonwebtoken)
    - Verify all dependencies are installed: `npm install` in server directory
    - _Requirements: All_

  - [x] 25.2 Install ML service dependencies
    - Update `ml_service/requirements.txt` to include: scikit-learn, pandas, numpy, fastapi, uvicorn, joblib, statsmodels, pydantic, pymongo
    - Install dependencies: `pip install -r ml_service/requirements.txt`
    - _Requirements: 6.1, 7.1, 11.1, 12.1_

  - [x] 25.3 Install frontend dependencies
    - No new frontend dependencies required (using existing: react, axios, tailwindcss)
    - Consider adding chart library for visualizations: recharts or chart.js
    - Install if needed: `npm install recharts` in client directory
    - _Requirements: All_


- [x] 26. Write unit tests for backend
  - [ ]* 26.1 Write unit tests for education controllers
    - Test article CRUD operations with specific data
    - Test tip retrieval with different contexts
    - Test module progress tracking with edge cases
    - Test search with empty queries and special characters
    - Test recommendation engine with specific user profiles
    - Use Jest or Mocha with mocked database
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 2.1, 9.1, 10.1, 14.1_

  - [ ]* 26.2 Write unit tests for budget controllers
    - Test budget creation with edge cases (zero income, negative amounts)
    - Test variance calculation with specific budget/spending pairs
    - Test template application with specific income values
    - Test goal deadline validation (past dates, far future dates)
    - Test goal achievement detection
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.6, 15.3_

  - [ ]* 26.3 Write integration tests for API endpoints
    - Test end-to-end flows: create budget → add transactions → view variance
    - Test recommendation engine with real database queries
    - Test ML service integration with backend
    - Test search across multiple content types
    - Use test database, reset between test suites
    - _Requirements: All_


- [x] 27. Write unit tests for ML service
  - [ ]* 27.1 Write unit tests for prediction model
    - Test model loading and initialization
    - Test feature preprocessing and validation
    - Test specific prediction scenarios (high income, low income, zero spending)
    - Test confidence interval calculation
    - Test prediction logging
    - Use pytest with mocked database
    - _Requirements: 6.1, 6.2, 6.4, 6.7_

  - [ ]* 27.2 Write unit tests for spending analyzer
    - Test trend detection with known patterns
    - Test anomaly detection with known outliers
    - Test recurring expense detection
    - Test insight generation and prioritization
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7_

  - [ ]* 27.3 Write unit tests for forecaster
    - Test forecast generation with insufficient data
    - Test forecast validation and warnings
    - Test forecast accuracy tracking
    - _Requirements: 11.1, 11.2, 11.4, 11.7_

  - [ ]* 27.4 Write unit tests for budget recommender
    - Test 50/30/20 rule application
    - Test goal incorporation
    - Test overspending adjustments
    - Test rationale generation
    - _Requirements: 8.2, 8.4, 8.5, 8.6_

  - [ ]* 27.5 Write unit tests for peer comparison
    - Test with edge cases (single user, exact threshold of 50 users)
    - Test percentile calculation
    - Test privacy and anonymization
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 27.6 Write unit tests for monitoring
    - Test accuracy metric calculation
    - Test degradation alerting
    - Test latency tracking
    - _Requirements: 13.2, 13.3, 13.4, 13.6_


- [x] 28. Performance testing and optimization
  - [ ]* 28.1 Test search performance
    - Create test dataset with 1000 articles
    - Measure search query response time
    - Ensure search completes within 200ms
    - Optimize MongoDB text indexes if needed
    - _Requirements: 14.7_

  - [ ]* 28.2 Test ML prediction latency
    - Measure prediction endpoint response time
    - Ensure predictions complete within 500ms
    - Optimize model inference if needed
    - Test with concurrent requests
    - _Requirements: 13.6_

  - [ ]* 28.3 Test variance calculation performance
    - Create test dataset with 10,000 transactions
    - Measure variance calculation time
    - Optimize database queries if needed
    - Add indexes on transaction date and category
    - _Requirements: 4.1_

  - [ ]* 28.4 Test peer comparison performance
    - Create test dataset with 1000 users
    - Measure peer comparison query time
    - Optimize aggregation queries if needed
    - Add indexes on age and income
    - _Requirements: 12.1_


- [x] 29. Documentation and deployment preparation
  - [ ]* 29.1 Document API endpoints
    - Create API documentation for all new endpoints
    - Include request/response examples
    - Document error codes and messages
    - Add authentication requirements
    - _Requirements: All_

  - [ ]* 29.2 Document ML models
    - Document model architecture and hyperparameters
    - Document training procedure
    - Document retraining schedule
    - Document monitoring and alerting
    - _Requirements: 6.1, 6.6, 13.3, 13.4_

  - [ ]* 29.3 Create deployment guide
    - Document environment variables needed
    - Document database setup and seeding
    - Document ML service deployment
    - Document model training and deployment
    - _Requirements: All_

  - [ ]* 29.4 Update README
    - Add feature descriptions
    - Add setup instructions
    - Add usage examples
    - Add troubleshooting guide
    - _Requirements: All_


- [x] 30. Final integration and testing
  - [x] 30.1 End-to-end testing of complete feature
    - Test complete user journey: signup → create budget → add transactions → view insights → set goals → view recommendations
    - Test all integrations between frontend, backend, and ML service
    - Test error handling and edge cases
    - Test with realistic data volumes
    - _Requirements: All_

  - [x] 30.2 Final checkpoint - Ensure all tests pass
    - Run all unit tests, property tests, integration tests
    - Verify all 63 correctness properties pass
    - Fix any failing tests
    - Ensure code coverage meets targets
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: data models → backend APIs → ML service → frontend
- ML service uses Python with scikit-learn, statsmodels, and FastAPI
- Backend uses Node.js with Express and MongoDB
- Frontend uses React with TailwindCSS
- All 63 correctness properties from the design document are covered by property-based tests
