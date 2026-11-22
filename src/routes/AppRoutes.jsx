import { Navigate, Route, Router } from '@solidjs/router';
import { ROLE_HOME_ROUTES, ROLES } from '../constants/config.js';
import { currentUser } from '../stores/authStore.js';
import { RoleGuard } from './RoleGuard.jsx';

import { LoginPage } from '../pages/auth/LoginPage.jsx';

import { CustomerHome } from '../pages/customer/CustomerHome.jsx';
import { CategoryPage } from '../pages/customer/CategoryPage.jsx';
import { StoreDetailPage } from '../pages/customer/StoreDetailPage.jsx';
import { ProductDetailPage } from '../pages/customer/ProductDetailPage.jsx';
import { CartCheckoutPage } from '../pages/customer/CartCheckoutPage.jsx';
import { CustomerOrdersPage } from '../pages/customer/CustomerOrdersPage.jsx';
import { CustomerAccountPage } from '../pages/customer/CustomerAccountPage.jsx';
import { CustomerNotificationsPage } from '../pages/customer/CustomerNotificationsPage.jsx';
import { LocationPickerPage } from '../pages/customer/LocationPickerPage.jsx';

import { SupplierDashboard } from '../pages/supplier/SupplierDashboard.jsx';
import { SupplierOrdersPage } from '../pages/supplier/SupplierOrdersPage.jsx';
import { SupplierProductsPage } from '../pages/supplier/SupplierProductsPage.jsx';
import { SupplierStorePage } from '../pages/supplier/SupplierStorePage.jsx';
import { SupplierEarningsPage } from '../pages/supplier/SupplierEarningsPage.jsx';

import { RiderDashboard } from '../pages/rider/RiderDashboard.jsx';
import { RiderDeliveriesPage } from '../pages/rider/RiderDeliveriesPage.jsx';
import { RiderEarningsPage } from '../pages/rider/RiderEarningsPage.jsx';
import { RiderProfilePage } from '../pages/rider/RiderProfilePage.jsx';

function RootRedirect() {
  const user = currentUser();
  if (user && ROLE_HOME_ROUTES[user.role]) {
    return <Navigate href={ROLE_HOME_ROUTES[user.role]} />;
  }
  return <Navigate href="/login" />;
}

export function AppRoutes() {
  return (
    <Router>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={() => <Navigate href="/login" />} />

      {/* Customer Routes */}
      <Route
        path="/customer"
        component={() => (
          <RoleGuard allowedRole={ROLES.CUSTOMER}>
            <CustomerHome />
          </RoleGuard>
        )}
      />
      <Route
        path="/customer/category/:slug"
        component={() => (
          <RoleGuard allowedRole={ROLES.CUSTOMER}>
            <CategoryPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/customer/store/:storeId"
        component={() => (
          <RoleGuard allowedRole={ROLES.CUSTOMER}>
            <StoreDetailPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/customer/product/:productId"
        component={() => (
          <RoleGuard allowedRole={ROLES.CUSTOMER}>
            <ProductDetailPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/customer/cart"
        component={() => (
          <RoleGuard allowedRole={ROLES.CUSTOMER}>
            <CartCheckoutPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/customer/orders"
        component={() => (
          <RoleGuard allowedRole={ROLES.CUSTOMER}>
            <CustomerOrdersPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/customer/account"
        component={() => (
          <RoleGuard allowedRole={ROLES.CUSTOMER}>
            <CustomerAccountPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/customer/notifications"
        component={() => (
          <RoleGuard allowedRole={ROLES.CUSTOMER}>
            <CustomerNotificationsPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/customer/location"
        component={() => (
          <RoleGuard allowedRole={ROLES.CUSTOMER}>
            <LocationPickerPage />
          </RoleGuard>
        )}
      />

      {/* Supplier Routes */}
      <Route
        path="/supplier"
        component={() => (
          <RoleGuard allowedRole={ROLES.SUPPLIER}>
            <SupplierDashboard />
          </RoleGuard>
        )}
      />
      <Route
        path="/supplier/orders"
        component={() => (
          <RoleGuard allowedRole={ROLES.SUPPLIER}>
            <SupplierOrdersPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/supplier/products"
        component={() => (
          <RoleGuard allowedRole={ROLES.SUPPLIER}>
            <SupplierProductsPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/supplier/store"
        component={() => (
          <RoleGuard allowedRole={ROLES.SUPPLIER}>
            <SupplierStorePage />
          </RoleGuard>
        )}
      />
      <Route
        path="/supplier/earnings"
        component={() => (
          <RoleGuard allowedRole={ROLES.SUPPLIER}>
            <SupplierEarningsPage />
          </RoleGuard>
        )}
      />

      {/* Rider Routes */}
      <Route
        path="/rider"
        component={() => (
          <RoleGuard allowedRole={ROLES.RIDER}>
            <RiderDashboard />
          </RoleGuard>
        )}
      />
      <Route
        path="/rider/deliveries"
        component={() => (
          <RoleGuard allowedRole={ROLES.RIDER}>
            <RiderDeliveriesPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/rider/earnings"
        component={() => (
          <RoleGuard allowedRole={ROLES.RIDER}>
            <RiderEarningsPage />
          </RoleGuard>
        )}
      />
      <Route
        path="/rider/profile"
        component={() => (
          <RoleGuard allowedRole={ROLES.RIDER}>
            <RiderProfilePage />
          </RoleGuard>
        )}
      />

      {/* Fallback */}
      <Route path="*404" component={RootRedirect} />
    </Router>
  );
}
