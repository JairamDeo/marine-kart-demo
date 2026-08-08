import { useEffect, useState } from 'react';
import { contentService } from '../services/content.service';

export default function CmsPage({ slug, fallbackTitle }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    contentService
      .getPage(slug)
      .then((res) => setPage(res.data.data.page))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="container-mk py-10 text-gray-500">Loading...</div>;

  return (
    <div className="container-mk py-10">
      <div className="bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold uppercase text-navy">
          {page?.title || fallbackTitle}
        </h1>
        {page?.content && (
          <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {page.content}
          </p>
        )}

        {page?.faqItems?.length > 0 && (
          <div className="space-y-4">
            {page.faqItems.map((item, i) => (
              <div key={i} className="border-b border-gray-100 pb-4">
                <h3 className="mb-1 font-semibold text-navy">{item.question}</h3>
                <p className="text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        )}

        {page?.meta && (
          <div className="mt-6 space-y-1 text-sm text-gray-600">
            {page.meta.hotline && <p>Hotline: {page.meta.hotline}</p>}
            {page.meta.phone && <p>Phone: {page.meta.phone}</p>}
            {page.meta.email && <p>Email: {page.meta.email}</p>}
            {page.meta.address && <p>Address: {page.meta.address}</p>}
          </div>
        )}

        {!page && (
          <p className="text-gray-500">Content will appear after seeding the database.</p>
        )}
      </div>
    </div>
  );
}
