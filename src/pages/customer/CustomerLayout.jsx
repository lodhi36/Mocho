import { Home, ShoppingCart, ReceiptText, User } from 'lucide-solid';
import { DashboardLayout } from '../../layouts/DashboardLayout.jsx';

export const CUSTOMER_NAV = [
  {
    href: '/customer',
    label: 'Home',
    shortLabel: 'Home',
    exact: true,
    icon: () => <Home class="w-5 h-5" />,
  },
  {
    href: '/customer/cart',
    label: 'Cart',
    shortLabel: 'Cart',
    exact: false,
    icon: () => <ShoppingCart class="w-5 h-5" />,
  },
  {
    href: '/customer/orders',
    label: 'Orders',
    shortLabel: 'Orders',
    exact: false,
    icon: () => <ReceiptText class="w-5 h-5" />,
  },
  {
    href: '/customer/account',
    label: 'Profile',
    shortLabel: 'Profile',
    exact: false,
    icon: () => <User class="w-5 h-5" />,
  },
];

export function CustomerLayout(props) {
  return (
    <DashboardLayout
      navItems={CUSTOMER_NAV}
      title={props.title || 'Ride Hub'}
      hideTopBar={props.hideTopBar}
      fullBleed={props.fullBleed}
      notificationsOpen={props.notificationsOpen}
      onCloseNotifications={props.onCloseNotifications}
    >
      {props.children}
    </DashboardLayout>
  );
}
