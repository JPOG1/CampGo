import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../../../shared/lib/api';

export function AdminSettings() {
  const [settings, setSettings] = useState({
    region: 'Lagos',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    min_fare: 500,
    per_km_rate: 200,
    per_minute_rate: 50,
    delivery_base_fee: 300,
    delivery_per_km: 150,
    commission_percentage: 15,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then((res) => {
      if (res.data) setSettings(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-2xl animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3 mb-6" /><div className="h-64 bg-gray-200 rounded" /></div>;

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Settings</h2>
      <div className="card space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Region</label>
            <input value={settings.region} onChange={(e) => setSettings({ ...settings, region: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
          </div>
          <div>
            <label className="block font-medium mb-1">Currency</label>
            <input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Timezone</label>
          <input value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
        </div>
        <hr />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1">Min Fare (₦)</label>
            <input type="number" value={settings.min_fare} onChange={(e) => setSettings({ ...settings, min_fare: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
          </div>
          <div>
            <label className="block font-medium mb-1">Per KM (₦)</label>
            <input type="number" value={settings.per_km_rate} onChange={(e) => setSettings({ ...settings, per_km_rate: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
          </div>
          <div>
            <label className="block font-medium mb-1">Per Minute (₦)</label>
            <input type="number" value={settings.per_minute_rate} onChange={(e) => setSettings({ ...settings, per_minute_rate: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Delivery Base Fee (₦)</label>
            <input type="number" value={settings.delivery_base_fee} onChange={(e) => setSettings({ ...settings, delivery_base_fee: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
          </div>
          <div>
            <label className="block font-medium mb-1">Delivery Per KM (₦)</label>
            <input type="number" value={settings.delivery_per_km} onChange={(e) => setSettings({ ...settings, delivery_per_km: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Platform Commission (%)</label>
          <input type="number" value={settings.commission_percentage} onChange={(e) => setSettings({ ...settings, commission_percentage: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
        </div>
        <div className="flex items-center justify-between">
          <div><p className="font-medium">Active</p><p className="text-sm text-gray-500">Enable this region</p></div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.is_active} onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
