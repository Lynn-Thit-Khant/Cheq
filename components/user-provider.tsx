"use client"

import { createContext, useContext, ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import type { User } from "@supabase/supabase-js"

const AUTH_PASSTHROUGH_ROUTES = ['/auth/confirm', '/auth/error', '/auth/update-password', '/auth/forgot-password']

interface UserContextType {
  user: User | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user)

  // Sync client state with server state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(!!user)
  }, [user])

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const isAuth = !!session?.user
      if (isAuth !== isAuthenticated) {
        setIsAuthenticated(isAuth)
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isAuthenticated, router])

  // Prevent back-button from landing on stale auth pages in the history.
  useEffect(() => {
    if (!isAuthenticated) return

    const handlePopState = () => {
      const path = window.location.pathname
      if (
        path.startsWith('/auth') &&
        !AUTH_PASSTHROUGH_ROUTES.some(route => path.startsWith(route))
      ) {
        window.history.replaceState(null, '', '/home')
        window.history.go(0)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isAuthenticated])

  // Handle bfcache restoration
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.refresh()
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router])

  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
