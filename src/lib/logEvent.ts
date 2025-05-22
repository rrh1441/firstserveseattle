export type LogMetadata = Record<string, unknown>

/**
 * Send a telemetry event to `/api/log-event`.
 */
export async function logEvent(
  event: string,
  metadata: LogMetadata = {},
): Promise<void> {
  try {
    const extras: LogMetadata = {}

    // Only run the local-storage look-ups in the browser
    if (typeof window !== 'undefined') {
      const visitNumber = Number.parseInt(
        localStorage.getItem('visitNumber') ?? '0',
        10,
      )
      if (!Number.isNaN(visitNumber)) extras.visitNumber = visitNumber

      const abGroup = localStorage.getItem('abGroup')
      if (abGroup) extras.abGroup = abGroup

      const userId = localStorage.getItem('userId')
      if (userId) extras.userId = userId

      const stripeCustomerId = localStorage.getItem('stripeCustomerId')
      if (stripeCustomerId) extras.stripeCustomerId = stripeCustomerId
    }

    await fetch('/api/log-event', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        event,
        metadata : { ...metadata, ...extras },
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (err) {
    // Non-critical: log and continue
    // eslint-disable-next-line no-console
    console.warn('logEvent failed:', event, err)
  }
}