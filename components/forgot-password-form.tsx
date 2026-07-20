'use client'


import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { forgotPassword } from '@/app/auth/actions'
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Please enter a valid email address."),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set('email', data.email)

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
    <div className={cn("flex flex-col gap-6 px-4 sm:px-0", className)} {...props}>
      {success ? (
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">Check Your Email</h1>
            <FieldDescription>Password reset instructions sent.</FieldDescription>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-4">
            If you registered using your email and password, you will receive a password reset email.
          </p>
        </FieldGroup>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-3xl font-bold">Reset Password</h1>
              <FieldDescription>
                Remember your password? <Link href="/auth/login">Sign in</Link>
              </FieldDescription>
            </div>
            
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}
            <Field>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Sending...' : 'Reset password'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}
    </div>
  )
}
