// src/app/tennis-courts/components/TennisCourtList.tsx
"use client";

import React, { useState, useEffect, ReactElement } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MapPin,
  Info,
  Users,
  Zap,
  Snowflake,
  HelpCircle,
} from "lucide-react";

const AboutUs = dynamic(() => import("./AboutUs"), { ssr: false });

/* ── popularity helper ────────────────────────────────── */

type FilterKey =
  | "lights"
  | "hitting_wall"
  | "pickleball_lined"
  | "ball_machine";

interface PopularityTier {
  label: string;
  tooltip: string;
  colorClass: string;
  icon: typeof Users | typeof Zap | typeof Snowflake | typeof HelpCircle;
}

function getPopularityTier(score: number | null | undefined): PopularityTier {
  if (score == null)
    return {
      label: "N/A",
      tooltip: "No recent popularity data.",
      colorClass: "bg-gray-100 text-gray-600 border-gray-300",
      icon: HelpCircle,
    };
  if (score === 0)
    return {
      label: "Walk-on",
      tooltip: "Score 0 – first-come, first-served only.",
      colorClass: "bg-gray-200 text-gray-700 border-gray-400",
      icon: Users,
    };
  if (score <= 45)
    return {
      label: "Chill",
      tooltip:
        "Score ≤45 – usually light traffic; walk-on same day is fine.",
      colorClass: "bg-blue-100 text-blue-800 border-blue-300",
      icon: Snowflake,
    };
  if (score <= 70)
    return {
      label: "Busy",
      tooltip:
        "Score 46-70 – often busy; reserve earlier in the week if you can.",
      colorClass: "bg-orange-100 text-orange-800 border-orange-300",
      icon: Users,
    };
  return {
    label: "Hot",
    tooltip:
      "Score >70 – high demand; expect waits or reserve several days ahead.",
    colorClass: "bg-red-100 text-red-800 border-red-300",
    icon: Zap,
  };
}

/* ── time helpers ─────────────────────────────────────── */

function timeToMinutes(str: string): number {
  const [time, ampm] = str.toUpperCase().split(" ");
  if (!time || !ampm) return -1;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return -1;
  let hh = h % 12;
  if (ampm === "PM") hh += 12;
  return hh * 60 + m;
}

function isRangeFree(c: TennisCourt, start: number, end: number) {
  return c.parsed_intervals.some(({ start: s, end: e }) => {
    const a = timeToMinutes(s),
      b = timeToMinutes(e);
    return a <= start && b >= end;
  });
}

function getHourColor(c: TennisCourt, slot: string) {
  const s = timeToMinutes(slot);
  if (s < 0) return "bg-gray-200 text-gray-400";
  const mid = s + 30,
    end = s + 60;
  const f1 = isRangeFree(c, s, mid),
    f2 = isRangeFree(c, mid, end);
  if (f1 && f2) return "bg-green-500 text-white";
  if (!f1 && !f2) return "bg-gray-400 text-gray-100";
  return "bg-orange-400 text-white";
}

/* ── skeleton loaders ────────────────────────────────── */

