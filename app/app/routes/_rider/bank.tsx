import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

const NIGERIAN_BANKS = [
  'Access Bank', 'Zenith Bank', 'First Bank', 'GTBank', 'UBA',
  'Opay', 'PalmPay', 'Moniepoint', 'Kuda Bank', 'Stanbic IBTC',
  'Fidelity Bank', 'Polaris Bank', 'Union Bank', 'Wema Bank', 'Sterling Bank',
];

export function RiderBank() {
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBank = async () => {
      try {
        const res = await api.get('/rider/bank-account');
        if (res.data) {
          setBankAccount(res.data);
          setBankName(res.data.bank_name || '');
          setAccountNumber(res.data.bank_account_number || '');
        }
      } catch (err) {
        console.error('Failed to fetch bank account:', err);
      }
    };
    fetchBank();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/rider/bank-account', { bank_account_number: accountNumber, bank_name: bankName });
      setBankAccount(res.data);
      toast.success('Bank account saved');
    } catch {
      toast.error('Failed to save bank account');
    } finally {
      setSaving(false);
    }
  };

  if (bankAccount?.bank_account_number) {
    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Bank Account</h2>
        <div className="card text-center py-8">
          <svg className="w-12 h-12 text-success mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Account Verified</h3>
          <p className="text-gray-600">{bankAccount.bank_name}</p>
          <p className="text-xl font-bold mt-1">{bankAccount.bank_account_number}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Bank Account</h2>
      <div className="card">
        <p className="text-sm text-gray-600 mb-6">Set up your bank account to receive payouts</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">Select bank</option>
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="0123456789"
              maxLength={10}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary w-full">
            {saving ? 'Saving...' : 'Save Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
