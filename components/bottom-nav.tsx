"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Dock, DockItem } from "@/components/motion/dock"
import { Home, TrendingUp, Settings, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Agent", href: "/agent", icon: Sparkles },
  ]

  const [activeHref, setActiveHref] = useState(pathname)
  const [prevPathname, setPrevPathname] = useState(pathname)
  // Track which tab's label pill is visible (tap-triggered)
  const [pressedHref, setPressedHref] = useState<string | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    tabs.forEach((tab) => {
      router.prefetch(tab.href)
    })
  }, [router])

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setActiveHref(pathname)
  }

  const handleTabClick = (href: string) => {
    // Show the pill label on tap and dismiss after 1.5 s
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    setPressedHref(href)
    dismissTimerRef.current = setTimeout(() => setPressedHref(null), 600)

    if (href === activeHref) return
    setActiveHref(href)
    router.push(href)
  }

  return (
    <div className="fixed bottom-5 inset-x-0 flex justify-center z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <Dock size={48}>
          {tabs.map((tab) => {
            const isActive = activeHref === tab.href
            const isPressed = pressedHref === tab.href
            return (
              <DockItem
                key={tab.name}
                active={isActive}
                onClick={() => handleTabClick(tab.href)}
                aria-label={tab.name}
                className="group"
              >
                <tab.icon className="size-5" />
                {/* Label pill — tap-triggered only, instant show/hide */}
                <span
                  className={cn(
                    "absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none",
                    "rounded-full border border-border/60 bg-card/90 backdrop-blur-xl",
                    "px-3 py-1 text-xs font-medium text-foreground shadow-lg whitespace-nowrap z-30",
                    isPressed ? "opacity-100" : "opacity-0"
                  )}
                >
                  {tab.name}
                </span>
              </DockItem>
            )
          })}
        </Dock>
      </div>
    </div>
  )
}
