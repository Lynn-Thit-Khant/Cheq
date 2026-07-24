import { LoginForm } from "@/components/auth/login-form"
import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error && error.message !== 'Auth session missing!') {
    console.error('[auth] getUser failed on login page:', error.message)
  }

  if (user) {
    redirect('/home')
  }

  return (
    <div className="w-full max-w-sm">
      <LoginForm />
    </div>
  )
}
