import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import { getBudgets, getTransactions, getPiggyBankBalance, getPiggyBankAutoSuggest, getGoals } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { processMessage } from '../utils/chatbotProcessor';

const FinancialChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userData, setUserData] = useState(null);
  const messagesEndRef = useRef(null);

  const quickReplies = [
    { text: "Can I afford?", icon: "💰" },
    { text: "Piggy Bank status", icon: "🐷" },
    { text: "Budget overview", icon: "📊" },
    { text: "Am I overspending?", icon: "⚠️" }
  ];

  useEffect(() => {
    if (isOpen && !userData) {
      loadUserData();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUserData = async () => {
    try {
      const [budgetsData, transactions, piggyData, goalsData] = await Promise.all([
        getBudgets(),
        getTransactions(),
        getPiggyBankBalance(),
        getGoals()
      ]);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthTransactions = transactions.filter(t => new Date(t.date) >= thisMonthStart);

      const currentBudget = (budgetsData.budgets || []).find(
        b => b.period.month === now.getMonth() + 1 && b.period.year === now.getFullYear()
      );

      const categorySpending = {};
      thisMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      });

      const totalIncome = thisMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = thisMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setUserData({
        budget: currentBudget,
        categorySpending,
        piggyBank: piggyData,
        goals: (goalsData.goals || []).filter(g => g.status === 'active'),
        totalIncome,
        totalExpenses,
        bankBalance: user.bank_balance || 0,
        income: user.income || 0
      });
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsTyping(true);

    setTimeout(async () => {
      const response = await processMessage(userMessage, userData);
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickReply = (text) => {
    setMessages(prev => [...prev, { type: 'user', text }]);
    setIsTyping(true);

    setTimeout(async () => {
      const response = await processMessage(text, userData);
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Chat Icon */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="floating-chat-icon"
        title="Financial Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Financial Assistant</p>
                <p className="text-xs opacity-90">Ask me anything about your finances</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-sm text-gray-600 mb-4">
                  Hi! I'm your personal financial assistant. Ask me anything!
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickReply(reply.text)}
                      className="text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      {reply.icon} {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your finances..."
                className="flex-1 px-4 py-2 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .floating-chat-icon {
          position: fixed;
          bottom: 24px;
          right: 110px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s ease;
          z-index: 40;
          animation: float 3s ease-in-out infinite;
        }

        .floating-chat-icon:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (max-width: 640px) {
          .floating-chat-icon {
            width: 56px;
            height: 56px;
            bottom: 16px;
            right: 90px;
          }
        }
      `}</style>
    </>
  );
};

export default FinancialChatbot;
