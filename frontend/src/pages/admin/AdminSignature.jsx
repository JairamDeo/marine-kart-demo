import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { Upload, Save, X, FileImage } from 'lucide-react';
import api from '../../api/client';

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/png');
};

export default function AdminSignature() {
  const [currentSignature, setCurrentSignature] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSignature();
  }, []);

  const fetchSignature = async () => {
    try {
      const { data } = await api.get('/admin/signature');
      if (data.signature) {
        setCurrentSignature(data.signature);
      }
    } catch (err) {
      console.error('Failed to fetch signature', err);
    }
  };

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setSaving(true);
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      await api.post('/admin/signature', { image: croppedImageBase64 });
      toast.success('Signature updated successfully');
      setCurrentSignature(croppedImageBase64);
      setImageSrc(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update signature');
    } finally {
      setSaving(false);
    }
  };

  const cancelCrop = () => {
    setImageSrc(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Signature Settings</h1>
        <p className="text-sm text-gray-500">
          Upload and configure the signature that appears on quotation PDFs.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy">Current Signature</h2>
          {currentSignature ? (
            <div className="rounded border bg-gray-50 p-8 text-center relative">
              <button 
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this signature?')) {
                    try {
                      await api.delete('/admin/signature');
                      setCurrentSignature(null);
                      toast.success('Signature deleted');
                    } catch (e) {
                      toast.error('Failed to delete signature');
                    }
                  }
                }}
                className="absolute right-4 top-4 rounded-full bg-red-500 p-2 text-white shadow hover:bg-red-600 transition"
                title="Delete signature"
              >
                <X size={16} />
              </button>
              <img src={currentSignature} alt="Current Signature" className="mx-auto max-h-32 object-contain" />
            </div>
          ) : (
            <div className="rounded border border-dashed p-8 text-center text-gray-500">
              <FileImage className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No signature uploaded yet.</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy">Upload New Signature</h2>
          {!imageSrc ? (
            <div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed p-8 transition hover:bg-gray-50">
                <Upload className="mb-2 h-8 w-8 text-cyan" />
                <span className="text-sm font-medium text-gray-700">Click to upload an image</span>
                <span className="mt-1 text-xs text-gray-500">PNG or JPG (transparent PNG recommended)</span>
                <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="relative h-64 w-full overflow-hidden rounded border bg-gray-900">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={3 / 1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full accent-cyan"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelCrop}
                  className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded bg-cyan px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-dark disabled:opacity-70"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Signature'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
