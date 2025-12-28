"use client";

import { mockParkData } from "@/components/test/courtTestData";

export default function TestBPage() {
  return (
    <section className="mx-auto max-w-sm px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          View B: Capacity Bar
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">
          {mockParkData.parkName}
        </h1>
        <p className="text-sm text-gray-600">Today&apos;s Availability</p>
      </div>

      {/* Capacity Bars Container */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          {mockParkData.hours.map((hourData) => {
            const availabilityPercent =
              hourData.availableCourts / hourData.totalCourts;
            const showSaveBadge = availabilityPercent >= 0.5;

            return (
              <div key={hourData.hour} className="flex items-center gap-3">
                {/* Time Label */}
                <span className="w-12 text-sm font-medium text-gray-700">
                  {hourData.time}
                </span>

                {/* Capacity Bar */}
                <div className="flex flex-1 gap-0.5">
                  {Array.from({ length: hourData.totalCourts }).map((_, idx) => {
                    const isAvailable = idx < hourData.availableCourts;
                    return (
                      <div
                        key={idx}
                        className={`
                          h-6 flex-1 transition-colors
                          ${idx === 0 ? "rounded-l" : ""}
                          ${idx === hourData.totalCourts - 1 ? "rounded-r" : ""}
                          ${isAvailable ? "bg-emerald-500" : "bg-gray-200"}
                        `}
                      />
                    );
                  })}
                </div>

                {/* Available Count */}
                <span className="w-8 text-right text-xs text-gray-500">
                  {hourData.availableCourts}/{hourData.totalCourts}
                </span>

                {/* Save Badge */}
                {showSaveBadge && (
                  <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Save $24
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Value Prop */}
      <div className="mt-4 rounded-md bg-emerald-50 p-3 text-center">
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">Finding a free court</span> saves you
          $24 vs. renting
        </p>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          <span>Open</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-gray-200" />
          <span>Booked</span>
        </div>
      </div>
    </section>
  );
}
