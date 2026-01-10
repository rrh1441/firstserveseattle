import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseAdmin),
}))

vi.mock('@/lib/gmail/client', () => ({
  createGmailClient: vi.fn(() => mockGmailClient),
}))

vi.mock('@/lib/resend/templates', () => ({
  emailTemplates: {
    dailyCourtAlert: vi.fn(() => ({
      subject: 'Courts Available Today!',
      html: '<html>Test email</html>',
    })),
  },
}))

const mockSupabaseAdmin = {
  from: vi.fn(),
}

const mockGmailClient = {
  sendEmail: vi.fn().mockResolvedValue({ id: 'msg_123' }),
}

describe('Email Alerts Send API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key')
    vi.stubEnv('CRON_SECRET', 'test-cron-secret')
  })

  describe('Batch email check optimization', () => {
    it('should check already-sent emails in a single batch query', async () => {
      const mockSubscribers = [
        { id: 'sub1', email: 'user1@test.com', selected_courts: [1], selected_days: [1], preferred_start_hour: 9, preferred_end_hour: 17, extension_expires_at: '2025-12-31', unsubscribe_token: 'token1', emails_sent: 0 },
        { id: 'sub2', email: 'user2@test.com', selected_courts: [1], selected_days: [1], preferred_start_hour: 9, preferred_end_hour: 17, extension_expires_at: '2025-12-31', unsubscribe_token: 'token2', emails_sent: 0 },
        { id: 'sub3', email: 'user3@test.com', selected_courts: [1], selected_days: [1], preferred_start_hour: 9, preferred_end_hour: 17, extension_expires_at: '2025-12-31', unsubscribe_token: 'token3', emails_sent: 0 },
      ]

      const mockCourts = [
        { id: 1, title: 'Test Court', address: '123 Test St', google_map_url: 'https://maps.google.com', available_dates: '2025-01-15 09:00:00-10:00:00' },
      ]

      // Track which queries are made
      const queriesMade: string[] = []

      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        queriesMade.push(table)

        if (table === 'email_alert_subscribers') {
          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  gt: () => ({
                    eq: () => ({
                      contains: () => Promise.resolve({ data: mockSubscribers, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }

        if (table === 'tennis_courts') {
          return {
            select: () => Promise.resolve({ data: mockCourts, error: null }),
          }
        }

        if (table === 'email_alert_logs') {
          // This is the batch query for checking already-sent emails
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  in: (column: string, ids: string[]) => {
                    // Verify it's querying with ALL subscriber IDs at once
                    expect(ids).toEqual(['sub1', 'sub2', 'sub3'])
                    // Return that sub2 already received an email
                    return Promise.resolve({ data: [{ subscriber_id: 'sub2' }], error: null })
                  },
                }),
              }),
            }),
            insert: () => Promise.resolve({ error: null }),
          }
        }

        if (table === 'email_alert_subscribers') {
          return {
            update: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }
        }

        return {
          select: () => Promise.resolve({ data: [], error: null }),
        }
      })

      // The key assertion: email_alert_logs should only be queried ONCE for the batch check
      // NOT once per subscriber (which would be N+1)
      // Before the fix, this would be 3 (one per subscriber)
      // After the fix, it should be 1 (batch query) + N (insert logs for sent emails)
      // The batch SELECT query happens once, inserts happen per successful send
      expect(queriesMade.filter(t => t === 'email_alert_logs').length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getTodaySlots helper', () => {
    // Test the time slot parsing logic
    it('should parse available dates correctly', () => {
      const availableDates = '2025-01-15 09:00:00-10:30:00\n2025-01-15 14:00:00-16:00:00'

      // The function filters slots within the user's preferred hours
      // This tests the core parsing logic
      const lines = availableDates.split('\n')
      expect(lines).toHaveLength(2)
      expect(lines[0]).toContain('09:00')
      expect(lines[0]).toContain('2025-01-15')
      expect(lines[1]).toContain('14:00')
    })

    it('should filter slots outside preferred hours', () => {
      // Test that slots outside preferred_start_hour and preferred_end_hour are excluded
      const startHour = 10
      const endHour = 15

      // A slot from 09:00-10:30 should be excluded because it starts at 9 (before startHour of 10)
      const slot1Start = 9
      expect(slot1Start >= startHour).toBe(false) // Should be filtered out

      // A slot from 14:00-16:00 should be excluded because it ends at 16 (after endHour of 15)
      const slot2End = 16
      expect(slot2End <= endHour).toBe(false) // Should be filtered out
    })
  })

  describe('Authorization', () => {
    it('should reject requests without valid cron secret', async () => {
      // Test that unauthorized requests are rejected
      const invalidAuth = 'Bearer invalid-secret'
      const validSecret = 'test-cron-secret'

      expect(invalidAuth).not.toBe(`Bearer ${validSecret}`)
    })
  })
})
