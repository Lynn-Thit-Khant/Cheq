import { AuthMFAForm } from "@/components/auth/auth-mfa-form"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"

export default async function MFAPage(props: { searchParams: Promise<{ next?: string }> }) {
  const searchParams = await props.searchParams;
  const nextUrl = searchParams.next?.startsWith('/') ? searchParams.next : '/home'
  const supabase = await createClient()
  
  // Verify user is actually logged in first (aal1 is required to do aal2 check)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Ensure they actually need MFA
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || (data.nextLevel === data.currentLevel)) {
    redirect(nextUrl)
  }

  return <AuthMFAForm />
}
