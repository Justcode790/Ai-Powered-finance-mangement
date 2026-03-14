# Design Document: Piggy Bank Emergency Fund

## Overview

The Piggy Bank Emergency Fund feature provides young adults with a dedicated emergency savings mechanism integrated into their financial dashboard. The system separates emergency funds from regular spending money, gamifies consistent saving behavior through streaks and badges, and enforces discipline through emergency validation on withdrawals.

### Key Design Goals

1. **Separation of Concerns**: Emergency funds are stored separately from spending cash to prevent accidental depletion
2. **Behavioral Nudging**: Auto-suggest system detects leftover budget and prompts users to save during month-end
3. **Gamification**: Streaks, badges, and motivational messages encourage consistent saving habits
4. **Withdrawal Discipline**: Emergency validation prevents misuse of emergency funds for non-urgent expenses
5. **Seamless Integration**: Piggy bank functionality integrates naturally into existing Dashboard and CashPosition components

### Target Users

Young adults aged 18-27 who are building financial literacy and establishing emergency fund habits for the first time.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Dashboard.jsx                                               │
│  ├─ CashPosition.jsx (modified)                             │
│  ├─ PiggyBankCard.jsx (new)                                 │
│  │   ├─ ContributionModal.jsx (new)                         │
│  │   ├─ WithdrawalModal.jsx (new)                           │
│  │   └─ BadgeDisplay.jsx (new)                              │
│  └─ SmartAlerts.jsx (modified)                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
├─────────────────────────────────────────────────────────────┤
│  Routes                                                      │
│  ├─ /api/piggybank/contribute (POST)                        │
│  ├─ /api/piggybank/withdraw (POST)                          │
│  ├─ /api/piggybank/balance (GET)                            │
│  ├─ /api/piggybank/history (GET)                            │
│  ├─ /api/piggybank/goal (PUT)                               │
│  └─ /api/piggybank/auto-suggest (GET)                       │
│                                                              │
│  Controllers                                                 │
│  └─ piggyBankController.js (new)                            │
│                                                              │
│  Services                                                    │
│  ├─ autoSuggestService.js (new)                             │
│  ├─ badgeService.js (new)                                   │
│  └─ streakService.js (new)                                  │
│                                                              │
│  Scheduled Jobs                                              │
│  └─ monthEndSuggestJob.js (new)                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Mongoose ODM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Database                        │
├─────────────────────────────────────────────────────────────┤
│  Collections:                                                │
│  ├─ users (modified)                                         │
│  ├─ piggybankTransactions (new)                             │
│  └─ notifications (modified)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Contribution Flow
```
User clicks "Add to Piggy Bank"
  → ContributionModal validates amount against bank_balance
  → POST /api/piggybank/contribute
  → Controller validates and creates PiggyBankTransaction
  → Updates User.piggyBank.balance and User.bank_balance
  → Checks and updates contribution streak
  → Checks and awards badges
  → Returns success with motivational message
  → Frontend updates UI and displays message
```

#### Auto-Suggest Flow
```
Scheduled Job runs daily during month-end (days 28-31)
  → autoSuggestService calculates leftover budget per user
  → If leftover > ₹100, creates notification
  → User sees notification in SmartAlerts
  → User clicks "Add to Piggy Bank"
  → Triggers contribution flow with suggested amount
```

#### Withdrawal Flow
```
User clicks "Emergency Withdraw"
  → WithdrawalModal requests amount, reason, proof
  → Frontend validates proof length (min 20 chars)
  → POST /api/piggybank/withdraw
  → Controller validates amount against piggyBank.balance
  → Checks proof for non-emergency keywords
  → If suspicious, displays warning but allows proceed
  → Creates PiggyBankTransaction with emergency details
  → Updates User.piggyBank.balance and User.bank_balance
  → Resets "Untouched Fund" status if applicable
  → Returns success
  → Frontend updates UI
```

## Components and Interfaces

### Frontend Components

#### PiggyBankCard.jsx (New)

Main component displaying piggy bank information and controls.

**Props**: None (uses AuthContext for user data)

**State**:
- `showContributionModal`: boolean
- `showWithdrawalModal`: boolean
- `piggyBankData`: object containing balance, streak, goal, badges

