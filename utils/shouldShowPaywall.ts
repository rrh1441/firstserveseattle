export function shouldShowPaywall(): boolean {
  if (typeof window === 'undefined') return false

  const visitsRaw = (window as any).__visitNumber
  const groupRaw = (window as any).__abGroup

  if (visitsRaw === undefined || groupRaw === undefined) return false

  const visits = Number(visitsRaw)
  const group = String(groupRaw)

  if (Number.isNaN(visits)) return false

  if (group === 'A') return visits >= 4
  if (group === 'B') return visits >= 8

  return false
}
