"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

interface BackButtonProps {
  href: string
  label?: string
  className?: string
}

export function BackButton({ href, label = "Back", className }: BackButtonProps) {
  return (
    <motion.div whileTap={{ scale: 0.75, opacity: 0.7 }} className={cn("inline-block self-start", className)}>
      <Link
        href={href}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-xl transition-colors hover:bg-card/90 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-5" />
      </Link>
    </motion.div>
  )
}
