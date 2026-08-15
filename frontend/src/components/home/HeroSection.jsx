import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentService } from '../../services/content.service';
import leftBanner1 from '../../assets/HomeLeftBanner1.jpg.jpeg';
import leftBanner2 from '../../assets/HomeLeftBanner2.jpeg';
import leftBanner3 from '../../assets/HomeLeftBanner3.jpg.jpeg';
import rightBanner1 from '../../assets/HomeRightBanner1.jpg.jpeg';
import rightBanner2 from '../../assets/HomeRightBanner2.jpg.jpeg';

/** Left carousel slides (HomeLeftBanner 1 → 3) */
const LEFT_BANNERS = [
  {
    image: leftBanner1,
    title: 'NAVIGATION LIGHT',
    subtitle: 'Exclusive Offer -30% Off This Week',
    link: '/shop',
  },
  {
    image: leftBanner2,
    title: 'STEERING WHEEL',
    subtitle: 'Sport & basic models for every helm',
    link: '/category/steering-wheel',
  },
  {
    image: leftBanner3,
    title: 'SS FITTINGS 316',
    subtitle: 'Marine-grade stainless hardware',
    link: '/category/ss-fiitings-316',
  },
];

/** Right stack: top = RightBanner1, bottom = RightBanner2 */
const RIGHT_BANNERS = {
  top: {
    image: rightBanner1,
    link: '/category/electrical-accessories',
    alt: 'Electrical Accessories — Instrumentation',
  },
  bottom: {
    image: rightBanner2,
    link: '/category/engine-control-cables-levers',
    alt: 'Outboard Steering — Engine Control Lever',
  },
};

export default function HeroSection() {
  const [hero, setHero] = useState(LEFT_BANNERS);
  const [sideTop, setSideTop] = useState(RIGHT_BANNERS.top);
  const [sideBottom, setSideBottom] = useState(RIGHT_BANNERS.bottom);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    contentService
      .getBanners()
      .then((res) => {
        const banners = res.data.data.banners || [];
        const apiHero = banners.filter((b) => b.position === 'hero');
        // Keep local carousel images; merge API title/subtitle/link when present
        if (apiHero.length) {
          setHero(
            LEFT_BANNERS.map((local, i) => {
              const api = apiHero[i] || apiHero[i % apiHero.length];
              return {
                ...local,
                title: api?.title || local.title,
                subtitle: api?.subtitle || local.subtitle,
                link: api?.link || local.link,
              };
            })
          );
        }
        const top = banners.find((b) => b.position === 'side_top');
        const bottom = banners.find((b) => b.position === 'side_bottom');
        if (top?.link) {
          setSideTop((prev) => ({ ...prev, link: top.link }));
        }
        if (bottom?.link) {
          setSideBottom((prev) => ({ ...prev, link: bottom.link }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (hero.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % hero.length), 4500);
    return () => clearInterval(t);
  }, [hero.length]);

  const current = hero[index] || LEFT_BANNERS[0];

  return (
    <section className="container-mk py-4 md:py-5 lg:py-4">
      <div className="grid gap-3 lg:grid-cols-3 lg:gap-3">
        <div
          className="group relative min-h-[260px] overflow-hidden rounded-2xl bg-white sm:min-h-[300px] lg:col-span-2 lg:min-h-[340px]"
          data-aos="fade-right"
        >
          <img
            key={current.image}
            src={current.image}
            alt={current.title}
            className="absolute inset-0 h-full w-full object-contain object-right transition duration-700 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent sm:via-white/75 pointer-events-none" />
          <div className="relative z-10 flex h-full min-h-[260px] max-w-lg flex-col justify-center p-4 sm:min-h-[300px] sm:p-6 lg:min-h-[340px] lg:p-7">
            <span className="mb-2 inline-flex w-fit rounded-full bg-cyan/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-navy">
              Featured
            </span>
            <h1 className="text-2xl font-extrabold uppercase leading-tight tracking-wide text-navy sm:text-3xl md:text-4xl lg:text-[2.35rem]">
              {current.title}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600 sm:text-base">
              {current.subtitle}
            </p>
          </div>
          {hero.length > 1 && (
            <div className="absolute bottom-4 left-4 z-10 flex gap-2 sm:bottom-5 sm:left-6 lg:left-7">
              {hero.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-7 bg-cyan' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3" data-aos="fade-left" data-aos-delay="120">
          <PromoBannerCard {...sideTop} />
          <PromoBannerCard {...sideBottom} />
        </div>
      </div>
    </section>
  );
}

/** Right banners already include title + Shop Now in the artwork */
function PromoBannerCard({ image, link, alt }) {
  return (
    <Link
      to={link || '/shop'}
      className="promo-card group relative block min-h-[160px] overflow-hidden rounded-2xl bg-white lg:min-h-[164px]"
    >
      <img
        src={image}
        alt={alt || ''}
        className="absolute inset-0 h-full w-full object-fit object-center transition duration-500 group-hover:scale-[1.02]"
        loading="lazy"
        decoding="async"
      />
    </Link>
  );
}
