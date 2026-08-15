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
    <section className="container-mk pb-10 pt-3 sm:pb-12 lg:pb-8 lg:pt-2" data-aos="fade-up">
      <div className="mb-5 text-center lg:mb-4">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan">Browse</p>
        <h2 className="text-2xl font-bold uppercase tracking-wide text-navy md:text-3xl lg:text-[1.65rem]">
          Shop by Category
        </h2>
        <div className="mx-auto mt-2.5 h-1 w-14 rounded-full bg-cyan" />
      </div>
      <div className="flex flex-wrap justify-center gap-3 lg:gap-3">
        {categories.map((c, i) => (
          <div
            key={c._id || c.id}
            className="w-[calc(50%-0.5rem)] max-w-[160px] sm:w-[140px] md:w-[150px] lg:w-[140px] xl:w-[152px]"
            data-aos="fade-up"
            data-aos-delay={Math.min(i * 50, 350)}
          >
            <CategoryCard category={c} />
          </div>
        ))}
      </div>
    </section>
  );
}
