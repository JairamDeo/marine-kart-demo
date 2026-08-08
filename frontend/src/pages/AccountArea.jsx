import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CorporateLayout from './corporate/CorporateLayout';
import CorporateDashboard from './corporate/CorporateDashboard';
import CorporateOrders from './corporate/CorporateOrders';
import CorporateAccount from './corporate/CorporateAccount';
import CustomerLayout from './customer/CustomerLayout';
import CustomerDashboard from './customer/CustomerDashboard';
import CustomerOrders from './customer/CustomerOrders';
import CustomerAccount from './customer/CustomerAccount';

function isCorporateRole(role) {
  return role === 'corporate' || role === 'dealer';
}

/**
 * /account console for both normal and corporate customers.
 * Same portal architecture: Dashboard · My Orders · My Profile.
 */
export default function AccountArea() {
  const { user } = useAuth();

  if (isCorporateRole(user?.role)) {
    return (
      <Routes>
        <Route element={<CorporateLayout />}>
          <Route index element={<CorporateDashboard />} />
          <Route path="orders" element={<CorporateOrders />} />
          <Route path="profile" element={<CorporateAccount />} />
          <Route path="*" element={<Navigate to="/account" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<CustomerDashboard />} />
        <Route path="orders" element={<CustomerOrders />} />
        <Route path="profile" element={<CustomerAccount />} />
        <Route path="*" element={<Navigate to="/account" replace />} />
      </Route>
    </Routes>
  );
}
