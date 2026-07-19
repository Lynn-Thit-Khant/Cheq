'use client'

import { GalleryVerticalEnd } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cn } from "@/lib/utils"
import { login } from '@/app/auth/actions'
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordStrengthInput } from "@/components/password-strength-input"
import Link from 'next/link'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setIsLoading(true)
    setError(null)

    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch (error: any) {
      if (error?.message?.includes('NEXT_REDIRECT')) {
        throw error
      }
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleLogin}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <span className="sr-only">Acme Inc.</span>
            </Link>
            <h1 className="text-xl font-bold">Welcome back</h1>
            <FieldDescription>
              Don&apos;t have an account? <Link href="/auth/sign-up">Sign up</Link>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link href="/auth/forgot-password" className="text-sm underline-offset-4 hover:underline">
                Forgot your password?
              </Link>
            </div>
            <PasswordStrengthInput
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showStrengthIndicator={false}
            />
          </Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Field>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </Field>

        </FieldGroup>
      </form>
    </div>
  )
}
