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

    // Track total visits for paywall/analytics experiments
    let visitNumber = parseInt(localStorage.getItem('visitNumber') ?? '0', 10);
    if (Number.isNaN(visitNumber)) visitNumber = 0;
    visitNumber += 1;
    localStorage.setItem('visitNumber', String(visitNumber));

    // Randomly bucket visitors into A/B groups on first visit
    let abGroup = localStorage.getItem('abGroup') as 'A' | 'B' | null;
    if (abGroup !== 'A' && abGroup !== 'B') {
      abGroup = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem('abGroup', abGroup);
    }
  } catch (err) {
    console.error('initClientIds failed:', err);
  }
}
