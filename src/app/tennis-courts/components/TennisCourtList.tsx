'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star } from 'lucide-react'
import { getTennisCourts } from "@/lib/getTennisCourts"

interface CourtAvailability {
  time: string
  availableCourts: number[]
}

interface CourtData {
  id: number
  title: string
  address: string
  facility_type: string
  available_dates: {
    availability: CourtAvailability[]
    totalCourts: number
  }
  last_updated: string
}

export default function TennisCourtList() {
  const [courts, setCourts] = useState<CourtData[]>([])
  const [selectedCourt, setSelectedCourt] = useState<CourtData | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [favoriteCourts, setFavoriteCourts] = useState<number[]>([])

  useEffect(() => {
    async function fetchData() {
      const data = await getTennisCourts()
      setCourts(data)
    }
    fetchData()
  }, [])

  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteCourts')
    if (storedFavorites) {
      setFavoriteCourts(JSON.parse(storedFavorites))
    }
  }, [])

  const toggleFavorite = (courtId: number) => {
    const newFavorites = favoriteCourts.includes(courtId)
      ? favoriteCourts.filter(id => id !== courtId)
      : [...favoriteCourts, courtId]
    setFavoriteCourts(newFavorites)
    localStorage.setItem('favoriteCourts', JSON.stringify(newFavorites))
  }

  // Sort so that favorited courts appear first
  const sortedCourts = [...courts].sort((a, b) => {
    const aFavorite = favoriteCourts.includes(a.id)
    const bFavorite = favoriteCourts.includes(b.id)
    if (aFavorite === bFavorite) return 0
    return aFavorite ? -1 : 1
  })

  return (
    <div className="space-y-6 mt-6">
      {sortedCourts.map((court) => {
        // Safely destructure availability
        const { availability = [], totalCourts = 0 } = court.available_dates || {}

        return (
          <Card key={court.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="text-lg">{court.title}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-fit">
                    {totalCourts} Courts
                  </Badge>
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
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availability.map((slot, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <Badge
                        variant={
                          slot.availableCourts.length > 0
                            ? "default"
                            : "secondary"
                        }
                        className={`text-center py-2 md:py-1 cursor-pointer transition-colors
                          ${
                            slot.availableCourts.length > 0
                              ? "bg-green-500 hover:bg-green-600"
                              : "hover:bg-secondary-foreground hover:text-secondary"
                          }`}
                        onClick={() => {
                          setSelectedCourt(court)
                          setSelectedTime(slot.time)
                        }}
                      >
                        {slot.time}
                      </Badge>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-lg">
                          {court.title} - {slot.time}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        {slot.availableCourts.length > 0 ? (
                          <>
                            <p className="text-sm md:text-base">
                              Available Courts:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                              {slot.availableCourts.map(
                                (courtNumber) => (
                                  <Badge
                                    key={courtNumber}
                                    variant="outline"
                                    className="py-2 md:py-1"
                                  >
                                    Court {courtNumber}
                                  </Badge>
                                )
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm md:text-base">
                            No courts available at this time.
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

