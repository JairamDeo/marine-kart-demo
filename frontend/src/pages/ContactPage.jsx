import { useState } from 'react';
import toast from 'react-hot-toast';
import { Factory, Mail, MapPin, Phone, Store } from 'lucide-react';
import { contentService } from '../services/content.service';
import { friendlyError } from '../utils/toastMsg';

const PHONES = ['+91-992-302-6865', '+91-951-899-9484', '+91-876-645-3672'];
const EMAILS = [
  'info@marinekartindia.com',
  'sales@marinekartindia.com',
  'marinekartsalesindia@gmail.com',
];

const ADDRESSES = [
  {
    icon: MapPin,
    title: 'Registered Office',
    lines: ['No F8, Vinayaki Building,', 'Opp. Fire Station,', 'Warkhandem,', 'Ponda, Goa – 403 401.'],
  },
  {
    icon: Store,
    title: 'Showroom',
    lines: [
      'Supreme by The Valley',
      'Shop No: C-10',
      'Near Mandovi Clinic',
      'Porvorim – Goa – 403 501.',
    ],
  },
  {
    icon: Factory,
    title: 'Works Address',
    lines: [
      'S-009, Block A,',
      'Khadpabandh Garden,',
      'Dhavli Bypass,',
      'Ponda, Goa – 403401',
    ],
  },
];

const empty = { name: '', email: '', subject: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const toastId = toast.loading('Sending your enquiry...');
    try {
      const { data } = await contentService.contact(form);
      toast.success(data.message || 'Enquiry sent successfully.', { id: toastId });
      setForm(empty);
    } catch (err) {
      toast.error(friendlyError(err, 'Could not send enquiry. Please try again.'), { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#eaf3f8] via-[#f7fafc] to-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#78c6d4]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-[#1a4b8c]/10 blur-3xl" />

      <div className="container-mk relative py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Have questions about a specific product or need assistance with your enquiry?
            <br />
            Fill out the form below, and our team will get back to you as soon as possible.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-[300px_1fr] lg:items-start lg:gap-10">
          <aside className="space-y-4 rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-[0_16px_40px_-28px_rgba(26,75,140,0.3)] sm:p-5">
            {ADDRESSES.map(({ icon: Icon, title, lines }, idx) => (
              <div key={title}>
                {idx > 0 && <div className="mb-4 h-px bg-gray-100" />}
                <div className="flex gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a4b8c]/10 text-[#1a4b8c]">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 pr-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-navy">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">
                      {lines.map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="h-px bg-gray-100" />

            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a4b8c]/10 text-[#1a4b8c]">
                <Phone size={14} />
              </span>
              <div className="min-w-0 space-y-1 pr-1">
                {PHONES.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    className="block text-xs font-medium text-gray-700 transition hover:text-navy"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a4b8c]/10 text-[#1a4b8c]">
                <Mail size={14} />
              </span>
              <div className="min-w-0 space-y-1 overflow-hidden pr-1">
                {EMAILS.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="block break-words text-[11px] font-medium leading-snug text-gray-700 transition hover:text-navy"
                  >
                    {email}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_20px_50px_-32px_rgba(26,75,140,0.35)] backdrop-blur sm:p-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-navy">Tell us your project</h2>
              <p className="mt-1 text-[11px] text-gray-400">All fields marked * are required</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="contact-name" className="mb-1 block text-[11px] font-medium text-gray-600">
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-name"
                  required
                  name="name"
                  autoComplete="name"
                  placeholder="Name"
                  className="input-mk rounded-xl text-sm"
                  value={form.name}
                  onChange={set('name')}
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-1 block text-[11px] font-medium text-gray-600">
                  Your Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-email"
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Email"
                  className="input-mk rounded-xl text-sm"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>

              <div>
                <label htmlFor="contact-subject" className="mb-1 block text-[11px] font-medium text-gray-600">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-subject"
                  required
                  name="subject"
                  placeholder="Subject"
                  className="input-mk rounded-xl text-sm"
                  value={form.subject}
                  onChange={set('subject')}
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-1 block text-[11px] font-medium text-gray-600">
                  Your Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  name="message"
                  rows={4}
                  placeholder="Message"
                  className="input-mk resize-y rounded-xl text-sm"
                  value={form.message}
                  onChange={set('message')}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="h-10 w-full rounded-xl bg-[#1a4b8c] text-sm font-semibold text-white transition hover:bg-[#143a6e] disabled:opacity-60 sm:w-auto sm:px-10"
              >
                {busy ? 'Sending...' : 'Send'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
