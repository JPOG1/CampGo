import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

export function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [reportType, setReportType] = useState('revenue');

  useEffect(() => {
    api.get('/admin/reports').then((res) => {
      if (Array.isArray(res.data)) setReports(res.data);
    }).catch(() => {});
  }, []);

  const quickReports = [
    { label: 'Revenue Report', key: 'revenue', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Rides Report', key: 'rides', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { label: 'Users Report', key: 'users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
    { label: 'Payments Report', key: 'payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'Food Orders Report', key: 'food', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
  ];

  const handleGenerateReport = async (type: string) => {
    try {
      await api.post('/admin/reports/generate', { type, dateRange });
      toast.success(`${type} generation started`);
      const res = await api.get('/admin/reports');
      if (Array.isArray(res.data)) setReports(res.data);
    } catch {
      toast.error('Failed to generate report');
    }
  };

  const handleExport = async (format: string) => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Please select date range');
      return;
    }
    try {
      await api.post('/admin/reports/export', { dateRange, format, type: reportType });
      toast.success(`Export started (${format})`);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports & Exports</h2>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Export Data</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
            >
              <option value="revenue">Revenue</option>
              <option value="rides">Rides</option>
              <option value="users">Users</option>
              <option value="payments">Payments</option>
              <option value="food">Food Orders</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="px-4 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="px-4 py-2 rounded-lg border border-gray-300" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleExport('CSV')} className="btn btn-primary">Export CSV</button>
          <button onClick={() => handleExport('XLSX')} className="btn btn-secondary">Export XLSX</button>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Quick Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickReports.map((report) => (
            <button
              key={report.label}
              onClick={() => handleGenerateReport(report.label)}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={report.icon} />
              </svg>
              <span className="font-medium">{report.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report: any) => (
              <div key={report.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium">{report.name || report.type || 'Report'}</p>
                  <p className="text-sm text-gray-500">{report.created_at ? new Date(report.created_at).toLocaleDateString() : '-'}</p>
                </div>
                <button className="text-primary hover:underline text-sm">Download</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No reports generated yet</p>
        )}
      </div>
    </div>
  );
}
