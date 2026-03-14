# Implementation Plan: Piggy Bank Emergency Fund

## Overview

This implementation plan breaks down the Piggy Bank Emergency Fund feature into discrete coding tasks. The feature adds emergency savings functionality to the existing financial dashboard, including auto-suggest notifications, gamification through streaks and badges, and emergency withdrawal validation. Implementation follows a backend-first approach, then frontend components, then integration and testing.

## Tasks

- [x] 1. Update database models
  - [x] 1.1 Add piggyBank fields to User model
    - Add piggyBank object with balance, goal, streak, badges, untouchedStatus, totalContributions, totalWithdrawals fields to server/models/User.js
    - Set default values: balance=0, goal=15000, streak.count=0, untouchedStatus=true
    - Add validation: balance min 0, goal min 1000 max 100000
    - _Requirements: 1.1, 1.2, 9.2, 15.1, 15.3_
  
  - [ ]* 1.2 Write property test for User model initialization
    - **Property 1: Piggy Bank Initialization**
    - **Validates: Requirements 1.1, 9.2**
  
  - [x] 1.3 Create PiggyBankTransaction model
    - Create server/models/PiggyBankTransaction.js with schema for userId, type, amount, source, emergencyReason, emergencyProof, warningShown, balanceAfter fields
    - Add indexes for efficient queries: userId+createdAt, userId+type
    - Add conditional validation for withdrawal fields (emergencyReason and emergencyProof required when type='withdrawal')
    - _Requirements: 5.8, 14.1, 14.2, 15.2_
  
  - [ ]* 1.4 Write property test for transaction record creation
    - **Property 11: Transaction Record Creation**
    - **Validates: Requirements 4.6, 5.8, 14.1, 14.2, 14.3**
  
  - [x] 1.5 Update Notification model for piggy bank types
    - Add 'piggy_bank_suggest' and 'badge_earned' to type enum in server/models/Notification.js
    - Add suggestedAmount field for piggy_bank_suggest notifications
    - Add badgeName and badgeIcon fields for badge_earned notifications
    - _Requirements: 3.1, 10.6_


