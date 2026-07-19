import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error && error.message !== 'Auth session missing!') {
    console.error('[auth] getUser failed on root page:', error.message)
  }

  if (!user) {
    redirect('/auth/login')
  }

  redirect('/home')
}
