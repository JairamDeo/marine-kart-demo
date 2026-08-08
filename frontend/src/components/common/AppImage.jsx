/**
 * Default site image — always lazy-loads unless overridden.
 * Use for product/API images and static assets.
 */
export default function AppImage({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      {...rest}
    />
  );
}