**Key Methods**:
- `loadPiggyBankData()`: Fetches current piggy bank state from API
- `handleContribute(amount)`: Processes manual contribution
- `handleWithdraw(amount, reason, proof)`: Processes emergency withdrawal
- `handleAutoSuggest()`: Processes auto-suggested contribution

**UI Elements**:
- Emergency fund balance display (large, prominent)
- Goal progress bar with percentage
- Contribution streak indicator with fire emoji
- Badge display section
- "Add Money" and "Emergency Withdraw" buttons
- Last 4 months contribution history

#### ContributionModal.jsx (New)

Modal for manual contributions to piggy bank.

**Props**:
- `isOpen`: boolean
- `onClose`: function
- `onSubmit`: function(amount)
- `maxAmount`: number (current bank_balance)

**Validation**:
- Amount must be positive number
- Amount must not exceed maxAmount
- Amount must be at least ₹1

**UI Elements**:
- Amount input field
- Available balance display
- Submit and Cancel buttons
- Error message display

#### WithdrawalModal.jsx (New)

Modal for emergency withdrawals with validation.

**Props**:
- `isOpen`: boolean
- `onClose`: function
- `onSubmit`: function(amount, reason, proof)
- `maxAmount`: number (current piggyBank.balance)

**Validation**:
- Amount must be positive number
- Amount must not exceed maxAmount
- Reason must be selected from dropdown
- Proof must be minimum 20 characters

**UI Elements**:
- Amount input field
- Emergency reason dropdown (Medical, Job Loss, Vehicle Repair, Home Repair, Family Emergency)
- Proof text area (min 20 chars)
- Warning message if non-emergency keywords detected
- Submit and Cancel buttons
- Error message display

#### BadgeDisplay.jsx (New)

Component displaying earned badges.

**Props**:
- `badges`: array of badge objects
- `untouchedStatus`: boolean

**Badge Types**:
- Emergency Master 🏆 (3-month streak)
- Financial Fortress 🏰 (₹10,000 balance)
- Goal Crusher 💪 (reached goal)
- Untouched Fund 🛡️ (never withdrawn)

**UI Elements**:
- Grid of badge cards
- Badge icon, name, and earned date
- Locked badge placeholders for unearned badges

#### Modified: CashPosition.jsx

Add piggy bank balance display alongside available cash.

**Changes**:
- Display "Emergency Fund: ₹X" below available cash
- Add visual separation between spending cash and emergency fund
- Link to PiggyBankCard for details

#### Modified: SmartAlerts.jsx

Display auto-suggest notifications during month-end.

**Changes**:
- Add new alert type: "piggy_bank_suggest"
- Display suggested amount and action buttons
- Handle "Add to Piggy Bank" and "Skip" actions

### Backend API Endpoints

#### POST /api/piggybank/contribute

Create a contribution to piggy bank.

**Request Body**:
```json
{
  "amount": 500,
  "source": "manual" | "auto_suggest"
}
```

**Response**:
```json
{
  "success": true,
  "newBalance": 5500,
  "streak": 3,
  "newBadges": ["Emergency Master 🏆"],
  "motivationalMessage": "Great job! Your future self will thank you! 💪"
}
```

**Errors**:
- 400: Invalid amount or insufficient funds
- 401: Unauthorized
- 500: Server error

#### POST /api/piggybank/withdraw

Process emergency withdrawal from piggy bank.

**Request Body**:
```json
{
  "amount": 2000,
  "reason": "Medical Emergency",
  "proof": "Unexpected hospital visit for severe infection requiring immediate treatment"
}
```

**Response**:
```json
{
  "success": true,
  "newBalance": 3500,
  "warning": "This doesn't sound like an emergency..." (optional)
}
```

**Errors**:
- 400: Invalid amount, insufficient balance, or validation failure
- 401: Unauthorized
- 500: Server error

#### GET /api/piggybank/balance

Get current piggy bank state.

**Response**:
```json
{
  "balance": 5500,
  "goal": 15000,
  "streak": 3,
  "badges": [
    {
      "name": "Emergency Master",
      "icon": "🏆",
      "earnedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "untouchedStatus": true,
  "currentMonthContribution": 500
}
```

