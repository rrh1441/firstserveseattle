"use client";

import { useState, useEffect } from "react";
import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";

const TIME_SLOTS = [
  { time: "4:00 PM", hour: 16, label: "4 PM" },
  { time: "5:00 PM", hour: 17, label: "5 PM" },
  { time: "6:00 PM", hour: 18, label: "6 PM" },
  { time: "7:00 PM", hour: 19, label: "7 PM" },
  { time: "8:00 PM", hour: 20, label: "8 PM" },
  { time: "9:00 PM", hour: 21, label: "9 PM" },
  { time: "10:00 PM", hour: 22, label: "10 PM" },
];

// Convert time string to minutes for comparison
const toMin = (t: string) => {
  const [clock, ap] = t.toUpperCase().split(" ");
  const [h, m] = clock.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
};

// Check if a slot is available for a court
const isSlotAvailable = (court: TennisCourt, timeStr: string): boolean => {
  const slotStart = toMin(timeStr);
  const slotEnd = slotStart + 60; // 1 hour slot

  return court.parsed_intervals.some(({ start, end }) => {
    const intervalStart = toMin(start);
    const intervalEnd = toMin(end);
    return intervalStart <= slotStart && intervalEnd >= slotEnd;
  });
};

export default function TestBPage() {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{
    courtId: number;
    courtName: string;
    hour: number;
    time: string;
    available: boolean;
  } | null>(null);

  useEffect(() => {
    getTennisCourts()
      .then((data) => {
        // Take first 6 courts as subset for testing
        setCourts(data.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  if (loading) {
    return (
      <section className="mx-auto max-w-sm px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          View B: Capacity Bar
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">{today}</h1>
        <p className="text-sm text-gray-600">
          {courts.length} courts &middot; Evening hours
        </p>
      </div>

      {/* Capacity Bars */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          {TIME_SLOTS.map((slot) => {
            const availableCount = courts.filter((c) =>
              isSlotAvailable(c, slot.time)
            ).length;

            return (
              <div key={slot.hour} className="flex items-center gap-3">
                {/* Time Label */}
                <span className="w-12 text-sm font-medium text-gray-700">
                  {slot.label}
                </span>

                {/* Capacity Bar - each segment is one court */}
                <div className="flex flex-1 gap-0.5">
                  {courts.map((court, idx) => {
                    const available = isSlotAvailable(court, slot.time);
                    const isSelected =
                      selectedCell?.courtId === court.id &&
                      selectedCell?.hour === slot.hour;

                    return (
                      <button
                        key={court.id}
                        onClick={() =>
                          setSelectedCell({
                            courtId: court.id,
                            courtName: court.title,
                            hour: slot.hour,
                            time: slot.time,
                            available,
                          })
                        }
                        className={`
                          h-6 flex-1 transition-all
                          ${idx === 0 ? "rounded-l" : ""}
                          ${idx === courts.length - 1 ? "rounded-r" : ""}
                          ${available ? "bg-emerald-500" : "bg-gray-200"}
                          ${isSelected ? "ring-2 ring-emerald-600 ring-offset-1 z-10" : ""}
                        `}
                        aria-label={`${court.title} at ${slot.time} - ${available ? "Available" : "Booked"}`}
                      />
                    );
                  })}
                </div>

                {/* Available Count */}
                <span className="w-10 text-right text-xs text-gray-500">
                  {availableCount}/{courts.length}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Cell Display */}
        {selectedCell && (
          <div className="mt-4 rounded-md bg-gray-50 p-3 text-center">
            <p className="text-sm font-medium text-gray-900">
              {selectedCell.courtName}
            </p>
            <p className="text-xs text-gray-600">{selectedCell.time}</p>
            <p
              className={`mt-1 text-xs font-semibold ${
                selectedCell.available ? "text-emerald-600" : "text-gray-500"
              }`}
            >
              {selectedCell.available ? "Available" : "Booked"}
            </p>
          </div>
        )}

        {!selectedCell && (
          <p className="mt-4 text-center text-xs text-gray-400">
            Tap a segment to see court details
          </p>
        )}
      </div>

      {/* Court Names Legend */}
      <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
        <p className="mb-2 text-xs font-medium text-gray-500">Courts (left to right):</p>
        <div className="flex flex-wrap gap-1">
          {courts.map((court, idx) => (
            <span
              key={court.id}
              className="rounded bg-white px-1.5 py-0.5 text-xs text-gray-600 border border-gray-200"
            >
              {idx + 1}. {court.title.replace(/ - Court \d+$/, "").slice(0, 15)}
              {court.title.replace(/ - Court \d+$/, "").length > 15 ? "..." : ""}
            </span>
          ))}
        </div>
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
