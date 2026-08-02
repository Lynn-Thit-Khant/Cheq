"use client"

import { TrendingUp } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 gap-4 w-full max-w-md mx-auto text-center my-auto select-none">
      <div className="size-16 rounded-full bg-card/80 backdrop-blur-xl border border-border/40 flex items-center justify-center text-muted-foreground shadow-sm mb-2">
        <TrendingUp className="size-7 stroke-[1.5]" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-xs">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Detailed income reports, tax breakdowns, and pay period analytics will appear here.
        </p>
      </div>
    </div>
  )
}
