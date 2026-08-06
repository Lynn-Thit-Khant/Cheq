import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
}

export function Logo({ className, size = "md" }: LogoProps) {
  const dimensions = {
    sm: 32,
    md: 44,
    lg: 56,
    xl: 84,
    "2xl": 96,
    "3xl": 120,
  }

  const px = dimensions[size]

  return (
    <div className={cn("inline-flex items-center justify-center shrink-0 select-none", className)}>
      {/* Light mode: Black logo badge */}
      <Image
        src="/logo-dark.svg"
        alt="Cheq Logo"
        width={px}
        height={px}
        priority
        className="object-contain shrink-0 dark:hidden"
      />
      {/* Dark mode: White logo badge */}
      <Image
        src="/logo-light.svg"
        alt="Cheq Logo"
        width={px}
        height={px}
        priority
        className="object-contain shrink-0 hidden dark:block"
      />
    </div>
  )
}
