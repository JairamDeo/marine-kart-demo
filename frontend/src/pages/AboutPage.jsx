import { Link } from 'react-router-dom';
import aboutBanner from '../assets/about-banner.png';
import logoMark from '../assets/logo2.png';

export default function AboutPage() {
  return (
    <div className="bg-white">
      <div className="relative w-full overflow-hidden bg-[#0b2c5f]">
        <img
          src={aboutBanner}
          alt="Marine yachts at marina"
          className="block h-[180px] w-full object-cover object-center sm:h-[240px] lg:h-[320px]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b2c5f]/40 via-transparent to-[#0b2c5f]/25" />
      </div>

      <div className="container-mk py-12 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[280px_1fr] lg:gap-14">
          <aside className="flex flex-col items-center text-center lg:sticky lg:top-28">
            <img
              src={logoMark}
              alt="MarineKart"
              className="h-40 w-auto mix-blend-screen object-contain sm:h-48"
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
      </div>
    </div>
  );
}
