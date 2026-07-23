"use client"

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react"
import {
  Children,
  isValidElement,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import { SPRING_LAYOUT } from "@/lib/ease"
import { cn } from "@/lib/utils"

export interface SharedLayoutBgProps {
  children: ReactNode
  className?: string
  /** Tailwind class applied to the moving pill. Defaults to a subtle foreground tint. */
  pillClassName?: string
}

const variants: Variants = {
  initial: { opacity: 0, filter: "blur(6px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(6px)" },
}

const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export function SharedLayoutBg({
  children,
  className,
  pillClassName,
}: SharedLayoutBgProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const uid = useId()
  const reduce = useReducedMotion()

  return (
    <motion.div
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") {
          setActiveId(null)
        }
      }}
      className={cn("flex w-full flex-col", className)}
    >
      {Children.toArray(children)
        .filter(isValidElement)
        .map((child, index) => {
          const el = child as ReactElement<{ className?: string }>
          const childKey = el.key ? String(el.key) : `item-${index}`

          return (
            <div
              key={childKey}
              className="relative w-full"
              onPointerEnter={(e) => {
                if (e.pointerType !== "touch") {
                  setActiveId(childKey)
                }
              }}
              onPointerDown={(e) => {
                if (e.pointerType === "touch") {
                  setActiveId(childKey)
                }
              }}
              onPointerUp={(e) => {
                if (e.pointerType === "touch") {
                  setActiveId(null)
                }
              }}
              onPointerCancel={(e) => {
                if (e.pointerType === "touch") {
                  setActiveId(null)
                }
              }}
            >
              <AnimatePresence>
                {activeId === childKey ? (
                  <motion.div
                    variants={reduce ? reducedVariants : variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layoutId={`shared-bg-${uid}`}
                    transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-full bg-[#eaeaea] dark:bg-white/10 z-0",
                      pillClassName,
                    )}
                  />
                ) : null}
              </AnimatePresence>
              <div className="relative z-10 w-full">{el}</div>
            </div>
          )
        })}
    </motion.div>
  )
}
