/**
 * Shared Stripe webhook utilities
 * Used by both stripe-webhook (original account) and stripe-webhook-new (new account)
 */
import type Stripe from 'stripe';

/**
 * Require an environment variable, throwing if missing.
 * Provides type-safe string return.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Require an environment variable with a fallback option.
 * Throws if neither primary nor fallback is set.
 */
export function requireEnvWithFallback(primary: string, fallback: string): string {
  const value = process.env[primary] || process.env[fallback];
  if (!value) throw new Error(`Missing required environment variable: ${primary} or ${fallback}`);
  return value;
}

/**
 * Redact email for logging - shows first 2 chars and domain only.
 * Example: "john@example.com" -> "jo***@example.com"
 */
export function redactEmail(email?: string): string {
  if (!email) return '[none]';
  const [local, domain] = email.split('@');
  if (!domain) return '[invalid]';
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Check if a Stripe customer has a default payment method on file.
 */
export function cardOnFile(cust: Stripe.Customer): boolean {
  return Boolean(
    cust.invoice_settings?.default_payment_method || cust.default_source
  );
}
