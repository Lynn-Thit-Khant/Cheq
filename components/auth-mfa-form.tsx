"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { OTPInput, type OTPStatus } from "@/components/motion/otp-input"

export function AuthMFAForm() {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<OTPStatus>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [factorId, setFactorId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        // Silent failure or handle via UI if necessary
        return
      }

      const totpFactor = data.totp[0]
      if (totpFactor) {
        setFactorId(totpFactor.id)
      }
    })()
  }, [supabase])

  const handleComplete = async (code: string) => {
    if (!factorId) return
    setStatus("idle")
    setErrorMsg("")
    
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) throw challenge.error

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      })

      if (verify.error) throw verify.error

      setStatus("success")
      
      // Wait for success animation then redirect
      setTimeout(() => {
        router.refresh() // Refreshes server session
        router.replace('/home')
      }, 1000)

    } catch (err: any) {
      // Silent failure or handle via UI if necessary
      setErrorMsg(err.message || "Failed to verify code")
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">Multi-factor Auth</h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      <div className="flex justify-center w-full">
        <OTPInput
          label="Verification Code"
          successMessage="Verified."
          errorMessage={errorMsg || "Invalid code, please try again."}
          value={value}
          status={status}
          onChange={(v) => {
            setValue(v)
            if (status !== "idle") setStatus("idle")
          }}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
