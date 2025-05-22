'use client'

import { useEffect } from 'react'
import { initClientIds } from '@/lib/initClientIds'

export default function ClientIdsInit() {
  useEffect(() => {
    initClientIds()
  }, [])

  return null
}
