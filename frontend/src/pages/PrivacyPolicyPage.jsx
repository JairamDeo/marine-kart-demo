import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'collect',
    num: '01',
    title: 'Information we collect',
    lead: 'We collect information to provide better services, fulfill manufacturing and dealer orders, and process custom marine sourcing requests.',
    blocks: [
      {
        label: 'Personal identification data',
        text: 'When you make a purchase, create an account, register a product warranty, or contact us, we collect:',
        items: [
          'Full name',
          'Email address',
          'Phone number',
          'Shipping and billing addresses',
        ],
      },
      {
        label: 'Business & B2B data',
        text: 'For corporate clients, commercial shipping companies, or wholesale dealer inquiries, we may collect:',
        items: ['Company / organization name', 'Business GST / tax identification details'],
      },
      {
        label: 'Transactional data',
        text: 'Details regarding products purchased (e.g., steering systems, bilge pumps, hardware, or custom manufactured parts), order history, and payment details processed securely via encrypted third-party payment gateways.',
      },
      {
        label: 'Technical & usage data',
        text: 'Information about how you interact with our Site, including your IP address, browser type, device information, pages visited, and timestamps.',
      },
    ],
  },
  {
    id: 'use',
    num: '02',
    title: 'How we use your information',
    lead: 'MarineKart India uses the collected information for the following business purposes:',
    items: [
      {
        title: 'Order fulfillment & manufacturing',
        text: 'To process, manufacture, package, and ship your retail orders or custom-sourced marine equipment requirements.',
      },
      {
        title: 'B2B and dealer services',
        text: 'To manage trade accounts, wholesale inquiries, bulk shipping, and business communications.',
      },
      {
        title: 'Customer support & warranty',
        text: 'To answer inquiries submitted via phone, email, or WhatsApp, and to process product servicing or warranty requests.',
      },
      {
        title: 'Website improvement',
        text: 'To analyze site traffic, prevent fraudulent transactions, and enhance user experience across our digital catalog.',
      },
    ],
  },
  {
    id: 'sharing',
    num: '03',
    title: 'Sharing of data',
    lead: 'Because MarineKart India operates as both a direct manufacturer and a marine accessories dealer, your information may be shared strictly under these conditions:',
    items: [
      {
        title: 'Logistics & shipping partners',
        text: 'We share your delivery address and contact number with trusted third-party courier and freight services to ensure safe delivery of your marine hardware across India and internationally.',
      },
      {
        title: 'Authorized service networks',
        text: 'If you request localized technical support, custom fabrication, or regional dealer assistance, we may share relevant details with authorized service partners to fulfill your request.',
      },
      {
        title: 'Legal compliance',
        text: 'We may disclose your information if required by Indian law, regulation, or legal process to protect the rights, property, or safety of MarineKart India, our customers, or others.',
      },
    ],
  },
  {
    id: 'security',
    num: '04',
    title: 'Data security',
    lead: 'We implement robust administrative, technical, and physical security safeguards to protect your personal and corporate information from unauthorized access, alteration, disclosure, or destruction. While we strive to use commercially acceptable means to protect your data, no method of transmission over the internet is 100% secure.',
  },
  {
    id: 'cookies',
    num: '05',
    title: 'Cookies',
    lead: 'Our Site uses cookies and similar tracking technologies to enhance browsing efficiency, remember user preferences, and analyze site performance. You can choose to disable cookies through your individual browser settings, though certain features of our online store may not function properly as a result.',
  },
  {
    id: 'rights',
    num: '06',
    title: 'Your rights regarding your data',
    lead: 'You have the right to access, correct, or request the deletion of any personal data we hold about you. If you wish to review or update your account information, or withdraw consent for marketing communications, you can reach us directly using the contact details below.',
  },
  {
    id: 'changes',
    num: '07',
    title: 'Changes to this privacy policy',
    lead: 'We may update this Privacy Policy periodically to reflect changes in our practices, legal requirements, or operational updates. Any revisions will be posted directly on this page with an updated revision date.',
  },
  {
    id: 'contact',
    num: '08',
    title: 'Contact us',
  },
];

function scrollToSection(e, id) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector('header.sticky');
  const offset = (header?.offsetHeight ?? 140) + 16;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  window.history.replaceState(null, '', `#${id}`);
}

