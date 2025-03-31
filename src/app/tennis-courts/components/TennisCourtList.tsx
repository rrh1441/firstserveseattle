// src/app/tennis-courts/components/TennisCourtList.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Import all necessary icons
import { Star, MapPin, Info, KeyRound, AlertTriangle, X } from "lucide-react";
import { getTennisCourts } from "@/lib/getTennisCourts";
import Image from "next/image";

// Interfaces (ParsedInterval, Court)
interface ParsedInterval {
  date: string;
  start: string;
  end: string;
}

interface Court {
  id: number;
  title: string;
  facility_type: string;
  address: string;
  Maps_url?: string;
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  parsed_intervals: ParsedInterval[];
}


// Helper functions (timeToMinutes, isRangeFree, getHourAvailabilityColor)
// Converts a time string like "1:00 PM" into minutes since midnight.
function timeToMinutes(str: string): number {
  if (!str) return -1;
  const [time, ampm] = str.toUpperCase().split(" ");
  if (!time || !ampm) return -1;

  const [hhStr, mmStr] = time.split(":");
  const hh = parseInt(hhStr, 10) || 0;
  const mm = parseInt(mmStr, 10) || 0;
  const adjustedHh =
    ampm === "PM" && hh < 12
      ? hh + 12
      : ampm === "AM" && hh === 12
      ? 0
      : hh;
  return adjustedHh * 60 + mm;
}

// Checks if a given time range is free for a court.
function isRangeFree(court: Court, startM: number, endM: number): boolean {
  if (!Array.isArray(court.parsed_intervals)) return false;
  return court.parsed_intervals.some((interval) => {
    const intervalStart = timeToMinutes(interval.start);
    const intervalEnd = timeToMinutes(interval.end);
    // Check if the *entire* 30-min slot is within a free interval
    return intervalStart <= startM && intervalEnd >= endM;
  });
}

// Determines the availability color for a 1-hour block based on 30-min intervals.
function getHourAvailabilityColor(court: Court, hourSlot: string): string {
  const startM = timeToMinutes(hourSlot); // e.g., 2:00 PM -> 840
  const midM = startM + 30;              // e.g., 2:30 PM -> 870
  const endM = startM + 60;              // e.g., 3:00 PM -> 900

  const half1Free = isRangeFree(court, startM, midM); // Check 2:00 - 2:30
  const half2Free = isRangeFree(court, midM, endM);   // Check 2:30 - 3:00

  if (half1Free && half2Free) {
    return "bg-green-500 text-white"; // Fully free for the hour
  } else if (!half1Free && !half2Free) {
    return "bg-gray-400 text-gray-100"; // Fully booked for the hour (use slightly darker gray)
  } else {
    // Partially booked (one half is free, the other isn't)
    return "bg-orange-400 text-white"; // Use a distinct orange
  }
}


