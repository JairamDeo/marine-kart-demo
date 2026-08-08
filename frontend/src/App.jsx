import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartUIProvider } from './context/CartUIContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import LoginRequiredModal from './components/common/LoginRequiredModal';
import AppToaster from './components/common/AppToaster';
import CartDrawer from './components/cart/CartDrawer';
import WishlistDrawer from './components/wishlist/WishlistDrawer';
import ScrollToTop from './components/common/ScrollToTop';
import LazyImages from './components/common/LazyImages';
import StoreLayout from './components/layout/StoreLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import ShopPage from './pages/ShopPage';
import CategoryPage from './pages/CategoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountArea from './pages/AccountArea';
import WishlistPage from './pages/WishlistPage';
import CmsPage from './pages/CmsPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSubcategories from './pages/admin/AdminSubcategories';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminOrders from './pages/admin/AdminOrders';

function GlobalModals() {
  const { loginModal, closeLoginModal } = useAuth();
  return (
    <LoginRequiredModal
      open={loginModal.open}
      message={loginModal.message}
      redirectTo={loginModal.redirectTo}
      from={loginModal.from}
      onClose={closeLoginModal}
    />
  );
}

function StoreDrawers() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return (
    <>
      <CartDrawer />
      <WishlistDrawer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartUIProvider>
          <ScrollToTop />
          <LazyImages />
          <AppToaster />
          <GlobalModals />
          <Routes>
            <Route path="/admin-login" element={<AdminLoginPage />} />

            <Route element={<StoreLayout />}>
              <Route index element={<HomePage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="category/:slug" element={<CategoryPage />} />
              <Route path="product/:slug" element={<ProductDetailPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="about-us" element={<CmsPage slug="about-us" fallbackTitle="About Us" />} />
              <Route path="faq" element={<CmsPage slug="faq" fallbackTitle="FAQ" />} />
              <Route
                path="privacy-policy"
                element={<CmsPage slug="privacy-policy" fallbackTitle="Privacy Policy" />}
              />
              <Route
                path="delivery-information"
                element={
                  <CmsPage slug="delivery-information" fallbackTitle="Delivery Information" />
                }
              />
              <Route path="contact-us" element={<ContactPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/account/*" element={<AccountArea />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} loginPath="/admin-login" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="subcategories" element={<AdminSubcategories />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="orders" element={<AdminOrders />} />
              </Route>
            </Route>

            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="corporate/*" element={<Navigate to="/account" replace />} />
            <Route path="dealer/*" element={<Navigate to="/account" replace />} />
            <Route path="dealer-login" element={<Navigate to="/login?type=corporate" replace />} />
          </Routes>
          <StoreDrawers />
        </CartUIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