- [x] 2. Implement backend services
  - [x] 2.1 Create streakService.js
    - Create server/services/streakService.js with functions: calculateStreak(userId), updateStreakOnContribution(userId), resetStreakOnMonthEnd(userId)
    - Implement logic to count consecutive months with contributions
    - Handle month boundary transitions correctly
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 2.2 Write property tests for streak calculation
    - **Property 18: Streak Calculation**
    - **Property 19: Streak Increment**
    - **Property 20: Streak Reset**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  
  - [x] 2.3 Create badgeService.js
    - Create server/services/badgeService.js with functions: checkAndAwardBadges(userId), getBadgeList(userId)
    - Implement badge award logic for: 3-month streak, ₹10,000 balance, goal reached
    - Prevent duplicate badge awards
    - Return newly awarded badges for notification
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
  
  - [ ]* 2.4 Write property test for badge award conditions
    - **Property 24: Badge Award Conditions**
    - **Validates: Requirements 10.1, 10.2, 10.3**
  
  - [x] 2.5 Create autoSuggestService.js
    - Create server/services/autoSuggestService.js with functions: calculateLeftoverBudget(userId), shouldSuggest(userId), createSuggestionNotification(userId)
    - Implement leftover calculation: bank_balance + monthly_income - monthly_expenses
    - Only suggest when leftover > ₹100
    - Create notification with exact leftover amount
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 2.6 Write property tests for auto-suggest logic
    - **Property 4: Leftover Budget Calculation**
    - **Property 5: Auto-Suggest Threshold**
    - **Property 6: Auto-Suggest Amount Accuracy**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 4. Implement backend controllers and routes
  - [x] 4.1 Create piggyBankController.js
    - Create server/controllers/piggyBankController.js with functions: contribute, withdraw, getBalance, getHistory, updateGoal, getAutoSuggest
    - Implement contribute: validate amount, update balances atomically, record transaction, update streak, check badges
    - Implement withdraw: validate amount and emergency fields, check for non-emergency keywords, update balances, record transaction, update untouchedStatus
    - Implement getBalance: return current piggyBank state with balance, goal, streak, badges, untouchedStatus
    - Implement getHistory: aggregate transactions by month, return last N months
    - Implement updateGoal: validate goal range (1000-100000), update user
    - Implement getAutoSuggest: call autoSuggestService and return suggestion
    - _Requirements: 3.3, 4.3, 4.4, 4.5, 4.6, 5.3, 5.4, 5.5, 5.6, 5.7, 6.2, 6.3, 7.1, 7.2, 7.3, 9.1_
  
  - [ ]* 4.2 Write property tests for balance conservation
    - **Property 7: Balance Conservation (Contributions)**
    - **Property 8: Balance Conservation (Withdrawals)**
    - **Validates: Requirements 3.3, 4.4, 5.6**
  
  - [ ]* 4.3 Write property tests for validation logic
    - **Property 9: Contribution Validation**
    - **Property 10: Withdrawal Validation**
    - **Property 12: Emergency Reason Validation**
    - **Property 13: Emergency Proof Length Validation**
    - **Property 14: Non-Emergency Keyword Warning**
    - **Validates: Requirements 4.3, 4.5, 5.3, 5.4, 5.5, 6.2, 6.3**
  
  - [x] 4.4 Create piggyBankRoutes.js
    - Create server/routes/piggyBankRoutes.js with routes: POST /contribute, POST /withdraw, GET /balance, GET /history, PUT /goal, GET /auto-suggest
    - Wire routes to piggyBankController functions
    - All routes require authMiddleware
    - _Requirements: 3.2, 4.1, 5.1, 7.1, 9.1_
  
  - [x] 4.5 Register piggyBank routes in server/index.js
    - Import piggyBankRoutes
    - Add app.use('/api/piggybank', authMiddleware, piggyBankRoutes)
    - _Requirements: 3.2, 4.1, 5.1_
  
  - [ ]* 4.6 Write unit tests for API endpoints
    - Test POST /api/piggybank/contribute with valid/invalid amounts
    - Test POST /api/piggybank/withdraw with valid/invalid emergency data
    - Test GET /api/piggybank/balance returns correct structure
    - Test GET /api/piggybank/history returns last 4 months
    - Test PUT /api/piggybank/goal with valid/invalid ranges
    - _Requirements: 3.2, 4.1, 5.1, 7.1, 9.1_


- [x] 5. Implement scheduled job for auto-suggest
  - [x] 5.1 Create monthEndSuggestJob.js
    - Create server/jobs/monthEndSuggestJob.js with cron job that runs daily
    - Check if current date is in month-end window (days 28-31)
    - For each user, call autoSuggestService.shouldSuggest() and create notifications
    - Ensure only one notification per user per day
    - _Requirements: 2.1, 3.1, 3.5_
  
  - [x] 5.2 Set up cron scheduler in server/index.js
    - Install node-cron if not already present
    - Import and schedule monthEndSuggestJob to run daily at midnight
    - _Requirements: 2.1, 3.1_

- [x] 6. Checkpoint - Ensure backend tests pass
  - Ensure all backend tests pass, ask the user if questions arise.


