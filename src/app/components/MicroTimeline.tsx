"use client";

import { useState } from "react";
import { TennisCourt } from "@/lib/getTennisCourts";

// Time slots: 8 morning (6am-1pm) + 8 afternoon (2pm-9pm)
export const TIME_SLOTS = [
  // Morning row
  { time: "6:00 AM", label: "6a" },
  { time: "7:00 AM", label: "7" },
  { time: "8:00 AM", label: "8" },
  { time: "9:00 AM", label: "9" },
  { time: "10:00 AM", label: "10" },
  { time: "11:00 AM", label: "11" },
  { time: "12:00 PM", label: "12p" },
  { time: "1:00 PM", label: "1" },
  // Afternoon row
  { time: "2:00 PM", label: "2" },
  { time: "3:00 PM", label: "3" },
  { time: "4:00 PM", label: "4" },
  { time: "5:00 PM", label: "5" },
  { time: "6:00 PM", label: "6" },
  { time: "7:00 PM", label: "7" },
  { time: "8:00 PM", label: "8" },
  { time: "9:00 PM", label: "9" },
];

export type SlotStatus = "full" | "first_half" | "second_half" | "none";

// Convert time string to minutes since midnight
export function toMin(t: string): number {
  const [clock, ap] = t.toUpperCase().split(" ");
  const [h, m] = clock.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
}

// Get slot availability status
export function getSlotStatus(court: TennisCourt, timeStr: string): SlotStatus {
  const slotStart = toMin(timeStr);
  const mid = slotStart + 30;

  const isFree = (start: number, end: number) =>
    court.parsed_intervals.some(({ start: s, end: e }) => {
      const intervalStart = toMin(s);
      const intervalEnd = toMin(e);
      return intervalStart <= start && intervalEnd >= end;
    });

  const firstHalfFree = isFree(slotStart, mid);
  const secondHalfFree = isFree(mid, mid + 30);

  if (firstHalfFree && secondHalfFree) return "full";
  if (firstHalfFree) return "first_half";
  if (secondHalfFree) return "second_half";
  return "none";
}

// Get color class for slot status
export function getSlotColor(status: SlotStatus): string {
  switch (status) {
    case "full":
      return "bg-emerald-500 text-white";
    case "first_half":
    case "second_half":
      return "bg-orange-400 text-white";
    case "none":
      return "bg-gray-100 text-gray-400";
  }
}

// Get description for slot status
export function getSlotDescription(timeStr: string, status: SlotStatus): string {
  const hour = parseInt(timeStr.split(":")[0]);
  const isPM = timeStr.includes("PM");
  const hour12 = hour;
  const nextHour = hour === 12 ? 1 : hour + 1;
  const nextPM = hour === 11 ? !isPM : isPM;

  const formatTime = (h: number, min: number, pm: boolean) =>
    `${h}:${min.toString().padStart(2, "0")} ${pm ? "PM" : "AM"}`;

  switch (status) {
    case "full":
      return `${formatTime(hour12, 0, isPM)} - ${formatTime(nextHour, 0, nextPM)}`;
    case "first_half":
      return `${formatTime(hour12, 0, isPM)} - ${formatTime(hour12, 30, isPM)}`;
    case "second_half":
      return `${formatTime(hour12, 30, isPM)} - ${formatTime(nextHour, 0, nextPM)}`;
    case "none":
      return "Fully Reserved";
  }
}

export interface SlotInfo {
  time: string;
  status: SlotStatus;
  description: string;
}

interface MicroTimelineProps {
  court: TennisCourt;
  compact?: boolean;
  onSlotSelect?: (info: SlotInfo) => void;
  selectedTime?: string | null;
  showLabel?: boolean;
}

export function MicroTimeline({
  court,
  compact = false,
  onSlotSelect,
  selectedTime = null,
  showLabel = true,
}: MicroTimelineProps) {
  const [localSelectedTime, setLocalSelectedTime] = useState<string | null>(null);

  // Use controlled or uncontrolled mode
  const activeTime = selectedTime !== undefined ? selectedTime : localSelectedTime;

  const handleSlotClick = (slot: { time: string; label: string }) => {
    const status = getSlotStatus(court, slot.time);
    const description = getSlotDescription(slot.time, status);

    if (selectedTime === undefined) {
      setLocalSelectedTime(slot.time);
    }

    onSlotSelect?.({ time: slot.time, status, description });
  };

  const renderSlot = (slot: { time: string; label: string }) => {
    const status = getSlotStatus(court, slot.time);
    const isSelected = activeTime === slot.time;

    return (
      <button
        key={slot.time}
        onClick={() => handleSlotClick(slot)}
        className={`
          flex-1 flex items-center justify-center
          ${compact ? "h-6 text-[10px]" : "h-7 text-[11px]"}
          font-semibold rounded-md transition-all
          ${getSlotColor(status)}
          ${isSelected ? "ring-2 ring-offset-1 ring-gray-800" : ""}
        `}
      >
        {slot.label}
      </button>
    );
  };

  const selectedStatus = activeTime ? getSlotStatus(court, activeTime) : null;
  const selectedDescription = activeTime && selectedStatus
    ? getSlotDescription(activeTime, selectedStatus)
    : null;

  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      {showLabel && (
        <div className="text-xs text-gray-500 truncate mb-1">
          {court.title}
        </div>
      )}

      {/* Morning row: 6am - 1pm */}
      <div className="flex gap-0.5">
        {TIME_SLOTS.slice(0, 8).map(renderSlot)}
      </div>

      {/* Afternoon row: 2pm - 9pm */}
      <div className="flex gap-0.5">
        {TIME_SLOTS.slice(8).map(renderSlot)}
      </div>

      {/* Selected time info */}
      {activeTime && selectedStatus && !compact && (
        <div
          className={`
            mt-2 px-3 py-2 rounded-lg text-center text-sm font-medium
            ${selectedStatus !== "none"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-600"
            }
          `}
        >
          {selectedStatus !== "none"
            ? `Available ${selectedDescription}`
            : selectedDescription}
        </div>
      )}
    </div>
  );
}

export default MicroTimeline;
