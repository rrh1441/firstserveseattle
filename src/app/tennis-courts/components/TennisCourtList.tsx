// src/app/tennis-courts/components/TennisCourtList.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Info, KeyRound, AlertTriangle, X } from "lucide-react";
import { getTennisCourts } from "@/lib/getTennisCourts"; // Ensure this path is correct
import Image from "next/image";

// Interfaces (ParsedInterval, Court) - Adjusted based on previous corrections
interface ParsedInterval {
  date: string;
  start: string;
  end: string;
}

interface Court {
  id: number;
  title: string;
  facility_type: string;
  address: string | null; // Allow address to be null
  Maps_url?: string | null; // Allow Maps_url to be null
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  parsed_intervals: ParsedInterval[];
}


// Helper functions (timeToMinutes, isRangeFree, getHourAvailabilityColor)
function timeToMinutes(str: string): number {
  if (!str) return -1;
  const [time, ampm] = str.toUpperCase().split(" ");
  if (!time || !ampm) return -1;

  const [hhStr, mmStr] = time.split(":");
  if (!hhStr || !mmStr) return -1; // Add check for split result
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);

  // Check if parsing resulted in valid numbers
  if (isNaN(hh) || isNaN(mm)) return -1;

  const adjustedHh =
    ampm === "PM" && hh < 12
      ? hh + 12
      : ampm === "AM" && hh === 12
      ? 0 // Midnight case
      : hh;
  return adjustedHh * 60 + mm;
}

function isRangeFree(court: Court, startM: number, endM: number): boolean {
  if (!Array.isArray(court.parsed_intervals) || startM === -1 || endM === -1) return false; // Check input validity
  return court.parsed_intervals.some((interval) => {
    const intervalStart = timeToMinutes(interval.start);
    const intervalEnd = timeToMinutes(interval.end);
    // Ensure interval times are valid before comparing
    if (intervalStart === -1 || intervalEnd === -1) return false;
    // Check if the court's free interval *contains* the requested slot
    return intervalStart <= startM && intervalEnd >= endM;
  });
}

function getHourAvailabilityColor(court: Court, hourSlot: string): string {
  const startM = timeToMinutes(hourSlot);
   // Check if start time is valid
  if (startM === -1) return "bg-gray-200 text-gray-400"; // Indicate invalid time slot data

  const midM = startM + 30;
  const endM = startM + 60;

  const half1Free = isRangeFree(court, startM, midM);
  const half2Free = isRangeFree(court, midM, endM);

  if (half1Free && half2Free) {
    return "bg-green-500 text-white"; // Fully available
  } else if (!half1Free && !half2Free) {
    return "bg-gray-400 text-gray-100"; // Fully reserved
  } else {
    return "bg-orange-400 text-white"; // Partially available
  }
}


