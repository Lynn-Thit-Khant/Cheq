"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface SettingsCardProps {
  children: ReactNode
  className?: string
}

export function SettingsCard({ children, className }: SettingsCardProps) {
  return (
    <div className={cn("flex flex-col w-full relative", className)}>
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[28px] border border-border/40 pointer-events-none shadow-sm" />
      <div className="flex flex-col p-1 relative">
        {children}
      </div>
    </div>
  )
}
