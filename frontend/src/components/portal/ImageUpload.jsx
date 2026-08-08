import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import { friendlyError } from '../../utils/toastMsg';

const MAX_BYTES = 1 * 1024 * 1024;

/**
 * Upload image to Cloudinary via admin API into marinekart/<section>
 * Max 1MB. Backend converts to WebP (lossless) before saving.
 */
export default function ImageUpload({
  section = 'products',
  value = '',
  onChange,
  label = 'Product Image',
  hint,
  previewClassName = 'h-24 w-24',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 1MB or smaller');
      return;
    }

    setUploading(true);
    try {
      const { data } = await adminService.uploadImage(file, section);
      const url = data.data.url || data.data.images?.[0]?.url;
      if (!url) throw new Error('Upload failed');
      onChange?.(url, data.data.images?.[0]);
      toast.success('Image uploaded as WebP');
    } catch (err) {
      toast.error(friendlyError(err, 'Image upload failed. Please try again.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap items-start gap-3">
        {value ? (
          <div
            className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${previewClassName}`}
          >
            <img src={value} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            <button
              type="button"
              onClick={() => onChange?.('')}
              className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-red-500 shadow"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 ${previewClassName}`}
          >
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="btn-cyan inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? 'Uploading...' : value ? 'Replace' : 'Upload'}
          </button>
          <p className="max-w-[220px] text-[11px] leading-relaxed text-gray-400">
            {hint || 'Max 1MB. Converted to WebP (no quality loss) → Cloudinary.'}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/jpg"
          className="hidden"
          onChange={onFile}
        />
      </div>
    </div>
  );
}
