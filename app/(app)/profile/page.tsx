"use client"

import { logout } from '@/app/auth/actions'
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen p-4 gap-6">
      <h1 className="text-2xl font-bold">Profile Page</h1>
      <form action={logout}>
        <Button type="submit" variant="destructive">
          Sign Out
        </Button>
      </form>
    </div>
  )
}
