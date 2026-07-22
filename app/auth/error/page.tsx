import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { FieldGroup, FieldDescription } from '@/components/ui/field'

export default async function ErrorPage({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams

  return (
    <div className="w-full max-w-sm flex flex-col gap-6 px-4 sm:px-0">
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold">Authentication Error</h1>
          <FieldDescription>
            {params?.error ? params.error : 'An unspecified error occurred. Your link might be expired or invalid.'}
          </FieldDescription>
        </div>

        <div className="flex flex-col gap-4 mt-2">
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
