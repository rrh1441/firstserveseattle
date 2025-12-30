'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You&apos;ve been unsubscribed
          </h1>
          <p className="text-gray-600 mb-6">
            You won&apos;t receive any more court alert emails from us.
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full rounded-lg bg-[#0c372b] py-3 font-semibold text-white text-center transition-colors hover:bg-[#0c372b]/90"
            >
              Return to First Serve Seattle
            </Link>
            <p className="text-sm text-gray-500">
              Changed your mind?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Subscribe for full access
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  const errorMessages: Record<string, string> = {
    missing_token: 'The unsubscribe link is missing required information.',
    invalid_token: 'This unsubscribe link is invalid or has expired.',
    update_failed: 'We couldn\'t process your request. Please try again.',
    unknown: 'Something went wrong. Please try again later.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Unsubscribe Failed
        </h1>
        <p className="text-gray-600 mb-6">
          {errorMessages[error || 'unknown']}
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 text-center transition-colors hover:bg-gray-300"
          >
            Return to homepage
          </Link>
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a
              href="mailto:support@firstserveseattle.com"
              className="text-blue-600 hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