function CourtCardSkeleton(): ReactElement {
  return (
    <Card className="shadow-md border border-gray-200 rounded-lg animate-pulse">
      <div className="p-3 border-b bg-gray-50/60">
        <div className="flex justify-between">
          <div className="space-y-2 w-3/4">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>
      </div>
      <CardContent className="p-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {Array.from({ length: 17 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CourtListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CourtCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── main component ──────────────────────────────────── */

export default function TennisCourtList(): ReactElement {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
    ball_machine: false,
  });
  const [expanded, setExpanded] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  /* fetch courts */
  useEffect(() => {
    getTennisCourts()
      .then(setCourts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* load favourites */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("favoriteCourts");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setFavorites(arr);
      }
    } catch {
      localStorage.removeItem("favoriteCourts");
    }
  }, []);

  /* helpers */
  const toggleFav = (id: number) =>
    setFavorites((p) => {
      const n = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      localStorage.setItem("favoriteCourts", JSON.stringify(n));
      return n;
    });
  const toggleFilter = (k: FilterKey) =>
    setFilters((f) => ({ ...f, [k]: !f[k] }));
  const toggleMap = (id: number) =>
    setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  const mapsUrl = (c: TennisCourt) =>
    c.Maps_url?.startsWith("http")
      ? c.Maps_url!
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          c.address ?? c.title
        )}`;

  /* filter buttons cfg */
  const filterCfg: Record<FilterKey, { label: string; icon: string }> = {
    lights: { label: "Lights", icon: "/icons/lighticon.png" },
    hitting_wall: { label: "Wall", icon: "/icons/wallicon.png" },
    pickleball_lined: { label: "Pickleball", icon: "/icons/pickleballicon.png" },
    ball_machine: { label: "Machine", icon: "/icons/ballmachine.png" },
  };

  /* filtered list */
  const list = courts
    .filter((c) =>
      search ? c.title.toLowerCase().includes(search.toLowerCase()) : true
    )
    .filter((c) =>
      (Object.keys(filters) as FilterKey[]).every((k) => !filters[k] || c[k])
    )
    .sort((a, b) => {
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

  /* ── render ───────────────────────────────────────── */

  if (loading)
    return (
      <div className="p-4 space-y-4">
        {aboutOpen && (
          <AboutUs isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
        )}
        <CourtListSkeleton />
      </div>
    );
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      {aboutOpen && (
        <AboutUs isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      )}

      {/* ── sticky header ────────────────────────────── */}
      <div className="sticky top-0 bg-white z-10 border-b pb-3 mb-4">
        <div className="space-y-3 pt-4">
          {/* date + tooltip */}
          <div className="text-xl font-semibold flex items-center gap-1">
            {today}
            <span
              title={
                "Popularity badge key:\n" +
                "N/A – No data\n" +
                "Walk-on – Reservations not available\n" +
                "Chill – Light traffic (≤45)\n" +
                "Busy – Often busy (≤70)\n" +
                "Hot – High demand (>70)"
              }
            >
              <HelpCircle size={16} className="text-gray-400 cursor-help" />
            </span>
          </div>

          {/* search + mobile info button */}
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courts…"
              className="flex-1 p-2 border rounded"
            />
            <Button
              variant="outline"
              size="sm"              /* <- valid size */
              className="sm:hidden p-2" /* square icon btn */
              onClick={() => setAboutOpen(true)}
            >
              <Info size={18} />
            </Button>
          </div>

          {/* desktop info button */}
          <div className="hidden sm:flex justify-end">
            <Button variant="outline" onClick={() => setAboutOpen(true)}>
              <Info size={16} className="mr-1" /> Info
            </Button>
          </div>

          {/* filter buttons */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(filterCfg) as [
              FilterKey,
              { label: string; icon: string }
            ][]).map(([k, { label, icon }]) => (
              <Button
                key={k}
                onClick={() => toggleFilter(k)}
                variant={filters[k] ? "secondary" : "outline"}
                className="flex items-center gap-1"
              >
                <Image src={icon} alt="" width={14} height={14} />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── court cards ─────────────────────────────── */}
      {list.length === 0 ? (
        <div>No courts found.</div>
      ) : (
        list.map((court) => {
          const tier = getPopularityTier(court.avg_busy_score_7d);
          return (
            <Card key={court.id} className="border rounded-lg shadow-sm">
              {/* header */}
              <div className="flex justify-between items-start p-3 bg-gray-50">
                <div>
                  <h3 className="font-semibold">{court.title}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge
                      variant="outline"
                      className={`${tier.colorClass} h-5 px-1.5 text-xs inline-flex items-center`}
                    >
                      <tier.icon size={10} className="mr-1" />
                      {tier.label}
                    </Badge>
                    <span title={tier.tooltip} className="cursor-help ml-1">
                      <Info size={10} className="text-gray-400" />
                    </span>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => toggleFav(court.id)}>
                  <Star
                    size={18}
                    fill={favorites.includes(court.id) ? "currentColor" : "none"}
                  />
                </Button>
              </div>

              {/* body */}
              <CardContent className="space-y-3 p-3">
                {/* attribute chips 2×2 on mobile */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 sm:flex sm:flex-wrap sm:gap-x-3">
                  {court.lights && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/lighticon.png" alt="" width={12} height={12} />
                      Lights
                    </div>
                  )}
                  {court.pickleball_lined && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/pickleballicon.png" alt="" width={12} height={12} />
                      Pickleball
                    </div>
                  )}
                  {court.hitting_wall && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/wallicon.png" alt="" width={12} height={12} />
                      Wall
                    </div>
                  )}
                  {court.ball_machine && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/ballmachine.png" alt="" width={12} height={12} />
                      Machine
                    </div>
                  )}
                </div>

                {/* availability grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                  {[
                    "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
                    "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
                    "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
                  ].map((slot) => (
                    <div
                      key={slot}
                      className={`text-center py-1 rounded text-xs ${getHourColor(
                        court,
                        slot
                      )}`}
                    >
                      {slot.replace(":00", "")}
                    </div>
                  ))}
                </div>

                {/* location */}
                {(court.address || court.Maps_url) && (
                  <Button
                    size="sm"
                    className="w-full bg-white border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1.5"
                    onClick={() => toggleMap(court.id)}
                  >
                    <MapPin size={14} />
                    {expanded.includes(court.id) ? "Hide Location" : "Show Location"}
                  </Button>
                )}

                {/* expanded map */}
                {expanded.includes(court.id) && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 mb-2">
                      {court.address ?? "Address unavailable"}
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(mapsUrl(court), "_blank")}
                    >
                      Open in Google Maps
                    </Button>
                  </div>
                )}

                {/* ball machine */}
                {court.ball_machine && (
                  <Button
                    size="sm"
                    className="w-full bg-blue-800 text-white hover:bg-blue-900 flex items-center justify-center gap-1.5"
                    onClick={() =>
                      window.open("https://seattleballmachine.com", "_blank")
                    }
                  >
                    <Image src="/icons/ballmachine.png" alt="" width={12} height={12} />
                    Ball Machine Rental
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
