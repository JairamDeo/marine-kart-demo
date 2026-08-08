import { Link } from 'react-router-dom';
import { categoryImageUrl } from '../../utils/productImage';

export default function CategoryCard({ category }) {
  const img = categoryImageUrl(category);

  return (
    <Link to={`/category/${category.slug}`} className="group text-center">
      <div className="mb-3 aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-100 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-cyan/40">
        <img
          src={img}
          alt={category.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-800 transition group-hover:text-navy">
        {category.name}
      </h3>
    </Link>
  );
}
