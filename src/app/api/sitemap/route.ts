// src/app/api/sitemap/route.ts
import { NextResponse } from 'next/server';

// Exporting a function makes this file a module
// This is a basic GET handler for the sitemap route
// Fix: Explicitly use '_request' parameter to satisfy linter
export async function GET(_request: Request) {
  // Placeholder: You'll need to add your actual sitemap generation logic here.
  // Log the request URL to ensure '_request' is used
  console.log(`Sitemap route accessed. Request URL: ${_request.url}`);

  // Example: Returning a simple XML structure (replace with actual sitemap)
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.firstserveseattle.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.firstserveseattle.com/login</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
   <url>
    <loc>https://www.firstserveseattle.com/signup</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  {/* Add other URLs here */}
</urlset>`;

  return new NextResponse(sitemapContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      // Optional: Cache control headers
      // 'Cache-Control': 's-maxage=86400, stale-while-revalidate', // Cache for 1 day
    },
  });
}

// You can add other HTTP method handlers if needed (POST, PUT, etc.)
// export async function POST(request: Request) { ... }