- [x] 7. Implement frontend components
  - [x] 7.1 Create PiggyBankCard.jsx component
    - Create client/src/components/PiggyBankCard.jsx with state for piggyBankData, showContributionModal, showWithdrawalModal
    - Implement loadPiggyBankData() to fetch from GET /api/piggybank/balance
    - Display emergency fund balance prominently
    - Display goal progress bar with percentage calculation
    - Display contribution streak with fire emoji (🔥) and gold highlight for streak >= 3
    - Display last 4 months contribution history
    - Add "Add Money" and "Emergency Withdraw" buttons
    - _Requirements: 1.3, 1.5, 7.1, 7.2, 8.4, 8.5, 9.3, 9.5, 12.1, 12.2, 12.4_
  
  - [x] 7.2 Create ContributionModal.jsx component
    - Create client/src/components/ContributionModal.jsx with props: isOpen, onClose, onSubmit, maxAmount
    - Add amount input field with validation (positive, <= maxAmount, >= ₹1)
    - Display available balance
    - Show error messages for invalid input
    - Call POST /api/piggybank/contribute on submit
    - Display motivational message on success
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 11.1, 11.2_
  
  - [ ]* 7.3 Write unit tests for ContributionModal validation
    - Test amount validation logic
    - Test error message display
    - Test submit button disabled state
    - _Requirements: 4.3, 4.5_
  
  - [x] 7.4 Create WithdrawalModal.jsx component
    - Create client/src/components/WithdrawalModal.jsx with props: isOpen, onClose, onSubmit, maxAmount
    - Add amount input field with validation
    - Add emergency reason dropdown with options: Medical Emergency, Job Loss, Vehicle Repair, Home Repair, Family Emergency
    - Add emergency proof textarea with min 20 characters validation
    - Implement keyword detection for non-emergency terms (shopping, vacation, party, concert)
    - Display warning message if non-emergency keywords detected
    - Call POST /api/piggybank/withdraw on submit
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2_
  
  - [ ]* 7.5 Write unit tests for WithdrawalModal validation
    - Test emergency reason validation
    - Test proof length validation
    - Test non-emergency keyword detection
    - Test warning message display
    - _Requirements: 5.4, 5.5, 6.2_


  - [x] 7.6 Create BadgeDisplay.jsx component
    - Create client/src/components/BadgeDisplay.jsx with props: badges, untouchedStatus
    - Display earned badges in grid layout with icon, name, and earned date
    - Display locked placeholders for unearned badges
    - Show "Untouched Fund 🛡️" status indicator if applicable
    - _Requirements: 10.4, 10.5_
  
  - [x] 7.7 Create MotivationalMessage.jsx component
    - Create client/src/components/MotivationalMessage.jsx with props: message, type
    - Display message with auto-dismiss after 5 seconds
    - Support special styling for streak celebration and milestone messages
    - Include at least 10 different motivational messages in constants
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 7.8 Write property test for motivational message selection
    - **Property 27: Motivational Message Selection**
    - **Validates: Requirements 11.1**

- [x] 8. Update existing frontend components
  - [x] 8.1 Modify CashPosition.jsx to display piggy bank balance
    - Update client/src/components/CashPosition.jsx to fetch and display emergency fund balance
    - Add visual separation between spending cash and emergency fund
    - Display "Available to Spend: ₹X" and "Emergency Fund: ₹X" side by side
    - _Requirements: 1.3, 1.5, 12.3_
  
  - [ ]* 8.2 Write property test for balance separation display
    - **Property 2: Balance Separation**
    - **Validates: Requirements 1.2**
  
  - [x] 8.3 Modify SmartAlerts.jsx to handle piggy bank notifications
    - Update client/src/components/SmartAlerts.jsx to display piggy_bank_suggest and badge_earned notification types
    - For piggy_bank_suggest: display suggested amount and "Add to Piggy Bank" / "Skip" buttons
    - For badge_earned: display badge icon, name, and celebration message with "Share Achievement" button
    - Handle "Add to Piggy Bank" action by calling contribute API
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.6, 13.1_
  
  - [ ]* 8.4 Write unit tests for SmartAlerts piggy bank notifications
    - Test piggy_bank_suggest notification rendering
    - Test badge_earned notification rendering
    - Test action button handlers
    - _Requirements: 3.1, 3.2, 10.6_


- [x] 9. Integrate piggy bank into Dashboard
  - [x] 9.1 Add PiggyBankCard to Dashboard.jsx
    - Import PiggyBankCard component in client/src/pages/Dashboard.jsx
    - Add PiggyBankCard to Overview tab above transaction history section
    - Ensure proper layout and responsive design
    - _Requirements: 12.1, 12.2, 12.5_
  
  - [x] 9.2 Update Dashboard data fetching
    - Modify Dashboard.jsx to fetch piggy bank data on mount
    - Handle loading and error states for piggy bank data
    - Refresh piggy bank data after contributions/withdrawals
    - _Requirements: 12.1, 12.2_
  
  - [ ]* 9.3 Write integration tests for Dashboard
    - Test PiggyBankCard renders in Dashboard
    - Test data flow from API to Dashboard to PiggyBankCard
    - Test contribution flow updates Dashboard state
    - _Requirements: 12.1, 12.2_

