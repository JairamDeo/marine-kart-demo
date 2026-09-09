import { lazy, Suspense } from 'react';
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

/** Eager: first-paint storefront routes */
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import NotFoundPage from './pages/NotFoundPage';

/** Lazy: secondary / heavy routes — keep initial JS small */
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AccountArea = lazy(() => import('./pages/AccountArea'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CmsPage = lazy(() => import('./pages/CmsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ProductNotListedPage = lazy(() => import('./pages/ProductNotListedPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSubcategories = lazy(() => import('./pages/admin/AdminSubcategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminQuotation = lazy(() => import('./pages/admin/AdminQuotation'));
const AdminOtherProducts = lazy(() => import('./pages/admin/AdminOtherProducts'));
const AdminSignature = lazy(() => import('./pages/admin/AdminSignature'));
const AdminBrands = lazy(() => import('./pages/admin/AdminBrands'));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-body">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
    </div>
  );
}

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
          <Suspense fallback={<RouteFallback />}>
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
                <Route path="about-us" element={<AboutPage />} />
                <Route path="faq" element={<CmsPage slug="faq" fallbackTitle="FAQ" />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route
                  path="delivery-information"
                  element={
                    <CmsPage slug="delivery-information" fallbackTitle="Delivery Information" />
                  }
                />
                <Route path="contact-us" element={<ContactPage />} />
                <Route path="product-not-listed" element={<ProductNotListedPage />} />

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
                  <Route path="brands" element={<AdminBrands />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="approvals" element={<Navigate to="/admin/customers" replace />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:id/quotation" element={<AdminQuotation />} />
                  <Route path="other-products" element={<AdminOtherProducts />} />
                  <Route path="signature" element={<AdminSignature />} />
                </Route>
              </Route>

              <Route path="home" element={<Navigate to="/" replace />} />
              <Route path="corporate/*" element={<Navigate to="/account" replace />} />
              <Route path="dealer/*" element={<Navigate to="/account" replace />} />
              <Route path="dealer-login" element={<Navigate to="/login?type=corporate" replace />} />
            </Routes>
          </Suspense>
          <StoreDrawers />
        </CartUIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
