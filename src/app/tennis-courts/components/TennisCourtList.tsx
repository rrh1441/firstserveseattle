// src/app/tennis-courts/components/TennisCourtList.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Info, Users, Zap, Snowflake, HelpCircle } from "lucide-react";

const AboutUs = dynamic(() => import("./AboutUs"), { ssr: false });

type FilterKey = "lights" | "hitting_wall" | "pickleball_lined" | "ball_machine";

interface PopularityTier {
  label: string;
  tooltip: string;
  colorClass: string;
  icon: typeof Users | typeof Zap | typeof Snowflake | typeof HelpCircle;
}

function getPopularityTier(score: number | null | undefined): PopularityTier {
  if (score == null) {
    return {
      label: "N/A",
      tooltip: "Popularity data unavailable.",
      colorClass: "bg-gray-100 text-gray-600 border-gray-300",
      icon: HelpCircle,
    };
  }
  if (score === 0) {
    return {
      label: "Walk-on Only",
      tooltip: "Reservations not available.",
      colorClass: "bg-gray-200 text-gray-700 border-gray-400",
      icon: Users,
    };
  }
  if (score <= 45) {
    return {
      label: "Chill",
      tooltip: "Light-moderate traffic over the last week.",
      colorClass: "bg-blue-100 text-blue-800 border-blue-300",
      icon: Snowflake,
    };
  }
  if (score <= 70) {
    return {
      label: "Busy",
      tooltip: "Often busy over the last week, reservation advised.",
      colorClass: "bg-orange-100 text-orange-800 border-orange-300",
      icon: Users,
    };
  }
  return {
    label: "Hot",
    tooltip: "High demand over the last week, reservation recommended.",
    colorClass: "bg-red-100 text-red-800 border-red-300",
    icon: Zap,
  };
}

function timeToMinutes(str: string): number {
  const [time, ampm] = str.toUpperCase().split(" ");
  if (!time || !ampm) return -1;
  const [hhStr, mmStr] = time.split(":");
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);
  if (isNaN(hh) || isNaN(mm)) return -1;
  let hour = hh % 12;
  if (ampm === "PM") hour += 12;
  return hour * 60 + mm;
}

function isRangeFree(court: TennisCourt, start: number, end: number): boolean {
  return court.parsed_intervals.some((iv) => {
    const s = timeToMinutes(iv.start);
    const e = timeToMinutes(iv.end);
    return s <= start && e >= end;
  });
}

function getHourAvailabilityColor(court: TennisCourt, slot: string): string {
  const start = timeToMinutes(slot);
  if (start === -1) return "bg-gray-200 text-gray-400";
  const mid = start + 30;
  const end = start + 60;
  const first = isRangeFree(court, start, mid);
  const second = isRangeFree(court, mid, end);
  if (first && second) return "bg-green-500 text-white";
  if (!first && !second) return "bg-gray-400 text-gray-100";
  return "bg-orange-400 text-white";
}

