import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

export function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [topupAmount, setTopupAmount] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const [balanceRes, txnRes] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/wallet/transactions'),
        ]);
        setBalance(balanceRes.data.balance);
        setTransactions(txnRes.data);
      } catch (err) {
        console.error('Failed to fetch wallet:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const handleTopup = async (amount: number) => {
    try {
      const res = await api.post('/wallet/topup', { amount, method: 'CARD' });
      setBalance(res.data.balance);
      toast.success(`₦${amount.toLocaleString()} added to wallet`);
    } catch {
      toast.error('Topup failed');
    }
  };

  const quickAmounts = [1000, 5000, 10000];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h2>

      <div className="card mb-6 text-center py-8">
        <p className="text-sm text-gray-500 mb-2">Available Balance</p>
        {loading ? (
          <div className="h-10 bg-gray-200 animate-pulse rounded mx-auto max-w-[200px]" />
        ) : (
          <p className="text-4xl font-bold text-primary">₦{balance.toLocaleString()}</p>
        )}
      </div>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Top Up</h3>
        <div className="flex gap-3 mb-4">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleTopup(amount)}
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                topupAmount === amount ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              ₦{amount.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            value={topupAmount || ''}
            onChange={(e) => setTopupAmount(Number(e.target.value))}
            placeholder="Custom amount"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <button onClick={() => topupAmount > 0 && handleTopup(topupAmount)} className="btn btn-primary">
            Add
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((txn: any) => (
              <div key={txn.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    txn.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-4 h-4 ${txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={txn.type === 'CREDIT' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-semibold ${txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type === 'CREDIT' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
