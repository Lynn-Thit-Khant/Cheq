"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { useState, useEffect } from "react"

interface BackButtonProps {
  href: string

  className?: string
}

export function BackButton({ href, className }: BackButtonProps) {
  const [isMobile, setIsMobile] = useState(true) // Default to true for mobile-first feel before hydration

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <motion.div whileTap={{ scale: isMobile ? 0.5 : 0.85, opacity: 0.7 }} className={cn("inline-flex", className)}>
      <Link
        href={href}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-xl transition-colors hover:bg-card/90 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-5" />
      </Link>
    </motion.div>
  )
}
