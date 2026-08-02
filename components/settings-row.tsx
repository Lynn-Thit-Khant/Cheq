"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface SettingsRowProps {
  children: ReactNode
  className?: string
  href?: string
  onClick?: () => void
  onPointerDown?: (e: React.PointerEvent) => void
  onPointerUp?: (e: React.PointerEvent) => void
  onPointerLeave?: (e: React.PointerEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
  forceDiv?: boolean
  interactive?: boolean
}

export function SettingsRow({
  children,
  className,
  href,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onContextMenu,
  forceDiv,
  interactive,
}: SettingsRowProps) {
  const baseClasses = cn(
    "flex h-14 w-full items-center justify-between px-6 transition-colors rounded-full group relative select-none",
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
      <button
        type="button"
        className={baseClasses}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onContextMenu={onContextMenu}
      >
        {children}
      </button>
    )
  }

  return (
    <div
      className={baseClasses}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onContextMenu={onContextMenu}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
