// src/lib/logEvent.ts

export async function logEvent(
  event: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const extras: Record<string, unknown> = {};

    if (typeof window !== "undefined") {
      const vn = parseInt(localStorage.getItem("visitNumber") ?? "0", 10);
      if (!Number.isNaN(vn)) extras.visitNumber = vn;

      const ab = localStorage.getItem("abGroup");
      if (ab) extras.abGroup = ab;

      const uid = localStorage.getItem("userId");
      if (uid) extras.userId = uid;

      const scid = localStorage.getItem("stripeCustomerId");
      if (scid) extras.stripeCustomerId = scid;
    }

    await fetch("/api/log-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        metadata: { ...metadata, ...extras },
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("logEvent failed:", event, error);
  }
}