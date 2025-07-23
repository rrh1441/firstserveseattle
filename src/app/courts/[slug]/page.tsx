import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFacilityBySlug, getAllFacilitySlugs } from '@/lib/markdown';
import FacilityPage from '@/components/FacilityPage';

type Params = Promise<{ slug: string }>;

export default async function CourtDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  
  const facility = await getFacilityBySlug(slug);
  
  if (!facility) {
    notFound();
  }

  return <FacilityPage facility={facility} />;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const facility = await getFacilityBySlug(slug);
  
  if (!facility) {
    return {
      title: 'Court Not Found | First Serve Seattle',
      description: 'The tennis court you are looking for could not be found.',
    };
  }

  const { data } = facility;

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    authors: [{ name: data.author }],
    openGraph: {
      title: data.og_title,
      description: data.og_description,
      url: data.canonical_url,
      siteName: 'First Serve Seattle',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: data.og_image,
          width: 1200,
          height: 630,
          alt: `${data.facility_name} Tennis Courts`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.twitter_title,
      description: data.twitter_description,
      images: [data.og_image],
    },
    alternates: {
      canonical: data.canonical_url,
    },
    other: {
      'facility-name': data.facility_name,
      'address': data.address,
      'neighborhood': data.neighborhood,
      'court-count': data.court_count.toString(),
    },
  };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = getAllFacilitySlugs();
  return slugs.map((slug) => ({ slug }));
}