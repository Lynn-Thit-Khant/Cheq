import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { FieldGroup, FieldDescription } from '@/components/ui/field'

export default async function ErrorPage({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams
  
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
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-6 px-4 sm:px-0">
      <FieldGroup>
        <div className="flex flex-col items-center gap-3 text-center">

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <FieldDescription className="text-base text-center">
            {description}
          </FieldDescription>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Link href="/auth/forgot-password" className={buttonVariants({ className: 'w-full' })}>
            Request a new link
          </Link>
          <Link href="/auth/login" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
            Back to Sign in
          </Link>
        </div>
      </FieldGroup>
    </div>
  )
}
