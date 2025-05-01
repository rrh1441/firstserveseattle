// lib/logEvent.ts
export async function logEvent(event: string, metadata: Record<string, unknown> = {}) {

    await fetch('/api/log-event', {
      method: 'POST',
      body: JSON.stringify({
        event,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });
  }
  