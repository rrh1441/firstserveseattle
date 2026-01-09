import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GmailEmailService } from './email-service'

// Mock the createGmailClient function
const mockSendEmail = vi.fn()
const mockGmailClient = {
  sendEmail: mockSendEmail,
}

vi.mock('./client', () => ({
  createGmailClient: vi.fn(() => mockGmailClient),
}))

import { createGmailClient } from './client'

describe('GmailEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendEmail.mockResolvedValue({ id: 'msg_123', threadId: 'thread_456' })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const result = await GmailEmailService.sendWelcomeEmail('test@example.com', 'monthly')

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith({
        from: 'First Serve Seattle <ryan@firstserveseattle.com>',
        to: 'test@example.com',
        subject: 'Welcome to First Serve Seattle!',
        html: expect.stringContaining('Welcome to First Serve Seattle'),
      })
    })

    it('should pass correct plan to template', async () => {
      await GmailEmailService.sendWelcomeEmail('test@example.com', 'annual')

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Annual'),
        })
      )
    })

    it('should return success false when Gmail client is not initialized', async () => {
      vi.mocked(createGmailClient).mockReturnValueOnce(null)

      const result = await GmailEmailService.sendWelcomeEmail('test@example.com', 'monthly')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gmail not configured')
    })

    it('should return success false when sendEmail throws', async () => {
      const error = new Error('SMTP error')
      mockSendEmail.mockRejectedValueOnce(error)

      const result = await GmailEmailService.sendWelcomeEmail('test@example.com', 'monthly')

      expect(result.success).toBe(false)
      expect(result.error).toEqual(error)
    })
  })

  describe('sendPaymentSuccessEmail', () => {
    it('should send payment success email successfully', async () => {
      const result = await GmailEmailService.sendPaymentSuccessEmail('test@example.com', 999, 'monthly')

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith({
        from: 'First Serve Seattle <ryan@firstserveseattle.com>',
        to: 'test@example.com',
        subject: 'Payment Received - First Serve Seattle',
        html: expect.stringContaining('Payment Details'),
      })
    })

    it('should format amount correctly in template', async () => {
      await GmailEmailService.sendPaymentSuccessEmail('test@example.com', 6999, 'annual')

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('$69.99'),
        })
      )
    })

    it('should return success false when Gmail client is not initialized', async () => {
      vi.mocked(createGmailClient).mockReturnValueOnce(null)

      const result = await GmailEmailService.sendPaymentSuccessEmail('test@example.com', 999, 'monthly')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gmail not configured')
    })
  })

  describe('sendPaymentFailedEmail', () => {
    it('should send payment failed email successfully', async () => {
      const result = await GmailEmailService.sendPaymentFailedEmail('test@example.com')

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith({
        from: 'First Serve Seattle <ryan@firstserveseattle.com>',
        to: 'test@example.com',
        subject: 'Payment Failed - Action Required',
        html: expect.stringContaining('Payment Failed'),
      })
    })

    it('should include billing URL for retry', async () => {
      await GmailEmailService.sendPaymentFailedEmail('test@example.com')

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('https://firstserveseattle.com/billing'),
        })
      )
    })

    it('should return success false when Gmail client is not initialized', async () => {
      vi.mocked(createGmailClient).mockReturnValueOnce(null)

      const result = await GmailEmailService.sendPaymentFailedEmail('test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gmail not configured')
    })
  })

  describe('sendCancellationEmail', () => {
    it('should send cancellation email successfully', async () => {
      const result = await GmailEmailService.sendCancellationEmail('test@example.com')

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith({
        from: 'First Serve Seattle <ryan@firstserveseattle.com>',
        to: 'test@example.com',
        subject: 'Subscription Cancelled - First Serve Seattle',
        html: expect.stringContaining('Subscription Cancelled'),
      })
    })

    it('should include reactivation link', async () => {
      await GmailEmailService.sendCancellationEmail('test@example.com')

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('https://firstserveseattle.com/signup'),
        })
      )
    })

    it('should return success false when Gmail client is not initialized', async () => {
      vi.mocked(createGmailClient).mockReturnValueOnce(null)

      const result = await GmailEmailService.sendCancellationEmail('test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gmail not configured')
    })
  })

  describe('sendAlertTrialWelcome', () => {
    it('should send alert trial welcome email successfully', async () => {
      const expiresAt = new Date('2025-01-22T00:00:00.000Z')
      const result = await GmailEmailService.sendAlertTrialWelcome(
        'test@example.com',
        'https://firstserveseattle.com/alerts/preferences?token=abc',
        expiresAt
      )

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith({
        from: 'First Serve Seattle <ryan@firstserveseattle.com>',
        to: 'test@example.com',
        subject: 'Your 7-day court alerts are active!',
        html: expect.stringContaining('7 days of free court alerts'),
      })
    })

    it('should include preferences URL in template', async () => {
      const preferencesUrl = 'https://firstserveseattle.com/alerts/preferences?token=xyz'
      const expiresAt = new Date()

      await GmailEmailService.sendAlertTrialWelcome('test@example.com', preferencesUrl, expiresAt)

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(preferencesUrl),
        })
      )
    })

    it('should return success false when Gmail client is not initialized', async () => {
      vi.mocked(createGmailClient).mockReturnValueOnce(null)

      const result = await GmailEmailService.sendAlertTrialWelcome(
        'test@example.com',
        'https://prefs.com',
        new Date()
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gmail not configured')
    })
  })

  describe('sendDailyCourtAlert', () => {
    const mockCourts = [
      {
        title: 'Jefferson Park Court 1',
        address: '4100 Beacon Ave S, Seattle, WA',
        slots: ['9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM'],
        mapsUrl: 'https://maps.google.com/test1',
      },
    ]

    it('should send daily court alert successfully', async () => {
      const result = await GmailEmailService.sendDailyCourtAlert(
        'test@example.com',
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith({
        from: 'First Serve Seattle <ryan@firstserveseattle.com>',
        to: 'test@example.com',
        subject: 'Jefferson Park Court 1 has open slots today!',
        html: expect.stringContaining('Jefferson Park Court 1'),
      })
    })

    it('should include court details in template', async () => {
      await GmailEmailService.sendDailyCourtAlert(
        'test@example.com',
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('4100 Beacon Ave S, Seattle, WA'),
        })
      )
    })

    it('should include time slots in template', async () => {
      await GmailEmailService.sendDailyCourtAlert(
        'test@example.com',
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('9:00 AM - 11:00 AM'),
        })
      )
    })

    it('should include unsubscribe URL in template', async () => {
      const unsubUrl = 'https://firstserveseattle.com/alerts/unsubscribe?token=abc'

      await GmailEmailService.sendDailyCourtAlert(
        'test@example.com',
        mockCourts,
        5,
        'https://prefs.com',
        unsubUrl
      )

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(unsubUrl),
        })
      )
    })

    it('should return success false when Gmail client is not initialized', async () => {
      vi.mocked(createGmailClient).mockReturnValueOnce(null)

      const result = await GmailEmailService.sendDailyCourtAlert(
        'test@example.com',
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gmail not configured')
    })
  })

  describe('sendAlertTrialExpiring', () => {
    it('should send alert trial expiring email successfully', async () => {
      const result = await GmailEmailService.sendAlertTrialExpiring(
        'test@example.com',
        'https://firstserveseattle.com/signup?plan=monthly'
      )

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith({
        from: 'First Serve Seattle <ryan@firstserveseattle.com>',
        to: 'test@example.com',
        subject: 'Your free court alerts expire tomorrow!',
        html: expect.stringContaining('Last Day of Free Alerts'),
      })
    })

    it('should include subscribe URL in template', async () => {
      const subscribeUrl = 'https://firstserveseattle.com/signup?plan=monthly&promo=50off'

      await GmailEmailService.sendAlertTrialExpiring('test@example.com', subscribeUrl)

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(subscribeUrl),
        })
      )
    })

    it('should return success false when Gmail client is not initialized', async () => {
      vi.mocked(createGmailClient).mockReturnValueOnce(null)

      const result = await GmailEmailService.sendAlertTrialExpiring(
        'test@example.com',
        'https://sub.com'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gmail not configured')
    })
  })

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error')
      mockSendEmail.mockRejectedValueOnce(networkError)

      const result = await GmailEmailService.sendWelcomeEmail('test@example.com', 'monthly')

      expect(result.success).toBe(false)
      expect(result.error).toEqual(networkError)
    })

    it('should handle API rate limiting errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded')
      mockSendEmail.mockRejectedValueOnce(rateLimitError)

      const result = await GmailEmailService.sendPaymentSuccessEmail('test@example.com', 999, 'monthly')

      expect(result.success).toBe(false)
      expect(result.error).toEqual(rateLimitError)
    })
  })
})
