// src/app/tennis-courts/components/TennisCourtList.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// LINT FIX: Removed KeyRound, AlertTriangle, X as they are now used in AboutUs.tsx
import { Star, MapPin, Info } from "lucide-react";
import { getTennisCourts } from "@/lib/getTennisCourts"; // Ensure this path is correct
import Image from "next/image";
import dynamic from 'next/dynamic'; // Import dynamic

// --- Dynamic Import for the Modal ---
const AboutUs = dynamic(() => import('./AboutUs'), {
  ssr: false // Modal is client-side interaction only
});

// --- Interfaces --- (Same as before)
interface ParsedInterval {
  date: string;
  start: string;
  end: string;
}
interface Court {
  id: number;
  title: string;
  facility_type: string;
  address: string | null;
  Maps_url?: string | null;
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  parsed_intervals: ParsedInterval[];
}

// --- Helper functions --- (Same as before)
function timeToMinutes(str: string): number {
  if (!str) return -1;
  const [time, ampm] = str.toUpperCase().split(" ");
  if (!time || !ampm) return -1;
  const [hhStr, mmStr] = time.split(":");
  if (!hhStr || !mmStr) return -1;
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);
  if (isNaN(hh) || isNaN(mm)) return -1;
  const adjustedHh = ampm === "PM" && hh < 12 ? hh + 12 : ampm === "AM" && hh === 12 ? 0 : hh;
  return adjustedHh * 60 + mm;
}
function isRangeFree(court: Court, startM: number, endM: number): boolean {
  if (!Array.isArray(court.parsed_intervals) || startM === -1 || endM === -1) return false;
  return court.parsed_intervals.some((interval) => {
    const intervalStart = timeToMinutes(interval.start);
    const intervalEnd = timeToMinutes(interval.end);
    if (intervalStart === -1 || intervalEnd === -1) return false;
    return intervalStart <= startM && intervalEnd >= endM;
  });
}
function getHourAvailabilityColor(court: Court, hourSlot: string): string {
  const startM = timeToMinutes(hourSlot);
  if (startM === -1) return "bg-gray-200 text-gray-400";
  const midM = startM + 30;
  const endM = startM + 60;
  const half1Free = isRangeFree(court, startM, midM);
  const half2Free = isRangeFree(court, midM, endM);
  if (half1Free && half2Free) return "bg-green-500 text-white";
  if (!half1Free && !half2Free) return "bg-gray-400 text-gray-100";
  return "bg-orange-400 text-white";
}

// --- Skeleton Loader Components --- (Same as before)
function CourtCardSkeleton() {
  return (
    <Card className="shadow-md overflow-hidden border border-gray-200 rounded-lg animate-pulse">
      <div className="p-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <div className="h-3 bg-gray-200 rounded w-12"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="flex-shrink-0">
             <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {Array.from({ length: 17 }).map((_, idx) => (
            <div key={idx} className="h-8 sm:h-9 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-8 bg-gray-200 rounded w-full mt-3"></div>
      </CardContent>
    </Card>
  );
}
function CourtListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <CourtCardSkeleton key={index} />
      ))}
    </div>
  );
}

