"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface SettingsRowProps {
  children: ReactNode
  className?: string
  href?: string
  onClick?: () => void
  forceDiv?: boolean
  interactive?: boolean
}

export function SettingsRow({ children, className, href, onClick, forceDiv, interactive }: SettingsRowProps) {
  const baseClasses = cn(
    "flex h-14 w-full items-center justify-between px-6 transition-colors rounded-[28px] group relative",
    (href || onClick || interactive) && "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10",
    className
  )

  if (href && !forceDiv) {
    return (
      <Link href={href} className={baseClasses} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (onClick && !forceDiv) {
    return (
      <button type="button" className={baseClasses} onClick={onClick}>
        {children}
      </button>
    )
  }

  return (
    <div className={baseClasses} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      {children}
    </div>
  )
}
