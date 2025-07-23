import { getAllFacilities } from '@/lib/markdown';

export async function GET() {
  const facilities = getAllFacilities();
  const baseUrl = 'https://firstserveseattle.com';
  
  // Get current date for lastmod
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Static pages
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