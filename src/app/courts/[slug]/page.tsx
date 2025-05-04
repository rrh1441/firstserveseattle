// src/app/courts/[slug]/page.tsx
// Server Component (default) – no `use client` needed

type Params = Promise<{ slug: string }>;

export default async function CourtDetailPage({
  params,
}: {
  params: Params;
}) {
  // Resolve the promise that Next.js passes in v15+
  const { slug: courtSlug } = await params;

  // ▸ Fetch data with `courtSlug` here if required

  return (
    <div>
      <h1>Court Detail Page</h1>
      <p>Details for court with slug: {courtSlug}</p>
    </div>
  );
}

/* --- OPTIONAL EXTRAS ------------------------------------------------------ */

// Dynamic metadata (same async-params rule)
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Court Details: ${slug}` };
}

// ISR / SSG helper (signature unchanged)
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [{ slug: 'example-court-1' }, { slug: 'example-court-2' }];
}
