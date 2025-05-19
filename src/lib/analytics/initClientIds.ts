"use client"

import { useEffect } from 'react'

// Declare globals to satisfy TypeScript
declare global {
  interface Window {
    __visitNumber?: number
    __userId?: string
    __abGroup?: 'A' | 'B'
  }
}

export default function InitClientIds() {
  useEffect(() => {
    const visitKey = '_fss_vn'
    const userKey = '_fss_uid'
    const abKey = '_fss_ab'

    let visitCount = parseInt(localStorage.getItem(visitKey) ?? '0', 10)
    if (Number.isNaN(visitCount)) visitCount = 0
    visitCount += 1
    localStorage.setItem(visitKey, String(visitCount))

    let userId = localStorage.getItem(userKey)
    if (!userId) {
      userId = crypto.randomUUID()
      localStorage.setItem(userKey, userId)
    }

    let abGroup = localStorage.getItem(abKey) as 'A' | 'B' | null
    if (abGroup !== 'A' && abGroup !== 'B') {
      abGroup = Math.random() < 0.5 ? 'A' : 'B'
      localStorage.setItem(abKey, abGroup)
    }

    window.__visitNumber = visitCount
    window.__userId = userId
    window.__abGroup = abGroup
  }, [])

  return null
}
