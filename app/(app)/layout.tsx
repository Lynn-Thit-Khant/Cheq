import { BottomNav } from "@/components/bottom-nav"
import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error && error.message !== 'Auth session missing!') {
    console.error('[auth] getUser failed on app layout:', error.message)
  }

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="relative min-h-screen flex flex-col pb-24 bg-background text-foreground">
      {children}
      <BottomNav />
    </div>
  )
}