// --- AboutUsModal Component Definition ---
function AboutUsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset'; // Cleanup on unmount
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-300"
      onClick={onClose} // Close when clicking overlay
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200 animate-in zoom-in-95 fade-in-0 duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Close Button */}
        <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={22} />
        </button>
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8">
            <div className="text-center mb-6">
                <div className="inline-block p-2 bg-green-100 rounded-full mb-3">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
                      alt="First Serve Seattle Logo"
                      width={48}
                      height={48}
                      priority
                    />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                    Spend Less Time Searching, <br /> More Time Playing!
                </h2>
                <p className="mt-2 text-base text-gray-600">
                    Your daily guide to open courts in Seattle.
                </p>
            </div>
            <div className="space-y-6">
                {/* How It Works */}
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 text-blue-600"> <Info size={20} /> </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1">How It Works</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                           {/* Use &apos; for apostrophes in static text */}
                           First Serve Seattle checks the official Parks reservation system each morning to show you today&apos;s available public tennis and pickleball courts for walk-on play. No more guesswork!
                        </p>
                    </div>
                </div>
                {/* Availability Key */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <KeyRound size={18} className="text-gray-600" />
                        <h3 className="font-semibold text-gray-800">Availability Key</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            <span className="w-3.5 h-3.5 rounded-full bg-green-500 border border-green-600/50 mr-2 flex-shrink-0"></span>
                            <span className="font-medium text-gray-700 w-16">Green:</span>
                            <span className="text-gray-600">Fully Available</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3.5 h-3.5 rounded-full bg-orange-400 border border-orange-500/50 mr-2 flex-shrink-0"></span>
                            <span className="font-medium text-gray-700 w-16">Orange:</span>
                            <span className="text-gray-600">Partially Available</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3.5 h-3.5 rounded-full bg-gray-400 border border-gray-500/50 mr-2 flex-shrink-0"></span>
                            <span className="font-medium text-gray-700 w-16">Gray:</span>
                            <span className="text-gray-600">Fully Reserved</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                        {/* Use &apos; for apostrophes in static text */}
                        Availability based on schedule data checked this morning. Real-time court status may vary due to recent bookings or walk-ons.
                    </p>
                </div>
                 {/* Booking Ahead */}
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 text-orange-600"> <AlertTriangle size={20} /> </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Booking Ahead?</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {/* Use &apos; for apostrophes in static text */}
                            This app shows <span className="font-medium">today&apos;s</span> walk-on potential. To reserve courts for future dates, please use the official{" "}
                            <a href="https://anc.apm.activecommunities.com/seattle/reservation/search?facilityTypeIds=39%2C115&resourceType=0&equipmentQty=0" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                Seattle Parks Reservation Site
                            </a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        {/* Modal Footer */}
        <div className="p-6 pt-4 bg-gray-50 border-t border-gray-200 mt-auto">
            <Button
                onClick={() => window.location.href = "/signup"}
                className="w-full bg-[#0c372b] text-white hover:bg-[#0c372b]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-6 py-3 text-base font-semibold"
            >
                Get Unlimited Court Checks
            </Button>
        </div>
      </div>
    </div>
  );
}
// --- END AboutUsModal Component Definition ---


