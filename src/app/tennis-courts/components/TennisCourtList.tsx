// src/app/tennis-courts/components/TennisCourtList.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Info } from "lucide-react";
import { getTennisCourts } from "@/lib/getTennisCourts"; // Ensure this path is correct
import Image from "next/image";
import dynamic from 'next/dynamic';

// --- Dynamic Import ---
const AboutUs = dynamic(() => import('./AboutUs'), { ssr: false });

// --- Interfaces ---
interface ParsedInterval {
  date: string;
  start: string;
  end: string;
}

// Using Maps_url based on your last provided code for this file
interface Court {
  id: number;
  title: string;
  facility_type: string;
  address: string | null;
  Maps_url?: string | null; // Using Maps_url as per your last version
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  ball_machine: boolean;
  parsed_intervals: ParsedInterval[];
}

// --- Helper functions (timeToMinutes, isRangeFree, getHourAvailabilityColor) ---
// Keep the robust helper functions from previous steps
function timeToMinutes(str: string): number {
  if (!str) return -1;
  const parts = str.toUpperCase().split(/\s+/);
  if (parts.length !== 2) return -1;
  const [time, ampm] = parts;
  if (!time || !ampm || (ampm !== "AM" && ampm !== "PM")) return -1;
  const [hhStr, mmStr] = time.split(":");
  if (!hhStr || !mmStr) return -1;
  const hh = parseFloat(hhStr);
  const mm = parseFloat(mmStr);
  if (isNaN(hh) || isNaN(mm) || hh < 1 || hh > 12 || mm < 0 || mm > 59) return -1;
  const hhInt = Math.floor(hh);
  const mmInt = Math.floor(mm);
  const adjustedHh =
    ampm === "PM" && hhInt < 12
      ? hhInt + 12
      : ampm === "AM" && hhInt === 12
      ? 0
      : hhInt;
  return adjustedHh * 60 + mmInt;
}

