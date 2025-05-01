export async function logEvent(
    event: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
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
  