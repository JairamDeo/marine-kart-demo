import { useState } from 'react';
import { Camera, Expand } from 'lucide-react';
import LoadingImage from '../common/LoadingImage';
import ProductImageLightbox from '../product/ProductImageLightbox';

import photoBoothWide from '../../assets/marine kart event/WhatsApp Image 2026-08-27 at 1.18.06 AM.jpeg';
import photoBoothAlt from '../../assets/marine kart event/WhatsApp Image 2026-08-27 at 1.18.06 AM1.jpeg';
import photoTeamPortrait from '../../assets/marine kart event/3WhatsApp Image 2026-08-27 at 1.18.06 AM.jpeg';
import photoShowFloorA from '../../assets/marine kart event/4WhatsApp Image 2026-08-27 at 1.18.07 AM.jpeg';
import photoShowFloorB from '../../assets/marine kart event/5WhatsApp Image 2026-08-27 at 1.18.07 AM.jpeg';
import photoTeamBooth from '../../assets/marine kart event/6WhatsApp Image 2026-08-27 at 1.18.08 AM.jpeg';
import photoExhibitC from '../../assets/marine kart event/7WhatsApp Image 2026-08-27 at 1.18.08 AM.jpeg';

const GALLERY = [
  {
    src: photoBoothWide,
    alt: 'MarineKart India exhibition booth at trade show',
    caption: 'Our booth on the show floor',
    span: 'lg:col-span-7 lg:row-span-2',
    aspect: 'aspect-[16/10] lg:aspect-auto lg:min-h-[320px]',
  },
  {
    src: photoTeamPortrait,
    alt: 'MarineKart team at industry exhibition',
    caption: 'Team at the exhibition',
    span: 'lg:col-span-5 lg:row-span-2',
    aspect: 'aspect-[4/5] lg:aspect-auto lg:min-h-[320px]',
  },
  {
    src: photoTeamBooth,
    alt: 'MarineKart representatives with visitors at booth',
    caption: 'Connecting with partners',
    span: 'lg:col-span-4',
    aspect: 'aspect-[16/10]',
  },
  {
    src: photoShowFloorA,
    alt: 'MarineKart products displayed at exhibition',
    caption: 'Product showcase',
    span: 'lg:col-span-4',
    aspect: 'aspect-[16/10]',
  },
  {
    src: photoShowFloorB,
    alt: 'Marine accessories on display at boat show',
    caption: 'Marine accessories display',
    span: 'lg:col-span-4',
    aspect: 'aspect-[16/10]',
  },
  {
    src: photoBoothAlt,
    alt: 'MarineKart stall branding and booth setup',
    caption: 'Stall branding',
    span: 'lg:col-span-6',
    aspect: 'aspect-[16/9]',
  },
  {
    src: photoExhibitC,
    alt: 'MarineKart at international boat show',
    caption: 'Industry presence',
    span: 'lg:col-span-6',
    aspect: 'aspect-[16/9]',
  },
];

function GalleryTile({ item, index, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={`group relative overflow-hidden rounded-2xl bg-[#0b2c5f] text-left shadow-[0_20px_45px_-30px_rgba(26,75,140,0.55)] ring-1 ring-gray-100/80 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_50px_-28px_rgba(26,75,140,0.65)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${item.span}`}
    >
      <LoadingImage
        src={item.src}
        alt={item.alt}
        className={`${item.aspect} lg:h-full`}
        imgClassName="transition duration-700 group-hover:scale-[1.04]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b2c5f]/85 via-[#0b2c5f]/15 to-transparent opacity-80 transition group-hover:opacity-95" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 sm:p-4">
        <p className="text-xs font-semibold text-white sm:text-sm">{item.caption}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition group-hover:bg-cyan group-hover:text-navy">
          <Expand size={14} />
        </span>
      </div>
    </button>
  );
}

export default function EventGallerySection() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <section className="relative mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-[#f4f9fc] via-white to-[#eef6fa] p-5 sm:mt-12 sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-navy/10 blur-3xl" />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan">
            <Camera size={12} />
            Show floor
          </p>
          <h2 className="mt-1.5 text-xl font-extrabold tracking-tight text-navy sm:text-2xl">
            Event & Exhibition
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
            Snapshots from MarineKart India at boat shows and maritime exhibitions across the country.
          </p>
        </div>
        <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy shadow-sm ring-1 ring-gray-100">
          {GALLERY.length} photos
        </p>
      </div>

      <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-12 lg:auto-rows-[minmax(140px,auto)] lg:gap-4">
        {GALLERY.map((item, index) => (
          <GalleryTile key={item.alt} item={item} index={index} onOpen={openLightbox} />
        ))}
      </div>

      <ProductImageLightbox
        open={lightboxOpen}
        images={GALLERY.map((g) => g.src)}
        index={lightboxIndex}
        alt="MarineKart event photo"
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
}