// --- IMPROVED AboutUsModal Component Definition ---
function AboutUsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    // Overlay with backdrop blur
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-300"
      onClick={onClose} // Close modal if overlay is clicked
    >
      {/* Modal Content Box - stop propagation so clicking inside doesn't close it */}
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

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto p-6 sm:p-8">
            {/* Header Section */}
            <div className="text-center mb-6">
                <div className="inline-block p-2 bg-green-100 rounded-full mb-3">
                    <Image
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg" // Logo
                        alt="First Serve Seattle Logo"
                        width={48} // Slightly smaller logo inside circle
                        height={48}
                    />
                </div>
                {/* Value Prop Headline */}
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                    Spend Less Time Searching, <br /> More Time Playing!
                </h2>
                <p className="mt-2 text-base text-gray-600">
                    {/* Using specific date */}
                    Your daily guide to open courts in Seattle (Monday, March 31).
                </p>
            </div>

            {/* Body Content Sections */}
            <div className="space-y-6">
                {/* How It Works */}
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 text-blue-600">
                        <Info size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1">How It Works</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
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
                        Reflects schedule data fetched this morning. Does not guarantee availability against later bookings or unscheduled use.
                    </p>
                </div>

                {/* Important Note */}
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 text-orange-600">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Booking Ahead?</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            This app shows <span className="font-medium">today&apos;s</span> walk-on potential. To reserve courts for future dates, please use the official{" "}
                            <a href="https://anc.apm.activecommunities.com/seattle/reservation/search?facilityTypeIds=39%2C115&resourceType=0&equipmentQty=0" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                Seattle Parks Reservation Site
                            </a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer - Call to Action */}
        <div className="p-6 pt-4 bg-gray-50 border-t border-gray-200 mt-auto">
            <Button
                onClick={() => window.location.href = "/signup"} // Direct user to signup
                className="w-full bg-[#0c372b] text-white hover:bg-[#0c372b]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-6 py-3 text-base font-semibold" // Consistent primary style
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
  // State to control the modal visibility
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

   // Time slots for the availability grid
   const timesInOneHour = [
        "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
        "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
    ];

  // Fetch court data on mount
  useEffect(() => {
    setIsLoading(true);
    getTennisCourts()
      .then((data) => {
        setCourts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tennis courts:", err);
        setError("Failed to load court data. Please try refreshing.");
        setIsLoading(false);
      });
  }, []);


  // Load favorite courts from localStorage on mount
   useEffect(() => {
     const storedFavorites = localStorage.getItem("favoriteCourts");
     if (storedFavorites) {
       try {
            setFavoriteCourts(JSON.parse(storedFavorites));
       } catch (e) {
           console.error("Failed to parse favorite courts from localStorage:", e);
           localStorage.removeItem("favoriteCourts"); // Clear invalid data
       }
     }
   }, []);

  // --- Helper Functions ---
   const toggleFavorite = (courtId: number) => {
     const updated = favoriteCourts.includes(courtId)
       ? favoriteCourts.filter((id) => id !== courtId)
       : [...favoriteCourts, courtId];
     setFavoriteCourts(updated);
     localStorage.setItem("favoriteCourts", JSON.stringify(updated));
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

    const getGoogleMapsUrl = (court: Court): string => {
     if (court.Maps_url && court.Maps_url.trim() !== "") {
       return court.Maps_url;
     }
     const address = court.address || court.title || 'Seattle Tennis Court';
     const encodedAddress = encodeURIComponent(address);
     return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`; // Use standard maps search URL
   };
  // --- End Helper Functions ---


  // Filtering and Sorting logic
  const filtered = courts.filter((court) => {
    const matchesSearch = court.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilters = Object.keys(filters).every((key) => {
      const filterKey = key as keyof typeof filters;
      if (!filters[filterKey]) return true;
       // Ensure the court object actually has the key before accessing it
       return court.hasOwnProperty(filterKey) && court[filterKey as keyof Court];
    });
    return matchesSearch && matchesFilters;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aFav = favoriteCourts.includes(a.id) ? 1 : 0;
    const bFav = favoriteCourts.includes(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav; // Favorites first
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" }); // Then alphabetical
  });

  // Get today's date string (Using specific date from context)
   const todayDate = "Monday, March 31";


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
    // Main container for the list and controls
    <div className="bg-white text-black p-2 sm:p-0 space-y-4 relative">
      {/* Render the Modal (it's positioned fixed, so location here doesn't matter much) */}
      <AboutUsModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />

      {/* Sticky Header Section */}
      <div className="sticky top-0 bg-white z-10 pt-4 pb-3 mb-4 border-b border-gray-200 px-2 sm:px-0">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
             {/* Left side: Date, Search, Filters */}
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
                  />
                 {/* Filter Buttons */}
                 <div className="flex items-center gap-2 flex-wrap">
                    {(['lights', 'pickleball_lined', 'hitting_wall'] as const).map((filterKey) => {
                        const labels = { lights: 'Lights', pickleball_lined: 'Pickleball', hitting_wall: 'Wall' };
                        const icons = { lights: '/icons/lighticon.png', pickleball_lined: '/icons/pickleballicon.png', hitting_wall: '/icons/wallicon.png' };
                        const isActive = filters[filterKey];
                        return (
                          <Button
                            key={filterKey}
                            onClick={() => toggleFilter(filterKey)}
                            variant="outline"
                            size="sm"
                            className={`flex items-center justify-center gap-1.5 px-2.5 h-8 text-xs transition-colors shadow-sm ${
                              isActive
                                ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 ring-1 ring-blue-300" // Added ring for active state
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50" // Subtle hover for inactive
                            }`}
                          >
                            <Image src={icons[filterKey]} alt={labels[filterKey]} width={12} height={12} />
                            {labels[filterKey]}
                          </Button>
                        );
                     })}
                 </div>
             </div>

             {/* Right side: About Us / Key button */}
             <div className="flex-shrink-0 mt-2 sm:mt-0 self-center sm:self-end">
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


      {/* Courts List or No Results Message */}
      {sorted.length === 0 ? (
        <div className="text-center text-base text-gray-600 py-10 px-4">
           {courts.length > 0 ? "No courts found matching your current filters." : "No court data available currently."}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Map through sorted courts and render a Card for each */}
          {sorted.map((court) => (
            <Card key={court.id} className="shadow-md overflow-hidden border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-200">
              {/* Card Header Section */}
              <div className="p-3 border-b border-gray-100 bg-gray-50/60">
                <div className="flex items-center justify-between gap-2">
                  {/* Court Title and Amenities */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold truncate text-gray-800 hover:text-blue-700 transition-colors">
                        {/* Optionally link title to map or details */}
                        {court.title}
                    </h3>
                     <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-600">
                       {court.lights && (
                         <div className="flex items-center gap-1" title="Lights available"><Image src="/icons/lighticon.png" alt="Lights" width={12} height={12} /> Lights</div>
                       )}
                       {court.pickleball_lined && (
                         <div className="flex items-center gap-1" title="Pickleball lines"><Image src="/icons/pickleballicon.png" alt="Pickleball" width={12} height={12} /> Pickleball</div>
                       )}
                       {court.hitting_wall && (
                         <div className="flex items-center gap-1" title="Hitting wall available"><Image src="/icons/wallicon.png" alt="Hitting Wall" width={12} height={12} /> Wall</div>
                       )}
                     </div>
                  </div>
                  {/* Favorite Button */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(court.id)}
                       className="p-1 h-8 w-8 rounded-full text-gray-400 hover:bg-yellow-100 hover:text-yellow-500 transition-colors duration-150"
                       aria-label={favoriteCourts.includes(court.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star
                         size={18}
                        className={`transition-colors duration-150 ${
                          favoriteCourts.includes(court.id)
                            ? "fill-yellow-400 text-yellow-500"
                            : "" // Let hover styles handle the color change
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Card Content: Availability Grid & Map */}
              <CardContent className="p-3 space-y-3">
                 {/* Availability Grid */}
                 <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1.5">
                   {timesInOneHour.map((timeSlot, idx) => {
                     const colorClass = getHourAvailabilityColor(court, timeSlot);
                     // Simplify time display: "6a", "12p", "5p" etc.
                     const simpleTime = timeSlot.replace(':00', '').replace(' AM', 'a').replace(' PM', 'p');
                     return (
                       <div
                         key={idx}
                         className={`text-center py-1 px-0.5 rounded text-[10px] sm:text-[11px] ${colorClass} font-medium shadow-sm transition-colors duration-150`}
                         title={`Availability ${timeSlot} - ${
                            colorClass.includes('green') ? 'Available' : colorClass.includes('orange') ? 'Partially Available' : 'Reserved'
                         }`}
                       >
                         {simpleTime}
                       </div>
                     );
                   })}
                 </div>

                {/* Location Button */}
                <Button
                  onClick={() => toggleMapExpansion(court.id)}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs h-8 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm"
                >
                  <MapPin size={14} />
                  {expandedMaps.includes(court.id) ? "Hide Location" : "Show Location"}
                </Button>

                {/* Expanded Map/Address Section */}
                {expandedMaps.includes(court.id) && (
                  <div className="mt-2 p-3 bg-gray-50/80 rounded border border-gray-200 animate-in fade-in-50 duration-300">
                    <p className="text-sm text-gray-700 mb-2">{court.address || "Address not available"}</p>
                    <Button
                       onClick={() => window.open(getGoogleMapsUrl(court), "_blank", "noopener,noreferrer")}
                       size="sm"
                       className="w-full bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs shadow-sm"
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
    </div> // End Main container
  );
}