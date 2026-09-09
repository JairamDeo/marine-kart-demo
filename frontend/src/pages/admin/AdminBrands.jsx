import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Upload, Save, X, FileImage, Trash2, Settings2 } from 'lucide-react';
import api from '../../api/client';

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [speed, setSpeed] = useState(30);
  const [loading, setLoading] = useState(true);
  
  // Add form state
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/brands');
      setBrands(data.data);
      setSpeed(data.speed);
    } catch (err) {
      toast.error('Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpeed = async () => {
    try {
      await api.put('/brands/settings', { speed });
      toast.success('Marquee speed updated');
    } catch (err) {
      toast.error('Failed to update speed');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!name || !imagePreview) return toast.error('Name and image are required');
    
    try {
      setAdding(true);
      // Use existing upload mechanism for cloudinary (we can just send base64 to server or use formData)
      // Since our new /api/brands expects {name, image}, and we want to upload image, we actually should use the /api/admin/uploads route first to get cloudinary URL.
      
      const formData = new FormData();
      formData.append('images', imageFile);
      
      // 1. Upload image
      const uploadRes = await api.post('/admin/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const imageUrl = uploadRes.data.data[0];
      
      // 2. Add brand
      await api.post('/brands', {
        name,
        image: { url: imageUrl.url, public_id: imageUrl.public_id || '' }
      });
      
      toast.success('Brand added successfully');
      setName('');
      setImageFile(null);
      setImagePreview(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add brand');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    try {
      await api.delete(`/brands/${id}`);
      toast.success('Brand deleted');
      setBrands(brands.filter(b => b._id !== id));
    } catch (err) {
      toast.error('Failed to delete brand');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Top Brands</h1>
        <p className="text-sm text-gray-500">Manage the scrolling marquee brands shown on the homepage.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Settings and Add Form */}
        <div className="space-y-6">
          {/* Settings */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-navy">
              <Settings2 size={20} /> Marquee Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Animation Duration (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full rounded border px-3 py-2 text-sm focus:border-cyan focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lower number = Faster scrolling. Default is 30.
                </p>
              </div>
              <button
                onClick={handleUpdateSpeed}
                className="flex w-full items-center justify-center gap-2 rounded bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-light"
              >
                <Save size={16} /> Save Speed
              </button>
            </div>
          </div>

          {/* Add Brand */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy">Add New Brand</h2>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Brand Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm focus:border-cyan focus:outline-none"
                  placeholder="e.g. Matromarine"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Brand Logo</label>
                {!imagePreview ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed p-6 transition hover:bg-gray-50">
                    <Upload className="mb-2 h-6 w-6 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">Select Image</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                ) : (
                  <div className="relative rounded border p-2">
                    <img src={imagePreview} alt="Preview" className="h-24 w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageFile(null); }}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={adding || !name || !imagePreview}
                className="flex w-full items-center justify-center gap-2 rounded bg-cyan px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-dark disabled:opacity-50"
              >
                <Upload size={16} /> {adding ? 'Adding...' : 'Add Brand'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Brands List */}
        <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-navy">Current Brands ({brands.length})</h2>
          
          {brands.length === 0 ? (
            <div className="rounded border border-dashed py-12 text-center text-gray-500">
              <FileImage className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No brands found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {brands.map(brand => (
                <div key={brand._id} className="group relative flex flex-col items-center justify-between rounded border p-4 transition hover:border-cyan hover:shadow-md">
                  <div className="mb-2 flex h-20 w-full items-center justify-center bg-gray-50 p-2">
                    <img src={brand.image.url?.includes('cloudinary.com') ? brand.image.url.replace('/upload/', '/upload/e_make_transparent:10/') : brand.image.url} alt={brand.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <h3 className="truncate text-center text-sm font-medium text-navy w-full" title={brand.name}>
                    {brand.name}
                  </h3>
                  <button
                    onClick={() => handleDelete(brand._id)}
                    className="absolute right-2 top-2 rounded bg-red-50 p-1.5 text-red-600 opacity-0 transition hover:bg-red-100 group-hover:opacity-100"
                    title="Delete Brand"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