// === Main TennisCourtList Component ===
export default function TennisCourtList() {
  // --- State Hooks --- (Same as before)
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
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

   // --- Time Slots --- (Same as before)
    const timesInOneHour = [
        "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
        "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
    ];

  // --- Effects (Fetch data, Load favorites) --- (Same as before)
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getTennisCourts()
      .then(setCourts) // Simplified if getTennisCourts handles errors and returns []
      .catch((err) => {
        console.error("Failed to fetch tennis courts:", err);
        setError(`Failed to load court data. ${err.message || 'Please try refreshing.'}`);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favoriteCourts");
    if (storedFavorites) {
      try {
          const parsedFavorites = JSON.parse(storedFavorites);
          if (Array.isArray(parsedFavorites) && parsedFavorites.every(item => typeof item === 'number')) {
               setFavoriteCourts(parsedFavorites);
          } else { localStorage.removeItem("favoriteCourts"); }
      } catch (e) { localStorage.removeItem("favoriteCourts"); }
    }
  }, []);

  // --- Handler Functions --- (Same as before)
    const toggleFavorite = (courtId: number) => {
      setFavoriteCourts((prev) => {
        const updated = prev.includes(courtId) ? prev.filter((id) => id !== courtId) : [...prev, courtId];
        try { localStorage.setItem("favoriteCourts", JSON.stringify(updated)); } catch (e) { console.error("Failed to save favorites:", e); }
        return updated;
      });
    };
    const toggleFilter = (filter: keyof typeof filters) => {
      setFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
    };
    const toggleMapExpansion = (courtId: number) => {
      setExpandedMaps((prev) => prev.includes(courtId) ? prev.filter((id) => id !== courtId) : [...prev, courtId] );
    };
    const getGoogleMapsUrl = (court: Court): string => {
      if (court.Maps_url && court.Maps_url.trim().startsWith('http')) return court.Maps_url;
      const query = court.address || court.title || 'Seattle Tennis Court';
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    };

   // --- Filtering and Sorting ---
    const filteredCourts = courts.filter((court) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = !lowerSearchTerm || court.title?.toLowerCase().includes(lowerSearchTerm);

        // LINT FIX: Removed 'as any'. Assumes filter keys directly map to boolean court properties.
        const matchesFilters = (Object.keys(filters) as Array<keyof typeof filters>).every((filterKey) => {
            // If the filter is off, it always matches.
            if (!filters[filterKey]) return true;
            // If the filter is on, the corresponding court property must be true.
            return court[filterKey] === true;
        });
        return matchesSearch && matchesFilters;
    });

    const sortedCourts = [...filteredCourts].sort((a, b) => {
        const aFav = favoriteCourts.includes(a.id) ? 1 : 0;
        const bFav = favoriteCourts.includes(b.id) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav; // Favorites first
        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" }); // Then alphabetical
    });

  // --- Date for Display --- (Same as before)
    const today = new Date();
    const timeZone = 'America/Los_Angeles';
    let todayDate = 'Loading date...';
    try { todayDate = today.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', timeZone: timeZone }); }
    catch (e) { console.error("Error formatting date:", e); todayDate = "Error loading date"; }

  // --- Render Logic --- (Including Skeleton)
  if (isLoading) {
    return (
       <div className="bg-white text-black p-2 sm:p-0 space-y-4 relative">
        {aboutModalOpen && <AboutUs isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />}
        <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b border-gray-200 px-2 sm:px-0">
          {/* Header Content (Date, Search, Filters, Info Button) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
             {/* Left Side */}
             <div className="flex-grow space-y-3">
                <div className="text-xl font-semibold text-gray-700">{todayDate}</div>
                <input type="text" placeholder="Search courts by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm" aria-label="Search courts by name" />
                <div className="flex items-center gap-2 flex-wrap">
                   {(['lights', 'pickleball_lined', 'hitting_wall'] as const).map((filterKey) => { /* Filter Buttons */
                       const labels = { lights: 'Lights', pickleball_lined: 'Pickleball', hitting_wall: 'Wall' };
                       const icons = { lights: '/icons/lighticon.png', pickleball_lined: '/icons/pickleballicon.png', hitting_wall: '/icons/wallicon.png' };
                       const isActive = filters[filterKey];
                       return ( <Button key={filterKey} onClick={() => toggleFilter(filterKey)} variant="outline" size="sm" className={`flex items-center justify-center gap-1.5 px-2.5 h-8 text-xs transition-colors shadow-sm ${ isActive ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 ring-1 ring-blue-300" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50" }`} aria-pressed={isActive} > <Image src={icons[filterKey]} alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'} /> {labels[filterKey]} </Button> ); })}
                </div>
            </div>
            {/* Right Side */}
            <div className="flex-shrink-0 mt-2 sm:mt-0 self-center sm:self-start"> <Button onClick={() => setAboutModalOpen(true)} variant="outline" size="sm" className="bg-gray-700 text-white hover:bg-gray-800 border-gray-700 px-3 h-8 text-xs flex items-center gap-1.5 shadow-sm" > <Info size={14} /> Info / Key </Button> </div>
          </div>
        </div>
        <CourtListSkeleton /> {/* Show Skeleton */}
      </div>
    );
  }

  if (error) { /* Error display */ return ( <div className="flex items-center justify-center py-10 px-4"><p className="text-lg text-red-600 text-center bg-red-50 p-4 rounded border border-red-200">{error}</p></div> ); }

  // --- Original Render Logic (when not loading and no error) ---
  return (
    <div className="bg-white text-black p-2 sm:p-0 space-y-4 relative">
        {aboutModalOpen && <AboutUs isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />}
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b border-gray-200 px-2 sm:px-0">
          {/* Header Content */}
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
             {/* Left Side */}
             <div className="flex-grow space-y-3">
                <div className="text-xl font-semibold text-gray-700">{todayDate}</div>
                <input type="text" placeholder="Search courts by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm" aria-label="Search courts by name" />
                <div className="flex items-center gap-2 flex-wrap">
                   {(['lights', 'pickleball_lined', 'hitting_wall'] as const).map((filterKey) => { /* Filter Buttons */
                       const labels = { lights: 'Lights', pickleball_lined: 'Pickleball', hitting_wall: 'Wall' };
                       const icons = { lights: '/icons/lighticon.png', pickleball_lined: '/icons/pickleballicon.png', hitting_wall: '/icons/wallicon.png' };
                       const isActive = filters[filterKey];
                       return ( <Button key={filterKey} onClick={() => toggleFilter(filterKey)} variant="outline" size="sm" className={`flex items-center justify-center gap-1.5 px-2.5 h-8 text-xs transition-colors shadow-sm ${ isActive ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 ring-1 ring-blue-300" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50" }`} aria-pressed={isActive} > <Image src={icons[filterKey]} alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'} /> {labels[filterKey]} </Button> ); })}
                </div>
            </div>
            {/* Right Side */}
            <div className="flex-shrink-0 mt-2 sm:mt-0 self-center sm:self-start"> <Button onClick={() => setAboutModalOpen(true)} variant="outline" size="sm" className="bg-gray-700 text-white hover:bg-gray-800 border-gray-700 px-3 h-8 text-xs flex items-center gap-1.5 shadow-sm" > <Info size={14} /> Info / Key </Button> </div>
          </div>
        </div>
        {/* Court List or No Results */}
        {sortedCourts.length === 0 ? ( <div className="text-center text-base text-gray-600 py-10 px-4"> {courts.length > 0 ? "No courts found matching your current search or filters." : "No court data available at this time."} </div> ) : (
            <div className="space-y-4">
                {sortedCourts.map((court) => (
                    <Card key={court.id} className="shadow-md overflow-hidden border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-200">
                       {/* Card Header */}
                       <div className="p-3 border-b border-gray-100 bg-gray-50/60">
                           <div className="flex items-center justify-between gap-2">
                               <div className="flex-1 min-w-0">
                                   <h3 className="text-base font-semibold truncate text-gray-800">{court.title?.replace(/'/g, "'") || "Unknown Court"}</h3>
                                   <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-600">
                                      {court.lights && ( <div className="flex items-center gap-1" title="Lights available"><Image src="/icons/lighticon.png" alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/> Lights</div> )}
                                      {court.pickleball_lined && ( <div className="flex items-center gap-1" title="Pickleball lines"><Image src="/icons/pickleballicon.png" alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/> Pickleball</div> )}
                                      {court.hitting_wall && ( <div className="flex items-center gap-1" title="Hitting wall available"><Image src="/icons/wallicon.png" alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/> Wall</div> )}
                                   </div>
                               </div>
                               <div className="flex-shrink-0"> <Button variant="ghost" onClick={() => toggleFavorite(court.id)} className="p-1 h-8 w-8 rounded-full text-gray-400 hover:bg-yellow-100 hover:text-yellow-500 transition-colors duration-150" aria-label={favoriteCourts.includes(court.id) ? "Remove from favorites" : "Add to favorites"} > <Star size={18} className={`transition-colors duration-150 ${ favoriteCourts.includes(court.id) ? "fill-yellow-400 text-yellow-500" : "fill-transparent text-current" }`} /> </Button> </div>
                           </div>
                       </div>
                       {/* Card Content */}
                       <CardContent className="p-3 space-y-3">
                           {/* Availability Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                               {timesInOneHour.map((timeSlot, idx) => {
                                   const colorClass = getHourAvailabilityColor(court, timeSlot);
                                   const simpleTime = timeSlot.replace(':00 ', '').toLowerCase();
                                   const availabilityText = colorClass.includes('green') ? 'Available' : colorClass.includes('orange') ? 'Partially Available' : 'Reserved';
                                   return ( <div key={idx} className={`text-center py-2 px-1 rounded text-xs sm:text-sm ${colorClass} font-medium shadow-sm transition-colors duration-150`} title={`${availabilityText} at ${timeSlot}`} > {simpleTime} </div> );
                                  })}
                            </div>
                           {/* Map Toggle Button */}
                            <Button onClick={() => toggleMapExpansion(court.id)} variant="outline" size="sm" className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs h-8 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm" aria-expanded={expandedMaps.includes(court.id)} > <MapPin size={14} /> {expandedMaps.includes(court.id) ? "Hide Location" : "Show Location"} </Button>
                           {/* Expanded Map View */}
                            {expandedMaps.includes(court.id) && ( <div className="mt-2 p-3 bg-gray-50/80 rounded border border-gray-200 animate-in fade-in-50 duration-300"> <p className="text-sm text-gray-700 mb-2">{court.address?.replace(/'/g, "'") || "Address not available"}</p> <Button onClick={() => window.open(getGoogleMapsUrl(court), "_blank", "noopener,noreferrer")} size="sm" className="w-full bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs shadow-sm" > Open in Google Maps </Button> </div> )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
    </div>
  );
}