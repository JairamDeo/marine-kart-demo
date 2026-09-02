import {
  LayoutDashboard,
  Package,
  FolderTree,
  Layers,
  ShoppingCart,
  Users,
  PackageSearch,
} from 'lucide-react';
import PortalShell from '../../components/portal/PortalShell';

const navItems = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/other-products', label: 'Other Product', icon: PackageSearch },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/subcategories', label: 'Subcategories', icon: Layers },
  { to: '/admin/customers', label: 'Customers', icon: Users },
];

export default function AdminLayout() {
  return (
    <PortalShell
      navItems={navItems}
      loginPath="/admin-login"
    />
  );
}
