import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/common/BrandLogo';
import PasswordInput from '../components/portal/PasswordInput';
import OtpVerifyModal from '../components/auth/OtpVerifyModal';
import { friendlyError } from '../utils/toastMsg';

const emptyIndividual = {
  fullName: '',
  email: '',
  phone: '',
  altPhone: '',
  password: '',
  confirmPassword: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
};

const emptyCorporate = {
  companyName: '',
  gstNumber: '',
  annualVolume: '',
  officeAddress: '',
  city: '',
  state: '',
  postalCode: '',
  contactPersonName: '',
  designation: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

/** Compact field control */
const inputCls =
  'input-mk !h-9 !rounded-md !px-2.5 !py-1.5 text-[13px] leading-tight';

function Field({ label, required, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-0.5 block text-[10px] font-medium text-gray-500">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function RegisterPage() {
  const { register, completeEmailVerification } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('customer');
  const [individual, setIndividual] = useState(emptyIndividual);
  const [corporate, setCorporate] = useState(emptyCorporate);
  const [busy, setBusy] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpAccountType, setOtpAccountType] = useState('customer');

  const isCorporate = accountType === 'corporate';

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = isCorporate ? corporate : individual;
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (String(form.password).length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setBusy(true);
    const toastId = toast.loading(
      isCorporate ? 'Creating corporate account...' : 'Creating your account...'
    );
    try {
      const payload = isCorporate
        ? {
            accountType: 'corporate',
            companyName: corporate.companyName,
            gstNumber: corporate.gstNumber,
            annualVolume: corporate.annualVolume,
            officeAddress: corporate.officeAddress,
            city: corporate.city,
            state: corporate.state,
            postalCode: corporate.postalCode,
            contactPersonName: corporate.contactPersonName,
            designation: corporate.designation,
            fullName: corporate.fullName,
            email: corporate.email,
            phone: corporate.phone,
            password: corporate.password,
          }
        : {
            accountType: 'customer',
            fullName: individual.fullName,
            email: individual.email,
            phone: individual.phone,
            altPhone: individual.altPhone,
            password: individual.password,
            line1: individual.line1,
            line2: individual.line2,
            city: individual.city,
            state: individual.state,
            postalCode: individual.postalCode,
          };

      const result = await register(payload);
      if (result?.needsVerification) {
        toast.success('Account created. Enter the code sent to your email.', {
          id: toastId,
          duration: 5000,
        });
        setOtpEmail(result.email);
        setOtpAccountType(result.accountType || accountType);
        setOtpOpen(true);
        return;
      }
      toast.success('Account created successfully!', { id: toastId });
      navigate('/');
    } catch (err) {
      toast.error(friendlyError(err, 'Could not create account. Please try again.'), { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const onVerified = async (user, token) => {
    await completeEmailVerification(user, token);
    setOtpOpen(false);
    toast.success('Welcome to MarineKart!');
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#f0f4f8]">
      <div className="mx-auto grid max-w-4xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:items-start lg:gap-6 lg:py-8">
        <aside className="hidden lg:block">
          <div
            className={`rounded-xl p-4 text-white ${
              isCorporate
                ? 'bg-gradient-to-b from-teal-800 to-teal-950'
                : 'bg-gradient-to-b from-[#1a4b8c] to-[#0f2d54]'
            }`}
          >
            <Link to="/" className="mb-4 inline-flex rounded-lg bg-black/80 px-2 py-1.5">
              <BrandLogo className="h-8 w-auto" />
            </Link>
            <h1 className="text-base font-bold leading-snug">
              {isCorporate ? 'Corporate registration' : 'Create account'}
            </h1>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/65">
              {isCorporate
                ? 'Verify your email after signup, then sign in to shop.'
                : 'Unlock prices, wishlist, and checkout.'}
            </p>
            <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-[11px] text-white/70">
              <li>· Live catalog pricing</li>
              <li>· Order tracking</li>
              <li>· {isCorporate ? 'Business account' : 'Fast checkout'}</li>
            </ul>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
            <Link to="/" className="inline-flex rounded-lg bg-black px-2 py-1.5">
              <BrandLogo className="h-8 w-auto" />
            </Link>
            <Link to="/login" className="text-xs font-semibold text-navy hover:underline">
              Sign in
            </Link>
          </div>

          <div className="mb-3 inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setAccountType('customer')}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${
                !isCorporate ? 'bg-[#1a4b8c] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserRound size={13} />
              Normal
            </button>
            <button
              type="button"
              onClick={() => setAccountType('corporate')}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${
                isCorporate ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 size={13} />
              Corporate
            </button>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-navy">
                  {isCorporate ? 'Corporate registration' : 'Customer registration'}
                </h2>
                <p className="text-[11px] text-gray-400">All fields marked * are required</p>
              </div>
              <Link
                to="/login"
                className="hidden text-[11px] font-semibold text-navy hover:underline sm:inline"
              >
                Already registered? Sign in
              </Link>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {!isCorporate ? (
                <>
                  <Section title="Personal">
                    <Field label="Full name" required className="sm:col-span-2">
                      <input
                        required
                        className={inputCls}
                        value={individual.fullName}
                        onChange={(e) => setIndividual({ ...individual, fullName: e.target.value })}
                      />
                    </Field>
                    <Field label="Email" required>
                      <input
                        type="email"
                        required
                        className={inputCls}
                        value={individual.email}
                        onChange={(e) => setIndividual({ ...individual, email: e.target.value })}
                      />
                    </Field>
                    <Field label="Mobile" required>
                      <input
                        required
                        className={inputCls}
                        value={individual.phone}
                        onChange={(e) => setIndividual({ ...individual, phone: e.target.value })}
                      />
                    </Field>
                    <Field label="Alt. mobile">
                      <input
                        className={inputCls}
                        value={individual.altPhone}
                        onChange={(e) => setIndividual({ ...individual, altPhone: e.target.value })}
                      />
                    </Field>
                    <Field label="Password" required>
                      <PasswordInput
                        required
                        minLength={6}
                        className="!h-9 !rounded-md !px-2.5 !py-1.5 text-[13px]"
                        value={individual.password}
                        onChange={(e) => setIndividual({ ...individual, password: e.target.value })}
                      />
                    </Field>
                    <Field label="Confirm password" required>
                      <PasswordInput
                        required
                        minLength={6}
                        id="confirm-password"
                        className="!h-9 !rounded-md !px-2.5 !py-1.5 text-[13px]"
                        value={individual.confirmPassword}
                        onChange={(e) =>
                          setIndividual({ ...individual, confirmPassword: e.target.value })
                        }
                      />
                    </Field>
                  </Section>

                  <Section title="Address">
                    <Field label="Address line 1" required className="sm:col-span-2">
                      <input
                        required
                        className={inputCls}
                        value={individual.line1}
                        onChange={(e) => setIndividual({ ...individual, line1: e.target.value })}
                      />
                    </Field>
                    <Field label="Address line 2" className="sm:col-span-2">
                      <input
                        className={inputCls}
                        value={individual.line2}
                        onChange={(e) => setIndividual({ ...individual, line2: e.target.value })}
                      />
                    </Field>
                    <Field label="City" required>
                      <input
                        required
                        className={inputCls}
                        value={individual.city}
                        onChange={(e) => setIndividual({ ...individual, city: e.target.value })}
                      />
                    </Field>
                    <Field label="State" required>
                      <input
                        required
                        className={inputCls}
                        value={individual.state}
                        onChange={(e) => setIndividual({ ...individual, state: e.target.value })}
                      />
                    </Field>
                    <Field label="Pincode" required>
                      <input
                        required
                        className={inputCls}
                        value={individual.postalCode}
                        onChange={(e) =>
                          setIndividual({ ...individual, postalCode: e.target.value })
                        }
                      />
                    </Field>
                  </Section>
                </>
              ) : (
                <>
                  <Section title="Company">
                    <Field label="Company name" required>
                      <input
                        required
                        className={inputCls}
                        value={corporate.companyName}
                        onChange={(e) =>
                          setCorporate({ ...corporate, companyName: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="GST number" required>
                      <input
                        required
                        className={`${inputCls} uppercase`}
                        value={corporate.gstNumber}
                        onChange={(e) =>
                          setCorporate({ ...corporate, gstNumber: e.target.value.toUpperCase() })
                        }
                      />
                    </Field>
                    <Field label="Annual volume" className="sm:col-span-2">
                      <input
                        className={inputCls}
                        placeholder="Optional"
                        value={corporate.annualVolume}
                        onChange={(e) =>
                          setCorporate({ ...corporate, annualVolume: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Office address" required className="sm:col-span-2">
                      <input
                        required
                        className={inputCls}
                        value={corporate.officeAddress}
                        onChange={(e) =>
                          setCorporate({ ...corporate, officeAddress: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="City" required>
                      <input
                        required
                        className={inputCls}
                        value={corporate.city}
                        onChange={(e) => setCorporate({ ...corporate, city: e.target.value })}
                      />
                    </Field>
                    <Field label="State" required>
                      <input
                        required
                        className={inputCls}
                        value={corporate.state}
                        onChange={(e) => setCorporate({ ...corporate, state: e.target.value })}
                      />
                    </Field>
                    <Field label="Pincode" required>
                      <input
                        required
                        className={inputCls}
                        value={corporate.postalCode}
                        onChange={(e) =>
                          setCorporate({ ...corporate, postalCode: e.target.value })
                        }
                      />
                    </Field>
                  </Section>

                  <Section title="Contact">
                    <Field label="Contact person" required>
                      <input
                        required
                        className={inputCls}
                        value={corporate.contactPersonName}
                        onChange={(e) =>
                          setCorporate({ ...corporate, contactPersonName: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Designation">
                      <input
                        className={inputCls}
                        value={corporate.designation}
                        onChange={(e) =>
                          setCorporate({ ...corporate, designation: e.target.value })
                        }
                      />
                    </Field>
                  </Section>

                  <Section title="Login">
                    <Field label="Full name (user)" required className="sm:col-span-2">
                      <input
                        required
                        className={inputCls}
                        value={corporate.fullName}
                        onChange={(e) => setCorporate({ ...corporate, fullName: e.target.value })}
                      />
                    </Field>
                    <Field label="Email" required>
                      <input
                        type="email"
                        required
                        className={inputCls}
                        value={corporate.email}
                        onChange={(e) => setCorporate({ ...corporate, email: e.target.value })}
                      />
                    </Field>
                    <Field label="Mobile" required>
                      <input
                        required
                        className={inputCls}
                        value={corporate.phone}
                        onChange={(e) => setCorporate({ ...corporate, phone: e.target.value })}
                      />
                    </Field>
                    <Field label="Password" required>
                      <PasswordInput
                        required
                        minLength={6}
                        className="!h-9 !rounded-md !px-2.5 !py-1.5 text-[13px]"
                        value={corporate.password}
                        onChange={(e) => setCorporate({ ...corporate, password: e.target.value })}
                      />
                    </Field>
                    <Field label="Confirm password" required>
                      <PasswordInput
                        required
                        minLength={6}
                        id="confirm-password-corp"
                        className="!h-9 !rounded-md !px-2.5 !py-1.5 text-[13px]"
                        value={corporate.confirmPassword}
                        onChange={(e) =>
                          setCorporate({ ...corporate, confirmPassword: e.target.value })
                        }
                      />
                    </Field>
                  </Section>
                </>
              )}

              <button
                type="submit"
                disabled={busy}
                className={`h-9 w-full cursor-pointer rounded-md text-[13px] font-semibold text-white transition disabled:opacity-60 ${
                  isCorporate ? 'bg-teal-700 hover:bg-teal-800' : 'bg-[#1a4b8c] hover:bg-[#143a6e]'
                }`}
              >
                {busy ? 'Please wait...' : isCorporate ? 'Create corporate account' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <OtpVerifyModal
        open={otpOpen}
        email={otpEmail}
        accountType={otpAccountType}
        onClose={() => {
          setOtpOpen(false);
          toast('Verify your email before signing in.', { icon: '✉️' });
          navigate(otpAccountType === 'corporate' ? '/login?type=corporate' : '/login');
        }}
        onVerified={onVerified}
      />
    </div>
  );
}