- [x] 10. Implement transaction history integration
  - [x] 10.1 Update Transaction model categories
    - Add 'emergency_fund_deposit' and 'emergency_fund_withdrawal' to category enum in server/models/Transaction.js
    - _Requirements: 14.1, 14.2_
  
  - [x] 10.2 Create transactions for piggy bank operations
    - Modify piggyBankController.contribute to create Transaction record with type='transfer' and category='emergency_fund_deposit'
    - Modify piggyBankController.withdraw to create Transaction record with type='transfer', category='emergency_fund_withdrawal', and include emergencyReason in description
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [x] 10.3 Update transaction display to show piggy bank icon
    - Modify transaction list component to display piggy bank emoji (🐷) for emergency_fund_deposit and emergency_fund_withdrawal categories
    - _Requirements: 14.4_
  
  - [x] 10.4 Add piggy bank transaction filter
    - Add filter option to transaction history to show only piggy bank transactions
    - _Requirements: 14.5_
  
  - [ ]* 10.5 Write property test for transaction history integration
    - **Property 16: Contribution History Aggregation**
    - **Property 17: Contribution History Ordering**
    - **Validates: Requirements 7.3, 7.5**


- [x] 11. Implement shareable achievements feature
  - [x] 11.1 Create achievement image generator utility
    - Create client/src/utils/achievementImageGenerator.js with function generateShareImage(badgeName, badgeIcon, userName)
    - Use HTML5 Canvas API to generate image with badge icon, name, user's first name
    - Include app branding and motivational tagline
    - Exclude sensitive financial information (exact balance amounts)
    - Return image as data URL for download or sharing
    - _Requirements: 13.2, 13.4, 13.5_
  
  - [ ]* 11.2 Write property tests for share image content
    - **Property 30: Share Image Content**
    - **Property 31: Share Image Branding**
    - **Validates: Requirements 13.2, 13.4, 13.5**
  
  - [x] 11.3 Add share functionality to badge notifications
    - Update SmartAlerts.jsx badge_earned notification to include "Share Achievement" button
    - On click, call achievementImageGenerator and provide download/share options
    - Support social media sharing (Twitter, Facebook, WhatsApp) and direct download
    - _Requirements: 13.1, 13.3_
  
  - [ ]* 11.4 Write unit tests for share functionality
    - Test share button appears in badge notification
    - Test image generation is called with correct parameters
    - Test download functionality works
    - _Requirements: 13.1, 13.3_

- [x] 12. Checkpoint - Ensure frontend tests pass
  - Ensure all frontend tests pass, ask the user if questions arise.


- [x] 13. Implement data persistence and integrity
  - [x] 13.1 Add database transaction support for atomic operations
    - Wrap balance updates in piggyBankController with MongoDB transactions
    - Ensure contribution updates both bank_balance and piggyBank.balance atomically
    - Ensure withdrawal updates both piggyBank.balance and bank_balance atomically
    - Implement rollback on any failure
    - _Requirements: 15.4, 15.6_
  
  - [ ]* 13.2 Write property test for balance integrity
    - **Property 32: Balance Integrity Invariant**
    - **Validates: Requirements 15.5**
  
  - [x] 13.3 Add data validation middleware
    - Create validation middleware to ensure piggyBank.balance >= 0 before any database write
    - Create validation middleware to ensure goal is within range (1000-100000)
    - _Requirements: 1.4, 9.1_
  
  - [ ]* 13.4 Write property test for non-negativity invariant
    - **Property 3: Balance Non-Negativity Invariant**
    - **Validates: Requirements 1.4**
  
  - [x] 13.5 Implement error handling and logging
    - Add comprehensive error handling in all piggyBankController functions
    - Log all withdrawal attempts with emergencyReason and emergencyProof
    - Return appropriate error codes: INSUFFICIENT_FUNDS, INSUFFICIENT_PIGGY_BANK, INVALID_AMOUNT, INVALID_GOAL, INVALID_REASON, INVALID_PROOF, DATABASE_ERROR
    - Display user-friendly error messages in frontend
    - _Requirements: 6.4, 15.6_
  
  - [ ]* 13.6 Write unit tests for error handling
    - Test all error codes are returned correctly
    - Test rollback on database failure
    - Test error messages display in UI
    - _Requirements: 15.6_