function isRangeFree(court: Court, startM: number, endM: number): boolean {
  if (!Array.isArray(court.parsed_intervals) || court.parsed_intervals.length === 0 || startM === -1 || endM === -1) {
     return false;
  }
  return court.parsed_intervals.some((interval) => {
    if (!interval || !interval.start || !interval.end) return false;
    const intervalStart = timeToMinutes(interval.start);
    const intervalEnd = timeToMinutes(interval.end);
    if (intervalStart === -1 || intervalEnd === -1) {
      return false;
    }
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
  if (half1Free && half2Free) {
    return "bg-green-500 text-white"; // Fully available
  } else if (!half1Free && !half2Free) {
    return "bg-gray-400 text-gray-100"; // Fully reserved/unavailable
  } else {
    return "bg-orange-400 text-white"; // Partially available
  }
}


// --- Skeleton Loader Components ---
function CourtCardSkeleton() {
  return (
    <Card className="shadow-md overflow-hidden border border-gray-200 rounded-lg animate-pulse">
      {/* Skeleton Header */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5"></div> {/* Skeleton Title */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <div className="h-3 bg-gray-200 rounded w-12"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-10"></div>
              <div className="h-3 bg-gray-200 rounded w-14"></div> {/* Added for Ball Machine possibility */}
            </div>
          </div>
          <div className="flex-shrink-0">
             <div className="h-8 w-8 bg-gray-200 rounded-full"></div> {/* Skeleton Fav Button */}
          </div>
        </div>
      </div>
      {/* Skeleton Content */}
      <CardContent className="p-3 space-y-3">
         {/* Skeleton Availability Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {Array.from({ length: 17 }).map((_, idx) => ( // Assuming 17 time slots
            <div key={idx} className="h-8 sm:h-9 bg-gray-200 rounded"></div>
          ))}
        </div>
        {/* Skeleton Map Button */}
        <div className="h-8 bg-gray-200 rounded w-full mt-3"></div>
        {/* Skeleton Ball Machine Button */}
        <div className="h-8 bg-gray-200 rounded w-full mt-2"></div>
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
  const [courts, setCourts] = useState<Court[]>([]);
  const [favoriteCourts, setFavoriteCourts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    lights: false,
    hitting_wall: false,
    pickleball_lined: false,
    ball_machine: false, // ball_machine filter state
  });
  const [expandedMaps, setExpandedMaps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Define time slots consistently
  const timesInOneHour = [
      "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
      "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
      "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
  ];

  // --- Fetch courts ---
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getTennisCourts()
      .then((data) => {
        if (!Array.isArray(data)) {
           console.error("Received invalid court data format:", data);
           setError("Failed to load court data: Invalid format received.");
           setCourts([]);
        } else {
           setCourts(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch tennis courts:", err);
        setError(`Failed to load court data. ${err.message || 'Please check connection or try refreshing.'}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // --- Load favorites ---
  useEffect(() => {
    try {
        const storedFavorites = localStorage.getItem("favoriteCourts");
        if (storedFavorites) {
            const parsedFavorites = JSON.parse(storedFavorites);
            if (Array.isArray(parsedFavorites) && parsedFavorites.every(item => typeof item === 'number')) {
                setFavoriteCourts(parsedFavorites);
            } else {
                console.warn("Invalid favorite courts data found in localStorage. Resetting.");
                localStorage.removeItem("favoriteCourts");
            }
        }
    } catch (e) {
        console.error("Failed to parse favorite courts from localStorage.", e);
        localStorage.removeItem("favoriteCourts");
    }
  }, []);

  // --- Handler Functions ---
  const toggleFavorite = (courtId: number) => {
    setFavoriteCourts((prev) => {
      const isCurrentlyFavorite = prev.includes(courtId);
      const updated = isCurrentlyFavorite
       ? prev.filter((id) => id !== courtId)
       : [...prev, courtId];
      try {
          localStorage.setItem("favoriteCourts", JSON.stringify(updated));
      } catch (e) {
          console.error("Failed to save favorites to localStorage.", e);
      }
      return updated;
    });
  };

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const toggleMapExpansion = (courtId: number) => {
    setExpandedMaps((prev) =>
      prev.includes(courtId)
       ? prev.filter((id) => id !== courtId)
       : [...prev, courtId]
    );
  };

  // Safely get Google Maps URL
  const getGoogleMapsUrl = (court: Court): string => {
    if (court.Maps_url && court.Maps_url.trim().startsWith('http')) {
      return court.Maps_url;
    }
    const query = court.address?.trim() || court.title?.trim() || 'Seattle Tennis Court';
    const encodedQuery = encodeURIComponent(query);
    // Corrected Google Maps Search URL
    return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
  };


  // --- Filtering and Sorting ---
  const filteredCourts = courts.filter((court) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = !lowerSearchTerm || (court.title && court.title.toLowerCase().includes(lowerSearchTerm));

      const matchesFilters = (Object.keys(filters) as Array<keyof typeof filters>).every((filterKey) => {
          if (!filters[filterKey]) return true;
          // Ensure the property exists on the court object before checking
          // Although our Court type definition mandates these keys, data could potentially be malformed
          return court.hasOwnProperty(filterKey) && court[filterKey] === true;
      });

      return matchesSearch && matchesFilters;
  });

  const sortedCourts = [...filteredCourts].sort((a, b) => {
      const aFav = favoriteCourts.includes(a.id) ? 1 : 0;
      const bFav = favoriteCourts.includes(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      const titleA = a.title || '';
      const titleB = b.title || '';
      return titleA.localeCompare(titleB, undefined, { sensitivity: "base" });
  });

  // --- Date for Display ---
  const today = new Date();
  const timeZone = 'America/Los_Angeles'; // Seattle Timezone
  let todayDate = 'Loading date...';
  try {
      // Make sure Intl is supported, or use a library like date-fns for wider compatibility if needed
      todayDate = today.toLocaleDateString("en-US", {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          timeZone: timeZone
      });
  } catch (e) {
      console.error("Error formatting date.", e);
      todayDate = "Date Error"; // Fallback
  }

  // --- Define Filter Keys, Labels, and Icons ---
  const filterConfig = {
    lights: { label: 'Lights', icon: '/icons/lighticon.png' },
    pickleball_lined: { label: 'Pickleball', icon: '/icons/pickleballicon.png' },
    hitting_wall: { label: 'Wall', icon: '/icons/wallicon.png' },
    // ***** MODIFICATION 1: Updated Label *****
    ball_machine: { label: 'Machine', icon: '/icons/ballmachine.png' },
  } as const;

  type FilterKey = keyof typeof filterConfig;


  // --- Render Logic ---

  // Render Skeleton Loader when isLoading
  if (isLoading) {
    return (
       <div className="bg-white text-black p-2 sm:p-0 space-y-4 relative">
        {aboutModalOpen && <AboutUs isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />}
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b border-gray-200 px-2 sm:px-0">
          {/* Header Content */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
             {/* Left Side */}
             <div className="flex-grow space-y-3 w-full sm:w-auto">
                <div className="text-xl font-semibold text-gray-700">{todayDate}</div>
                <input
                    type="text"
                    placeholder="Search courts by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
                    aria-label="Search courts by name"
                />
                {/* ***** MODIFICATION 2: Updated Filter Container Layout ***** */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                   {(Object.keys(filterConfig) as FilterKey[]).map((filterKey) => {
                       const { label, icon } = filterConfig[filterKey];
                       const isActive = filters[filterKey];
                       return (
                           <Button
                               key={filterKey}
                               onClick={() => toggleFilter(filterKey)}
                               variant="outline"
                               // ***** MODIFICATION 3: Updated Filter Button Size/Padding/Text *****
                               className={`flex items-center justify-center gap-1.5 px-3 h-9 text-sm transition-colors duration-150 shadow-sm w-full sm:w-auto ${ // Added w-full for grid, sm:w-auto for flex
                                isActive
                                ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 ring-1 ring-blue-300"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                               }`}
                               aria-pressed={isActive}
                           >
                               {/* ***** MODIFICATION 3b: Updated Filter Icon Size ***** */}
                              <Image src={icon} alt="" width={14} height={14} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'} />
                              {label}
                           </Button>
                       );
                      })}
                </div>
            </div>
            {/* Right Side: Info Button */}
             <div className="flex-shrink-0 mt-2 sm:mt-0 self-center sm:self-start sm:ml-4">
                <Button
                    onClick={() => setAboutModalOpen(true)}
                    variant="outline"
                    // ***** MODIFICATION 4: Updated Info Button Size to Match Filters *****
                    className="bg-gray-700 text-white hover:bg-gray-800 border-gray-700 px-3 h-9 text-sm flex items-center gap-1.5 shadow-sm"
                    aria-label="Open Information and Key"
                >
                    {/* ***** MODIFICATION 4b: Updated Info Icon Size ***** */}
                    <Info size={16} aria-hidden="true" />
                    Info / Key
                </Button>
            </div>
          </div>
        </div>
        {/* Render Skeleton List */}
        <CourtListSkeleton />
      </div>
    );
  }

  // Render Error Message
  if (error) {
    return (
      <div className="flex items-center justify-center py-10 px-4 min-h-[300px]">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Oops! Something went wrong.</h3>
            <p className="text-base text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // --- Render Loaded State (when not loading and no error) ---
  return (
    <div className="bg-white text-black p-2 sm:p-0 space-y-4 relative">
        {aboutModalOpen && <AboutUs isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />}

        {/* Sticky Header with Filters */}
        <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b border-gray-200 px-2 sm:px-0">
           {/* Header Content */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
             {/* Left Side */}
             <div className="flex-grow space-y-3 w-full sm:w-auto">
                <div className="text-xl font-semibold text-gray-700">{todayDate}</div>
                <input
                    type="text"
                    placeholder="Search courts by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
                    aria-label="Search courts by name"
                />
                {/* ***** MODIFICATION 2: Updated Filter Container Layout ***** */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                   {(Object.keys(filterConfig) as FilterKey[]).map((filterKey) => {
                       const { label, icon } = filterConfig[filterKey];
                       const isActive = filters[filterKey];
                       return (
                           <Button
                               key={filterKey}
                               onClick={() => toggleFilter(filterKey)}
                               variant="outline"
                               // ***** MODIFICATION 3: Updated Filter Button Size/Padding/Text *****
                               className={`flex items-center justify-center gap-1.5 px-3 h-9 text-sm transition-colors duration-150 shadow-sm w-full sm:w-auto ${ // Added w-full for grid, sm:w-auto for flex
                                isActive
                                ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 ring-1 ring-blue-300"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                               }`}
                               aria-pressed={isActive}
                           >
                               {/* ***** MODIFICATION 3b: Updated Filter Icon Size ***** */}
                              <Image src={icon} alt="" width={14} height={14} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/>
                              {label}
                           </Button>
                       );
                      })}
                </div>
            </div>
            {/* Right Side: Info Button */}
             <div className="flex-shrink-0 mt-2 sm:mt-0 self-center sm:self-start sm:ml-4">
                <Button
                    onClick={() => setAboutModalOpen(true)}
                    variant="outline"
                    // ***** MODIFICATION 4: Updated Info Button Size to Match Filters *****
                    className="bg-gray-700 text-white hover:bg-gray-800 border-gray-700 px-3 h-9 text-sm flex items-center gap-1.5 shadow-sm"
                    aria-label="Open Information and Key"
                >
                    {/* ***** MODIFICATION 4b: Updated Info Icon Size ***** */}
                    <Info size={16} aria-hidden="true"/>
                    Info / Key
                </Button>
            </div>
          </div>
        </div>

        {/* Court List or No Results Message */}
        {sortedCourts.length === 0 ? (
            <div className="text-center text-base text-gray-600 py-10 px-4 min-h-[200px] flex items-center justify-center">
                 {courts.length > 0 ? "No courts found matching your current search or filters." : "No court data available at this time."}
            </div>
        ) : (
            <div className="space-y-4">
                {sortedCourts.map((court) => (
                    <Card key={court.id} className="shadow-md overflow-hidden border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-200">
                        {/* Card Header */}
                        <div className="p-3 border-b border-gray-100 bg-gray-50/60">
                           <div className="flex items-center justify-between gap-2">
                               {/* Court Title and Attributes */}
                               <div className="flex-1 min-w-0">
                                   <h3 className="text-base sm:text-lg font-semibold truncate text-gray-800" title={court.title ?? "Unknown Court"}>
                                       {court.title?.replace(/'/g, "'") || "Unknown Court"}
                                   </h3>
                                   <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-600">
                                      {court.lights && (
                                          <div className="flex items-center gap-1" title="Lights available">
                                             <Image src="/icons/lighticon.png" alt="Lights" width={12} height={12} onError={(e) => e.currentTarget.style.display='none'}/> Lights
                                          </div>
                                      )}
                                      {court.pickleball_lined && (
                                          <div className="flex items-center gap-1" title="Pickleball lines">
                                              <Image src="/icons/pickleballicon.png" alt="Pickleball" width={12} height={12} onError={(e) => e.currentTarget.style.display='none'}/> Pickleball
                                           </div>
                                      )}
                                      {court.hitting_wall && (
                                          <div className="flex items-center gap-1" title="Hitting wall available">
                                              <Image src="/icons/wallicon.png" alt="Wall" width={12} height={12} onError={(e) => e.currentTarget.style.display='none'}/> Wall
                                          </div>
                                      )}
                                      {/* Optional: Display Ball Machine attribute text if desired */}
                                      {/* {court.ball_machine && (
                                          <div className="flex items-center gap-1" title="Ball machine rental nearby">
                                              <Image src="/icons/ballmachine.png" alt="Ball Machine" width={12} height={12} onError={(e) => e.currentTarget.style.display='none'}/> Machine Nearby
                                          </div>
                                      )} */}
                                   </div>
                               </div>
                               {/* Favorite Button --- CORRECTION APPLIED HERE --- */}
                               <div className="flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    // REMOVED size="icon"
                                    onClick={() => toggleFavorite(court.id)}
                                    // Use className for dimensions and padding
                                    className="p-1 h-8 w-8 rounded-full text-gray-400 hover:bg-yellow-100 hover:text-yellow-500 transition-colors duration-150 flex items-center justify-center"
                                    aria-label={favoriteCourts.includes(court.id) ? "Remove from favorites" : "Add to favorites"}
                                  >
                                    <Star
                                       size={18} // Icon size
                                       fill={favoriteCourts.includes(court.id) ? "currentColor" : "none"}
                                       className={`transition-colors duration-150 ${
                                        favoriteCourts.includes(court.id)
                                        ? "text-yellow-400" // Color when favorite
                                        : "text-gray-400" // Default outline color
                                       }`}
                                    />
                                  </Button>
                               </div>
                           </div>
                        </div>
                        {/* Card Content: Availability Grid, Map, and Ball Machine Button */}
                        <CardContent className="p-3 space-y-3">
                           {/* Availability Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                               {timesInOneHour.map((timeSlot, idx) => {
                                   const colorClass = getHourAvailabilityColor(court, timeSlot);
                                   const simpleTime = timeSlot.replace(':00 ', '').toLowerCase();
                                   const availabilityText = colorClass.includes('green') ? 'Available' : colorClass.includes('orange') ? 'Partially Available' : 'Reserved/Unavailable';
                                   return (
                                       <div
                                           key={`${court.id}-time-${idx}`} // Unique key
                                           className={`text-center py-2 px-1 rounded text-xs sm:text-sm ${colorClass} font-medium shadow-sm transition-colors duration-150`}
                                           title={`${availabilityText} at ${timeSlot}`}
                                       >
                                          {simpleTime}
                                       </div>
                                   );
                                  })}
                            </div>

                           {/* Map Toggle Button */}
                           {(court.address || court.Maps_url) && (
                              <Button
                                onClick={() => toggleMapExpansion(court.id)}
                                variant="outline"
                                size="sm" // Use 'sm' size
                                className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs h-8 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm"
                                aria-expanded={expandedMaps.includes(court.id)}
                                aria-controls={`map-details-${court.id}`}
                              >
                                  <MapPin size={14} aria-hidden="true" />
                                  {expandedMaps.includes(court.id) ? "Hide Location" : "Show Location"}
                              </Button>
                           )}

                           {/* Expanded Map View */}
                            {expandedMaps.includes(court.id) && (
                                <div
                                    id={`map-details-${court.id}`}
                                    className="mt-2 p-3 bg-gray-50/80 rounded border border-gray-200 animate-in fade-in-50 duration-300"
                                >
                                    <p className="text-sm text-gray-700 mb-2">
                                       {court.address?.replace(/'/g, "'") || "Address not available"}
                                    </p>
                                    {(court.Maps_url || court.address || court.title) && (
                                        <Button
                                            onClick={() => window.open(getGoogleMapsUrl(court), "_blank", "noopener,noreferrer")}
                                            size="sm" // Use 'sm' size
                                            className="w-full bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs shadow-sm"
                                        >
                                           Open in Google Maps
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* --- Ball Machine Rental Button --- */}
                            {court.ball_machine && (
                                <Button
                                    onClick={() => window.open("https://seattleballmachine.com", "_blank", "noopener,noreferrer")}
                                    size="sm" // Keep this specific button 'sm' unless you want it larger too
                                    className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs h-8 bg-blue-800 text-white hover:bg-blue-900 shadow-sm" // Kept original size for this one
                                >
                                    {/* Ensure icon path is correct */}
                                    <Image src="/icons/ballmachine.png" alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/>
                                    Ball Machine Rental (Nearby)
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
    </div>
  );
}