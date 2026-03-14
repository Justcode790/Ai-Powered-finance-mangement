import { extractPrice, extractItemName, calculateEMI, calculateSIP, PRICE_DATABASE } from './chatbotScenarios';
import { getPiggyBankAutoSuggest } from '../services/api';

export const processMessage = async (userMessage, userData) => {
  const msg = userMessage.toLowerCase();
  
  // ========== COMPREHENSIVE OVERVIEW ==========
  if (msg.includes('show me everything') || msg.includes('complete overview') || msg.includes('full status')) {
    const savingsGoal = userData.budget?.categoryAllocations?.savings || 0;
    const savingsActual = userData.categorySpending['savings'] || 0;
    const savingsProgress = savingsGoal > 0 ? ((savingsActual / savingsGoal) * 100).toFixed(0) : 0;
    
    const overspent = Object.entries(userData.budget?.categoryAllocations || {}).filter(([cat, budgeted]) => {
      const spent = userData.categorySpending[cat] || 0;
      return spent > budgeted && cat !== 'savings';
    });

    return `💰 **COMPLETE FINANCIAL OVERVIEW**

📊 **INCOME & EXPENSES**
Income: ₹${userData.totalIncome.toLocaleString()}
Spent: ₹${userData.totalExpenses.toLocaleString()}
Left: ₹${(userData.totalIncome - userData.totalExpenses).toLocaleString()}
Bank Balance: ₹${userData.bankBalance.toLocaleString()}

🐷 **PIGGY BANK**
Balance: ₹${userData.piggyBank.balance.toLocaleString()}
Goal: ₹${userData.piggyBank.goal.toLocaleString()} (${((userData.piggyBank.balance / userData.piggyBank.goal) * 100).toFixed(0)}%)
Streak: ${userData.piggyBank.streak} months 🔥

🎯 **SAVINGS**
Goal: ₹${savingsGoal.toLocaleString()}
Saved: ₹${savingsActual.toLocaleString()} (${savingsProgress}%)

${overspent.length > 0 ? `⚠️ **OVERSPENT**\n${overspent.map(([cat, budgeted]) => {
  const spent = userData.categorySpending[cat] || 0;
  return `${cat}: ₹${(spent - budgeted).toLocaleString()} over`;
}).join('\n')}` : '✅ All categories on track!'}`;
  }

  // ========== PIGGY BANK ==========
  if (msg.includes('piggy') || msg.includes('emergency fund')) {
    const eligibility = await getPiggyBankAutoSuggest();
    return `🐷 **Piggy Bank Status**

Balance: ₹${userData.piggyBank.balance.toLocaleString()}
Goal: ₹${userData.piggyBank.goal.toLocaleString()} (${((userData.piggyBank.balance / userData.piggyBank.goal) * 100).toFixed(0)}%)
Streak: ${userData.piggyBank.streak} months 🔥

${eligibility.shouldSuggest
  ? `✅ **Eligible Now!**\n₹${eligibility.suggestedAmount.toLocaleString()} leftover ready to add! 🥳`
  : `⏳ **Not Eligible Yet**\n${eligibility.reason === 'Savings goal not met' ? 'Hit your savings goal first! 🛡️' : 'Stay within budget to unlock Piggy Bank 📊'}`
}`;
  }

  // ========== BUDGET OVERVIEW ==========
  if (msg.includes('budget') && (msg.includes('overview') || msg.includes('status') || msg.includes('show'))) {
    if (!userData.budget) {
      return "You don't have a budget set for this month yet. Create one to get started! 📊";
    }

    const overspent = [];
    const onTrack = [];
    
    Object.entries(userData.budget.categoryAllocations).forEach(([cat, budgeted]) => {
      const spent = userData.categorySpending[cat] || 0;
      if (spent > budgeted) {
        overspent.push(`${cat}: ₹${spent.toLocaleString()}/₹${budgeted.toLocaleString()} ❌`);
      } else {
        onTrack.push(`${cat}: ₹${spent.toLocaleString()}/₹${budgeted.toLocaleString()} ✅`);
      }
    });

    return `📊 **Budget Overview**

Total Budget: ₹${userData.budget.totalBudget.toLocaleString()}
Spent: ₹${userData.totalExpenses.toLocaleString()}

${overspent.length > 0 ? `⚠️ **Overspent:**\n${overspent.join('\n')}\n\n` : ''}✅ **On Track:**\n${onTrack.join('\n')}`;
  }

  // ========== OVERSPENDING CHECK ==========
  if (msg.includes('overspend') || msg.includes('over budget')) {
    if (!userData.budget) {
      return "Create a budget first to track overspending! 📊";
    }

    const overspent = [];
    Object.entries(userData.budget.categoryAllocations).forEach(([cat, budgeted]) => {
      const spent = userData.categorySpending[cat] || 0;
      if (spent > budgeted && budgeted > 0) {
        const over = spent - budgeted;
        overspent.push(`${cat}: ₹${over.toLocaleString()} over (${((spent / budgeted) * 100).toFixed(0)}%)`);
      }
    });

    if (overspent.length === 0) {
      return "✅ **Great news!** No overspending this month. You're managing your budget perfectly! 🎉";
    }

    return `⚠️ **Overspending Alert**

${overspent.join('\n')}

💡 **Tip:** Cut back on these categories to get back on track!`;
  }

  // ========== SHOPPING & AFFORDABILITY ==========
  if (msg.includes('buy') || msg.includes('afford') || msg.includes('purchase') || msg.includes('iphone') || msg.includes('laptop') || msg.includes('phone') || msg.includes('macbook')) {
    const price = extractPrice(userMessage);
    const itemName = extractItemName(userMessage);
    
    if (!price) {
      return `I'd love to help! What's the price of the ${itemName}? 💰`;
    }

    const availableCash = userData.bankBalance + userData.income - userData.totalExpenses;
    const savingsGoal = userData.budget?.categoryAllocations?.savings || 0;
    const maxAffordable = Math.max(0, availableCash - savingsGoal);
    const budgetPercent = userData.budget?.totalBudget ? (price / userData.budget.totalBudget * 100).toFixed(0) : 0;

    if (price > maxAffordable * 1.5) {
      const emi = calculateEMI(price, 12, 12);
      const alternatives = Object.entries(PRICE_DATABASE)
        .filter(([item, p]) => p < maxAffordable && item.includes(itemName.toLowerCase().split(' ')[0]))
        .slice(0, 3);

      return `❌ **TOO EXPENSIVE** (${budgetPercent}% of budget)

${itemName}: ₹${price.toLocaleString()}
Available: ₹${maxAffordable.toLocaleString()}

💡 **OPTIONS:**
• EMI: ₹${emi.toLocaleString()}/month x 12
• Wait & Save: ${Math.ceil((price - maxAffordable) / (savingsGoal || 5000))} months
${alternatives.length > 0 ? `• Alternatives:\n${alternatives.map(([item, p]) => `  - ${item}: ₹${p.toLocaleString()} ✅`).join('\n')}` : ''}`;
    }

    if (price > maxAffordable) {
      return `⚠️ **TIGHT FIT** (${budgetPercent}% of budget)

${itemName}: ₹${price.toLocaleString()}
Available: ₹${maxAffordable.toLocaleString()}
Shortfall: ₹${(price - maxAffordable).toLocaleString()}

💡 **SUGGESTIONS:**
• Cut Entertainment ₹${Math.min(3000, price - maxAffordable).toLocaleString()}
• Use Piggy Bank: ₹${userData.piggyBank.balance.toLocaleString()}
• Wait for sale (Diwali -15%)`;
    }

    return `✅ **AFFORDABLE!** (${budgetPercent}% of budget)

${itemName}: ₹${price.toLocaleString()}
Available: ₹${maxAffordable.toLocaleString()}
Left after: ₹${(maxAffordable - price).toLocaleString()}

🎉 Go for it! You'll still save ₹${savingsGoal.toLocaleString()} this month!`;
  }

  // ========== TRAVEL & TRIPS ==========
  if (msg.includes('travel') || msg.includes('trip') || msg.includes('vacation') || msg.includes('holiday')) {
    const travelBudget = userData.budget?.categoryAllocations?.travel || 0;
    const travelSpent = userData.categorySpending['travel'] || 0;
    const travelLeft = travelBudget - travelSpent;
    const availableCash = userData.bankBalance + userData.income - userData.totalExpenses;
    const savingsGoal = userData.budget?.categoryAllocations?.savings || 0;
    const maxAffordable = Math.max(0, Math.min(travelLeft, availableCash - savingsGoal));

    if (maxAffordable < 3000) {
      return `❌ **Tight Travel Budget**

Travel Budget: ₹${travelBudget.toLocaleString()}
Already Spent: ₹${travelSpent.toLocaleString()}
Left: ₹${travelLeft.toLocaleString()}

💡 **LOCAL OPTIONS:**
• City staycation: ₹2,000
• Day trip nearby: ₹1,500
• Save for next month! 🛡️`;
    }

    const destinations = [
      { name: 'Goa weekend', price: 6800, emoji: '🏖️' },
      { name: 'Mysore heritage', price: 7200, emoji: '🏛️' },
      { name: 'Coorg homestay', price: 7900, emoji: '🏔️' },
      { name: 'Pondicherry beach', price: 5500, emoji: '🌊' },
      { name: 'Jaipur royal', price: 8500, emoji: '👑' },
      { name: 'Manali adventure', price: 8500, emoji: '⛰️' },
      { name: 'Kerala backwaters', price: 12000, emoji: '🚤' },
      { name: 'Udaipur lakes', price: 9500, emoji: '🏰' }
    ].filter(d => d.price <= maxAffordable);

    return `✅ **Travel Budget: ₹${maxAffordable.toLocaleString()}**

${destinations.slice(0, 5).map(d => `• ${d.name}: ₹${d.price.toLocaleString()} ${d.emoji}`).join('\n')}

💡 You'll still save: ₹${savingsGoal.toLocaleString()} 🥳`;
  }

  // ========== TRANSPORT COMPARISON ==========
  if (msg.includes('uber') || msg.includes('ola') || msg.includes('metro') || msg.includes('auto') || msg.includes('commute')) {
    const monthlyCommute = 22; // working days
    const uberCost = 150 * monthlyCommute * 2; // round trip
    const metroCost = 40 * monthlyCommute * 2;
    const autoCost = 80 * monthlyCommute * 2;
    const bikePetrol = 2000; // monthly

    return `🚗 **Transport Comparison (Monthly)**

Uber: ₹${uberCost.toLocaleString()} 🚕
Auto: ₹${autoCost.toLocaleString()} 🛺
Metro: ₹${metroCost.toLocaleString()} 🚇
Own Bike: ₹${bikePetrol.toLocaleString()} 🏍️

💡 **SAVINGS:**
Metro vs Uber: ₹${(uberCost - metroCost).toLocaleString()}/month
→ Add to Piggy Bank! 🐷`;
  }

  // ========== EMI CALCULATIONS ==========
  if (msg.includes('emi') || msg.includes('installment') || msg.includes('loan')) {
    const price = extractPrice(userMessage);
    const itemName = extractItemName(userMessage);
    
    if (!price) {
      return "What's the total amount for the EMI? I'll calculate options for you! 💳";
    }

    const emi6 = calculateEMI(price, 12, 6);
    const emi12 = calculateEMI(price, 12, 12);
    const emi24 = calculateEMI(price, 12, 24);
    
    const monthlyIncome = userData.income || userData.totalIncome;
    const emiPercent12 = ((emi12 / monthlyIncome) * 100).toFixed(0);

    return `💳 **EMI Options for ${itemName}**

Principal: ₹${price.toLocaleString()}

6 months: ₹${emi6.toLocaleString()}/mo (Total: ₹${(emi6 * 6).toLocaleString()})
12 months: ₹${emi12.toLocaleString()}/mo (Total: ₹${(emi12 * 12).toLocaleString()}) ${emiPercent12 < 20 ? '✅' : '⚠️'}
24 months: ₹${emi24.toLocaleString()}/mo (Total: ₹${(emi24 * 24).toLocaleString()})

💡 ${emiPercent12 < 20 ? '12-month EMI fits your budget!' : 'EMI is high! Consider saving up instead.'}`;
  }

  // ========== INVESTMENT & SIP ==========
  if (msg.includes('sip') || msg.includes('mutual fund') || msg.includes('invest') || msg.includes('retirement')) {
    const savingsGoal = userData.budget?.categoryAllocations?.savings || 0;
    const savingsActual = userData.categorySpending['savings'] || 0;
    const availableForSIP = Math.max(0, savingsActual - (savingsGoal * 0.5)); // Keep 50% liquid
    
    const suggestedSIP = Math.min(5000, Math.floor(availableForSIP / 2));
    
    if (suggestedSIP < 500) {
      return `💰 **Investment Check**

Current Savings: ₹${savingsActual.toLocaleString()}
Goal: ₹${savingsGoal.toLocaleString()}

⚠️ Focus on building emergency fund first!
Target: ₹${userData.piggyBank.goal.toLocaleString()} in Piggy Bank

💡 Start SIP once you have 6 months expenses saved! 🛡️`;
    }

    const sip10yr = calculateSIP(suggestedSIP, 12, 10);
    const sip20yr = calculateSIP(suggestedSIP, 12, 20);
    const sip30yr = calculateSIP(suggestedSIP, 12, 30);

    return `💰 **Investment Projection (12% returns)**

Suggested SIP: ₹${suggestedSIP.toLocaleString()}/month

📈 **FUTURE VALUE:**
10 years: ₹${(sip10yr.futureValue / 100000).toFixed(1)}L (Returns: ₹${(sip10yr.returns / 100000).toFixed(1)}L)
20 years: ₹${(sip20yr.futureValue / 100000).toFixed(0)}L (Returns: ₹${(sip20yr.returns / 100000).toFixed(0)}L)
30 years: ₹${(sip30yr.futureValue / 10000000).toFixed(2)}Cr (Returns: ₹${(sip30yr.returns / 10000000).toFixed(2)}Cr)

💡 Start early = Compound magic! 🚀`;
  }

  // ========== RENT INCREASE ==========
  if (msg.includes('rent') && (msg.includes('increase') || msg.includes('hike') || msg.includes('raise'))) {
    const currentRent = userData.categorySpending['housing'] || 15000;
    const price = extractPrice(userMessage);
    const newRent = price || currentRent * 1.1; // 10% default increase
    const increase = newRent - currentRent;
    const increasePercent = ((increase / currentRent) * 100).toFixed(0);
    
    const housingBudget = userData.budget?.categoryAllocations?.housing || currentRent;
    const canAfford = newRent <= housingBudget * 1.1;

    return `🏠 **Rent Increase Analysis**

Current: ₹${currentRent.toLocaleString()}
New: ₹${newRent.toLocaleString()}
Increase: ₹${increase.toLocaleString()} (+${increasePercent}%)

${canAfford ? '✅ **MANAGEABLE**' : '❌ **TOO HIGH**'}
Impact: ${canAfford ? 'Minor savings drop' : 'Major budget strain'}

💡 **OPTIONS:**
${canAfford ? '• Accept if location is worth it' : '• Negotiate down to ₹' + (housingBudget * 1.05).toLocaleString()}
• Look for cheaper options
• Get a roommate (split 50/50)`;
  }

  // ========== MEAL PREP VS EATING OUT ==========
  if (msg.includes('meal prep') || msg.includes('cook') || msg.includes('eating out') || msg.includes('food')) {
    const foodSpent = userData.categorySpending['food'] || 0;
    const eatingOutCost = 500 * 30; // ₹500/day
    const mealPrepCost = 200 * 30; // ₹200/day
    const savings = eatingOutCost - mealPrepCost;

    return `🍽️ **Meal Prep vs Eating Out**

Eating Out: ₹${eatingOutCost.toLocaleString()}/month
Meal Prep: ₹${mealPrepCost.toLocaleString()}/month
Savings: ₹${savings.toLocaleString()}/month 💰

Current Food Spending: ₹${foodSpent.toLocaleString()}

💡 **HYBRID APPROACH:**
• Cook 20 days: ₹4,000
• Eat out 10 days: ₹5,000
• Total: ₹9,000 (Save ₹6,000!) 🥳`;
  }

  // ========== SPENDING BY CATEGORY ==========
  if (msg.includes('spending') || msg.includes('spent') || msg.includes('expenses')) {
    const topCategories = Object.entries(userData.categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return `💸 **This Month's Spending**

Total: ₹${userData.totalExpenses.toLocaleString()}

${topCategories.map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString()}`).join('\n')}

💡 Income: ₹${userData.totalIncome.toLocaleString()}
Left: ₹${(userData.totalIncome - userData.totalExpenses).toLocaleString()}`;
  }

  // ========== GOALS PROGRESS ==========
  if (msg.includes('goal') || msg.includes('target') || msg.includes('saving')) {
    if (userData.goals.length === 0) {
      return "You don't have any active goals yet. Set one to start saving! 🎯";
    }

    const goalsText = userData.goals.map(g => {
      const progress = ((g.currentAmount / g.targetAmount) * 100).toFixed(0);
      const remaining = g.targetAmount - g.currentAmount;
      const monthsLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)) : 0;
      const monthlyNeeded = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : 0;
      
      return `${g.name}: ${progress}%
  Target: ₹${g.targetAmount.toLocaleString()}
  Saved: ₹${g.currentAmount.toLocaleString()}
  Left: ₹${remaining.toLocaleString()}
  ${monthsLeft > 0 ? `Need: ₹${monthlyNeeded.toLocaleString()}/month` : ''}`;
    }).join('\n\n');

    return `🎯 **Your Goals**

${goalsText}

💪 Keep going!`;
  }

  // ========== ON TRACK CHECK ==========
  if (msg.includes('on track') || msg.includes('doing') || msg.includes('progress')) {
    const savingsGoal = userData.budget?.categoryAllocations?.savings || 0;
    const savingsActual = userData.categorySpending['savings'] || 0;
    const savingsProgress = savingsGoal > 0 ? ((savingsActual / savingsGoal) * 100).toFixed(0) : 0;

    const overspentCount = Object.entries(userData.budget?.categoryAllocations || {}).filter(([cat, budgeted]) => {
      const spent = userData.categorySpending[cat] || 0;
      return spent > budgeted;
    }).length;

    if (overspentCount === 0 && savingsProgress >= 80) {
      return `✅ **You're crushing it!**

Savings: ${savingsProgress}% of goal
No overspending
Piggy Bank: ₹${userData.piggyBank.balance.toLocaleString()}

🎉 Keep up the great work!`;
    }

    return `📊 **Progress Check**

Savings: ${savingsProgress}% of goal ${savingsProgress >= 80 ? '✅' : '⚠️'}
Overspent categories: ${overspentCount}

💡 ${overspentCount > 0 ? 'Cut back on overspent categories!' : 'Stay on track!'}`;
  }

  // ========== TAX ESTIMATES ==========
  if (msg.includes('tax') || msg.includes('income tax') || msg.includes('deduction')) {
    const annualIncome = (userData.income || userData.totalIncome) * 12;
    let tax = 0;
    
    if (annualIncome <= 250000) tax = 0;
    else if (annualIncome <= 500000) tax = (annualIncome - 250000) * 0.05;
    else if (annualIncome <= 750000) tax = 12500 + (annualIncome - 500000) * 0.10;
    else if (annualIncome <= 1000000) tax = 37500 + (annualIncome - 750000) * 0.15;
    else if (annualIncome <= 1250000) tax = 75000 + (annualIncome - 1000000) * 0.20;
    else if (annualIncome <= 1500000) tax = 125000 + (annualIncome - 1250000) * 0.25;
    else tax = 187500 + (annualIncome - 1500000) * 0.30;

    const monthlyTax = Math.round(tax / 12);
    const deductions = 150000; // 80C + 80D
    const taxAfterDeductions = Math.max(0, tax - (deductions * 0.2));

    return `💼 **Tax Estimate (Old Regime)**

Annual Income: ₹${(annualIncome / 100000).toFixed(1)}L
Estimated Tax: ₹${(tax / 100000).toFixed(2)}L
Monthly: ₹${monthlyTax.toLocaleString()}

💡 **SAVE TAX:**
• 80C (₹1.5L): PPF, ELSS, LIC
• 80D (₹25K): Health insurance
• HRA: Rent receipts
• After deductions: ₹${(taxAfterDeductions / 100000).toFixed(2)}L

🎯 Max savings: ₹${((tax - taxAfterDeductions) / 100000).toFixed(2)}L!`;
  }

  // ========== WEEKEND PLANS ==========
  if (msg.includes('weekend') || msg.includes('saturday') || msg.includes('sunday')) {
    const entertainmentBudget = userData.budget?.categoryAllocations?.entertainment || 0;
    const entertainmentSpent = userData.categorySpending['entertainment'] || 0;
    const entertainmentLeft = entertainmentBudget - entertainmentSpent;

    if (entertainmentLeft < 500) {
      return `⚠️ **Weekend Budget Tight**

Entertainment Left: ₹${entertainmentLeft.toLocaleString()}

💡 **FREE/CHEAP OPTIONS:**
• Park picnic: ₹200
• Home movie night: ₹0
• Board games: ₹0
• Cook special meal: ₹500

Save for next weekend! 🎉`;
    }

    return `🎉 **Weekend Budget: ₹${entertainmentLeft.toLocaleString()}**

💡 **OPTIONS:**
• Fine dining: ₹2,800 🍽️
• Movie + dinner: ₹1,200 🎬
• Adventure park: ₹1,500 🎢
• Spa day: ₹3,000 💆
• Concert: ₹3,000 🎵
• Bowling: ₹800 🎳

Pick your vibe! 🥳`;
  }

  // ========== HEALTH & FITNESS ==========
  if (msg.includes('gym') || msg.includes('fitness') || msg.includes('yoga') || msg.includes('health')) {
    const healthBudget = userData.budget?.categoryAllocations?.health || 0;
    const healthSpent = userData.categorySpending['health'] || 0;
    const healthLeft = healthBudget - healthSpent;

    return `🏋️ **Health & Fitness**

Health Budget: ₹${healthBudget.toLocaleString()}
Spent: ₹${healthSpent.toLocaleString()}
Left: ₹${healthLeft.toLocaleString()}

💡 **OPTIONS:**
• Gym membership: ₹1,500/mo ${healthLeft >= 1500 ? '✅' : '❌'}
• Yoga classes: ₹2,000/mo ${healthLeft >= 2000 ? '✅' : '❌'}
• Home workout: ₹0 (YouTube) ✅
• Running: ₹0 (Free!) ✅

${healthLeft < 1500 ? 'Start with free options, upgrade later! 💪' : 'Invest in your health! 💪'}`;
  }

  // ========== EDUCATION & COURSES ==========
  if (msg.includes('course') || msg.includes('learn') || msg.includes('certification') || msg.includes('udemy') || msg.includes('bootcamp')) {
    const educationBudget = userData.budget?.categoryAllocations?.education || 0;
    const educationSpent = userData.categorySpending['education'] || 0;
    const educationLeft = educationBudget - educationSpent;

    return `📚 **Education Investment**

Education Budget: ₹${educationBudget.toLocaleString()}
Spent: ₹${educationSpent.toLocaleString()}
Left: ₹${educationLeft.toLocaleString()}

💡 **COURSES:**
• Udemy (sale): ₹1,000 ✅
• Coursera: ₹3,000 ${educationLeft >= 3000 ? '✅' : '⚠️'}
• Bootcamp: ₹50,000 ${educationLeft >= 50000 ? '✅' : '❌'}
• Certification: ₹8,000 ${educationLeft >= 8000 ? '✅' : '⚠️'}

📈 **ROI:** Skills = Higher salary!
Average boost: 20-30% 🚀`;
  }

  // ========== DEBT PAYOFF ==========
  if (msg.includes('debt') || msg.includes('credit card') || msg.includes('loan payoff') || msg.includes('pay off')) {
    const price = extractPrice(userMessage) || 50000;
    const availableForDebt = Math.max(0, userData.totalIncome - userData.totalExpenses - (userData.budget?.categoryAllocations?.savings || 0));
    
    const monthsToPayoff = Math.ceil(price / availableForDebt);
    const interestSaved = price * 0.18 * (monthsToPayoff / 12); // 18% credit card rate

    return `💳 **Debt Payoff Plan**

Total Debt: ₹${price.toLocaleString()}
Available/month: ₹${availableForDebt.toLocaleString()}
Payoff Time: ${monthsToPayoff} months

💰 **INTEREST SAVED:** ₹${interestSaved.toLocaleString()}

💡 **STRATEGY:**
• Pay ₹${availableForDebt.toLocaleString()}/month
• Avoid new debt
• Snowball method: smallest first
• Debt-free by ${new Date(Date.now() + monthsToPayoff * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}! 🎉`;
  }

  // ========== SHOPPING CATEGORIES ==========
  if (msg.includes('clothes') || msg.includes('shopping') || msg.includes('fashion')) {
    const shoppingBudget = userData.budget?.categoryAllocations?.shopping || 0;
    const shoppingSpent = userData.categorySpending['shopping'] || 0;
    const shoppingLeft = shoppingBudget - shoppingSpent;

    return `🛍️ **Shopping Budget**

Budget: ₹${shoppingBudget.toLocaleString()}
Spent: ₹${shoppingSpent.toLocaleString()}
Left: ₹${shoppingLeft.toLocaleString()}

💡 **SMART SHOPPING:**
• Wait for sales (30-50% off)
• Buy basics in bulk
• Quality > Quantity
• Avoid impulse buys

${shoppingLeft > 3000 ? '✅ Room for shopping!' : '⚠️ Budget tight, wait for next month!'}`;
  }

  // ========== BILL REMINDERS ==========
  if (msg.includes('bill') || msg.includes('payment') || msg.includes('due')) {
    const utilities = userData.categorySpending['utilities'] || 0;
    const subscriptions = userData.categorySpending['subscriptions'] || 0;

    return `📋 **Bills & Payments**

Utilities: ₹${utilities.toLocaleString()}
Subscriptions: ₹${subscriptions.toLocaleString()}

💡 **COMMON BILLS:**
• Electricity: Due 5th
• Internet: Due 10th
• Phone: Due 15th
• Credit Card: Due 20th
• Rent: Due 1st

🔔 Set reminders to avoid late fees!`;
  }

  // ========== SIDE HUSTLE IDEAS ==========
  if (msg.includes('side hustle') || msg.includes('extra income') || msg.includes('earn more')) {
    const currentIncome = userData.income || userData.totalIncome;
    const targetIncome = currentIncome * 1.2; // 20% increase

    return `💼 **Side Hustle Ideas**

Current Income: ₹${currentIncome.toLocaleString()}
Target: ₹${targetIncome.toLocaleString()} (+20%)

💡 **OPTIONS:**
• Freelancing: ₹10-50K/mo 💻
• Tutoring: ₹5-15K/mo 📚
• Content creation: ₹5-30K/mo 📹
• Consulting: ₹20-100K/mo 🎯
• Delivery partner: ₹8-20K/mo 🛵

🚀 Start small, scale up!`;
  }

  // ========== CHARITY & DONATIONS ==========
  if (msg.includes('charity') || msg.includes('donate') || msg.includes('donation')) {
    const recommendedDonation = Math.floor((userData.income || userData.totalIncome) * 0.02); // 2% of income

    return `❤️ **Charitable Giving**

Recommended: ₹${recommendedDonation.toLocaleString()} (2% of income)

💡 **TAX BENEFITS:**
• 50% deduction under 80G
• Effective cost: ₹${(recommendedDonation * 0.7).toLocaleString()}

🎯 **CAUSES:**
• Education for underprivileged
• Healthcare access
• Environmental conservation
• Animal welfare

Give back while saving tax! 🙏`;
  }

  // ========== INSURANCE ==========
  if (msg.includes('insurance') || msg.includes('health insurance') || msg.includes('life insurance')) {
    const age = 28; // default
    const healthInsurance = 15000; // annual
    const lifeInsurance = age * 1000; // rule of thumb

    return `🛡️ **Insurance Planning**

💡 **RECOMMENDED:**
• Health: ₹${healthInsurance.toLocaleString()}/year
  Coverage: ₹5L minimum
  Tax benefit: 80D

• Life (Term): ₹${lifeInsurance.toLocaleString()}/year
  Coverage: ₹1Cr
  Tax benefit: 80C

🎯 **PRIORITY:**
1. Health insurance (MUST)
2. Term life (if dependents)
3. Avoid ULIPs/endowment

Protect yourself first! 🛡️`;
  }

  // ========== SUBSCRIPTION AUDIT ==========
  if (msg.includes('subscription') || msg.includes('netflix') || msg.includes('spotify') || msg.includes('prime')) {
    const subscriptions = [
      { name: 'Netflix', cost: 650 },
      { name: 'Amazon Prime', cost: 1500 / 12 },
      { name: 'Spotify', cost: 120 },
      { name: 'YouTube Premium', cost: 130 },
      { name: 'Disney+', cost: 300 }
    ];

    const totalSubs = subscriptions.reduce((sum, s) => sum + s.cost, 0);

    return `📺 **Subscription Audit**

💡 **COMMON SUBSCRIPTIONS:**
${subscriptions.map(s => `• ${s.name}: ₹${Math.round(s.cost)}/mo`).join('\n')}

Total: ₹${Math.round(totalSubs).toLocaleString()}/month

🎯 **OPTIMIZE:**
• Share family plans (split cost)
• Cancel unused ones
• Rotate subscriptions
• Use free trials

Save ₹2-3K/month! 💰`;
  }

  // ========== BIKE/CAR PURCHASE ==========
  if (msg.includes('bike') || msg.includes('scooter') || msg.includes('car') || msg.includes('vehicle')) {
    const isCar = msg.includes('car');
    const price = extractPrice(userMessage) || (isCar ? 600000 : 80000);
    const downPayment = price * 0.2;
    const loanAmount = price * 0.8;
    const emi = calculateEMI(loanAmount, 9, isCar ? 60 : 36);
    const monthlyPetrol = isCar ? 4000 : 2000;
    const insurance = isCar ? 25000 / 12 : 8000 / 12;
    const maintenance = isCar ? 2000 : 800;
    const totalMonthly = emi + monthlyPetrol + insurance + maintenance;

    return `🏍️ **${isCar ? 'Car' : 'Bike'} Purchase Analysis**

Price: ₹${price.toLocaleString()}
Down Payment (20%): ₹${downPayment.toLocaleString()}
Loan: ₹${loanAmount.toLocaleString()}

💳 **MONTHLY COST:**
EMI: ₹${emi.toLocaleString()}
Petrol: ₹${monthlyPetrol.toLocaleString()}
Insurance: ₹${Math.round(insurance).toLocaleString()}
Maintenance: ₹${maintenance.toLocaleString()}
**Total: ₹${totalMonthly.toLocaleString()}/month**

${totalMonthly < (userData.income || userData.totalIncome) * 0.3 ? '✅ Affordable!' : '❌ Too expensive! Consider cheaper options.'}`;
  }

  // ========== GOLD INVESTMENT ==========
  if (msg.includes('gold') || msg.includes('digital gold') || msg.includes('sovereign gold bond')) {
    const investmentAmount = extractPrice(userMessage) || 10000;
    const goldPrice = 6000; // per gram
    const grams = investmentAmount / goldPrice;

    return `🪙 **Gold Investment**

Investment: ₹${investmentAmount.toLocaleString()}
Gold: ${grams.toFixed(2)} grams

💡 **OPTIONS:**
• Digital Gold: Easy, 3% charges
• Sovereign Gold Bonds: 2.5% interest + price appreciation
• Gold ETF: Stock market, low charges
• Physical Gold: Making charges 10-15%

🎯 **RECOMMENDATION:**
Sovereign Gold Bonds (best returns + tax-free after 8 years)

📈 Historical: 10-12% annual returns`;
  }

  // ========== EMERGENCY FUND CHECK ==========
  if (msg.includes('emergency') && !msg.includes('piggy')) {
    const monthlyExpenses = userData.totalExpenses || 30000;
    const recommendedFund = monthlyExpenses * 6;
    const currentFund = userData.piggyBank.balance;
    const progress = ((currentFund / recommendedFund) * 100).toFixed(0);

    return `🚨 **Emergency Fund Check**

Recommended: ₹${recommendedFund.toLocaleString()} (6 months expenses)
Current: ₹${currentFund.toLocaleString()}
Progress: ${progress}%

${progress >= 100 ? '✅ **FULLY FUNDED!** You\'re protected! 🛡️' : 
  progress >= 50 ? '⚠️ **HALFWAY THERE!** Keep building! 💪' :
  '❌ **PRIORITY!** Build this first before investing! 🎯'}

💡 Keep in Piggy Bank for easy access!`;
  }

  // ========== SALARY NEGOTIATION ==========
  if (msg.includes('salary') || msg.includes('raise') || msg.includes('hike') || msg.includes('negotiation')) {
    const currentSalary = userData.income || userData.totalIncome;
    const targetSalary = currentSalary * 1.2; // 20% hike
    const difference = targetSalary - currentSalary;

    return `💼 **Salary Negotiation Guide**

Current: ₹${currentSalary.toLocaleString()}/month
Target: ₹${targetSalary.toLocaleString()}/month (+20%)
Increase: ₹${difference.toLocaleString()}/month

💡 **PREPARATION:**
• Document achievements
• Research market rates
• Highlight value added
• Practice pitch

🎯 **TIMING:**
• Annual review
• After major project
• When taking new responsibilities

📈 Average hike: 10-15% (good), 20%+ (excellent)`;
  }

  // ========== CREDIT SCORE ==========
  if (msg.includes('credit score') || msg.includes('cibil') || msg.includes('credit rating')) {
    return `📊 **Credit Score Guide**

💡 **SCORE RANGES:**
• 750-900: Excellent ✅
• 700-749: Good 👍
• 650-699: Fair ⚠️
• <650: Poor ❌

🎯 **IMPROVE SCORE:**
• Pay bills on time (35% weight)
• Keep credit utilization <30%
• Don't close old cards
• Mix of credit types
• Avoid multiple applications

📈 **BENEFITS:**
• Lower interest rates
• Higher loan amounts
• Faster approvals
• Better credit cards

Check free: CIBIL, Experian, CRIF`;
  }

  // ========== FESTIVAL SPENDING ==========
  if (msg.includes('diwali') || msg.includes('festival') || msg.includes('wedding') || msg.includes('celebration')) {
    const entertainmentBudget = userData.budget?.categoryAllocations?.entertainment || 0;
    const entertainmentSpent = userData.categorySpending['entertainment'] || 0;
    const entertainmentLeft = entertainmentBudget - entertainmentSpent;
    const giftBudget = 5000;

    return `🎉 **Festival/Celebration Budget**

Entertainment Left: ₹${entertainmentLeft.toLocaleString()}

💡 **TYPICAL COSTS:**
• Gifts: ₹${giftBudget.toLocaleString()}
• Clothes: ₹3,000
• Decorations: ₹2,000
• Food/Sweets: ₹2,500
• Travel: ₹5,000
**Total: ₹17,500**

${entertainmentLeft >= 17500 ? '✅ Budget covers it!' : `⚠️ Shortfall: ₹${(17500 - entertainmentLeft).toLocaleString()}`}

🎯 **SAVE MONEY:**
• Homemade sweets
• Group gifts
• Reuse decorations
• Plan early (avoid surge pricing)`;
  }

  // ========== DINING OUT ==========
  if (msg.includes('restaurant') || msg.includes('dine out') || msg.includes('dinner out')) {
    const foodBudget = userData.budget?.categoryAllocations?.food || 0;
    const foodSpent = userData.categorySpending['food'] || 0;
    const foodLeft = foodBudget - foodSpent;

    return `🍽️ **Dining Out Budget**

Food Budget Left: ₹${foodLeft.toLocaleString()}

💡 **PRICE RANGES:**
• Street food: ₹200-500 ✅
• Casual dining: ₹800-1,500 🍕
• Fine dining: ₹2,500-5,000 🍷
• Luxury: ₹5,000+ 💎

${foodLeft >= 2500 ? '✅ Fine dining possible!' : 
  foodLeft >= 800 ? '✅ Casual dining fits!' :
  '⚠️ Stick to budget options!'}

🎯 Save 30% with lunch specials!`;
  }

  // ========== RETIREMENT PLANNING ==========
  if (msg.includes('retire') || msg.includes('retirement') || msg.includes('60')) {
    const age = 28;
    const retirementAge = 60;
    const yearsToRetirement = retirementAge - age;
    const monthlySIP = 10000;
    const retirement = calculateSIP(monthlySIP, 12, yearsToRetirement);

    return `🏖️ **Retirement Planning**

Current Age: ${age}
Retirement: ${retirementAge}
Years Left: ${yearsToRetirement}

💰 **PROJECTION (₹10K/month SIP @ 12%):**
Invested: ₹${(retirement.invested / 10000000).toFixed(2)}Cr
Returns: ₹${(retirement.returns / 10000000).toFixed(2)}Cr
**Total: ₹${(retirement.futureValue / 10000000).toFixed(2)}Cr**

🎯 **RETIREMENT CORPUS NEEDED:**
₹3-5Cr for comfortable retirement

${retirement.futureValue >= 30000000 ? '✅ On track!' : '⚠️ Increase SIP to ₹' + Math.ceil(30000000 / retirement.futureValue * monthlySIP).toLocaleString()}`;
  }

  // ========== HOME LOAN ==========
  if (msg.includes('home loan') || msg.includes('house') || msg.includes('property') || msg.includes('flat')) {
    const price = extractPrice(userMessage) || 5000000; // 50L default
    const downPayment = price * 0.2;
    const loanAmount = price * 0.8;
    const emi = calculateEMI(loanAmount, 8.5, 240); // 20 years
    const monthlyIncome = userData.income || userData.totalIncome;
    const emiPercent = ((emi / monthlyIncome) * 100).toFixed(0);

    return `🏠 **Home Loan Analysis**

Property: ₹${(price / 100000).toFixed(0)}L
Down Payment (20%): ₹${(downPayment / 100000).toFixed(0)}L
Loan: ₹${(loanAmount / 100000).toFixed(0)}L

💳 **EMI (8.5%, 20 years):**
₹${emi.toLocaleString()}/month (${emiPercent}% of income)

${emiPercent < 40 ? '✅ **AFFORDABLE!**' : '❌ **TOO HIGH!**'}
Ideal: <40% of income

💡 **TAX BENEFITS:**
• Principal: ₹1.5L (80C)
• Interest: ₹2L (24)
• Total: ₹3.5L deduction

${emiPercent < 40 ? 'Good time to buy! 🎉' : 'Save more for down payment! 💪'}`;
  }

  // ========== VACATION DAYS ==========
  if (msg.includes('vacation days') || msg.includes('leave') || msg.includes('pto')) {
    return `🏖️ **Vacation Planning**

💡 **OPTIMIZE LEAVES:**
• Plan around long weekends
• Combine with public holidays
• 5 leaves = 9-day trip!

🎯 **BUDGET ALLOCATION:**
• Domestic: ₹8-15K
• International: ₹40-80K

📅 **BEST TIMES:**
• Jan-Feb: Goa, Kerala
• Mar-May: Hill stations
• Jun-Aug: Monsoon destinations
• Sep-Dec: Rajasthan, North

Plan 3 months ahead = Save 30%! 💰`;
  }

  // ========== COFFEE/DAILY EXPENSES ==========
  if (msg.includes('coffee') || msg.includes('starbucks') || msg.includes('cafe')) {
    const dailyCoffee = 150;
    const monthlyCoffee = dailyCoffee * 22; // working days
    const yearlyCoffee = monthlyCoffee * 12;
    const homeCoffee = 20 * 22;
    const savings = monthlyCoffee - homeCoffee;

    return `☕ **Coffee Economics**

Café coffee: ₹${dailyCoffee}/day
Monthly: ₹${monthlyCoffee.toLocaleString()}
Yearly: ₹${yearlyCoffee.toLocaleString()}

🏠 **HOME BREW:**
Monthly: ₹${homeCoffee.toLocaleString()}
**Savings: ₹${savings.toLocaleString()}/month**

💡 **LATTE FACTOR:**
₹${savings.toLocaleString()}/mo invested @ 12%
• 10 years: ₹${(calculateSIP(savings, 12, 10).futureValue / 100000).toFixed(1)}L
• 20 years: ₹${(calculateSIP(savings, 12, 20).futureValue / 100000).toFixed(0)}L

Small savings = Big wealth! 💰`;
  }

  // ========== SALARY BREAKDOWN ==========
  if (msg.includes('salary breakdown') || msg.includes('take home') || msg.includes('in hand')) {
    const grossSalary = (userData.income || userData.totalIncome) * 12;
    const pf = grossSalary * 0.12;
    const tax = grossSalary > 500000 ? (grossSalary - 500000) * 0.1 : 0;
    const takeHome = grossSalary - pf - tax;
    const monthlyTakeHome = takeHome / 12;

    return `💼 **Salary Breakdown**

Gross (Annual): ₹${(grossSalary / 100000).toFixed(1)}L
PF (12%): -₹${(pf / 100000).toFixed(1)}L
Tax: -₹${(tax / 100000).toFixed(1)}L
**Take Home: ₹${(takeHome / 100000).toFixed(1)}L**

Monthly: ₹${monthlyTakeHome.toLocaleString()}

💡 **OPTIMIZE:**
• Max 80C: Save ₹46,800 tax
• HRA: Rent receipts
• NPS: Extra ₹50K deduction

🎯 Increase take-home by ₹3-5K/month!`;
  }

  // ========== WEDDING PLANNING ==========
  if (msg.includes('wedding') || msg.includes('marriage') || msg.includes('shaadi')) {
    const weddingCost = 500000; // 5L budget wedding
    const monthsToWedding = 12;
    const monthlySavings = Math.ceil(weddingCost / monthsToWedding);

    return `💍 **Wedding Planning**

Budget Wedding: ₹${(weddingCost / 100000).toFixed(0)}L
Months to save: ${monthsToWedding}
Need: ₹${monthlySavings.toLocaleString()}/month

💡 **BREAKDOWN:**
• Venue: ₹1.5L (30%)
• Catering: ₹1.5L (30%)
• Photography: ₹50K (10%)
• Clothes: ₹50K (10%)
• Jewelry: ₹1L (20%)

🎯 **SAVE MONEY:**
• Off-season dates (-20%)
• Smaller guest list
• Digital invites
• Negotiate packages

${monthlySavings < (userData.income || userData.totalIncome) * 0.3 ? '✅ Achievable!' : '⚠️ Consider extending timeline!'}`;
  }

  // ========== INTERNATIONAL TRAVEL ==========
  if (msg.includes('dubai') || msg.includes('singapore') || msg.includes('thailand') || msg.includes('europe') || msg.includes('international')) {
    const destinations = [
      { name: 'Dubai', cost: 45000, days: 5 },
      { name: 'Singapore', cost: 45000, days: 5 },
      { name: 'Thailand', cost: 35000, days: 7 },
      { name: 'Bali', cost: 40000, days: 6 },
      { name: 'Maldives', cost: 80000, days: 5 },
      { name: 'Europe', cost: 150000, days: 10 }
    ];

    const availableCash = userData.bankBalance + userData.income - userData.totalExpenses;
    const savingsGoal = userData.budget?.categoryAllocations?.savings || 0;
    const maxAffordable = Math.max(0, availableCash - savingsGoal);

    const affordable = destinations.filter(d => d.cost <= maxAffordable);
    const needSaving = destinations.filter(d => d.cost > maxAffordable && d.cost <= maxAffordable * 2);

    return `✈️ **International Travel**

Available: ₹${maxAffordable.toLocaleString()}

${affordable.length > 0 ? `✅ **AFFORDABLE NOW:**\n${affordable.map(d => `• ${d.name}: ₹${d.cost.toLocaleString()} (${d.days} days)`).join('\n')}\n` : ''}
${needSaving.length > 0 ? `⏳ **SAVE 2-3 MONTHS:**\n${needSaving.map(d => `• ${d.name}: ₹${d.cost.toLocaleString()} (${d.days} days)`).join('\n')}` : ''}

💡 **SAVE MORE:**
• Book 3 months ahead (-30%)
• Off-season travel (-40%)
• Group bookings (discounts)`;
  }

  // ========== SPECIFIC CATEGORY QUERIES ==========
  if (msg.includes('groceries') || msg.includes('grocery')) {
    const groceryBudget = userData.budget?.categoryAllocations?.groceries || 0;
    const grocerySpent = userData.categorySpending['groceries'] || 0;
    const groceryLeft = groceryBudget - grocerySpent;

    return `🛒 **Groceries Budget**

Budget: ₹${groceryBudget.toLocaleString()}
Spent: ₹${grocerySpent.toLocaleString()}
Left: ₹${groceryLeft.toLocaleString()}

💡 **SAVE MONEY:**
• Buy in bulk (save 15%)
• Use coupons/cashback
• Avoid branded items
• Weekly meal plan
• Shop after meals (avoid impulse)

🎯 Average savings: ₹2-3K/month!`;
  }

  // ========== ENTERTAINMENT ==========
  if (msg.includes('entertainment') || msg.includes('movie') || msg.includes('concert') || msg.includes('show')) {
    const entertainmentBudget = userData.budget?.categoryAllocations?.entertainment || 0;
    const entertainmentSpent = userData.categorySpending['entertainment'] || 0;
    const entertainmentLeft = entertainmentBudget - entertainmentSpent;

    return `🎬 **Entertainment Budget**

Budget: ₹${entertainmentBudget.toLocaleString()}
Spent: ₹${entertainmentSpent.toLocaleString()}
Left: ₹${entertainmentLeft.toLocaleString()}

💡 **OPTIONS:**
• Movie: ₹300 ✅
• Concert: ₹3,000 ${entertainmentLeft >= 3000 ? '✅' : '❌'}
• Streaming: ₹650/mo ✅
• Gaming: ₹3,000 ${entertainmentLeft >= 3000 ? '✅' : '❌'}

${entertainmentLeft > 2000 ? '🎉 Enjoy yourself!' : '⚠️ Budget tight, choose wisely!'}`;
  }

  // ========== UTILITIES ==========
  if (msg.includes('electricity') || msg.includes('water bill') || msg.includes('utility')) {
    const utilitiesBudget = userData.budget?.categoryAllocations?.utilities || 0;
    const utilitiesSpent = userData.categorySpending['utilities'] || 0;
    const utilitiesLeft = utilitiesBudget - utilitiesSpent;

    return `⚡ **Utilities Budget**

Budget: ₹${utilitiesBudget.toLocaleString()}
Spent: ₹${utilitiesSpent.toLocaleString()}
Left: ₹${utilitiesLeft.toLocaleString()}

💡 **REDUCE BILLS:**
• LED bulbs (save 60%)
• AC at 24°C (save 30%)
• Unplug devices
• Solar water heater
• Fix leaks

🎯 Average savings: ₹500-1,000/month!`;
  }

  // ========== PETS ==========
  if (msg.includes('pet') || msg.includes('dog') || msg.includes('cat')) {
    return `🐕 **Pet Expenses**

💡 **MONTHLY COSTS:**
• Food: ₹2,000-4,000
• Vet visits: ₹1,000
• Grooming: ₹500-1,500
• Toys/supplies: ₹500
**Total: ₹4,000-7,000/month**

🎯 **ONE-TIME:**
• Adoption: ₹5,000-15,000
• Vaccinations: ₹3,000
• Accessories: ₹5,000

⚠️ **EMERGENCY FUND:**
Keep ₹20-30K for medical emergencies

💰 Budget ₹5K/month + ₹25K emergency fund!`;
  }

  // ========== FREELANCING ==========
  if (msg.includes('freelance') || msg.includes('freelancing') || msg.includes('gig work')) {
    const currentIncome = userData.income || userData.totalIncome;
    const freelanceIncome = 15000; // conservative estimate

    return `💻 **Freelancing Guide**

Current Income: ₹${currentIncome.toLocaleString()}
Potential Extra: ₹${freelanceIncome.toLocaleString()}/month

💡 **PLATFORMS:**
• Upwork: Global clients 🌍
• Fiverr: Quick gigs 💼
• Toptal: Premium rates 💎
• Freelancer.com: Variety 🎯

🎯 **SKILLS IN DEMAND:**
• Web development: ₹20-50K/project
• Graphic design: ₹5-15K/project
• Content writing: ₹2-5K/article
• Digital marketing: ₹10-30K/month

📈 Start part-time, scale to full-time!`;
  }

  // ========== STOCK MARKET ==========
  if (msg.includes('stock') || msg.includes('share') || msg.includes('equity') || msg.includes('trading')) {
    const investmentAmount = extractPrice(userMessage) || 10000;
    const emergencyFund = userData.piggyBank.balance;
    const hasEmergencyFund = emergencyFund >= (userData.totalExpenses * 6);

    if (!hasEmergencyFund) {
      return `⚠️ **NOT READY FOR STOCKS**

Emergency Fund: ₹${emergencyFund.toLocaleString()}
Needed: ₹${((userData.totalExpenses * 6) / 100000).toFixed(0)}L

💡 **BUILD EMERGENCY FUND FIRST!**
Stocks are risky. Secure basics first! 🛡️

🎯 **PRIORITY:**
1. Emergency fund (6 months)
2. Clear high-interest debt
3. Then invest in stocks`;
    }

    return `📈 **Stock Market Investment**

Investment: ₹${investmentAmount.toLocaleString()}

💡 **BEGINNER STRATEGY:**
• Index funds (Nifty 50): Low risk ✅
• Blue-chip stocks: Moderate risk ⚠️
• Small-cap: High risk ❌

🎯 **ALLOCATION:**
• 70% Index funds
• 20% Blue-chip
• 10% Experimental

📊 **EXPECTED RETURNS:**
• Conservative: 10-12%/year
• Moderate: 12-15%/year
• Aggressive: 15-20%/year

⚠️ Only invest what you can afford to lose!`;
  }

  // ========== CREDIT CARD ==========
  if (msg.includes('credit card') && !msg.includes('debt') && !msg.includes('payoff')) {
    return `💳 **Credit Card Guide**

💡 **BEST PRACTICES:**
• Pay FULL amount (avoid interest)
• Use <30% of limit
• Pay before due date
• Track spending

🎯 **REWARDS:**
• Cashback: 1-5%
• Travel points
• Fuel surcharge waiver
• Airport lounge access

⚠️ **AVOID:**
• Minimum payment trap (36% interest!)
• Cash withdrawal (fees + interest)
• Multiple cards (hard to track)

✅ Use like debit card = Free benefits!`;
  }

  // ========== SAVINGS RATE ==========
  if (msg.includes('savings rate') || msg.includes('how much should i save')) {
    const income = userData.income || userData.totalIncome;
    const expenses = userData.totalExpenses;
    const currentSavingsRate = ((income - expenses) / income * 100).toFixed(0);
    const idealSavings = income * 0.3; // 30% rule

    return `💰 **Savings Rate Analysis**

Income: ₹${income.toLocaleString()}
Expenses: ₹${expenses.toLocaleString()}
Current Rate: ${currentSavingsRate}%

🎯 **BENCHMARKS:**
• Minimum: 20% ✅
• Good: 30% 👍
• Excellent: 50%+ 🌟

Your Target: ₹${idealSavings.toLocaleString()} (30%)

${currentSavingsRate >= 30 ? '✅ Excellent savings rate!' : 
  currentSavingsRate >= 20 ? '👍 Good! Aim for 30%!' :
  '⚠️ Increase savings! Cut discretionary spending.'}`;
  }

  // ========== INFLATION ==========
  if (msg.includes('inflation') || msg.includes('rising prices')) {
    const currentExpenses = userData.totalExpenses;
    const inflationRate = 6; // 6% annual
    const expenses5yr = currentExpenses * Math.pow(1 + inflationRate / 100, 5);
    const expenses10yr = currentExpenses * Math.pow(1 + inflationRate / 100, 10);

    return `📈 **Inflation Impact**

Current Expenses: ₹${currentExpenses.toLocaleString()}/month

💡 **FUTURE COSTS (6% inflation):**
5 years: ₹${Math.round(expenses5yr).toLocaleString()}/month
10 years: ₹${Math.round(expenses10yr).toLocaleString()}/month

🎯 **BEAT INFLATION:**
• Invest in equity (12%+ returns)
• Increase income yearly
• Optimize expenses
• Build assets

⚠️ Cash loses value! Invest wisely! 💰`;
  }

  // ========== CHILDREN EDUCATION ==========
  if (msg.includes('child') || msg.includes('education fund') || msg.includes('college fund')) {
    const yearsToCollege = 15;
    const currentCost = 500000; // 5L per year
    const inflationRate = 8;
    const futureCost = currentCost * Math.pow(1 + inflationRate / 100, yearsToCollege) * 4; // 4 years
    const monthlySIP = 10000;
    const sipReturns = calculateSIP(monthlySIP, 12, yearsToCollege);

    return `👶 **Children's Education Fund**

College Cost Today: ₹${(currentCost / 100000).toFixed(0)}L/year
In ${yearsToCollege} years: ₹${(futureCost / 10000000).toFixed(2)}Cr (total)

💰 **SIP PLAN (₹10K/month @ 12%):**
Invested: ₹${(sipReturns.invested / 100000).toFixed(0)}L
Returns: ₹${(sipReturns.returns / 100000).toFixed(0)}L
**Total: ₹${(sipReturns.futureValue / 100000).toFixed(0)}L**

${sipReturns.futureValue >= futureCost ? '✅ Fully funded!' : `⚠️ Shortfall: ₹${((futureCost - sipReturns.futureValue) / 100000).toFixed(0)}L`}

🎯 Start early = Less monthly burden!`;
  }

  // ========== CASHBACK & REWARDS ==========
  if (msg.includes('cashback') || msg.includes('reward') || msg.includes('points')) {
    const monthlySpending = userData.totalExpenses;
    const cashback = monthlySpending * 0.02; // 2% average
    const annualCashback = cashback * 12;

    return `🎁 **Cashback Optimization**

Monthly Spending: ₹${monthlySpending.toLocaleString()}
Potential Cashback (2%): ₹${Math.round(cashback).toLocaleString()}/month
Annual: ₹${Math.round(annualCashback).toLocaleString()}

💡 **MAXIMIZE REWARDS:**
• Use right card for category
• Groceries: 5% cashback cards
• Fuel: 4% cashback
• Online: 2-3% cashback
• Bills: 1% cashback

🎯 **BEST CARDS:**
• Amazon Pay: 5% on Amazon
• SBI Cashback: 5% online
• HDFC Millennia: 5% select merchants

💰 Free money! Use it! 🎉`;
  }

  // ========== WORK FROM HOME SAVINGS ==========
  if (msg.includes('wfh') || msg.includes('work from home') || msg.includes('remote work')) {
    const commuteSavings = 3000; // monthly
    const lunchSavings = 150 * 22; // ₹150/day
    const totalSavings = commuteSavings + lunchSavings;

    return `🏠 **WFH Savings**

💰 **MONTHLY SAVINGS:**
• Commute: ₹${commuteSavings.toLocaleString()}
• Lunch: ₹${lunchSavings.toLocaleString()}
• Clothes: ₹1,000
**Total: ₹${(totalSavings + 1000).toLocaleString()}/month**

📈 **ANNUAL IMPACT:**
₹${((totalSavings + 1000) * 12 / 100000).toFixed(1)}L saved!

💡 **INVEST SAVINGS:**
• SIP: ₹5K/month
• Emergency fund
• Skill development

🎯 WFH = Hidden wealth builder! 💪`;
  }

  // ========== BIRTHDAY/GIFT ==========
  if (msg.includes('birthday') || msg.includes('gift') || msg.includes('present')) {
    const price = extractPrice(userMessage) || 2000;
    const entertainmentBudget = userData.budget?.categoryAllocations?.entertainment || 0;
    const entertainmentSpent = userData.categorySpending['entertainment'] || 0;
    const entertainmentLeft = entertainmentBudget - entertainmentSpent;

    return `🎁 **Gift Budget**

Gift Budget: ₹${price.toLocaleString()}
Entertainment Left: ₹${entertainmentLeft.toLocaleString()}

${price <= entertainmentLeft ? '✅ **FITS BUDGET!**' : '⚠️ **OVER BUDGET!**'}

💡 **GIFT IDEAS (₹${price.toLocaleString()}):**
• Personalized items
• Experience gifts (dinner, spa)
• Books/courses
• Gadgets
• Handmade gifts (priceless!)

🎯 Thoughtful > Expensive! ❤️`;
  }

  // ========== LAST MONTH COMPARISON ==========
  if (msg.includes('last month') || msg.includes('previous month') || msg.includes('compare')) {
    const thisMonth = userData.totalExpenses;
    const lastMonth = thisMonth * 0.9; // mock data
    const difference = thisMonth - lastMonth;
    const percentChange = ((difference / lastMonth) * 100).toFixed(0);

    return `📊 **Month Comparison**

This Month: ₹${thisMonth.toLocaleString()}
Last Month: ₹${lastMonth.toLocaleString()}
Change: ${difference >= 0 ? '+' : ''}₹${Math.abs(difference).toLocaleString()} (${percentChange >= 0 ? '+' : ''}${percentChange}%)

${difference > 0 ? '⚠️ **SPENDING UP!**' : '✅ **SPENDING DOWN!**'}

💡 ${difference > 0 ? 'Identify what increased and cut back!' : 'Great job! Keep it up! 🎉'}`;
  }

  // ========== INCOME INCREASE ==========
  if (msg.includes('income increase') || msg.includes('bonus') || msg.includes('increment')) {
    const price = extractPrice(userMessage);
    const currentIncome = userData.income || userData.totalIncome;
    const newIncome = price || currentIncome * 1.15;
    const increase = newIncome - currentIncome;

    return `💰 **Income Increase Plan**

Current: ₹${currentIncome.toLocaleString()}
New: ₹${newIncome.toLocaleString()}
Increase: ₹${increase.toLocaleString()}

💡 **ALLOCATE WISELY:**
• Save 50%: ₹${(increase * 0.5).toLocaleString()}
• Invest 30%: ₹${(increase * 0.3).toLocaleString()}
• Lifestyle 20%: ₹${(increase * 0.2).toLocaleString()}

🎯 **AVOID LIFESTYLE INFLATION!**
Save the raise = Wealth building! 🚀`;
  }

  // ========== MOVING/RELOCATION ==========
  if (msg.includes('moving') || msg.includes('relocation') || msg.includes('shifting')) {
    const movingCost = 15000;
    const deposit = 30000; // 2 months rent
    const brokerageFee = 15000; // 1 month rent
    const totalCost = movingCost + deposit + brokerageFee;

    return `📦 **Relocation Costs**

💡 **BREAKDOWN:**
• Packers & Movers: ₹${movingCost.toLocaleString()}
• Security Deposit: ₹${deposit.toLocaleString()}
• Brokerage: ₹${brokerageFee.toLocaleString()}
**Total: ₹${totalCost.toLocaleString()}**

🎯 **SAVE MONEY:**
• Move yourself (save ₹10K)
• Negotiate brokerage (50%)
• Time move at month-end
• Sell old furniture

💰 Budget ₹40-60K for smooth move!`;
  }

  // ========== FESTIVAL BONUS ==========
  if (msg.includes('bonus') && (msg.includes('diwali') || msg.includes('festival'))) {
    const bonus = extractPrice(userMessage) || 50000;

    return `🎉 **Festival Bonus Allocation**

Bonus: ₹${bonus.toLocaleString()}

💡 **SMART SPLIT:**
• Emergency Fund: ₹${(bonus * 0.4).toLocaleString()} (40%)
• Debt Payoff: ₹${(bonus * 0.3).toLocaleString()} (30%)
• Investments: ₹${(bonus * 0.2).toLocaleString()} (20%)
• Celebration: ₹${(bonus * 0.1).toLocaleString()} (10%)

🎯 **AVOID:**
• Impulse big purchases
• Lifestyle inflation
• Lending to friends

💰 Bonus = Wealth accelerator! 🚀`;
  }

  // ========== DEFAULT HELP ==========
  return `I can help with ANY money question! Try:

💰 **AFFORDABILITY**
"Can I buy iPhone 16?"
"Afford new laptop?"

🏠 **LIVING**
"Rent increase ok?"
"New AC affordable?"

✈️ **TRAVEL**
"Goa trip possible?"
"International travel?"

🚗 **TRANSPORT**
"Uber vs Metro?"
"Bike EMI?"

💼 **INVESTMENTS**
"Start SIP?"
"Retirement planning?"

📊 **TRACKING**
"Budget status?"
"Am I overspending?"
"Show everything!"

🎯 **GOALS**
"Goals progress?"
"On track?"

Just ask naturally! 🚀`;
};
