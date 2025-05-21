// src/lib/logEvent.ts

// Helper function to get the anonymous user ID from localStorage (client-side only)
function getAnonymousUserId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
}

export async function logEvent(
  event: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    // Automatically add anonymous user ID if available (client-side)
    const anonymousId = getAnonymousUserId();
    if (anonymousId) {
      metadata.anonymousId = anonymousId;
    }

    // Ensure authenticatedUserId, if provided in metadata, is also included
    // (handled by spreading the provided metadata)

    await fetch("/api/log-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.warn("logEvent failed:", event, error);
  }
}