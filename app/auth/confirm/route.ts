import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const _next = searchParams.get('next')

  // Prevent open redirect: must start with '/', must NOT start with '//' (protocol-relative),
  // and must not contain backslashes (which some browsers interpret as forward slashes).
  const isSafeRedirect = _next && _next.startsWith('/') && !_next.startsWith('//') && !_next.includes('\\')
  const next = isSafeRedirect ? _next : '/home' // default to home after confirmation

  const supabase = await createClient()

  // Scenario 1: Default Supabase email templates (PKCE flow)
  // The user clicks the link, Supabase verifies it, and redirects here with a `code`.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (next.startsWith('/auth/login')) {
        await supabase.auth.signOut()
      }
      revalidatePath('/', 'layout')
      redirect(next)
    } else {
      redirect(`/auth/error?error=${error.message}`)
    }
  }

  // Scenario 2: Custom email templates
  // The user clicks the link, it points directly here with a `token_hash` and `type`.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      if (next.startsWith('/auth/login')) {
        await supabase.auth.signOut()
      }
      revalidatePath('/', 'layout')
      redirect(next)
    } else {
      redirect(`/auth/error?error=${error.message}`)
    }
  }

  // If neither are present, show a generic error
  redirect(`/auth/error?error=Invalid confirmation link`)
}
