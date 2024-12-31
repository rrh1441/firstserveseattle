"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { getTennisCourts } from "@/lib/getTennisCourts"

// Helper to convert time strings to minutes for range checks
function timeToMinutes(str: string): number {
  if (!str) return -1
  const [time, ampm] = str.toUpperCase().split(" ")
  if (!time || !ampm) return -1

  const [hhStr, mmStr] = time.split(":")
  let hh = parseInt(hhStr, 10) || 0
  let mm = parseInt(mmStr, 10) || 0
  if (ampm === "PM" && hh < 12) hh += 12
  if (ampm === "AM" && hh === 12) hh = 0
  return hh * 60 + mm
}

// Component
export default function TennisCourtList() {
  const [courts, setCourts] = useState<any[]>([])
  const [favoriteCourts, setFavoriteCourts] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const timesInOneHour = [
    "6:00 AM",
    "7:00 AM",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
    "10:00 PM",
  ]

  useEffect(() => {
    getTennisCourts().then((data) => {
      console.log("[TennisCourtList] Fetched courts:", data)
      setCourts(data)
    })
  }, [])

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favoriteCourts")
    if (storedFavorites) {
      setFavoriteCourts(JSON.parse(storedFavorites))
    }
  }, [])

  const toggleFavorite = (courtId: number) => {
    const updated = favoriteCourts.includes(courtId)
      ? favoriteCourts.filter((id) => id !== courtId)
      : [...favoriteCourts, courtId]
    setFavoriteCourts(updated)
    localStorage.setItem("favoriteCourts", JSON.stringify(updated))
  }

  const filtered = courts.filter((court) =>
    court.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  )

  function isAvailableAtTime(court: any, timeSlot: string): boolean {
    if (!Array.isArray(court.parsed_intervals)) return false
    const timeMinutes = timeToMinutes(timeSlot)
    return court.parsed_intervals.some((interval: any) => {
      const startM = timeToMinutes(interval.start)
      const endM = timeToMinutes(interval.end)
      return timeMinutes >= startM && timeMinutes < endM
    })
  }

  return (
    <div className="bg-white text-black min-h-screen p-4 space-y-6 mt-6">
      {/* Search bar */}
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Search courts by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 p-2 rounded-md w-full max-w-md"
        />
      </div>

      {sorted.map((court) => (
        <Card key={court.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="text-lg">{court.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(court.id)}
                aria-label={
                  favoriteCourts.includes(court.id)
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                <Star
                  className={
                    favoriteCourts.includes(court.id)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }
                />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {timesInOneHour.map((timeSlot, index) => {
                const available = isAvailableAtTime(court, timeSlot)
                return (
                  <Badge
                    key={index}
                    className={`text-center py-2 md:py-1 cursor-default transition-none ${
                      available
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {timeSlot}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
