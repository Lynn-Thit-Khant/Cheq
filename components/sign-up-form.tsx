'use client'

import { GalleryVerticalEnd } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cn } from "@/lib/utils"
import { signup } from '@/app/auth/actions'
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

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const result = await signup(formData)
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
      <form onSubmit={handleSignUp}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <span className="sr-only">Acme Inc.</span>
            </Link>
            <h1 className="text-xl font-bold">Create an account</h1>
            <FieldDescription>
              Already have an account? <Link href="/auth/login">Sign in</Link>
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
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordStrengthInput
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showStrengthIndicator={true}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="repeat-password">Repeat Password</FieldLabel>
            <PasswordStrengthInput
              id="repeat-password"
              name="repeat-password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              showStrengthIndicator={false}
            />
          </Field>
          {error && (
            <p className="text-sm text-red-500">
              {typeof error === 'string' && error !== '{}' 
                ? error 
                : 'Something went wrong. If you just configured custom SMTP, check your credentials.'}
            </p>
          )}
          <Field>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </Field>

        </FieldGroup>
      </form>
    </div>
  )
}
