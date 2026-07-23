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
        "inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6),0_2px_8px_-2px_rgba(0,0,0,0.4)] transition-all hover:bg-card/90 text-muted-foreground hover:text-foreground self-start",
        className
      )}
    >
      <ChevronLeft className="size-5" />
    </Link>
  )
}
