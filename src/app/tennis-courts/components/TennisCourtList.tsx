// src/app/tennis-courts/components/TennisCourtList.tsx
"use client";

import React, { useState, useEffect } from "react";
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

/* ────────────── Popularity tier helper ────────────── */

type FilterKey =
  | "lights"
  | "hitting_wall"
  | "pickleball_lined"
  | "ball_machine";

interface Tier {
  label: string;
  tooltip: string;
  color: string;
  icon: typeof Users | typeof Zap | typeof Snowflake | typeof HelpCircle;
}

function tierFor(score: number | null | undefined): Tier {
  if (score == null)
    return {
      label: "N/A",
      tooltip: "No recent popularity data.",
      color: "bg-gray-100 text-gray-600 border-gray-300",
      icon: HelpCircle,
    };
  if (score === 0)
    return {
      label: "Walk-on",
      tooltip: "Score 0 – first-come, first-served only.",
      color: "bg-gray-200 text-gray-700 border-gray-400",
      icon: Users,
    };
  if (score <= 45)
    return {
      label: "Chill",
      tooltip: "Score ≤45 – usually light traffic; walk-on is fine.",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: Snowflake,
    };
  if (score <= 70)
    return {
      label: "Busy",
      tooltip: "Score 46-70 – often busy; booking ahead helps.",
      color: "bg-orange-100 text-orange-800 border-orange-300",
      icon: Users,
    };
  return {
    label: "Hot",
    tooltip: "Score >70 – high demand; reserve several days ahead.",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: Zap,
  };
}

/* ────────────── Time / availability helpers ───────── */

const slots = [
  "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
  "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
];

function tMin(s: string) {
  const [t, ap] = s.toUpperCase().split(" ");
  const [h, m] = t.split(":").map(Number);
  return ((ap === "PM" && h !== 12 ? h + 12 : ap === "AM" && h === 12 ? 0 : h) *
    60) + m;
}

function free(c: TennisCourt, a: number, b: number) {
  return c.parsed_intervals.some(({ start, end }) => {
    const s = tMin(start), e = tMin(end);
    return s <= a && e >= b;
  });
}

function slotClr(c: TennisCourt, slot: string) {
  const s = tMin(slot);
  const good1 = free(c, s, s + 30);
  const good2 = free(c, s + 30, s + 60);
  if (good1 && good2) return "bg-green-500 text-white";
  if (!good1 && !good2) return "bg-gray-400 text-gray-100";
  return "bg-orange-400 text-white";
}

/* ────────────── Skeletons ─────────────────────────── */

const CardSkeleton = () => (
  <Card className="border rounded-lg shadow-md animate-pulse">
    <div className="p-3 border-b bg-gray-50/60 h-10" />
    <CardContent className="p-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        {Array.from({ length: 17 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded" />
        ))}
      </div>
    </CardContent>
  </Card>
);

const ListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/* ────────────── Main component ───────────────────── */

