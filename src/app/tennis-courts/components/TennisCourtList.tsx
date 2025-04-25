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

interface Court {
  id: number;
  title: string;
  facility_type: string;
  address: string | null;
  // Ensure this matches the name used in getTennisCourts and mapping
  // If getTennisCourts maps to `Maps_url`, use that here.
  // If it maps to `Maps_url`, use `Maps_url`. Let's assume `Maps_url` based on getTennisCourts.
  Maps_url?: string | null; // Renamed for clarity, adjust if needed
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  ball_machine: boolean; // <-- Add ball machine property
  parsed_intervals: ParsedInterval[];
}

// --- Helper functions (timeToMinutes, isRangeFree, getHourAvailabilityColor) ---
// ... (Keep existing helper functions as they are) ...
function timeToMinutes(str: string): number {
  if (!str) return -1;
  // Robust split: handles potential extra spaces around AM/PM
  const parts = str.toUpperCase().split(/\s+/);
  if (parts.length !== 2) return -1; // Expecting "TIME AMPM"

  const [time, ampm] = parts;
  if (!time || !ampm || (ampm !== "AM" && ampm !== "PM")) return -1;

  const [hhStr, mmStr] = time.split(":");
  if (!hhStr || !mmStr) return -1;

  // Use parseFloat and check for NaN for more robust parsing
  const hh = parseFloat(hhStr);
  const mm = parseFloat(mmStr);

  if (isNaN(hh) || isNaN(mm) || hh < 1 || hh > 12 || mm < 0 || mm > 59) return -1; // Validate hours (1-12) and minutes (0-59)

  // Careful with integer conversion after validation
  const hhInt = Math.floor(hh);
  const mmInt = Math.floor(mm);


  const adjustedHh =
    ampm === "PM" && hhInt < 12
      ? hhInt + 12
      : ampm === "AM" && hhInt === 12
      ? 0 // Midnight case (12 AM)
      : hhInt; // Handles 1 AM to 11 AM and 12 PM correctly

  // Handle potential edge case: 12 PM should be 12 * 60, not (12+12)*60
  // The logic above already handles this, 12 PM becomes adjustedHh = 12.

  return adjustedHh * 60 + mmInt;
}

function isRangeFree(court: Court, startM: number, endM: number): boolean {
  // Add check for empty parsed_intervals
  if (!Array.isArray(court.parsed_intervals) || court.parsed_intervals.length === 0 || startM === -1 || endM === -1) {
     return false;
  }

  return court.parsed_intervals.some((interval) => {
    // Ensure interval has start and end times before parsing
    if (!interval || !interval.start || !interval.end) return false;

    const intervalStart = timeToMinutes(interval.start);
    const intervalEnd = timeToMinutes(interval.end);

    // Skip if interval times are invalid
    if (intervalStart === -1 || intervalEnd === -1) {
      // Optional: Log warning about invalid interval data for the court
      // console.warn(`Invalid time found in interval for court ${court.id}:`, interval);
      return false;
    }

    // Check for overlap: Interval includes the requested [startM, endM] slot
    // Note: This logic assumes intervals represent *available* time.
    // If intervals represent *booked* time, the logic needs inversion.
    // Assuming intervals = available time slots based on function name "isRangeFree"
    return intervalStart <= startM && intervalEnd >= endM;
  });
}


function getHourAvailabilityColor(court: Court, hourSlot: string): string {
  const startM = timeToMinutes(hourSlot);
  // If the hour slot itself is invalid, return gray
  if (startM === -1) return "bg-gray-200 text-gray-400";

  const midM = startM + 30; // Check 30 min into the hour
  const endM = startM + 60; // Check the end of the hour slot

  // Check if the first half [startM, midM) and second half [midM, endM) are free
  const half1Free = isRangeFree(court, startM, midM);
  const half2Free = isRangeFree(court, midM, endM);

  if (half1Free && half2Free) {
    return "bg-green-500 text-white"; // Fully available for the hour
  } else if (!half1Free && !half2Free) {
    // If neither half is free according to parsed_intervals, it's fully reserved/unavailable
    return "bg-gray-400 text-gray-100"; // Fully reserved / unavailable data
  } else {
    // If one half is free but the other isn't, it's partially available
    return "bg-orange-400 text-white"; // Partially available
  }
}


