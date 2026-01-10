"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import {
  MapPin,
  Search,
  X,
  Calendar,
  Clock,
  LogIn,
  ChevronUp,
  Zap,
  Info,
  Star,
  ExternalLink,
} from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Seattle center coordinates
const SEATTLE_CENTER = {
  latitude: 47.6062,
  longitude: -122.3321,
  zoom: 11.5,
};

// Types for API response
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

// Time slots for timeline
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

type SlotStatus = "full" | "first_half" | "second_half" | "none";

function toMin(t: string): number {
  const [clock, ap] = t.toUpperCase().split(" ");
  const [h, m] = clock.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
}

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

// Mini timeline for popup
function MiniTimeline({ court }: { court: Court }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-gray-700 font-medium truncate mb-1">
        {court.title}
      </div>
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

// Date helpers
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

function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Neighborhood search
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

// Inline auth prompt component - compact banner
function InlineAuthPrompt({
  onAuthClick,
  onLoginClick,
}: {
  onAuthClick: (method: "google" | "apple") => void;
  onLoginClick: () => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-gray-600">
          <span className="font-medium text-gray-900">See today&apos;s times</span> · Free trial
        </span>
        <button
          onClick={onLoginClick}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Sign in
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAuthClick("apple")}
          className="flex-1 flex items-center justify-center gap-1.5 bg-black text-white py-2 px-3 rounded-lg font-medium text-xs hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple
        </button>
        <button
          onClick={() => onAuthClick("google")}
          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
      </div>
    </div>
  );
}

// Trial expired upgrade prompt - compact banner
function TrialExpiredPrompt({
  onUpgradeClick,
  loading,
}: {
  onUpgradeClick: (plan: "monthly" | "annual") => void;
  loading: boolean;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-amber-200">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-gray-600">
          <span className="font-medium text-amber-700">Trial ended</span> · Subscribe for today&apos;s times
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onUpgradeClick("monthly")}
          disabled={loading}
          className="flex-1 flex items-center justify-center bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          $8/mo
        </button>
        <button
          onClick={() => onUpgradeClick("annual")}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 text-white py-2 px-3 rounded-lg font-medium text-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          $64/yr <span className="text-emerald-200 text-[10px]">save 33%</span>
        </button>
      </div>
    </div>
  );
}

function TestCPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [trialEndEpoch, setTrialEndEpoch] = useState<number | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Data state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataDate, setDataDate] = useState<string>("");

  // UI state
  const [search, setSearch] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewState, setViewState] = useState(SEATTLE_CENTER);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: subscriber } = await supabase
          .from("subscribers")
          .select("status, trial_end")
          .eq("user_id", user.id)
          .single();

        if (subscriber) {
          // trial_end is stored as epoch seconds, convert to ms for Date
          const trialEndMs = subscriber.trial_end ? subscriber.trial_end * 1000 : null;
          const trialEnd = trialEndMs ? new Date(trialEndMs) : null;
          const now = new Date();

          // Determine access based on status and trial state
          const isPaidSubscriber = ["active", "paid"].includes(subscriber.status);
          const inActiveTrial = subscriber.status === "trialing" && !!trialEnd && trialEnd > now;
          const trialHasExpired = subscriber.status === "trialing" && !!trialEnd && trialEnd <= now;

          setHasAccess(isPaidSubscriber || inActiveTrial);
          setIsTrialExpired(!!trialHasExpired);

          if (inActiveTrial && trialEnd && subscriber.trial_end) {
            const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            setTrialDaysRemaining(daysLeft);
            setTrialEndEpoch(subscriber.trial_end); // Store epoch seconds for checkout
          } else {
            setTrialDaysRemaining(null);
            setTrialEndEpoch(null);
          }
        }
      }
      setAuthChecked(true);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAuth();
      } else {
        setHasAccess(false);
        setTrialDaysRemaining(null);
        setTrialEndEpoch(null);
        setIsTrialExpired(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch availability data based on access level
  useEffect(() => {
    if (!authChecked) return;

    const fetchData = async () => {
      setLoading(true);
      const dateToFetch = hasAccess ? getDateString(0) : getDateString(-1);
      setDataDate(dateToFetch);

      try {
        const res = await fetch(`/api/availability/${dateToFetch}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFacilities(data.facilities);
      } catch (err) {
        console.error("Failed to fetch availability:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authChecked, hasAccess]);

  // Handle facility URL param (from QR codes)
  useEffect(() => {
    const facilityParam = searchParams.get("facility");
    if (facilityParam && facilities.length > 0) {
      const facility = facilities.find(
        (f) => f.name.toLowerCase().includes(facilityParam.toLowerCase()) ||
               facilityParam.toLowerCase().includes(f.name.toLowerCase().split(" ")[0])
      );
      if (facility) {
        setSelectedFacility(facility);
        setViewState({
          latitude: facility.lat,
          longitude: facility.lon,
          zoom: 14,
        });
      }
    }
  }, [searchParams, facilities]);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => facilityMatchesSearch(f, search));
  }, [facilities, search]);

  // Auto-zoom for search
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
      const maxDiff = Math.max(
        Math.max(...lats) - Math.min(...lats),
        Math.max(...lons) - Math.min(...lons)
      );
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

  const handleAuthClick = async (method: "google" | "apple") => {
    const redirectUrl = `${window.location.origin}/auth/callback?redirect_to=/testc&mode=signup`;
    await supabase.auth.signInWithOAuth({
      provider: method,
      options: { redirectTo: redirectUrl },
    });
  };

  const handleLoginClick = () => {
    router.push("/login?redirect_to=/testc");
  };

  // For users still in trial - billing starts at trial end
  const handleUpgradeClick = async (plan: "monthly" | "annual") => {
    if (!user?.email) return;
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          plan,
          userId: user.id,
          trialEnd: trialEndEpoch, // Pass trial end so billing starts then
        }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
    } finally {
      setUpgradeLoading(false);
    }
  };

  // For users with expired trial - billing starts immediately
  const handleExpiredTrialUpgrade = async (plan: "monthly" | "annual") => {
    if (!user?.email) return;
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          plan,
          userId: user.id,
          // No trialEnd - billing starts immediately
        }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const mapsUrl = (facility: Facility) =>
    `https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lon}`;

  const isYesterday = !hasAccess;
  const dateLabel = dataDate ? formatDateDisplay(dataDate) : "";

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

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading courts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          {/* Date badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
              isYesterday
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {isYesterday ? <Clock size={14} /> : <Calendar size={14} />}
            {isYesterday ? "Yesterday" : "Today"} &bull; {dateLabel}
          </div>

          {/* Auth status */}
          {user ? (
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isTrialExpired ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className={`font-medium ${isTrialExpired ? "text-amber-600" : "text-gray-600"}`}>
                {isTrialExpired
                  ? "Trial ended"
                  : hasAccess
                    ? trialDaysRemaining
                      ? `Trial (${trialDaysRemaining}d)`
                      : "Subscribed"
                    : "Expired"}
              </span>
            </div>
          ) : (
            <button
              onClick={handleLoginClick}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Sign in
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courts or neighborhoods..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border-0 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={() => setSelectedFacility(null)}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />

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
              <div className="max-h-[70vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base leading-tight">
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
                        <span className="truncate max-w-[180px]">{selectedFacility.address}</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedFacility(null)}
                    className="p-1 -mr-1 -mt-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Date badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${
                    isYesterday
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {isYesterday ? <Clock size={12} /> : <Calendar size={12} />}
                  {isYesterday ? `Yesterday` : `Today`}
                </div>

                {/* Availability summary */}
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedFacility.color }}
                  />
                  <span className="text-gray-600">
                    {selectedFacility.availableCount} of {selectedFacility.totalCount} courts{" "}
                    {isYesterday ? "were" : "are"} available
                  </span>
                </div>

                {/* Court timelines */}
                <div className="space-y-3">
                  {selectedFacility.courts.slice(0, 4).map((court) => (
                    <div key={court.id} className="border-t pt-2 first:border-t-0 first:pt-0">
                      <MiniTimeline court={court} />
                    </div>
                  ))}
                  {selectedFacility.courts.length > 4 && (
                    <div className="text-xs text-gray-500 text-center pt-1">
                      +{selectedFacility.courts.length - 4} more courts
                    </div>
                  )}
                </div>

                {/* Auth prompt for anonymous users */}
                {!user && isYesterday && (
                  <InlineAuthPrompt
                    onAuthClick={handleAuthClick}
                    onLoginClick={handleLoginClick}
                  />
                )}

                {/* Trial expired prompt */}
                {isTrialExpired && (
                  <TrialExpiredPrompt
                    onUpgradeClick={handleExpiredTrialUpgrade}
                    loading={upgradeLoading}
                  />
                )}

                {/* Trial status for authenticated users in active trial */}
                {hasAccess && trialDaysRemaining !== null && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                    <div className="text-emerald-700 text-sm font-medium">
                      Trial: {trialDaysRemaining} days remaining
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          )}
        </Map>

        {/* Legend */}
        <div className="absolute bottom-20 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Booked</span>
            </div>
          </div>
        </div>

        {/* Facility count */}
        <div className="absolute bottom-20 right-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <span className="text-xs font-medium text-gray-600">
            {filteredFacilities.length} facilities
          </span>
        </div>
      </div>

      {/* Bottom menu button */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <button
          onClick={() => setShowMenuModal(true)}
          className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-full shadow-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          First Serve Seattle
          <ChevronUp size={16} className="text-emerald-500" />
        </button>
      </div>

      {/* Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMenuModal(false)}
          />
          <div className="relative bg-white rounded-t-2xl w-full max-w-md p-6 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">First Serve Seattle</h2>
              <button
                onClick={() => setShowMenuModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {user ? (
                <>
                  <div className={`px-4 py-3 rounded-xl mb-2 ${isTrialExpired ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                    <p className="text-sm text-gray-600">Signed in as</p>
                    <p className="font-medium text-gray-900 truncate">{user.email}</p>
                    {trialDaysRemaining !== null && (
                      <p className="text-sm text-emerald-600 font-medium mt-1">
                        Trial: {trialDaysRemaining} days left
                      </p>
                    )}
                    {isTrialExpired && (
                      <p className="text-sm text-amber-600 font-medium mt-1">
                        Your trial has ended
                      </p>
                    )}
                  </div>

                  {/* Upgrade options for expired trial users */}
                  {isTrialExpired && (
                    <div className="mb-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        Subscribe to see today&apos;s availability
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExpiredTrialUpgrade("monthly")}
                          disabled={upgradeLoading}
                          className="flex-1 py-2 px-3 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                        >
                          $8/mo
                        </button>
                        <button
                          onClick={() => handleExpiredTrialUpgrade("annual")}
                          disabled={upgradeLoading}
                          className="flex-1 py-2 px-3 bg-emerald-600 rounded-lg text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          $64/yr <span className="text-emerald-200 text-xs">save 33%</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upgrade options for active trial users */}
                  {trialDaysRemaining !== null && (
                    <div className="mb-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        Subscribe now — billing starts after trial
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpgradeClick("monthly")}
                          disabled={upgradeLoading}
                          className="flex-1 py-2 px-3 bg-white border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        >
                          $8/mo
                        </button>
                        <button
                          onClick={() => handleUpgradeClick("annual")}
                          disabled={upgradeLoading}
                          className="flex-1 py-2 px-3 bg-emerald-600 rounded-lg text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          $64/yr <span className="text-emerald-200 text-xs">save 33%</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowMenuModal(false);
                      router.push('/members');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Star size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">My Account</p>
                      <p className="text-sm text-gray-500">Manage subscription</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setShowMenuModal(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <LogIn size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Sign Out</p>
                      <p className="text-sm text-gray-500">Log out of your account</p>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowMenuModal(false);
                      handleLoginClick();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <LogIn size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Sign In</p>
                      <p className="text-sm text-gray-500">Access your account</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenuModal(false);
                      router.push('/signup');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Star size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Start Free Trial</p>
                      <p className="text-sm text-gray-500">7 days free, no credit card</p>
                    </div>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  window.open('https://seattleballmachine.com', '_blank');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Zap size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ball Machine</p>
                  <p className="text-sm text-gray-500">Rent from Seattle Ball Machine</p>
                </div>
              </button>
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
    </div>
  );
}

export default function TestCPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <TestCPageInner />
    </Suspense>
  );
}
