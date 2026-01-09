import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTennisCourts, TennisCourt, ParsedInterval } from './getTennisCourts'

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabaseClient'

describe('getTennisCourts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockCourtData = [
    {
      id: 1,
      title: 'Jefferson Park Court 1',
      facility_type: 'Tennis Court - Outdoor',
      address: '4100 Beacon Ave S, Seattle, WA',
      available_dates: '2025-01-15 09:00:00-10:30:00\n2025-01-15 14:00:00-16:00:00',
      google_map_url: 'https://maps.google.com/test',
      lights: true,
      hitting_wall: false,
      pickleball_lined: true,
      ball_machine: false,
    },
    {
      id: 2,
      title: 'Volunteer Park Court 1',
      facility_type: 'Tennis Court - Outdoor',
      address: '1247 15th Ave E, Seattle, WA',
      available_dates: '2025-01-15 07:00:00-09:00:00',
      google_map_url: 'https://maps.google.com/test2',
      lights: false,
      hitting_wall: true,
      pickleball_lined: false,
      ball_machine: true,
    },
  ]

  const mockPopularityData = [
    { court_id: 1, avg_busy_score_7d: 0.75 },
    { court_id: 2, avg_busy_score_7d: 0.45 },
  ]

  it('should fetch courts and popularity data in parallel', async () => {
    const mockFrom = vi.mocked(supabase.from)

    // Track call order to verify parallel execution
    let callOrder: string[] = []

    mockFrom.mockImplementation((table: string) => {
      callOrder.push(table)
      return {
        select: vi.fn().mockImplementation(() => {
          if (table === 'tennis_courts') {
            return Promise.resolve({ data: mockCourtData, error: null })
          }
          if (table === 'v_court_popularity_7d') {
            return Promise.resolve({ data: mockPopularityData, error: null })
          }
          return Promise.resolve({ data: [], error: null })
        }),
      } as unknown as ReturnType<typeof supabase.from>
    })

    const courts = await getTennisCourts()

    // Verify both tables were queried
    expect(mockFrom).toHaveBeenCalledWith('tennis_courts')
    expect(mockFrom).toHaveBeenCalledWith('v_court_popularity_7d')
    expect(mockFrom).toHaveBeenCalledTimes(2)

    // Verify courts returned
    expect(courts).toHaveLength(2)
  })

  it('should return courts with correct properties', async () => {
    const mockFrom = vi.mocked(supabase.from)

    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation(() => {
        if (table === 'tennis_courts') {
          return Promise.resolve({ data: mockCourtData, error: null })
        }
        if (table === 'v_court_popularity_7d') {
          return Promise.resolve({ data: mockPopularityData, error: null })
        }
        return Promise.resolve({ data: [], error: null })
      }),
    } as unknown as ReturnType<typeof supabase.from>))

    const courts = await getTennisCourts()
    const court = courts[0]

    expect(court.id).toBe(1)
    expect(court.title).toBe('Jefferson Park Court 1')
    expect(court.facility_type).toBe('Tennis Court - Outdoor')
    expect(court.address).toBe('4100 Beacon Ave S, Seattle, WA')
    expect(court.Maps_url).toBe('https://maps.google.com/test')
    expect(court.lights).toBe(true)
    expect(court.hitting_wall).toBe(false)
    expect(court.pickleball_lined).toBe(true)
    expect(court.ball_machine).toBe(false)
    expect(court.avg_busy_score_7d).toBe(0.75)
  })

  it('should parse available_dates into intervals', async () => {
    const mockFrom = vi.mocked(supabase.from)

    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation(() => {
        if (table === 'tennis_courts') {
          return Promise.resolve({ data: mockCourtData, error: null })
        }
        if (table === 'v_court_popularity_7d') {
          return Promise.resolve({ data: mockPopularityData, error: null })
        }
        return Promise.resolve({ data: [], error: null })
      }),
    } as unknown as ReturnType<typeof supabase.from>))

    const courts = await getTennisCourts()
    const court = courts[0]

    expect(court.parsed_intervals).toHaveLength(2)
    expect(court.parsed_intervals[0]).toEqual({
      date: '2025-01-15',
      start: '9:00 AM',
      end: '10:30 AM',
    })
    expect(court.parsed_intervals[1]).toEqual({
      date: '2025-01-15',
      start: '2:00 PM',
      end: '4:00 PM',
    })
  })

  it('should return empty array when court fetch fails', async () => {
    const mockFrom = vi.mocked(supabase.from)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation(() => {
        if (table === 'tennis_courts') {
          return Promise.resolve({ data: null, error: new Error('Database error') })
        }
        return Promise.resolve({ data: [], error: null })
      }),
    } as unknown as ReturnType<typeof supabase.from>))

    const courts = await getTennisCourts()

    expect(courts).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith(
      '[getTennisCourts] court fetch error:',
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it('should return empty array when popularity fetch fails', async () => {
    const mockFrom = vi.mocked(supabase.from)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation(() => {
        if (table === 'tennis_courts') {
          return Promise.resolve({ data: mockCourtData, error: null })
        }
        if (table === 'v_court_popularity_7d') {
          return Promise.resolve({ data: null, error: new Error('View error') })
        }
        return Promise.resolve({ data: [], error: null })
      }),
    } as unknown as ReturnType<typeof supabase.from>))

    const courts = await getTennisCourts()

    expect(courts).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith(
      '[getTennisCourts] popularity fetch error:',
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it('should handle courts without popularity data', async () => {
    const mockFrom = vi.mocked(supabase.from)

    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation(() => {
        if (table === 'tennis_courts') {
          return Promise.resolve({ data: mockCourtData, error: null })
        }
        if (table === 'v_court_popularity_7d') {
          // Return empty popularity data
          return Promise.resolve({ data: [], error: null })
        }
        return Promise.resolve({ data: [], error: null })
      }),
    } as unknown as ReturnType<typeof supabase.from>))

    const courts = await getTennisCourts()

    expect(courts).toHaveLength(2)
    expect(courts[0].avg_busy_score_7d).toBeNull()
    expect(courts[1].avg_busy_score_7d).toBeNull()
  })

  it('should handle null values in court data gracefully', async () => {
    const mockFrom = vi.mocked(supabase.from)
    const courtWithNulls = [{
      id: 1,
      title: null,
      facility_type: null,
      address: null,
      available_dates: null,
      google_map_url: null,
      lights: null,
      hitting_wall: null,
      pickleball_lined: null,
      ball_machine: null,
    }]

    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation(() => {
        if (table === 'tennis_courts') {
          return Promise.resolve({ data: courtWithNulls, error: null })
        }
        if (table === 'v_court_popularity_7d') {
          return Promise.resolve({ data: [], error: null })
        }
        return Promise.resolve({ data: [], error: null })
      }),
    } as unknown as ReturnType<typeof supabase.from>))

    const courts = await getTennisCourts()
    const court = courts[0]

    expect(court.title).toBe('Unknown Court')
    expect(court.facility_type).toBe('Unknown')
    expect(court.address).toBeNull()
    expect(court.Maps_url).toBeNull()
    expect(court.lights).toBe(false)
    expect(court.hitting_wall).toBe(false)
    expect(court.pickleball_lined).toBe(false)
    expect(court.ball_machine).toBe(false)
    expect(court.parsed_intervals).toEqual([])
  })
})
