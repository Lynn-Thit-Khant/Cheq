"use client"

import { useTheme } from "next-themes"

import { User, LayoutTemplate, SlidersHorizontal, Sparkles, Plug, Moon, ChevronRight } from "lucide-react"
import { Switch } from "@/components/motion/switch"
import { LogoutButton } from "@/components/logout-button"
import { SettingsCard } from "@/components/settings-card"
import { SettingsRow } from "@/components/settings-row"
import Link from "next/link"
import { useUser } from "@/components/user-provider"
export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const { user } = useUser()
  const userEmail = user?.email || ""
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || ""
  const isDark = resolvedTheme === "dark"

  const toggle = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-start p-4 gap-6 w-full max-w-md mx-auto mt-6">
      <div className="flex flex-col items-center justify-center gap-1 w-full mb-2 mt-4 text-center">
        <div className="h-[84px] w-[84px] rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold mb-3">
          {userName ? userName.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : "U")}
        </div>
        <span className="text-[22px] font-bold text-foreground">
          {userName || "Name"}
        </span>
        <span className="text-[15px] text-muted-foreground">
          {userEmail || "Loading..."}
        </span>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Account Cluster */}
        <SettingsCard>
          <SettingsRow href="/settings/account">
            <div className="flex items-center gap-4">
              <div className="grid h-7 w-7 place-items-center text-muted-foreground"><User className="size-5" /></div>
              <span className="text-[15px] font-medium text-foreground">Account</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground transition-colors" />
          </SettingsRow>
        </SettingsCard>

        {/* Configuration Cluster */}
        <SettingsCard>
          <SettingsRow href="/settings/templates">
            <div className="flex items-center gap-4">
              <div className="grid h-7 w-7 place-items-center text-muted-foreground"><LayoutTemplate className="size-5" /></div>
              <span className="text-[15px] font-medium text-foreground">Templates</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground transition-colors" />
          </SettingsRow>

          <SettingsRow href="/settings/defaults">
            <div className="flex items-center gap-4">
              <div className="grid h-7 w-7 place-items-center text-muted-foreground"><SlidersHorizontal className="size-5" /></div>
              <span className="text-[15px] font-medium text-foreground">Defaults</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground transition-colors" />
          </SettingsRow>

          <SettingsRow interactive={true}>
            <div className="flex items-center gap-4">
              <div className="grid h-7 w-7 place-items-center text-muted-foreground"><Sparkles className="size-5" /></div>
              <span className="text-[15px] font-medium text-foreground">Agent</span>
            </div>
            <span className="text-[13px] text-muted-foreground/60">Coming soon</span>
          </SettingsRow>

          <SettingsRow interactive={true}>
            <div className="flex items-center gap-4">
              <div className="grid h-7 w-7 place-items-center text-muted-foreground"><Plug className="size-5" /></div>
              <span className="text-[15px] font-medium text-foreground">Connectors</span>
            </div>
            <span className="text-[13px] text-muted-foreground/60">Coming soon</span>
          </SettingsRow>

          <SettingsRow onClick={toggle} forceDiv={true}>
            <div className="flex items-center gap-4">
              <div className="grid h-7 w-7 place-items-center text-muted-foreground"><Moon className="size-5" /></div>
              <span className="text-[15px] font-medium text-foreground">Dark Mode</span>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={toggle}
              aria-label="Toggle dark mode"
              className="pointer-events-none"
            />
          </SettingsRow>
        </SettingsCard>

      </div>

      <LogoutButton />
    </div>
  )
}
