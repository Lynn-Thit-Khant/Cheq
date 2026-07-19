"use client"

import { useThemeToggle } from "@/components/motion/theme-toggle"
import { Switch } from "@/components/motion/switch"

export default function SettingsPage() {
  const { isDark, mounted, toggle } = useThemeToggle({ variant: "circle-blur", start: "top-right" })

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen p-4 gap-6">
      <h1 className="text-2xl font-bold">Settings Page</h1>
      
      <div className="flex items-center justify-between p-4 border rounded-lg w-full max-w-sm bg-card">
        <div className="flex flex-col gap-1">
          <span className="font-medium">Dark Mode</span>
          <span className="text-sm text-muted-foreground">Toggle dark appearance</span>
        </div>
        <Switch
          checked={mounted ? isDark : false}
          onCheckedChange={toggle}
          aria-label="Toggle dark mode"
        />
      </div>
    </div>
  )
}
