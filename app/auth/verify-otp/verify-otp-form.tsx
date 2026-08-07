'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OTPInput, type OTPStatus } from '@/components/motion/otp-input'
import { verifyEmailOtp } from '@/app/auth/actions'
import { FieldGroup } from '@/components/ui/field'
import { BackButton } from '@/components/back-button'
import { Logo } from '@/components/logo'

interface VerifyOTPFormProps {
  email: string
  type: 'signup' | 'recovery'
}

export function VerifyOTPForm({ email, type }: VerifyOTPFormProps) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<OTPStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  
  const router = useRouter()

  const handleComplete = async (code: string) => {
    setStatus('idle')
    setErrorMsg('')
    
    const result = await verifyEmailOtp(email, code, type)
    
    if (result.error) {
      setErrorMsg(result.error)
      setStatus('error')
    } else {
      setStatus('success')
      
      setTimeout(() => {
        if (type === 'signup') {
          router.replace('/home')
        } else {
          router.replace('/auth/update-password')
        }
      }, 800)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="w-full flex items-center justify-start -mb-2">
        <BackButton href="/auth/login" />
      </div>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size="3xl" className="mb-4 sm:mb-5" />
          <h1 className="text-3xl font-bold">Verify Email</h1>
          <p className="text-sm text-muted-foreground">
            Please enter the 6-digit code sent to your email.
          </p>
        </div>

          <div className="flex justify-center w-full mt-2">
            <OTPInput
              label="Verification Code"
              successMessage="Verification successful."
              errorMessage={errorMsg}
              value={value}
              status={status}
              onChange={(v) => {
                setValue(v)
                if (status !== 'idle') setStatus('idle')
              }}
              onComplete={handleComplete}
            />
          </div>
        </FieldGroup>
      </div>
  )
}
