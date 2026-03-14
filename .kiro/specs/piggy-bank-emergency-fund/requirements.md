# Requirements Document

## Introduction

The Piggy Bank Emergency Fund feature enables young adults (18-27) to build emergency savings by transferring leftover monthly budget funds into a protected digital "piggy bank". The system gamifies emergency fund building through streaks, badges, and motivational messages while preventing misuse through emergency validation. This feature promotes financial responsibility by separating emergency funds from regular spending money and encouraging consistent saving habits.

## Glossary

- **Piggy_Bank**: A separate digital fund within the user's account designated exclusively for emergency savings
- **Emergency_Fund_Balance**: The total amount of money currently stored in the Piggy Bank
- **Leftover_Budget**: The remaining cash calculated as (Bank Balance + Monthly Income - Monthly Expenses) at month end
- **Contribution_Streak**: The count of consecutive months where the user added money to the Piggy Bank
- **Emergency_Withdrawal**: A withdrawal from the Piggy Bank that requires validation of emergency status
- **Emergency_Reason**: A user-provided justification for withdrawing from the Piggy Bank
- **Emergency_Proof**: Supporting evidence (text description or image) validating an emergency withdrawal
- **Auto_Suggest_System**: The component that detects leftover budget and prompts users to save
- **Badge**: A digital achievement awarded for reaching savings milestones
- **Emergency_Fund_Goal**: A user-defined target amount for their emergency fund (e.g., ₹15,000)
- **Contribution_History**: A chronological record of all deposits to the Piggy Bank
- **Dashboard**: The main user interface displaying financial overview and controls
- **Month_End**: The last 3 days of any calendar month (days 28-31)

## Requirements

### Requirement 1: Piggy Bank Account Management

**User Story:** As a young adult, I want a separate emergency fund account, so that I can keep emergency savings protected from regular spending.

#### Acceptance Criteria

1. THE System SHALL create a Piggy_Bank account with zero balance for each new user
2. THE System SHALL store the Emergency_Fund_Balance separately from the user's bank_balance field
3. THE System SHALL display the Emergency_Fund_Balance on the Dashboard alongside available spending cash
4. THE System SHALL prevent negative Emergency_Fund_Balance values
5. WHEN a user views their Dashboard, THE System SHALL display both Emergency_Fund_Balance and available spending cash in the Cash Overview section

### Requirement 2: Leftover Budget Detection

**User Story:** As a user, I want the system to detect when I have leftover money at month end, so that I can easily save without manual calculation.

#### Acceptance Criteria

1. WHILE the current date is within Month_End, THE Auto_Suggest_System SHALL calculate Leftover_Budget daily
2. THE Auto_Suggest_System SHALL calculate Leftover_Budget as (bank_balance + monthly_income - monthly_expenses)
3. WHEN Leftover_Budget exceeds ₹100, THE Auto_Suggest_System SHALL generate a save suggestion notification
4. THE Auto_Suggest_System SHALL display the exact Leftover_Budget amount in the suggestion notification
5. WHEN Leftover_Budget is ₹100 or less, THE Auto_Suggest_System SHALL NOT generate a save suggestion

### Requirement 3: Auto-Suggest Notifications

**User Story:** As a user, I want to receive prompts to save leftover money, so that I build emergency savings without forgetting.

#### Acceptance Criteria

1. WHEN the Auto_Suggest_System generates a save suggestion, THE System SHALL display a notification with the message "Add ₹X to Piggy Bank?"
2. THE System SHALL provide "Add to Piggy Bank" and "Skip" action buttons in the notification
3. WHEN the user clicks "Add to Piggy Bank", THE System SHALL transfer the suggested amount from bank_balance to Emergency_Fund_Balance
4. WHEN the user clicks "Skip", THE System SHALL dismiss the notification without transferring funds
5. THE System SHALL display at most one auto-suggest notification per day during Month_End

### Requirement 4: Manual Contributions

**User Story:** As a user, I want to manually add money to my piggy bank anytime, so that I can save whenever I have extra funds.

#### Acceptance Criteria

1. THE Dashboard SHALL display an "Add to Piggy Bank" button in the Piggy Bank section
2. WHEN the user clicks "Add to Piggy Bank", THE System SHALL display an input form requesting the contribution amount
3. THE System SHALL validate that the contribution amount does not exceed the user's current bank_balance
4. WHEN the user submits a valid contribution amount, THE System SHALL transfer the amount from bank_balance to Emergency_Fund_Balance
5. WHEN the user submits an invalid contribution amount, THE System SHALL display an error message "Insufficient funds in spending account"
6. WHEN a contribution is successful, THE System SHALL record the transaction in Contribution_History with timestamp and amount

