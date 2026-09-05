export const emptyAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

/** Resolve city + state from Indian PIN (primary) or Zippopotam (fallback). */
export async function lookupCityStateFromPin(postalCode, country = 'India') {
  const code = String(postalCode || '').trim();
  if (!code) return null;

  const isIndia = String(country || 'India').toLowerCase().includes('india');
  if (isIndia && /^\d{6}$/.test(code)) {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        const po = data?.[0]?.PostOffice?.[0];
        if (data?.[0]?.Status === 'Success' && po) {
          return {
            city: po.District || po.Block || po.Name || '',
            state: po.State || '',
            country: 'India',
          };
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (code.length < 3) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/in/${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;
    return {
      city: place['place name'] || '',
      state: place.state || place['state abbreviation'] || '',
      country: data.country || country || 'India',
    };
  } catch {
    return null;
  }
}

export function addressFromSaved(addr, user) {
  return {
    fullName: addr.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    phone: addr.phone || user?.phone || '',
    line1: addr.line1 || '',
    line2: addr.line2 || '',
    city: addr.city || '',
    state: addr.state || '',
    postalCode: addr.postalCode || '',
    country: addr.country || 'India',
  };
}

export function addressesEqual(a, b) {
  const norm = (v) => String(v || '').trim().toLowerCase();
  return (
    norm(a.line1) === norm(b.line1) &&
    norm(a.line2) === norm(b.line2) &&
    norm(a.city) === norm(b.city) &&
    norm(a.state) === norm(b.state) &&
    norm(a.postalCode) === norm(b.postalCode)
  );
}

export function formatAddressLine(addr) {
  return [addr?.line1, addr?.line2, addr?.city, addr?.state, addr?.postalCode]
    .filter(Boolean)
    .join(', ');
}

export function formatAddressBlock(addr) {
  if (!addr) return '';
  const lines = [
    addr.fullName,
    addr.phone,
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', '),
    addr.country,
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Shared delivery-address checks for cart checkout + product-not-listed enquiry.
 * Returns an error message, or null when valid.
 */
export function validateDeliveryAddress(addr) {
  if (!addr?.fullName?.trim()) return 'Full name is required.';
  if (!addr?.phone?.trim()) return 'Phone is required.';
  if (!addr?.line1?.trim()) return 'Address is required.';
  if (!addr?.postalCode?.trim()) return 'PIN code is required.';
  if (!addr?.city?.trim()) return 'City is required.';
  if (!addr?.state?.trim()) return 'State is required.';
  if (!addr?.country?.trim()) return 'Country is required.';
  return null;
}
