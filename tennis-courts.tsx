'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Search, MapPin, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

// Initialize Supabase client with your credentials
const supabaseUrl = 'https://mqoqdddzrwvonklsprgb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xb3FkZGR6cnd2b25rbHNwcmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2NjIyNDEsImV4cCI6MjA0ODIzODI0MX0.18AdLB9xAb8rN2-G9YIiyjoH-u7uaReXqbelkzZXGPI'
const supabase = createClient(supabaseUrl, supabaseKey)

const styles = {
  primaryBg: 'bg-[#6C935C]',
  primaryText: 'text-[#6C935C]',
  secondaryBg: 'bg-[#3C638E]',
  secondaryText: 'text-[#3C638E]',
  primaryHover: 'hover:bg-[#5A7C4D]',
}

export default function Component() {
  const [courts, setCourts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [openAutocomplete, setOpenAutocomplete] = useState(false)

  useEffect(() => {
    fetchCourts()
    // Optionally, track a user session here if you have a way to get the IP:
    // logUserSession('192.168.1.1')  // Replace with actual IP or logic.
  }, [])

  async function fetchCourts() {
    const { data, error } = await supabase
      .from('tennis_courts')
      .select('*')
    
    if (error) {
      console.error('Error fetching courts:', error)
    } else {
      setCourts(data)
    }
  }

  // Example function to log a user session (if desired)
  async function logUserSession(ipAddress) {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({ ip_address: ipAddress, views: 1 })
    if (error) {
      console.error('Error logging session:', error)
    } else {
      console.log('User session logged:', data)
    }
  }

  const filteredCourts = courts.filter(court => 
    court.title && court.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`container mx-auto p-4 space-y-6 ${inter.className}`}>
      <h1 className="text-3xl font-bold text-center mb-6 text-[#3C638E] font-inter">Open Court Seattle</h1>
      
      <div className="flex justify-center">
        <Popover open={openAutocomplete} onOpenChange={setOpenAutocomplete}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openAutocomplete}
              className={`w-[300px] justify-between border-[#3C638E] ${styles.secondaryText}`}
            >
              {selectedCourt ? selectedCourt.title : "Search courts"}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search courts" onValueChange={(search) => setSearchTerm(search)} />
              <CommandEmpty>No tennis courts found.</CommandEmpty>
              <CommandGroup>
                {filteredCourts.map((court) => (
                  <CommandItem
                    key={court.id}
                    onSelect={() => {
                      setSelectedCourt(court)
                      setOpenAutocomplete(false)
                    }}
                  >
                    {court.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedCourt && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{selectedCourt.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center text-sm text-muted-foreground mb-4">
              <MapPin className="mr-2 h-4 w-4" />
              {selectedCourt.address}
            </p>
            <h3 className="text-lg font-semibold mb-2">Available Times</h3>
            {selectedCourt.available_dates ? (
              <div className="grid grid-cols-6 gap-2">
                {selectedCourt.available_dates.split(',').map((timeSlot, index) => {
                  const trimmedTime = timeSlot.trim()
                  return (
                    <div
                      key={index}
                      className={`${styles.primaryBg} text-white p-2 text-center rounded`}
                    >
                      {trimmedTime}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No available times listed.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filteredCourts.map((court) => (
          <Card key={court.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCourt(court)}>
            <CardHeader className={styles.primaryBg}>
              <CardTitle className="text-white">{court.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`flex items-center text-sm ${styles.secondaryText} mt-2`}>
                <MapPin className="mr-2 h-4 w-4" />
                {court.address}
              </p>
              <p className={`flex items-center text-sm ${styles.secondaryText} mt-2`}>
                <Clock className="mr-2 h-4 w-4" />
                {court.available_dates ? court.available_dates.split(',').length : 0} time slots available
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
