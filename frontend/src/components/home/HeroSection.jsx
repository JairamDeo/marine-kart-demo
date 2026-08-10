import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentService } from '../../services/content.service';
import heroFallback from '../../assets/hero.png';

const HERO_IMAGES = [
  heroFallback,
  'https://picsum.photos/seed/navlight/900/500',
  'https://picsum.photos/seed/steering/900/500',
  'https://picsum.photos/seed/sshardware/900/500',
];

const SIDE_IMAGES = {
  top: 'https://picsum.photos/seed/electrical-gauge/500/280',
  bottom: 'https://picsum.photos/seed/engine-lever/500/280',
};

export default function HeroSection() {
  const [hero, setHero] = useState([]);
  const [sideTop, setSideTop] = useState(null);
  const [sideBottom, setSideBottom] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    contentService
      .getBanners()
      .then((res) => {
        const banners = res.data.data.banners || [];
        setHero(banners.filter((b) => b.position === 'hero'));
        setSideTop(banners.find((b) => b.position === 'side_top') || null);
        setSideBottom(banners.find((b) => b.position === 'side_bottom') || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (hero.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % hero.length), 4500);
    return () => clearInterval(t);
  }, [hero.length]);

  const current = hero[index] || {
    title: 'NAVIGATION LIGHT',
    subtitle: 'Exclusive Offer -30% Off This Week',
    link: '/shop',
  };

  const heroImg = current.image || HERO_IMAGES[index % HERO_IMAGES.length];

  return (
    <section className="container-mk py-6 md:py-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <div
          className="group relative min-h-[300px] overflow-hidden rounded-2xl bg-white shadow-sm lg:col-span-2 lg:min-h-[400px]"
          data-aos="fade-right"
        >
          <img
            key={heroImg}
            src={heroImg}
            alt={current.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-transparent" />
          <div className="relative z-10 flex h-full min-h-[240px] max-w-lg flex-col justify-center p-5 sm:min-h-[300px] sm:p-8 lg:min-h-[400px] lg:p-10">
            <span className="mb-3 inline-flex w-fit rounded-full bg-cyan/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-navy">
              Featured
            </span>
            <h1 className="text-2xl font-extrabold uppercase leading-tight tracking-wide text-navy sm:text-3xl md:text-4xl lg:text-[2.6rem]">
              {current.title}
            </h1>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-gray-600">{current.subtitle}</p>
            <Link
              to={current.link || '/shop'}
              className="btn-cyan hero-cta mt-7 inline-block w-fit rounded-xl px-6 py-3 text-sm"
            >
              Shop Now
            </Link>
          </div>
          {hero.length > 1 && (
            <div className="absolute bottom-5 left-8 z-10 flex gap-2 lg:left-10">
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

        <div className="grid gap-4" data-aos="fade-left" data-aos-delay="120">
          <PromoCard
            title={sideTop?.title || 'ELECTRICAL ACCESSORIES'}
            subtitle={sideTop?.subtitle || 'Instrumentation'}
            link={sideTop?.link || '/category/electrical-accessories'}
            image={sideTop?.image || SIDE_IMAGES.top}
          />
          <PromoCard
            title={sideBottom?.title || 'OUTBOARD STEERING AND CONTROL SYSTEM'}
            subtitle={sideBottom?.subtitle || 'Engine Control Lever'}
            link={sideBottom?.link || '/category/engine-control-cables-levers'}
            image={sideBottom?.image || SIDE_IMAGES.bottom}
          />
        </div>
      </div>
    </section>
  );
}

function PromoCard({ title, subtitle, link, image }) {
  return (
    <Link
      to={link}
      className="promo-card group relative flex min-h-[175px] flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 shadow-sm"
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-110 group-hover:opacity-45"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
      <div className="relative z-10">
        <h3 className="text-sm font-bold uppercase leading-snug text-navy">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      </div>
      <span className="relative z-10 inline-flex items-center gap-1 text-sm font-semibold text-cyan transition group-hover:gap-2">
        Shop Now
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
