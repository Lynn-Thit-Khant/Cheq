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
  const [isVerifying, setIsVerifying] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!open) return

    // Start enrollment when opened
    ;(async () => {
      // 1. Cleanup unverified factors to avoid hitting the factor limit
      const { data: listData } = await supabase.auth.mfa.listFactors()
      if (listData?.totp) {
        for (const factor of listData.totp) {
          if ((factor.status as string) === 'unverified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id })
          }
        }
      }

      // 2. Enroll new factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Cheq',
        friendlyName: `Authenticator ${new Date().getTime().toString().slice(-4)}`,
      })
      if (error) {
        setErrorMsg(error.message)
        setStatus('error')
        return
      }

      setFactorId(data.id)
      setQR(data.totp.qr_code)
    })()
  }, [open, supabase])

  const handleVerify = async (code: string) => {
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
      setErrorMsg(err.message || "Failed to verify code")
      setStatus('error')
      setIsVerifying(false)
    } 
  }

  return (
    <CenterMorphModal open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) {
        setVerifyCode('')
        setStatus('idle')
        setErrorMsg('')
      }
    }}>
      <CenterMorphModalContent ariaLabel="Enroll MFA" className="w-full max-w-sm bg-card p-6 border-border/50">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Setup Authenticator</h2>
            <p className="text-sm text-muted-foreground">
              Scan the QR code below with your authenticator app.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-black/5">
              {qr ? (
                <img 
                  src={qr} 
                  alt="Authenticator QR Code" 
                  className="w-48 h-48 object-contain" 
                />
              ) : errorMsg && !qr ? (
                <div className="w-48 h-48 flex items-center justify-center text-center p-2">
                  <span className="text-sm text-destructive">{errorMsg}</span>
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center w-full">
            <OTPInput
              label="Verification Code"
              successMessage="Verification successful."
              errorMessage={errorMsg || "Invalid code, please try again."}
              value={verifyCode}
              status={status}
              disabled={isVerifying || !qr}
              onChange={(v) => {
                setVerifyCode(v)
                if (status !== "idle") setStatus("idle")
              }}
              onComplete={handleVerify}
            />
          </div>

          <div className="mt-2 flex justify-end gap-3 w-full">
            <CenterMorphModalClose>
              <Button variant="ghost" disabled={isVerifying}>Cancel</Button>
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
