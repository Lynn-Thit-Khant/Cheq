'use client'

import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <form action={logout} className="w-full mt-2">
      <Button type="submit" variant="destructive" className="w-full">
        Sign Out
      </Button>
    </form>
  )
}
