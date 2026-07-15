'use client'

import { GalleryVerticalEnd } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cn } from "@/lib/utils"
import { createClient } from '@/lib/client'
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordStrengthInput } from "@/components/password-strength-input"
import Link from 'next/link'

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push('/home')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleUpdatePassword}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
            </Link>
            <h1 className="text-xl font-bold">Update Password</h1>
            <FieldDescription>Please enter your new password below.</FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <PasswordStrengthInput
              id="password"
              placeholder="New password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showStrengthIndicator={true}
            />
          </Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Field>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save new password'}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
