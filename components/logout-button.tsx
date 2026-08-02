'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/motion/button/base'
import { ConfirmModal } from '@/components/confirm-modal'

export function LogoutButton() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      setConfirmOpen(false)
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <div className="w-full mt-2">
        <Button
          size="lg"
          type="button"
          variant="destructive"
          className="w-full"
          onClick={() => setConfirmOpen(true)}
        >
          Sign Out
        </Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Sign out?"
        description="You will need to sign in again to access your account."
        confirmText="Sign Out"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
      />
    </>
  )
}
