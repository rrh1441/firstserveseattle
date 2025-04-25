/* ──────────────────────────────────────────────────────
   src/app/tennis-courts/components/TennisCourtList.tsx
   ──────────────────────────────────────────────────────*/
   "use client";

   import React, { useEffect, useMemo, useState } from "react";
   import dynamic from "next/dynamic";
   import Image from "next/image";
   import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";
   import { Card, CardContent } from "@/components/ui/card";
   import { Button } from "@/components/ui/button";
   import { Info, Star, MapPin, Footprints, Snowflake } from "lucide-react";
   
   const AboutUs = dynamic(() => import("./AboutUs"), { ssr: false });
   
   /* ───────── helper types ───────── */
   
   type AmenityKey =
     | "lights"
     | "hitting_wall"
     | "pickleball_lined"
     | "ball_machine";
   
   type PopFilter = "walk" | "low" | null;
   
   /* ───────── Google Maps URL ───────── */
   
   const mapsUrl = (c: TennisCourt) =>
     c.Maps_url?.startsWith("http")
       ? c.Maps_url
       : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
           c.address ?? c.title
         )}`;
   
   /* ───────── availability helpers ───────── */
   
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
   
   /* ───────── skeleton (brief) ───────── */
   
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
   
   /* ───────── main component ───────── */
   
   export default function TennisCourtList() {
     const [courts, setCourts] = useState<TennisCourt[]>([]);
     const [fav, setFav] = useState<number[]>([]);
     const [search, setSearch] = useState("");
     const [amenities, setAmenities] = useState<Record<AmenityKey, boolean>>({
       lights: false, hitting_wall: false, pickleball_lined: false, ball_machine: false,
     });
     const [popFilter, setPopFilter] = useState<PopFilter>(null);
     const [expanded, setExpanded] = useState<number[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError]   = useState<string | null>(null);
     const [about, setAbout]   = useState(false);
   
     /* fetch courts */
     useEffect(() => {
       getTennisCourts()
         .then(setCourts)
         .catch((e) => setError(e.message))
         .finally(() => setLoading(false));
     }, []);
   
     /* favorites */
     useEffect(() => {
       try {
         const raw = localStorage.getItem("favoriteCourts");
         if (raw) setFav(JSON.parse(raw));
       } catch {/* ignore */}
     }, []);
     const toggleFav = (id: number) =>
       setFav((prev) => {
         const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
         localStorage.setItem("favoriteCourts", JSON.stringify(next));
         return next;
       });
   
     /* median percentile for “less popular” */
     const median = useMemo(() => {
       const s = courts
         .map((c) => c.avg_busy_score_7d)
         .filter((x): x is number => x !== null && x > 0)
         .sort((a, b) => a - b);
       if (!s.length) return 0;
       return s[Math.floor(0.5 * s.length)];
     }, [courts]);
   
     /* filter + sort */
     const list = useMemo(() => {
       return courts
         .filter((c) =>
           search ? c.title.toLowerCase().includes(search.toLowerCase()) : true
         )
         .filter((c) =>
           (Object.keys(amenities) as AmenityKey[]).every((k) => !amenities[k] || c[k])
         )
         .filter((c) => {
           const score = c.avg_busy_score_7d;
           if (popFilter === null) return true;
           if (popFilter === "walk") return score === 0;
           /* popFilter === "low" */
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
   
     /* header helpers */
     const today = new Date().toLocaleDateString("en-US", {
       weekday: "long", month: "long", day: "numeric",
       timeZone: "America/Los_Angeles",
     });
     const amenityCfg: Record<AmenityKey, { label: string; icon: string }> = {
       lights: { label: "Lights", icon: "/icons/lighticon.png" },
       hitting_wall: { label: "Wall", icon: "/icons/wallicon.png" },
       pickleball_lined: { label: "Pickleball", icon: "/icons/pickleballicon.png" },
       ball_machine: { label: "Machine", icon: "/icons/ballmachine.png" },
     };
   
     /* render */
     if (loading) return <div className="p-4"><CardSkeleton /></div>;
     if (error)   return <div className="p-6 text-red-600">Error: {error}</div>;
   
     return (
       <div className="p-4 space-y-4">
         {about && <AboutUs isOpen={about} onClose={() => setAbout(false)} />}
   
         {/* ───────── header ───────── */}
         <div className="sticky top-0 z-10 bg-white border-b pb-3 pt-6 space-y-3">
           <div className="text-xl font-semibold">{today}</div>
   
           {/* search + info */}
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
               onClick={() => setAbout(true)}
             >
               <Info size={18} />
               <span className="hidden sm:inline">Info</span>
             </Button>
           </div>
   
           {/* unified filter grid: 4 amenities + 2 popularity */}
           <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
             {/* amenities */}
             {(Object.entries(amenityCfg) as [AmenityKey, { label: string; icon: string }][])
               .map(([k, { label, icon }]) => {
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
                     onClick={() => setAmenities((f) => ({ ...f, [k]: !f[k] }))}
                     aria-pressed={active}
                   >
                     <Image src={icon} alt="" width={14} height={14} />
                     {label}
                   </Button>
                 );
               })}
   
             {/* popularity: walk-on */}
             {(["walk", "Walk-on only", Footprints] as const) //
               && (["low",  "Less popular", Snowflake]   as const)}
             {([
               ["walk","Walk-on only",Footprints],
               ["low","Less popular",Snowflake],
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
                   onClick={() => setPopFilter(active ? null : (key as PopFilter))}
                   aria-pressed={active}
                 >
                   <Icon size={14} />
                   {label}
                 </Button>
               );
             })}
           </div>
         </div>
   
         {/* ───────── court list ───────── */}
         {list.length === 0 ? (
           <div>No courts found.</div>
         ) : (
           list.map((court) => (
             <Card key={court.id} className="border rounded-lg shadow-sm">
               {/* header */}
               <div className="flex justify-between items-start p-3 bg-gray-50">
                 <h3 className="font-semibold">{court.title}</h3>
                 <Button variant="ghost" onClick={() => toggleFav(court.id)}>
                   <Star
                     size={18}
                     fill={fav.includes(court.id) ? "currentColor" : "none"}
                   />
                 </Button>
               </div>
   
               {/* body */}
               <CardContent className="space-y-3 p-3">
                 {/* amenities line */}
                 <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
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
                   {TIME.map((t) => (
                     <div
                       key={t}
                       className={`text-center py-1 rounded text-xs ${slotClr(court, t)}`}
                     >
                       {t.replace(":00", "")}
                     </div>
                   ))}
                 </div>
   
                 {/* location toggle */}
                 {(court.address || court.Maps_url) && (
                   <Button
                     variant="outline"
                     size="sm"
                     className="w-full flex items-center justify-center gap-1.5"
                     onClick={() =>
                       setExpanded((e) =>
                         e.includes(court.id)
                           ? e.filter((x) => x !== court.id)
                           : [...e, court.id]
                       )
                     }
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
                       onClick={() => window.open(mapsUrl(court), "_blank")}
                     >
                       Open in Google Maps
                     </Button>
                   </div>
                 )}
   
                 {/* ball machine button */}
                 {court.ball_machine && (
                   <Button
                     size="sm"
                     className="w-full bg-blue-800 text-white hover:bg-blue-900 flex items-center justify-center gap-1.5"
                     onClick={() => window.open("https://seattleballmachine.com", "_blank")}
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
   