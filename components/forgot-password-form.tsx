'use client'

import { GalleryVerticalEnd } from "lucide-react"
import { useState } from 'react'

import { cn } from "@/lib/utils"
import { forgotPassword } from '@/app/auth/actions'
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from 'next/link'

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set('email', email)

      const result = await forgotPassword(formData)

      if (result && 'error' in result && result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Check Your Email</h1>
            <FieldDescription>Password reset instructions sent.</FieldDescription>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-4">
            If you registered using your email and password, you will receive a password reset email.
          </p>
        </FieldGroup>
      ) : (
        <form onSubmit={handleForgotPassword}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <Link href="/" className="flex flex-col items-center gap-2 font-medium">
                <span className="sr-only">Acme Inc.</span>
              </Link>
              <h1 className="text-xl font-bold">Reset Password</h1>
              <FieldDescription>
                Remember your password? <Link href="/auth/login">Sign in</Link>
              </FieldDescription>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Field>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset email'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}
    </div>
  )
}
