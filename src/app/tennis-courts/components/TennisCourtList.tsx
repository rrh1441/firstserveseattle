"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card"; // Removed CardHeader import
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { getTennisCourts } from "@/lib/getTennisCourts";
import Image from "next/image";

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
  google_maps_url?: string; // Made optional
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  parsed_intervals: ParsedInterval[];
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

  const timesInOneHour = [
    "6:00 AM",
    "7:00 AM",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
    "10:00 PM",
  ];

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Function to construct Google Maps URL if not provided
  const getGoogleMapsUrl = (court: Court): string => {
    if (court.google_maps_url && court.google_maps_url.trim() !== "") {
      return court.google_maps_url;
    }
    // Fallback: Construct URL using the address
    const encodedAddress = encodeURIComponent(court.address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white text-black min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading tennis courts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white text-black min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-black min-h-screen p-4 space-y-6 mt-6">
      {/* Date Display */}
      <div className="text-left text-3xl font-bold text-gray-800 mb-4">
        {todayDate}
      </div>

      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search courts by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 p-2 rounded-md w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Amenity Filter Buttons */}
        <div className="flex space-x-2 overflow-x-auto flex-nowrap">
          {/* Lights Filter */}
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded-md transition-colors duration-200 text-sm whitespace-nowrap ${
              filters.lights
                ? "bg-green-100 border-green-500 text-green-700 hover:bg-green-200"
                : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => toggleFilter("lights")}
          >
            <Image src="/icons/lighticon.png" alt="Lights" width={16} height={16} />
            <span>Lights</span>
          </button>

          {/* Hitting Wall Filter */}
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded-md transition-colors duration-200 text-sm whitespace-nowrap ${
              filters.hitting_wall
                ? "bg-green-100 border-green-500 text-green-700 hover:bg-green-200"
                : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => toggleFilter("hitting_wall")}
          >
            <Image src="/icons/wallicon.png" alt="Hitting Wall" width={16} height={16} />
            <span>Hitting Wall</span>
          </button>

          {/* Pickleball Lined Filter */}
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded-md transition-colors duration-200 text-sm whitespace-nowrap ${
              filters.pickleball_lined
                ? "bg-green-100 border-green-500 text-green-700 hover:bg-green-200"
                : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => toggleFilter("pickleball_lined")}
          >
            <Image
              src="/icons/pickleballicon.png"
              alt="Pickleball"
              width={16}
              height={16}
            />
            <span>Pickleball</span>
          </button>
        </div>
      </div>

      {/* Courts List */}
      {sorted.length === 0 ? (
        <div className="text-center text-lg text-gray-600">
          No courts found matching your criteria.
        </div>
      ) : (
        sorted.map((court) => (
          <Card key={court.id} className="shadow-md">
            {/* Custom Card Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              {/* Left Section: Title and Amenities */}
              <div className="flex items-center gap-3">
                {/* Court Title */}
                <span className="text-lg font-semibold truncate max-w-xs">
                  {court.title}
                </span>

                {/* Amenities Icons Next to Title */}
                <div className="flex items-center gap-2">
                  {court.lights && (
                    <div className="flex items-center gap-1">
                      <Image
                        src="/icons/lighticon.png"
                        alt="Lights"
                        width={16}
                        height={16}
                      />
                      <span className="text-sm">Lights</span>
                    </div>
                  )}
                  {court.hitting_wall && (
                    <div className="flex items-center gap-1">
                      <Image
                        src="/icons/wallicon.png"
                        alt="Hitting Wall"
                        width={16}
                        height={16}
                      />
                      <span className="text-sm">Hitting Wall</span>
                    </div>
                  )}
                  {court.pickleball_lined && (
                    <div className="flex items-center gap-1">
                      <Image
                        src="/icons/pickleballicon.png"
                        alt="Pickleball"
                        width={16}
                        height={16}
                      />
                      <span className="text-sm">Pickleball</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(court.id)}
                aria-label={
                  favoriteCourts.includes(court.id)
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
                className="hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
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

            <CardContent>
              {/* Availability Times */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                {timesInOneHour.map((timeSlot, idx) => {
                  const available = isAvailableAtTime(court, timeSlot);
                  return (
                    <div
                      key={idx}
                      className={`text-center py-1 rounded-md text-sm font-medium ${
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

              {/* Open in Maps Button */}
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() =>
                    window.open(getGoogleMapsUrl(court), "_blank", "noopener,noreferrer")
                  }
                  className="w-full md:w-auto bg-blue-500 text-white border border-blue-500 hover:bg-blue-600 transition-colors duration-200"
                >
                  Open in Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}