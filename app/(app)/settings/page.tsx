"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { User, ShieldCheck, LayoutTemplate, SlidersHorizontal, Sparkles, Plug, Moon, ChevronRight } from "lucide-react"
import { Switch } from "@/components/motion/switch"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { SharedLayoutBg } from "@/components/motion/shared-layout-bg"
import { createClient } from "@/lib/client"
export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  
  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || "")
      setUserName(user?.user_metadata?.full_name || user?.user_metadata?.name || "")
    })
  }, [])
  
  const isDark = mounted && resolvedTheme === "dark"

  const toggle = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 pb-24 gap-6 w-full max-w-md mx-auto">
      <div className="flex flex-col items-center justify-center gap-1 w-full mb-2 mt-4 text-center">
        <div className="h-[84px] w-[84px] rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold mb-3 shadow-sm">
          {userName ? userName.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : "U")}
        </div>
        <span className="text-[22px] font-bold text-foreground tracking-tight">
          {userName || "Name"}
        </span>
        <span className="text-[15px] text-muted-foreground">
          {userEmail || "Loading..."}
        </span>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Account Cluster */}
        <div className="bg-card/80 backdrop-blur-xl shadow-sm rounded-[28px] overflow-hidden border border-border/40">
          <SharedLayoutBg pillClassName="bg-black/5 dark:bg-white/10 rounded-[24px]">
            <Link href="/settings/profile" className="flex min-h-[54px] w-full items-center justify-between px-5 py-2 group">
              <div className="flex items-center gap-4">
                <div className="grid h-7 w-7 place-items-center text-muted-foreground"><User className="size-5" /></div>
                <span className="text-[15px] font-medium text-foreground">Profile</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            <Link href="/settings/privacy" className="flex min-h-[54px] w-full items-center justify-between px-5 py-2 group">
              <div className="flex items-center gap-4">
                <div className="grid h-7 w-7 place-items-center text-muted-foreground"><ShieldCheck className="size-5" /></div>
                <span className="text-[15px] font-medium text-foreground">Privacy</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </SharedLayoutBg>
        </div>

        {/* Configuration Cluster */}
        <div className="bg-card/80 backdrop-blur-xl shadow-sm rounded-[28px] overflow-hidden border border-border/40">
          <SharedLayoutBg pillClassName="bg-black/5 dark:bg-white/10 rounded-[24px]">
            <Link href="/settings/templates" className="flex min-h-[54px] w-full items-center justify-between px-5 py-2 group">
              <div className="flex items-center gap-4">
                <div className="grid h-7 w-7 place-items-center text-muted-foreground"><LayoutTemplate className="size-5" /></div>
                <span className="text-[15px] font-medium text-foreground">Templates</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            <Link href="/settings/defaults" className="flex min-h-[54px] w-full items-center justify-between px-5 py-2 group">
              <div className="flex items-center gap-4">
                <div className="grid h-7 w-7 place-items-center text-muted-foreground"><SlidersHorizontal className="size-5" /></div>
                <span className="text-[15px] font-medium text-foreground">Defaults</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            <div className="flex min-h-[54px] w-full items-center justify-between px-5 py-2">
              <div className="flex items-center gap-4">
                <div className="grid h-7 w-7 place-items-center text-muted-foreground"><Sparkles className="size-5" /></div>
                <span className="text-[15px] font-medium text-foreground">Agent</span>
              </div>
              <span className="text-[13px] text-muted-foreground/60">Coming soon</span>
            </div>

            <div className="flex min-h-[54px] w-full items-center justify-between px-5 py-2">
              <div className="flex items-center gap-4">
                <div className="grid h-7 w-7 place-items-center text-muted-foreground"><Plug className="size-5" /></div>
                <span className="text-[15px] font-medium text-foreground">Connectors</span>
              </div>
              <span className="text-[13px] text-muted-foreground/60">Coming soon</span>
            </div>

            <div className="flex min-h-[54px] w-full items-center justify-between px-5 py-2">
              <div className="flex items-center gap-4">
                <div className="grid h-7 w-7 place-items-center text-muted-foreground"><Moon className="size-5" /></div>
                <span className="text-[15px] font-medium text-foreground">Dark Mode</span>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={toggle}
                aria-label="Toggle dark mode"
              />
            </div>
          </SharedLayoutBg>
        </div>

      </div>

      <LogoutButton />
    </div>
  )
}
