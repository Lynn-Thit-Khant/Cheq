import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  href: string
  label?: string
  className?: string
}

export function BackButton({ href, label = "Back", className }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-xl transition-all hover:bg-card/90 text-muted-foreground hover:text-foreground self-start",
        className
      )}
    >
      <ChevronLeft className="size-5" />
    </Link>
  )
}
