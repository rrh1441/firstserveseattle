// src/app/courts/[slug]/page.tsx
import React from 'react';

// Define the expected parameters for a dynamic route page
interface CourtDetailPageProps {
  params: { slug: string }; // The 'slug' comes from the directory name [slug]
  searchParams?: { [key: string]: string | string[] | undefined }; // Optional search params
}

// Basic page component structure
// It needs to be exported as default
export default function CourtDetailPage({ params }: CourtDetailPageProps) {
  // Placeholder logic: You'll replace this with fetching and displaying
  // data based on the court slug.
  const courtSlug = params.slug;

  console.log(`Rendering court detail page for slug: ${courtSlug}`);

  return (
    <div>
      <h1>Court Detail Page</h1>
      <p>Details for court with slug: {courtSlug}</p>
      {/* Add your component logic to display court details here */}
    </div>
  );
}

// Optional: Add generateMetadata function if needed for dynamic titles/descriptions
// export async function generateMetadata({ params }: CourtDetailPageProps): Promise<Metadata> {
//   const slug = params.slug;
//   // Fetch metadata based on slug
//   return {
//     title: `Court Details: ${slug}`,
//   };
// }

// Optional: Add generateStaticParams if you want to pre-render specific slug pages at build time
// export async function generateStaticParams() {
//   // Fetch possible court slugs
//   // const courts = await fetchCourts(); // Example fetch
//   // return courts.map((court) => ({
//   //   slug: court.slug,
//   // }));
//   return [{ slug: 'example-court-1' }, { slug: 'example-court-2' }]; // Example
// }
