const SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY

export const analytics = {
  async track(data: { event: string; userId?: string; properties?: Record<string, unknown> }) {
    if (!SEGMENT_WRITE_KEY) {
      console.warn('SEGMENT_WRITE_KEY not set; skipping analytics.track')
      return
    }

    try {
      await fetch('https://api.segment.io/v1/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${SEGMENT_WRITE_KEY}:`).toString('base64'),
        },
        body: JSON.stringify(data),
      })
    } catch (err) {
      console.error('analytics.track failed', err)
    }
  },
}

