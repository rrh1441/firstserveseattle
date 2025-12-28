"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";
import { courtMatchesSearch } from "@/lib/neighborhoodMapping";
import { Button } from "@/components/ui/button";
import { Star, MapPin } from "lucide-react";

type AmenityKey = "lights" | "hitting_wall" | "pickleball_lined" | "ball_machine";

// Compact time labels: 6a, 7, 8... 12p, 1, 2...
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
  { time: "10:00 PM", label: "10p" },
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

const amenityCfg: Record<AmenityKey, { label: string; icon: string }> = {
  lights: { label: "Lights", icon: "/icons/lighticon.png" },
  hitting_wall: { label: "Wall", icon: "/icons/wallicon.png" },
  pickleball_lined: { label: "Pickleball", icon: "/icons/pickleballicon.png" },
  ball_machine: { label: "Machine", icon: "/icons/ballmachine.png" },
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
    getTennisCourts()
      .then((data) => setCourts(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("favoriteCourts");
      if (raw) setFav(JSON.parse(raw));
    } catch {
      /* ignore */
    }
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
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b pb-3 pt-2 space-y-3">
        <div className="text-lg font-semibold">{today}</div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courts or neighborhoods…"
          className="w-full p-2 border rounded text-sm"
        />

        {/* Amenity Filters */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(amenityCfg) as [AmenityKey, { label: string; icon: string }][]).map(
            ([k, { label, icon }]) => {
              const active = amenities[k];
              return (
                <Button
                  key={k}
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-1 text-xs ${
                    active
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "bg-transparent"
                  }`}
                  onClick={() => setAmenities((f) => ({ ...f, [k]: !f[k] }))}
                >
                  <Image src={icon} alt="" width={12} height={12} />
                  {label}
                </Button>
              );
            }
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500">
        {filteredCourts.length} court{filteredCourts.length !== 1 ? "s" : ""}
      </p>

      {/* Courts List */}
      {filteredCourts.length === 0 ? (
        <div className="text-gray-500 text-sm">No courts found.</div>
      ) : (
        <div className="space-y-3">
          {filteredCourts.map((court) => (
            <div
              key={court.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Court Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{court.title}</h3>
                  {/* Amenity icons */}
                  <div className="flex gap-2 mt-0.5">
                    {court.lights && (
                      <Image src="/icons/lighticon.png" alt="Lights" width={10} height={10} />
                    )}
                    {court.hitting_wall && (
                      <Image src="/icons/wallicon.png" alt="Wall" width={10} height={10} />
                    )}
                    {court.pickleball_lined && (
                      <Image src="/icons/pickleballicon.png" alt="Pickleball" width={10} height={10} />
                    )}
                    {court.ball_machine && (
                      <Image src="/icons/ballmachine.png" alt="Ball Machine" width={10} height={10} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(mapsUrl(court), "_blank")}
                  >
                    <MapPin size={16} className="text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleFav(court.id)}
                  >
                    <Star
                      size={16}
                      fill={fav.includes(court.id) ? "currentColor" : "none"}
                      className={fav.includes(court.id) ? "text-yellow-500" : "text-gray-400"}
                    />
                  </Button>
                </div>
              </div>

              {/* Timeline - single row with all slots */}
              <div className="px-2 py-2">
                <div className="flex gap-px">
                  {TIME_SLOTS.map((slot) => {
                    const available = isSlotAvailable(court, slot.time);
                    return (
                      <div
                        key={slot.time}
                        className={`
                          flex-1 h-7 flex items-center justify-center
                          text-[10px] font-medium rounded-sm
                          ${available
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-200 text-gray-400"
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
                <div className="px-3 pb-2">
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs bg-blue-700 hover:bg-blue-800"
                    onClick={() => window.open("https://seattleballmachine.com", "_blank")}
                  >
                    <Image src="/icons/ballmachine.png" alt="" width={12} height={12} className="mr-1" />
                    Ball Machine Rental
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-600 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          <span>Open</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-gray-200" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}
