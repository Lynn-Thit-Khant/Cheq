import { BottomNav } from "@/components/bottom-nav"
import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import { UserProvider } from '@/components/user-provider'

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

  const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (!aalError && aalData?.nextLevel === 'aal2' && aalData?.nextLevel !== aalData?.currentLevel) {
    redirect('/auth/mfa')
  }

  return (
    <UserProvider user={user}>
      <div className="relative h-[100dvh] flex flex-col overflow-hidden bg-background text-foreground">
        <main className="flex-1 overflow-y-auto pb-24 flex flex-col">
          {children}
        </main>
        <BottomNav />
      </div>
    </UserProvider>
  )
}