#### GET /api/piggybank/history

Get contribution and withdrawal history.

**Query Parameters**:
- `months`: number (default: 4) - number of months to retrieve

**Response**:
```json
{
  "history": [
    {
      "month": "January 2024",
      "contributions": 1500,
      "withdrawals": 0,
      "transactions": [
        {
          "date": "2024-01-15T10:30:00Z",
          "type": "contribution",
          "amount": 500,
          "source": "manual"
        }
      ]
    }
  ]
}
```

#### PUT /api/piggybank/goal

Update emergency fund goal.

**Request Body**:
```json
{
  "goal": 20000
}
```

**Response**:
```json
{
  "success": true,
  "newGoal": 20000
}
```

**Errors**:
- 400: Invalid goal amount (must be between ₹1,000 and ₹100,000)
- 401: Unauthorized
- 500: Server error

#### GET /api/piggybank/auto-suggest

Get auto-suggest recommendation for current user.

**Response**:
```json
{
  "shouldSuggest": true,
  "suggestedAmount": 1200,
  "leftoverBudget": 1200,
  "message": "You have ₹1,200 left this month. Add it to your Piggy Bank?"
}
```

## Data Models

### Modified: User Model

Add piggy bank fields to existing User schema.

```javascript
{
  // ... existing fields ...
  
  piggyBank: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    goal: {
      type: Number,
      default: 15000,
      min: 1000,
      max: 100000
    },
    streak: {
      count: {
        type: Number,
        default: 0,
        min: 0
      },
      lastContributionMonth: {
        type: String, // Format: "YYYY-MM"
        default: null
      }
    },
    badges: [{
      name: String,
      icon: String,
      earnedAt: Date
    }],
    untouchedStatus: {
      type: Boolean,
      default: true
    },
    totalContributions: {
      type: Number,
      default: 0
    },
    totalWithdrawals: {
      type: Number,
      default: 0
    }
  }
}
```

### New: PiggyBankTransaction Model

Track all piggy bank transactions.

```javascript
const piggyBankTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ['contribution', 'withdrawal']
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    source: {
      type: String,
      enum: ['manual', 'auto_suggest'],
      default: 'manual'
    },
    // For withdrawals only
    emergencyReason: {
      type: String,
      enum: ['Medical Emergency', 'Job Loss', 'Vehicle Repair', 'Home Repair', 'Family Emergency'],
      required: function() { return this.type === 'withdrawal'; }
    },
    emergencyProof: {
      type: String,
      minlength: 20,
      required: function() { return this.type === 'withdrawal'; }
    },
    warningShown: {
      type: Boolean,
      default: false
    },
    // Balance after transaction
    balanceAfter: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
piggyBankTransactionSchema.index({ userId: 1, createdAt: -1 });
piggyBankTransactionSchema.index({ userId: 1, type: 1 });
```

### Modified: Notification Model

Add piggy bank notification types.

