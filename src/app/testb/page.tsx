"use client";

import { useState, useEffect, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { MapPin, ExternalLink } from "lucide-react";
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

export default function MapViewPage() {
  const [facilities, setFacilities] = useState<FacilityWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithCoords | null>(null);
  const [viewState, setViewState] = useState(SEATTLE_CENTER);

  useEffect(() => {
    getFacilitiesWithCoords()
      .then(setFacilities)
      .finally(() => setLoading(false));
  }, []);

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
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {/* Facility markers */}
        {facilities.map((facility) => (
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
            maxWidth="340px"
          >
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3 pr-4">
                <div>
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
                      <span className="truncate max-w-[200px]">
                        {selectedFacility.address}
                      </span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
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

      {/* Facility count */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
        <span className="text-sm font-medium text-gray-700">
          {facilities.length} facilities
        </span>
      </div>
    </div>
  );
}
