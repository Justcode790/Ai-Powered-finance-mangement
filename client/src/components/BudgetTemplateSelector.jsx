import React, { useEffect, useState } from 'react';
import { getBudgetTemplates } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Users, TrendingUp } from 'lucide-react';

const BudgetTemplateSelector = ({ onSelect }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getBudgetTemplates();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    if (onSelect) {
      onSelect(template);
    }
  };

  const calculatePreview = (template) => {
    const income = user.income || 0;
    const preview = {};
    
    Object.entries(template.categoryPercentages).forEach(([category, percentage]) => {
      preview[category] = Math.round((percentage / 100) * income);
    });
    
    return preview;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-400">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-200">Choose a Template</p>
      
      <div className="space-y-3">
        {templates.map((template) => {
          const preview = calculatePreview(template);
          const isSelected = selectedTemplate?._id === template._id;
          
          return (
            <div
              key={template._id}
              onClick={() => handleSelectTemplate(template)}
              className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <FileText className="text-emerald-400 flex-shrink-0 mt-1" size={18} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-200">{template.name}</p>
                    {template.usageCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Users size={12} />
                        {template.usageCount} uses
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{template.description}</p>
                  <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400 capitalize">
                    {template.targetUser}
                  </span>
                </div>
              </div>

              {/* Category Percentages */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(template.categoryPercentages).map(([category, percentage]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2"
                  >
                    <span className="text-slate-300 capitalize">{category}</span>
                    <span className="text-slate-100 font-medium">{percentage}%</span>
                  </div>
                ))}
              </div>

              {/* Preview with User's Income */}
              {user.income > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-xs text-slate-400 mb-2">
                    Preview for your income (₹{user.income.toLocaleString()})
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(preview).map(([category, amount]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-slate-400 capitalize">{category}</span>
                        <span className="text-slate-200 font-medium">₹{amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">No templates available</p>
        </div>
      )}
    </div>
  );
};

export default BudgetTemplateSelector;
