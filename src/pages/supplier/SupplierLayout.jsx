import { Briefcase, Home, ReceiptText, User, Wallet } from 'lucide-solid';
import { DashboardLayout } from '../../layouts/DashboardLayout.jsx';

export const SUPPLIER_NAV = [
  {
    href: '/supplier',
    label: 'Home',
    shortLabel: 'Home',
    exact: true,
    icon: () => <Home class="w-4 h-4" />,
  },
  {
    href: '/supplier/orders',
    label: 'Order History',
    shortLabel: 'Orders',
    exact: false,
    icon: () => <ReceiptText class="w-4 h-4" />,
  },
  {
    href: '/supplier/products',
    label: 'Products',
    shortLabel: 'Products',
    exact: false,
    icon: () => <Briefcase class="w-4 h-4" />,
  },
  {
    href: '/supplier/earnings',
    label: 'Earnings',
    shortLabel: 'Earnings',
    exact: false,
    icon: () => <Wallet class="w-4 h-4" />,
  },
  {
    href: '/supplier/store',
    label: 'Profile',
    shortLabel: 'Profile',
    exact: false,
    icon: () => <User class="w-4 h-4" />,
  },
];

export function SupplierLayout(props) {
  return (
    <DashboardLayout
      navItems={SUPPLIER_NAV}
      title={props.title || 'Ride Hub Partner'}
      hideTopBar={props.hideTopBar}
      fullBleed={props.fullBleed}
      notificationsOpen={props.notificationsOpen}
      onCloseNotifications={props.onCloseNotifications}
    >
      {props.children}
    </DashboardLayout>
  );
}
