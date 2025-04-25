/* ────────────────────────────────────────────────────
   src/app/tennis-courts/components/TennisCourtList.tsx
   ────────────────────────────────────────────────────*/
   "use client";

   import React, { useEffect, useMemo, useState } from "react";
   import dynamic from "next/dynamic";
   import Image from "next/image";
   import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";
   import { Card, CardContent } from "@/components/ui/card";
   import { Button } from "@/components/ui/button";
   import { Badge } from "@/components/ui/badge";
   import { Info, Star, MapPin } from "lucide-react";
   
   /* lazy-loaded modal */
   const AboutUs = dynamic(() => import("./AboutUs"), { ssr: false });
   
   /* ──────────────── badge presets ──────────────── */
   
   interface Tier {
     text: string;
     color: string;
   }
   const TIER: Record<"N/A" | "Walk" | "Hot" | "Busy" | "Chill", Tier> = {
     "N/A": {
       text: "N/A – No recent popularity data",
       color: "bg-gray-100 text-gray-600 border-gray-300",
     },
     Walk: {
       text: "Walk-on – First-come, first-served only",
       color: "bg-gray-200 text-gray-700 border-gray-400",
     },
     Hot: {
       text: "Hot – Extremely popular court, recommend booking ahead",
       color: "bg-red-100 text-red-800 border-red-300",
     },
     Busy: {
       text: "Busy – Often reserved, consider booking ahead",
       color: "bg-orange-100 text-orange-800 border-orange-300",
     },
     Chill: {
       text: "Chill – Light traffic, walk-on fine",
       color: "bg-blue-100 text-blue-800 border-blue-300",
     },
   };
   
   /* ──────────────── helper types ──────────────── */
   
   type FilterKey =
     | "lights"
     | "hitting_wall"
     | "pickleball_lined"
     | "ball_machine";
   
   /* ──────────────── maps URL ──────────────── */
   
   const mapsUrl = (c: TennisCourt) =>
     c.Maps_url?.startsWith("http")
       ? c.Maps_url
       // Corrected template literal (removed extra {) - Assuming this was a typo
       : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
           c.address ?? c.title
         )}`;
   
   /* ──────────────── time helpers ──────────────── */
   
   const TIME = [
     "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
     "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
     "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
   ];
   const toMin = (t: string) => {
     const [hhmm, ap] = t.toUpperCase().split(" ");
     const [h, m] = hhmm.split(":").map(Number);
     // Handle 12 AM/PM correctly
     let hour = h === 12 ? (ap === "AM" ? 0 : 12) : h;
     if (ap === "PM" && h !== 12) hour += 12;
     return hour * 60 + m;
   };
   
   const slotClr = (court: TennisCourt, t: string) => {
     // Ensure parsed_intervals exists and is an array
     if (!Array.isArray(court.parsed_intervals)) {
         console.warn(`Court ID ${court.id} has missing or invalid parsed_intervals.`);
         return "bg-gray-300 text-gray-600"; // Indicate missing data
     }
   
     const s = toMin(t);
     const mid = s + 30; // Check availability for the full hour slot [s, s+60)
     const endOfSlot = s + 60;
   
     // Check if the *entire* hour slot [s, s+60) is within *any* single free interval
     const isFullyAvailable = court.parsed_intervals.some(({ start, end }) => {
         try {
           const st = toMin(start);
           const en = toMin(end);
           return st <= s && en >= endOfSlot;
         } catch (e) {
           console.error(`Error parsing interval [${start}, ${end}] for court ${court.id}:`, e);
           return false; // Skip problematic intervals
         }
     });
   
     if (isFullyAvailable) return "bg-green-500 text-white"; // Fully green if whole hour is free
   
     // Check if the *first* half [s, mid) is within *any* free interval
     const firstHalfAvailable = court.parsed_intervals.some(({ start, end }) => {
       try {
           const st = toMin(start);
           const en = toMin(end);
           return st <= s && en >= mid;
       } catch { return false; } // Ignore errors for this check
     });
   
     // Check if the *second* half [mid, endOfSlot) is within *any* free interval
     const secondHalfAvailable = court.parsed_intervals.some(({ start, end }) => {
       try {
           const st = toMin(start);
           const en = toMin(end);
           return st <= mid && en >= endOfSlot;
       } catch { return false; } // Ignore errors for this check
     });
   
     if (firstHalfAvailable || secondHalfAvailable) return "bg-orange-400 text-white"; // Orange if partially available
   
     return "bg-gray-400 text-gray-100"; // Gray if no part is available
   };
   
   
   /* ──────────────── skeleton (brief) ──────────────── */
   
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
   
   /* ──────────────── main component ──────────────── */
   
   export default function TennisCourtList() {
     /* state */
     const [courts, setCourts] = useState<TennisCourt[]>([]);
     const [fav, setFav] = useState<number[]>([]);
     const [search, setSearch] = useState("");
     const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
       lights: false, hitting_wall: false, pickleball_lined: false, ball_machine: false,
     });
     const [expanded, setExpanded] = useState<number[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [about, setAbout] = useState(false);
   
     /* fetch courts */
     useEffect(() => {
       getTennisCourts()
         .then(data => {
             // Pre-process intervals here if they aren't already
             const processedData = data.map(court => ({
                 ...court,
                 // Ensure parsed_intervals is always an array, even if empty
                 parsed_intervals: Array.isArray(court.parsed_intervals) ? court.parsed_intervals : []
             }));
             setCourts(processedData);
         })
         .catch((e) => {
             console.error("Error fetching tennis courts:", e);
             setError(e.message || "Failed to load court data.");
          })
         .finally(() => setLoading(false));
     }, []);
   
   
     /* favorites LS */
     useEffect(() => {
       try {
         const raw = localStorage.getItem("favoriteCourts");
         if (raw) setFav(JSON.parse(raw));
       } catch {/* ignore */}
     }, []);
     const toggleFav = (id: number) =>
       setFav((prev) => {
         const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
         try {
            localStorage.setItem("favoriteCourts", JSON.stringify(next));
         } catch (e) {
            console.error("Failed to save favorites to localStorage:", e);
            // Optionally notify the user
         }
         return next;
       });
   
   
     /* percentile cut-offs (exclude 0) */
     const { p15, p50 } = useMemo(() => {
       const s = courts
         .map((c) => c.avg_busy_score_7d)
         .filter((x): x is number => typeof x === 'number' && x > 0) // More robust check
         .sort((a, b) => a - b);
       if (!s.length) return { p15: 0, p50: 0 };
       const idx = (p: number) => Math.floor(p * s.length);
       // Ensure indices don't go out of bounds
       const p15Index = Math.min(idx(0.15), s.length - 1);
       const p50Index = Math.min(idx(0.50), s.length - 1);
       return { p15: s[p15Index], p50: s[p50Index] };
     }, [courts]);
   
   
     const tierFor = (score: number | null): Tier => {
       if (score === null || typeof score !== 'number') return TIER["N/A"]; // Handle non-numeric scores
       if (score === 0)    return TIER["Walk"];
       // Use calculated percentiles only if they are valid (greater than 0)
       if (p15 > 0 && score <= p15)   return TIER["Hot"];
       if (p50 > 0 && score <= p50)   return TIER["Busy"];
       // If score is > 0 but doesn't fit Hot/Busy (or percentiles are 0), consider Chill
       if (score > 0) return TIER["Chill"];
       // Fallback if score is somehow negative or percentiles are broken
       return TIER["N/A"];
     };
   
   
     /* filter + sort memo */
     const list = useMemo(() => {
       return courts
         .filter((c) =>
           search ? c.title.toLowerCase().includes(search.toLowerCase()) : true
         )
         .filter((c) =>
           (Object.keys(filters) as FilterKey[]).every((k) => !filters[k] || c[k])
         )
         .sort((a, b) => {
           const af = fav.includes(a.id) ? 1 : 0;
           const bf = fav.includes(b.id) ? 1 : 0;
           if (af !== bf) return bf - af; // Favorites first
           // Then sort by title
           return a.title.localeCompare(b.title);
         });
     }, [courts, search, filters, fav]);
   
     /* header helpers */
     const today = useMemo(() => new Date().toLocaleDateString("en-US", {
       weekday: "long", month: "long", day: "numeric",
       timeZone: "America/Los_Angeles", // Ensure consistency
     }), []); // Calculate only once
   
     const cfg: Record<FilterKey, { label: string; icon: string }> = {
       lights: { label: "Lights", icon: "/icons/lighticon.png" },
       hitting_wall: { label: "Wall", icon: "/icons/wallicon.png" },
       pickleball_lined: { label: "Pickleball", icon: "/icons/pickleballicon.png" },
       ball_machine: { label: "Machine", icon: "/icons/ballmachine.png" },
     };
   
     /* render */
     if (loading) return <div className="p-4"><CardSkeleton /></div>;
     if (error)   return <div className="p-6 text-red-600">Error loading court data: {error}</div>;
   
     return (
       <div className="p-4 space-y-4">
         {about && <AboutUs isOpen={about} onClose={() => setAbout(false)} />}
   
         {/* ───── top bar ───── */}
         <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-3 pt-6 space-y-3"> {/* Added backdrop blur for better sticky feel */}
           <div className="text-xl font-semibold px-1">{today}</div> {/* Added padding */}
           <div className="flex gap-2 items-center px-1"> {/* Added padding */}
             <input
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search courts…"
               className="flex-1 p-2 border rounded bg-input text-foreground placeholder:text-muted-foreground" // Use theme colors
             />
             <Button
               variant="outline"
               size="icon" // Make it an icon button on mobile
               className="p-2 flex items-center sm:hidden" // Show only on small screens
               onClick={() => setAbout(true)}
               aria-label="Information" // Accessibility
             >
               <Info size={18} />
             </Button>
              <Button
               variant="outline"
               size="sm"
               className="p-2 hidden items-center gap-1 sm:inline-flex" // Show text button on larger screens
               onClick={() => setAbout(true)}
             >
               <Info size={18} />
               <span>Info</span>
             </Button>
           </div>
   
           {/* Filter Buttons Container */}
           <div className="grid grid-cols-2 gap-2 px-1"> {/* Added padding */}
             {(Object.entries(cfg) as [FilterKey, { label: string; icon: string }][])
               .map(([k, { label, icon }]) => (
                 <Button
                   key={k}
                   onClick={() => setFilters((f) => ({ ...f, [k]: !f[k] }))}
                   variant="outline" // Always outline
                   size="sm" // Consistent size
                   className={`flex items-center justify-center gap-1.5 w-full h-9 sm:h-8 ${ // Adjusted height, gap
                     filters[k]
                       ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" // Use secondary colors for active state
                       : "bg-transparent" // Ensure default outline background is transparent
                   }`}
                 >
                   <Image src={icon} alt="" width={14} height={14} className="flex-shrink-0" /> {/* Prevent icon shrinking */}
                   <span className="truncate">{label}</span> {/* Prevent text overflow */}
                 </Button>
               ))}
           </div>
         </div>
   
         {/* ───── list ───── */}
         {list.length === 0 ? (
           <div className="text-center text-muted-foreground pt-6"> {/* Centered message */}
               No courts match your current search and filter criteria.
           </div>
         ) : (
           <div className="space-y-3"> {/* Add space between cards */}
             {list.map((court) => {
               const tier = tierFor(court.avg_busy_score_7d);
               const isExpanded = expanded.includes(court.id); // Check if current card is expanded
               const isFavorite = fav.includes(court.id); // Check if favorite
   
               return (
                 <Card key={court.id} className="border rounded-lg shadow-sm overflow-hidden"> {/* Added overflow-hidden */}
                   {/* header */}
                   <div className="flex justify-between items-start p-3 bg-muted/40 border-b"> {/* Use muted background, add border */}
                     <div className="flex-1 mr-2"> {/* Allow text to take space */}
                       <h3 className="font-semibold leading-tight">{court.title}</h3>
                       <Badge
                         variant="outline"
                         className={`${tier.color} h-auto mt-1 text-[11px] leading-tight py-0.5 px-1.5 whitespace-normal`} // Allow wrap
                       >
                         {tier.text}
                       </Badge>
                     </div>
                     <Button
                       variant="ghost"
                       size="icon" // Make it compact
                       className="flex-shrink-0" // Prevent shrinking
                       onClick={() => toggleFav(court.id)}
                       aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"} // Accessibility
                      >
                       <Star
                         size={18}
                         className={isFavorite ? "text-primary fill-primary" : "text-muted-foreground"} // Use theme colors for star
                       />
                     </Button>
                   </div>
   
                   {/* body */}
                   <CardContent className="space-y-3 p-3">
                     {/* amenities • single wrapping line */}
                     <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"> {/* Use muted text */}
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
                       {/* Add a placeholder if no amenities */}
                       {!court.lights && !court.pickleball_lined && !court.hitting_wall && !court.ball_machine && (
                         <div className="italic text-muted-foreground/80">No specific amenities listed</div>
                       )}
                     </div>
   
                     {/* availability */}
                     <div className="grid grid-cols-4 xs:grid-cols-6 sm:grid-cols- LATER PLEASE FIX ME */}
                       {TIME.map((t) => (
                         <div
                           key={t}
                           className={`text-center py-1 rounded text-[10px] sm:text-xs ${slotClr(court, t)}`} // Smaller text on mobile
                           title={`${t} Availability`} // Tooltip for clarity
                         >
                           {t.replace(":00 ", "")} {/* More robust replacement */}
                         </div>
                       ))}
                     </div>
   
                     {/* location - Conditionally render button only if needed */}
                     {(court.address || court.Maps_url) && (
                       <Button
                         variant="outline" // CHANGE: Use outline variant
                         size="sm"
                         className="w-full flex items-center justify-center gap-1.5" // Keep centering and gap
                         onClick={() => setExpanded((e) =>
                           e.includes(court.id) ? e.filter((x) => x !== court.id) : [...e, court.id]
                         )}
                         aria-expanded={isExpanded} // Accessibility
                       >
                         <MapPin size={14} />
                         {isExpanded ? "Hide Location" : "Show Location"}
                       </Button>
                     )}
   
                     {/* Expanded Location Info */}
                     {isExpanded && (
                       <div className="mt-2 p-3 border rounded bg-muted/20 space-y-2"> {/* Styled container */}
                         <p className="text-sm text-foreground"> {/* Use theme text color */}
                           {court.address ?? <span className="italic text-muted-foreground">Address not available</span>}
                         </p>
                         {/* Only show Maps button if URL exists */}
                         {mapsUrl(court) && (
                              <Button
                               variant="outline" // CHANGE: Use outline variant
                               size="sm"
                               className="w-full"
                               onClick={() => window.open(mapsUrl(court), "_blank", "noopener noreferrer")} // Security best practice
                              >
                               Open in Google Maps
                              </Button>
                         )}
                       </div>
                     )}
   
                     {/* ball machine rental button */}
                     {court.ball_machine && (
                       <Button
                         variant="default" // Keep default variant for primary action
                         size="sm"
                         className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" // Specific styling if needed, or use theme colors
                         onClick={() => window.open("https://seattleballmachine.com", "_blank", "noopener noreferrer")}
                       >
                         {/* Using an inline SVG or a different icon might be better than repeating the Image */}
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z"/></svg> {/* Example tennis ball icon */}
                         Ball Machine Rental
                       </Button>
                     )}
                   </CardContent>
                 </Card>
               );
             })}
           </div>
         )}
       </div>
     );
   }