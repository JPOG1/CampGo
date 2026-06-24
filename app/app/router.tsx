import { createRouter, createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { useAuthStore } from '../store/auth';

const LoginPage = lazy(() => import('./routes/login').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./routes/register').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./routes/forgot-password').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./routes/reset-password').then(m => ({ default: m.ResetPasswordPage })));

const CustomerDashboard = lazy(() => import('./routes/_customer/dashboard').then(m => ({ default: m.CustomerDashboard })));
const RidesPage = lazy(() => import('./routes/_customer/rides').then(m => ({ default: m.RidesPage })));
const WalletPage = lazy(() => import('./routes/_customer/wallet').then(m => ({ default: m.WalletPage })));
const ProfilePage = lazy(() => import('./routes/_customer/profile').then(m => ({ default: m.ProfilePage })));
const SupportPage = lazy(() => import('./routes/_customer/support').then(m => ({ default: m.SupportPage })));
const RestaurantsPage = lazy(() => import('./routes/_customer/restaurants').then(m => ({ default: m.RestaurantsPage })));
const RestaurantDetailPage = lazy(() => import('./routes/_customer/restaurants.$id').then(m => ({ default: m.RestaurantDetailPage })));
const CartPage = lazy(() => import('./routes/_customer/cart').then(m => ({ default: m.CartPage })));
const OrdersPage = lazy(() => import('./routes/_customer/orders').then(m => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('./routes/_customer/orders.$id').then(m => ({ default: m.OrderDetailPage })));

const RiderDashboard = lazy(() => import('./routes/_rider/dashboard').then(m => ({ default: m.RiderDashboard })));
const RiderEarnings = lazy(() => import('./routes/_rider/earnings').then(m => ({ default: m.RiderEarnings })));
const RiderBank = lazy(() => import('./routes/_rider/bank').then(m => ({ default: m.RiderBank })));

const AdminDashboard = lazy(() => import('./routes/_admin/dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./routes/_admin/users').then(m => ({ default: m.AdminUsers })));
const AdminRides = lazy(() => import('./routes/_admin/rides').then(m => ({ default: m.AdminRides })));
const AdminPayments = lazy(() => import('./routes/_admin/payments').then(m => ({ default: m.AdminPayments })));
const AdminAnalytics = lazy(() => import('./routes/_admin/analytics').then(m => ({ default: m.AdminAnalytics })));
const AdminReports = lazy(() => import('./routes/_admin/reports').then(m => ({ default: m.AdminReports })));
const AdminFraud = lazy(() => import('./routes/_admin/fraud').then(m => ({ default: m.AdminFraud })));
const AdminSettings = lazy(() => import('./routes/_admin/settings').then(m => ({ default: m.AdminSettings })));
const AdminFoodOrders = lazy(() => import('./routes/_admin/food-orders').then(m => ({ default: m.AdminFoodOrders })));

import { RootLayout } from './components/layout/RootLayout';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { RiderLayout } from './components/layout/RiderLayout';
import { AdminLayout } from './components/layout/AdminLayout';

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: '/login' });
    if (user?.role === 'ADMIN') throw redirect({ to: '/admin/dashboard' });
    if (user?.role === 'RIDER') throw redirect({ to: '/rider/dashboard' });
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPasswordPage,
});

const customerLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'customer',
  component: CustomerLayout,
});

const customerDashboardRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/dashboard',
  component: CustomerDashboard,
});

const ridesRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/rides',
  component: RidesPage,
});

const walletRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/wallet',
  component: WalletPage,
});

const profileRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/profile',
  component: ProfilePage,
});

const supportRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/support',
  component: SupportPage,
});

const restaurantsRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/restaurants',
  component: RestaurantsPage,
});

const restaurantDetailRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/restaurants/$id',
  component: RestaurantDetailPage,
});

const cartRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/cart',
  component: CartPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/orders',
  component: OrdersPage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/orders/$id',
  component: OrderDetailPage,
});

const riderLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'rider',
  component: RiderLayout,
});

const riderDashboardRoute = createRoute({
  getParentRoute: () => riderLayoutRoute,
  path: '/rider/dashboard',
  component: RiderDashboard,
});

const riderEarningsRoute = createRoute({
  getParentRoute: () => riderLayoutRoute,
  path: '/rider/earnings',
  component: RiderEarnings,
});

const riderBankRoute = createRoute({
  getParentRoute: () => riderLayoutRoute,
  path: '/rider/bank',
  component: RiderBank,
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin',
  component: AdminLayout,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/dashboard',
  component: AdminDashboard,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/users',
  component: AdminUsers,
});

const adminRidesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/rides',
  component: AdminRides,
});

const adminPaymentsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/payments',
  component: AdminPayments,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/analytics',
  component: AdminAnalytics,
});

const adminReportsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/reports',
  component: AdminReports,
});

const adminFraudRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/fraud',
  component: AdminFraud,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/settings',
  component: AdminSettings,
});

const adminFoodOrdersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/food-orders',
  component: AdminFoodOrders,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  customerLayoutRoute.addChildren([
    customerDashboardRoute,
    ridesRoute,
    walletRoute,
    profileRoute,
    supportRoute,
    restaurantsRoute,
    restaurantDetailRoute,
    cartRoute,
    ordersRoute,
    orderDetailRoute,
  ]),
  riderLayoutRoute.addChildren([
    riderDashboardRoute,
    riderEarningsRoute,
    riderBankRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminUsersRoute,
    adminRidesRoute,
    adminPaymentsRoute,
    adminAnalyticsRoute,
    adminReportsRoute,
    adminFraudRoute,
    adminSettingsRoute,
    adminFoodOrdersRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
