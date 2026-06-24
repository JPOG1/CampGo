import { useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = async () => {
    try {
      const res = await api.patch('/users/profile', { first_name: firstName, last_name: lastName, email });
      setUser(res.data);
      setEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{user?.first_name} {user?.last_name}</h3>
            <span className="badge badge-success">{user?.role}</span>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="btn btn-primary">Save</button>
              <button onClick={() => setEditing(false)} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{user?.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="font-medium">{user?.rating || 'N/A'}</p>
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="btn btn-outline">Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}
