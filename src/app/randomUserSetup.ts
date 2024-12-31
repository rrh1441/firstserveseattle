// src/app/randomUserSetup.ts (FULL FILE - optional name)

"use client"

import { useEffect } from "react"

// This ensures each browser has a persistent random userId in localStorage
export function useRandomUserId() {
  useEffect(() => {
    let userId = localStorage.getItem("userId")
    if (!userId) {
      userId = crypto.randomUUID()
      localStorage.setItem("userId", userId)
    }
  }, [])
}