function CourtCardSkeleton() {
  return (
    <Card className="shadow-md border border-gray-200 rounded-lg animate-pulse">
      <div className="p-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="flex flex-wrap gap-1">
              <div className="h-3 bg-gray-200 rounded w-12" />
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-10" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-20 mt-2" />
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>
      </div>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {Array.from({ length: 17 }).map((_, i) => (
            <div key={i} className="h-8 sm:h-9 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="h-8 bg-gray-200 rounded w-full mt-3" />
        <div className="h-8 bg-gray-200 rounded w-full mt-2" />
      </CardContent>
    </Card>
  );
}

function CourtListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <CourtCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export default function TennisCourtList() {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [favoriteCourts, setFavoriteCourts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
    ball_machine: false,
  });
  const [expandedMaps, setExpandedMaps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

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

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getTennisCourts()
      .then((data) => setCourts(data))
      .catch((err) => setError(err.message || "Failed to load courts."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("favoriteCourts");
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
          setFavoriteCourts(arr);
        } else {
          localStorage.removeItem("favoriteCourts");
        }
      }
    } catch {
      localStorage.removeItem("favoriteCourts");
    }
  }, []);

  const toggleFavorite = (courtId: number) => {
    setFavoriteCourts((prev) => {
      const next = prev.includes(courtId)
        ? prev.filter((id) => id !== courtId)
        : [...prev, courtId];
      localStorage.setItem("favoriteCourts", JSON.stringify(next));
      return next;
    });
  };

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMapExpansion = (courtId: number) => {
    setExpandedMaps((prev) =>
      prev.includes(courtId)
        ? prev.filter((id) => id !== courtId)
        : [...prev, courtId]
    );
  };

  const getGoogleMapsUrl = (court: TennisCourt): string => {
    if (court.Maps_url?.trim().startsWith("http")) {
      return court.Maps_url;
    }
    const query = encodeURIComponent(court.address || court.title || "Seattle Tennis Court");
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // Filter + sort
  const filteredCourts = courts
    .filter((c) =>
      searchTerm
        ? c.title.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    )
    .filter((c) =>
      (Object.keys(filters) as FilterKey[]).every((k) =>
        filters[k] ? c[k] : true
      )
    );

  const sortedCourts = [...filteredCourts].sort((a, b) => {
    const aFav = favoriteCourts.includes(a.id) ? 1 : 0;
    const bFav = favoriteCourts.includes(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  if (isLoading) {
    return (
      <div className="bg-white text-black p-2 sm:p-0 space-y-4">  
        {aboutModalOpen && (
          <AboutUs
            isOpen={aboutModalOpen}
            onClose={() => setAboutModalOpen(false)}
          />
        )}
        <CourtListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-10 px-4">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Oops! Something went wrong.
          </h3>
          <p className="text-base text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black p-2 sm:p-0 space-y-4">
      {aboutModalOpen && (
        <AboutUs isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-grow space-y-3 w-full sm:w-auto">
            <div className="text-xl font-semibold text-gray-700">{todayDate}</div>
            <input
              type="text"
              placeholder="Search courts by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
            />
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
              {({
                lights: { label: "Lights", icon: "/icons/lighticon.png" },
                pickleball_lined: {
                  label: "Pickleball",
                  icon: "/icons/pickleballicon.png",
                },
                hitting_wall: { label: "Wall", icon: "/icons/wallicon.png" },
                ball_machine: {
                  label: "Machine",
                  icon: "/icons/ballmachine.png",
                },
              } as const). /* no .entries() so TS sees used keys */(() =>
                Object.entries(
                  {
                    lights: { label: "Lights", icon: "/icons/lighticon.png" },
                    pickleball_lined: {
                      label: "Pickleball",
                      icon: "/icons/pickleballicon.png",
                    },
                    hitting_wall: {
                      label: "Wall",
                      icon: "/icons/wallicon.png",
                    },
                    ball_machine: {
                      label: "Machine",
                      icon: "/icons/ballmachine.png",
                    },
                  } as Record<FilterKey, { label: string; icon: string }>
                )
              )().map(([key, { label, icon }]) => {
                const k = key as FilterKey;
                return (
                  <Button
                    key={key}
                    onClick={() => toggleFilter(k)}
                    variant="outline"
                    className={`flex items-center gap-1.5 px-3 h-9 text-sm transition-colors duration-150 shadow-sm w-full sm:w-auto ${
                      filters[k]
                        ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 ring-1 ring-blue-300"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Image
                      src={icon}
                      alt=""
                      width={14}
                      height={14}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex-shrink-0 mt-2 sm:mt-0 self-center sm:self-start sm:ml-4">
            <Button
              onClick={() => setAboutModalOpen(true)}
              variant="outline"
              className="bg-gray-700 text-white hover:bg-gray-800 border-gray-700 px-3 h-9 text-sm flex items-center gap-1.5 shadow-sm"
            >
              <Info size={16} />
              Info / Key
            </Button>
          </div>
        </div>
      </div>

      {/* Court List */}
      {sortedCourts.length === 0 ? (
        <div className="text-center text-base text-gray-600 py-10 px-4">
          {courts.length > 0
            ? "No courts found matching your current search or filters."
            : "No court data available at this time."}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCourts.map((court) => {
            const tier = getPopularityTier(court.avg_busy_score_7d);
            const Icon = tier.icon;
            return (
              <Card
                key={court.id}
                className="shadow-md overflow-hidden border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-200"
              >
                {/* Card Header */}
                <div className="p-3 border-b border-gray-100 bg-gray-50/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base sm:text-lg font-semibold truncate text-gray-800"
                        title={court.title}
                      >
                        {court.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-600">
                        {court.lights && (
                          <div className="flex items-center gap-1" title="Lights available">
                            <Image
                              src="/icons/lighticon.png"
                              alt="Lights"
                              width={12}
                              height={12}
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                            Lights
                          </div>
                        )}
                        {court.pickleball_lined && (
                          <div className="flex items-center gap-1" title="Pickleball lines">
                            <Image
                              src="/icons/pickleballicon.png"
                              alt="Pickleball"
                              width={12}
                              height={12}
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                            Pickleball
                          </div>
                        )}
                        {court.hitting_wall && (
                          <div className="flex items-center gap-1" title="Hitting wall available">
                            <Image
                              src="/icons/wallicon.png"
                              alt="Wall"
                              width={12}
                              height={12}
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                            Wall
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className={`inline-flex items-center text-xs h-5 px-1.5 cursor-default ${tier.colorClass}`}
                          title={tier.tooltip}
                        >
                          <Icon size={10} className="mr-1" />
                          {tier.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        onClick={() => toggleFavorite(court.id)}
                        className="p-1 h-8 w-8 rounded-full text-gray-400 hover:bg-yellow-100 hover:text-yellow-500 transition-colors duration-150 flex items-center justify-center"
                        aria-label={
                          favoriteCourts.includes(court.id)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <Star
                          size={18}
                          fill={favoriteCourts.includes(court.id) ? "currentColor" : "none"}
                          className={`transition-colors duration-150 ${
                            favoriteCourts.includes(court.id) ? "text-yellow-400" : "text-gray-400"
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <CardContent className="p-3 space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {timesInOneHour.map((slot, idx) => {
                      const colorClass = getHourAvailabilityColor(court, slot);
                      const simpleTime = slot.replace(":00 ", "").toLowerCase();
                      const availabilityText = colorClass.includes("green")
                        ? "Available"
                        : colorClass.includes("orange")
                        ? "Partially Available"
                        : "Reserved";
                      return (
                        <div
                          key={`${court.id}-time-${idx}`}
                          className={`text-center py-2 px-1 rounded text-xs sm:text-sm ${colorClass} font-medium shadow-sm transition-colors duration-150`}
                          title={`${availabilityText} at ${slot}`}
                        >
                          {simpleTime}
                        </div>
                      );
                    })}
                  </div>

                  {(court.address || court.Maps_url) && (
                    <Button
                      onClick={() => toggleMapExpansion(court.id)}
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs h-8 bg-white	border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm"
                      aria-expanded={expandedMaps.includes(court.id)}
                      aria-controls={`map-details-${court.id}`}
                    >
                      <MapPin size={14} aria-hidden="true" />
                      {expandedMaps.includes(court.id) ? "Hide Location" : "Show Location"}
                    </Button>
                  )}

                  {expandedMaps.includes(court.id) && (
                    <div
                      id={`map-details-${court.id}`}
                      className="mt-2 p-3 bg(gray-50/80) rounded border border-gray-200 animate-in fade-in-50 duration-300"
                    >
                      <p className="text-sm text-gray-700 mb-2">
                        {court.address}
                      </p>
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs shadow-sm"
                        onClick={() => window.open(getGoogleMapsUrl(court), "_blank", "noopener,noreferrer")}
                      >
                        Open in Google Maps
                      </Button>
                    </div>
                  )}

                  {court.ball_machine && (
                    <Button
                      size="sm"
                      className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs h-8	bg-blue-800 text-white hover:bg-blue-900 shadow-sm"
                      onClick={() => window.open("https://seattleballmachine.com", "_blank", "noopener,noreferrer")}
                    >
                      <Image
                        src="/icons/ballmachine.png"
                        alt=""
                        width={12}
                        height={12}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      Ball Machine Rental (Nearby)
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
