"use client";

import { useState } from "react";

export function SavingsCalculator() {
  const [playsPerMonth, setPlaysPerMonth] = useState(4);

  const RESERVATION_COST = 24;
  const MEMBERSHIP_COST = 8;

  const costWithoutMembership = playsPerMonth * RESERVATION_COST;
  const savings = costWithoutMembership - MEMBERSHIP_COST;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Savings Calculator
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            See how much you could save each month
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label
              htmlFor="plays-slider"
              className="text-sm font-semibold text-gray-700"
            >
              Times you play per month
            </label>
            <span className="text-2xl font-bold text-emerald-600">
              {playsPerMonth}
            </span>
          </div>

          <input
            id="plays-slider"
            type="range"
            min="1"
            max="20"
            value={playsPerMonth}
            onChange={(e) => setPlaysPerMonth(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
          />

          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Reservations cost</span>
            <span className="text-gray-900 font-semibold">
              {playsPerMonth} × ${RESERVATION_COST} = ${costWithoutMembership}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">First Serve membership</span>
            <span className="text-gray-900 font-semibold">${MEMBERSHIP_COST}/mo</span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">
                Your monthly savings
              </span>
              <span className="text-2xl font-bold text-emerald-600">
                ${savings}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 font-medium">
          Based on $24 for a 90-minute reservation at Seattle Parks courts
        </p>
      </div>
    </div>
  );
}
