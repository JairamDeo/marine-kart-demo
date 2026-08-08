import { useEffect, useState } from 'react';
import CategoryCard from '../product/CategoryCard';
import { categoryService } from '../../services/category.service';
import { refreshAos } from '../../hooks/useAos';

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryService
      .list()
      .then((res) => {
        setCategories(res.data.data.categories || []);
        setTimeout(refreshAos, 50);
      })
      .catch(() => setCategories([]));
  }, []);

  if (!categories.length) return null;

  return (
    <section className="container-mk pb-16 pt-4" data-aos="fade-up">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan">Browse</p>
        <h2 className="text-2xl font-bold uppercase tracking-wide text-navy md:text-3xl">
          Shop by Category
        </h2>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-cyan" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {categories.map((c, i) => (
          <div key={c._id || c.id} data-aos="fade-up" data-aos-delay={Math.min(i * 50, 350)}>
            <CategoryCard category={c} />
          </div>
        ))}
      </div>
    </section>
  );
}
