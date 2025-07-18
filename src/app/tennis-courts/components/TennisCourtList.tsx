"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import dynamic from "next/dynamic";
import Image from "next/image";
import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Info,
  Star,
  MapPin,
  Footprints,
  ThumbsUp,
  X,
} from "lucide-react";
import { logEvent } from "@/lib/logEvent";
import { FilterEventTracker, EngagementTracker } from "@/lib/eventLogging";
import { courtMatchesSearch } from "@/lib/neighborhoodMapping";

const AboutUs = dynamic(() => import("./AboutUs"), { ssr: false });

type AmenityKey =
  | "lights"
  | "hitting_wall"
  | "pickleball_lined"
  | "ball_machine";

type PopFilter = "walk" | "low" | null;

const mapsUrl = (c: TennisCourt) =>
  c.Maps_url?.startsWith("http")
    ? c.Maps_url
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        c.address ?? c.title
      )}`;

const TIME = [
  "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
  "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
];
const toMin = (t: string) => {
  const [clock, ap] = t.toUpperCase().split(" ");
  const [h, m] = clock.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
};
const slotClr = (court: TennisCourt, t: string) => {
  const s = toMin(t), mid = s + 30;
  const free = (a: number, b: number) =>
    court.parsed_intervals.some(({ start, end }) => {
      const st = toMin(start), en = toMin(end);
      return st <= a && en >= b;
    });
  const a = free(s, mid), b = free(mid, mid + 30);
  if (a && b) return "bg-green-500 text-white";
  if (!a && !b) return "bg-gray-400 text-gray-100";
  return "bg-orange-400 text-white";
};

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

export default function TennisCourtList() {
  const searchParams = useSearchParams();
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [fav, setFav] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [amenities, setAmenities] = useState<Record<AmenityKey, boolean>>({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
    ball_machine: false,
  });
  const [popFilter, setPopFilter] = useState<PopFilter>(null);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [about, setAbout] = useState(false);
  const [qrCourtFilter, setQrCourtFilter] = useState<string | null>(null);

  // Check for court parameter from QR code on mount
  useEffect(() => {
    const courtParam = searchParams.get('court');
    if (courtParam) {
      console.log(`🎾 QR court filter detected: ${courtParam}`);
      setSearch(courtParam);
      setQrCourtFilter(courtParam);
      // Log that user came from QR code
      logEvent('qr_court_filter_applied', { courtName: courtParam });
    }
  }, [searchParams]);

  const clearQrFilter = () => {
    setSearch("");
    setQrCourtFilter(null);
    logEvent('qr_court_filter_cleared');
  };

  useEffect(() => {
    getTennisCourts()
      .then((data) => {
        setCourts(data);
        logEvent("view_court_list", { courtCount: data.length });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("favoriteCourts");
      if (raw) setFav(JSON.parse(raw));
    } catch {/* ignore */ }
  }, []);
  const toggleFav = (id: number) =>
    setFav((prev) => {
      const isCurrentlyFavorited = prev.includes(id);
      const next = isCurrentlyFavorited ? prev.filter((x) => x !== id) : [...prev, id];
      const court = courts.find(c => c.id === id);
      
      // Track favorite/unfavorite action with Vercel Analytics
      track('court_favorite_toggled', {
        court_id: id,
        court_name: court?.title || 'Unknown',
        action: isCurrentlyFavorited ? 'unfavorite' : 'favorite',
        total_favorites: next.length
      });
      
      localStorage.setItem("favoriteCourts", JSON.stringify(next));
      return next;
    });

  useEffect(() => {
    if (search.trim() && !qrCourtFilter) {
      // Only log manual search, not QR filter
      const timeout = setTimeout(() => {
        logEvent("search_courts", { query: search.trim() });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [search, qrCourtFilter]);

  useEffect(() => {
    // Use enhanced filter tracking that only logs meaningful changes
    FilterEventTracker.trackFilterChange(amenities, popFilter);
  }, [amenities, popFilter]);

  const median = useMemo(() => {
    const s = courts
      .map((c) => c.avg_busy_score_7d)
      .filter((x): x is number => x !== null && x > 0)
      .sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  }, [courts]);

  const list = useMemo(() => {
    return courts
      .filter((c) =>
        search ? courtMatchesSearch(c.title, search) : true
      )
      .filter((c) =>
        (Object.keys(amenities) as AmenityKey[]).every(
          (k) => !amenities[k] || c[k]
        )
      )
      .filter((c) => {
        const score = c.avg_busy_score_7d;
        if (popFilter === null) return true;
        if (popFilter === "walk") return score === 0;
        if (score === null || score === 0) return false;
        return score > median;
      })
      .sort((a, b) => {
        const af = fav.includes(a.id) ? 1 : 0;
        const bf = fav.includes(b.id) ? 1 : 0;
        if (af !== bf) return bf - af;
        return a.title.localeCompare(b.title);
      });
  }, [courts, search, amenities, popFilter, fav, median]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
  const amenityCfg: Record<AmenityKey, { label: string; icon: string }> = {
    lights: { label: "Lights", icon: "/icons/lighticon.png" },
    hitting_wall: { label: "Wall", icon: "/icons/wallicon.png" },
    pickleball_lined: { label: "Pickleball", icon: "/icons/pickleballicon.png" },
    ball_machine: { label: "Machine", icon: "/icons/ballmachine.png" },
  };

  const handleExpand = (courtId: number, title: string) => {
    const isCurrentlyExpanded = expanded.includes(courtId);
    setExpanded((e) =>
      e.includes(courtId) ? e.filter((x) => x !== courtId) : [...e, courtId]
    );
    
    // Track court detail expand/collapse with Vercel Analytics
    track('court_detail_toggled', {
      court_id: courtId,
      court_name: title,
      action: isCurrentlyExpanded ? 'collapse' : 'expand'
    });
    
    // Track as high-value engagement action
    EngagementTracker.trackHighValueAction("court_detail_expand", courtId, title);
  };

  if (loading) return <div className="p-4"><CardSkeleton /></div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      {about && <AboutUs isOpen={about} onClose={() => setAbout(false)} />}

      <div className="sticky top-0 z-10 bg-white border-b pb-3 pt-6 space-y-3">
        <div className="text-xl font-semibold">{today}</div>

        {/* QR Filter Notice */}
        {qrCourtFilter && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  Showing courts for: <strong>{qrCourtFilter}</strong>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearQrFilter}
                className="text-blue-700 hover:text-blue-900 h-auto p-1"
              >
                <X size={16} />
              </Button>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Clear filter to see all courts
            </p>
          </div>
        )}

        <div className="flex gap-2 items-center">
          <input
            value={search}
            onChange={(e) => {
              const searchValue = e.target.value;
              setSearch(searchValue);
              
              // Track search events with Vercel Analytics
              if (searchValue.length > 2) {
                track('court_search', {
                  search_term: searchValue,
                  results_count: courts.filter(c => 
                    courtMatchesSearch(c.title, searchValue)
                  ).length
                });
              }
              
              // Clear QR filter state when user manually types
              if (qrCourtFilter && searchValue !== qrCourtFilter) {
                setQrCourtFilter(null);
              }
            }}
            placeholder="Search courts or neighborhoods…"
            className="flex-1 p-2 border rounded"
          />
          <Button
            variant="outline"
            size="sm"
            className="p-2 flex items-center gap-0 sm:px-3 sm:gap-1"
            onClick={() => setAbout(true)}
          >
            <Info size={18} />
            <span className="hidden sm:inline">Info</span>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {(Object.entries(amenityCfg) as [
            AmenityKey,
            { label: string; icon: string }
          ][]).map(([k, { label, icon }]) => {
            const active = amenities[k];
            return (
              <Button
                key={k}
                variant="outline"
                className={`flex items-center justify-center gap-1 text-sm ${
                  active
                    ? "bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-300"
                    : "bg-transparent"
                }`}
                onClick={() => {
                  const newValue = !amenities[k];
                  setAmenities((f) => ({ ...f, [k]: newValue }));
                  
                  // Track filter usage with Vercel Analytics
                  track('court_filter_clicked', {
                    filter_type: k,
                    filter_value: newValue,
                    active_filters: Object.entries({...amenities, [k]: newValue})
                      .filter(([, v]) => v)
                      .map(([key]) => key)
                      .join(',')
                  });
                }}
                aria-pressed={active}
              >
                <Image src={icon} alt="" width={14} height={14} />
                {label}
              </Button>
            );
          })}

          {([
            ["walk", "Walk-on only", Footprints],
            ["low", "Easy walk-on", ThumbsUp],
          ] as const).map(([key, label, Icon]) => {
            const active = popFilter === key;
            return (
              <Button
                key={key}
                variant="outline"
                className={`flex items-center justify-center gap-1 text-sm ${
                  active
                    ? "bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-300"
                    : "bg-transparent"
                }`}
                onClick={() =>
                  setPopFilter(active ? null : (key as PopFilter))
                }
                aria-pressed={active}
              >
                <Icon size={14} />
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {list.length === 0 ? (
        <div>No courts found.</div>
      ) : (
        list.map((court) => (
          <Card key={court.id} className="border rounded-lg shadow-sm">
            <div className="flex justify-between items-start p-3 bg-gray-50">
              <h3 className="font-semibold">{court.title}</h3>
              <Button variant="ghost" onClick={() => toggleFav(court.id)}>
                <Star
                  size={18}
                  fill={fav.includes(court.id) ? "currentColor" : "none"}
                />
              </Button>
            </div>

            <CardContent className="space-y-3 p-3">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                {court.lights && <div className="flex items-center gap-1"><Image src="/icons/lighticon.png" alt="" width={12} height={12} />Lights</div>}
                {court.pickleball_lined && <div className="flex items-center gap-1"><Image src="/icons/pickleballicon.png" alt="" width={12} height={12} />Pickleball</div>}
                {court.hitting_wall && <div className="flex items-center gap-1"><Image src="/icons/wallicon.png" alt="" width={12} height={12} />Wall</div>}
                {court.ball_machine && <div className="flex items-center gap-1"><Image src="/icons/ballmachine.png" alt="" width={12} height={12} />Machine</div>}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                {TIME.map((t) => (
                  <div
                    key={t}
                    className={`text-center py-1 rounded text-xs ${slotClr(court, t)}`}
                  >
                    {t.replace(":00", "")}
                  </div>
                ))}
              </div>

              {(court.address || court.Maps_url) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1.5"
                  onClick={() => handleExpand(court.id, court.title)}
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
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Enhanced maps tracking with engagement context
                      EngagementTracker.trackHighValueAction("open_maps", court.id, court.title);
                      
                      // Track with Vercel Analytics
                      track('court_maps_opened', {
                        court_id: court.id,
                        court_name: court.title,
                        has_address: !!court.address,
                        has_maps_url: !!court.Maps_url
                      });
                      
                      window.open(mapsUrl(court), "_blank");
                    }}
                  >
                    Open in Google Maps
                  </Button>
                </div>
              )}

              {court.ball_machine && (
                <Button
                  size="sm"
                  className="w-full bg-blue-800 text-white hover:bg-blue-900 flex items-center justify-center gap-1.5"
                  onClick={() => {
                    // Track ball machine rental click with Vercel Analytics
                    track('ball_machine_clicked', {
                      court_id: court.id,
                      court_name: court.title,
                      referral_url: 'https://seattleballmachine.com'
                    });
                    
                    // Track ball machine as high conversion intent action
                    EngagementTracker.trackHighValueAction("ball_machine_click", court.id, court.title);
                    window.open("https://seattleballmachine.com", "_blank");
                  }}
                >
                  <Image src="/icons/ballmachine.png" alt="" width={12} height={12} />
                  Ball Machine Rental
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
