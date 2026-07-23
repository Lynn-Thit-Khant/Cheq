"use client"

import { useEffect, useState } from "react"
import { BackButton } from "@/components/back-button"
import { createClient } from "@/lib/client"
import { SharedLayoutBg } from "@/components/motion/shared-layout-bg"

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || "")
      setUserName(user?.user_metadata?.full_name || user?.user_metadata?.name || "")
    })
  }, [])

  return (
    <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
        <BackButton href="/settings" />
        <h1 className="text-2xl font-bold text-center">Profile</h1>
        <div />
      </div>

      <div className="flex-1 flex flex-col justify-start w-full mt-6">

      <div className="flex flex-col gap-4 w-full">
        <div className="bg-card/80 backdrop-blur-xl rounded-[28px] overflow-hidden border border-border/40 p-1">
          <SharedLayoutBg pillClassName="bg-black/5 dark:bg-white/5 rounded-[24px]">
            <div className="flex items-center justify-between px-4 py-3 gap-3 group relative z-10">
              <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Name</span>
              <span className="text-[15px] font-medium text-foreground text-right">{userName}</span>
            </div>

            <div className="flex items-center justify-between px-4 py-3 gap-3 group relative z-10">
              <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Email</span>
              <span className="text-[15px] font-medium text-foreground text-right break-all">{userEmail}</span>
            </div>
          </SharedLayoutBg>
        </div>
        </div>
      </div>
    </div>
  )
}
