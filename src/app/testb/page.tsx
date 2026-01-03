"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { MapPin, ExternalLink, Search, X } from "lucide-react";
import {
  getFacilitiesWithCoords,
  getAvailabilityColor,
  FacilityWithCoords,
} from "@/lib/getFacilitiesWithCoords";
import { MicroTimeline } from "@/components/MicroTimeline";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Seattle center coordinates
const SEATTLE_CENTER = {
  latitude: 47.6062,
  longitude: -122.3321,
  zoom: 11.5,
};

// Neighborhood mappings for search
const NEIGHBORHOOD_KEYWORDS: Record<string, string[]> = {
  "ballard": ["Soundview"],
  "beacon hill": ["Beacon Hill", "Jefferson Park", "AYTC", "Dearborn"],
  "capitol hill": ["Volunteer Park", "Miller"],
  "central district": ["Garfield", "Madrona"],
  "fremont": ["Gilman", "Wallingford", "Rogers"],
  "green lake": ["Green Lake", "Lower Woodland", "Upper Woodland"],
  "magnolia": ["Magnolia Park", "Magnolia Playfield", "Discovery"],
  "queen anne": ["Gilman", "Rogers"],
  "rainier valley": ["Rainier Playfield", "Rainier Beach", "Brighton", "Seward"],
  "south seattle": ["Rainier", "Brighton", "Seward", "Dearborn"],
  "university district": ["Ravenna", "Bryant", "Laurelhurst"],
  "wallingford": ["Wallingford", "Meridian"],
  "west seattle": ["Alki", "Hiawatha", "Delridge", "Walt Hundley", "Riverview", "Solstice"],
};

function facilityMatchesSearch(facility: FacilityWithCoords, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;

  const search = searchTerm.toLowerCase();

  // Match by facility name
  if (facility.name.toLowerCase().includes(search)) return true;

  // Match by address
  if (facility.address?.toLowerCase().includes(search)) return true;

  // Match by neighborhood
  for (const [neighborhood, keywords] of Object.entries(NEIGHBORHOOD_KEYWORDS)) {
    if (neighborhood.includes(search)) {
      if (keywords.some(kw => facility.name.includes(kw))) return true;
    }
  }

  return false;
}

export default function MapViewPage() {
  const [facilities, setFacilities] = useState<FacilityWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithCoords | null>(null);
  const [viewState, setViewState] = useState(SEATTLE_CENTER);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getFacilitiesWithCoords()
      .then(setFacilities)
      .finally(() => setLoading(false));
  }, []);

  // Filter facilities based on search
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => facilityMatchesSearch(f, search));
  }, [facilities, search]);

  const handleMarkerClick = useCallback((facility: FacilityWithCoords) => {
    setSelectedFacility(facility);
    // Center map on selected facility
    setViewState((prev) => ({
      ...prev,
      latitude: facility.lat,
      longitude: facility.lon,
      zoom: 14,
    }));
  }, []);

  const mapsUrl = (facility: FacilityWithCoords) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      facility.address ?? facility.name
    )}`;

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Mapbox Token Missing
          </h1>
          <p className="text-gray-600">
            Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to your{" "}
            <code className="bg-gray-100 px-1 rounded">.env.local</code> file.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading courts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={() => setSelectedFacility(null)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {/* Facility markers */}
        {filteredFacilities.map((facility) => (
          <Marker
            key={facility.name}
            latitude={facility.lat}
            longitude={facility.lon}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(facility);
            }}
          >
            <div
              className="cursor-pointer transition-transform hover:scale-110"
              title={facility.name}
            >
              {/* Marker with availability indicator */}
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                  style={{ backgroundColor: getAvailabilityColor(facility) }}
                >
                  <span className="text-[10px] font-bold text-white">
                    {facility.availableCount}/{facility.totalCount}
                  </span>
                </div>
                {/* Pointer triangle */}
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `6px solid ${getAvailabilityColor(facility)}`,
                  }}
                />
              </div>
            </div>
          </Marker>
        ))}

        {/* Popup for selected facility */}
        {selectedFacility && (
          <Popup
            latitude={selectedFacility.lat}
            longitude={selectedFacility.lon}
            anchor="bottom"
            offset={25}
            closeOnClick={false}
            onClose={() => setSelectedFacility(null)}
            maxWidth="320px"
            className="facility-popup"
          >
            <div className="max-h-[45vh] overflow-y-auto">
              {/* Header with close button */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">
                    {selectedFacility.name}
                  </h3>
                  {selectedFacility.address && (
                    <a
                      href={mapsUrl(selectedFacility)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 mt-0.5"
                    >
                      <MapPin size={10} />
                      <span className="truncate max-w-[180px]">
                        {selectedFacility.address}
                      </span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setSelectedFacility(null)}
                  className="p-1 -mr-1 -mt-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Availability summary */}
              <div className="flex items-center gap-2 mb-3 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getAvailabilityColor(selectedFacility) }}
                />
                <span className="text-gray-600">
                  {selectedFacility.availableCount} of {selectedFacility.totalCount} courts available
                </span>
              </div>

              {/* Court timelines */}
              <div className="space-y-3">
                {selectedFacility.courts.map((court) => (
                  <div key={court.id} className="border-t pt-2 first:border-t-0 first:pt-0">
                    <MicroTimeline
                      court={court}
                      compact={true}
                      showLabel={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>Booked</span>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-80">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search courts or neighborhoods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border-0 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {/* Result count */}
          <div className="px-3 py-1.5 border-t text-xs text-gray-500">
            {filteredFacilities.length} of {facilities.length} facilities
            {search && ` matching "${search}"`}
          </div>
        </div>
      </div>
    </div>
  );
}
