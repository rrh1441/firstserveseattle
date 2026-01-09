import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFacilitiesWithCoords, getAvailabilityColor, FacilityWithCoords } from './getFacilitiesWithCoords'

// Mock getTennisCourts
vi.mock('./getTennisCourts', () => ({
  getTennisCourts: vi.fn(),
}))

import { getTennisCourts } from './getTennisCourts'

describe('getFacilitiesWithCoords', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractParkName (tested via integration)', () => {
    it('should consolidate Jefferson Park Lid courts', async () => {
      const mockCourts = [
        {
          id: 1,
          title: 'Jefferson Park Lid Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
        {
          id: 2,
          title: 'Jefferson Park Lid Court 2',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()
      const jeffersonPark = facilities.find(f => f.name.includes('Jefferson'))

      expect(jeffersonPark).toBeDefined()
      expect(jeffersonPark?.courts).toHaveLength(2)
    })

    it('should consolidate Volunteer Park courts', async () => {
      const mockCourts = [
        {
          id: 1,
          title: 'Volunteer Park Upper Court 1',
          facility_type: 'Tennis Court',
          address: '1247 15th Ave E',
          Maps_url: null,
          lights: false,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
        {
          id: 2,
          title: 'Volunteer Park Lower Court 1',
          facility_type: 'Tennis Court',
          address: '1247 15th Ave E',
          Maps_url: null,
          lights: false,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()
      const volunteerPark = facilities.find(f => f.name.includes('Volunteer'))

      expect(volunteerPark).toBeDefined()
      expect(volunteerPark?.courts).toHaveLength(2)
    })

    it('should handle standard court naming patterns', async () => {
      const mockCourts = [
        {
          id: 1,
          title: 'Green Lake Park West Tennis Court 1',
          facility_type: 'Tennis Court',
          address: '123 Green Lake Way',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()
      const greenLake = facilities.find(f => f.name.includes('Green Lake'))

      expect(greenLake).toBeDefined()
    })
  })

  describe('coordinate lookup', () => {
    it('should only include facilities with known coordinates', async () => {
      const mockCourts = [
        {
          id: 1,
          title: 'Jefferson Park Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
        {
          id: 2,
          title: 'Unknown Facility Court 1',
          facility_type: 'Tennis Court',
          address: '456 Unknown St',
          Maps_url: null,
          lights: false,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()

      // Jefferson Park has known coords, Unknown Facility does not
      const jeffersonPark = facilities.find(f => f.name.includes('Jefferson'))
      const unknownFacility = facilities.find(f => f.name.includes('Unknown'))

      expect(jeffersonPark).toBeDefined()
      expect(unknownFacility).toBeUndefined()
    })

    it('should have valid lat/lon for all returned facilities', async () => {
      const mockCourts = [
        {
          id: 1,
          title: 'Jefferson Park Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()

      for (const facility of facilities) {
        expect(facility.lat).toBeGreaterThan(47) // Seattle latitude range
        expect(facility.lat).toBeLessThan(48)
        expect(facility.lon).toBeLessThan(-122) // Seattle longitude range
        expect(facility.lon).toBeGreaterThan(-123)
      }
    })
  })

  describe('availability calculation', () => {
    it('should count courts with availability today', async () => {
      // Get today's date in the format the function expects
      const today = new Date().toISOString().slice(0, 10)

      const mockCourts = [
        {
          id: 1,
          title: 'Jefferson Park Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [
            { date: today, start: '9:00 AM', end: '11:00 AM' },
          ],
          avg_busy_score_7d: null,
        },
        {
          id: 2,
          title: 'Jefferson Park Court 2',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [], // No availability
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()
      const jeffersonPark = facilities.find(f => f.name.includes('Jefferson'))

      expect(jeffersonPark?.totalCount).toBe(2)
      expect(jeffersonPark?.availableCount).toBe(1) // Only court 1 has availability
    })

    it('should calculate available hours correctly', async () => {
      const today = new Date().toISOString().slice(0, 10)

      const mockCourts = [
        {
          id: 1,
          title: 'Jefferson Park Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [
            { date: today, start: '9:00 AM', end: '11:00 AM' }, // 2 hours
            { date: today, start: '2:00 PM', end: '4:00 PM' },  // 2 hours
          ],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()
      const jeffersonPark = facilities.find(f => f.name.includes('Jefferson'))

      // Should be 4 hours (2 + 2)
      expect(jeffersonPark?.availableHours).toBe(4)
    })

    it('should not count intervals shorter than 60 minutes', async () => {
      const today = new Date().toISOString().slice(0, 10)

      const mockCourts = [
        {
          id: 1,
          title: 'Jefferson Park Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [
            { date: today, start: '9:00 AM', end: '9:30 AM' }, // 30 min - too short
          ],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()
      const jeffersonPark = facilities.find(f => f.name.includes('Jefferson'))

      // 30-minute intervals should not count
      expect(jeffersonPark?.availableHours).toBe(0)
    })

    it('should clamp availability to display hours (7am-7pm)', async () => {
      const today = new Date().toISOString().slice(0, 10)

      const mockCourts = [
        {
          id: 1,
          title: 'Jefferson Park Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [
            { date: today, start: '6:00 AM', end: '8:00 AM' }, // Only 1 hour within 7am-7pm
          ],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()
      const jeffersonPark = facilities.find(f => f.name.includes('Jefferson'))

      // 6am-8am gets clamped to 7am-8am = 1 hour
      expect(jeffersonPark?.availableHours).toBe(1)
    })
  })

  describe('display names', () => {
    it('should use display names for known facilities', async () => {
      const mockCourts = [
        {
          id: 1,
          title: 'Jefferson Park Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()
      const jeffersonPark = facilities.find(f => f.name.includes('Jefferson'))

      expect(jeffersonPark?.name).toBe('Jefferson Park Courts')
    })
  })

  describe('sorting', () => {
    it('should return facilities sorted alphabetically by name', async () => {
      const mockCourts = [
        {
          id: 1,
          title: 'Volunteer Park Court 1',
          facility_type: 'Tennis Court',
          address: '1247 15th Ave E',
          Maps_url: null,
          lights: false,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
        {
          id: 2,
          title: 'Jefferson Park Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()

      // Should be alphabetically sorted
      for (let i = 1; i < facilities.length; i++) {
        expect(facilities[i - 1].name.localeCompare(facilities[i].name)).toBeLessThanOrEqual(0)
      }
    })

    it('should sort courts within each facility alphabetically', async () => {
      const mockCourts = [
        {
          id: 2,
          title: 'Jefferson Park Court 2',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
        {
          id: 1,
          title: 'Jefferson Park Court 1',
          facility_type: 'Tennis Court',
          address: '123 Test St',
          Maps_url: null,
          lights: true,
          hitting_wall: false,
          pickleball_lined: false,
          ball_machine: false,
          parsed_intervals: [],
          avg_busy_score_7d: null,
        },
      ]

      vi.mocked(getTennisCourts).mockResolvedValue(mockCourts)

      const facilities = await getFacilitiesWithCoords()
      const jeffersonPark = facilities.find(f => f.name.includes('Jefferson'))

      expect(jeffersonPark?.courts[0].title).toBe('Jefferson Park Court 1')
      expect(jeffersonPark?.courts[1].title).toBe('Jefferson Park Court 2')
    })
  })
})

describe('getAvailabilityColor', () => {
  it('should return green for >75% availability', () => {
    const facility: FacilityWithCoords = {
      name: 'Test Facility',
      address: '123 Test St',
      lat: 47.6,
      lon: -122.3,
      courts: [],
      availableCount: 1,
      totalCount: 1,
      availableHours: 10, // 10 out of 12 potential hours = 83%
    }

    expect(getAvailabilityColor(facility)).toBe('#10b981') // emerald-500
  })

  it('should return orange for 25-75% availability', () => {
    const facility: FacilityWithCoords = {
      name: 'Test Facility',
      address: '123 Test St',
      lat: 47.6,
      lon: -122.3,
      courts: [],
      availableCount: 1,
      totalCount: 1,
      availableHours: 6, // 6 out of 12 potential hours = 50%
    }

    expect(getAvailabilityColor(facility)).toBe('#f97316') // orange-500
  })

  it('should return red for <25% availability', () => {
    const facility: FacilityWithCoords = {
      name: 'Test Facility',
      address: '123 Test St',
      lat: 47.6,
      lon: -122.3,
      courts: [],
      availableCount: 1,
      totalCount: 1,
      availableHours: 2, // 2 out of 12 potential hours = 16%
    }

    expect(getAvailabilityColor(facility)).toBe('#ef4444') // red-500
  })

  it('should return red for 0 availability', () => {
    const facility: FacilityWithCoords = {
      name: 'Test Facility',
      address: '123 Test St',
      lat: 47.6,
      lon: -122.3,
      courts: [],
      availableCount: 0,
      totalCount: 1,
      availableHours: 0,
    }

    expect(getAvailabilityColor(facility)).toBe('#ef4444') // red-500
  })

  it('should handle multiple courts correctly', () => {
    const facility: FacilityWithCoords = {
      name: 'Test Facility',
      address: '123 Test St',
      lat: 47.6,
      lon: -122.3,
      courts: [],
      availableCount: 2,
      totalCount: 2,
      availableHours: 20, // 20 out of 24 potential hours (2 courts × 12) = 83%
    }

    expect(getAvailabilityColor(facility)).toBe('#10b981') // emerald-500
  })

  it('should handle edge case of 0 total courts', () => {
    const facility: FacilityWithCoords = {
      name: 'Test Facility',
      address: '123 Test St',
      lat: 47.6,
      lon: -122.3,
      courts: [],
      availableCount: 0,
      totalCount: 0,
      availableHours: 0,
    }

    // 0 total courts means 0 potential hours, percentage is 0
    expect(getAvailabilityColor(facility)).toBe('#ef4444') // red-500
  })
})
