"use client";

import { useState, useEffect } from "react";
import { getTennisCourts, TennisCourt } from "@/lib/getTennisCourts";

const TIME_SLOTS = [
  { time: "6:00 AM", hour: 6 },
  { time: "7:00 AM", hour: 7 },
  { time: "8:00 AM", hour: 8 },
  { time: "9:00 AM", hour: 9 },
  { time: "10:00 AM", hour: 10 },
  { time: "11:00 AM", hour: 11 },
  { time: "12:00 PM", hour: 12 },
  { time: "1:00 PM", hour: 13 },
  { time: "2:00 PM", hour: 14 },
  { time: "3:00 PM", hour: 15 },
  { time: "4:00 PM", hour: 16 },
  { time: "5:00 PM", hour: 17 },
  { time: "6:00 PM", hour: 18 },
  { time: "7:00 PM", hour: 19 },
  { time: "8:00 PM", hour: 20 },
  { time: "9:00 PM", hour: 21 },
  { time: "10:00 PM", hour: 22 },
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
    // Slot is available if the interval covers the entire slot
    return intervalStart <= slotStart && intervalEnd >= slotEnd;
  });
};

export default function TestAPage() {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{
    courtId: number;
    hour: number;
    time: string;
    available: boolean;
  } | null>(null);

  useEffect(() => {
    getTennisCourts()
      .then((data) => {
        // Sort alphabetically by title
        setCourts(data.sort((a, b) => a.title.localeCompare(b.title)));
      })
      .finally(() => setLoading(false));
  }, []);

  const morningSlots = TIME_SLOTS.filter((s) => s.hour >= 6 && s.hour <= 14);
  const eveningSlots = TIME_SLOTS.filter((s) => s.hour >= 15 && s.hour <= 22);

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
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{today}</h1>
        <p className="text-sm text-gray-600">
          {courts.length} courts
        </p>
      </div>

      {/* Courts */}
      <div className="space-y-4">
        {courts.map((court) => (
          <div
            key={court.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              {court.title}
            </h2>

            {/* Morning Row */}
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>6 AM</span>
                <span>2 PM</span>
              </div>
              <div className="flex gap-0.5">
                {morningSlots.map((slot) => {
                  const available = isSlotAvailable(court, slot.time);
                  const isSelected =
                    selectedSlot?.courtId === court.id &&
                    selectedSlot?.hour === slot.hour;

                  return (
                    <button
                      key={slot.hour}
                      onClick={() =>
                        setSelectedSlot({
                          courtId: court.id,
                          hour: slot.hour,
                          time: slot.time,
                          available,
                        })
                      }
                      className={`
                        h-4 flex-1 rounded-sm transition-all
                        ${available ? "bg-emerald-500" : "bg-gray-200"}
                        ${isSelected ? "ring-2 ring-emerald-600 ring-offset-1" : ""}
                      `}
                      aria-label={`${slot.time} - ${available ? "Available" : "Booked"}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Evening Row */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>3 PM</span>
                <span>10 PM</span>
              </div>
              <div className="flex gap-0.5">
                {eveningSlots.map((slot) => {
                  const available = isSlotAvailable(court, slot.time);
                  const isSelected =
                    selectedSlot?.courtId === court.id &&
                    selectedSlot?.hour === slot.hour;

                  return (
                    <button
                      key={slot.hour}
                      onClick={() =>
                        setSelectedSlot({
                          courtId: court.id,
                          hour: slot.hour,
                          time: slot.time,
                          available,
                        })
                      }
                      className={`
                        h-4 flex-1 rounded-sm transition-all
                        ${available ? "bg-emerald-500" : "bg-gray-200"}
                        ${isSelected ? "ring-2 ring-emerald-600 ring-offset-1" : ""}
                      `}
                      aria-label={`${slot.time} - ${available ? "Available" : "Booked"}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Selected Time Display */}
            {selectedSlot?.courtId === court.id && (
              <div className="mt-3 rounded-md bg-gray-50 p-2 text-center">
                <p className="text-sm font-medium text-gray-900">
                  {selectedSlot.time}
                </p>
                <p
                  className={`text-xs font-semibold ${
                    selectedSlot.available ? "text-emerald-600" : "text-gray-500"
                  }`}
                >
                  {selectedSlot.available ? "Available" : "Booked"}
                </p>
              </div>
            )}
          </div>
        ))}
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
