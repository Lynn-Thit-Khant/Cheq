"use client"

import { Sparkles } from "lucide-react"
import { TextReveal } from "@/components/motion/text-reveal"

export default function AgentPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 gap-4 w-full max-w-md mx-auto text-center">
      {/* Elevated Icon Container */}
      <div className="mb-2 flex items-center justify-center">
        {/* Static Elevated Circle */}
        <div className="flex items-center justify-center size-20 rounded-full">
          <Sparkles className="size-12 text-primary" />
        </div>
      </div>

      <TextReveal
        as="h1"
        text="Something is Coming"
        stagger={0.15}
        delay={0.2}
        blur={8}
        className="text-2xl font-bold tracking-tight"
      />

      <TextReveal
        as="p"
        text="We're crafting a smarter way to track your income."
        stagger={0.08}
        delay={0.6}
        blur={6}
        className="text-muted-foreground max-w-sm text-sm"
      />
    </div>
  )
}
