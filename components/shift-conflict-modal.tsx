'use client'

import { useState, useEffect } from "react"
import { AlertCircle } from "lucide-react"
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal"
import { Button } from "@/components/motion/button/base"
import { SettingsCard } from "@/components/settings-card"
import type { Shift, ShiftFormValues } from "@/lib/schemas/shift-form-schema"
import type { ShiftConflictType } from "@/lib/shift-conflict-utils"
import { formatDisplayTime, calculateShiftIncome, formatCurrency } from "@/lib/time-utils"

interface ShiftConflictModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflictType: ShiftConflictType | null
  conflictingShift: Shift | null
  pendingShift: ShiftFormValues | null
  timeFormat?: "12h" | "24h"
  defaultHourlyRate?: number
  defaultBreakDuration?: number
  isSaving?: boolean
  onPrimaryAction: () => void | Promise<void>
  onSecondaryAction: () => void | Promise<void>
}

export function ShiftConflictModal({
  open,
  onOpenChange,
  conflictType,
  conflictingShift,
  pendingShift,
  timeFormat = "12h",
  defaultHourlyRate = 0,
  defaultBreakDuration = 0,
  isSaving = false,
  onPrimaryAction,
  onSecondaryAction,
}: ShiftConflictModalProps) {
  const [activeAction, setActiveAction] = useState<"primary" | "secondary" | null>(null)

  useEffect(() => {
    if (!open || !isSaving) {
      setActiveAction(null)
    }
  }, [open, isSaving])

  if (!conflictingShift || !pendingShift || !conflictType) return null

  const handlePrimaryClick = async () => {
    setActiveAction("primary")
    await onPrimaryAction()
  }

  const handleSecondaryClick = async () => {
    setActiveAction("secondary")
    await onSecondaryAction()
  }

  let weekday = "DAY"
  let dayNumber = "1"
  if (conflictingShift.shift_date) {
    const [y, m, d] = conflictingShift.shift_date.split("-").map(Number)
    const dateObj = new Date(y, m - 1, d)
    if (!isNaN(dateObj.getTime())) {
      weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
      dayNumber = String(dateObj.getDate())
    }
  }

  const startDisplay = formatDisplayTime(conflictingShift.start_time, timeFormat)
  const endDisplay = formatDisplayTime(conflictingShift.end_time, timeFormat)
  const income = calculateShiftIncome(
    conflictingShift.start_time,
    conflictingShift.end_time,
    conflictingShift.hourly_rate ?? defaultHourlyRate,
    conflictingShift.break_duration ?? defaultBreakDuration
  )

  // Configure copy and labels according to conflict type
  let title = "Duplicate Shift Detected"
  let subtitle = "An identical shift is already in your schedule."
  let primaryLabel = "Skip Duplicate"
  let primaryLoadingLabel = "Skipping"
  let secondaryLabel = "Keep Both"
  let secondaryLoadingLabel = "Keeping"

  if (conflictType === "time_overlap") {
    title = "Time Overlap Detected"
    subtitle = "This shift overlaps with an existing shift."
    primaryLabel = "Replace Shift"
    primaryLoadingLabel = "Replacing"
    secondaryLabel = "Keep Both"
    secondaryLoadingLabel = "Keeping"
  } else if (conflictType === "double_booking") {
    title = "Time Slot Already Taken"
    subtitle = "You already have a shift at another workplace."
    primaryLabel = "Replace Shift"
    primaryLoadingLabel = "Replacing"
    secondaryLabel = "Keep Both"
    secondaryLoadingLabel = "Keeping"
  }

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent
        ariaLabel={title}
        dismissible={true}
        className="w-full max-w-sm bg-card p-6 border-border/50"
      >
        <div className="flex flex-col gap-5">
          {/* Top Centered Monochrome Alert Badge */}
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-foreground border border-border/60 shadow-sm">
              <AlertCircle className="size-6 text-foreground" />
            </div>

            {/* Title and Subtitle */}
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">
                {title}
              </h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Existing Shift Card */}
          <SettingsCard>
            <div className="flex h-[72px] w-full items-center justify-between px-4 sm:px-5 gap-3 select-none">
              {/* Left: Date Circle Badge + Workplace Name & Time */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-full bg-card/90 backdrop-blur-xl border border-border/60 text-center select-none shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase leading-none">
                    {weekday}
                  </span>
                  <span className="text-[15px] font-bold text-foreground leading-none mt-0.5">
                    {dayNumber}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-[15px] font-medium text-foreground truncate">
                    {conflictingShift.workplace_name}
                  </span>
                  <span className="text-[13px] text-muted-foreground truncate">
                    {startDisplay} – {endDisplay}
                  </span>
                </div>
              </div>

              {/* Right: Income Amount */}
              <div className="flex items-center shrink-0">
                <span className="text-[15px] font-semibold text-foreground">
                  {formatCurrency(income)}
                </span>
              </div>
            </div>
          </SettingsCard>

          {/* Action Buttons (Full-Width 50/50 Side-by-Side) */}
          <div className="grid grid-cols-2 gap-3 pt-2 w-full">
            <Button
              type="button"
              variant="outline"
              isLoading={isSaving && activeAction === "secondary"}
              disabled={isSaving}
              onClick={handleSecondaryClick}
              className="h-11 rounded-full text-sm font-medium w-full border-border/60 cursor-pointer"
            >
              {isSaving && activeAction === "secondary" ? secondaryLoadingLabel : secondaryLabel}
            </Button>

            <Button
              type="button"
              isLoading={isSaving && activeAction === "primary"}
              disabled={isSaving}
              onClick={handlePrimaryClick}
              className="h-11 rounded-full text-sm font-medium w-full cursor-pointer"
            >
              {isSaving && activeAction === "primary" ? primaryLoadingLabel : primaryLabel}
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
