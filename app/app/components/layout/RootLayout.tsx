import { Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { useEffect, Suspense } from 'react';
import { useAuthStore } from '../../../store/auth';
import api from '../../../shared/lib/api';
import { SidebarProvider } from './SidebarContext';

export function RootLayout() {
  const { setUser, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      const stored = localStorage.getItem('user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { logout(); }
      }
    }
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}>
        <SidebarProvider>
          <Outlet />
        </SidebarProvider>
      </Suspense>
    </>
  );
}
