"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Dock, DockItem } from "@/components/motion/dock"
import { Home, TrendingUp, Settings, Sparkles } from "lucide-react"

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
    if (href === activeHref) return
    setActiveHref(href)     // pill glides immediately
    router.push(href)       // page navigates in the background
  }

  return (
    <div className="fixed bottom-5 inset-x-0 flex justify-center z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <Dock size={48}>
          {tabs.map((tab) => {
            const isActive = activeHref === tab.href
            return (
              <DockItem
                key={tab.name}
                active={isActive}
                onClick={() => handleTabClick(tab.href)}
                aria-label={tab.name}
                className="group"
              >
                <tab.icon className="size-5" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 scale-95 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:scale-100 pointer-events-none rounded-full border border-border/60 bg-card/90 backdrop-blur-xl px-3 py-1 text-xs font-medium text-foreground shadow-lg whitespace-nowrap z-30">
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