export default function PrivacyPolicyPage() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#eaf3f8] via-[#f7fafc] to-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#78c6d4]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-28 h-80 w-80 rounded-full bg-[#1a4b8c]/10 blur-3xl" />

      <div className="container-mk relative py-8 sm:py-10 lg:py-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 shadow-[0_20px_50px_-36px_rgba(26,75,140,0.45)] backdrop-blur-sm">
          <div className="bg-gradient-to-r from-navy to-[#1f5aa3] px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan">Legal</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Privacy Policy
                </h1>
              </div>
              <p className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
                Last updated: June 2026
              </p>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/80 sm:text-[15px]">
              MarineKart India (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates{' '}
              <a
                href="https://marinekartindia.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-cyan underline decoration-cyan/40 underline-offset-2 transition hover:text-white"
              >
                https://marinekartindia.com/
              </a>{' '}
              (the &quot;Site&quot;). This policy explains how we collect, use, disclose, and protect
              your information when you shop, enquire, or apply for dealer partnerships. We comply
              with applicable Indian data protection laws, including the DPDP Act.
            </p>
          </div>

          <nav
            aria-label="Privacy sections"
            className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-[#f8fbfd] px-4 py-3 sm:px-6 [scrollbar-width:thin]"
          >
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => scrollToSection(e, s.id)}
                className="shrink-0 rounded-lg border border-transparent bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-sm transition hover:border-cyan/40 hover:text-cyan"
              >
                <span className="mr-1.5 text-cyan">{s.num}</span>
                {s.title}
              </a>
            ))}
          </nav>

          <div className="px-5 py-6 sm:px-8 sm:py-7">
            <div className="space-y-7">
              {SECTIONS.filter((s) => s.id !== 'contact').map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-44 lg:scroll-mt-48">
                  <div className="mb-2.5 flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy text-[11px] font-bold text-white">
                      {section.num}
                    </span>
                    <h2 className="text-lg font-bold tracking-tight text-navy">{section.title}</h2>
                  </div>

                  {section.lead && (
                    <p className="text-sm leading-relaxed text-gray-600 sm:text-[15px] sm:leading-[1.7]">
                      {section.lead}
                    </p>
                  )}

                  {section.blocks && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {section.blocks.map((block) => (
                        <div
                          key={block.label}
                          className="rounded-xl border border-gray-100 bg-[#fafcfd] p-3.5"
                        >
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy">
                            {block.label}
                          </h3>
                          {block.text && (
                            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                              {block.text}
                            </p>
                          )}
                          {block.items && (
                            <ul className="mt-2.5 flex flex-wrap gap-1.5">
                              {block.items.map((item) => (
                                <li
                                  key={item}
                                  className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200/80"
                                >
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section.items && (
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {section.items.map((item) => (
                        <li
                          key={item.title}
                          className="rounded-xl border border-gray-100 bg-[#fafcfd] p-3.5"
                        >
                          <h3 className="text-sm font-bold text-navy">{item.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <section
                id="contact"
                className="scroll-mt-44 rounded-xl bg-gradient-to-br from-[#eef6fa] to-[#f7fafc] p-4 sm:p-5 lg:scroll-mt-48"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy text-[11px] font-bold text-white">
                      08
                    </span>
                    <h2 className="text-lg font-bold tracking-tight text-navy">Contact us</h2>
                  </div>
                  <Link
                    to="/contact-us"
                    className="text-xs font-bold uppercase tracking-wide text-cyan hover:underline"
                  >
                    Visit Contact Us →
                  </Link>
                </div>
                <p className="text-sm text-gray-600">
                  Questions about this Privacy Policy? Reach MarineKart India using the details
                  below.
                </p>
                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                      Business
                    </p>
                    <p className="mt-1 font-semibold text-navy">MarineKart India</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                      Registered office
                    </p>
                    <p className="mt-1 leading-relaxed text-gray-600">
                      No F8, Vinayaki Building, Opp. Fire Station, Warkhandem, Ponda, Goa – 403 401
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                      Showroom
                    </p>
                    <p className="mt-1 leading-relaxed text-gray-600">
                      Supreme by The Valley, Porvorim – Goa – 403 501
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                      Phone & email
                    </p>
                    <p className="mt-1 leading-relaxed text-gray-600">
                      <a href="tel:+919923026865" className="hover:text-navy">
                        +91-992-302-6865
                      </a>
                      <br />
                      <a href="tel:+919518999484" className="hover:text-navy">
                        +91-9518-999-484
                      </a>
                      <br />
                      <a
                        href="mailto:info@marinekartindia.com"
                        className="font-semibold text-navy hover:text-cyan"
                      >
                        info@marinekartindia.com
                      </a>
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
