import HeroSection from '../components/home/HeroSection';
import FeatureBar from '../components/common/FeatureBar';
import ProductTabs from '../components/home/ProductTabs';
import CategoryGrid from '../components/home/CategoryGrid';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureBar variant="light" />
      <ProductTabs />
      <CategoryGrid />
    </>
  );
}
