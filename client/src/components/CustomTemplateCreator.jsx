import React, { useState } from 'react';
import { createCustomTemplate, getCustomTemplates } from '../services/api';
import { Save, Plus } from 'lucide-react';

const CustomTemplateCreator = ({ currentBudget, onTemplateCreated }) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);

  useEffect(() => {
    loadCustomTemplates();
  }, []);

  const loadCustomTemplates = async () => {
    try {
      const data = await getCustomTemplates();
      setCustomTemplates(data.templates || []);
    } catch (err) {
      console.error('Error loading custom templates:', err);
    }
  };

  const handleCreateTemplate = async () => {
    if (!currentBudget) {
      alert('No budget selected to save as template');
      return;
    }

    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      setLoading(true);
      
      // Convert budget amounts to percentages
      const totalBudget = currentBudget.totalBudget || 1;
      const categoryPercentages = {};
      
      Object.entries(currentBudget.categoryAllocations).forEach(([category, amount]) => {
        categoryPercentages[category] = Math.round((amount / totalBudget) * 100);
      });

      await createCustomTemplate({
        name: name.trim(),
        description: description.trim() || `Custom template based on ${new Date().toLocaleDateString()} budget`,
        categoryPercentages
      });

      setShowForm(false);
      setName('');
      setDescription('');
      
      if (onTemplateCreated) {
        onTemplateCreated();
      }
      
      await loadCustomTemplates();
    } catch (err) {
      console.error('Error creating template:', err);
      alert('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Custom Templates List */}
      {customTemplates.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-200 mb-3">Your Custom Templates</p>
          <div className="space-y-2">
            {customTemplates.map((template) => (
              <div
                key={template._id}
                className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl"
              >
                <p className="text-sm font-medium text-slate-200">{template.name}</p>
                <p className="text-xs text-slate-400">{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Template Button */}
      {!showForm && currentBudget && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 hover:border-emerald-500/30 transition-colors"
        >
          <Plus size={16} />
          Save Current Budget as Template
        </button>
      )}

      {/* Create Template Form */}
      {showForm && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-slate-200">Create Custom Template</p>
          
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Monthly Budget"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when to use this template..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreateTemplate}
              disabled={loading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Template'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setName('');
                setDescription('');
              }}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTemplateCreator;
