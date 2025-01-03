"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { getTennisCourts } from "@/lib/getTennisCourts";
import Image from "next/image";

// Keep existing interfaces and utility functions
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

export default function TennisCourtList() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [favoriteCourts, setFavoriteCourts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
  });
  const [expandedMaps, setExpandedMaps] = useState<number[]>([]);
  // Removed isFiltersVisible state since filters are always shown

  const timesInOneHour = [
    "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM",
    "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
    "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
    "9:00 PM", "10:00 PM"
  ];

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Keep existing useEffect hooks and utility functions
  useEffect(() => {
    getTennisCourts()
      .then((data) => {
        setCourts(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch tennis courts:", error);
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
        ? prev.filter(id => id !== courtId)
        : [...prev, courtId]
    );
  };

  // Keep existing filtering and sorting logic
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

  const sorted = [...filtered].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function isAvailableAtTime(court: Court, timeSlot: string): boolean {
    if (!Array.isArray(court.parsed_intervals)) return false;
    const timeMinutes = timeToMinutes(timeSlot);
    return court.parsed_intervals.some((interval) => {
      const startM = timeToMinutes(interval.start);
      const endM = timeToMinutes(interval.end);
      return timeMinutes >= startM && timeMinutes < endM;
    });
  }

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
      {/* Sticky Header with Search */}
      <div className="sticky top-0 bg-white z-10 pb-2 space-y-3">
        <div className="text-2xl font-bold text-gray-800">
          {todayDate}
        </div>

        {/* Search and Filter Bar */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search courts by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Always Visible Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2">
            <Button
              onClick={() => toggleFilter("lights")}
              className={`flex items-center justify-center gap-1 shrink-0 px-3 ${
                filters.lights
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Image src="/icons/lighticon.png" alt="Lights" width={16} height={16} />
              <span>Lights</span>
            </Button>

            <Button
              onClick={() => toggleFilter("pickleball_lined")}
              className={`flex items-center justify-center gap-1 shrink-0 px-3 ${
                filters.pickleball_lined
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Image src="/icons/pickleballicon.png" alt="Pickleball" width={16} height={16} />
              <span>Pickleball</span>
            </Button>

            <Button
              onClick={() => toggleFilter("hitting_wall")}
              className={`flex items-center justify-center gap-1 shrink-0 px-3 ${
                filters.hitting_wall
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Image src="/icons/wallicon.png" alt="Hitting Wall" width={16} height={16} />
              <span>Wall</span>
            </Button>
          </div>
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
              {/* Court Header */}
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

                {/* Amenities Icons */}
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
                {/* Time Slots Grid - Always Visible */}
                <div className="grid grid-cols-3 gap-2">
                  {timesInOneHour.map((timeSlot, idx) => {
                    const available = isAvailableAtTime(court, timeSlot);
                    return (
                      <div
                        key={idx}
                        className={`text-center py-1 px-1 rounded-md text-sm ${
                          available
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {timeSlot}
                      </div>
                    );
                  })}
                </div>

                {/* Maps Section Toggle */}
                <Button
                  onClick={() => toggleMapExpansion(court.id)}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
                >
                  <MapPin size={16} />
                  {expandedMaps.includes(court.id) ? "Hide Location" : "Show Location"}
                </Button>

                {/* Expandable Maps Section */}
                {expandedMaps.includes(court.id) && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">{court.address}</p>
                    <Button
                      onClick={() => window.open(getGoogleMapsUrl(court), "_blank", "noopener,noreferrer")}
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