import { Outlet, Navigate } from '@tanstack/react-router';
import { Suspense } from 'react';
import { useAuthStore } from '../../../store/auth';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export function AdminLayout() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || user?.role !== 'ADMIN') return <Navigate to="/login" />;
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-0 lg:ml-64">
        <AdminHeader />
        <main className="mt-16 flex-1 overflow-auto p-4 lg:p-6">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
