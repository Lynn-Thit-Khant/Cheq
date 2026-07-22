"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Dock, DockItem } from "@/components/motion/dock"
import { Home, Wallet, User, Settings } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Earnings", href: "/earnings", icon: Wallet },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  // Local state drives the pill animation instantly on click,
  // decoupled from the slower route change.
  const [activeHref, setActiveHref] = useState(pathname)

  // Sync back when the URL changes externally (browser back/forward)
  useEffect(() => {
    setActiveHref(pathname)
  }, [pathname])

  const handleTabClick = (href: string) => {
    if (href === activeHref) return
    setActiveHref(href)     // pill glides immediately
    router.push(href)       // page navigates in the background
  }

  return (
    <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
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
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none rounded-full border border-border bg-card/80 backdrop-blur-xl px-3 py-1 text-sm font-medium text-foreground shadow-md whitespace-nowrap">
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
