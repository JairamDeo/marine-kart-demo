import {
  LayoutDashboard,
  ShoppingCart,
  UserCircle,
} from 'lucide-react';
import PortalShell from '../../components/portal/PortalShell';

const navItems = [
  { to: '/account', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/account/orders', label: 'My Orders', icon: ShoppingCart },
  { to: '/account/profile', label: 'My Profile', icon: UserCircle },
];

export default function CorporateLayout() {
  return (
    <PortalShell
      title="My Account"
      navItems={navItems}
      loginPath="/login?type=corporate"
      variant="corporate"
      homePath="/"
    />
  );
}
