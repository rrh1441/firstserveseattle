"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { List, MapIcon } from "lucide-react";

// List View imports
import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";
import EmailCaptureModal from "@/app/components/EmailCaptureModal";
import WalkthroughModal from "@/app/components/WalkthroughModal";
import { courtMatchesSearch } from "@/lib/neighborhoodMapping";
import {
  Star,
  MapPin,
  Sun,
  Target,
  Circle,
  Zap,
  Search,
  X,
  LogIn,
  Mail,
  Info,
  ChevronUp,
} from "lucide-react";

// Map View imports
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import {
  getFacilitiesWithCoords,
  getAvailabilityColor,
  FacilityWithCoords,
} from "@/lib/getFacilitiesWithCoords";
import { MicroTimeline } from "@/components/MicroTimeline";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Seattle center coordinates
const SEATTLE_CENTER = {
  latitude: 47.6062,
  longitude: -122.3321,
  zoom: 11.5,
};

type ViewMode = "map" | "list";
type AmenityKey = "lights" | "hitting_wall" | "pickleball_lined" | "ball_machine";
type SlotStatus = "full" | "first_half" | "second_half" | "none";

// Time slots for list view
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

// Helper functions for list view
const toMin = (t: string) => {
  const [clock, ap] = t.toUpperCase().split(" ");
  const [h, m] = clock.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
};

