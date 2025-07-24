'use client';

import { FacilityPage as FacilityPageType } from '@/lib/markdown';
import { MapPin, ExternalLink, ArrowLeft, Users, MapIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import InteractiveCTA from './InteractiveCTA';

interface FacilityPageProps {
  facility: FacilityPageType;
}

// Facilities that have ball machines available
const BALL_MACHINE_FACILITIES = [
  'green-lake-park-west-tennis',
  'lower-woodland-playfield',
  'lower-woodland-playfield-upper-courts',
  'observatory-tennis',
  'david-rodgers-park-tennis',
  'delridge-playfield-tennis',
  'gilman-playfield-tennis',
  'magnolia-park-tennis',
  'magnolia-playfield-tennis',
  'rogers-playfield-tennis',
  'wallingford-playfield-tennis'
];

export default function FacilityPage({ facility }: FacilityPageProps) {
  const { data, htmlContent } = facility;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(data.address);
      toast.success('Address copied to clipboard!');
    } catch {
      toast.error('Failed to copy address');
    }
  };

  const openInMaps = () => {
    window.open(data.google_map_url, '_blank');
  };

  const openBallMachine = () => {
    window.open('https://www.seattleballmachine.com', '_blank');
  };

  const hasBallMachine = BALL_MACHINE_FACILITIES.includes(data.slug);

  // Generate structured data for local business
  const structuredData = {
    "@context": "https://schema.org",
    "@type": data.schema_type,
    "name": data.facility_name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": data.address.split(',')[0],
      "addressLocality": "Seattle",
      "addressRegion": "WA",
      "postalCode": data.address.match(/WA\s+(\d{5})/)?.[1] || "",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "url": data.google_map_url
    },
    "url": data.canonical_url,
    "description": data.description,
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "Tennis Courts",
        "value": data.court_count
      },
      {
        "@type": "LocationFeatureSpecification", 
        "name": "Outdoor Courts",
        "value": true
      }
    ],
    "sport": "Tennis"
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-slate-50">
        {/* Header Navigation */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link 
              href="/courts" 
              className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courts
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#0c372b] to-[#0a2e21] text-white">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-5xl font-bold mb-6 leading-tight text-white">{data.facility_name}</h1>
                <div className="flex items-center text-white/95 mb-6">
                  <MapPin className="w-5 h-5 mr-3 text-white" />
                  <span className="text-xl text-white">{data.address}</span>
                </div>
                <div className="flex items-center space-x-8 text-white/95">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-3 text-white" />
                    <span className="text-lg text-white">{data.court_count} Court{data.court_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center">
                    <MapIcon className="w-5 h-5 mr-3 text-white" />
                    <span className="text-lg text-white">{data.neighborhood}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={copyAddress}
                className="w-full md:w-auto md:px-8 border border-slate-300 text-slate-700 py-4 px-6 text-lg font-semibold rounded hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Copy Address
              </button>
              
              <button 
                onClick={openInMaps}
                className="w-full md:w-auto md:px-8 border border-slate-300 text-slate-700 py-4 px-6 text-lg font-semibold rounded hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Maps
              </button>

              <InteractiveCTA size="lg" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10">
            {/* Markdown Content */}
            <div 
              className="prose prose-lg max-w-none 
                prose-headings:text-slate-900 prose-headings:font-bold
                prose-h2:text-4xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-0
                prose-h3:text-2xl prose-h3:font-bold prose-h3:mb-6 prose-h3:mt-12
                prose-h4:text-xl prose-h4:font-bold prose-h4:mb-4 prose-h4:mt-10
                prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6
                prose-strong:text-slate-900 prose-strong:font-bold
                prose-li:text-slate-700 prose-li:mb-2
                prose-ul:mb-8 prose-ol:mb-8
                prose-table:bg-white prose-table:border-collapse prose-table:w-full prose-table:mb-10 prose-table:rounded-lg prose-table:overflow-hidden prose-table:shadow-sm prose-table:border prose-table:border-slate-200
                prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:text-slate-900
                prose-td:border prose-td:border-slate-200 prose-td:p-4 prose-td:text-slate-700
                prose-tbody:bg-white
                [&_h2+p_em]:hidden
                [&_p:has(em:only-child)]:hidden"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          {/* Call-to-Action Section */}
          <div className="mt-12 bg-slate-50 rounded-xl border border-slate-200 p-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Ready to Play Tennis in Seattle?
              </h2>
              <p className="text-slate-700 mb-8 text-xl max-w-2xl mx-auto leading-relaxed">
                View real-time same-day court availability across all Seattle tennis facilities.
              </p>
              <div className={`flex flex-col sm:flex-row gap-6 ${hasBallMachine ? 'justify-center' : 'justify-center'}`}>
                <InteractiveCTA size="lg" />
                {hasBallMachine && (
                  <button 
                    onClick={openBallMachine}
                    className="w-full md:w-auto md:px-8 border border-[#0c372b] text-[#0c372b] py-4 px-6 text-lg font-semibold rounded hover:bg-[#0c372b]/5 hover:border-[#0a2e21] transition-colors"
                  >
                    Rent a Ball Machine
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}