// === Main TennisCourtList Component ===
export default function TennisCourtList() {
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

   // Define time slots consistently
    const timesInOneHour = [
        "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
        "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
    ];

  // Fetch courts on component mount
  useEffect(() => {
    setIsLoading(true);
    setError(null); // Reset error on new fetch attempt
    getTennisCourts()
      .then((data) => {
         // Add basic validation
        if (!Array.isArray(data)) {
           console.error("Received invalid court data format:", data);
           throw new Error("Received invalid court data format.");
        }
        setCourts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tennis courts:", err);
        setError(`Failed to load court data. ${err.message || 'Please try refreshing.'}`);
        setIsLoading(false);
      });
  }, []); // Empty dependency array ensures this runs only once on mount

  // Load favorites from localStorage
  useEffect(() => {
     const storedFavorites = localStorage.getItem("favoriteCourts");
     if (storedFavorites) {
       try {
            const parsedFavorites = JSON.parse(storedFavorites);
            // Basic validation: ensure it's an array of numbers
            if (Array.isArray(parsedFavorites) && parsedFavorites.every(item => typeof item === 'number')) {
                 setFavoriteCourts(parsedFavorites);
            } else {
                 console.warn("Invalid favorite courts data found in localStorage. Resetting.");
                 localStorage.removeItem("favoriteCourts");
            }
       } catch (e) {
           console.error("Failed to parse favorite courts from localStorage:", e);
           localStorage.removeItem("favoriteCourts"); // Clear corrupted data
       }
     }
   }, []); // Empty dependency array

   // --- Handler Functions ---
   const toggleFavorite = (courtId: number) => {
     setFavoriteCourts((prev) => {
        const updated = prev.includes(courtId)
         ? prev.filter((id) => id !== courtId)
         : [...prev, courtId];
        // Update localStorage whenever favorites change
        try {
            localStorage.setItem("favoriteCourts", JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save favorites to localStorage:", e);
            // Handle potential storage errors (e.g., quota exceeded)
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
     // Prioritize explicit Maps_url if available and valid
     if (court.Maps_url && court.Maps_url.trim().startsWith('http')) {
       return court.Maps_url;
     }
     // Use address OR title as fallback query
     const query = court.address || court.title || 'Seattle Tennis Court';
     const encodedQuery = encodeURIComponent(query);
     // Use standard Google Maps search URL
     return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
   };

   // --- Filtering and Sorting ---
   const filteredCourts = courts.filter((court) => {
    // Match search term (case-insensitive) in title
    const matchesSearch = court.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Match active filters
    const matchesFilters = Object.keys(filters).every((key) => {
      const filterKey = key as keyof typeof filters;
      if (!filters[filterKey]) return true; // If filter is off, it matches
      // Ensure the court object has the property and it's true-ish
      return court.hasOwnProperty(filterKey) && !!court[filterKey as keyof Omit<Court, 'id' | 'title' | 'address' | 'parsed_intervals' | 'Maps_url' | 'facility_type'>]; // Type assertion might be needed if keys don't perfectly align
    });

    return matchesSearch && matchesFilters;
  });

  const sortedCourts = [...filteredCourts].sort((a, b) => {
    const aFav = favoriteCourts.includes(a.id) ? 1 : 0;
    const bFav = favoriteCourts.includes(b.id) ? 1 : 0;
    // Sort favorites to the top
    if (aFav !== bFav) return bFav - aFav;
    // Then sort alphabetically by title (case-insensitive)
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
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
            timeZone: timeZone // Ensure consistent timezone
       });
   } catch (e) {
       console.error("Error formatting date:", e);
       todayDate = "Error loading date"; // Fallback
   }


   // --- Render Logic ---
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-10">
         <p className="text-lg text-gray-600 animate-pulse">Loading courts...</p>
       </div>
     );
   }

   if (error) {
     return (
       <div className="flex items-center justify-center py-10 px-4">
         <p className="text-lg text-red-600 text-center bg-red-50 p-4 rounded border border-red-200">{error}</p>
       </div>
     );
   }

  return (
    <div className="bg-white text-black p-2 sm:p-0 space-y-4 relative">
      {/* About Modal */}
      <AboutUsModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />

      {/* Sticky Header with Filters */}
      <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b border-gray-200 px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left Side: Date, Search, Filters */}
            <div className="flex-grow space-y-3">
                {/* Date Display */}
                <div className="text-xl font-semibold text-gray-700">{todayDate}</div>
                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search courts by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
                    aria-label="Search courts by name"
                />
                {/* Filter Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(['lights', 'pickleball_lined', 'hitting_wall'] as const).map((filterKey) => {
                      const labels = { lights: 'Lights', pickleball_lined: 'Pickleball', hitting_wall: 'Wall' };
                      // Ensure icons are in public/icons folder or adjust path
                      const icons = { lights: '/icons/lighticon.png', pickleball_lined: '/icons/pickleballicon.png', hitting_wall: '/icons/wallicon.png' };
                      const isActive = filters[filterKey];
                      return (
                        <Button
                          key={filterKey}
                          onClick={() => toggleFilter(filterKey)}
                          variant="outline"
                          size="sm"
                          // Toggle visual state based on isActive
                          className={`flex items-center justify-center gap-1.5 px-2.5 h-8 text-xs transition-colors shadow-sm ${
                            isActive
                              ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 ring-1 ring-blue-300"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                          aria-pressed={isActive} // Indicate state for accessibility
                        >
                           {/* Add basic error handling for Image */}
                          <Image src={icons[filterKey]} alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'} />
                          {labels[filterKey]}
                        </Button>
                      );
                    })}
                </div>
            </div>
            {/* Right Side: Info Button */}
            <div className="flex-shrink-0 mt-2 sm:mt-0 self-center sm:self-start">
                <Button
                    onClick={() => setAboutModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 text-white hover:bg-gray-800 border-gray-700 px-3 h-8 text-xs flex items-center gap-1.5 shadow-sm"
                >
                    <Info size={14} />
                    Info / Key
                </Button>
            </div>
          </div>
      </div>

      {/* Court List or No Results Message */}
      {sortedCourts.length === 0 ? (
        <div className="text-center text-base text-gray-600 py-10 px-4">
            {/* Provide clearer message based on whether initial fetch returned courts */}
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
                      {/* ===================== FIX 1: Escape title ===================== */}
                      <h3 className="text-base font-semibold truncate text-gray-800">
                           {court.title?.replace(/'/g, "&apos;") || "Unknown Court"}
                      </h3>
                      {/* ================================================================ */}
                      {/* Attributes (Lights, Pickleball, Wall) */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-600">
                        {court.lights && (
                          <div className="flex items-center gap-1" title="Lights available"><Image src="/icons/lighticon.png" alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/> Lights</div>
                        )}
                        {court.pickleball_lined && (
                          <div className="flex items-center gap-1" title="Pickleball lines"><Image src="/icons/pickleballicon.png" alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/> Pickleball</div>
                        )}
                        {court.hitting_wall && (
                          <div className="flex items-center gap-1" title="Hitting wall available"><Image src="/icons/wallicon.png" alt="" width={12} height={12} aria-hidden="true" onError={(e) => e.currentTarget.style.display='none'}/> Wall</div>
                        )}
                      </div>
                  </div>
                  {/* Favorite Button */}
                  <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        onClick={() => toggleFavorite(court.id)}
                        className="p-1 h-8 w-8 rounded-full text-gray-400 hover:bg-yellow-100 hover:text-yellow-500 transition-colors duration-150"
                        aria-label={favoriteCourts.includes(court.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star
                           size={18}
                           // Dynamically fill star based on favorite status
                           className={`transition-colors duration-150 ${
                             favoriteCourts.includes(court.id)
                               ? "fill-yellow-400 text-yellow-500"
                               : "fill-transparent text-current" // Use transparent fill when not favorited
                           }`}
                        />
                      </Button>
                  </div>
                </div>
              </div>
              {/* Card Content: Availability Grid and Map */}
              <CardContent className="p-3 space-y-3">
                  {/* Availability Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {timesInOneHour.map((timeSlot, idx) => {
                      const colorClass = getHourAvailabilityColor(court, timeSlot);
                      // Simplify time display (e.g., "6am", "12pm")
                      const simpleTime = timeSlot.replace(':00 ', '').toLowerCase();
                      const availabilityText = colorClass.includes('green') ? 'Available' : colorClass.includes('orange') ? 'Partially Available' : 'Reserved';
                      return (
                        <div
                          key={idx}
                          className={`text-center py-2 px-1 rounded text-xs sm:text-sm ${colorClass} font-medium shadow-sm transition-colors duration-150`}
                          title={`${availabilityText} at ${timeSlot}`} // Tooltip for clarity
                        >
                          {simpleTime}
                        </div>
                      );
                    })}
                  </div>
                  {/* Map Toggle Button */}
                  <Button
                    onClick={() => toggleMapExpansion(court.id)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs h-8 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm"
                    aria-expanded={expandedMaps.includes(court.id)} // Accessibility state
                  >
                    <MapPin size={14} />
                    {expandedMaps.includes(court.id) ? "Hide Location" : "Show Location"}
                  </Button>
                  {/* Expanded Map View */}
                  {expandedMaps.includes(court.id) && (
                    <div className="mt-2 p-3 bg-gray-50/80 rounded border border-gray-200 animate-in fade-in-50 duration-300">
                       {/* ================== FIX 2: Escape address ================== */}
                       <p className="text-sm text-gray-700 mb-2">
                            {court.address?.replace(/'/g, "&apos;") || "Address not available"}
                       </p>
                       {/* ============================================================ */}
                      <Button
                          onClick={() => window.open(getGoogleMapsUrl(court), "_blank", "noopener,noreferrer")}
                          size="sm"
                          className="w-full bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs shadow-sm"
                          // Disable button if address and title are both missing? Or rely on fallback query.
                          // disabled={!court.address && !court.title}
                      >
                        Open in Google Maps
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}