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

export function MFARemoveModal({
  open,
  onOpenChange,
  factorId,
  onRemoved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  factorId: string | null
  onRemoved: () => void
}) {
  const [verifyCode, setVerifyCode] = useState('')
  const [status, setStatus] = useState<OTPStatus>("idle")
  const [errorMsg, setErrorMsg] = useState('')
  const [isRemoving, setIsRemoving] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!open) {
      // Reset state when closed
      setVerifyCode('')
      setStatus('idle')
      setErrorMsg('')
    }
  }, [open])

  const handleVerify = async (code: string) => {
    if (!factorId) return
    setIsRemoving(true)
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
      setIsRemoving(false)

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify code")
      setStatus('error')
      setIsRemoving(false)
    } 
  }

  const handleRemove = async () => {
    if (!factorId) return
    setIsRemoving(true)

    try {
      const unenroll = await supabase.auth.mfa.unenroll({ factorId })
      if (unenroll.error) throw unenroll.error

      onRemoved()
      onOpenChange(false)
      setIsRemoving(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove authenticator")
      setIsRemoving(false)
    }
  }

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="Remove MFA" className="w-full max-w-sm bg-card p-6 border-border/50">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-center sm:text-left pr-8">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Remove Authenticator</h2>
            <p className="text-sm text-muted-foreground">
              Please enter the 6-digit code from your authenticator app to confirm you want to remove it.
            </p>
          </div>

          <div className="flex justify-center w-full">
            <OTPInput
              label="Verification Code"
              successMessage="Verified."
              errorMessage={errorMsg || "Invalid code, please try again."}
              value={verifyCode}
              status={status}
              disabled={isRemoving || !factorId}
              onChange={(v) => {
                setVerifyCode(v)
                if (status !== "idle") setStatus("idle")
              }}
              onComplete={handleVerify}
            />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <CenterMorphModalClose>
              <Button variant="ghost" disabled={isRemoving}>Cancel</Button>
            </CenterMorphModalClose>
            <Button 
              variant="destructive"
              disabled={isRemoving || status !== 'success'}
              onClick={handleRemove}
            >
              Remove
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  ) 
}
