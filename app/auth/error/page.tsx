'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { FieldGroup, FieldDescription } from '@/components/ui/field'
import { Button } from '@/components/motion/button/base'

export default function ErrorPage({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const router = useRouter()
  const params = use(searchParams)
  
  let title = "Something went wrong"
  let description = "We couldn't verify your link. Please try requesting a new one."

  if (params?.error) {
    const err = params.error.toLowerCase()
    
    if (err.includes('pkce') || err.includes('storage')) {
      title = "Invalid link"
      description = "This link is invalid or could not be verified. Please request a new one below."
    } else if (err.includes('expired') || err.includes('invalid')) {
      title = "This link has expired"
      description = "For your security, sign-in links expire after a short time. Please request a new one."
    } else {
      title = "Authentication Error"
      description = "An error occurred during authentication. Please try again."
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-6 px-4 sm:px-0">
      <FieldGroup>
        <div className="flex flex-col items-center gap-3 text-center">

          <h1 className="text-3xl font-bold">{title}</h1>
          <FieldDescription className="text-base text-center">
            {description}
          </FieldDescription>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Button size="lg" className="w-full" onClick={() => router.push('/auth/forgot-password')}>
            Request a new link
          </Button>
          <Button size="lg" variant="outline" className="w-full" onClick={() => router.push('/auth/login')}>
            Back to Sign in
          </Button>
        </div>
      </FieldGroup>
    </div>
  )
}
