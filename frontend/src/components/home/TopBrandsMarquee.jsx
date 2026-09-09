import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function TopBrandsMarquee() {
  const [brands, setBrands] = useState([]);
  const [speed, setSpeed] = useState(30);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data } = await api.get('/brands');
      if (data.data && data.data.length > 0) {
        setBrands(data.data);
        setSpeed(data.speed || 30);
      }
    } catch (err) {
      console.error('Failed to fetch top brands', err);
    }
  };

  if (brands.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container-mk mb-8">
        <h2 className="text-center text-3xl font-bold text-navy">Our Top Brands</h2>
      </div>
      
      <div className="relative flex w-full overflow-hidden py-6">
        <div 
          className="flex whitespace-nowrap marquee-track"
          style={{ 
            animation: `marquee ${speed}s linear infinite`,
          }}
        >
          {/* We render the list multiple times to ensure seamless infinite loop even on ultra-wide screens */}
          {[...brands, ...brands, ...brands, ...brands].map((brand, index) => (
            <div 
              key={`${brand._id}-${index}`} 
              className="group relative mx-8 flex w-56 shrink-0 items-center justify-center sm:mx-12 sm:w-72"
            >
              <img 
                src={brand.image.url?.includes('cloudinary.com') ? brand.image.url.replace('/upload/', '/upload/e_make_transparent:10/') : brand.image.url} 
                alt={brand.name} 
                className="h-24 w-auto max-w-full object-contain sm:h-32" 
              />
            </div>
          ))}
        </div>
        
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            /* We duplicated 4 times, so 1 set is 25% */
            100% { transform: translateX(-25%); } 
          }
          /* Pause on hover */
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    </section>
  );
}