### Requirement 5: Emergency Withdrawal Validation

**User Story:** As a user, I want withdrawals to require emergency validation, so that I don't misuse my emergency fund for non-emergencies.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Withdraw for Emergency" button in the Piggy Bank section
2. WHEN the user clicks "Withdraw for Emergency", THE System SHALL display a withdrawal form requesting amount, Emergency_Reason, and Emergency_Proof
3. THE System SHALL validate that the withdrawal amount does not exceed Emergency_Fund_Balance
4. THE System SHALL require Emergency_Reason to be selected from predefined categories: "Medical Emergency", "Job Loss", "Vehicle Repair", "Home Repair", "Family Emergency"
5. THE System SHALL require Emergency_Proof as a text description with minimum 20 characters
6. WHEN the user submits a valid emergency withdrawal, THE System SHALL transfer the amount from Emergency_Fund_Balance to bank_balance
7. WHEN the user submits an invalid emergency withdrawal, THE System SHALL display an appropriate error message
8. WHEN an emergency withdrawal is successful, THE System SHALL record the transaction with timestamp, amount, Emergency_Reason, and Emergency_Proof

### Requirement 6: Non-Emergency Blocking

**User Story:** As a user, I want the system to block non-emergency withdrawals, so that I maintain discipline with my emergency fund.

#### Acceptance Criteria

1. THE System SHALL NOT include "Shopping", "Vacation", "Entertainment", or "Dining Out" in the Emergency_Reason category list
2. WHEN Emergency_Proof contains keywords indicating non-emergency use (e.g., "shopping", "vacation", "party", "concert"), THE System SHALL display a warning message "This doesn't sound like an emergency. Emergency funds are for unexpected urgent situations only."
3. THE System SHALL allow the user to proceed with withdrawal after displaying the warning
4. THE System SHALL log all withdrawal attempts with their Emergency_Reason and Emergency_Proof for user review

### Requirement 7: Contribution History Display

**User Story:** As a user, I want to see my contribution history, so that I can track my saving progress over time.

#### Acceptance Criteria

1. THE Dashboard SHALL display the last 4 months of Contribution_History in the Piggy Bank section
2. WHEN displaying Contribution_History, THE System SHALL show month name, contribution amount, and contribution date for each entry
3. WHEN a month has multiple contributions, THE System SHALL display the total monthly contribution amount
4. WHEN a month has zero contributions, THE System SHALL display "₹0" for that month
5. THE System SHALL display Contribution_History in reverse chronological order (most recent first)

### Requirement 8: Contribution Streak Tracking

**User Story:** As a user, I want to track my contribution streak, so that I stay motivated to save consistently.

#### Acceptance Criteria

1. THE System SHALL calculate Contribution_Streak as the count of consecutive months with at least one contribution
2. WHEN a user makes their first contribution in a new month, THE System SHALL increment Contribution_Streak by 1
3. WHEN a month ends with zero contributions, THE System SHALL reset Contribution_Streak to 0
4. THE Dashboard SHALL display the current Contribution_Streak value with a fire emoji (🔥) indicator
5. WHEN Contribution_Streak reaches 3 or more months, THE System SHALL display a special highlight color (gold) for the streak indicator

### Requirement 9: Emergency Fund Goal Progress

**User Story:** As a user, I want to set and track an emergency fund goal, so that I have a clear savings target.

#### Acceptance Criteria

1. THE System SHALL allow users to set an Emergency_Fund_Goal amount between ₹1,000 and ₹100,000
2. THE System SHALL default Emergency_Fund_Goal to ₹15,000 for new users
3. THE Dashboard SHALL display a progress bar showing (Emergency_Fund_Balance / Emergency_Fund_Goal) × 100 as percentage
4. WHEN Emergency_Fund_Balance reaches or exceeds Emergency_Fund_Goal, THE System SHALL display a completion message "🎉 Goal Reached! Consider setting a new target."
5. THE Dashboard SHALL display both current Emergency_Fund_Balance and Emergency_Fund_Goal amounts above the progress bar

### Requirement 10: Badge System

**User Story:** As a user, I want to earn badges for savings achievements, so that I feel rewarded for my financial discipline.

