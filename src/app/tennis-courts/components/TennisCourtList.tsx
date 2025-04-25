// src/app/tennis-courts/components/TennisCourtList.tsx
"use client";

import React, { useState, useEffect, ReactElement } from "react";
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

function timeToMinutes(str: string): number {
  const parts = str.toUpperCase().split(" ");
  if (parts.length !== 2) return -1;
  const [time, ampm] = parts;
  const [hhStr, mmStr] = time.split(":");
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);
  if (isNaN(hh) || isNaN(mm)) return -1;
  const hour24 =
    ampm === "PM" && hh < 12
      ? hh + 12
      : ampm === "AM" && hh === 12
      ? 0
      : hh;
  return hour24 * 60 + mm;
}

function isRangeFree(court: TennisCourt, startM: number, endM: number): boolean {
  return court.parsed_intervals.some(({ start, end }) => {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return s <= startM && e >= endM;
  });
}

function getHourAvailabilityColor(court: TennisCourt, slot: string): string {
  const startM = timeToMinutes(slot);
  if (startM === -1) return "bg-gray-200 text-gray-400";
  const mid = startM + 30;
  const end = startM + 60;
  const firstFree = isRangeFree(court, startM, mid);
  const secondFree = isRangeFree(court, mid, end);
  if (firstFree && secondFree) return "bg-green-500 text-white";
  if (!firstFree && !secondFree) return "bg-gray-400 text-gray-100";
  return "bg-orange-400 text-white";
}

