import { UpdatePasswordForm } from "@/components/auth/update-password-form"
import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'

export default async function UpdatePasswordPage() {
  // Verify the user has an active session (created by the password reset link).
  // Without this check, anyone can navigate to /auth/update-password directly.
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (!mfaError && mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
    redirect('/auth/mfa?next=/auth/update-password')
  }

  return (
    <div className="w-full max-w-sm">
      <UpdatePasswordForm />
    </div>
  )
}
