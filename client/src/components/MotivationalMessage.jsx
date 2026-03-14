import { useEffect } from 'react';
import { CheckCircle, TrendingUp, Award } from 'lucide-react';

const MotivationalMessage = ({ message, type = 'success', onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getIcon = () => {
    if (type === 'streak') return <TrendingUp className="text-orange-600" size={20} />;
    if (type === 'milestone') return <Award className="text-purple-600" size={20} />;
    return <CheckCircle className="text-green-600" size={20} />;
  };

  const getBgColor = () => {
    if (type === 'streak') return 'bg-orange-50 border-orange-200';
    if (type === 'milestone') return 'bg-purple-50 border-purple-200';
    return 'bg-green-50 border-green-200';
  };

  const getTextColor = () => {
    if (type === 'streak') return 'text-orange-700';
    if (type === 'milestone') return 'text-purple-700';
    return 'text-green-700';
  };

  return (
    <div className={`card ${getBgColor()} animate-fade-in`}>
      <div className="flex items-center gap-3">
        {getIcon()}
        <p className={`text-sm font-bold ${getTextColor()}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default MotivationalMessage;
