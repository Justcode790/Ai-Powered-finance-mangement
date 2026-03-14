import { useState } from 'react';
import { X } from 'lucide-react';

const ContributionModal = ({ isOpen, onClose, onSubmit, maxAmount }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount < 1) {
      setError('Minimum contribution is ₹1');
      return;
    }

    if (numAmount > maxAmount) {
      setError('Insufficient funds in spending account');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(numAmount);
      setAmount('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add money');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">🐷 Add to Piggy Bank</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              step="1"
              className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Available in spending account: ₹{maxAmount.toLocaleString()}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl bg-gray-100 text-gray-700 px-4 py-3 text-sm font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-pink-600 text-white px-4 py-3 text-sm font-semibold hover:bg-pink-700 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add to Piggy Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContributionModal;
