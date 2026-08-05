"use client"

import { cn } from "@/lib/utils"

interface PopoverBackdropProps {
  isVisible: boolean
  isActive: boolean
  onDismiss: () => void
  className?: string
}

export function PopoverBackdrop({ isVisible, isActive, onDismiss, className }: PopoverBackdropProps) {
  return (
    <div 
      className={cn(
        "fixed inset-0 z-[55] bg-black/60 backdrop-blur-lg transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        isActive ? "pointer-events-auto" : "pointer-events-none",
        className
      )} 
      onPointerDown={(e) => { 
        e.preventDefault();
        onDismiss();
      }}
      onTouchStart={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  )
}
