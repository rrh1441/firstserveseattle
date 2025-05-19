// src/lib/initClientIds.ts
// Utility to initialize persistent identifiers in the browser.

export function initClientIds(): void {
  if (typeof window === 'undefined') return;

  try {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('userId', userId);
    }

    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('visitorId', visitorId);
    }
  } catch (err) {
    console.error('initClientIds failed:', err);
  }
}
