import { useNavigate } from 'react-router-dom';
import { TrendingUp, Calculator, Lightbulb, PiggyBank, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: 'Track Spending Habits',
      description: 'Analyze your spending patterns and identify unusual transactions with AI-powered insights',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      route: '/tracker'
    },
    {
      icon: Calculator,
      title: 'Suggest Budgeting Plans',
      description: 'Get personalized budget recommendations based on your income, expenses, and financial goals',
      color: 'bg-green-50 border-green-200 hover:border-green-400',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      route: '/budget'
    },
    {
      icon: Lightbulb,
      title: 'Financial Education Tips',
      description: 'Learn smart money habits with personalized tips, articles, and interactive learning modules',
      color: 'bg-amber-50 border-amber-200 hover:border-amber-400',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      route: '/education'
    },
    {
      icon: PiggyBank,
      title: 'Predict Monthly Savings',
      description: 'Forecast your potential savings and get actionable suggestions to reach your financial goals',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      route: '/insights'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg">
              <PiggyBank className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            SmartVault
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-2">
            Your AI-Powered Financial Mentor
          </p>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto">
            Make smarter financial decisions with machine learning insights tailored for young professionals
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">
          Powerful Financial Tools
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Choose a feature below to start managing your finances smarter
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`${feature.color} border-2 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer`}
                onClick={() => navigate(feature.route)}
              >
                <div className={`${feature.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={feature.iconColor} size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <button className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Try Now
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 py-16 px-6 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-blue-50 text-lg mb-8">
            Join thousands of young professionals building better financial habits
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Get Started Free
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600 text-sm">
            © 2026 SmartVault. Empowering financial literacy for youth.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
