// Price Database for Common Items
export const PRICE_DATABASE = {
  // Electronics
  'iphone 16': 79000, 'iphone 15': 69000, 'iphone 14': 45000, 'iphone 13': 39000,
  'samsung s24': 74000, 'samsung s23': 54000, 'oneplus 12': 52000, 'oneplus 11': 42000,
  'macbook air': 99000, 'macbook pro': 199000, 'dell xps': 85000, 'hp pavilion': 45000,
  'lenovo thinkpad': 55000, 'asus vivobook': 38000, 'ipad': 35000, 'ipad pro': 75000,
  'airpods': 12000, 'airpods pro': 24000, 'sony wh': 25000, 'boat headphones': 2000,
  'apple watch': 42000, 'samsung watch': 18000, 'tv 55': 45000, 'tv 65': 75000,
  'ps5': 50000, 'xbox': 45000, 'nintendo switch': 30000,
  
  // Home & Living
  'ac': 25000, 'air conditioner': 25000, 'fridge': 22000, 'refrigerator': 22000,
  'washing machine': 18000, 'microwave': 8000, 'mixer grinder': 3000,
  'sofa': 35000, 'bed': 25000, 'mattress': 15000, 'dining table': 20000,
  'chair': 5000, 'wardrobe': 30000, 'curtains': 4000, 'carpet': 8000,
  
  // Transport
  'bike': 80000, 'scooter': 70000, 'cycle': 8000, 'bicycle': 8000,
  'car': 600000, 'used car': 300000,
  
  // Fashion
  'shoes': 3000, 'sneakers': 5000, 'nike shoes': 8000, 'adidas': 6000,
  'jeans': 2000, 'shirt': 1500, 'dress': 3000, 'jacket': 4000,
  'watch': 5000, 'sunglasses': 2000, 'bag': 3000, 'backpack': 2000,
  
  // Health
  'gym membership': 1500, 'yoga classes': 2000, 'dental': 4500,
  'health insurance': 15000, 'medicines': 1000,
  
  // Education
  'udemy course': 1000, 'coursera': 3000, 'bootcamp': 50000,
  'certification': 8000, 'books': 500,
  
  // Travel
  'goa trip': 6800, 'goa': 6800, 'manali': 8500, 'kerala': 12000,
  'dubai': 45000, 'singapore': 45000, 'thailand': 35000, 'bali': 40000,
  'maldives': 80000, 'europe': 150000,
  
  // Food
  'dinner': 1500, 'lunch': 500, 'breakfast': 200, 'coffee': 150,
  'pizza': 400, 'burger': 250, 'biryani': 300,
  
  // Misc
  'concert': 3000, 'movie': 300, 'netflix': 650, 'spotify': 120,
  'amazon prime': 1500, 'gym': 1500
};

// Extract price from message
export const extractPrice = (message) => {
  const msg = message.toLowerCase();
  
  // Check for explicit price mentions (₹5000, 5000, 5k, etc.)
  const explicitPrice = msg.match(/₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*k?/);
  if (explicitPrice) {
    let amount = parseFloat(explicitPrice[1].replace(/,/g, ''));
    if (msg.includes('k') || msg.includes('K')) {
      amount *= 1000;
    }
    return amount;
  }
  
  // Check price database for known items
  for (const [item, price] of Object.entries(PRICE_DATABASE)) {
    if (msg.includes(item)) {
      return price;
    }
  }
  
  return null;
};

// Extract item name from message
export const extractItemName = (message) => {
  const msg = message.toLowerCase();
  
  for (const item of Object.keys(PRICE_DATABASE)) {
    if (msg.includes(item)) {
      return item.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  
  // Generic extraction
  const patterns = [
    /(?:buy|afford|purchase|get)\s+(?:a|an|the)?\s*([a-z0-9\s]+?)(?:\?|for|at|$)/i,
    /can\s+i\s+(?:buy|afford|get)\s+([a-z0-9\s]+?)(?:\?|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return 'this item';
};

// Calculate EMI
export const calculateEMI = (principal, ratePercent, months) => {
  const rate = ratePercent / 12 / 100;
  const emi = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
  return Math.round(emi);
};

// Calculate SIP returns
export const calculateSIP = (monthlyAmount, ratePercent, years) => {
  const months = years * 12;
  const rate = ratePercent / 12 / 100;
  const futureValue = monthlyAmount * (((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate));
  const invested = monthlyAmount * months;
  const returns = futureValue - invested;
  return { futureValue: Math.round(futureValue), invested, returns: Math.round(returns) };
};
