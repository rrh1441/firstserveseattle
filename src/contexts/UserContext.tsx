// Create a new file: src/contexts/UserContext.tsx
'use client'
import { createContext, useContext } from 'react'

const UserContext = createContext<{ userId: string | null }>({ userId: null })

export const useUser = () => useContext(UserContext)
export const UserProvider = UserContext.Provider