function getPopularityTier(score: number | null): PopularityTier {
  if (score === null) {
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

function CourtCardSkeleton(): ReactElement {
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
          <div>
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
          </div>
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

function CourtListSkeleton({ count = 5 }: { count?: number }): ReactElement {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CourtCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function TennisCourtList(): ReactElement {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
    ball_machine: false,
  });
  const [expanded, setExpanded] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);

  const times = [
    "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
    "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
    "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
  ];

  useEffect(() => {
    setLoading(true);
    getTennisCourts()
      .then((data) => setCourts(data))
      .catch((err) => setError(err.message || "Failed to load courts."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("favoriteCourts");
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
          setFavorites(arr);
        }
      }
    } catch {
      localStorage.removeItem("favoriteCourts");
    }
  }, []);

  const toggleFavorite = (id: number): void => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id];
      localStorage.setItem("favoriteCourts", JSON.stringify(next));
      return next;
    });
  };

  const toggleFilter = (key: FilterKey): void => {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  };

  const toggleMap = (id: number): void => {
    setExpanded((e) => (e.includes(id) ? e.filter((n) => n !== id) : [...e, id]));
  };

  const getMapsUrl = (court: TennisCourt): string => {
    if (court.Maps_url?.startsWith("http")) return court.Maps_url;
    const q = court.address ?? court.title ?? "Seattle Tennis Court";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };

  const filterConfig: Record<FilterKey, { label: string; icon: string }> = {
    lights: { label: "Lights", icon: "/icons/lighticon.png" },
    pickleball_lined: { label: "Pickleball", icon: "/icons/pickleballicon.png" },
    hitting_wall: { label: "Wall", icon: "/icons/wallicon.png" },
    ball_machine: { label: "Machine", icon: "/icons/ballmachine.png" },
  };

  const filtered = courts
    .filter((c) =>
      !searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((c) =>
      (Object.keys(filters) as FilterKey[]).every((k) =>
        !filters[k] ? true : c[k]
      )
    );

  const sorted = filtered.sort((a, b) => {
    const af = favorites.includes(a.id) ? 1 : 0;
    const bf = favorites.includes(b.id) ? 1 : 0;
    if (af !== bf) return bf - af;
    return a.title.localeCompare(b.title);
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  if (loading) {
    return (
      <div className="bg-white text-black p-2 sm:p-0 space-y-4">
        {aboutOpen && <AboutUs isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />}
        <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="space-y-2 w-full sm:w-auto">
              <div className="text-xl font-semibold text-gray-700">{today}</div>
              <input
                type="text"
                placeholder="Search courts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-500 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {Object.entries(filterConfig).map(([key, { label, icon }]) => (
                  <Button
                    key={key}
                    onClick={() => toggleFilter(key as FilterKey)}
                    variant="outline"
                    className={`flex items-center gap-1 px-3 h-9 text-sm ${
                      filters[key as FilterKey]
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <Image src={icon} alt="" width={14} height={14} />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <Button
                onClick={() => setAboutOpen(true)}
                variant="outline"
                className="flex items-center gap-1 px-3 h-9 text-sm"
              >
                <Info size={16} />
                Info / Key
              </Button>
            </div>
          </div>
        </div>
        <CourtListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="bg-red-50 border border-red-200 p-6 rounded text-center">
          <h3 className="text-red-800 font-semibold mb-2">Oops! Something went wrong.</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black p-2 sm:p-0 space-y-4">
      {aboutOpen && <AboutUs isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />}

      <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="text-xl font-semibold text-gray-700">{today}</div>
            <input
              type="text"
              placeholder="Search courts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-500 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {Object.entries(filterConfig).map(([key, { label, icon }]) => (
                <Button
                  key={key}
                  onClick={() => toggleFilter(key as FilterKey)}
                  variant="outline"
                  className={`flex items-center gap-1 px-3 h-9 text-sm ${
                    filters[key as FilterKey]
                      ? "bg-blue-100 text-blue-800"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <Image src={icon} alt="" width={14} height={14} />
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button
              onClick={() => setAboutOpen(true)}
              variant="outline"
              className="flex items-center gap-1 px-3 h-9 text-sm"
            >
              <Info size={16} />
              Info / Key
            </Button>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center text-gray-600 py-10">
          {courts.length > 0
            ? "No courts match your search or filters."
            : "No court data available."}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((court) => {
            const tier = getPopularityTier(court.avg_busy_score_7d);
            const Icon = tier.icon;
            return (
              <Card
                key={court.id}
                className="shadow-md border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="p-3 border-b bg-gray-50/60">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3
                        className="font-semibold text-gray-800 truncate"
                        title={court.title}
                      >
                        {court.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-1">
                        {court.lights && (
                          <div className="flex items-center gap-1" title="Lights">
                            <Image
                              src="/icons/lighticon.png"
                              alt=""
                              width={12}
                              height={12}
                            />
                            Lights
                          </div>
                        )}
                        {court.pickleball_lined && (
                          <div className="flex items-center gap-1" title="Pickleball">
                            <Image
                              src="/icons/pickleballicon.png"
                              alt=""
                              width={12}
                              height={12}
                            />
                            Pickleball
                          </div>
                        )}
                        {court.hitting_wall && (
                          <div className="flex items-center gap-1" title="Wall">
                            <Image
                              src="/icons/wallicon.png"
                              alt=""
                              width={12}
                              height={12}
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
                    <Button
                      variant="ghost"
                      onClick={() => toggleFavorite(court.id)}
                      className="p-1 h-8 w-8"
                      aria-label={
                        favorites.includes(court.id)
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <Star
                        size={18}
                        fill={favorites.includes(court.id) ? "currentColor" : "none"}
                        className={
                          favorites.includes(court.id)
                            ? "text-yellow-400"
                            : "text-gray-400"
                        }
                      />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-3 space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {times.map((slot, idx) => {
                      const color = getHourAvailabilityColor(court, slot);
                      const label = slot.replace(":00 ", " ").toLowerCase();
                      const title =
                        color.includes("green")
                          ? `Available at ${slot}`
                          : color.includes("orange")
                          ? `Partially available at ${slot}`
                          : `Reserved at ${slot}`;
                      return (
                        <div
                          key={`${court.id}-${idx}`}
                          className={`text-center py-2 px-1 rounded text-xs sm:text-sm font-medium shadow-sm ${color}`}
                          title={title}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>

                  {(court.address || court.Maps_url) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 flex items-center gap-1.5"
                      onClick={() => toggleMap(court.id)}
                      aria-expanded={expanded.includes(court.id)}
                      aria-controls={`map-${court.id}`}
                    >
                      <MapPin size={14} />
                      {expanded.includes(court.id) ? "Hide Location" : "Show Location"}
                    </Button>
                  )}

                  {expanded.includes(court.id) && (
                    <div
                      id={`map-${court.id}`}
                      className="mt-2 p-3 rounded border border-gray-200 bg-gray-50/80"
                    >
                      <p className="text-sm text-gray-700 mb-2">
                        {court.address ?? "Address not available"}
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(getMapsUrl(court), "_blank")}
                      >
                        Open in Google Maps
                      </Button>
                    </div>
                  )}

                  {court.ball_machine && (
                    <Button
                      size="sm"
                      className="w-full mt-2 flex items-center gap-1.5"
                      onClick={() =>
                        window.open("https://seattleballmachine.com", "_blank")
                      }
                    >
                      <Image
                        src="/icons/ballmachine.png"
                        alt=""
                        width={12}
                        height={12}
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
