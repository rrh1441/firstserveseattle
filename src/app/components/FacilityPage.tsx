'use client';

import { FacilityPage as FacilityPageType } from '@/lib/markdown';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink, ArrowLeft, Clock, Users, MapIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface FacilityPageProps {
  facility: FacilityPageType;
}

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

      <div className="min-h-screen bg-gray-50">
        {/* Header Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link 
              href="/courts" 
              className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courts
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4">{data.facility_name}</h1>
                <div className="flex items-center text-green-100 mb-4">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-lg">{data.address}</span>
                </div>
                <div className="flex items-center space-x-6 text-green-100">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    <span>{data.court_count} Court{data.court_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center">
                    <MapIcon className="w-5 h-5 mr-2" />
                    <span>{data.neighborhood}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={copyAddress}
                variant="outline"
                className="flex items-center"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
              
              <Button 
                onClick={openInMaps}
                variant="outline"
                className="flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Maps
              </Button>

              <Link href="/courts">
                <Button 
                  variant="default"
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  See Today's Availability
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            {/* Markdown Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-green-800 prose-links:text-green-600 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          {/* Call-to-Action Section */}
          <div className="mt-8 bg-green-50 rounded-lg border border-green-200 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                Ready to Play Tennis in Seattle?
              </h2>
              <p className="text-green-700 mb-6 text-lg">
                View real-time same-day court availability across all Seattle tennis facilities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/courts">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    See Today's Availability
                  </Button>
                </Link>
                <Link href="https://firstserveseattle.com">
                  <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    Visit First Serve Seattle
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}