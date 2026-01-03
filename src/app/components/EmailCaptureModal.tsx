'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Bell, Clock, MapPin } from 'lucide-react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { grantEmailExtension } from '@/lib/shouldShowPaywall';
import type { SubscribeResponse } from '@/lib/emailAlerts/types';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (preferencesUrl: string) => void;
}

export default function EmailCaptureModal({
  isOpen,
  onClose,
  onSuccess,
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  // Initialize fingerprint on mount
  useEffect(() => {
    const getFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (err) {
        console.error('Failed to get fingerprint:', err);
      }
    };
    getFingerprint();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/email-alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          abGroup: localStorage.getItem('abGroup') || undefined,
          fingerprint: fingerprint || undefined,
        }),
      });

      const data: SubscribeResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Grant extension in localStorage
      if (data.extensionExpiresAt && data.unsubscribeToken) {
        grantEmailExtension(
          email.trim().toLowerCase(),
          data.extensionExpiresAt,
          data.unsubscribeToken
        );
      }

      // Navigate to preferences page
      onSuccess(data.preferencesUrl || '/alerts');
    } catch (err) {
      console.error('Email capture error:', err);
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Bell className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Get 7 Free Days + Court Alerts
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;ll send you personalized alerts when your favorite courts have open slots.
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="text-sm text-gray-700">
                Choose specific courts you care about
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="text-sm text-gray-700">
                Set your preferred days and times
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="text-sm text-gray-700">
                Get alerts only when there&apos;s availability
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-md bg-[#0c372b] py-3 font-semibold text-white transition-colors hover:bg-[#0c372b]/90 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? 'Setting up...' : 'Get My Free Week'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-gray-500">
            No credit card required. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