```javascript
{
  type: {
    type: String,
    required: true,
    enum: ['budget_exceeded', 'goal_achieved', 'tip', 'general', 'piggy_bank_suggest', 'badge_earned']
  },
  // ... existing fields ...
  
  // For piggy_bank_suggest notifications
  suggestedAmount: {
    type: Number
  },
  // For badge_earned notifications
  badgeName: {
    type: String
  },
  badgeIcon: {
    type: String
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

- Properties 1.3 and 1.5 both test Dashboard rendering of balances - combined into single property
- Properties 2.3 and 2.5 are logical inverses (suggest when > 100, don't suggest when <= 100) - combined into single property
- Properties 4.4 and 5.6 both test balance transfer invariants - can be generalized into single balance conservation property
- Properties 10.1, 10.2, 10.3 test badge awarding - can be combined into single badge award property with multiple conditions
- Properties 14.1 and 14.2 both test transaction record creation - combined into single property

### Property 1: Piggy Bank Initialization

*For any* newly created user, the piggyBank.balance field should be initialized to 0 and the piggyBank.goal field should be initialized to 15000.

**Validates: Requirements 1.1, 9.2**

### Property 2: Balance Separation

*For any* user state, the piggyBank.balance and bank_balance fields should be distinct and capable of holding different values independently.

**Validates: Requirements 1.2**

### Property 3: Balance Non-Negativity Invariant

*For any* sequence of contributions and withdrawals, the piggyBank.balance should never become negative.

**Validates: Requirements 1.4**

### Property 4: Leftover Budget Calculation

*For any* user with bank_balance B, monthly_income I, and monthly_expenses E, the calculated leftover budget should equal (B + I - E).

**Validates: Requirements 2.2**

### Property 5: Auto-Suggest Threshold

*For any* user during month-end, a save suggestion notification should be generated if and only if leftover budget > ₹100.

**Validates: Requirements 2.3, 2.5**

### Property 6: Auto-Suggest Amount Accuracy

*For any* auto-suggest notification generated, the suggested amount in the notification should exactly equal the calculated leftover budget.

**Validates: Requirements 2.4**

### Property 7: Balance Conservation (Contributions)

*For any* valid contribution of amount A, the user's bank_balance should decrease by A and piggyBank.balance should increase by A, maintaining total balance invariant: (bank_balance + piggyBank.balance) remains constant.

**Validates: Requirements 3.3, 4.4**

### Property 8: Balance Conservation (Withdrawals)

*For any* valid withdrawal of amount A, the user's piggyBank.balance should decrease by A and bank_balance should increase by A, maintaining total balance invariant: (bank_balance + piggyBank.balance) remains constant.

**Validates: Requirements 5.6**

### Property 9: Contribution Validation

*For any* contribution attempt with amount A, if A > bank_balance, the contribution should be rejected with error message "Insufficient funds in spending account".

**Validates: Requirements 4.3, 4.5**

### Property 10: Withdrawal Validation

*For any* withdrawal attempt with amount A, if A > piggyBank.balance, the withdrawal should be rejected.

**Validates: Requirements 5.3**

### Property 11: Transaction Record Creation

*For any* successful contribution or withdrawal, a corresponding PiggyBankTransaction record should be created with matching amount, timestamp, and type, and for withdrawals, emergencyReason and emergencyProof fields should be populated.

**Validates: Requirements 4.6, 5.8, 14.1, 14.2, 14.3**

### Property 12: Emergency Reason Validation

*For any* withdrawal attempt, the emergencyReason must be one of: "Medical Emergency", "Job Loss", "Vehicle Repair", "Home Repair", or "Family Emergency".

**Validates: Requirements 5.4**

### Property 13: Emergency Proof Length Validation

*For any* withdrawal attempt, the emergencyProof field must have length >= 20 characters.

**Validates: Requirements 5.5**

### Property 14: Non-Emergency Keyword Warning

*For any* withdrawal where emergencyProof contains keywords ["shopping", "vacation", "party", "concert"], a warning message "This doesn't sound like an emergency. Emergency funds are for unexpected urgent situations only." should be displayed, but the withdrawal should still be allowed to proceed.

**Validates: Requirements 6.2, 6.3**

### Property 15: Withdrawal Logging

*For any* withdrawal attempt (successful or failed), a log entry should be created containing the emergencyReason and emergencyProof.

**Validates: Requirements 6.4**

### Property 16: Contribution History Aggregation

*For any* month with N contributions of amounts [A1, A2, ..., AN], the displayed monthly contribution amount should equal sum(A1 + A2 + ... + AN).

**Validates: Requirements 7.3**

### Property 17: Contribution History Ordering

*For any* contribution history list, each entry should have a date >= the next entry's date (reverse chronological order).

**Validates: Requirements 7.5**

### Property 18: Streak Calculation

*For any* user's contribution history, the streak count should equal the number of consecutive months (counting backwards from the most recent month) that contain at least one contribution.

**Validates: Requirements 8.1**

### Property 19: Streak Increment

*For any* user making their first contribution in a new month, if the previous month also had contributions, the streak should increase by 1; otherwise, the streak should be set to 1.

**Validates: Requirements 8.2**

### Property 20: Streak Reset

*For any* user who completes a month with zero contributions, the streak should be reset to 0.

**Validates: Requirements 8.3**

### Property 21: Goal Range Validation

*For any* goal update attempt with amount G, if G < 1000 or G > 100000, the update should be rejected.

**Validates: Requirements 9.1**

### Property 22: Progress Calculation

*For any* user with piggyBank.balance B and piggyBank.goal G, the displayed progress percentage should equal (B / G) × 100.

**Validates: Requirements 9.3**

### Property 23: Goal Completion Message

*For any* user where piggyBank.balance >= piggyBank.goal, the message "🎉 Goal Reached! Consider setting a new target." should be displayed.

**Validates: Requirements 9.4**

### Property 24: Badge Award Conditions

*For any* user, badges should be awarded when:
- Streak reaches 3: "Emergency Master 🏆"
- Balance reaches ₹10,000: "Financial Fortress 🏰"
- Balance reaches goal: "Goal Crusher 💪"

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 25: Untouched Status

*For any* user with zero withdrawal transactions, the untouchedStatus field should be true; after any withdrawal, it should be false.

**Validates: Requirements 10.4**

### Property 26: Badge Notification

*For any* badge award event, a notification should be created with type "badge_earned", containing the badge name and icon.

**Validates: Requirements 10.6**

### Property 27: Motivational Message Selection

*For any* successful contribution, a motivational message should be displayed, and that message should be randomly selected from the predefined list of at least 10 messages.

**Validates: Requirements 11.1**

### Property 28: Streak Celebration Message

*For any* contribution where the new streak value is a multiple of 3 (streak % 3 == 0), a special streak celebration message should be displayed.

**Validates: Requirements 11.3**

### Property 29: Monthly Milestone Message

*For any* month where total contributions >= ₹1,000, a milestone achievement message should be displayed.

**Validates: Requirements 11.4**

### Property 30: Share Image Content

*For any* generated share image, it should contain the badge icon, badge name, and user's first name, but should NOT contain exact balance amounts.

**Validates: Requirements 13.2, 13.4**

### Property 31: Share Image Branding

*For any* generated share image, it should include app branding and a motivational tagline.

**Validates: Requirements 13.5**

### Property 32: Balance Integrity Invariant

*For any* user at any point in time, piggyBank.balance should equal sum(all contribution amounts) - sum(all withdrawal amounts).

**Validates: Requirements 15.5**

## Error Handling

### Client-Side Validation

1. **Amount Validation**: All amount inputs must be positive numbers before API calls
2. **Balance Checks**: Contributions checked against bank_balance, withdrawals against piggyBank.balance
3. **Form Validation**: Emergency proof minimum 20 characters, reason must be selected
4. **User Feedback**: Clear error messages displayed inline in modals

### Server-Side Validation

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own piggy bank data
3. **Amount Validation**: Server validates amounts are positive and within available balance
4. **Transaction Atomicity**: Use MongoDB transactions to ensure balance updates are atomic
5. **Rollback on Failure**: If any step fails, rollback all changes and return error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Error Codes

- `INSUFFICIENT_FUNDS`: Contribution exceeds bank_balance
- `INSUFFICIENT_PIGGY_BANK`: Withdrawal exceeds piggyBank.balance
- `INVALID_AMOUNT`: Amount is negative, zero, or not a number
- `INVALID_GOAL`: Goal outside allowed range (₹1,000 - ₹100,000)
- `INVALID_REASON`: Emergency reason not in allowed list
- `INVALID_PROOF`: Emergency proof less than 20 characters
- `DATABASE_ERROR`: Database operation failed
- `UNAUTHORIZED`: Invalid or missing authentication token

### Edge Cases

1. **Concurrent Transactions**: Use optimistic locking or database transactions to prevent race conditions
2. **Month Boundary**: Handle contributions made at midnight during month transitions
3. **Streak Calculation**: Handle users who skip multiple months
4. **Badge Duplication**: Ensure badges are only awarded once (check if already exists)
5. **Zero Balance Withdrawal**: Prevent withdrawal when piggyBank.balance is 0
6. **Exact Goal Match**: Handle case where contribution exactly reaches goal

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and integration points
- **Property Tests**: Verify universal properties across randomized inputs

### Property-Based Testing Configuration

- **Library**: Use `fast-check` for JavaScript/TypeScript property-based testing
- **Iterations**: Minimum 100 iterations per property test
- **Tagging**: Each property test must reference its design document property

Tag format: `// Feature: piggy-bank-emergency-fund, Property {number}: {property_text}`

