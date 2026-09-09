import HeroSection from '../components/home/HeroSection';
import FeatureBar from '../components/common/FeatureBar';
import ProductTabs from '../components/home/ProductTabs';
import CategoryGrid from '../components/home/CategoryGrid';
import TopBrandsMarquee from '../components/home/TopBrandsMarquee';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureBar variant="light" />
      <ProductTabs />
      <CategoryGrid />
      <TopBrandsMarquee />
    </>
  );
}
