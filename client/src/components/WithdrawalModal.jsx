import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const EMERGENCY_REASONS = [
  'Medical Emergency',
  'Job Loss',
  'Vehicle Repair',
  'Home Repair',
  'Family Emergency'
];

const NON_EMERGENCY_KEYWORDS = ['shopping', 'vacation', 'party', 'concert', 'trip', 'entertainment', 'fun', 'celebration'];

const WithdrawalModal = ({ isOpen, onClose, onSubmit, maxAmount }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [proof, setProof] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const checkForNonEmergencyKeywords = (text) => {
    const lowerText = text.toLowerCase();
    return NON_EMERGENCY_KEYWORDS.some(keyword => lowerText.includes(keyword));
  };

  const handleProofChange = (e) => {
    const newProof = e.target.value;
    setProof(newProof);
    
    if (newProof.length >= 20 && checkForNonEmergencyKeywords(newProof)) {
      setWarning("This doesn't sound like an emergency. Emergency funds are for unexpected urgent situations only.");
    } else {
      setWarning('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount > maxAmount) {
      setError('Insufficient balance in piggy bank');
      return;
    }

    if (!reason) {
      setError('Please select an emergency reason');
      return;
    }

    if (proof.length < 20) {
      setError('Please provide at least 20 characters explaining the emergency');
      return;
    }

    try {
      setSubmitting(true);
      const resultWarning = await onSubmit(numAmount, reason, proof);
      
      if (resultWarning) {
        setWarning(resultWarning);
      }
      
      setAmount('');
      setReason('');
      setProof('');
      setError('');
      setWarning('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setReason('');
    setProof('');
    setError('');
    setWarning('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">🚨 Emergency Withdrawal</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={16} />
            <p className="text-xs text-yellow-700">
              Emergency funds should only be used for unexpected urgent situations. Please provide details.
            </p>
          </div>
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
              className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available in piggy bank: ₹{maxAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              Emergency Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {EMERGENCY_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              Explain the Emergency (min 20 characters)
            </label>
            <textarea
              value={proof}
              onChange={handleProofChange}
              placeholder="Describe the emergency situation in detail..."
              rows={4}
              className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {proof.length}/20 characters minimum
            </p>
          </div>

          {warning && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-orange-600 mt-0.5" size={16} />
                <p className="text-xs text-orange-700 font-medium">{warning}</p>
              </div>
            </div>
          )}

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
              disabled={submitting || maxAmount === 0}
              className="flex-1 rounded-xl bg-red-600 text-white px-4 py-3 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalModal;
