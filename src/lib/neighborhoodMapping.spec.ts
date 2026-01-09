import { describe, it, expect } from 'vitest'
import {
  COURT_NEIGHBORHOODS,
  getNeighborhoodsForCourt,
  courtMatchesNeighborhood,
  courtMatchesSearch,
} from './neighborhoodMapping'

describe('neighborhoodMapping', () => {
  describe('COURT_NEIGHBORHOODS', () => {
    it('should have mappings for major Seattle parks', () => {
      expect(COURT_NEIGHBORHOODS['Jefferson Park Lid Tennis Court']).toContain('Beacon Hill')
      expect(COURT_NEIGHBORHOODS['Volunteer Park Court 01']).toContain('Capitol Hill')
      expect(COURT_NEIGHBORHOODS['Green Lake Park West Tennis']).toContain('Green Lake')
    })

    it('should have at least one neighborhood per court', () => {
      Object.values(COURT_NEIGHBORHOODS).forEach((neighborhoods) => {
        expect(neighborhoods.length).toBeGreaterThan(0)
      })
    })
  })

  describe('getNeighborhoodsForCourt', () => {
    it('should return neighborhoods for exact match', () => {
      const neighborhoods = getNeighborhoodsForCourt('Jefferson Park Lid Tennis Court')
      expect(neighborhoods).toContain('Beacon Hill')
    })

    it('should match court titles with suffixes like "#1"', () => {
      // The DB might have "Jefferson Park Lid Tennis Court #1" but our map has "Jefferson Park Lid Tennis Court"
      const neighborhoods = getNeighborhoodsForCourt('Jefferson Park Lid Tennis Court #1')
      expect(neighborhoods).toContain('Beacon Hill')
    })

    it('should match court titles with "Court 1" suffix', () => {
      const neighborhoods = getNeighborhoodsForCourt('Volunteer Park Court 01 Extra Text')
      expect(neighborhoods).toContain('Capitol Hill')
    })

    it('should be case insensitive', () => {
      const neighborhoods = getNeighborhoodsForCourt('jefferson park lid tennis court')
      expect(neighborhoods).toContain('Beacon Hill')
    })

    it('should return empty array for unknown courts', () => {
      const neighborhoods = getNeighborhoodsForCourt('Unknown Park Tennis')
      expect(neighborhoods).toEqual([])
    })

    it('should find the longest matching prefix', () => {
      // If we have both "Lower Woodland Playfield" and "Lower Woodland Playfield Upper Courts"
      // it should match the longer one for "Lower Woodland Playfield Upper Courts #1"
      const neighborhoods = getNeighborhoodsForCourt('Lower Woodland Playfield Upper Courts #1')
      expect(neighborhoods).toContain('Wallingford')
    })

    it('should return neighborhoods for West Seattle courts', () => {
      const neighborhoods = getNeighborhoodsForCourt('Alki Playfield Tennis')
      expect(neighborhoods).toContain('West Seattle')
      expect(neighborhoods).toContain('Alki')
    })
  })

  describe('courtMatchesNeighborhood', () => {
    it('should return true when court is in searched neighborhood', () => {
      expect(courtMatchesNeighborhood('Jefferson Park Lid Tennis Court', 'Beacon Hill')).toBe(true)
    })

    it('should be case insensitive for search term', () => {
      expect(courtMatchesNeighborhood('Jefferson Park Lid Tennis Court', 'beacon hill')).toBe(true)
      expect(courtMatchesNeighborhood('Jefferson Park Lid Tennis Court', 'BEACON HILL')).toBe(true)
    })

    it('should match partial neighborhood names', () => {
      expect(courtMatchesNeighborhood('Jefferson Park Lid Tennis Court', 'beacon')).toBe(true)
    })

    it('should return false for non-matching neighborhood', () => {
      expect(courtMatchesNeighborhood('Jefferson Park Lid Tennis Court', 'Capitol Hill')).toBe(false)
    })

    it('should return false for unknown courts', () => {
      expect(courtMatchesNeighborhood('Unknown Park Tennis', 'Capitol Hill')).toBe(false)
    })

    it('should match any of multiple neighborhoods', () => {
      // Alki Playfield is in Admiral, Alki, and West Seattle
      expect(courtMatchesNeighborhood('Alki Playfield Tennis', 'Admiral')).toBe(true)
      expect(courtMatchesNeighborhood('Alki Playfield Tennis', 'Alki')).toBe(true)
      expect(courtMatchesNeighborhood('Alki Playfield Tennis', 'West Seattle')).toBe(true)
    })
  })

  describe('courtMatchesSearch', () => {
    it('should return true for empty search term', () => {
      expect(courtMatchesSearch('Jefferson Park Lid Tennis Court', '')).toBe(true)
      expect(courtMatchesSearch('Jefferson Park Lid Tennis Court', '   ')).toBe(true)
    })

    it('should match by court title', () => {
      expect(courtMatchesSearch('Jefferson Park Lid Tennis Court', 'Jefferson')).toBe(true)
      expect(courtMatchesSearch('Jefferson Park Lid Tennis Court', 'Park')).toBe(true)
    })

    it('should match by neighborhood', () => {
      expect(courtMatchesSearch('Jefferson Park Lid Tennis Court', 'Beacon Hill')).toBe(true)
    })

    it('should be case insensitive for title search', () => {
      expect(courtMatchesSearch('Jefferson Park Lid Tennis Court', 'jefferson')).toBe(true)
      expect(courtMatchesSearch('Jefferson Park Lid Tennis Court', 'JEFFERSON')).toBe(true)
    })

    it('should return false for non-matching search', () => {
      expect(courtMatchesSearch('Jefferson Park Lid Tennis Court', 'Magnolia')).toBe(false)
    })

    it('should match partial court names', () => {
      expect(courtMatchesSearch('Green Lake Park West Tennis', 'green')).toBe(true)
      expect(courtMatchesSearch('Green Lake Park West Tennis', 'lake')).toBe(true)
    })

    it('should match either title or neighborhood', () => {
      // "Volunteer" matches title, "Capitol" matches neighborhood
      expect(courtMatchesSearch('Volunteer Park Court 01', 'Volunteer')).toBe(true)
      expect(courtMatchesSearch('Volunteer Park Court 01', 'Capitol')).toBe(true)
    })
  })

  describe('Real-world search scenarios', () => {
    it('should find courts when user searches by neighborhood', () => {
      // User searching for "Capitol Hill" courts
      const capitolHillCourts = [
        'Volunteer Park Court 01',
        'Miller Playfield Tennis',
      ]

      capitolHillCourts.forEach((court) => {
        expect(courtMatchesSearch(court, 'Capitol Hill')).toBe(true)
      })
    })

    it('should find courts when user searches by area', () => {
      // User searching for "West Seattle" courts
      const westSeattleCourts = [
        'Alki Playfield Tennis',
        'Delridge Playfield Tennis',
        'Hiawatha Playfield Tennis',
        'Riverview Playfield Tennis',
        'Solstice Park Tennis',
        'Walt Hundley Playfield Tennis',
      ]

      westSeattleCourts.forEach((court) => {
        expect(courtMatchesSearch(court, 'West Seattle')).toBe(true)
      })
    })

    it('should not match unrelated searches', () => {
      // User searching for "Downtown" - no courts there
      expect(courtMatchesSearch('Jefferson Park Lid Tennis Court', 'Downtown')).toBe(false)
      expect(courtMatchesSearch('Volunteer Park Court 01', 'Downtown')).toBe(false)
    })
  })
})
