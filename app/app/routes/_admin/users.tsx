import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';
import { DataTable } from '../../components/common/DataTable';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleStatus = async (user: any) => {
    setToggling(user.id);
    try {
      await api.put(`/admin/users/${user.id}/status`, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast.success(`${user.first_name} ${user.last_name} ${user.is_active ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setToggling(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (_: any, row: any) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '-' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (v: string) => {
      const colors: Record<string, string> = { ADMIN: 'badge', RIDER: 'badge-warning', VENDOR: 'badge-info', CUSTOMER: 'badge-success' };
      return <span className={`badge ${colors[v] || 'badge'}`}>{v}</span>;
    }},
    { key: 'is_active', label: 'Status', render: (v: boolean) => <span className={`badge ${v ? 'badge-success' : 'badge-error'}`}>{v ? 'Active' : 'Inactive'}</span> },
    { key: 'created_at', label: 'Created', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'actions', label: 'Actions', render: (_: any, row: any) => (
      <button
        onClick={() => toggleStatus(row)}
        disabled={toggling === row.id}
        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
          row.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
        } disabled:opacity-50`}
      >
        {toggling === row.id ? '...' : row.is_active ? 'Deactivate' : 'Activate'}
      </button>
    )},
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Users Management</h2>
      <p className="text-gray-600 mb-6">Manage customers, riders, and vendors</p>
      <div className="card">
        <DataTable columns={columns} data={users} />
      </div>
    </div>
  );
}