- [x] 14. Implement edge case handling
  - [x] 14.1 Handle month boundary transitions for streak
    - Update streakService to correctly handle contributions made at midnight during month transitions
    - Test with contributions at 23:59 on last day and 00:01 on first day of next month
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 14.2 Handle concurrent transaction prevention
    - Implement optimistic locking or use MongoDB transactions to prevent race conditions
    - Test scenario: two simultaneous contributions that would exceed bank_balance
    - _Requirements: 15.4, 15.6_
  
  - [x] 14.3 Handle exact goal match scenario
    - Test contribution that exactly reaches goal amount
    - Ensure "Goal Crusher 💪" badge is awarded
    - Ensure goal completion message displays
    - _Requirements: 9.4, 10.3_
  
  - [x] 14.4 Handle zero balance edge cases
    - Prevent withdrawal when piggyBank.balance is 0
    - Display appropriate message "No funds available in emergency fund"
    - _Requirements: 5.3_
  
  - [x] 14.5 Handle badge duplication prevention
    - Ensure badges are only awarded once (check if badge already exists before adding)
    - Test scenario: user reaches ₹10,000 multiple times
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 14.6 Write unit tests for edge cases
    - Test month boundary transitions
    - Test concurrent transactions
    - Test exact goal match
    - Test zero balance withdrawal
    - Test badge duplication prevention
    - _Requirements: 8.1, 9.4, 10.3, 5.3_


- [x] 15. Implement comprehensive property-based tests
  - [x] 15.1 Set up fast-check testing framework
    - Install fast-check library for property-based testing
    - Create test configuration with minimum 100 iterations per property
    - Set up test file structure: server/tests/piggybank.properties.test.js
    - _Requirements: All_
  
  - [ ]* 15.2 Write property tests for goal validation and progress
    - **Property 21: Goal Range Validation**
    - **Property 22: Progress Calculation**
    - **Property 23: Goal Completion Message**
    - **Validates: Requirements 9.1, 9.3, 9.4**
  
  - [ ]* 15.3 Write property tests for untouched status and badges
    - **Property 25: Untouched Status**
    - **Property 26: Badge Notification**
    - **Validates: Requirements 10.4, 10.6**
  
  - [ ]* 15.4 Write property tests for motivational messages
    - **Property 28: Streak Celebration Message**
    - **Property 29: Monthly Milestone Message**
    - **Validates: Requirements 11.3, 11.4**
  
  - [ ]* 15.5 Write property test for withdrawal logging
    - **Property 15: Withdrawal Logging**
    - **Validates: Requirements 6.4**

- [x] 16. Final integration and end-to-end testing
  - [x] 16.1 Test complete contribution flow
    - Test user clicks "Add to Piggy Bank" → enters amount → balance updates → transaction recorded → streak updated → badges checked → motivational message displays
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 8.2, 10.1, 10.2, 10.3, 11.1_
  
  - [x] 16.2 Test complete withdrawal flow
    - Test user clicks "Emergency Withdraw" → enters amount, reason, proof → validation occurs → warning displays if needed → balance updates → transaction recorded → untouchedStatus updated
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 6.2, 6.3, 10.4_
  
  - [x] 16.3 Test auto-suggest flow
    - Test scheduled job runs → calculates leftover budget → creates notification → user sees notification → clicks "Add to Piggy Bank" → contribution completes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
  
  - [x] 16.4 Test badge earning and sharing flow
    - Test user reaches badge threshold → badge awarded → notification displays → user clicks "Share Achievement" → image generated → share options provided
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 13.1, 13.2, 13.3_
  
  - [x] 16.5 Test dashboard integration
    - Test Dashboard displays PiggyBankCard → displays all data correctly → quick action buttons work → CashPosition shows both balances → transaction history includes piggy bank transactions
    - _Requirements: 1.3, 1.5, 12.1, 12.2, 12.3, 12.4, 12.5, 14.4, 14.5_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and integration points
- Implementation uses JavaScript to match existing Node.js/Express backend and React frontend
- All balance updates use MongoDB transactions to ensure atomicity and data integrity
