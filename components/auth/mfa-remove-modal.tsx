"use client"

import { useState, useMemo } from "react"
import { ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/client"
import { OTPInput, type OTPStatus } from "@/components/motion/otp-input"
import { Button } from "@/components/motion/button/base"
import { ConfirmModal } from "@/components/confirm-modal"
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
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const handleVerify = async (code: string) => {
    if (!factorId) return
    setIsVerifying(true)
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
      setIsVerifying(false)

    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus('error')
      setIsVerifying(false)
    } 
  }

  const handleRemove = async () => {
    if (!factorId) return
    setIsRemoving(true)

    try {
      const unenroll = await supabase.auth.mfa.unenroll({ factorId })
      if (unenroll.error) throw unenroll.error

      onRemoved()
      setConfirmOpen(false)
      onOpenChange(false)
      setIsRemoving(false)
    } catch (err: any) {
      setErrorMsg(err.message)
      setIsRemoving(false)
    }
  }

  return (
    <>
      <CenterMorphModal open={open} onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) {
          setVerifyCode('')
          setStatus('idle')
          setErrorMsg('')
        }
      }}>
        <CenterMorphModalContent ariaLabel="Remove MFA" className="w-full max-w-sm bg-card p-6 border-border/50">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">Remove Authenticator</h2>
              <p className="text-[13px] text-muted-foreground">
                Please enter the 6-digit code from your authenticator app to verify it&apos;s you.
              </p>
            </div>

            <div className="flex justify-center w-full">
              <OTPInput
                label="Verification Code"
                successMessage="Verification successful."
                errorMessage={errorMsg}
                value={verifyCode}
                status={status}
                disabled={isVerifying || isRemoving || !factorId}
                onChange={(v) => {
                  setVerifyCode(v)
                  if (status !== "idle") setStatus("idle")
                }}
                onComplete={handleVerify}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 w-full">
              <CenterMorphModalClose>
                <Button type="button" variant="outline" disabled={isRemoving} className="h-11 rounded-full text-sm font-medium w-full border-border/60 cursor-pointer">
                  Cancel
                </Button>
              </CenterMorphModalClose>
              <Button 
                type="button"
                variant="destructive"
                disabled={isRemoving || status !== 'success'}
                isLoading={isRemoving}
                onClick={() => setConfirmOpen(true)}
                className="h-11 rounded-full text-sm font-medium w-full cursor-pointer"
              >
                Remove
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove authenticator?"
        description="This will disable two-factor authentication on your account."
        confirmText="Remove"
        isLoading={isRemoving}
        onConfirm={handleRemove}
      />
    </>
  ) 
}
