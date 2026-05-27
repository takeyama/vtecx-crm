'use client'

import { createContext, useContext } from 'react'
import { MyInfo } from '@/app/(page)/settings/fetcher'

interface AuthContextValue {
  info: MyInfo | null
}

const AuthContext = createContext<AuthContextValue>({ info: null })

export const AuthProvider = AuthContext.Provider

export const useAuthContext = () => useContext(AuthContext)
