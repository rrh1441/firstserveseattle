'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, MapPin, Clock, Calendar, Bell, ArrowLeft, Loader2 } from 'lucide-react';
import type { EmailAlertSubscriber } from '@/lib/emailAlerts/types';

interface Court {
  id: number;
  title: string;
  address: string | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6am to 9pm

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function AlertsPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Subscriber data
  const [subscriber, setSubscriber] = useState<Partial<EmailAlertSubscriber> | null>(null);

  // Form state
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourts, setSelectedCourts] = useState<number[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startHour, setStartHour] = useState(6);
  const [endHour, setEndHour] = useState(21);
  const [alertHour, setAlertHour] = useState(7);

  // Load subscriber preferences and courts
  useEffect(() => {
    async function loadData() {
      if (!token) {
        setError('Missing access token. Please use the link from your email.');
        setLoading(false);
        return;
      }

      try {
        // Fetch preferences
        const prefRes = await fetch(`/api/email-alerts/preferences?token=${token}`);
        const prefData = await prefRes.json();

        if (!prefData.success) {
          setError(prefData.error || 'Failed to load preferences');
          setLoading(false);
          return;
        }

        setSubscriber(prefData.data);
        setSelectedCourts(prefData.data.selected_courts || []);
        setSelectedDays(prefData.data.selected_days || [1, 2, 3, 4, 5]);
        setStartHour(prefData.data.preferred_start_hour ?? 6);
        setEndHour(prefData.data.preferred_end_hour ?? 21);
        setAlertHour(prefData.data.alert_hour ?? 7);

        // Fetch courts list
        const courtsRes = await fetch('/api/courts-list');
        if (courtsRes.ok) {
          const courtsData = await courtsRes.json();
          setCourts(courtsData.courts || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load your preferences. Please try again.');
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  const handleCourtToggle = (courtId: number) => {
    setSelectedCourts(prev =>
      prev.includes(courtId)
        ? prev.filter(id => id !== courtId)
        : [...prev, courtId]
    );
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/email-alerts/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          selectedCourts,
          selectedDays,
          preferredStartHour: startHour,
          preferredEndHour: endHour,
          alertHour,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to save preferences');
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !subscriber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to courts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Your Court Alert Preferences
          </h1>
          <p className="text-gray-600 mt-1">
            Tell us which courts and times you care about. We&apos;ll only send alerts when there&apos;s availability.
          </p>
          {subscriber?.extension_expires_at && (
            <p className="text-sm text-green-700 mt-2">
              <Bell className="inline h-4 w-4 mr-1" />
              Free trial active until {new Date(subscriber.extension_expires_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Form sections */}
        <div className="space-y-6">
          {/* Courts Selection */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">Which courts do you want alerts for?</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select the courts near you. Only these will appear in your alert emails.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {courts.map(court => (
                <label
                  key={court.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    selectedCourts.includes(court.id)
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourts.includes(court.id)}
                    onChange={() => handleCourtToggle(court.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedCourts.includes(court.id)
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedCourts.includes(court.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">{court.title}</span>
                </label>
              ))}
            </div>
            {courts.length === 0 && (
              <p className="text-gray-500 text-sm">Loading courts...</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {selectedCourts.length} court{selectedCourts.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Days Selection */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">Which days do you usually play?</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              We&apos;ll only send alerts on these days.
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle(day.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Window */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">What times work for you?</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              We&apos;ll only show slots within this time window.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From
                </label>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  {HOURS.map(h => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  {HOURS.map(h => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Alert Delivery Time */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">When should we send your alert?</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Choose when you want to receive your daily alert email (Pacific Time).
            </p>
            <select
              value={alertHour}
              onChange={(e) => setAlertHour(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              {HOURS.map(h => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-600">Preferences saved successfully!</p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || selectedCourts.length === 0 || selectedDays.length === 0}
            className="w-full rounded-lg bg-[#0c372b] py-3 font-semibold text-white transition-colors hover:bg-[#0c372b]/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6 text-center">
            <p className="font-semibold text-gray-900 mb-1">
              Want unlimited access to all courts?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Subscribe and see availability anytime, not just in emails.
            </p>
            <Link
              href="/signup?plan=monthly"
              className="inline-block rounded-lg bg-[#0c372b] px-6 py-2 font-semibold text-white transition-colors hover:bg-[#0c372b]/90"
            >
              Subscribe – $4 First Month
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <AlertsPageContent />
    </Suspense>
  );
}
