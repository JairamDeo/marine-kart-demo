import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, MapPin, Phone, Store } from 'lucide-react';
import { contentService } from '../services/content.service';
import { friendlyError } from '../utils/toastMsg';

const PHONES = ['+91-992-302-6865', '+91-951-899-9484', '+91-876-645-3672'];
const EMAILS = [
  'info@marinekartindia.com',
  'sales@marinekartindia.com',
  'marinekartsalesindia@gmail.com',
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1a4b8c]/70">
            MarineKart
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Have questions about a specific product or need assistance with your enquiry? Fill out
            the form below, and our team will get back to you as soon as possible.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-[300px_1fr] lg:items-start lg:gap-10">
          <aside className="space-y-5 rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_16px_40px_-28px_rgba(26,75,140,0.3)] sm:p-6">
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a4b8c]/10 text-[#1a4b8c]">
                <MapPin size={16} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-navy">
                  Registered Office
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  No F8, Vinayaki Building,
                  <br />
                  Opp. Fire Station,
                  <br />
                  Warkhandem,
                  <br />
                  Ponda, Goa – 403 401.
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a4b8c]/10 text-[#1a4b8c]">
                <Store size={16} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-navy">Showroom</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  Supreme by The Valley
                  <br />
                  Shop No: C-10
                  <br />
                  Near Mandovi Clinic
                  <br />
                  Porvorim – Goa – 403 501.
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a4b8c]/10 text-[#1a4b8c]">
                <Phone size={16} />
              </span>
              <div className="space-y-1">
                {PHONES.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    className="block text-sm font-medium text-gray-700 transition hover:text-navy"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a4b8c]/10 text-[#1a4b8c]">
                <Mail size={16} />
              </span>
              <div className="space-y-1">
                {EMAILS.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="block text-sm font-medium text-gray-700 transition hover:text-navy"
                  >
                    {email}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_20px_50px_-32px_rgba(26,75,140,0.35)] backdrop-blur sm:p-7">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-navy">Tell us your project</h2>
              <p className="mt-1 text-xs text-gray-400">All fields marked * are required</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="contact-name" className="mb-1 block text-xs font-medium text-gray-600">
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-name"
                  required
                  name="name"
                  autoComplete="name"
                  placeholder="Name"
                  className="input-mk rounded-xl"
                  value={form.name}
                  onChange={set('name')}
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-1 block text-xs font-medium text-gray-600">
                  Your Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-email"
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Email"
                  className="input-mk rounded-xl"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>

              <div>
                <label htmlFor="contact-subject" className="mb-1 block text-xs font-medium text-gray-600">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-subject"
                  required
                  name="subject"
                  placeholder="Subject"
                  className="input-mk rounded-xl"
                  value={form.subject}
                  onChange={set('subject')}
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-1 block text-xs font-medium text-gray-600">
                  Your Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  name="message"
                  rows={5}
                  placeholder="Message"
                  className="input-mk resize-y rounded-xl"
                  value={form.message}
                  onChange={set('message')}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="h-11 w-full rounded-xl bg-[#1a4b8c] text-sm font-semibold text-white transition hover:bg-[#143a6e] disabled:opacity-60 sm:w-auto sm:px-10"
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
