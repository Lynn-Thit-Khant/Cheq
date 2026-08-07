import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { createClient } from '@/lib/server'

export default async function ForgotPasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <ForgotPasswordForm defaultEmail={user?.email || ''} />
}
