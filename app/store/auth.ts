import { create } from 'zustand';
import type { User } from '../shared/types';
import api from '../shared/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { first_name: string; last_name: string; email: string; phone: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { first_name?: string; last_name?: string; email?: string; profile_image_url?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (emailOrPhone: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  setTimeout(() => {
    get().initializeAuth();
  }, 0);

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    login: async (phone, password) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.post('/auth/login', { phone, password });
        const { access_token, refresh_token, user } = res.data;
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.detail || err.response?.data?.message || 'Login failed', isLoading: false });
        throw err;
      }
    },

    register: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.post('/auth/register', data);
        const { access_token, refresh_token, user } = res.data;
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Registration failed', isLoading: false });
        throw err;
      }
    },

    logout: () => {
      localStorage.clear();
      set({ user: null, isAuthenticated: false, error: null });
    },

    fetchProfile: async () => {
      try {
        const res = await api.get('/auth/me');
        const { user } = res.data;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
      } catch {
        localStorage.clear();
        set({ user: null, isAuthenticated: false });
      }
    },

    updateProfile: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.put('/auth/profile', data);
        const { user } = res.data;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isLoading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Update failed', isLoading: false });
        throw err;
      }
    },

    changePassword: async (currentPassword, newPassword) => {
      set({ isLoading: true, error: null });
      try {
        await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
        set({ isLoading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Change password failed', isLoading: false });
        throw err;
      }
    },

    forgotPassword: async (emailOrPhone) => {
      set({ isLoading: true, error: null });
      try {
        const body = emailOrPhone.includes('@') ? { email: emailOrPhone } : { phone: emailOrPhone };
        await api.post('/auth/forgot-password', body);
        set({ isLoading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Request failed', isLoading: false });
        throw err;
      }
    },

    resetPassword: async (token, password) => {
      set({ isLoading: true, error: null });
      try {
        await api.post('/auth/reset-password', { token, password });
        set({ isLoading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Reset failed', isLoading: false });
        throw err;
      }
    },

    sendVerificationEmail: async () => {
      set({ isLoading: true, error: null });
      try {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');
        await api.post('/auth/send-verification-email', { user_id: user.id });
        set({ isLoading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Failed to send verification email', isLoading: false });
        throw err;
      }
    },

    initializeAuth: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      set({ isLoading: true });
      try {
        const res = await api.get('/auth/me');
        const { user } = res.data;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.clear();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    },
  };
});
