import logo from '../../assets/logo.png';

/**
 * Exact MarineKart logo from src/assets/logo.png.
 * Logo already includes wordmark — do not add "MarineKart" text beside it.
 */
export default function BrandLogo({ className = 'h-10 w-auto', alt = 'MarineKart' }) {
  return (
    <img
      src={logo}
      alt={alt}
      className={`object-contain ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
