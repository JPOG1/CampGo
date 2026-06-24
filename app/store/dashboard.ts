import { create } from 'zustand';
import type { DashboardMetrics } from '../shared/types';

interface DashboardState {
  metrics: DashboardMetrics | null;
  loading: boolean;
  setMetrics: (metrics: DashboardMetrics) => void;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  loading: false,
  setMetrics: (metrics) => set({ metrics }),
  setLoading: (loading) => set({ loading }),
}));
