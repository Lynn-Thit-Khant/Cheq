'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { forgotPassword } from '@/app/auth/actions'
import { Button } from "@/components/motion/button/base"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import { BackButton } from '@/components/back-button'
import { Logo } from '@/components/logo'

const formSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Please enter a valid email address."),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.set('email', data.email)

      const result = await forgotPassword(formData)

      if (result && 'error' in result && result.error) {
        form.setError('email', { type: 'manual', message: result.error })
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        throw error
      }
      form.setError('email', { type: 'manual', message: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <BackButton href="/auth/login" className="absolute top-4 left-4 sm:top-6 sm:left-6" />
      <div className={cn("flex flex-col gap-6 px-4 sm:px-0", className)} {...props}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <Logo size="3xl" className="mb-4 sm:mb-5" />
              <h1 className="text-3xl font-bold">Reset Password</h1>
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

            <Field>
              <Button size="lg" type="submit" disabled={isLoading} isLoading={isLoading} className="w-full">
                {isLoading ? 'Sending' : 'Reset password'}
              </Button>
              <div className="text-center mt-6 mb-4">
                <FieldDescription className="text-center">
                  Remember your password? <Link href="/auth/login">Sign in</Link>
                </FieldDescription>
              </div>
            </Field>
          </FieldGroup>
        </form>
    </div>
    </>
  )
}
