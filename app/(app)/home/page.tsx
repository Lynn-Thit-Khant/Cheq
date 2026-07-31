"use client"

import { motion } from "motion/react"

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
      {/* Header */}
      <div className="relative flex items-center justify-end w-full mb-2 shrink-0 min-h-[3rem] gap-4">
        <motion.button
          type="button"
          whileTap={{ scale: 0.85, opacity: 0.7 }}
          className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors focus:outline-none shrink-0"
          aria-label="Add Shift"
        >
          Add
        </motion.button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-muted-foreground text-sm">Dashboard content here</p>
      </div>
    </div>
  )
}
