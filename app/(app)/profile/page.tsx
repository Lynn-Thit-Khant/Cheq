"use client"

import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen p-4 gap-6">
      <h1 className="text-2xl font-bold">Profile Page</h1>
      <Button onClick={handleSignOut} variant="destructive">
        Sign Out
      </Button>
    </div>
  )
}
