import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const STORAGE_KEY = 'smartfin_auth';

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
      console.error('API Error:', message);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response from server');
    } else {
      // Error setting up request
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const signup = async (payload) => {
  const res = await api.post('/auth/signup', payload);
  return res.data;
};

export const login = async (payload) => {
  const res = await api.post('/auth/login', payload);
  return res.data;
};

// Transaction + prediction endpoints (user derived from JWT)
export const createTransaction = async (data) => {
  const res = await api.post('/transactions', data);
  return res.data;
};

export const getTransactions = async () => {
  const res = await api.get('/transactions');
  return res.data;
};

export const getPrediction = async () => {
  const res = await api.post('/predict', {});
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/users/me');
  return res.data;
};

export const updateMe = async (payload) => {
  const res = await api.put('/users/me', payload);
  return res.data;
};

// Education endpoints
export const getArticles = async (params) => {
  const res = await api.get('/education/articles', { params });
  return res.data;
};

export const getArticleById = async (id) => {
  const res = await api.get(`/education/articles/${id}`);
  return res.data;
};

export const getTips = async (params) => {
  const res = await api.get('/education/tips', { params });
  return res.data;
};

export const getModules = async (params) => {
  const res = await api.get('/education/modules', { params });
  return res.data;
};

export const getModuleById = async (id) => {
  const res = await api.get(`/education/modules/${id}`);
  return res.data;
};

export const updateModuleProgress = async (moduleId, data) => {
  const res = await api.post(`/education/modules/${moduleId}/progress`, data);
  return res.data;
};

export const getLearningProgress = async () => {
  const res = await api.get('/education/progress');
  return res.data;
};

export const getRecommendations = async () => {
  const res = await api.get('/education/recommendations');
  return res.data;
};

// Budget endpoints
export const createBudget = async (data) => {
  const res = await api.post('/budgets', data);
  return res.data;
};

export const getBudgets = async (params) => {
  const res = await api.get('/budgets', { params });
  return res.data;
};

export const getBudgetById = async (id) => {
  const res = await api.get(`/budgets/${id}`);
  return res.data;
};

export const updateBudget = async (id, data) => {
  const res = await api.put(`/budgets/${id}`, data);
  return res.data;
};

export const getBudgetVariance = async (id) => {
  const res = await api.get(`/budgets/${id}/variance`);
  return res.data;
};

export const getBudgetTemplates = async () => {
  const res = await api.get('/budgets/templates');
  return res.data;
};

export const getCustomTemplates = async () => {
  const res = await api.get('/budgets/templates/custom');
  return res.data;
};

export const createCustomTemplate = async (data) => {
  const res = await api.post('/budgets/templates/custom', data);
  return res.data;
};

// Goal endpoints
export const createGoal = async (data) => {
  const res = await api.post('/goals', data);
  return res.data;
};

export const getGoals = async () => {
  const res = await api.get('/goals');
  return res.data;
};

export const updateGoal = async (id, data) => {
  const res = await api.put(`/goals/${id}`, data);
  return res.data;
};

export const deleteGoal = async (id) => {
  const res = await api.delete(`/goals/${id}`);
  return res.data;
};

// ML endpoints
export const getInsights = async () => {
  const res = await api.get('/insights');
  return res.data;
};

export const getMLBudgetRecommendation = async (data) => {
  const res = await api.post('/ml/recommend/budget', data);
  return res.data;
};

export const getXGBoostBudgetRecommendation = async (data) => {
  const res = await api.post('/ml/recommend/budget-xgboost', data);
  return res.data;
};

export const getForecast = async () => {
  const res = await api.get('/insights');
  return res.data.forecast || null;
};

export const getPeerComparison = async () => {
  const res = await api.get('/insights');
  return res.data.peerComparison || null;
};

// Notification endpoints
export const getNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data;
};

// Tip endpoints
export const markTipHelpful = async (id) => {
  const res = await api.post(`/tips/${id}/helpful`);
  return res.data;
};

// Piggy Bank endpoints
export const contributeToPiggyBank = async (data) => {
  const res = await api.post('/piggybank/contribute', data);
  return res.data;
};

export const withdrawFromPiggyBank = async (data) => {
  const res = await api.post('/piggybank/withdraw', data);
  return res.data;
};

export const getPiggyBankBalance = async () => {
  const res = await api.get('/piggybank/balance');
  return res.data;
};

export const getPiggyBankHistory = async (months = 4) => {
  const res = await api.get('/piggybank/history', { params: { months } });
  return res.data;
};

export const updatePiggyBankGoal = async (goal) => {
  const res = await api.put('/piggybank/goal', { goal });
  return res.data;
};

export const getPiggyBankAutoSuggest = async () => {
  const res = await api.get('/piggybank/auto-suggest');
  return res.data;
};