const getSlotStatus = (court: TennisCourt, timeStr: string): SlotStatus => {
  const slotStart = toMin(timeStr);
  const mid = slotStart + 30;
  const isFree = (start: number, end: number) =>
    court.parsed_intervals.some(({ start: s, end: e }) => {
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
};

const getSlotColor = (status: SlotStatus): string => {
  switch (status) {
    case "full": return "bg-emerald-500 text-white";
    case "first_half":
    case "second_half": return "bg-orange-400 text-white";
    case "none": return "bg-gray-100 text-gray-400";
  }
};

const getSlotDescription = (timeStr: string, status: SlotStatus): string => {
  const hour = parseInt(timeStr.split(":")[0]);
  const isPM = timeStr.includes("PM");
  const hour12 = hour;
  const nextHour = hour === 12 ? 1 : hour + 1;
  const nextPM = hour === 11 ? !isPM : isPM;
  const formatTime = (h: number, min: number, pm: boolean) =>
    `${h}:${min.toString().padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
  switch (status) {
    case "full":
      return `${formatTime(hour12, 0, isPM)} - ${formatTime(nextHour, 0, nextPM)}`;
    case "first_half":
      return `${formatTime(hour12, 0, isPM)} - ${formatTime(hour12, 30, isPM)}`;
    case "second_half":
      return `${formatTime(hour12, 30, isPM)} - ${formatTime(nextHour, 0, nextPM)}`;
    case "none":
      return "Fully Reserved";
  }
};

const mapsUrl = (c: TennisCourt | FacilityWithCoords) => {
  // If it's a FacilityWithCoords, use exact lat/lon coordinates
  if ("lat" in c && "lon" in c) {
    return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lon}`;
  }
  // For TennisCourt, use Maps_url if available, otherwise address or title
  if (c.Maps_url?.startsWith("http")) {
    return c.Maps_url;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    c.address ?? c.title
  )}`;
};

const amenityConfig: Record<AmenityKey, { label: string; icon: React.ReactNode; color: string; activeColor: string }> = {
  lights: { label: "Lights", icon: <Sun size={14} />, color: "text-amber-500", activeColor: "text-white" },
  hitting_wall: { label: "Wall", icon: <Target size={14} />, color: "text-blue-500", activeColor: "text-white" },
  pickleball_lined: { label: "Pickleball", icon: <Circle size={14} />, color: "text-green-500", activeColor: "text-white" },
  ball_machine: { label: "Machine", icon: <Zap size={14} />, color: "text-purple-500", activeColor: "text-white" },
};

function facilityMatchesSearch(facility: FacilityWithCoords, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  const search = searchTerm.toLowerCase();

  // Check facility name
  if (facility.name.toLowerCase().includes(search)) return true;

  // Check address
  if (facility.address?.toLowerCase().includes(search)) return true;

  // Check if any court in this facility matches the neighborhood search
  for (const court of facility.courts) {
    if (courtMatchesSearch(court.title, searchTerm)) return true;
  }

  return false;
}

export default function TestDPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("map");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Walkthrough state - ALWAYS visible for testing
  const [showWalkthrough, setShowWalkthrough] = useState(true);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Menu modal state
  const [showMenuModal, setShowMenuModal] = useState(false);

  // List view state
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [fav, setFav] = useState<number[]>([]);
  const [amenities, setAmenities] = useState<Record<AmenityKey, boolean>>({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
    ball_machine: false,
  });
  const [selectedSlot, setSelectedSlot] = useState<{
    courtId: number;
    time: string;
    status: SlotStatus;
    description: string;
  } | null>(null);

  // Map view state
  const [facilities, setFacilities] = useState<FacilityWithCoords[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithCoords | null>(null);
  const [viewState, setViewState] = useState(SEATTLE_CENTER);

  // Load data
  useEffect(() => {
    try {
      const raw = localStorage.getItem("favoriteCourts");
      if (raw) setFav(JSON.parse(raw));
    } catch { /* ignore */ }

    Promise.all([
      getTennisCourts(),
      getFacilitiesWithCoords(),
    ]).then(([courtsData, facilitiesData]) => {
      setCourts(courtsData);
      setFacilities(facilitiesData);
    }).finally(() => setLoading(false));
  }, []);

  const handleEmailSuccess = useCallback((preferencesUrl: string) => {
    setShowEmailModal(false);
    router.push(preferencesUrl);
  }, [router]);

  const handleSetupNotifications = useCallback(() => {
    setShowWalkthrough(false);
    // Check if user has existing email extension with token
    const extensionData = localStorage.getItem("fss_email_extension");
    if (extensionData) {
      try {
        const { token } = JSON.parse(extensionData);
        if (token) {
          router.push(`/alerts?token=${token}`);
          return;
        }
      } catch { /* ignore */ }
    }
    // No token, show email capture modal
    setShowEmailModal(true);
  }, [router]);

  // Filtered data
  const filteredCourts = useMemo(() => {
    return courts
      .filter((c) => (search ? courtMatchesSearch(c.title, search) : true))
      .filter((c) =>
        (Object.keys(amenities) as AmenityKey[]).every(
          (k) => !amenities[k] || c[k]
        )
      )
      .sort((a, b) => {
        const af = fav.includes(a.id) ? 1 : 0;
        const bf = fav.includes(b.id) ? 1 : 0;
        if (af !== bf) return bf - af;
        return a.title.localeCompare(b.title);
      });
  }, [courts, search, amenities, fav]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => facilityMatchesSearch(f, search));
  }, [facilities, search]);

  // Auto-zoom for map search
  useEffect(() => {
    if (view !== "map") return;

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
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;
      const maxDiff = Math.max(maxLat - minLat, maxLon - minLon);
      let zoom = 11.5;
      if (maxDiff < 0.01) zoom = 15;
      else if (maxDiff < 0.02) zoom = 14;
      else if (maxDiff < 0.05) zoom = 13;
      else if (maxDiff < 0.1) zoom = 12;
      setViewState({ latitude: centerLat, longitude: centerLon, zoom });
    }
  }, [filteredFacilities, search, view]);

  const toggleFav = (id: number) => {
    setFav((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("favoriteCourts", JSON.stringify(next));
      return next;
    });
  };

  const handleMarkerClick = useCallback((facility: FacilityWithCoords) => {
    setSelectedFacility(facility);
    setViewState((prev) => ({
      ...prev,
      latitude: facility.lat,
      longitude: facility.lon,
      zoom: 14,
    }));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
          <h1 className="text-lg font-bold text-gray-900">{today}</h1>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "map"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MapIcon size={16} />
              Map
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List size={16} />
              List
            </button>
          </div>
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

        {/* Amenity Filters (list view only) */}
        {view === "list" && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(Object.entries(amenityConfig) as [AmenityKey, typeof amenityConfig[AmenityKey]][]).map(
              ([k, { label, icon, color, activeColor }]) => {
                const active = amenities[k];
                return (
                  <button
                    key={k}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                      active
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setAmenities((f) => ({ ...f, [k]: !f[k] }))}
                  >
                    <span className={active ? activeColor : color}>{icon}</span>
                    {label}
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "map" ? (
          /* ===== MAP VIEW ===== */
          <div className="h-full w-full relative">
            {MAPBOX_TOKEN ? (
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
                          className="w-8 h-8 rounded-full shadow-lg border-2 border-white"
                          style={{ backgroundColor: getAvailabilityColor(facility) }}
                        />
                        <div
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
                          style={{
                            borderLeft: "7px solid transparent",
                            borderRight: "7px solid transparent",
                            borderTop: `7px solid ${getAvailabilityColor(facility)}`,
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
                    closeButton={false}
                    onClose={() => setSelectedFacility(null)}
                    maxWidth="320px"
                  >
                    <div className="min-w-[280px]">
                      {/* Header - sticky */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-base leading-tight flex-1">
                          {selectedFacility.name}
                        </h3>
                        <button
                          onClick={() => setSelectedFacility(null)}
                          className="p-1 -mr-1 -mt-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getAvailabilityColor(selectedFacility) }}
                        />
                        <span className="text-gray-600">
                          {Math.round(selectedFacility.availableHours)} hrs · {selectedFacility.totalCount} court{selectedFacility.totalCount !== 1 ? 's' : ''}
                        </span>
                        <a
                          href={mapsUrl(selectedFacility)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
                          title="Get directions"
                        >
                          <MapPin size={16} />
                        </a>
                      </div>
                      {/* Scrollable court list */}
                      <div className="max-h-[35vh] overflow-y-auto overscroll-contain -mx-2 px-2">
                        <div className="space-y-2">
                          {selectedFacility.courts.map((court) => (
                            <div key={court.id} className="border-t pt-2 first:border-t-0 first:pt-0">
                              <MicroTimeline court={court} compact={true} showLabel={true} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Popup>
                )}
              </Map>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Mapbox token missing</p>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Availability</div>
              <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span>Some</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span>Low</span>
                </div>
              </div>
            </div>

            {/* Result count */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2">
              <span className="text-xs font-medium text-gray-600">
                {filteredFacilities.length} facilities
              </span>
            </div>
          </div>
        ) : (
          /* ===== LIST VIEW ===== */
          <div className="h-full overflow-y-auto px-4 py-4">
            <p className="text-xs font-medium text-gray-500 mb-3">
              {filteredCourts.length} court{filteredCourts.length !== 1 ? "s" : ""} available
            </p>

            {filteredCourts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 font-medium">No courts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCourts.map((court) => {
                  const isFavorite = fav.includes(court.id);
                  return (
                    <div
                      key={court.id}
                      className={`rounded-2xl bg-white shadow-sm border overflow-hidden transition-all duration-200 ${
                        isFavorite ? "border-yellow-300 shadow-md" : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 leading-snug">
                            {court.title.replace(/ - Court \d+$/, "")}
                          </h3>
                          {court.title.includes(" - Court") && (
                            <p className="text-sm text-gray-500 font-medium">
                              Court {court.title.match(/Court (\d+)/)?.[1]}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {court.lights && (
                            <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center" title="Lights">
                              <Sun size={14} className="text-amber-600" />
                            </span>
                          )}
                          {court.hitting_wall && (
                            <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center" title="Hitting Wall">
                              <Target size={14} className="text-blue-600" />
                            </span>
                          )}
                          {court.pickleball_lined && (
                            <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center" title="Pickleball">
                              <Circle size={14} className="text-green-600" />
                            </span>
                          )}
                          {court.ball_machine && (
                            <>
                              <span className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center sm:hidden" title="Ball Machine">
                                <Zap size={14} className="text-purple-600" />
                              </span>
                              <button
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-shadow"
                                onClick={() => window.open("https://seattleballmachine.com", "_blank")}
                              >
                                <Zap size={12} />
                                Rent
                              </button>
                            </>
                          )}
                          <button
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                            onClick={() => window.open(mapsUrl(court) as string, "_blank")}
                          >
                            <MapPin size={18} className="text-gray-500" />
                          </button>
                          <button
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                            onClick={() => toggleFav(court.id)}
                          >
                            <Star
                              size={18}
                              fill={isFavorite ? "currentColor" : "none"}
                              className={isFavorite ? "text-yellow-500" : "text-gray-400"}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="px-3 pb-3 space-y-1">
                        <div className="flex gap-0.5">
                          {TIME_SLOTS.slice(0, 8).map((slot) => {
                            const status = getSlotStatus(court, slot.time);
                            const isSelected = selectedSlot?.courtId === court.id && selectedSlot?.time === slot.time;
                            return (
                              <button
                                key={slot.time}
                                onClick={() => setSelectedSlot({
                                  courtId: court.id,
                                  time: slot.time,
                                  status,
                                  description: getSlotDescription(slot.time, status),
                                })}
                                className={`flex-1 h-7 flex items-center justify-center text-[11px] font-semibold rounded-md transition-all ${getSlotColor(status)} ${isSelected ? "ring-2 ring-offset-1 ring-gray-800" : ""}`}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-0.5">
                          {TIME_SLOTS.slice(8).map((slot) => {
                            const status = getSlotStatus(court, slot.time);
                            const isSelected = selectedSlot?.courtId === court.id && selectedSlot?.time === slot.time;
                            return (
                              <button
                                key={slot.time}
                                onClick={() => setSelectedSlot({
                                  courtId: court.id,
                                  time: slot.time,
                                  status,
                                  description: getSlotDescription(slot.time, status),
                                })}
                                className={`flex-1 h-7 flex items-center justify-center text-[11px] font-semibold rounded-md transition-all ${getSlotColor(status)} ${isSelected ? "ring-2 ring-offset-1 ring-gray-800" : ""}`}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                        {selectedSlot?.courtId === court.id && (
                          <div className={`mt-2 px-3 py-2 rounded-lg text-center text-sm font-medium ${selectedSlot.status !== "none" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                            {selectedSlot.status !== "none" ? `Available ${selectedSlot.description}` : selectedSlot.description}
                          </div>
                        )}
                      </div>

                      {court.ball_machine && (
                        <div className="px-3 pb-3 sm:hidden">
                          <button
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-200 hover:shadow-lg transition-shadow"
                            onClick={() => window.open("https://seattleballmachine.com", "_blank")}
                          >
                            Rent Ball Machine
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-500 pt-6 pb-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-emerald-500" />
                <span>Full Hour</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-orange-400" />
                <span>Half Hour</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-gray-200" />
                <span>Booked</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
        <button
          onClick={() => setShowMenuModal(true)}
          className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg shadow-lg border border-emerald-500 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          First Serve Seattle
          <ChevronUp size={16} className="text-emerald-500" />
        </button>
        <a
          href="https://seattleballmachine.com"
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg shadow-lg border border-blue-600 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          <Zap size={16} className="text-blue-600" />
          Ball Machine
        </a>
      </div>

      {/* Test button to re-show walkthrough */}
      <div className="fixed top-20 right-4 z-40">
        <button
          onClick={() => setShowWalkthrough(true)}
          className="px-3 py-1.5 bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-lg hover:bg-purple-600 transition-colors"
        >
          Show Walkthrough
        </button>
      </div>

      {/* Walkthrough Modal */}
      <WalkthroughModal
        isOpen={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
        onSetupNotifications={handleSetupNotifications}
      />

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
                  router.push('/login');
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
                  setShowEmailModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Get Notified</p>
                  <p className="text-sm text-gray-500">Email alerts for open courts</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  router.push('/paywall');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Star size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Subscribe</p>
                  <p className="text-sm text-gray-500">Unlock all features</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  window.open('https://seattleballmachine.com', '_blank');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Zap size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ball Machine</p>
                  <p className="text-sm text-gray-500">Rent a ball machine</p>
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

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailSuccess}
      />
    </div>
  );
}
