import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

export function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/support/tickets', { subject, description });
      toast.success('Ticket created');
      setShowForm(false);
      setSubject('');
      setDescription('');
      fetchTickets();
    } catch {
      toast.error('Failed to create ticket');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Support</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          New Ticket
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <button type="submit" className="btn btn-primary">Submit Ticket</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">Loading...</div>
      ) : tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket: any) => (
            <div key={ticket.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{ticket.subject}</h4>
                <span className={`badge ${
                  ticket.status === 'OPEN' ? 'badge-warning' :
                  ticket.status === 'RESOLVED' ? 'badge-success' :
                  ticket.status === 'CLOSED' ? 'badge' : 'badge-warning'
                }`}>{ticket.status}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
              <p className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8 text-gray-500">No support tickets</div>
      )}
    </div>
  );
}
