"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { MapPin, ExternalLink, Search, X, Calendar, Clock, List, MapIcon, ChevronUp, Zap, LogIn, LogOut, Info, Mail, Loader2, CreditCard, AlertTriangle, CheckCircle, Lightbulb, Target, CircleDot } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Seattle center coordinates
const SEATTLE_CENTER = {
  latitude: 47.6062,
  longitude: -122.3321,
  zoom: 11.5,
};

// Types for facility data from API
interface CourtInterval {
  date: string;
  start: string;
  end: string;
}

interface Court {
  id: number;
  title: string;
  intervals: CourtInterval[];
  hasAvailability: boolean;
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  ball_machine: boolean;
}

interface Facility {
  name: string;
  address: string | null;
  lat: number;
  lon: number;
  courts: Court[];
  availableCount: number;
  totalCount: number;
  availableHours: number;
  color: string;
}

interface AvailabilityResponse {
  date: string;
  facilities: Facility[];
}

// Time slots for the timeline
const TIME_SLOTS = [
  { time: "6:00 AM", label: "6a" },
  { time: "7:00 AM", label: "7" },
  { time: "8:00 AM", label: "8" },
  { time: "9:00 AM", label: "9" },
  { time: "10:00 AM", label: "10" },
  { time: "11:00 AM", label: "11" },
  { time: "12:00 PM", label: "12p" },
  { time: "1:00 PM", label: "1" },
  { time: "2:00 PM", label: "2" },
  { time: "3:00 PM", label: "3" },
  { time: "4:00 PM", label: "4" },
  { time: "5:00 PM", label: "5" },
  { time: "6:00 PM", label: "6" },
  { time: "7:00 PM", label: "7" },
  { time: "8:00 PM", label: "8" },
  { time: "9:00 PM", label: "9" },
];

// Convert time string to minutes since midnight
function toMin(t: string): number {
  const [clock, ap] = t.toUpperCase().split(" ");
  const [h, m] = clock.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
}

// Get slot status for a court
type SlotStatus = "full" | "first_half" | "second_half" | "none";

function getSlotStatus(intervals: CourtInterval[], timeStr: string): SlotStatus {
  const slotStart = toMin(timeStr);
  const mid = slotStart + 30;

  const isFree = (start: number, end: number) =>
    intervals.some(({ start: s, end: e }) => {
      const intervalStart = toMin(s);
      const intervalEnd = toMin(e);
      return intervalStart <= start && intervalEnd >= end;
    });

  const firstHalfFree = isFree(slotStart, mid);
  const secondHalfFree = isFree(mid, mid + 30);

  if (firstHalfFree && secondHalfFree) return "full";
  if (firstHalfFree) return "first_half";
  if (secondHalfFree) return "second_half";
  return "none";
}

function getSlotColor(status: SlotStatus): string {
  switch (status) {
    case "full":
      return "bg-emerald-500 text-white";
    case "first_half":
    case "second_half":
      return "bg-orange-400 text-white";
    case "none":
      return "bg-gray-200 text-gray-400";
  }
}

