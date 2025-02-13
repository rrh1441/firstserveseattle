"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin } from "lucide-react";
import { getTennisCourts } from "@/lib/getTennisCourts";
import Image from "next/image";

interface ParsedInterval {
  date: string;
  start: string;
  end: string;
}

interface Court {
  id: number;
  title: string;
  facility_type: string;
  address: string;
  google_maps_url?: string;
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  parsed_intervals: ParsedInterval[];
}

function timeToMinutes(str: string): number {
  if (!str) return -1;
  const [time, ampm] = str.toUpperCase().split(" ");
  if (!time || !ampm) return -1;

  const [hhStr, mmStr] = time.split(":");
  const hh = parseInt(hhStr, 10) || 0;
  const mm = parseInt(mmStr, 10) || 0;
  const adjustedHh =
    ampm === "PM" && hh < 12 ? hh + 12 : ampm === "AM" && hh === 12 ? 0 : hh;
  return adjustedHh * 60 + mm;
}

function isRangeFree(court: Court, startM: number, endM: number): boolean {
  if (!Array.isArray(court.parsed_intervals)) return false;
  return court.parsed_intervals.some((interval) => {
    const intervalStart = timeToMinutes(interval.start);
    const intervalEnd = timeToMinutes(interval.end);
    return intervalStart <= startM && intervalEnd >= endM;
  });
}

function getHourAvailabilityColor(court: Court, hourSlot: string): string {
  const startM = timeToMinutes(hourSlot);
  const midM = startM + 30;
  const endM = startM + 60;

  const half1Free = isRangeFree(court, startM, midM);
  const half2Free = isRangeFree(court, midM, endM);

  if (half1Free && half2Free) {
    return "bg-green-500 text-white";
  } else if (!half1Free && !half2Free) {
    return "bg-gray-300 text-gray-600";
  } else {
    return "bg-orange-300 text-orange-800";
  }
}

export default function TennisCourtList() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [favoriteCourts, setFavoriteCourts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
  });
  const [expandedMaps, setExpandedMaps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timesInOneHour = [
    "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM",
    "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
    "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
    "9:00 PM", "10:00 PM"
  ];

  useEffect(() => {
    getTennisCourts()
      .then((data) => {
        setCourts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tennis courts:", err);
        setError("Failed to load tennis courts. Please try again later.");
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favoriteCourts");
    if (storedFavorites) {
      setFavoriteCourts(JSON.parse(storedFavorites));
    }
  }, []);

  const toggleFavorite = (courtId: number) => {
    const updated = favoriteCourts.includes(courtId)
      ? favoriteCourts.filter((id) => id !== courtId)
      : [...favoriteCourts, courtId];
    setFavoriteCourts(updated);
    localStorage.setItem("favoriteCourts", JSON.stringify(updated));
  };

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  const toggleMapExpansion = (courtId: number) => {
    setExpandedMaps((prev) =>
      prev.includes(courtId)
        ? prev.filter((id) => id !== courtId)
        : [...prev, courtId]
    );
  };

  const filtered = courts.filter((court) => {
    const matchesSearch = court.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilters = Object.keys(filters).every((key) => {
      if (!filters[key as keyof typeof filters]) return true;
      return court[key as keyof typeof filters];
    });
    return matchesSearch && matchesFilters;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aFav = favoriteCourts.includes(a.id) ? 1 : 0;
    const bFav = favoriteCourts.includes(b.id) ? 1 : 0;
    if (aFav !== bFav) {
      return bFav - aFav;
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const getGoogleMapsUrl = (court: Court): string => {
    if (court.google_maps_url && court.google_maps_url.trim() !== "") {
      return court.google_maps_url;
    }
    const encodedAddress = encodeURIComponent(court.address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl">Loading tennis courts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-black min-h-screen p-2 sm:p-4 space-y-4">
      {/* Date & Search/Filter Section */}
      <div className="sticky top-0 bg-white z-10 pb-2 space-y-3">
        <div className="text-2xl font-bold text-gray-800">{todayDate}</div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search courts by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => toggleFilter("lights")}
              className={`flex items-center justify-center gap-1 px-2 h-9 ${
                filters.lights
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Image src="/icons/lighticon.png" alt="Lights" width={14} height={14} />
              <span className="text-sm">Lights</span>
            </Button>

            <Button
              onClick={() => toggleFilter("pickleball_lined")}
              className={`flex items-center justify-center gap-1 px-2 h-9 ${
                filters.pickleball_lined
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Image src="/icons/pickleballicon.png" alt="Pickleball" width={14} height={14} />
              <span className="text-sm">Pickle</span>
            </Button>

            <Button
              onClick={() => toggleFilter("hitting_wall")}
              className={`flex items-center justify-center gap-1 px-2 h-9 ${
                filters.hitting_wall
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Image src="/icons/wallicon.png" alt="Hitting Wall" width={14} height={14} />
              <span className="text-sm">Wall</span>
            </Button>
          </div>
        </div>

        {/* -- Color Key (new) -- */}
        <div className="mt-2 p-4 bg-gray-50 border rounded text-sm text-gray-700">
          <p>
            <strong>Color Key:</strong>
            <br />
            <span className="block mt-1">
              <span className="font-semibold">Green</span> = fully available
            </span>
            <span className="block">
              <span className="font-semibold">Orange</span> = partially available
            </span>
            <span className="block">
              <span className="font-semibold">Gray</span> = fully reserved
            </span>
          </p>
        </div>

        {/* Keep the note about lights if you want */}
        <div className="mt-1 text-left text-small text-gray-500">
          <p>Note: Lights are typically available March–October.</p>
        </div>
      </div>

      {/* Courts List */}
      {sorted.length === 0 ? (
        <div className="text-center text-lg text-gray-600 mt-8">
          No courts found matching your criteria.
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {sorted.map((court) => (
            <Card key={court.id} className="shadow-md overflow-hidden">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{court.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(court.id)}
                      className="p-1"
                    >
                      <Star
                        className={
                          favoriteCourts.includes(court.id)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400"
                        }
                      />
                    </Button>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {court.lights && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/lighticon.png" alt="Lights" width={14} height={14} />
                      <span className="text-sm">Lights</span>
                    </div>
                  )}
                  {court.pickleball_lined && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/pickleballicon.png" alt="Pickleball" width={14} height={14} />
                      <span className="text-sm">Pickleball</span>
                    </div>
                  )}
                  {court.hitting_wall && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/wallicon.png" alt="Hitting Wall" width={14} height={14} />
                      <span className="text-sm">Wall</span>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {timesInOneHour.map((timeSlot, idx) => {
                    const colorClass = getHourAvailabilityColor(court, timeSlot);
                    return (
                      <div
                        key={idx}
                        className={`text-center py-1 px-1 rounded-md text-sm ${colorClass}`}
                      >
                        {timeSlot}
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={() => toggleMapExpansion(court.id)}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
                >
                  <MapPin size={16} />
                  {expandedMaps.includes(court.id) ? "Hide Location" : "Show Location"}
                </Button>

                {expandedMaps.includes(court.id) && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">{court.address}</p>
                    <Button
                      onClick={() =>
                        window.open(getGoogleMapsUrl(court), "_blank", "noopener,noreferrer")
                      }
                      className="w-full bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Open in Maps
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}