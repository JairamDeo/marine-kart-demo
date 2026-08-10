import { useEffect, useMemo, useRef, useState } from 'react';
import { Country, State, City } from 'country-state-city';

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

/** Convert ISO2 country code to flag emoji */
export function countryFlag(iso2 = '') {
  const code = String(iso2 || '').toUpperCase();
  if (code.length !== 2) return '🌐';
  return String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)));
}

function findCountryByName(name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return null;
  return Country.getAllCountries().find((c) => c.name.toLowerCase() === n) || null;
}

function findStateByName(countryCode, name) {
  const n = String(name || '').trim().toLowerCase();
  if (!countryCode || !n) return null;
  return (
    State.getStatesOfCountry(countryCode).find((s) => s.name.toLowerCase() === n) || null
  );
}

/**
 * Shared address block: Pincode → Country (flags) → State/Province → City
 * Zip/pincode autofills city + state via Zippopotam.us when possible.
 */
export default function AddressLocationFields({
  value,
  onChange,
  addressLine1,
  addressLine2,
  onAddressLine1Change,
  onAddressLine2Change,
  showAddressLines = true,
  addressLine1Label = 'Address line 1',
  addressLine2Label = 'Address line 2',
  required = true,
}) {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const [zipBusy, setZipBusy] = useState(false);
  const zipTimer = useRef(null);

  const countryCode = value.countryCode || findCountryByName(value.country)?.isoCode || 'IN';
  const stateCode = value.stateCode || findStateByName(countryCode, value.state)?.isoCode || '';

  const states = useMemo(
    () => (countryCode ? State.getStatesOfCountry(countryCode) : []),
    [countryCode]
  );
  const cities = useMemo(
    () => (countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []),
    [countryCode, stateCode]
  );

  const patch = (partial) => onChange({ ...value, ...partial });

  const lookupZip = (postal, iso) => {
    const code = String(postal || '').trim();
    const cc = String(iso || countryCode || '').toLowerCase();
    if (!code || code.length < 3 || !cc) return;

    if (zipTimer.current) clearTimeout(zipTimer.current);
    zipTimer.current = setTimeout(async () => {
      setZipBusy(true);
      try {
        const res = await fetch(`https://api.zippopotam.us/${cc}/${encodeURIComponent(code)}`);
        if (!res.ok) return;
        const data = await res.json();
        const place = data?.places?.[0];
        if (!place) return;

        const countryMeta =
          Country.getAllCountries().find(
            (c) => c.isoCode.toLowerCase() === String(data['country abbreviation'] || cc).toLowerCase()
          ) || findCountryByName(data.country);

        const nextCountryCode = countryMeta?.isoCode || countryCode;
        const stateName = place.state || place['state abbreviation'] || '';
        const cityName = place['place name'] || '';
        const matchedState =
          findStateByName(nextCountryCode, stateName) ||
          State.getStatesOfCountry(nextCountryCode).find(
            (s) =>
              s.isoCode.toLowerCase() ===
              String(place['state abbreviation'] || '').toLowerCase()
          );

        patch({
          postalCode: code,
          country: countryMeta?.name || data.country || value.country,
          countryCode: nextCountryCode,
          state: matchedState?.name || stateName,
          stateCode: matchedState?.isoCode || '',
          city: cityName,
        });
      } catch {
        /* zip lookup optional */
      } finally {
        setZipBusy(false);
      }
    }, 450);
  };

  useEffect(
    () => () => {
      if (zipTimer.current) clearTimeout(zipTimer.current);
    },
    []
  );

  return (
    <>
      {showAddressLines ? (
        <>
          <Field label={addressLine1Label} required={required} className="sm:col-span-2">
            <input
              required={required}
              className={inputCls}
              value={addressLine1 || ''}
              onChange={(e) => onAddressLine1Change?.(e.target.value)}
            />
          </Field>
          {onAddressLine2Change ? (
            <Field label={addressLine2Label} className="sm:col-span-2">
              <input
                className={inputCls}
                value={addressLine2 || ''}
                onChange={(e) => onAddressLine2Change(e.target.value)}
              />
            </Field>
          ) : null}
        </>
      ) : null}

      <Field label="Pincode / Zip code" required={required}>
        <div className="relative">
          <input
            required={required}
            className={inputCls}
            value={value.postalCode || ''}
            onChange={(e) => {
              const postalCode = e.target.value;
              patch({ postalCode });
              lookupZip(postalCode, countryCode);
            }}
            placeholder="Enter to auto-fill city & state"
          />
          {zipBusy ? (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-cyan">
              …
            </span>
          ) : null}
        </div>
      </Field>

      <Field label="Country" required={required}>
        <select
          required={required}
          className={inputCls}
          value={countryCode}
          onChange={(e) => {
            const iso = e.target.value;
            const c = countries.find((x) => x.isoCode === iso);
            patch({
              country: c?.name || '',
              countryCode: iso,
              state: '',
              stateCode: '',
              city: '',
            });
          }}
        >
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {countryFlag(c.isoCode)} {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="State / Province" required={required}>
        <select
          required={required}
          className={inputCls}
          value={stateCode}
          disabled={!countryCode}
          onChange={(e) => {
            const iso = e.target.value;
            const s = states.find((x) => x.isoCode === iso);
            patch({
              state: s?.name || '',
              stateCode: iso,
              city: '',
            });
          }}
        >
          <option value="">{countryCode ? 'Select state / province' : 'Select country first'}</option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="City" required={required}>
        {cities.length > 0 ? (
          <select
            required={required}
            className={inputCls}
            value={value.city || ''}
            disabled={!stateCode}
            onChange={(e) => patch({ city: e.target.value })}
          >
            <option value="">{stateCode ? 'Select city' : 'Select state first'}</option>
            {cities.map((c) => (
              <option key={`${c.name}-${c.latitude}`} value={c.name}>
                {c.name}
              </option>
            ))}
            {/* Keep autofilled / custom city if not in list */}
            {value.city && !cities.some((c) => c.name === value.city) ? (
              <option value={value.city}>{value.city}</option>
            ) : null}
          </select>
        ) : (
          <input
            required={required}
            className={inputCls}
            value={value.city || ''}
            disabled={!countryCode}
            onChange={(e) => patch({ city: e.target.value })}
            placeholder={stateCode ? 'Enter city' : 'Select state first'}
          />
        )}
      </Field>
    </>
  );
}

export { Field, inputCls };
