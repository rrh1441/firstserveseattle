import { describe, it, expect } from 'vitest'
import { emailTemplates } from './templates'

describe('emailTemplates', () => {
  describe('subscriptionWelcome', () => {
    it('should return correct subject', () => {
      const result = emailTemplates.subscriptionWelcome('test@example.com', 'monthly')
      expect(result.subject).toBe('Welcome to First Serve Seattle!')
    })

    it('should include email in HTML', () => {
      const email = 'test@example.com'
      const result = emailTemplates.subscriptionWelcome(email, 'monthly')
      expect(result.html).toContain(email)
    })

    it('should display monthly plan correctly', () => {
      const result = emailTemplates.subscriptionWelcome('test@example.com', 'monthly')
      expect(result.html).toContain('Monthly ($4 first month, then $8/mo)')
    })

    it('should display annual plan correctly', () => {
      const result = emailTemplates.subscriptionWelcome('test@example.com', 'annual')
      expect(result.html).toContain('Annual ($69.99/yr)')
    })

    it('should include login link', () => {
      const result = emailTemplates.subscriptionWelcome('test@example.com', 'monthly')
      expect(result.html).toContain('https://firstserveseattle.com/login')
    })

    it('should include billing management link', () => {
      const result = emailTemplates.subscriptionWelcome('test@example.com', 'monthly')
      expect(result.html).toContain('https://firstserveseattle.com/billing')
    })

    it('should include support email', () => {
      const result = emailTemplates.subscriptionWelcome('test@example.com', 'monthly')
      expect(result.html).toContain('support@firstserveseattle.com')
    })

    it('should include subscription activated badge', () => {
      const result = emailTemplates.subscriptionWelcome('test@example.com', 'monthly')
      expect(result.html).toContain('Subscription Activated')
    })
  })

  describe('paymentSucceeded', () => {
    it('should return correct subject', () => {
      const result = emailTemplates.paymentSucceeded('test@example.com', 999, 'monthly')
      expect(result.subject).toBe('Payment Received - First Serve Seattle')
    })

    it('should format amount correctly from cents to dollars', () => {
      const result = emailTemplates.paymentSucceeded('test@example.com', 999, 'monthly')
      expect(result.html).toContain('$9.99')
    })

    it('should format larger amounts correctly', () => {
      const result = emailTemplates.paymentSucceeded('test@example.com', 6999, 'annual')
      expect(result.html).toContain('$69.99')
    })

    it('should display monthly plan label', () => {
      const result = emailTemplates.paymentSucceeded('test@example.com', 800, 'monthly')
      expect(result.html).toContain('Monthly')
      expect(result.html).not.toContain('Annual')
    })

    it('should display annual plan label', () => {
      const result = emailTemplates.paymentSucceeded('test@example.com', 6999, 'annual')
      expect(result.html).toContain('Annual')
    })

    it('should include tennis courts link', () => {
      const result = emailTemplates.paymentSucceeded('test@example.com', 999, 'monthly')
      expect(result.html).toContain('https://firstserveseattle.com/tennis-courts')
    })

    it('should show Paid status', () => {
      const result = emailTemplates.paymentSucceeded('test@example.com', 999, 'monthly')
      expect(result.html).toContain('Paid')
    })

    it('should include payment successful badge', () => {
      const result = emailTemplates.paymentSucceeded('test@example.com', 999, 'monthly')
      expect(result.html).toContain('Payment Successful')
    })
  })

  describe('paymentFailed', () => {
    it('should return correct subject', () => {
      const result = emailTemplates.paymentFailed('test@example.com', 'https://example.com/retry')
      expect(result.subject).toBe('Payment Failed - Action Required')
    })

    it('should include retry URL', () => {
      const retryUrl = 'https://billing.stripe.com/session/abc123'
      const result = emailTemplates.paymentFailed('test@example.com', retryUrl)
      expect(result.html).toContain(retryUrl)
    })

    it('should list common payment failure reasons', () => {
      const result = emailTemplates.paymentFailed('test@example.com', 'https://example.com/retry')
      expect(result.html).toContain('Insufficient funds')
      expect(result.html).toContain('Card expiration')
      expect(result.html).toContain('Bank declining')
    })

    it('should include 7-day warning', () => {
      const result = emailTemplates.paymentFailed('test@example.com', 'https://example.com/retry')
      expect(result.html).toContain('7 days')
    })

    it('should include Payment Failed badge', () => {
      const result = emailTemplates.paymentFailed('test@example.com', 'https://example.com/retry')
      expect(result.html).toContain('Payment Failed')
    })

    it('should have red header color', () => {
      const result = emailTemplates.paymentFailed('test@example.com', 'https://example.com/retry')
      expect(result.html).toContain('bgcolor="#ef4444"')
    })
  })

  describe('subscriptionCancelled', () => {
    it('should return correct subject', () => {
      const result = emailTemplates.subscriptionCancelled()
      expect(result.subject).toBe('Subscription Cancelled - First Serve Seattle')
    })

    it('should include reactivation link', () => {
      const result = emailTemplates.subscriptionCancelled()
      expect(result.html).toContain('https://firstserveseattle.com/signup')
    })

    it('should mention access until end of billing period', () => {
      const result = emailTemplates.subscriptionCancelled()
      expect(result.html).toContain('end of your current billing period')
    })

    it('should include Subscription Cancelled badge', () => {
      const result = emailTemplates.subscriptionCancelled()
      expect(result.html).toContain('Subscription Cancelled')
    })

    it('should request feedback', () => {
      const result = emailTemplates.subscriptionCancelled()
      expect(result.html).toContain('love to hear your feedback')
    })

    it('should have grey header color for cancelled state', () => {
      const result = emailTemplates.subscriptionCancelled()
      expect(result.html).toContain('bgcolor="#6b7280"')
    })
  })

  describe('alertTrialWelcome', () => {
    const mockDate = new Date('2025-01-22T00:00:00.000Z')

    it('should return correct subject', () => {
      const result = emailTemplates.alertTrialWelcome(
        'test@example.com',
        'https://example.com/preferences',
        mockDate
      )
      expect(result.subject).toBe('Your 7-day court alerts are active!')
    })

    it('should include preferences URL', () => {
      const preferencesUrl = 'https://firstserveseattle.com/alerts/preferences?token=abc123'
      const result = emailTemplates.alertTrialWelcome('test@example.com', preferencesUrl, mockDate)
      expect(result.html).toContain(preferencesUrl)
    })

    it('should format expiration date correctly', () => {
      const result = emailTemplates.alertTrialWelcome(
        'test@example.com',
        'https://example.com/preferences',
        mockDate
      )
      // Date format is "weekday, month day" - verify it contains expected format patterns
      expect(result.html).toContain('Your trial expires:')
      // The date will be formatted based on local timezone, so just verify it's a formatted date
      expect(result.html).toMatch(/January\s+2[12]/) // January 21 or 22 depending on timezone
    })

    it('should include savings callout', () => {
      const result = emailTemplates.alertTrialWelcome(
        'test@example.com',
        'https://example.com/preferences',
        mockDate
      )
      expect(result.html).toContain('Save $24+ per session')
    })

    it('should include signup link for subscription', () => {
      const result = emailTemplates.alertTrialWelcome(
        'test@example.com',
        'https://example.com/preferences',
        mockDate
      )
      expect(result.html).toContain('https://firstserveseattle.com/signup')
    })
  })

  describe('dailyCourtAlert', () => {
    const mockCourts = [
      {
        title: 'Jefferson Park Court 1',
        address: '4100 Beacon Ave S, Seattle, WA',
        slots: ['9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM'],
        mapsUrl: 'https://maps.google.com/test1',
      },
      {
        title: 'Volunteer Park Court 1',
        address: '1247 15th Ave E, Seattle, WA',
        slots: ['10:00 AM - 12:00 PM'],
        mapsUrl: 'https://maps.google.com/test2',
      },
    ]

    it('should generate subject for single court', () => {
      const singleCourt = [mockCourts[0]]
      const result = emailTemplates.dailyCourtAlert(
        singleCourt,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.subject).toBe('Jefferson Park Court 1 has open slots today!')
    })

    it('should generate subject for multiple courts', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.subject).toBe('2 of your courts are open today!')
    })

    it('should include all court titles', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.html).toContain('Jefferson Park Court 1')
      expect(result.html).toContain('Volunteer Park Court 1')
    })

    it('should include court addresses', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.html).toContain('4100 Beacon Ave S, Seattle, WA')
      expect(result.html).toContain('1247 15th Ave E, Seattle, WA')
    })

    it('should include time slots', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.html).toContain('9:00 AM - 11:00 AM')
      expect(result.html).toContain('2:00 PM - 4:00 PM')
      expect(result.html).toContain('10:00 AM - 12:00 PM')
    })

    it('should include maps URLs for directions', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.html).toContain('https://maps.google.com/test1')
      expect(result.html).toContain('https://maps.google.com/test2')
    })

    it('should show days remaining with plural form', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.html).toContain('5 days left')
    })

    it('should show days remaining with singular form', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        1,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.html).toContain('1 day left')
    })

    it('should include preferences URL', () => {
      const prefsUrl = 'https://firstserveseattle.com/alerts/preferences'
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        prefsUrl,
        'https://unsub.com'
      )
      expect(result.html).toContain(prefsUrl)
    })

    it('should include unsubscribe URL', () => {
      const unsubUrl = 'https://firstserveseattle.com/alerts/unsubscribe?token=xyz'
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        unsubUrl
      )
      expect(result.html).toContain(unsubUrl)
    })

    it('should include subscribe link with $8/mo pricing', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.html).toContain('Subscribe for $8/mo')
    })

    it('should encode email in subscribe URL when provided', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com',
        'user@example.com'
      )
      expect(result.html).toContain('email=user%40example.com')
    })

    it('should not include email param when email not provided', () => {
      const result = emailTemplates.dailyCourtAlert(
        mockCourts,
        5,
        'https://prefs.com',
        'https://unsub.com'
      )
      expect(result.html).not.toContain('&email=')
    })
  })

  describe('alertTrialExpiring', () => {
    it('should return correct subject', () => {
      const result = emailTemplates.alertTrialExpiring('https://example.com/subscribe')
      expect(result.subject).toBe('Your free court alerts expire tomorrow!')
    })

    it('should include subscribe URL', () => {
      const subscribeUrl = 'https://firstserveseattle.com/signup?plan=monthly'
      const result = emailTemplates.alertTrialExpiring(subscribeUrl)
      expect(result.html).toContain(subscribeUrl)
    })

    it('should mention last day', () => {
      const result = emailTemplates.alertTrialExpiring('https://example.com/subscribe')
      expect(result.html).toContain('Last Day of Free Alerts')
    })

    it('should mention 7-day trial ending', () => {
      const result = emailTemplates.alertTrialExpiring('https://example.com/subscribe')
      expect(result.html).toContain('7-day trial ends tomorrow')
    })

    it('should include 50% off promotion', () => {
      const result = emailTemplates.alertTrialExpiring('https://example.com/subscribe')
      expect(result.html).toContain('50% Off First Month')
    })

    it('should include savings callout', () => {
      const result = emailTemplates.alertTrialExpiring('https://example.com/subscribe')
      expect(result.html).toContain('Members save $24+ per session')
    })
  })

  describe('Common template elements', () => {
    it('all templates should include valid HTML structure', () => {
      const templates = [
        emailTemplates.subscriptionWelcome('test@example.com', 'monthly'),
        emailTemplates.paymentSucceeded('test@example.com', 999, 'monthly'),
        emailTemplates.paymentFailed('test@example.com', 'https://retry.com'),
        emailTemplates.subscriptionCancelled(),
        emailTemplates.alertTrialWelcome('test@example.com', 'https://prefs.com', new Date()),
        emailTemplates.dailyCourtAlert(
          [{ title: 'Test', address: '123 St', slots: ['9am'], mapsUrl: 'https://maps.com' }],
          5,
          'https://prefs.com',
          'https://unsub.com'
        ),
        emailTemplates.alertTrialExpiring('https://sub.com'),
      ]

      templates.forEach((template) => {
        expect(template.html).toContain('<!DOCTYPE html')
        expect(template.html).toContain('<html')
        expect(template.html).toContain('</html>')
        expect(template.html).toContain('<body')
        expect(template.html).toContain('</body>')
      })
    })

    it('all templates should have non-empty subjects', () => {
      const templates = [
        emailTemplates.subscriptionWelcome('test@example.com', 'monthly'),
        emailTemplates.paymentSucceeded('test@example.com', 999, 'monthly'),
        emailTemplates.paymentFailed('test@example.com', 'https://retry.com'),
        emailTemplates.subscriptionCancelled(),
        emailTemplates.alertTrialWelcome('test@example.com', 'https://prefs.com', new Date()),
        emailTemplates.dailyCourtAlert(
          [{ title: 'Test', address: '123 St', slots: ['9am'], mapsUrl: 'https://maps.com' }],
          5,
          'https://prefs.com',
          'https://unsub.com'
        ),
        emailTemplates.alertTrialExpiring('https://sub.com'),
      ]

      templates.forEach((template) => {
        expect(template.subject).toBeTruthy()
        expect(template.subject.length).toBeGreaterThan(5)
      })
    })

    it('all templates should include brand name', () => {
      const templates = [
        emailTemplates.subscriptionWelcome('test@example.com', 'monthly'),
        emailTemplates.paymentSucceeded('test@example.com', 999, 'monthly'),
        emailTemplates.paymentFailed('test@example.com', 'https://retry.com'),
        emailTemplates.subscriptionCancelled(),
        emailTemplates.alertTrialWelcome('test@example.com', 'https://prefs.com', new Date()),
        emailTemplates.alertTrialExpiring('https://sub.com'),
      ]

      templates.forEach((template) => {
        expect(template.html).toContain('First Serve Seattle')
      })
    })
  })
})
