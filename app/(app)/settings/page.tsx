"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Switch } from "@/components/motion/switch"

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  
  const isDark = mounted && resolvedTheme === "dark"

  const toggle = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-2xl font-bold">Settings Page</h1>
      
      <div className="flex items-center justify-between p-4 border rounded-lg w-full max-w-sm bg-card">
        <div className="flex flex-col gap-1">
          <span className="font-medium">Dark Mode</span>
          <span className="text-sm text-muted-foreground">Toggle dark appearance</span>
        </div>
        <Switch
          checked={isDark}
          onCheckedChange={toggle}
          aria-label="Toggle dark mode"
        />
      </div>
    </div>
  )
}
