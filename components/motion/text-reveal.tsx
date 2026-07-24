"use client"

import React, { ElementType } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface TextRevealProps {
  text: string | string[]
  as?: ElementType
  className?: string
  split?: "word" | "char"
  stagger?: number
  delay?: number
  blur?: number
  yOffset?: string | number
  spring?: { stiffness?: number; damping?: number; mass?: number }
  once?: boolean
  whileInView?: boolean
}

const motionMap = {
  span: motion.span,
  div: motion.div,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
}

export function TextReveal({
  text,
  as = "span",
  className,
  split = "word",
  stagger = 0.12,
  delay = 0,
  blur = 8,
  yOffset = "40%",
  spring = { stiffness: 80, damping: 18 },
  once = true,
  whileInView = false,
}: TextRevealProps) {
  const lines = Array.isArray(text) ? text : [text]

  const items = lines.flatMap((line, lineIdx) => {
    if (split === "char") {
      return line.split("").map((char, charIdx) => ({
        content: char === " " ? "\u00A0" : char,
        key: `${lineIdx}-${charIdx}`,
      }))
    } else {
      return line.split(" ").map((word, wordIdx) => ({
        content: word,
        key: `${lineIdx}-${wordIdx}`,
      }))
    }
  })

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      filter: `blur(${blur}px)`,
      y: yOffset,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: "0%",
      transition: {
        type: "spring" as const,
        ...spring,
      },
    },
  }

  const MotionComponent = (motionMap as any)[as as any] || motion.span

  return (
    <MotionComponent
      className={cn("inline-flex flex-wrap justify-center", className)}
      variants={containerVariants}
      initial="hidden"
      whileInView={whileInView ? "visible" : undefined}
      animate={!whileInView ? "visible" : undefined}
      viewport={whileInView ? { once } : undefined}
    >
      {items.map((item) => (
        <motion.span
          key={item.key}
          variants={itemVariants}
          className="inline-block whitespace-pre mr-[0.25em] last:mr-0"
        >
          {item.content}
        </motion.span>
      ))}
    </MotionComponent>
  )
}
