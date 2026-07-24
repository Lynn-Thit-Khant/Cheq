 "use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BackButton } from "@/components/back-button"
import { useUser } from "@/components/user-provider"
import { Pencil, Copy, ChevronRight, KeyRound, Lock } from "lucide-react"
import Link from "next/link"
import {
  MorphPopover,
  MorphPopoverContent,
  MorphPopoverTrigger,
} from "@/components/motion/popover-morph"
import { Button } from "@/components/motion/button/base"
import { ActionSwapBlurButton, type ActionSwapItem } from "@/components/motion/action-swap-blur"
import { OTPInput, type OTPStatus } from "@/components/motion/otp-input"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"
import { updateProfileName, updateProfileEmail, updateProfilePassword } from "@/app/auth/actions"
import { PasswordStrengthInput } from "@/components/password-strength-input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalClose,
} from "@/components/motion/center-morph-modal"
import { createClient } from "@/lib/client"
import { MFAEnrollModal } from "@/components/mfa-enroll-modal"
import { MFARemoveModal } from "@/components/mfa-remove-modal"
import { useMemo } from "react"

export default function AccountPage() {
  const { user } = useUser()
  const router = useRouter()
  const userEmail = user?.email || ""
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || ""
  const [nameOpen, setNameOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [mfaPopoverOpen, setMfaPopoverOpen] = useState(false)
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [mfaRemoveModalOpen, setMfaRemoveModalOpen] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [enrolledFactorId, setEnrolledFactorId] = useState<string | null>(null)
  
  const anyOpen = nameOpen || emailOpen || passwordOpen || mfaPopoverOpen;
  const [backdropActive, setBackdropActive] = useState(false);

  useEffect(() => {
    if (anyOpen) {
      setBackdropActive(true);
    } else {
      const timer = setTimeout(() => {
        setBackdropActive(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [anyOpen]);
  
  // Inline MFA states for password update
  const [passwordStep, setPasswordStep] = useState<'input' | 'mfa'>('input')
  const [passwordTotpCode, setPasswordTotpCode] = useState('')
  const [passwordTotpStatus, setPasswordTotpStatus] = useState<OTPStatus>("idle")
  const [passwordTotpError, setPasswordTotpError] = useState('')
  
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (!error && data?.totp?.length > 0) {
        const verifiedFactor = data.totp.find(f => f.status === 'verified')
        if (verifiedFactor) {
          setMfaEnabled(true)
          setEnrolledFactorId(verifiedFactor.id)
        }
      }
    })()
  }, [supabase])
  
  const [newName, setNewName] = useState(userName)
  const [newEmail, setNewEmail] = useState(userEmail)
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [copyState, setCopyState] = useState<string>("copy")

  const [emailStep, setEmailStep] = useState<'input' | 'verify' | 'mfa'>('input')
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("")
  const [emailOtpCode, setEmailOtpCode] = useState("")
  const [emailOtpStatus, setEmailOtpStatus] = useState<OTPStatus>("idle")
  const [emailOtpError, setEmailOtpError] = useState("")
  const [emailMfaStatus, setEmailMfaStatus] = useState<OTPStatus>("idle")
  const [emailMfaError, setEmailMfaError] = useState("")

  useEffect(() => {
    setNewName(userName)
  }, [userName])

  useEffect(() => {
    setNewEmail(userEmail)
  }, [userEmail])

  const handleSaveName = async () => {
    if (!newName.trim() || newName === userName) {
      setNameModalOpen(false)
      return
    }
    setIsSaving(true)
    const formData = new FormData()
    formData.append('name', newName)
    const res = await updateProfileName(formData)
    setIsSaving(false)
    if ('error' in res) {

    } else {
      setNameModalOpen(false)
      router.refresh()
    }
  }

  const handleNextEmail = async () => {
    if (!newEmail.trim() || newEmail === userEmail) {
      setEmailModalOpen(false)
      return
    }
    setIsSavingEmail(true)
    const formData = new FormData()
    formData.append('email', newEmail)
    const res = await updateProfileEmail(formData)
    setIsSavingEmail(false)
    if ('error' in res) {

    } else {
      setEmailStep('verify')
    }
  }

  const handleVerifyEmail = async () => {
    setIsSavingEmail(true)
    setEmailOtpError('')
    setEmailOtpStatus('idle')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: emailCurrentPassword
    })

    if (signInError) {
       setEmailOtpError("Incorrect current password.")
       setEmailOtpStatus("error")
       setIsSavingEmail(false)
       return
    }

    const { error: otpError } = await supabase.auth.verifyOtp({
       email: newEmail,
       token: emailOtpCode,
       type: 'email_change'
    })

    if (otpError) {
       setEmailOtpError("Invalid verification code.")
       setEmailOtpStatus("error")
       setIsSavingEmail(false)
       return
    }

    if (mfaEnabled) {
      setEmailStep('mfa')
    } else {
      setEmailSuccess(true)
    }
    setIsSavingEmail(false)
  }

  const handleVerifyEmailMfa = async (code: string) => {
      setEmailMfaError('')
      setEmailMfaStatus('idle')

      try {
        const challenge = await supabase.auth.mfa.challenge({ factorId: enrolledFactorId! })
        if (challenge.error) throw challenge.error

        const verify = await supabase.auth.mfa.verify({
          factorId: enrolledFactorId!,
          challengeId: challenge.data.id,
          code,
        })
        
        if (verify.error) throw verify.error
        
        setEmailMfaStatus('success')
        setTimeout(() => setEmailSuccess(true), 1000)
      } catch (err: any) {
        setEmailMfaError(err.message || "Failed to verify code")
        setEmailMfaStatus('error')
      }
  }

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      return
    }

    if (mfaEnabled && passwordStep === 'input') {
      setPasswordStep('mfa')
      return
    }

    if (mfaEnabled && passwordStep === 'mfa') {
      setIsSavingPassword(true)
      setPasswordTotpError('')
      setPasswordTotpStatus('idle')

      try {
        const challenge = await supabase.auth.mfa.challenge({ factorId: enrolledFactorId! })
        if (challenge.error) throw challenge.error

        const verify = await supabase.auth.mfa.verify({
          factorId: enrolledFactorId!,
          challengeId: challenge.data.id,
          code: passwordTotpCode,
        })
        
        if (verify.error) throw verify.error
        
        setPasswordTotpStatus('success')
      } catch (err: any) {
        setPasswordTotpError(err.message || "Failed to verify code")
        setPasswordTotpStatus('error')
        setIsSavingPassword(false)
        return
      }
    }

    setIsSavingPassword(true)
    const formData = new FormData()
    formData.append('current_password', currentPassword)
    formData.append('password', newPassword)
    const res = await updateProfilePassword(formData)
    setIsSavingPassword(false)
    if ('error' in res) {
      if (mfaEnabled) {
        setPasswordTotpStatus('error')
        setPasswordTotpError(res.error as string)
      }
    } else {
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordStep('input')
      setPasswordTotpCode('')
    }
  }

  const COPY_ITEMS: ActionSwapItem[] = [
    {
      id: "copy",
      label: "Copy Email",
      icon: <Copy className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      id: "copied",
      label: "Copied!",
      icon: <Check className="h-4 w-4" strokeWidth={1.5} />,
    },
  ]

  return (
    <>
    {/* Full screen backdrop for Telegram effect */}
    <div 
      className={`fixed inset-0 z-[55] bg-black/60 backdrop-blur-lg transition-opacity duration-300 ${anyOpen ? 'opacity-100' : 'opacity-0'} ${backdropActive ? 'pointer-events-auto' : 'pointer-events-none'}`} 
      onPointerDown={(e) => { 
        e.preventDefault();
        setNameOpen(false); 
        setEmailOpen(false); 
        setPasswordOpen(false); 
        setMfaPopoverOpen(false); 
      }}
      onTouchStart={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />

    <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
        <BackButton href="/settings" />
        <h1 className="text-2xl font-bold text-center">Account</h1>
        <div />
      </div>

      <div className="flex-1 flex flex-col justify-start w-full mt-6">

      <div className="flex flex-col gap-4 w-full relative">
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[28px] border border-border/40 pointer-events-none" />
        <div className="flex flex-col p-1">
            <MorphPopover open={nameOpen} onOpenChange={setNameOpen}>
              <MorphPopoverTrigger>
                <button type="button" className={`flex w-full items-center justify-between h-14 px-6 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[28px] outline-none ${nameOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}>
                  <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Name</span>
                  <span className="text-[15px] font-medium text-foreground text-right">{userName}</span>
                </button>
              </MorphPopoverTrigger>
              <MorphPopoverContent align="end" sideOffset={0} radius={999} unstyled className="w-auto p-4 -mr-4">
                <div className="rounded-full bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setNameOpen(false)
                      setNameModalOpen(true)
                    }}
                    className="w-full justify-start font-medium text-foreground h-11"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    Edit Name
                  </Button>
                </div>
              </MorphPopoverContent>
            </MorphPopover>

            <MorphPopover open={emailOpen} onOpenChange={setEmailOpen}>
              <MorphPopoverTrigger>
                <button type="button" className={`flex w-full items-center justify-between h-14 px-6 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[28px] outline-none ${emailOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}>
                  <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Email</span>
                  <span className="text-[15px] font-medium text-foreground text-right break-all">{userEmail}</span>
                </button>
              </MorphPopoverTrigger>
              <MorphPopoverContent align="end" sideOffset={0} radius={999} unstyled className="w-auto p-4 -mr-4">
                <div className="rounded-[32px] bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden flex flex-col p-1.5 gap-0.5">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setEmailOpen(false)
                      setEmailSuccess(false)
                      setEmailModalOpen(true)
                    }}
                    className="w-full justify-start font-medium text-foreground rounded-[26px] h-11"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    Edit Email
                  </Button>
                  <ActionSwapBlurButton
                    items={COPY_ITEMS}
                    value={copyState}
                    variant="ghost"
                    size="lg"
                    cycle={false}
                    onClick={() => {
                      if (copyState === "copied") return;
                      navigator.clipboard.writeText(userEmail)
                      setCopyState("copied")
                      setTimeout(() => {
                        setCopyState("copy")
                      }, 2000)
                    }}
                    className="w-full justify-start font-medium text-foreground rounded-[26px] h-11"
                  />
                </div>
              </MorphPopoverContent>
            </MorphPopover>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full relative mt-4">
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[28px] border border-border/40 pointer-events-none" />
        <div className="flex flex-col p-1">
            <MorphPopover open={passwordOpen} onOpenChange={setPasswordOpen}>
              <MorphPopoverTrigger>
                <button type="button" className={`flex w-full items-center justify-between h-14 px-6 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[28px] outline-none ${passwordOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}>
                  <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Password</span>
                  <span className="text-[15px] font-medium text-foreground text-right tracking-[0.2em] relative top-[2px]">••••••••</span>
                </button>
              </MorphPopoverTrigger>
              <MorphPopoverContent align="end" sideOffset={0} radius={999} unstyled className="w-auto p-4 -mr-4">
                <div className="rounded-[32px] bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden flex flex-col p-1.5 gap-0.5">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setPasswordOpen(false)
                      setPasswordSuccess(false)
                      setPasswordModalOpen(true)
                    }}
                    className="w-full justify-start font-medium text-foreground rounded-[26px] h-11"
                  >
                    <Lock className="h-4 w-4" strokeWidth={1.5} />
                    Edit Password
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      router.push('/auth/forgot-password')
                    }}
                    className="w-full justify-start font-medium text-foreground rounded-[26px] h-11"
                  >
                    <KeyRound className="h-4 w-4" strokeWidth={1.5} />
                    Forgot password
                  </Button>
                </div>
              </MorphPopoverContent>
            </MorphPopover>
            <MorphPopover open={mfaPopoverOpen} onOpenChange={setMfaPopoverOpen}>
              <MorphPopoverTrigger>
                <button 
                  type="button" 
                  className={`flex w-full items-center justify-between h-14 px-6 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[28px] outline-none ${mfaPopoverOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}
                >
                  <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Multi-factor authentication</span>
                  {mfaEnabled ? (
                    <span className="text-[13px] text-green-500 font-medium">Enabled</span>
                  ) : (
                    <span className="text-[13px] text-muted-foreground/60">Not setup</span>
                  )}
                </button>
              </MorphPopoverTrigger>
              <MorphPopoverContent align="end" sideOffset={0} radius={999} unstyled className="w-auto p-4 -mr-4">
                <div className="rounded-full bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setMfaPopoverOpen(false)
                      if (!mfaEnabled) {
                        setMfaModalOpen(true)
                      } else {
                        setMfaRemoveModalOpen(true)
                      }
                    }}
                    className="w-full justify-start font-medium text-foreground h-11"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    {mfaEnabled ? "Remove MFA" : "Setup MFA"}
                  </Button>
                </div>
              </MorphPopoverContent>
            </MorphPopover>
            <div className="flex w-full items-center justify-between px-6 py-3 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[28px] outline-none z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10">
              <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Passkeys</span>
              <span className="text-[13px] text-muted-foreground/60">Coming soon</span>
            </div>
        </div>
      </div>
      </div>
    </div>

    <CenterMorphModal open={nameModalOpen} onOpenChange={setNameModalOpen}>
      <CenterMorphModalContent ariaLabel="Edit Name" className="w-full max-w-sm bg-card p-6 border-border/50">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Edit Name</h2>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="Your name"
                className="w-full bg-card"
              />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-3">
            <CenterMorphModalClose>
              <Button variant="ghost" disabled={isSaving}>Cancel</Button>
            </CenterMorphModalClose>
            <Button onClick={handleSaveName} disabled={isSaving || !newName.trim()}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>

    <CenterMorphModal 
      open={emailModalOpen} 
      onOpenChange={(open) => {
        setEmailModalOpen(open)
        if (!open) {
          setEmailStep('input')
          setEmailCurrentPassword('')
          setEmailOtpCode('')
          setEmailOtpStatus('idle')
          setEmailOtpError('')
          setEmailMfaStatus('idle')
          setEmailMfaError('')
        }
      }}
    >
      <CenterMorphModalContent ariaLabel="Edit Email" className="w-full max-w-sm bg-card p-6 border-border/50">
        {emailSuccess ? (
          <div className="flex flex-col gap-3 text-center pb-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Email updated</h2>
            <p className="text-sm text-muted-foreground">
              Your email address has been successfully changed.
            </p>
          </div>
        ) : emailStep === 'input' ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center mb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Edit Email</h2>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  placeholder="you@example.com"
                  type="email"
                  className="w-full bg-card"
                />
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-3">
              <CenterMorphModalClose>
                <Button variant="ghost" disabled={isSavingEmail}>Cancel</Button>
              </CenterMorphModalClose>
              <Button onClick={handleNextEmail} disabled={isSavingEmail || !newEmail.trim() || newEmail === userEmail}>
                {isSavingEmail ? "Sending..." : "Next"}
              </Button>
            </div>
          </div>
        ) : emailStep === 'verify' ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 text-center mb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Verify it's you</h2>
              <p className="text-sm text-muted-foreground">
                Please verify your current password and the 6-digit code sent to your new email.
              </p>
            </div>
            <FieldGroup>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Current Password</FieldLabel>
                  <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
                    Forgot password?
                  </Link>
                </div>
                <PasswordStrengthInput 
                  id="email-current-password"
                  placeholder="Current Password"
                  showStrengthIndicator={false}
                  value={emailCurrentPassword} 
                  onChange={(e) => setEmailCurrentPassword(e.target.value)} 
                  required
                />
              </Field>
              <div className="flex justify-center w-full mt-4 mb-2">
                <OTPInput
                  label="Verification Code"
                  successMessage="Verified."
                  errorMessage={emailOtpError || "Invalid code."}
                  value={emailOtpCode}
                  status={emailOtpStatus}
                  onChange={(v) => {
                    setEmailOtpCode(v)
                    if (emailOtpStatus !== 'idle') setEmailOtpStatus('idle')
                  }}
                  onComplete={() => {}}
                />
              </div>
            </FieldGroup>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" disabled={isSavingEmail} onClick={() => setEmailStep('input')}>Back</Button>
              <Button onClick={handleVerifyEmail} disabled={isSavingEmail || !emailCurrentPassword || emailOtpCode.length !== 6}>
                {isSavingEmail ? "Verifying..." : "Update"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 text-center mb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Verify it's you</h2>
              <p className="text-sm text-muted-foreground">
                Please enter the 6-digit code from your authenticator app.
              </p>
            </div>
            <div className="flex justify-center w-full mt-2">
              <OTPInput
                label="Verification Code"
                successMessage="Verified."
                errorMessage={emailMfaError || "Invalid code."}
                value=""
                status={emailMfaStatus}
                onChange={(v) => {
                  if (emailMfaStatus !== 'idle') setEmailMfaStatus('idle')
                }}
                onComplete={handleVerifyEmailMfa}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" disabled={emailMfaStatus === 'success'} onClick={() => setEmailStep('verify')}>Back</Button>
            </div>
          </div>
        )}
      </CenterMorphModalContent>
    </CenterMorphModal>

    <CenterMorphModal 
      open={passwordModalOpen} 
      onOpenChange={(open) => {
        setPasswordModalOpen(open)
        if (!open) {
          setPasswordStep('input')
          setPasswordTotpCode('')
          setPasswordTotpStatus('idle')
          setPasswordTotpError('')
        }
      }}
    >
      <CenterMorphModalContent ariaLabel="Edit Password" className="w-full max-w-sm bg-card p-6 border-border/50">
        {passwordSuccess ? (
          <div className="flex flex-col gap-4 text-center pb-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Password updated</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been successfully changed.
            </p>
          </div>
        ) : passwordStep === 'input' ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col text-center">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Edit Password</h2>
            </div>
            <FieldGroup>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Current Password</FieldLabel>
                  <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
                    Forgot password?
                  </Link>
                </div>
                <PasswordStrengthInput 
                  id="current-password"
                  placeholder="Current Password"
                  showStrengthIndicator={false}
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required
                />
              </Field>
              <Field>
                <FieldLabel>New Password</FieldLabel>
                <PasswordStrengthInput 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Enter new password"
                  className="w-full bg-card"
                />
              </Field>
              <Field>
                <FieldLabel>Confirm Password</FieldLabel>
                <PasswordStrengthInput 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm new password"
                  showStrengthIndicator={false}
                  className="w-full bg-card"
                />
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-3">
              <CenterMorphModalClose>
                <Button variant="ghost" disabled={isSavingPassword}>Cancel</Button>
              </CenterMorphModalClose>
              <Button onClick={handleSavePassword} disabled={isSavingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                {mfaEnabled ? "Next" : (isSavingPassword ? "Saving..." : "Update")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Verify it's you</h2>
              <p className="text-sm text-muted-foreground">
                Please enter the 6-digit code from your authenticator app.
              </p>
            </div>
            <div className="flex justify-center w-full">
              <OTPInput
                label="Verification Code"
                successMessage="Verified."
                errorMessage={passwordTotpError || "Invalid code."}
                value={passwordTotpCode}
                status={passwordTotpStatus}
                disabled={isSavingPassword}
                onChange={(v) => {
                  setPasswordTotpCode(v)
                  if (passwordTotpStatus !== "idle") setPasswordTotpStatus("idle")
                }}
                onComplete={() => {}}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setPasswordStep('input')} disabled={isSavingPassword}>Back</Button>
              <Button onClick={handleSavePassword} disabled={isSavingPassword || passwordTotpCode.length < 6 || passwordTotpStatus === 'success'}>
                {isSavingPassword ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        )}
      </CenterMorphModalContent>
    </CenterMorphModal>

    <MFAEnrollModal 
      open={mfaModalOpen} 
      onOpenChange={setMfaModalOpen} 
      onEnrolled={(id) => {
        setMfaEnabled(true)
        setEnrolledFactorId(id)
      }} 
    />

    <MFARemoveModal
      open={mfaRemoveModalOpen}
      onOpenChange={setMfaRemoveModalOpen}
      factorId={enrolledFactorId}
      onRemoved={() => {
        setMfaEnabled(false)
        setEnrolledFactorId(null)
      }}
    />
    </>
  )
}
