'use client'

import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { signup } from '@/app/auth/actions'
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordStrengthInput, validatePassword } from "@/components/password-strength-input"
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").refine(validatePassword, "Please ensure all password requirements are met."),
  repeatPassword: z.string().min(1, "Please repeat your password."),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Passwords do not match.",
  path: ["repeatPassword"],
})

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      repeatPassword: "",
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('repeat-password', data.repeatPassword)

    try {
      const result = await signup(formData)
      if (result?.error) {
        let errorMessage = typeof result.error === 'string' && result.error !== '{}' 
          ? result.error 
          : 'Something went wrong. If you just configured custom SMTP, check your credentials.'
          
        if (errorMessage.startsWith('Password should contain')) {
          errorMessage = 'Please ensure all password requirements are met.'
        }
          
        form.setError('password', { type: 'manual', message: errorMessage })
        form.setError('repeatPassword', { type: 'manual', message: errorMessage })
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        throw error
      }
      let errorMessage = error instanceof Error ? error.message : 'An error occurred'
      
      if (errorMessage.startsWith('Password should contain')) {
        errorMessage = 'Please ensure all password requirements are met.'
      }

      form.setError('password', { type: 'manual', message: errorMessage })
      form.setError('repeatPassword', { type: 'manual', message: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 px-4 sm:px-0", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">Create an account</h1>
            <FieldDescription>
              Already have an account? <Link href="/auth/login">Sign in</Link>
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
          
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordStrengthInput
                  {...field}
                  id="password"
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
                  showStrengthIndicator={false}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </Field>

        </FieldGroup>
      </form>
    </div>
  )
}
