import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container-mk py-20 text-center">
      <h1 className="mb-2 text-5xl font-bold text-navy">404</h1>
      <p className="mb-6 text-gray-500">Page not found</p>
      <Link to="/" className="btn-cyan inline-block rounded px-5 py-2.5 text-sm">
        Go Home
      </Link>
    </div>
  );
}
