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

/* ── popularity helper ───────────────────────────── */

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
      tooltip: "Score ≤45 – usually light traffic; walk-on same day is fine.",
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

/* ── helpers (time, availability, skeleton) ───────── */
/* ... identical to previous version – omitted for brevity ... */

/* ── main component ───────────────────────────────── */

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

  /* fetch + favourites – unchanged */
  useEffect(() => {
    getTennisCourts()
      .then(setCourts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
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

  /* helpers – unchanged */
  /* ... toggleFav, toggleFilter, toggleMap, mapsUrl ... */

  /* filter cfg */
  const filterCfg: Record<FilterKey, { label: string; icon: string }> = {
    lights: { label: "Lights", icon: "/icons/lighticon.png" },
    hitting_wall: { label: "Wall", icon: "/icons/wallicon.png" },
    pickleball_lined: { label: "Pickleball", icon: "/icons/pickleballicon.png" },
    ball_machine: { label: "Machine", icon: "/icons/ballmachine.png" },
  };

  /* filtered list – unchanged */
  /* ... */

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
        {aboutOpen && <AboutUs isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />}
        <CourtListSkeleton />
      </div>
    );
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      {aboutOpen && <AboutUs isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />}

      {/* ── sticky header ────────────────────────────── */}
      <div className="sticky top-0 bg-white z-10 border-b pb-3 mb-4">
        <div className="space-y-3 pt-4">
          <div className="text-xl font-semibold">{today}</div>

          {/* search + responsive Info btn */}
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

          {/* filters */}
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
                  <Badge
                    variant="outline"
                    title={tier.tooltip}          /* ← tooltip now on the badge */
                    className={`${tier.colorClass} h-5 px-1.5 text-xs inline-flex items-center mt-1`}
                  >
                    <tier.icon size={10} className="mr-1" />
                    {tier.label}
                  </Badge>
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
                {/* attribute chips – 2×2 grid mobile */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 sm:flex sm:flex-wrap sm:gap-x-3 sm:gap-y-0">
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
