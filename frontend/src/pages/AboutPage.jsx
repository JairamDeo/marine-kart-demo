import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import aboutBanner from '../assets/about-banner.png';
import logoMark from '../assets/logo2.png';
import eventCochin from '../assets/event-cochin-boat-show.png';
import eventInmex from '../assets/event-inmex-smm.png';
import eventGoa from '../assets/event-goa-boat-show.png';
import LoadingImage from '../components/common/LoadingImage';
import EventGallerySection from '../components/about/EventGallerySection';

const EVENTS = [
  {
    title: 'Cochin International Boat Show',
    image: eventCochin,
    editions: [
      {
        year: '2026',
        dates: 'January 29–31',
        note: '8th Edition — Bolgatty Palace Event Centre',
      },
      {
        year: '2024',
        dates: 'February 8–10',
        note: '6th Edition — Bolgatty Palace Event Centre',
      },
      {
        year: '2023',
        dates: 'January 27–29',
        note: '5th Edition — Marine Drive Ground, Cochin',
      },
      {
        year: '2022',
        dates: 'March 25–27',
        note: '4th Edition — Bolgatty Palace Event Centre',
      },
      {
        year: '2019',
        dates: 'December 6–8',
        note: '2nd Edition — Samudrika Convention Centre, Willingdon Island',
      },
    ],
  },
  {
    title: 'INMEX SMM INDIA',
    image: eventInmex,
    editions: [
      {
        year: '2025',
        dates: 'September 10–12',
        note: 'Bombay Exhibition Centre, Mumbai',
      },
      {
        year: '2023',
        dates: 'October 4–6',
        note: 'Bombay Exhibition Centre, Mumbai',
      },
      {
        year: '2022',
        dates: 'June 1–3',
        note: 'Jio World Convention Centre, Mumbai',
      },
    ],
  },
  {
    title: 'Goa International Boat Show',
    image: eventGoa,
    editions: [
      {
        year: '2024',
        dates: 'June 7–9',
        note: 'Kala Academy, Panaji, Goa',
      },
    ],
  },
];

function EditionRow({ ed, compact = false }) {
  return (
    <li
      className={`rounded-lg bg-[#f5f9fc] ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-bold text-white">
          {ed.year}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy">
          <CalendarDays size={11} className="shrink-0 text-cyan" />
          {ed.dates}
        </span>
      </div>
      <p
        className={`flex items-start gap-1 text-[11px] leading-snug text-gray-600 ${
          compact ? 'mt-0.5' : 'mt-1'
        }`}
      >
        <MapPin size={11} className="mt-0.5 shrink-0 text-cyan" />
        <span>{ed.note}</span>
      </p>
    </li>
  );
}

function EventFlipCard({ event }) {
  const latest = event.editions[0];

  return (
    <>
      {/* Mobile / tablet: stacked card, no flip */}
      <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_18px_40px_-28px_rgba(26,75,140,0.35)] lg:hidden">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#0b2c5f]">
          <LoadingImage
            src={event.image}
            alt={event.title}
            className="h-full w-full"
            imgClassName="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b2c5f]/80 via-[#0b2c5f]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3.5">
            <h3 className="text-base font-bold leading-snug text-white">{event.title}</h3>
          </div>
        </div>
        <ul className="flex flex-col gap-1.5 p-3.5">
          {event.editions.map((ed) => (
            <EditionRow key={`${event.title}-m-${ed.year}-${ed.dates}`} ed={ed} compact />
          ))}
        </ul>
      </article>

      {/* Desktop: hover flip, no button */}
      <div className="event-flip group/card hidden cursor-pointer [perspective:1200px] lg:block">
        <div className="relative h-[380px] w-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] group-hover/card:[transform:rotateY(180deg)]">
          <article className="absolute inset-0 flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_18px_40px_-28px_rgba(26,75,140,0.35)] [backface-visibility:hidden]">
            <div className="relative h-[52%] min-h-[150px] overflow-hidden bg-[#0b2c5f]">
              <LoadingImage
                src={event.image}
                alt={event.title}
                className="h-full w-full"
                imgClassName="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b2c5f]/80 via-[#0b2c5f]/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4">
                <h3 className="text-base font-bold leading-snug text-white sm:text-lg">{event.title}</h3>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-center p-3.5 sm:p-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan">
                Latest edition
              </p>
              <ul>
                <EditionRow ed={latest} />
              </ul>
            </div>
          </article>

          <article className="absolute inset-0 flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_18px_40px_-28px_rgba(26,75,140,0.35)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-[#0b2c5f] to-[#1a4b8c] px-3.5 py-2.5 text-white sm:px-4">
              <h3 className="text-sm font-bold leading-snug">{event.title}</h3>
            </div>
            <ul className="flex flex-1 flex-col justify-start gap-1.5 overflow-hidden p-3 sm:p-3.5">
              {event.editions.map((ed) => (
                <EditionRow key={`${event.title}-d-${ed.year}-${ed.dates}`} ed={ed} compact />
              ))}
            </ul>
          </article>
        </div>
      </div>
    </>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-white">
      <div className="relative w-full overflow-hidden bg-[#0b2c5f]">
        <LoadingImage
          src={aboutBanner}
          alt="Marine yachts at marina"
          className="h-[180px] w-full sm:h-[240px] lg:h-[320px]"
          imgClassName="object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b2c5f]/40 via-transparent to-[#0b2c5f]/25" />
      </div>

      <div className="container-mk py-12 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[280px_1fr] lg:gap-14">
          <aside className="flex flex-col items-center text-center lg:sticky lg:top-28">
            <LoadingImage
              src={logoMark}
              alt="MarineKart"
              className="h-40 w-auto sm:h-48"
              imgClassName="mix-blend-screen object-contain"
            />
            <a
              href="https://www.marinekartindia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-sm font-bold tracking-wide text-navy hover:text-cyan"
            >
              www.marinekartindia.com
            </a>
          </aside>

          <section className="min-w-0">
            <p className="text-lg font-bold text-navy sm:text-xl">Best Marine Products in India</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              About MarineKart India
            </h1>

            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-gray-600 sm:text-base">
              <p>
                Based in the coastal hub of Goa, India, MarineKart has been a trusted name in the
                maritime sector since 2011. Over the past decade and a half, we have carved a unique
                niche as both a specialized manufacturer and an authorized dealer of world-renowned
                international marine accessories.
              </p>
              <p>
                We are a passionate team of engineers, sourcing specialists, and industry
                professionals operating from our headquarters in Goa. Our dual capability as a
                manufacturer and an international dealer allows us to offer a uniquely comprehensive
                portfolio. We combine indigenous production resilience with elite global brands,
                ensuring that boat builders, shipyards, and maritime enthusiasts across India and
                beyond have access to the absolute best the industry has to offer. We conduct our
                business with honesty, fairness, and accountability, building long-lasting
                relationships with every client we serve.
              </p>
              <p>
                <Link to="/contact-us" className="font-semibold text-cyan hover:underline">
                  Contact us
                </Link>{' '}
                with your requirements.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-8 pt-6 sm:mt-10 sm:pt-8">
          <div className="mb-6 text-center sm:mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Where we meet you</p>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              Events & Exhibitions
            </h2>
            <div className="mx-auto mt-2.5 h-1 w-14 rounded-full bg-cyan" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-5">
            {EVENTS.map((event) => (
              <EventFlipCard key={event.title} event={event} />
            ))}
          </div>

          <EventGallerySection />
        </section>
      </div>
    </div>
  );
}
