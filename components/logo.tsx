import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl"
  width?: number
  height?: number
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 44,
  xl: 60,
  "2xl": 80,
  "3xl": 96,
  "4xl": 120,
}

export function Logo({ size = "md", width, height, className, ...props }: LogoProps) {
  const pixelSize = width || height || sizeMap[size] || 32

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0 select-none", className)}
      style={{ width: pixelSize, height: pixelSize }}
      {...props}
    >
      {/* Light mode icon: logo-dark.svg (Dark badge used in light mode) */}
      <Image
        src="/logo-dark.svg"
        alt="Cheq Logo"
        width={pixelSize}
        height={pixelSize}
        className="dark:hidden block object-contain w-full h-full"
        priority
      />
      {/* Dark mode icon: logo-light.svg (Light badge used in dark mode) */}
      <Image
        src="/logo-light.svg"
        alt="Cheq Logo"
        width={pixelSize}
        height={pixelSize}
        className="hidden dark:block object-contain w-full h-full"
        priority
      />
    </div>
  )
}
