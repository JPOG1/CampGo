import { Outlet, Navigate } from '@tanstack/react-router';
import { Suspense } from 'react';
import { useAuthStore } from '../../../store/auth';
import { VendorSidebar } from './VendorSidebar';
import { Header } from './Header';

export function VendorLayout() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return (
    <div className="flex h-screen bg-gray-50">
      <VendorSidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <Header />
        <main className="mt-16 flex-1 overflow-auto p-6">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
