import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  requireEnv,
  requireEnvWithFallback,
  redactEmail,
  cardOnFile,
} from './utils'
import type Stripe from 'stripe'

describe('Stripe Utilities', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('requireEnv', () => {
    it('should return env variable when set', () => {
      vi.stubEnv('TEST_VAR', 'test-value')
      expect(requireEnv('TEST_VAR')).toBe('test-value')
    })

    it('should throw when env variable is missing', () => {
      expect(() => requireEnv('MISSING_VAR')).toThrow(
        'Missing required environment variable: MISSING_VAR'
      )
    })

    it('should throw when env variable is empty string', () => {
      vi.stubEnv('EMPTY_VAR', '')
      expect(() => requireEnv('EMPTY_VAR')).toThrow(
        'Missing required environment variable: EMPTY_VAR'
      )
    })
  })

  describe('requireEnvWithFallback', () => {
    it('should return primary env variable when set', () => {
      vi.stubEnv('PRIMARY_VAR', 'primary-value')
      vi.stubEnv('FALLBACK_VAR', 'fallback-value')
      expect(requireEnvWithFallback('PRIMARY_VAR', 'FALLBACK_VAR')).toBe('primary-value')
    })

    it('should return fallback env variable when primary is missing', () => {
      vi.stubEnv('FALLBACK_VAR', 'fallback-value')
      expect(requireEnvWithFallback('MISSING_PRIMARY', 'FALLBACK_VAR')).toBe('fallback-value')
    })

    it('should throw when both primary and fallback are missing', () => {
      expect(() => requireEnvWithFallback('MISSING_PRIMARY', 'MISSING_FALLBACK')).toThrow(
        'Missing required environment variable: MISSING_PRIMARY or MISSING_FALLBACK'
      )
    })
  })

  describe('redactEmail', () => {
    it('should redact email showing first 2 chars and domain', () => {
      expect(redactEmail('john@example.com')).toBe('jo***@example.com')
    })

    it('should handle short local parts', () => {
      expect(redactEmail('a@example.com')).toBe('a***@example.com')
      expect(redactEmail('ab@example.com')).toBe('ab***@example.com')
    })

    it('should handle long local parts', () => {
      expect(redactEmail('verylongemail@example.com')).toBe('ve***@example.com')
    })

    it('should return [none] for undefined email', () => {
      expect(redactEmail(undefined)).toBe('[none]')
    })

    it('should return [none] for empty string', () => {
      expect(redactEmail('')).toBe('[none]')
    })

    it('should return [invalid] for email without @', () => {
      expect(redactEmail('notanemail')).toBe('[invalid]')
    })
  })

  describe('cardOnFile', () => {
    it('should return true when default_payment_method is set', () => {
      const customer = {
        invoice_settings: { default_payment_method: 'pm_123' },
      } as unknown as Stripe.Customer
      expect(cardOnFile(customer)).toBe(true)
    })

    it('should return true when default_source is set', () => {
      const customer = {
        default_source: 'src_123',
        invoice_settings: {},
      } as unknown as Stripe.Customer
      expect(cardOnFile(customer)).toBe(true)
    })

    it('should return false when no payment method is set', () => {
      const customer = {
        invoice_settings: {},
      } as unknown as Stripe.Customer
      expect(cardOnFile(customer)).toBe(false)
    })

    it('should return false for empty customer object', () => {
      const customer = {} as unknown as Stripe.Customer
      expect(cardOnFile(customer)).toBe(false)
    })

    it('should prioritize default_payment_method over default_source', () => {
      const customer = {
        invoice_settings: { default_payment_method: 'pm_123' },
        default_source: 'src_456',
      } as unknown as Stripe.Customer
      expect(cardOnFile(customer)).toBe(true)
    })
  })
})
