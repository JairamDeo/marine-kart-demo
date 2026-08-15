import ImageUpload from './ImageUpload';

/**
 * Product gallery editor: 1 main image + up to 4 thumbnails.
 * Values are Cloudinary URLs (WebP).
 */
export default function ProductImagesField({
  mainImage = '',
  thumbnails = ['', '', '', ''],
  onMainChange,
  onThumbnailsChange,
}) {
  const thumbs = [...thumbnails, '', '', '', ''].slice(0, 4);

  const setThumb = (index, url) => {
    const next = [...thumbs];
    next[index] = url || '';
    onThumbnailsChange?.(next);
  };

  return (
    <div className="space-y-5 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
      <div>
        <p className="mb-1 text-sm font-semibold text-gray-900">Product images</p>
        <p className="mb-3 text-xs text-gray-500">
          Main image + up to 4 thumbnails. Each file max 1MB.
        </p>
        <ImageUpload
          section="products"
          label="Main image *"
          value={mainImage}
          onChange={(url) => onMainChange?.(url)}
          hint="Shown first on product page & shop cards."
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-800">Thumbnails (max 4)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {thumbs.map((url, i) => (
            <ImageUpload
              key={`thumb-${i}`}
              section="products"
              label={`Thumbnail ${i + 1}`}
              value={url}
              onChange={(nextUrl) => setThumb(i, nextUrl)}
              hint="Optional extra angle / detail shot."
            />
          ))}
        </div>
      </div>
    </div>
  );
}
