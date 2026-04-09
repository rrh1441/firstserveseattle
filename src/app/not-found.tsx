import Link from 'next/link';
import { MapPin, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <MapPin className="h-8 w-8 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h1>

        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>

          <Link
            href="/courts"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Search className="h-4 w-4" />
            Find Courts
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Need help?{' '}
          <a
            href="mailto:support@firstserveseattle.com"
            className="text-emerald-600 hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
