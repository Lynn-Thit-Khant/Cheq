'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'

/**
 * Auth-aware route guard that handles:
 * 1. Back/forward button navigations (popstate) — client-side, middleware doesn't run
 * 2. bfcache restorations — browser restores a stale page snapshot
 * 3. Cross-tab auth changes — login/logout in another tab
 *
 * Uses reactive Supabase auth state instead of a stale server-rendered prop.
 */

const AUTH_PASSTHROUGH_ROUTES = ['/auth/confirm', '/auth/error', '/auth/update-password']

export function UrlSyncGuard({ serverIsLoggedIn }: { serverIsLoggedIn: boolean }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(serverIsLoggedIn)

  // Sync client state with server state (e.g., after Server Action login/logout)
  useEffect(() => {
    setIsAuthenticated(serverIsLoggedIn)
  }, [serverIsLoggedIn])

  // Subscribe to real-time auth state changes (for cross-tab sync)
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const isAuth = !!session?.user
        if (isAuth !== isAuthenticated) {
          setIsAuthenticated(isAuth)
          router.refresh() // Force server re-evaluation on cross-tab change
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [isAuthenticated, router])

  // Prevent back-button from landing on stale auth pages in the history.
  // This prevents the URL from flashing to /auth/login before the server redirects it.
  useEffect(() => {
    if (!isAuthenticated) return

    const handlePopState = () => {
      const path = window.location.pathname
      if (
        path.startsWith('/auth') &&
        !AUTH_PASSTHROUGH_ROUTES.some(route => path.startsWith(route))
      ) {
        // Back-button landed on an auth page — push back to current app route
        window.history.pushState(null, '', '/home')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isAuthenticated])

  // Handle bfcache restoration — browser may restore a completely stale snapshot
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.refresh()
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router])

  return null
}
