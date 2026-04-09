import { listFacilitySlugs, loadFacility } from '@/lib/markdown';

export async function GET() {
  const slugs = await listFacilitySlugs();
  const facilities = await Promise.all(
    slugs.map(async (slug) => {
      const facility = await loadFacility(slug);
      return { ...facility, slug };
    })
  );
  const baseUrl = 'https://www.firstserveseattle.com';

  // Get current date for lastmod
  const currentDate = new Date().toISOString().split('T')[0];

  // Static pages - only include public, indexable pages
  // Excludes: test pages, auth pages, checkout pages, redirect pages
  const staticPages = [
    {
      url: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      url: `${baseUrl}/courts`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      url: `${baseUrl}/free-tennis-courts-seattle`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9',
    },
    {
      url: `${baseUrl}/pickleball`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8',
    },
    {
      url: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.6',
    },
    {
      url: `${baseUrl}/faq`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.6',
    },
    {
      url: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.5',
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: '0.3',
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: '0.3',
    },
  ];
  
  // Dynamic facility pages
  const facilityPages = facilities.map((facility) => ({
    url: `${baseUrl}/courts/${facility.slug}`,
    lastmod: facility.data.date || currentDate,
    changefreq: 'weekly',
    priority: '0.8',
  }));
  
  const allPages = [...staticPages, ...facilityPages];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}