### Unit Test Coverage

Focus unit tests on:

1. **API Endpoint Integration**
   - POST /api/piggybank/contribute with valid/invalid amounts
   - POST /api/piggybank/withdraw with valid/invalid emergency data
   - GET /api/piggybank/balance returns correct structure
   - GET /api/piggybank/history returns last 4 months

2. **Edge Cases**
   - Contribution that exactly depletes bank_balance
   - Withdrawal that exactly depletes piggyBank.balance
   - Contribution that exactly reaches goal
   - Month boundary transitions for streak calculation
   - Multiple contributions in same month

3. **Error Conditions**
   - Contribution exceeding bank_balance
   - Withdrawal exceeding piggyBank.balance
   - Invalid emergency reason
   - Emergency proof too short
   - Goal outside valid range

4. **UI Component Rendering**
   - PiggyBankCard displays all required elements
   - ContributionModal validates input correctly
   - WithdrawalModal shows warning for non-emergency keywords
   - BadgeDisplay shows earned badges
   - Dashboard integration displays piggy bank section

5. **Service Logic**
   - autoSuggestService calculates leftover budget correctly
   - badgeService awards badges at correct thresholds
   - streakService calculates consecutive months correctly

### Property-Based Test Coverage

Each correctness property should have a corresponding property test:

