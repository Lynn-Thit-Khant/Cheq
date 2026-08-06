import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function Logo({ className, size = "md" }: LogoProps) {
  const dimensions = {
    sm: 32,
    md: 44,
    lg: 56,
    xl: 72,
  }

  const px = dimensions[size]

  return (
    <div className={cn("inline-flex items-center justify-center shrink-0 select-none", className)}>
      <Image
        src="/logo.svg"
        alt="Cheq Logo"
        width={px}
        height={px}
        priority
        className="object-contain shrink-0"
      />
    </div>
  )
}
