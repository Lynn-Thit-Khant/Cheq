import { AuthMFAForm } from "@/components/auth-mfa-form"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"

export default async function MFAPage() {
  const supabase = await createClient()
  
  // Verify user is actually logged in first (aal1 is required to do aal2 check)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Ensure they actually need MFA
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || (data.nextLevel === data.currentLevel)) {
    redirect('/home')
  }

  return (
    <div className="w-full max-w-sm">
      <AuthMFAForm />
    </div>
  )
}
