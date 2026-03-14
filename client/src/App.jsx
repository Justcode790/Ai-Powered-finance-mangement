
// export default App;

import React from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PiggyBank, LineChart, Wallet, LayoutDashboard, LogOut, BookOpen, Calculator, Target } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ExpenseTracker from './pages/ExpenseTracker';
import Insights from './pages/Insights';
import EducationDashboard from './pages/EducationDashboard';
import BudgetManager from './pages/BudgetManager';
import GoalTracker from './pages/GoalTracker';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const AppShell = ({ children }) => {
  const { isAuthenticated, name, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ease-in-out ${
      isActive
        ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-200'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const showShell = !['/login', '/signup', '/'].includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!showShell) {
    return children;
  }

  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      <aside className="w-72 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="px-8 py-8 flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg">
            <PiggyBank className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-gray-900">SmartVault</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600">
              Youth Mentor
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 text-sm font-medium">
          <NavLink to="/dashboard" end className={navClass}>
            <LayoutDashboard size={20} className="transition-transform group-hover:scale-110" />
            Dashboard
          </NavLink>

          <NavLink to="/tracker" className={navClass}>
            <Wallet size={20} className="transition-transform group-hover:scale-110" />
            Expense Tracker
          </NavLink>

          <NavLink to="/education" className={navClass}>
            <BookOpen size={20} className="transition-transform group-hover:scale-110" />
            Education
          </NavLink>

          <NavLink to="/budget" className={navClass}>
            <Calculator size={20} className="transition-transform group-hover:scale-110" />
            Budget Manager
          </NavLink>

          <NavLink to="/goals" className={navClass}>
            <Target size={20} className="transition-transform group-hover:scale-110" />
            Goals
          </NavLink>

          <NavLink to="/insights" className={navClass}>
            <LineChart size={20} className="transition-transform group-hover:scale-110" />
            Smart Insights
          </NavLink>
        </nav>

        {isAuthenticated && (
          <div className="p-4 m-4 rounded-2xl bg-gray-100 border border-gray-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">
                    {name || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-500">Logged in</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative bg-white">
        <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <PiggyBank className="text-blue-600" size={24} />
            <span className="text-sm font-bold tracking-tight text-gray-900">SmartVault</span>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracker"
        element={
          <ProtectedRoute>
            <ExpenseTracker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/education"
        element={
          <ProtectedRoute>
            <EducationDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budget"
        element={
          <ProtectedRoute>
            <BudgetManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <GoalTracker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        }
      />
    </Routes>
  </AppShell>
);

export default App;