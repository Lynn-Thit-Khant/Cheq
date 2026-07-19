'use client'


import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { createClient } from '@/lib/client'
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import { PasswordStrengthInput } from "@/components/password-strength-input"


const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  repeatPassword: z.string().min(1, "Please repeat your new password."),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Passwords do not match.",
  path: ["repeatPassword"],
})

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      repeatPassword: "",
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      
      // Sign the user out so they have to log in with their new password
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Update Password</h1>
            <FieldDescription>Please enter your new password below.</FieldDescription>
          </div>
          
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <PasswordStrengthInput
                  {...field}
                  id="password"
                  placeholder="New password"
                  showStrengthIndicator={true}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="repeatPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="repeat-password">Repeat Password</FieldLabel>
                <PasswordStrengthInput
                  {...field}
                  id="repeat-password"
                  placeholder="Repeat new password"
                  showStrengthIndicator={false}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save new password'}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
