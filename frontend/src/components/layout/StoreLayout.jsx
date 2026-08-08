import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FeatureBar from '../common/FeatureBar';
import { useAos } from '../../hooks/useAos';

export default function StoreLayout() {
  const location = useLocation();
  useAos([location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-body">
        <Outlet />
      </main>
      <FeatureBar variant="dark" />
      <Footer />
    </div>
  );
}
