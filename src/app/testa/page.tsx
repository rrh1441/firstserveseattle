"use client";

import { useState, useEffect, useMemo } from "react";
import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";
import { courtMatchesSearch } from "@/lib/neighborhoodMapping";
import {
  Star,
  MapPin,
  Sun,
  Target,
  Circle,
  Zap,
  Search
} from "lucide-react";

type AmenityKey = "lights" | "hitting_wall" | "pickleball_lined" | "ball_machine";

// Compact time labels - 16 slots total (8 per row)
const TIME_SLOTS = [
  // Morning row: 6a-1 (covers 6am-2pm)
  { time: "6:00 AM", label: "6a" },
  { time: "7:00 AM", label: "7" },
  { time: "8:00 AM", label: "8" },
  { time: "9:00 AM", label: "9" },
  { time: "10:00 AM", label: "10" },
  { time: "11:00 AM", label: "11" },
  { time: "12:00 PM", label: "12p" },
  { time: "1:00 PM", label: "1" },
  // Afternoon row: 2-9 (covers 2pm-10pm)
  { time: "2:00 PM", label: "2" },
  { time: "3:00 PM", label: "3" },
  { time: "4:00 PM", label: "4" },
  { time: "5:00 PM", label: "5" },
  { time: "6:00 PM", label: "6" },
  { time: "7:00 PM", label: "7" },
  { time: "8:00 PM", label: "8" },
  { time: "9:00 PM", label: "9" },
];

const toMin = (t: string) => {
  const [clock, ap] = t.toUpperCase().split(" ");
  const [h, m] = clock.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
};

const isSlotAvailable = (court: TennisCourt, timeStr: string): boolean => {
  const slotStart = toMin(timeStr);
  const slotEnd = slotStart + 60;
  return court.parsed_intervals.some(({ start, end }) => {
    const intervalStart = toMin(start);
    const intervalEnd = toMin(end);
    return intervalStart <= slotStart && intervalEnd >= slotEnd;
  });
};

const mapsUrl = (c: TennisCourt) =>
  c.Maps_url?.startsWith("http")
    ? c.Maps_url
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        c.address ?? c.title
      )}`;

// Amenity config with Lucide icons and colors
const amenityConfig: Record<AmenityKey, { label: string; icon: React.ReactNode; color: string; activeColor: string }> = {
  lights: { label: "Lights", icon: <Sun size={14} />, color: "text-amber-500", activeColor: "text-white" },
  hitting_wall: { label: "Wall", icon: <Target size={14} />, color: "text-blue-500", activeColor: "text-white" },
  pickleball_lined: { label: "Pickleball", icon: <Circle size={14} />, color: "text-green-500", activeColor: "text-white" },
  ball_machine: { label: "Machine", icon: <Zap size={14} />, color: "text-purple-500", activeColor: "text-white" },
};

export default function TestAPage() {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fav, setFav] = useState<number[]>([]);
  const [amenities, setAmenities] = useState<Record<AmenityKey, boolean>>({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
    ball_machine: false,
  });

  useEffect(() => {
    // Load favorites from localStorage first (sync)
    try {
      const raw = localStorage.getItem("favoriteCourts");
      if (raw) setFav(JSON.parse(raw));
    } catch {
      /* ignore */
    }

    // Then fetch courts
    getTennisCourts()
      .then((data) => setCourts(data))
      .finally(() => setLoading(false));
  }, []);

  const toggleFav = (id: number) => {
    setFav((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem("favoriteCourts", JSON.stringify(next));
      return next;
    });
  };

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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded-lg w-48" />
          <div className="h-10 bg-gray-200 rounded-xl" />
          <div className="h-24 bg-gray-200 rounded-2xl" />
          <div className="h-24 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 pb-3 pt-4">
        <h1 className="text-xl font-bold text-gray-900 mb-3">{today}</h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courts or neighborhoods…"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Amenity Filters */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(amenityConfig) as [AmenityKey, { label: string; icon: React.ReactNode; color: string; activeColor: string }][]).map(
            ([k, { label, icon, color, activeColor }]) => {
              const active = amenities[k];
              return (
                <button
                  key={k}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                    transition-all duration-200
                    ${active
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                  onClick={() => setAmenities((f) => ({ ...f, [k]: !f[k] }))}
                >
                  <span className={active ? activeColor : color}>{icon}</span>
                  {label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Results count */}
        <p className="text-xs font-medium text-gray-500 mb-3">
          {filteredCourts.length} court{filteredCourts.length !== 1 ? "s" : ""} available
        </p>

        {/* Courts List */}
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
                  className={`
                    rounded-2xl bg-white shadow-sm border overflow-hidden
                    transition-all duration-200
                    ${isFavorite ? "border-yellow-300 shadow-md" : "border-gray-100"}
                  `}
                >
                  {/* Court Header */}
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
                      {/* Amenity pills */}
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
                        <span className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center" title="Ball Machine">
                          <Zap size={14} className="text-purple-600" />
                        </span>
                      )}
                      <button
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        onClick={() => window.open(mapsUrl(court), "_blank")}
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

                  {/* Timeline */}
                  <div className="px-3 pb-3 space-y-1">
                    {/* Morning row */}
                    <div className="flex gap-0.5">
                      {TIME_SLOTS.slice(0, 8).map((slot) => {
                        const available = isSlotAvailable(court, slot.time);
                        return (
                          <div
                            key={slot.time}
                            className={`
                              flex-1 h-7 flex items-center justify-center
                              text-[11px] font-semibold rounded-md
                              ${available
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 text-gray-400"
                              }
                            `}
                          >
                            {slot.label}
                          </div>
                        );
                      })}
                    </div>
                    {/* Afternoon row */}
                    <div className="flex gap-0.5">
                      {TIME_SLOTS.slice(8).map((slot) => {
                        const available = isSlotAvailable(court, slot.time);
                        return (
                          <div
                            key={slot.time}
                            className={`
                              flex-1 h-7 flex items-center justify-center
                              text-[11px] font-semibold rounded-md
                              ${available
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 text-gray-400"
                              }
                            `}
                          >
                            {slot.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ball Machine Link */}
                  {court.ball_machine && (
                    <div className="px-3 pb-3">
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

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs font-medium text-gray-500 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-md bg-emerald-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-md bg-gray-100" />
            <span>Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
