import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Routes under /auth that authenticated users should still be able to access.
 * These are transient flows (email confirm, password reset) that require an
 * active session but live under the /auth path prefix.
 */
const AUTH_PASSTHROUGH_ROUTES = ['/auth/confirm', '/auth/error', '/auth/update-password', '/auth/forgot-password', '/auth/mfa']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // We use getUser() instead of getSession() to prevent redirect loops.
  // If getSession() is used, it only reads the local cookie. If that cookie is expired
  // or invalid on the Supabase backend, Server Components using getUser() will reject it
  // and redirect to /login, but middleware will see the cookie and redirect back to /home,
  // causing an infinite redirect loop.
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (
    !user &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response
  }

  // If user is already logged in, they shouldn't be on the login/signup page.
  // Redirect them to home — but let them through to passthrough routes like
  // /auth/confirm, /auth/error, /auth/update-password.
  if (
    user &&
    pathname.startsWith('/auth') &&
    !AUTH_PASSTHROUGH_ROUTES.some(route => pathname.startsWith(route))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
