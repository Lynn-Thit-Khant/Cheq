'use client'

import { useRouter } from 'next/navigation'
import { FieldGroup, FieldDescription } from "@/components/ui/field"
import { Button } from "@/components/motion/button/base"

export default function SignUpSuccessPage() {
  const router = useRouter()
  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">Registration Successful</h1>
            <FieldDescription className="text-center">
              Check your email to verify your account.
            </FieldDescription>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <Button size="lg" className="w-full" onClick={() => router.push('/auth/login')}>
              Back to Sign in
            </Button>
          </div>
        </FieldGroup>
      </div>
    </div>
  )
}