export default function TennisCourtList() {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [favorites, setFav] = useState<number[]>([]);
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
        if (Array.isArray(arr)) setFav(arr);
      }
    } catch {
      localStorage.removeItem("favoriteCourts");
    }
  }, []);

  /* handlers */
  const toggleFav = (id: number) =>
    setFav((p) => {
      const n = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      localStorage.setItem("favoriteCourts", JSON.stringify(n));
      return n;
    });

  const toggleFilter = (k: FilterKey) =>
    setFilters((f) => ({ ...f, [k]: !f[k] }));

  const toggleMap = (id: number) =>
    setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  /* filter cfg */
  const cfg: Record<FilterKey, { label: string; icon: string }> = {
    lights: { label: "Lights", icon: "/icons/lighticon.png" },
    hitting_wall: { label: "Wall", icon: "/icons/wallicon.png" },
    pickleball_lined: { label: "Pickleball", icon: "/icons/pickleballicon.png" },
    ball_machine: { label: "Machine", icon: "/icons/ballmachine.png" },
  };

  /* filtered list */
  const list = courts
    .filter((c) => (search ? c.title.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((c) => (Object.keys(filters) as FilterKey[]).every((k) => !filters[k] || c[k]))
    .sort((a, b) => {
      const af = favorites.includes(a.id) ? 1 : 0;
      const bf = favorites.includes(b.id) ? 1 : 0;
      if (af !== bf) return bf - af;
      return a.title.localeCompare(b.title);
    });

  /* header date */
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "America/Los_Angeles",
  });

  /* render */
  if (loading)
    return (
      <div className="p-4">
        <ListSkeleton />
      </div>
    );
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      {aboutOpen && <AboutUs isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />}

      {/* ── Header ── */}
      <div className="sticky top-0 bg-white z-10 border-b pb-3 mb-4">
        <div className="space-y-3 pt-4">
          <div className="text-xl font-semibold">{today}</div>

          <div className="flex gap-2 items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courts…"
              className="flex-1 p-2 border rounded"
            />
            <Button
              variant="outline"
              size="sm"
              className="p-2 flex items-center gap-0 sm:px-3 sm:gap-1"
              onClick={() => setAboutOpen(true)}
            >
              <Info size={18} />
              <span className="hidden sm:inline">Info</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.entries(cfg) as [FilterKey, { label: string; icon: string }][]).map(
              ([k, { label, icon }]) => (
                <Button
                  key={k}
                  onClick={() => toggleFilter(k)}
                  variant={filters[k] ? "secondary" : "outline"}
                  className="flex items-center gap-1"
                >
                  <Image src={icon} alt="" width={14} height={14} /> {label}
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── List ── */}
      {list.length === 0 ? (
        <div>No courts found.</div>
      ) : (
        list.map((court) => {
          const t = tierFor(court.avg_busy_score_7d);
          return (
            <Card key={court.id} className="border rounded-lg shadow-sm">
              <div className="flex justify-between items-start p-3 bg-gray-50">
                <div>
                  <h3 className="font-semibold">{court.title}</h3>
                  <Badge
                    variant="outline"
                    title={t.tooltip}
                    className={`${t.color} pointer-events-auto h-5 px-1.5 text-xs inline-flex items-center mt-1`}
                  >
                    <t.icon size={12} className="mr-1" /> {t.label}
                  </Badge>
                </div>
                <Button variant="ghost" onClick={() => toggleFav(court.id)}>
                  <Star
                    size={18}
                    fill={favorites.includes(court.id) ? "currentColor" : "none"}
                  />
                </Button>
              </div>

              <CardContent className="space-y-3 p-3">
                {/* attribute chips */}
                <div className="grid grid-cols-2 w-full gap-x-3 gap-y-1 text-xs text-gray-600 sm:flex sm:flex-wrap sm:gap-x-3 sm:gap-y-0">
                  {court.lights && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/lighticon.png" alt="" width={12} height={12} /> Lights
                    </div>
                  )}
                  {court.pickleball_lined && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/pickleballicon.png" alt="" width={12} height={12} /> Pickleball
                    </div>
                  )}
                  {court.hitting_wall && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/wallicon.png" alt="" width={12} height={12} /> Wall
                    </div>
                  )}
                  {court.ball_machine && (
                    <div className="flex items-center gap-1">
                      <Image src="/icons/ballmachine.png" alt="" width={12} height={12} /> Machine
                    </div>
                  )}
                </div>

                {/* availability grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                  {slots.map((slot) => (
                    <div
                      key={slot}
                      className={`text-center py-1 rounded text-xs ${slotClr(court, slot)}`}
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

                {expanded.includes(court.id) && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 mb-2">
                      {court.address ?? "Address unavailable"}
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(court.Maps_url || mapsUrl(court), "_blank")}
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
                    onClick={() => window.open("https://seattleballmachine.com", "_blank")}
                  >
                    <Image src="/icons/ballmachine.png" alt="" width={12} height={12} /> Ball Machine Rental
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
