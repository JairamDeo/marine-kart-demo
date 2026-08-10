import { useEffect, useState } from 'react';
import MainHeader from './MainHeader';
import Navbar from './Navbar';
import { categoryService } from '../../services/category.service';

export default function Header() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryService
      .list()
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <header className="sticky top-0 z-40 shadow-md">
      <MainHeader />
      <Navbar categories={categories} />
    </header>
  );
}