1. **Property 1-3**: User initialization and balance separation
   - Generate random new users, verify initialization
   - Generate random balance operations, verify non-negativity

2. **Property 4-6**: Auto-suggest logic
   - Generate random user financial states, verify leftover calculation
   - Generate random leftover amounts, verify suggestion threshold

3. **Property 7-8**: Balance conservation
   - Generate random contribution/withdrawal sequences
   - Verify total balance (bank + piggy) remains constant

4. **Property 9-10**: Amount validation
   - Generate random amounts (valid and invalid)
   - Verify rejection of amounts exceeding available balance

5. **Property 11-15**: Transaction and withdrawal validation
   - Generate random transactions, verify records created
   - Generate random emergency reasons/proofs, verify validation

6. **Property 16-20**: History and streak logic
   - Generate random contribution histories
   - Verify aggregation, ordering, and streak calculation

7. **Property 21-23**: Goal validation and progress
   - Generate random goals and balances
   - Verify range validation and progress calculation

8. **Property 24-26**: Badge system
   - Generate random user states reaching badge thresholds
   - Verify correct badges awarded

9. **Property 27-29**: Motivational messages
   - Generate random contributions
   - Verify message selection and special conditions

10. **Property 30-32**: Sharing and integrity
    - Generate random share images, verify content
    - Generate random transaction sequences, verify balance integrity

### Test Data Generation

For property-based tests, generate:

- **User States**: Random bank_balance (0-100000), piggyBank.balance (0-50000), goal (1000-100000)
- **Amounts**: Random positive numbers within valid ranges
- **Dates**: Random dates for transaction history
- **Emergency Data**: Random reasons from valid list, random proof text (varying lengths)
- **Transaction Sequences**: Random sequences of contributions and withdrawals

### Integration Testing

1. **End-to-End Flows**
   - Complete contribution flow from button click to balance update
   - Complete withdrawal flow with emergency validation
   - Auto-suggest notification to contribution acceptance
   - Badge earning to notification display

2. **Database Integration**
   - Verify MongoDB transactions work correctly
   - Test rollback on failure scenarios
   - Verify indexes improve query performance

3. **Frontend-Backend Integration**
   - API calls return expected data structures
   - Error responses handled gracefully in UI
   - Real-time balance updates reflected in Dashboard

### Performance Testing

1. **Query Performance**: History queries should complete in < 100ms
2. **Transaction Performance**: Contribution/withdrawal should complete in < 500ms
3. **Auto-Suggest Job**: Should process all users in < 5 minutes
4. **Concurrent Users**: System should handle 100 concurrent transactions

### Manual Testing Checklist

1. Visual verification of UI components match design
2. Responsive design works on mobile/tablet/desktop
3. Motivational messages display correctly and auto-dismiss
4. Badge celebration animations work smoothly
5. Share image generation produces correct output
6. Accessibility: keyboard navigation, screen reader compatibility