// --- Skeleton Loader Components ---
// ... (CourtCardSkeleton and CourtListSkeleton remain the same) ...
function CourtCardSkeleton() {
  // Mimics the structure and height of a single court card
  return (
    <Card className="shadow-md overflow-hidden border border-gray-200 rounded-lg animate-pulse">
      {/* Skeleton Header */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5"></div> {/* Skeleton Title */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {/* Adjust width/number based on average visible attributes */}
              <div className="h-3 bg-gray-200 rounded w-12"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-10"></div>
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
        {/* Optional: Skeleton for potential Ball Machine Button */}
        <div className="h-8 bg-gray-200 rounded w-full mt-2"></div>
      </CardContent>
    </Card>
  );
}

function CourtListSkeleton({ count = 5 }: { count?: number }) {
  // Renders multiple skeleton cards to approximate list height
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
    ball_machine: false, // <-- Add ball_machine filter state
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
        // More robust check: is it an array?
        if (!Array.isArray(data)) {
           console.error("Received invalid court data format:", data);
           setError("Failed to load court data: Invalid format received.");
           setCourts([]); // Set to empty array on invalid data
        } else {
           // Optional: Further validation of array items if needed
           // e.g., data.every(item => typeof item === 'object' && item !== null && 'id' in item)
           setCourts(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch tennis courts:", err);
        // Provide a user-friendly error message
        setError(`Failed to load court data. ${err.message || 'Please check connection or try refreshing.'}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // Empty dependency array: runs once on mount

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
    // Use specific catch if needed, otherwise generic is fine
    } catch (e) {
        console.error("Failed to parse favorite courts from localStorage.", e);
        // Clear potentially corrupted data
        localStorage.removeItem("favoriteCourts");
    }
  }, []); // Empty dependency array

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
          // Optional: Notify user of persistence failure?
      }
      return updated;
    });
  };

  // Type the filter key correctly
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
    // Use the potentially renamed property `Maps_url`
    if (court.Maps_url && court.Maps_url.trim().startsWith('http')) {
      return court.Maps_url;
    }
    // Use address OR title as fallback query
    // Ensure title/address are not null/empty before encoding
    const query = court.address?.trim() || court.title?.trim() || 'Seattle Tennis Court';
    const encodedQuery = encodeURIComponent(query);
    // Use standard Google Maps search URL
    return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`; // Use https and standard search query param
  };


  // --- Filtering and Sorting ---
  const filteredCourts = courts.filter((court) => {
      // Match search term (case-insensitive) in title
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = !lowerSearchTerm || (court.title && court.title.toLowerCase().includes(lowerSearchTerm));

      // Match active filters
      // This logic automatically includes the new 'ball_machine' filter
      const matchesFilters = (Object.keys(filters) as Array<keyof typeof filters>).every((filterKey) => {
          // If the filter is off (filters[filterKey] is false), it always matches.
          if (!filters[filterKey]) return true;
          // If the filter is on, the corresponding court property must be explicitly true.
          // Use bracket notation for dynamic access. Ensure the property exists and is boolean.
          return court[filterKey] === true; // Check for explicit true
      });

      return matchesSearch && matchesFilters;
  });

  const sortedCourts = [...filteredCourts].sort((a, b) => {
      const aFav = favoriteCourts.includes(a.id) ? 1 : 0;
      const bFav = favoriteCourts.includes(b.id) ? 1 : 0;
      // Sort favorites to the top
      if (aFav !== bFav) return bFav - aFav; // Higher fav score comes first
      // Then sort alphabetically by title (case-insensitive, handles nulls)
      const titleA = a.title || '';
      const titleB = b.title || '';
      // localeCompare is good for alphabetical sorting, handles different characters
      return titleA.localeCompare(titleB, undefined, { sensitivity: "base" });
  });

  // --- Date for Display ---
  const today = new Date();
  const timeZone = 'America/Los_Angeles'; // Seattle Timezone
  let todayDate = 'Loading date...';
  try {
      todayDate = today.toLocaleDateString("en-US", {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          timeZone: timeZone
      });
  } catch (e) {
      console.error("Error formatting date.", e);
      todayDate = "Date Error"; // More specific fallback
  }

  // --- Define Filter Keys, Labels, and Icons ---
  // Use 'as const' for type safety with filter keys
  const filterConfig = {
    lights: { label: 'Lights', icon: '/icons/lighticon.png' },
    pickleball_lined: { label: 'Pickleball', icon: '/icons/pickleballicon.png' },
    hitting_wall: { label: 'Wall', icon: '/icons/wallicon.png' },
    ball_machine: { label: 'Ball Machine', icon: '/icons/ballmachine.png' }, // <-- Add config for ball machine
  } as const; // Make keys readonly and specific

  // Type for filter keys derived from the config object
  type FilterKey = keyof typeof filterConfig;


  // --- Render Logic ---

  // Render Skeleton Loader when isLoading
  if (isLoading) {
    return (
       <div className="bg-white text-black p-2 sm:p-0 space-y-4 relative">
        {aboutModalOpen && <AboutUs isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />}
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b border-gray-200 px-2 sm:px-0">
          {/* Header Content (Date, Search, Filters, Info Button) */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"> {/* Align items-start for better wrapping */}
             {/* Left Side */}
             <div className="flex-grow space-y-3 w-full sm:w-auto"> {/* Allow left side to take width */}
                <div className="text-xl font-semibold text-gray-700">{todayDate}</div>
                <input
                    type="text"
                    placeholder="Search courts by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
                    aria-label="Search courts by name"
                />
                <div className="flex items-center gap-2 flex-wrap"> {/* Allow filters to wrap */}
                   {/* Map over the filter keys from the config object */}
                   {(Object.keys(filterConfig) as FilterKey[]).map((filterKey) => {
                       const { label, icon } = filterConfig[filterKey];
                       const isActive = filters[filterKey];
                       return (
                           <Button
                               key={filterKey}
                               onClick={() => toggleFilter(filterKey)}
                               variant="outline"
                               size="sm"
                               className={`flex items-center justify-center gap-1.5 px-2.5 h-8 text-xs transition-colors duration-150 shadow-sm ${
                                isActive
                                ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 ring-1 ring-blue-300"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                               }`}
                               aria-pressed={isActive}
                           >
                              {/* Use Next Image for optimization, ensure public path is correct */}
                              <Image src={icon} alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'} />
                              {label}
                           </Button>
                       );
                      })}
                </div>
            </div>
            {/* Right Side: Info Button */}
            {/* Add sm:ml-4 for spacing on larger screens */}
            <div className="flex-shrink-0 mt-2 sm:mt-0 self-center sm:self-start sm:ml-4">
                <Button
                    onClick={() => setAboutModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 text-white hover:bg-gray-800 border-gray-700 px-3 h-8 text-xs flex items-center gap-1.5 shadow-sm"
                    aria-label="Open Information and Key"
                >
                    <Info size={14} aria-hidden="true" />
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
            {/* Optional: Add a retry button */}
             {/* <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button> */}
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
           {/* Header Content - Reuse the same structure as in loading state */}
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
                <div className="flex items-center gap-2 flex-wrap">
                   {(Object.keys(filterConfig) as FilterKey[]).map((filterKey) => {
                       const { label, icon } = filterConfig[filterKey];
                       const isActive = filters[filterKey];
                       return (
                           <Button
                               key={filterKey}
                               onClick={() => toggleFilter(filterKey)}
                               variant="outline"
                               size="sm"
                               className={`flex items-center justify-center gap-1.5 px-2.5 h-8 text-xs transition-colors duration-150 shadow-sm ${
                                isActive
                                ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 ring-1 ring-blue-300"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                               }`}
                               aria-pressed={isActive}
                           >
                              <Image src={icon} alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/>
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
                    size="sm"
                    className="bg-gray-700 text-white hover:bg-gray-800 border-gray-700 px-3 h-8 text-xs flex items-center gap-1.5 shadow-sm"
                    aria-label="Open Information and Key"
                >
                    <Info size={14} aria-hidden="true"/>
                    Info / Key
                </Button>
            </div>
          </div>
        </div>

        {/* Court List or No Results Message */}
        {sortedCourts.length === 0 ? (
            <div className="text-center text-base text-gray-600 py-10 px-4 min-h-[200px] flex items-center justify-center">
                 {/* Check if courts were loaded but filters/search yielded no results */}
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
                                   {/* Use text-lg for title? Adjust based on design */}
                                   <h3 className="text-base sm:text-lg font-semibold truncate text-gray-800" title={court.title ?? "Unknown Court"}>
                                       {court.title?.replace(/'/g, "'") || "Unknown Court"}
                                   </h3>
                                   {/* Group attributes together */}
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
                                      {/* Add Ball Machine attribute display if needed - distinct from the button */}
                                      {/* {court.ball_machine && (
                                          <div className="flex items-center gap-1" title="Ball machine rental nearby">
                                              <Image src="/icons/ballmachine.png" alt="Ball Machine" width={12} height={12} onError={(e) => e.currentTarget.style.display='none'}/> Machine Nearby
                                          </div>
                                      )} */}
                                   </div>
                               </div>
                               {/* Favorite Button */}
                               <div className="flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon" // Make it a square icon button
                                    onClick={() => toggleFavorite(court.id)}
                                    className="p-1 h-8 w-8 rounded-full text-gray-400 hover:bg-yellow-100 hover:text-yellow-500 transition-colors duration-150"
                                    aria-label={favoriteCourts.includes(court.id) ? "Remove from favorites" : "Add to favorites"}
                                  >
                                    <Star
                                       size={18} // Adjust size as needed
                                       // Use fill rule for better solid star appearance
                                       fill={favoriteCourts.includes(court.id) ? "currentColor" : "none"}
                                       className={`transition-colors duration-150 ${
                                        favoriteCourts.includes(court.id)
                                        ? "text-yellow-400" // Star color when favorite
                                        : "text-gray-400" // Default star outline color
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
                                           key={`${court.id}-time-${idx}`} // More specific key
                                           className={`text-center py-2 px-1 rounded text-xs sm:text-sm ${colorClass} font-medium shadow-sm transition-colors duration-150`}
                                           title={`${availabilityText} at ${timeSlot}`}
                                       >
                                          {simpleTime}
                                       </div>
                                   );
                                  })}
                            </div>

                           {/* Map Toggle Button */}
                           {/* Conditionally render map button only if there's an address or URL */}
                           {(court.address || court.Maps_url) && (
                              <Button
                                onClick={() => toggleMapExpansion(court.id)}
                                variant="outline"
                                size="sm"
                                className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs h-8 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm"
                                aria-expanded={expandedMaps.includes(court.id)}
                                aria-controls={`map-details-${court.id}`} // Link button to the content it controls
                              >
                                  <MapPin size={14} aria-hidden="true" />
                                  {expandedMaps.includes(court.id) ? "Hide Location" : "Show Location"}
                              </Button>
                           )}

                           {/* Expanded Map View */}
                            {expandedMaps.includes(court.id) && (
                                <div
                                    id={`map-details-${court.id}`} // ID for aria-controls
                                    className="mt-2 p-3 bg-gray-50/80 rounded border border-gray-200 animate-in fade-in-50 duration-300"
                                >
                                    {/* Display address safely */}
                                    <p className="text-sm text-gray-700 mb-2">
                                       {court.address?.replace(/'/g, "'") || "Address not available"}
                                    </p>
                                    {/* Ensure URL exists before rendering button */}
                                    {(court.Maps_url || court.address || court.title) && (
                                        <Button
                                            onClick={() => window.open(getGoogleMapsUrl(court), "_blank", "noopener,noreferrer")}
                                            size="sm"
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
                                    size="sm"
                                    // Define US Open Blue (approx. using Tailwind, or define custom color)
                                    // Example using a darker blue: bg-blue-800 hover:bg-blue-900
                                    // For exact color #003168, you'd need to add it to your tailwind.config.js
                                    className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs h-8 bg-blue-800 text-white hover:bg-blue-900 shadow-sm"
                                >
                                    <Image src="/icons/ballmachine.png" alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/>
                                    Ball Machine Rental
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