#### Acceptance Criteria

1. WHEN Contribution_Streak reaches 3 consecutive months, THE System SHALL award the "Emergency Master 🏆" Badge
2. WHEN Emergency_Fund_Balance reaches ₹10,000, THE System SHALL award the "Financial Fortress 🏰" Badge
3. WHEN Emergency_Fund_Balance reaches Emergency_Fund_Goal, THE System SHALL award the "Goal Crusher 💪" Badge
4. WHEN a user has never made an emergency withdrawal, THE System SHALL display the "Untouched Fund 🛡️" status indicator
5. THE Dashboard SHALL display all earned badges in the Piggy Bank section
6. WHEN a new badge is earned, THE System SHALL display a celebration notification with the badge name and icon

### Requirement 11: Motivational Messages

**User Story:** As a user, I want to see motivational messages, so that I stay encouraged to maintain my emergency fund.

#### Acceptance Criteria

1. WHEN a user completes a contribution, THE System SHALL display a random motivational message from a predefined list
2. THE System SHALL include at least 10 different motivational messages such as "Great job! Your future self will thank you! 💪", "Building wealth one rupee at a time! 🐷", "Emergency fund growing strong! 🌱"
3. WHEN Contribution_Streak reaches a multiple of 3, THE System SHALL display a special streak celebration message
4. WHEN Emergency_Fund_Balance increases by ₹1,000 or more in a single month, THE System SHALL display a milestone achievement message
5. THE System SHALL display motivational messages for 5 seconds before auto-dismissing

### Requirement 12: Dashboard Integration

**User Story:** As a user, I want piggy bank information integrated into my dashboard, so that I can view everything in one place.

#### Acceptance Criteria

1. THE Dashboard SHALL display a dedicated "Piggy Bank Emergency Fund 🐷" card in the Overview tab
2. THE Piggy_Bank card SHALL display Emergency_Fund_Balance, Contribution_Streak, current month contribution, and Emergency_Fund_Goal progress
3. THE Cash Overview section SHALL display both "Available to Spend" and "Emergency Fund" balances side by side
4. THE Piggy_Bank card SHALL include quick action buttons for "Add Money" and "Emergency Withdraw"
5. THE Dashboard SHALL position the Piggy_Bank card above the transaction history section

### Requirement 13: Shareable Achievements

**User Story:** As a user, I want to share my savings achievements, so that I can inspire friends and celebrate milestones.

#### Acceptance Criteria

1. WHEN a user earns a new Badge, THE System SHALL display a "Share Achievement" button in the celebration notification
2. WHEN the user clicks "Share Achievement", THE System SHALL generate a shareable image containing the badge icon, badge name, and user's first name
3. THE System SHALL provide options to share via social media platforms or download the achievement image
4. THE shareable image SHALL NOT include sensitive financial information such as exact Emergency_Fund_Balance amounts
5. THE shareable image SHALL include the app branding and a motivational tagline

### Requirement 14: Transaction History Integration

**User Story:** As a user, I want piggy bank transactions to appear in my transaction history, so that I have a complete financial record.

#### Acceptance Criteria

1. WHEN a contribution to Piggy_Bank occurs, THE System SHALL create a transaction record with type "transfer" and category "emergency_fund_deposit"
2. WHEN an emergency withdrawal occurs, THE System SHALL create a transaction record with type "transfer" and category "emergency_fund_withdrawal"
3. THE transaction record SHALL include the Emergency_Reason for withdrawals
4. THE Dashboard transaction history SHALL display piggy bank transactions with a distinctive piggy bank icon (🐷)
5. THE System SHALL allow users to filter transaction history to show only piggy bank transactions

### Requirement 15: Data Persistence and Integrity

**User Story:** As a user, I want my emergency fund data to be safely stored, so that I never lose my savings information.

#### Acceptance Criteria

1. THE System SHALL store Emergency_Fund_Balance in the User database model as a separate field
2. THE System SHALL store Contribution_History as an array of objects containing date, amount, and type fields
3. THE System SHALL store earned badges as an array in the User model
4. WHEN any piggy bank transaction occurs, THE System SHALL update the database within 2 seconds
5. THE System SHALL validate data integrity by ensuring Emergency_Fund_Balance equals the sum of all contributions minus all withdrawals
6. WHEN a database write fails, THE System SHALL rollback the transaction and display an error message to the user
