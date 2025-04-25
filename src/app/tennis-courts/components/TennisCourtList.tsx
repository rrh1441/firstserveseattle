"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Star, MapPin } from "lucide-react"; // only icons we actually render

const AboutUs = dynamic(() => import("./AboutUs"), { ssr: false });

/* ───────────── popularity tier helper ───────────── */

type FilterKey =
  | "lights"
  | "hitting_wall"
  | "pickleball_lined"
  | "ball_machine";

interface Tier {
  text: string;
  color: string;
}

function tierFor(score: number | null | undefined): Tier {
  if (score == null)
    return {
      text: "N/A – No recent popularity data",
      color: "bg-gray-100 text-gray-600 border-gray-300",
    };
  if (score === 0)
    return {
      text: "Walk-on – First-come, first-served only",
      color: "bg-gray-200 text-gray-700 border-gray-400",
    };
  if (score <= 30)
    return {
      text: "Hot – Extremely popular court, recommend booking ahead",
      color: "bg-red-100 text-red-800 border-red-300",
    };
  if (score <= 55)
    return {
      text: "Busy – Often reserved, consider booking ahead",
      color: "bg-orange-100 text-orange-800 border-orange-300",
    };
  return {
    text: "Chill – Light traffic, walk-on fine",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  };
}

/* ───────────── helper: Google Maps URL ───────────── */

const mapsUrl = (court: TennisCourt) =>
  court.Maps_url?.startsWith("http")
    ? court.Maps_url
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        court.address ?? court.title
      )}`;

/* ───────────── time & availability helpers ───────── */

const timeSlots = [
  "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
  "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
];

const toMin = (str: string) => {
  const [t, ap] = str.toUpperCase().split(" ");
  const [h, m] = t.split(":").map(Number);
  let hh = h % 12;
  if (ap === "PM") hh += 12;
  return hh * 60 + m;
};

const slotColor = (court: TennisCourt, slot: string) => {
  const s = toMin(slot), mid = s + 30;
  const free = (a: number, b: number) =>
    court.parsed_intervals.some(({ start, end }) => {
      const st = toMin(start), en = toMin(end);
      return st <= a && en >= b;
    });
  const first = free(s, mid), second = free(mid, mid + 30);
  if (first && second) return "bg-green-500 text-white";
  if (!first && !second) return "bg-gray-400 text-gray-100";
  return "bg-orange-400 text-white";
};

/* ───────────── skeleton loaders ───────────── */

const CardSkeleton = () => (
  <Card className="border rounded-lg shadow-md animate-pulse">
    <div className="h-10 bg-gray-50/60 border-b" />
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

/* ───────────── main component ───────────── */

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

  /* load favorites */
  useEffect(() => {
    const raw = localStorage.getItem("favoriteCourts");
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setFav(arr);
      } catch {
        localStorage.removeItem("favoriteCourts");
      }
    }
  }, []);

  /* handlers */
  const toggleFav = (id: number) =>
    setFav((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("favoriteCourts", JSON.stringify(next));
      return next;
    });

  const toggleFilter = (k: FilterKey) =>
    setFilters((f) => ({ ...f, [k]: !f[k] }));

  const toggleMap = (id: number) =>
    setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  /* filter buttons */
  const cfg: Record<FilterKey, { label: string; icon: string }> = {
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

  /* ───────── render ───────── */

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

      {/* header */}
      <div className="sticky top-0 bg-white z-10 border-b pb-3 mb-4 pt-6 space-y-3">
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

      {/* court cards */}
      <div className="space-y-4">
        {list.length === 0 ? (
          <div>No courts found.</div>
        ) : (
          list.map((court) => {
            const tier = tierFor(court.avg_busy_score_7d);
            return (
              <Card key={court.id} className="border rounded-lg shadow-sm">
                {/* card header */}
                <div className="flex justify-between items-start p-3 bg-gray-50">
                  <div>
                    <h3 className="font-semibold">{court.title}</h3>
                    <Badge
                      variant="outline"
                      className={`${tier.color} h-auto mt-1 text-[11px] leading-tight py-0.5 px-1.5 whitespace-pre-line`}
                    >
                      {tier.text}
                    </Badge>
                  </div>
                  <Button variant="ghost" onClick={() => toggleFav(court.id)}>
                    <Star
                      size={18}
                      fill={favorites.includes(court.id) ? "currentColor" : "none"}
                    />
                  </Button>
                </div>

                {/* card body */}
                <CardContent className="space-y-3 p-3">
                  {/* amenities 2×2 on mobile */}
                  <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-3 gap-y-1 text-xs text-gray-600 sm:flex sm:flex-wrap sm:gap-x-3 sm:gap-y-0">
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
                    {timeSlots.map((slot) => (
                      <div
                        key={slot}
                        className={`text-center py-1 rounded text-xs ${slotColor(
                          court,
                          slot
                        )}`}
                      >
                        {slot.replace(":00", "")}
                      </div>
                    ))}
                  </div>

                  {/* location toggle */}
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
                      <Image
                        src="/icons/ballmachine.png"
                        alt=""
                        width={12}
                        height={12}
                      />
                      Ball Machine Rental
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
