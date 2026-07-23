"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"
import { useMemo } from "react"
import { OTPInput, type OTPStatus } from "@/components/motion/otp-input"
import { Button } from "@/components/motion/button/base"
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalClose,
} from "@/components/motion/center-morph-modal"

export function MFAEnrollModal({
  open,
  onOpenChange,
  onEnrolled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnrolled: (factorId: string) => void
}) {
  const [factorId, setFactorId] = useState('')
  const [qr, setQR] = useState('') 
  const [verifyCode, setVerifyCode] = useState('')
  const [status, setStatus] = useState<OTPStatus>("idle")
  const [errorMsg, setErrorMsg] = useState('')
  const [isEnrolling, setIsEnrolling] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!open) {
      // Reset state when closed
      setVerifyCode('')
      setStatus('idle')
      setErrorMsg('')
      return
    }

    // Start enrollment when opened
    ;(async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })
      if (error) {
        setErrorMsg(error.message)
        return
      }

      setFactorId(data.id)
      setQR(data.totp.qr_code)
    })()
  }, [open, supabase])

  const handleVerify = async (code: string) => {
    setIsEnrolling(true)
    setErrorMsg('')
    setStatus('idle')

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) throw challenge.error

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      })
      if (verify.error) throw verify.error

      setStatus('success')
      setIsEnrolling(false)

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify code")
      setStatus('error')
      setIsEnrolling(false)
    } 
  }

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="Enroll MFA" className="w-full max-w-sm bg-card p-6 border-border/50">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-center sm:text-left pr-8">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Setup Authenticator</h2>
            <p className="text-sm text-muted-foreground">
              Scan the QR code below with your authenticator app (like Google Authenticator), then enter the code to verify.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="bg-white rounded-3xl p-4">
              {qr ? (
                <img 
                  src={qr} 
                  alt="Authenticator QR Code" 
                  className="w-48 h-48 object-contain" 
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>

          <OTPInput
            label="Verification Code"
            successMessage="Verified."
            errorMessage={errorMsg || "Invalid code, please try again."}
            value={verifyCode}
            status={status}
            disabled={isEnrolling || !qr}
            onChange={(v) => {
              setVerifyCode(v)
              if (status !== "idle") setStatus("idle")
            }}
            onComplete={handleVerify}
          />

          <div className="mt-2 flex justify-end gap-3">
            <CenterMorphModalClose>
              <Button variant="ghost" disabled={isEnrolling}>Cancel</Button>
            </CenterMorphModalClose>
            <Button 
              variant="primary"
              disabled={status !== 'success'}
              onClick={() => {
                onEnrolled(factorId)
                onOpenChange(false)
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
