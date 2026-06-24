import { createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router';
import { lazy } from 'react';
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
const MarketplacePage = lazy(() => import('./routes/_customer/marketplace').then(m => ({ default: m.MarketplacePage })));
const ShopDetailPage = lazy(() => import('./routes/_customer/marketplace.$id').then(m => ({ default: m.ShopDetailPage })));
const ShopCartPage = lazy(() => import('./routes/_customer/shop-cart').then(m => ({ default: m.ShopCartPage })));

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

const VendorDashboard = lazy(() => import('./routes/_vendor/dashboard').then(m => ({ default: m.VendorDashboard })));
const VendorMenu = lazy(() => import('./routes/_vendor/menu').then(m => ({ default: m.VendorMenu })));
const VendorOrders = lazy(() => import('./routes/_vendor/orders').then(m => ({ default: m.VendorOrders })));
const VendorRestaurant = lazy(() => import('./routes/_vendor/restaurant').then(m => ({ default: m.VendorRestaurant })));
const MyShopPage = lazy(() => import('./routes/_vendor/my-shop').then(m => ({ default: m.MyShopPage })));
const ManageProductsPage = lazy(() => import('./routes/_vendor/manage-products').then(m => ({ default: m.ManageProductsPage })));
const ShopOrdersPage = lazy(() => import('./routes/_vendor/shop-orders').then(m => ({ default: m.ShopOrdersPage })));

import { RootLayout } from './components/layout/RootLayout';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { RiderLayout } from './components/layout/RiderLayout';
import { VendorLayout } from './components/layout/VendorLayout';
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
    if (user?.role === 'VENDOR') throw redirect({ to: '/vendor/dashboard' });
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

const marketplaceRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/marketplace',
  component: MarketplacePage,
});

const marketplaceDetailRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/marketplace/$id',
  component: ShopDetailPage,
});

const shopCartRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: '/shop-cart',
  component: ShopCartPage,
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

const vendorLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'vendor',
  component: VendorLayout,
});

const vendorDashboardRoute = createRoute({
  getParentRoute: () => vendorLayoutRoute,
  path: '/vendor/dashboard',
  component: VendorDashboard,
});

const vendorMenuRoute = createRoute({
  getParentRoute: () => vendorLayoutRoute,
  path: '/vendor/menu',
  component: VendorMenu,
});

const vendorOrdersRoute = createRoute({
  getParentRoute: () => vendorLayoutRoute,
  path: '/vendor/orders',
  component: VendorOrders,
});

const vendorRestaurantRoute = createRoute({
  getParentRoute: () => vendorLayoutRoute,
  path: '/vendor/restaurant',
  component: VendorRestaurant,
});

const vendorShopRoute = createRoute({
  getParentRoute: () => vendorLayoutRoute,
  path: '/vendor/my-shop',
  component: MyShopPage,
});

const vendorProductsRoute = createRoute({
  getParentRoute: () => vendorLayoutRoute,
  path: '/vendor/manage-products',
  component: ManageProductsPage,
});

const vendorShopOrdersRoute = createRoute({
  getParentRoute: () => vendorLayoutRoute,
  path: '/vendor/shop-orders',
  component: ShopOrdersPage,
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
    marketplaceRoute,
    marketplaceDetailRoute,
    shopCartRoute,
    cartRoute,
    ordersRoute,
    orderDetailRoute,
  ]),
  riderLayoutRoute.addChildren([
    riderDashboardRoute,
    riderEarningsRoute,
    riderBankRoute,
  ]),
  vendorLayoutRoute.addChildren([
    vendorDashboardRoute,
    vendorMenuRoute,
    vendorOrdersRoute,
    vendorRestaurantRoute,
    vendorShopRoute,
    vendorProductsRoute,
    vendorShopOrdersRoute,
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