// Mini timeline component
function MiniTimeline({ court }: { court: Court }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-gray-700 font-medium truncate mb-1">
        {court.title}
      </div>
      {/* Morning row */}
      <div className="flex gap-0.5">
        {TIME_SLOTS.slice(0, 8).map((slot) => {
          const status = getSlotStatus(court.intervals, slot.time);
          return (
            <div
              key={slot.time}
              className={`flex-1 flex items-center justify-center h-5 text-[9px] font-semibold rounded ${getSlotColor(status)}`}
            >
              {slot.label}
            </div>
          );
        })}
      </div>
      {/* Afternoon row */}
      <div className="flex gap-0.5">
        {TIME_SLOTS.slice(8).map((slot) => {
          const status = getSlotStatus(court.intervals, slot.time);
          return (
            <div
              key={slot.time}
              className={`flex-1 flex items-center justify-center h-5 text-[9px] font-semibold rounded ${getSlotColor(status)}`}
            >
              {slot.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Get date strings
function getDateString(daysOffset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

// Neighborhood search mappings
const NEIGHBORHOOD_KEYWORDS: Record<string, string[]> = {
  ballard: ["Soundview"],
  "beacon hill": ["Beacon Hill", "Jefferson Park", "AYTC", "Dearborn"],
  "capitol hill": ["Volunteer Park", "Miller"],
  "central district": ["Garfield", "Madrona"],
  fremont: ["Gilman", "Wallingford", "Rogers"],
  "green lake": ["Green Lake", "Lower Woodland", "Upper Woodland"],
  magnolia: ["Magnolia Park", "Magnolia Playfield", "Discovery"],
  "queen anne": ["Gilman", "Rogers"],
  "rainier valley": ["Rainier Playfield", "Rainier Beach", "Brighton", "Seward"],
  "south seattle": ["Rainier", "Brighton", "Seward", "Dearborn"],
  "university district": ["Ravenna", "Bryant", "Laurelhurst"],
  wallingford: ["Wallingford", "Meridian"],
  "west seattle": ["Alki", "Hiawatha", "Delridge", "Walt Hundley", "Riverview", "Solstice"],
};

function facilityMatchesSearch(facility: Facility, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  const search = searchTerm.toLowerCase();
  if (facility.name.toLowerCase().includes(search)) return true;
  if (facility.address?.toLowerCase().includes(search)) return true;
  for (const [neighborhood, keywords] of Object.entries(NEIGHBORHOOD_KEYWORDS)) {
    if (neighborhood.includes(search)) {
      if (keywords.some((kw) => facility.name.includes(kw))) return true;
    }
  }
  return false;
}

// Auth Modal component - dual mode Sign Up / Sign In
type AuthMode = 'signup' | 'signin';

function AuthModal({
  open,
  onClose,
  supabase,
  initialMode = 'signup',
}: {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  initialMode?: AuthMode;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Sync mode when initialMode changes (when modal opens with different mode)
  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [open, initialMode]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    localStorage.setItem('last_login_method', 'google');

    const finalRedirect = mode === 'signup' ? '/signup' : '/testworkflow';

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(finalRedirect)}&mode=${mode}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  // Apple OAuth handler (Sign In only - legacy until May 31, 2026)
  const handleAppleSignIn = async () => {
    setLoading(true);
    setError(null);
    localStorage.setItem('last_login_method', 'apple');

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=/testworkflow&mode=signin`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  // Magic Link handler
  const handleSendMagicLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    localStorage.setItem('last_login_method', 'email');

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/testworkflow&mode=${mode}`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setMagicLinkSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password Sign In handler (Sign In mode only)
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);
    localStorage.setItem('last_login_method', 'email');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : signInError.message
      );
    }
    setLoading(false);
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setMagicLinkSent(false);
    onClose();
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setError(null);
    setMagicLinkSent(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-t-2xl w-full max-w-md p-6 pb-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-end mb-2">
          <button
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {magicLinkSent ? (
          /* Magic link sent confirmation */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-1">
              We sent a sign-in link to
            </p>
            <p className="font-medium text-gray-900 mb-4">{email}</p>
            <p className="text-sm text-gray-500">
              Click the link in the email to sign in.
            </p>
          </div>
        ) : mode === 'signup' ? (
          /* ===== SIGN UP MODE ===== */
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Start your free trial</h2>
            <p className="text-gray-500 text-sm mb-4">
              7 days free, then $8/month. Cancel anytime.
            </p>

            {/* Benefits */}
            <div className="mb-5 p-3 bg-gray-50 rounded-xl">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Every unreserved court across 100+ Seattle locations</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Updated daily before the overnight lock</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Filter by lights, pickleball lines, practice walls</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Google OAuth - Primary */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400">or</span>
              </div>
            </div>

            {/* Magic Link */}
            <form onSubmit={handleSendMagicLink}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full mt-3 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Continue with email"
                )}
              </button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-6">
              Already have an account?{" "}
              <button
                onClick={() => switchMode('signin')}
                className="font-semibold text-emerald-600 hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        ) : (
          /* ===== SIGN IN MODE ===== */
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-6">
              Sign in to see today&apos;s court availability
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Google OAuth */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Apple OAuth - Legacy until May 31, 2026 */}
            <button
              onClick={handleAppleSignIn}
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400">or</span>
              </div>
            </div>

            {/* Email + Password */}
            <form onSubmit={handlePasswordSignIn} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoComplete="email"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoComplete="current-password"
                required
              />
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Magic link option */}
            <button
              onClick={() => email.trim() && handleSendMagicLink()}
              disabled={loading || !email.trim()}
              className="w-full mt-2 py-2 text-sm text-emerald-600 font-medium hover:underline disabled:opacity-50 disabled:no-underline"
            >
              Send me a magic link instead
            </button>

            <p className="text-sm text-gray-500 text-center mt-4">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => switchMode('signup')}
                className="font-semibold text-emerald-600 hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

type ViewMode = "map" | "list";

// Amenity filter types
type AmenityKey = "lights" | "hitting_wall" | "pickleball_lined" | "ball_machine";

const AMENITY_CONFIG: Record<AmenityKey, { label: string; icon: React.ReactNode }> = {
  lights: { label: "Lights", icon: <Lightbulb size={14} /> },
  hitting_wall: { label: "Wall", icon: <Target size={14} /> },
  pickleball_lined: { label: "Pickle", icon: <CircleDot size={14} /> },
  ball_machine: { label: "Machine", icon: <Zap size={14} /> },
};

export default function TestWorkflowPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewState, setViewState] = useState(SEATTLE_CENTER);
  const [search, setSearch] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [view, setView] = useState<ViewMode>("map");
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'signin'>('signup');
  const [isAppleOnlyUser, setIsAppleOnlyUser] = useState(false);
  const [showAppleBanner, setShowAppleBanner] = useState(true);
  const [showYesterdayToast, setShowYesterdayToast] = useState(false);
  const [amenityFilters, setAmenityFilters] = useState<Record<AmenityKey, boolean>>({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
    ball_machine: false,
  });

  const supabase = createClientComponentClient();

  // Check if Apple banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('apple_migration_banner_dismissed');
    if (dismissed) {
      setShowAppleBanner(false);
    }
  }, []);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);

        // Check if user is Apple-only (needs to set up password before May 31, 2026)
        const appleOnly = user.identities?.length === 1 &&
                          user.identities[0].provider === 'apple';
        setIsAppleOnlyUser(appleOnly);

        // Check subscription/trial status
        const { data: subscriber } = await supabase
          .from("subscribers")
          .select("status, trial_end")
          .eq("user_id", user.id)
          .single();

        if (subscriber) {
          const isPaidSubscriber = ["active", "paid"].includes(subscriber.status);
          // trial_end is stored as epoch seconds, convert to ms
          const trialEndMs = subscriber.trial_end ? subscriber.trial_end * 1000 : null;
          const trialEnd = trialEndMs ? new Date(trialEndMs) : null;
          const now = new Date();

          const inActiveTrial = subscriber.status === "trialing" && !!trialEnd && trialEnd > now;
          const trialExpired = subscriber.status === "trialing" && !!trialEnd && trialEnd <= now;

          setHasAccess(isPaidSubscriber || inActiveTrial);
          setIsTrialExpired(trialExpired);

          if (inActiveTrial && trialEnd) {
            const daysLeft = Math.ceil(
              (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            setTrialDaysRemaining(daysLeft);
          } else {
            setTrialDaysRemaining(null);
          }
        } else {
          // Authenticated but no subscriber record
          setHasAccess(false);
          setIsTrialExpired(false);
        }
      } else {
        setIsAuthenticated(false);
        setHasAccess(false);
        setIsTrialExpired(false);
        setTrialDaysRemaining(null);
        setIsAppleOnlyUser(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkAuth();
      } else {
        setIsAuthenticated(false);
        setHasAccess(false);
        setIsTrialExpired(false);
        setTrialDaysRemaining(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch availability data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // If user has access, show today; otherwise show yesterday
      const dateToFetch = hasAccess ? getDateString(0) : getDateString(-1);

      try {
        const res = await fetch(`/api/availability/${dateToFetch}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: AvailabilityResponse = await res.json();
        setFacilities(data.facilities);
      } catch (err) {
        console.error("Failed to fetch availability:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasAccess]);

  // Filter facilities based on search and amenities
  const filteredFacilities = useMemo(() => {
    return facilities
      .filter((f) => facilityMatchesSearch(f, search))
      .filter((f) => {
        // A facility passes if ANY of its courts have ALL selected amenities
        return f.courts.some((court) =>
          (Object.keys(amenityFilters) as AmenityKey[]).every(
            (k) => !amenityFilters[k] || court[k]
          )
        );
      });
  }, [facilities, search, amenityFilters]);

  // Auto-zoom to fit search results
  useEffect(() => {
    if (!search.trim()) {
      setViewState(SEATTLE_CENTER);
      return;
    }
    if (filteredFacilities.length === 0) return;
    if (filteredFacilities.length === 1) {
      const facility = filteredFacilities[0];
      setViewState({ latitude: facility.lat, longitude: facility.lon, zoom: 15 });
    } else {
      const lats = filteredFacilities.map((f) => f.lat);
      const lons = filteredFacilities.map((f) => f.lon);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
      const maxDiff = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lons) - Math.min(...lons));
      let zoom = 11.5;
      if (maxDiff < 0.01) zoom = 15;
      else if (maxDiff < 0.02) zoom = 14;
      else if (maxDiff < 0.05) zoom = 13;
      else if (maxDiff < 0.1) zoom = 12;
      setViewState({ latitude: centerLat, longitude: centerLon, zoom });
    }
  }, [filteredFacilities, search]);

  const handleMarkerClick = useCallback((facility: Facility) => {
    setSelectedFacility(facility);
    setViewState((prev) => ({
      ...prev,
      latitude: facility.lat,
      longitude: facility.lon,
      zoom: 14,
    }));
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('last_login_method');
    setIsAuthenticated(false);
    setHasAccess(false);
    setIsTrialExpired(false);
    setTrialDaysRemaining(null);
    setShowMenuModal(false);
  };

  const handleYesterdayClick = () => {
    setShowYesterdayToast(true);
    setTimeout(() => {
      setShowYesterdayToast(false);
      setShowAuthModal(true);
    }, 1500);
  };

  const mapsUrl = (facility: Facility) =>
    `https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lon}`;

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">Mapbox Token Missing</h1>
          <p className="text-gray-600">
            Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to
            your <code className="bg-gray-100 px-1 rounded">.env.local</code> file.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading courts...</p>
        </div>
      </div>
    );
  }

  const isYesterday = !hasAccess;

  const handleDismissAppleBanner = () => {
    localStorage.setItem('apple_migration_banner_dismissed', 'true');
    setShowAppleBanner(false);
  };

  const handleSetupPassword = () => {
    router.push('/request-password-reset');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Apple Migration Banner - only shown for Apple-only users */}
      {isAppleOnlyUser && showAppleBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <span className="font-medium">Apple Sign In retiring May 31.</span>
                {" "}Set up a password to keep your account.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSetupPassword}
                className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
              >
                Set up password
              </button>
              <button
                onClick={handleDismissAppleBanner}
                className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-3">
        <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
          {/* Date badge */}
          <button
            onClick={isYesterday ? handleYesterdayClick : undefined}
            disabled={!isYesterday}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium sm:font-semibold shrink-0 transition-colors ${
              isYesterday
                ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
            }`}
          >
            {isYesterday ? <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            {isYesterday ? "Yesterday" : "Today"}
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-[200px] sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-8 py-2 bg-gray-100 border-0 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 shrink-0">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "map"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MapIcon size={14} />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Amenity Filters */}
        <div className="flex flex-wrap gap-2 mt-3 max-w-4xl mx-auto">
          {(Object.entries(AMENITY_CONFIG) as [AmenityKey, { label: string; icon: React.ReactNode }][]).map(
            ([key, { label, icon }]) => {
              const active = amenityFilters[key];
              return (
                <button
                  key={key}
                  onClick={() =>
                    setAmenityFilters((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200"
                  }`}
                  aria-pressed={active}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          {/* Clear filters button - only show when filters are active */}
          {Object.values(amenityFilters).some(Boolean) && (
            <button
              onClick={() =>
                setAmenityFilters({
                  lights: false,
                  hitting_wall: false,
                  pickleball_lined: false,
                  ball_machine: false,
                })
              }
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {view === "map" ? (
          /* ===== MAP VIEW ===== */
          <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={() => setSelectedFacility(null)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {/* Facility markers */}
        {filteredFacilities.map((facility) => (
          <Marker
            key={facility.name}
            latitude={facility.lat}
            longitude={facility.lon}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(facility);
            }}
          >
            <div className="cursor-pointer transition-transform hover:scale-110" title={facility.name}>
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                  style={{ backgroundColor: facility.color }}
                >
                  <span className="text-[10px] font-bold text-white">
                    {facility.availableCount}/{facility.totalCount}
                  </span>
                </div>
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `6px solid ${facility.color}`,
                  }}
                />
              </div>
            </div>
          </Marker>
        ))}

        {/* Popup for selected facility */}
        {selectedFacility && (
          <Popup
            latitude={selectedFacility.lat}
            longitude={selectedFacility.lon}
            anchor="bottom"
            offset={25}
            closeOnClick={false}
            onClose={() => setSelectedFacility(null)}
            maxWidth="340px"
            className="facility-popup"
          >
            <div>
              {/* Header */}
              <div className="mb-2">
                <h3 className="font-bold text-gray-900 text-sm leading-tight">
                  {selectedFacility.name}
                </h3>
                {selectedFacility.address && (
                  <a
                    href={mapsUrl(selectedFacility)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 mt-0.5"
                  >
                    <MapPin size={10} />
                    <span className="truncate max-w-[200px]">{selectedFacility.address}</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>

              {/* Date badge + availability inline */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isYesterday
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {isYesterday ? <Clock size={10} /> : <Calendar size={10} />}
                  {isYesterday ? "Yesterday" : "Today"}
                </div>
                <span className="text-[10px] text-gray-500">
                  {selectedFacility.availableCount}/{selectedFacility.totalCount} courts available
                </span>
              </div>

              {/* Court timelines - scrollable area */}
              <div className="max-h-[35vh] overflow-y-auto space-y-2">
                {selectedFacility.courts.slice(0, 4).map((court) => (
                  <div key={court.id} className="border-t pt-2 first:border-t-0 first:pt-0">
                    <MiniTimeline court={court} />
                  </div>
                ))}
                {selectedFacility.courts.length > 4 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{selectedFacility.courts.length - 4} more courts
                  </div>
                )}
              </div>

              {/* Contextual CTA based on auth state */}
              {!hasAccess && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {isAuthenticated && isTrialExpired ? (
                    <>
                      <button
                        onClick={() => router.push('/signup')}
                        className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
                      >
                        Upgrade to continue
                      </button>
                      <p className="text-[10px] text-gray-400 text-center mt-2">
                        Your trial has ended
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                      >
                        <Calendar size={16} />
                        See today&apos;s availability
                      </button>
                      <p className="text-[10px] text-gray-400 text-center mt-2">
                        Free 7-day trial
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Trial status for authenticated users */}
              {hasAccess && trialDaysRemaining !== null && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                  <div className="text-emerald-700 text-xs font-medium">
                    Trial: {trialDaysRemaining} days left
                  </div>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>
        ) : (
          /* ===== LIST VIEW ===== */
          <div className="h-full overflow-y-auto px-4 py-4 pb-20">
            <p className="text-xs font-medium text-gray-500 mb-3">
              {filteredFacilities.length} facilities
              {search && ` matching "${search}"`}
            </p>

            {filteredFacilities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 font-medium">No facilities found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFacilities.map((facility) => {
                  const isExpanded = expandedFacility === facility.name;
                  return (
                    <div
                      key={facility.name}
                      className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden"
                    >
                      {/* Facility header */}
                      <button
                        onClick={() => setExpandedFacility(isExpanded ? null : facility.name)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 leading-snug">
                            {facility.name}
                          </h3>
                          {facility.address && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {facility.address}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: facility.color }}
                          >
                            {facility.availableCount}/{facility.totalCount}
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                          >
                            <MapPin size={16} className="text-gray-500" />
                          </a>
                        </div>
                      </button>

                      {/* Expanded court list */}
                      {isExpanded && (
                        <div className="border-t px-4 py-3 space-y-3">
                          {facility.courts.map((court) => (
                            <div key={court.id}>
                              <div className="text-xs text-gray-700 font-medium mb-1">
                                {court.title}
                              </div>
                              <MiniTimeline court={court} />
                            </div>
                          ))}

                          {/* Contextual CTA based on auth state */}
                          {!hasAccess && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {isAuthenticated && isTrialExpired ? (
                                <>
                                  <button
                                    onClick={() => router.push('/signup')}
                                    className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
                                  >
                                    Upgrade to continue
                                  </button>
                                  <p className="text-[10px] text-gray-400 text-center mt-2">
                                    Your trial has ended
                                  </p>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
                                  >
                                    See today&apos;s availability
                                  </button>
                                  <p className="text-[10px] text-gray-400 text-center mt-2">
                                    Free 7-day trial
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-500 pt-6 pb-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-emerald-500" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-orange-400" />
                <span>Partial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-gray-200" />
                <span>Booked</span>
              </div>
            </div>
          </div>
        )}

        </div>

      {/* Bottom buttons - fixed to viewport bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40 pb-safe">
        <button
          onClick={() => setShowMenuModal(true)}
          className="whitespace-nowrap flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          First Serve Seattle
          <ChevronUp size={18} className="text-emerald-500" />
        </button>
        <a
          href="https://seattleballmachine.com"
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-lg border border-blue-400 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          <Zap size={18} className="text-blue-500" />
          Ball Machine
        </a>
      </div>

      {/* Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMenuModal(false)}
          />
          <div className="relative bg-white rounded-t-2xl w-full max-w-md p-6 pb-8 animate-slide-up">
            {/* Header with value prop */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">First Serve Seattle</h2>
                <p className="text-sm text-gray-500">The only place to see today&apos;s open courts</p>
              </div>
              <button
                onClick={() => setShowMenuModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {isAuthenticated ? (
                hasAccess ? (
                  /* Authenticated + Active subscription/trial */
                  <>
                    <button
                      onClick={() => {
                        setShowMenuModal(false);
                        router.push('/billing');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CreditCard size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Account</p>
                        <p className="text-sm text-gray-500">Manage subscription</p>
                      </div>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <LogOut size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Sign Out</p>
                        <p className="text-sm text-gray-500">See you next time</p>
                      </div>
                    </button>
                  </>
                ) : (
                  /* Authenticated but expired trial or canceled */
                  <>
                    <button
                      onClick={() => {
                        setShowMenuModal(false);
                        router.push('/signup');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Zap size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Upgrade</p>
                        <p className="text-sm text-gray-500">Your trial has ended</p>
                      </div>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <LogOut size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Sign Out</p>
                        <p className="text-sm text-gray-500">See you next time</p>
                      </div>
                    </button>
                  </>
                )
              ) : (
                /* Not authenticated - separate Sign Up and Sign In */
                <>
                  <button
                    onClick={() => {
                      setShowMenuModal(false);
                      setAuthModalMode('signup');
                      setShowAuthModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Zap size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Sign Up</p>
                      <p className="text-sm text-gray-500">Start your free trial</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenuModal(false);
                      setAuthModalMode('signin');
                      setShowAuthModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <LogIn size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Sign In</p>
                      <p className="text-sm text-gray-500">Already have an account</p>
                    </div>
                  </button>
                </>
              )}

              {/* About - always shown */}
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  router.push('/about');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Info size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">About</p>
                  <p className="text-sm text-gray-500">Learn more about us</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yesterday explanation toast */}
      {showYesterdayToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <Calendar size={16} className="text-emerald-400" />
            <span className="text-sm font-medium">Sign up to see today&apos;s availability</span>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        supabase={supabase}
        initialMode={authModalMode}
      />
    </div>
  );
}
