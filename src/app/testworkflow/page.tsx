"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { MapPin, ExternalLink, Search, X, Calendar, Clock, List, MapIcon, ChevronUp, Zap, LogIn, Info } from "lucide-react";
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

// Auth prompt component - simple redirect button
function InlineAuthPrompt({
  onLoginClick
}: {
  onLoginClick: () => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <button
        onClick={onLoginClick}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors"
      >
        <LogIn size={16} />
        Get today&apos;s availability
      </button>
      <p className="text-xs text-gray-500 text-center mt-2">
        Free 7-day trial
      </p>
    </div>
  );
}

type ViewMode = "map" | "list";

export default function TestWorkflowPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewState, setViewState] = useState(SEATTLE_CENTER);
  const [search, setSearch] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [view, setView] = useState<ViewMode>("map");
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);

  const supabase = createClientComponentClient();

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check subscription/trial status
        const { data: subscriber } = await supabase
          .from("subscribers")
          .select("status, trial_end")
          .eq("user_id", user.id)
          .single();

        if (subscriber) {
          const isActive = ["active", "trialing", "paid"].includes(subscriber.status);
          const trialEnd = subscriber.trial_end ? new Date(subscriber.trial_end) : null;
          const inTrial = trialEnd && trialEnd > new Date();

          setHasAccess(isActive || !!inTrial);

          if (inTrial && trialEnd) {
            const daysLeft = Math.ceil(
              (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            setTrialDaysRemaining(daysLeft);
          }
        }
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkAuth();
      } else {
        setHasAccess(false);
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

  // Filter facilities based on search
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => facilityMatchesSearch(f, search));
  }, [facilities, search]);

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

  const handleLoginClick = () => {
    router.push("/login?redirect_to=/testworkflow");
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Date badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
              isYesterday
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {isYesterday ? <Clock size={14} /> : <Calendar size={14} />}
            {isYesterday ? "Yesterday" : "Today"}
          </div>

          {/* Search - compact on desktop */}
          <div className="relative flex-1 max-w-xs">
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

              {/* Auth prompt for non-authenticated users */}
              {isYesterday && (
                <InlineAuthPrompt onLoginClick={handleLoginClick} />
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

                          {/* Auth prompt for non-authenticated users */}
                          {isYesterday && (
                            <InlineAuthPrompt onLoginClick={handleLoginClick} />
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

        {/* Bottom buttons - show on both views */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          <button
            onClick={() => setShowMenuModal(true)}
            className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-full shadow-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            First Serve Seattle
            <ChevronUp size={16} className="text-emerald-500" />
          </button>
          <a
            href="https://seattleballmachine.com"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-full shadow-lg border border-blue-400 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Zap size={16} className="text-blue-500" />
            Ball Machine
          </a>
        </div>
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
                  <p className="font-semibold text-gray-900">Sign In / Sign Up</p>
                  <p className="text-sm text-gray-500">Start your free trial</p>
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
