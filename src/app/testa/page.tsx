"use client";

import { useState } from "react";
import { mockCourtData } from "@/components/test/courtTestData";

export default function TestAPage() {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Split hours into morning (6 AM - 2 PM) and evening (3 PM - 10 PM)
  const morningHours = mockCourtData.hours.filter((h) => h.hour >= 6 && h.hour <= 14);
  const eveningHours = mockCourtData.hours.filter((h) => h.hour >= 15 && h.hour <= 22);

  const selectedSlot = mockCourtData.hours.find((h) => h.hour === selectedHour);

  return (
    <section className="mx-auto max-w-sm px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          View A: Micro-Timeline
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">
          {mockCourtData.courtName}
        </h1>
        <p className="text-sm text-gray-600">{mockCourtData.date}</p>
      </div>

      {/* Timeline Container */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {/* Morning Row */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>6 AM</span>
            <span>2 PM</span>
          </div>
          <div className="flex gap-1">
            {morningHours.map((slot) => (
              <button
                key={slot.hour}
                onClick={() => setSelectedHour(slot.hour)}
                className={`
                  h-4 flex-1 rounded-sm transition-all
                  ${slot.isAvailable ? "bg-emerald-500" : "bg-gray-200"}
                  ${selectedHour === slot.hour ? "ring-2 ring-emerald-600 ring-offset-1" : ""}
                `}
                aria-label={`${slot.time} - ${slot.isAvailable ? "Available" : "Booked"}`}
              />
            ))}
          </div>
        </div>

        {/* Evening Row */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>3 PM</span>
            <span>10 PM</span>
          </div>
          <div className="flex gap-1">
            {eveningHours.map((slot) => (
              <button
                key={slot.hour}
                onClick={() => setSelectedHour(slot.hour)}
                className={`
                  h-4 flex-1 rounded-sm transition-all
                  ${slot.isAvailable ? "bg-emerald-500" : "bg-gray-200"}
                  ${selectedHour === slot.hour ? "ring-2 ring-emerald-600 ring-offset-1" : ""}
                `}
                aria-label={`${slot.time} - ${slot.isAvailable ? "Available" : "Booked"}`}
              />
            ))}
          </div>
        </div>

        {/* Selected Time Display */}
        {selectedSlot && (
          <div className="mt-4 rounded-md bg-gray-50 p-3 text-center">
            <p className="text-sm font-medium text-gray-900">
              {selectedSlot.time}
            </p>
            <p
              className={`text-xs font-semibold ${
                selectedSlot.isAvailable ? "text-emerald-600" : "text-gray-500"
              }`}
            >
              {selectedSlot.isAvailable ? "Available" : "Booked"}
            </p>
          </div>
        )}

        {/* Tap hint */}
        {!selectedSlot && (
          <p className="mt-4 text-center text-xs text-gray-400">
            Tap a slot to see details
          </p>
        )}
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
