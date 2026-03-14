const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Prediction = require('./models/Prediction');
const Article = require('./models/Article');
const Tip = require('./models/Tip');
const Module = require('./models/Module');
const BudgetTemplate = require('./models/BudgetTemplate');

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://justcode790:Ankit790@cluster0forproject1.iz7lot1.mongodb.net/finance';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    console.log('Clearing existing demo data (users, transactions, predictions)...');

    const demoEmails = ['demo@student.com', 'ankit@youthfin.com', 'ria@youthfin.com'];

    await Promise.all([
      User.deleteMany({ email: { $in: demoEmails } }),
      Transaction.deleteMany({}),
      Prediction.deleteMany({}),
      Article.deleteMany({}),
      Tip.deleteMany({}),
      Module.deleteMany({}),
      BudgetTemplate.deleteMany({})
    ]);

    const now = new Date();

    console.log('Creating demo users (with ML profile fields)...');
    const [studentUser, ankitUser, riaUser] = await User.create(
      {
        name: 'Demo Student',
        email: 'demo@student.com',
        password: 'demo1234',
        age: 22,
        income: 40000,
        bank_balance: 15000,
        financial_literacy_score: 7,
        saving_habit_score: 8,
        piggyBank: {
          balance: 8450,
          goal: 15000,
          streak: {
            count: 4,
            lastContributionMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          },
          badges: [
            {
              name: 'Emergency Master',
              icon: '🏆',
              earnedAt: new Date(now.getFullYear(), now.getMonth() - 1, 15)
            }
          ],
          untouchedStatus: true,
          totalContributions: 8450,
          totalWithdrawals: 0
        }
      },
      {
        name: 'Ankit',
        email: 'ankit@youthfin.com',
        password: 'ankit1234',
        age: 23,
        income: 50000,
        bank_balance: 8000,
        financial_literacy_score: 6,
        saving_habit_score: 5
      },
      {
        name: 'Ria',
        email: 'ria@youthfin.com',
        password: 'ria1234',
        age: 21,
        income: 30000,
        bank_balance: 25000,
        financial_literacy_score: 8,
        saving_habit_score: 9
      }
    );

    const mkDate = (offsetDays) => {
      const d = new Date(now);
      d.setDate(d.getDate() - offsetDays);
      return d;
    };

    // Generate 4 months of realistic data for demo@student.com
    const generateMonthlyTransactions = (userId, monthOffset, income, expenses) => {
      const baseDate = new Date(now);
      baseDate.setMonth(baseDate.getMonth() - monthOffset);
      baseDate.setDate(1);
      
      const transactions = [];
      
      // Income on 1st of month (salary)
      transactions.push({
        userId,
        type: 'income',
        category: 'salary',
        amount: income,
        date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 1),
        description: 'Monthly Salary'
      });
      
      // Expenses throughout the month
      Object.entries(expenses).forEach(([category, amount]) => {
        const dayOfMonth = Math.floor(Math.random() * 28) + 1;
        transactions.push({
          userId,
          type: 'expense',
          category,
          amount,
          date: new Date(baseDate.getFullYear(), baseDate.getMonth(), dayOfMonth),
          description: ''
        });
      });
      
      return transactions;
    };

    const sampleTransactions = [
      // Demo Student - 4 months of data
      // Month -3 (3 months ago)
      ...generateMonthlyTransactions(studentUser._id, 3, 40000, {
        rent: 8000,
        food: 6000,
        transport: 2500,
        entertainment: 3500,
        shopping: 2500,
        education: 1200,
        misc: 1800
      }),
      
      // Month -2 (2 months ago)
      ...generateMonthlyTransactions(studentUser._id, 2, 40000, {
        rent: 8000,
        food: 5500,
        transport: 2200,
        entertainment: 4000,
        shopping: 3000,
        education: 1500,
        misc: 1500
      }),
      
      // Month -1 (last month)
      ...generateMonthlyTransactions(studentUser._id, 1, 40000, {
        rent: 8000,
        food: 5800,
        transport: 2300,
        entertainment: 3200,
        shopping: 2200,
        education: 1000,
        misc: 1700
      }),
      
      // Current month (partial data - mid-month)
      { userId: studentUser._id, type: 'income', category: 'salary', amount: 40000, date: mkDate(13), description: 'Monthly Salary' },
      { userId: studentUser._id, type: 'expense', category: 'rent', amount: 8000, date: mkDate(11) },
      { userId: studentUser._id, type: 'expense', category: 'food', amount: 2500, date: mkDate(9) },
      { userId: studentUser._id, type: 'expense', category: 'food', amount: 1800, date: mkDate(5) },
      { userId: studentUser._id, type: 'expense', category: 'transport', amount: 800, date: mkDate(8) },
      { userId: studentUser._id, type: 'expense', category: 'entertainment', amount: 1500, date: mkDate(6) },
      { userId: studentUser._id, type: 'expense', category: 'shopping', amount: 1200, date: mkDate(3) },
      { userId: studentUser._id, type: 'expense', category: 'misc', amount: 600, date: mkDate(2) },

      // Ankit - current month only
      { userId: ankitUser._id, type: 'expense', category: 'rent', amount: 14000, date: mkDate(12) },
      { userId: ankitUser._id, type: 'expense', category: 'food', amount: 8000, date: mkDate(4) },
      { userId: ankitUser._id, type: 'expense', category: 'transport', amount: 3500, date: mkDate(6) },
      { userId: ankitUser._id, type: 'expense', category: 'entertainment', amount: 9000, date: mkDate(8) },
      { userId: ankitUser._id, type: 'expense', category: 'shopping', amount: 7000, date: mkDate(10) },
      { userId: ankitUser._id, type: 'expense', category: 'education', amount: 1500, date: mkDate(14) },
      { userId: ankitUser._id, type: 'expense', category: 'misc', amount: 2000, date: mkDate(1) },

      // Ria - current month only
      { userId: riaUser._id, type: 'expense', category: 'rent', amount: 9000, date: mkDate(10) },
      { userId: riaUser._id, type: 'expense', category: 'food', amount: 4500, date: mkDate(3) },
      { userId: riaUser._id, type: 'expense', category: 'transport', amount: 1500, date: mkDate(5) },
      { userId: riaUser._id, type: 'expense', category: 'entertainment', amount: 1200, date: mkDate(9) },
      { userId: riaUser._id, type: 'expense', category: 'shopping', amount: 900, date: mkDate(7) },
      { userId: riaUser._id, type: 'expense', category: 'education', amount: 2000, date: mkDate(13) },
      { userId: riaUser._id, type: 'expense', category: 'misc', amount: 800, date: mkDate(2) }
    ];

    console.log('Inserting sample transactions for demo users...');
    const createdTransactions = await Transaction.insertMany(sampleTransactions);

    // Seed educational content
    console.log('Creating educational articles...');
    const articles = await Article.insertMany([
      {
        title: 'Budgeting Basics for Young Adults',
        content: 'Learn the fundamentals of creating and sticking to a budget. Start by tracking your income and expenses, then allocate your money using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.',
        category: 'budgeting',
        difficulty: 'beginner',
        tags: ['budget', '50-30-20', 'basics'],
        readingTimeMinutes: 5,
        author: 'SmartVault Team'
      },
      {
        title: 'The Power of Compound Interest',
        content: 'Discover how compound interest can help you build wealth over time. When you invest money, you earn returns not just on your initial investment, but also on the returns themselves. Starting early is key!',
        category: 'saving',
        difficulty: 'beginner',
        tags: ['compound interest', 'investing', 'wealth building'],
        readingTimeMinutes: 7,
        author: 'SmartVault Team'
      },
      {
        title: 'Understanding Credit Cards and Debt',
        content: 'Credit cards can be useful tools, but they can also lead to debt if not managed properly. Learn about interest rates, minimum payments, and strategies to pay off credit card debt efficiently.',
        category: 'debt',
        difficulty: 'intermediate',
        tags: ['credit cards', 'debt management', 'interest rates'],
        readingTimeMinutes: 10,
        author: 'SmartVault Team'
      },
      {
        title: 'Building an Emergency Fund',
        content: 'An emergency fund is money set aside for unexpected expenses like medical bills or car repairs. Aim to save 3-6 months of living expenses in a separate, easily accessible account.',
        category: 'saving',
        difficulty: 'beginner',
        tags: ['emergency fund', 'savings', 'financial security'],
        readingTimeMinutes: 6,
        author: 'SmartVault Team'
      },
      {
        title: 'Introduction to Stock Market Investing',
        content: 'The stock market allows you to buy shares of companies and potentially grow your wealth. Learn about stocks, mutual funds, ETFs, and how to start investing with small amounts.',
        category: 'investing',
        difficulty: 'intermediate',
        tags: ['stocks', 'investing', 'mutual funds', 'ETFs'],
        readingTimeMinutes: 12,
        author: 'SmartVault Team'
      },
      {
        title: 'Side Hustles to Boost Your Income',
        content: 'Explore various ways to earn extra money outside your main job. From freelancing to online tutoring, discover side hustles that match your skills and schedule.',
        category: 'income',
        difficulty: 'beginner',
        tags: ['side hustle', 'extra income', 'freelancing'],
        readingTimeMinutes: 8,
        author: 'SmartVault Team'
      },
      {
        title: 'Setting Financial Goals That Work',
        content: 'Learn how to set SMART financial goals: Specific, Measurable, Achievable, Relevant, and Time-bound. Break down big goals into smaller milestones to stay motivated.',
        category: 'planning',
        difficulty: 'beginner',
        tags: ['goals', 'SMART goals', 'financial planning'],
        readingTimeMinutes: 7,
        author: 'SmartVault Team'
      },
      {
        title: 'Advanced Budgeting Techniques',
        content: 'Take your budgeting to the next level with zero-based budgeting, envelope method, and automated savings. Learn how to optimize every rupee and maximize your savings potential.',
        category: 'budgeting',
        difficulty: 'advanced',
        tags: ['zero-based budget', 'envelope method', 'automation'],
        readingTimeMinutes: 15,
        author: 'SmartVault Team'
      },
      {
        title: 'Tax Planning for Young Professionals',
        content: 'Understand tax deductions, exemptions, and investment options that can help you save on taxes. Learn about Section 80C, 80D, and other tax-saving instruments available in India.',
        category: 'planning',
        difficulty: 'intermediate',
        tags: ['taxes', 'tax planning', '80C', 'deductions'],
        readingTimeMinutes: 11,
        author: 'SmartVault Team'
      },
      {
        title: 'Retirement Planning in Your 20s',
        content: 'It\'s never too early to start planning for retirement. Learn about retirement accounts, the power of starting early, and how to calculate how much you need to save for a comfortable retirement.',
        category: 'planning',
        difficulty: 'advanced',
        tags: ['retirement', 'long-term planning', 'pension'],
        readingTimeMinutes: 13,
        author: 'SmartVault Team'
      }
    ]);

    console.log('Creating financial tips...');
    const tips = await Tip.insertMany([
      { content: 'Track every expense for a month to understand your spending patterns.', category: 'budgeting', context: 'general', tags: ['tracking', 'awareness'], priority: 8 },
      { content: 'Set up automatic transfers to your savings account on payday.', category: 'saving', context: 'general', tags: ['automation', 'savings'], priority: 9 },
      { content: 'Before making a purchase, wait 24 hours to avoid impulse buying.', category: 'budgeting', context: 'transaction', tags: ['impulse control', 'shopping'], priority: 7 },
      { content: 'Cook meals at home instead of eating out to save money on food.', category: 'budgeting', context: 'transaction', tags: ['food', 'cooking'], priority: 6 },
      { content: 'Review your subscriptions monthly and cancel ones you don\'t use.', category: 'budgeting', context: 'general', tags: ['subscriptions', 'recurring'], priority: 7 },
      { content: 'You\'ve exceeded your budget! Try to identify non-essential expenses you can cut.', category: 'budgeting', context: 'budget_exceeded', tags: ['overspending', 'adjustment'], priority: 10 },
      { content: 'Consider using public transport or carpooling to reduce transportation costs.', category: 'budgeting', context: 'budget_exceeded', tags: ['transport', 'savings'], priority: 6 },
      { content: 'Congratulations on reaching your goal! Consider investing your savings for growth.', category: 'investing', context: 'goal_achieved', tags: ['investing', 'growth'], priority: 8 },
      { content: 'Set a new savings goal to keep your momentum going!', category: 'saving', context: 'goal_achieved', tags: ['goals', 'motivation'], priority: 7 },
      { content: 'Pay yourself first - save before you spend.', category: 'saving', context: 'general', tags: ['savings', 'priority'], priority: 9 },
      { content: 'Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings.', category: 'budgeting', context: 'general', tags: ['50-30-20', 'allocation'], priority: 8 },
      { content: 'Build an emergency fund with 3-6 months of expenses.', category: 'saving', context: 'general', tags: ['emergency fund', 'security'], priority: 10 },
      { content: 'Avoid carrying credit card debt - pay in full each month.', category: 'debt', context: 'general', tags: ['credit cards', 'debt'], priority: 9 },
      { content: 'Compare prices before making big purchases.', category: 'budgeting', context: 'transaction', tags: ['comparison', 'shopping'], priority: 6 },
      { content: 'Look for free entertainment options like parks, libraries, and community events.', category: 'budgeting', context: 'budget_exceeded', tags: ['entertainment', 'free'], priority: 5 },
      { content: 'Negotiate bills like internet and phone plans to save money.', category: 'budgeting', context: 'general', tags: ['negotiation', 'bills'], priority: 7 },
      { content: 'Start investing early to benefit from compound interest.', category: 'investing', context: 'general', tags: ['compound interest', 'early start'], priority: 8 },
      { content: 'Diversify your investments to reduce risk.', category: 'investing', context: 'general', tags: ['diversification', 'risk'], priority: 7 },
      { content: 'Learn a new skill to increase your earning potential.', category: 'income', context: 'general', tags: ['skills', 'career'], priority: 6 },
      { content: 'Review and adjust your budget quarterly to stay on track.', category: 'budgeting', context: 'general', tags: ['review', 'adjustment'], priority: 7 }
    ]);

    console.log('Creating learning modules...');
    const modules = await Module.insertMany([
      {
        title: 'Budgeting Fundamentals',
        description: 'Master the basics of personal budgeting and take control of your finances.',
        difficulty: 'beginner',
        category: 'budgeting',
        estimatedHours: 2,
        lessons: [
          {
            lessonId: 'budget-101-1',
            title: 'What is a Budget?',
            content: 'A budget is a plan for how you will spend your money. It helps you track income and expenses, ensuring you don\'t spend more than you earn.',
            order: 1,
            quiz: {
              questions: [
                {
                  question: 'What is the primary purpose of a budget?',
                  options: ['To restrict spending', 'To plan and track money', 'To increase income', 'To avoid taxes'],
                  correctAnswer: 1
                }
              ]
            }
          },
          {
            lessonId: 'budget-101-2',
            title: 'The 50/30/20 Rule',
            content: 'This simple budgeting method allocates 50% of income to needs, 30% to wants, and 20% to savings and debt repayment.',
            order: 2,
            quiz: {
              questions: [
                {
                  question: 'In the 50/30/20 rule, what percentage goes to savings?',
                  options: ['50%', '30%', '20%', '10%'],
                  correctAnswer: 2
                }
              ]
            }
          },
          {
            lessonId: 'budget-101-3',
            title: 'Tracking Your Expenses',
            content: 'Learn how to track every expense using apps, spreadsheets, or notebooks. Consistent tracking reveals spending patterns.',
            order: 3
          }
        ]
      },
      {
        title: 'Smart Saving Strategies',
        description: 'Learn proven techniques to build your savings and achieve financial security.',
        difficulty: 'intermediate',
        category: 'saving',
        estimatedHours: 3,
        lessons: [
          {
            lessonId: 'saving-201-1',
            title: 'Building an Emergency Fund',
            content: 'An emergency fund covers unexpected expenses. Aim for 3-6 months of living expenses in a liquid, accessible account.',
            order: 1,
            quiz: {
              questions: [
                {
                  question: 'How many months of expenses should an emergency fund cover?',
                  options: ['1-2 months', '3-6 months', '12 months', '24 months'],
                  correctAnswer: 1
                }
              ]
            }
          },
          {
            lessonId: 'saving-201-2',
            title: 'Automating Your Savings',
            content: 'Set up automatic transfers from checking to savings on payday. This "pay yourself first" approach ensures consistent saving.',
            order: 2
          },
          {
            lessonId: 'saving-201-3',
            title: 'High-Yield Savings Accounts',
            content: 'Not all savings accounts are equal. Learn about high-yield accounts that offer better interest rates to grow your money faster.',
            order: 3,
            quiz: {
              questions: [
                {
                  question: 'What is the main benefit of a high-yield savings account?',
                  options: ['Lower fees', 'Higher interest rates', 'More ATMs', 'Better customer service'],
                  correctAnswer: 1
                }
              ]
            }
          }
        ]
      },
      {
        title: 'Investment Basics',
        description: 'Understand the fundamentals of investing and start building wealth for the future.',
        difficulty: 'advanced',
        category: 'investing',
        estimatedHours: 4,
        lessons: [
          {
            lessonId: 'invest-301-1',
            title: 'Understanding Risk and Return',
            content: 'All investments carry risk. Generally, higher potential returns come with higher risk. Learn to balance risk based on your goals and timeline.',
            order: 1
          },
          {
            lessonId: 'invest-301-2',
            title: 'Stocks, Bonds, and Mutual Funds',
            content: 'Explore different investment vehicles: stocks (ownership in companies), bonds (loans to entities), and mutual funds (pooled investments).',
            order: 2,
            quiz: {
              questions: [
                {
                  question: 'What does buying a stock represent?',
                  options: ['Lending money', 'Ownership in a company', 'Government bond', 'Insurance policy'],
                  correctAnswer: 1
                }
              ]
            }
          },
          {
            lessonId: 'invest-301-3',
            title: 'Diversification Strategy',
            content: 'Don\'t put all eggs in one basket. Diversification spreads risk across different investments, sectors, and asset classes.',
            order: 3
          },
          {
            lessonId: 'invest-301-4',
            title: 'Starting Your Investment Journey',
            content: 'Learn how to open a brokerage account, start with small amounts, and build a diversified portfolio over time.',
            order: 4,
            quiz: {
              questions: [
                {
                  question: 'What is diversification?',
                  options: ['Buying one stock', 'Spreading investments across different assets', 'Saving in cash', 'Avoiding all risk'],
                  correctAnswer: 1
                }
              ]
            }
          }
        ]
      }
    ]);

    console.log('Creating budget templates...');
    const templates = await BudgetTemplate.insertMany([
      {
        name: 'Student Budget',
        description: 'Ideal for college students or young adults with limited income. Focuses on essentials while allowing some flexibility for social activities.',
        targetUser: 'student',
        categoryPercentages: {
          rent: 30,
          food: 20,
          transport: 10,
          entertainment: 10,
          shopping: 5,
          education: 5,
          misc: 5,
          savings: 20
        }
      },
      {
        name: 'Entry-Level Professional',
        description: 'Designed for young professionals starting their careers. Balances living expenses with savings and allows for lifestyle upgrades.',
        targetUser: 'entry-level',
        categoryPercentages: {
          rent: 35,
          food: 15,
          transport: 10,
          entertainment: 10,
          shopping: 10,
          education: 5,
          misc: 5,
          savings: 20
        }
      },
      {
        name: 'Freelancer Budget',
        description: 'Tailored for freelancers and gig workers with variable income. Emphasizes higher savings for income fluctuations and business expenses.',
        targetUser: 'freelancer',
        categoryPercentages: {
          rent: 30,
          food: 15,
          transport: 8,
          entertainment: 8,
          shopping: 7,
          education: 7,
          misc: 5,
          savings: 25
        }
      }
    ]);

    console.log('Seeding complete.\n');
    console.log('You can log in with these demo accounts:');
    console.log('- Demo Student: email=demo@student.com, password=demo1234');
    console.log('- Ankit:        email=ankit@youthfin.com, password=ankit1234');
    console.log('- Ria:          email=ria@youthfin.com, password=ria1234\n');
    console.log('Total transactions created:', createdTransactions.length);
    console.log('Total articles created:', articles.length);
    console.log('Total tips created:', tips.length);
    console.log('Total modules created:', modules.length);
    console.log('Total budget templates created:', templates.length);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
