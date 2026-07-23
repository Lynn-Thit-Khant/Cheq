'use server'

import { revalidatePath } from 'next/cache'
import { redirect, RedirectType } from 'next/navigation'
import { headers } from 'next/headers'

import { createClient } from '@/lib/server'

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter for auth actions.
// In production, swap this for a Redis-backed solution or Upstash rate-limit.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 10      // max attempts per window

function checkRateLimit(key: string): { limited: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { limited: false }
  }

  entry.count++

  if (entry.count > RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return { limited: true, retryAfterSeconds }
  }

  return { limited: false }
}

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254  // RFC 5321
const MAX_PASSWORD_LENGTH = 128
const MIN_PASSWORD_LENGTH = 8

function validateAuthInput(
  formData: FormData,
  requireName: boolean = false
): { name?: string; email: string; password: string } | { error: string } {
  const rawName = formData.get('name')
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password')

  if (requireName && (typeof rawName !== 'string' || !rawName.trim())) {
    return { error: 'Name is required.' }
  }

  const name = typeof rawName === 'string' ? rawName.trim() : undefined

  if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return { error: 'Email is required.' }
  }

  if (typeof rawPassword !== 'string' || !rawPassword) {
    return { error: 'Password is required.' }
  }

  const email = rawEmail.trim().toLowerCase()
  const password = rawPassword

  if (email.length > MAX_EMAIL_LENGTH) {
    return { error: 'Email address is too long.' }
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.` }
  }

  return { name, email, password }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives the site origin from the incoming request headers.
 * Falls back to NEXT_PUBLIC_SITE_URL env var, then localhost.
 */
async function getSiteUrl(): Promise<string> {
  const headerStore = await headers()
  const origin = headerStore.get('origin')
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host')
  const proto = headerStore.get('x-forwarded-proto') || 'http'

  if (origin) return origin
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

/**
 * Extracts a rate-limit key from the request (IP-based).
 */
async function getRateLimitKey(action: string): Promise<string> {
  const headerStore = await headers()
  const forwarded = headerStore.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return `${action}:${ip}`
}

// ---------------------------------------------------------------------------
// Auth Actions
// ---------------------------------------------------------------------------

export async function login(formData: FormData) {
  // Rate limiting
  const key = await getRateLimitKey('login')
  const { limited, retryAfterSeconds } = checkRateLimit(key)
  if (limited) {
    return { error: `Too many login attempts. Please try again in ${retryAfterSeconds} seconds.` }
  }

  // Input validation (login doesn't require name)
  const validation = validateAuthInput(formData, false)
  if ('error' in validation) {
    return { error: validation.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: validation.email,
    password: validation.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/home', RedirectType.replace)
}

export async function signup(formData: FormData) {
  // Rate limiting
  const key = await getRateLimitKey('signup')
  const { limited, retryAfterSeconds } = checkRateLimit(key)
  if (limited) {
    return { error: `Too many sign-up attempts. Please try again in ${retryAfterSeconds} seconds.` }
  }

  // Input validation (signup requires name)
  const validation = validateAuthInput(formData, true)
  if ('error' in validation) {
    return { error: validation.error }
  }

  const supabase = await createClient()

  const siteUrl = await getSiteUrl()

  const { error } = await supabase.auth.signUp({
    email: validation.email,
    password: validation.password,
    options: {
      data: {
        full_name: validation.name,
      },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/auth/login`
    }
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/auth/sign-up-success', RedirectType.replace)
}

export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut({ scope: 'local' })

  if (error) {
    // Log the error server-side for monitoring, but still proceed with
    // the redirect — the user's intent is to log out.
    console.error('[auth] signOut failed:', error.message)
  }

  // Clears the Next.js router cache for all routes
  revalidatePath('/', 'layout')

  redirect('/auth/login', RedirectType.replace)
}

export async function forgotPassword(formData: FormData) {
  // Rate limiting (stricter for password reset to prevent email bombing)
  const key = await getRateLimitKey('forgot-password')
  const { limited, retryAfterSeconds } = checkRateLimit(key)
  if (limited) {
    return { error: `Too many requests. Please try again in ${retryAfterSeconds} seconds.` }
  }

  const rawEmail = formData.get('email')

  if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return { error: 'Email is required.' }
  }

  const email = rawEmail.trim().toLowerCase()

  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()
  const siteUrl = await getSiteUrl()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
