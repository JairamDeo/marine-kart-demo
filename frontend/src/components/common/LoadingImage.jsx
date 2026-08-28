import { useState } from 'react';

/**
 * Image with shimmer placeholder until loaded.
 */
export default function LoadingImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  skeletonClassName = '',
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && !error && (
        <div
          className={`absolute inset-0 animate-pulse bg-gradient-to-br from-[#e3eef5] via-[#f2f7fa] to-[#d8e8f0] ${skeletonClassName}`}
          aria-hidden
        />
      )}
      {error ? (
        <div className="flex h-full min-h-[120px] items-center justify-center bg-[#f5f9fc] text-xs text-gray-400">
          Image unavailable
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`h-full w-full object-cover transition duration-700 ease-out ${
            loaded ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0'
          } ${imgClassName}`}
          {...rest}
        />
      )}
    </div>
  );
}
