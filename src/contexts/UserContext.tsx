'use client'

import { createContext, useContext } from 'react'

interface UserContextType {
  userId: string | null
}

const UserContext = createContext<UserContextType>({ userId: null })

export const useUser = () => useContext(UserContext)
export const UserProvider = UserContext.Provider