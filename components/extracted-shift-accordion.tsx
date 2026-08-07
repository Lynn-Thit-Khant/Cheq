"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar as CalendarIcon, ChevronDown, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { ExtractedShift } from "@/app/(app)/home/ai-actions"
import { SettingsCard } from "@/components/settings-card"
import {
  formatDisplayTime,
  dateToString,
  formatDisplayDate,
} from "@/lib/time-utils"
import { Field, FieldLabel, FieldGroup, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/motion/button/base"
import { Calendar } from "@/components/ui/calendar"
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal"
import { WheelPicker } from "@/components/motion/wheel-picker"
import { cn } from "@/lib/utils"

const HOURS_12 = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1).padStart(2, "0"),
  value: String(i + 1).padStart(2, "0"),
}))

const HOURS_24 = Array.from({ length: 24 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: String(i).padStart(2, "0"),
}))

const MINUTES = Array.from({ length: 12 }, (_, i) => {
  const val = String(i * 5).padStart(2, "0")
  return { label: val, value: val }
})

const AMPM = [
  { label: "AM", value: "AM" },
  { label: "PM", value: "PM" },
]

export interface ExtractedShiftErrors {
  workplace_name?: string
  shift_date?: string
  start_time?: string
  end_time?: string
  hourly_rate?: string
  break_duration?: string
}

interface ExtractedShiftAccordionProps {
  shifts: ExtractedShift[]
  errors?: Record<number, ExtractedShiftErrors>
  onUpdateShift: (index: number, updated: ExtractedShift) => void
  onDeleteShift: (index: number) => void
  timeFormat?: "12h" | "24h"
  firstDayOfWeek?: "Monday" | "Sunday"
}

export function ExtractedShiftAccordion({
  shifts,
  errors = {},
  onUpdateShift,
  onDeleteShift,
  timeFormat = "12h",
  firstDayOfWeek = "Monday",
}: ExtractedShiftAccordionProps) {
  // Track open accordion item index (single item open at a time)
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const prevErrorsRef = useRef(errors)

  // Auto-expand first errored item ONLY when new validation errors are submitted (not while typing)
  useEffect(() => {
    const prevCount = Object.keys(prevErrorsRef.current).length
    const currentCount = Object.keys(errors).length
    if (prevCount === 0 && currentCount > 0) {
      const errorIndices = Object.keys(errors).map(Number)
      if (errorIndices.length > 0) {
        setOpenIndex(errorIndices[0])
      }
    }
    prevErrorsRef.current = errors
  }, [errors])

  // Picker popover states per shift row
  const [dateModalOpen, setDateModalOpen] = useState(false)
  const [activeDateIndex, setActiveDateIndex] = useState<number | null>(null)

  const [timeModalOpen, setTimeModalOpen] = useState(false)
  const [activeTimeIndex, setActiveTimeIndex] = useState<number | null>(null)
  const [activeTimeField, setActiveTimeField] = useState<"start" | "end">("start")

  // Temporary WheelPicker values
  const [tempHour, setTempHour] = useState("09")
  const [tempMin, setTempMin] = useState("00")
  const [tempAmpm, setTempAmpm] = useState("AM")

  const toggleIndex = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  // Handle opening Date modal
  const openDateModalFor = (index: number) => {
    setActiveDateIndex(index)
    setDateModalOpen(true)
  }

  // Handle opening Time modal
  const openTimeModalFor = (index: number, field: "start" | "end") => {
    setActiveTimeIndex(index)
    setActiveTimeField(field)

    const shift = shifts[index]
    const timeStr = field === "start" ? shift.start_time : shift.end_time

    if (timeStr && timeStr.includes(":")) {
      const [hStr, mStr] = timeStr.split(":")
      let hNum = parseInt(hStr, 10) || 9
      const mNum = parseInt(mStr, 10) || 0

      // Round minute to nearest 5
      const roundedM = Math.round(mNum / 5) * 5
      setTempMin(String(roundedM >= 60 ? 55 : roundedM).padStart(2, "0"))

      if (timeFormat === "12h") {
        const isPM = hNum >= 12
        setTempAmpm(isPM ? "PM" : "AM")
        let h12 = hNum % 12
        if (h12 === 0) h12 = 12
        setTempHour(String(h12).padStart(2, "0"))
      } else {
        setTempHour(String(hNum).padStart(2, "0"))
      }
    }

    setTimeModalOpen(true)
  }

  // Confirm Time selection
  const handleConfirmTime = (hour: string, min: string, ampm: string) => {
    if (activeTimeIndex === null) return
    const shift = shifts[activeTimeIndex]

    let h24 = parseInt(hour, 10)
    if (timeFormat === "12h") {
      if (ampm === "PM" && h24 < 12) h24 += 12
      if (ampm === "AM" && h24 === 12) h24 = 0
    }
    const formatted = `${String(h24).padStart(2, "0")}:${min}`

    onUpdateShift(activeTimeIndex, {
      ...shift,
      [activeTimeField === "start" ? "start_time" : "end_time"]: formatted,
    })
  }

  return (
    <>
      <SettingsCard className="p-1">
        <div className="flex flex-col">
          {shifts.map((shift, index) => {
            const isOpen = openIndex === index
            const isLast = index === shifts.length - 1
            const shiftErrors = errors[index] || {}
            const hasError = Object.keys(shiftErrors).length > 0

            // Parse date for small date circle badge
            let weekday = "DAY"
            let dayNumber = "1"

            if (shift.shift_date) {
              const dateObj = new Date(`${shift.shift_date}T00:00:00`)
              if (!isNaN(dateObj.getTime())) {
                weekday = dateObj
                  .toLocaleDateString("en-US", { weekday: "short" })
                  .toUpperCase()
                dayNumber = String(dateObj.getDate())
              }
            }

            const dateDisplay = shift.shift_date
              ? formatDisplayDate(shift.shift_date)
              : "Choose date"

            const displayStart = shift.start_time
              ? formatDisplayTime(shift.start_time, timeFormat)
              : "--:--"

            const displayEnd = shift.end_time
              ? formatDisplayTime(shift.end_time, timeFormat)
              : "--:--"

            return (
              <div
                key={`${shift.shift_date}-${index}`}
                className={!isLast ? "border-b border-border/40" : ""}
              >
                {/* Collapsed Accordion Header Row */}
                <button
                  type="button"
                  onClick={() => toggleIndex(index)}
                  className="flex h-14 w-full items-center justify-between px-4 sm:px-6 transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 rounded-full cursor-pointer outline-none select-none gap-3"
                >
                  {/* Left: Date Circle Badge + Workplace Name + Alert Indicator */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-full bg-foreground/[0.05] border border-border/50 text-center select-none shadow-sm relative">
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase leading-none">
                        {weekday}
                      </span>
                      <span className="text-[13px] font-bold text-foreground leading-none mt-0.5">
                        {dayNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <span className="text-sm font-medium text-foreground truncate text-left">
                        {shift.workplace_name || "Workplace"}
                      </span>
                      {hasError && (
                        <span
                          className="size-2 rounded-full bg-destructive animate-pulse shrink-0"
                          title="Incomplete shift details"
                        />
                      )}
                    </div>
                  </div>

                  {/* Right: Shift Timing + Rotating Chevron */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[13px] text-muted-foreground font-medium">
                      {displayStart} – {displayEnd}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    </motion.div>
                  </div>
                </button>

                {/* Ultra-Smooth Hardware-Accelerated CSS Grid Accordion Panel */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-3 pb-5 pt-2 sm:px-5 flex flex-col gap-4">
                      <FieldGroup>
                        {/* Workplace Name Field (Full width) */}
                        <Field data-invalid={!!shiftErrors.workplace_name}>
                          <FieldLabel>Workplace</FieldLabel>
                          <Input
                            type="text"
                            value={shift.workplace_name}
                            onChange={(e) =>
                              onUpdateShift(index, {
                                ...shift,
                                workplace_name: e.target.value,
                              })
                            }
                            placeholder="Cafe"
                            className={cn(
                              "h-12 bg-card rounded-full px-4 w-full",
                              shiftErrors.workplace_name && "border-destructive ring-1 ring-destructive/40 bg-destructive/[0.03]"
                            )}
                            aria-invalid={!!shiftErrors.workplace_name}
                          />
                        </Field>

                        {/* Date Field */}
                        <Field data-invalid={!!shiftErrors.shift_date}>
                          <FieldLabel>Date</FieldLabel>
                          <button
                            type="button"
                            onClick={() => openDateModalFor(index)}
                            className={cn(
                              "flex h-12 w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none cursor-pointer",
                              shift.shift_date ? "text-foreground" : "text-muted-foreground",
                              shiftErrors.shift_date && "border-destructive ring-1 ring-destructive/40 bg-destructive/[0.03]"
                            )}
                          >
                            <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                            <span className="whitespace-nowrap text-sm font-medium">
                              {dateDisplay}
                            </span>
                            <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                          </button>
                        </Field>

                          {/* Starts & Ends Time Pickers */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Start time */}
                            <Field data-invalid={!!shiftErrors.start_time}>
                              <FieldLabel>Starts</FieldLabel>
                              <button
                                type="button"
                                onClick={() => openTimeModalFor(index, "start")}
                                className={cn(
                                  "flex h-12 w-full items-center justify-between gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none cursor-pointer",
                                  shift.start_time ? "text-foreground" : "text-muted-foreground",
                                  shiftErrors.start_time && "border-destructive ring-1 ring-destructive/40 bg-destructive/[0.03]"
                                )}
                              >
                                <span className="whitespace-nowrap text-sm font-medium">
                                  {displayStart}
                                </span>
                                <ChevronDown className="size-4 text-muted-foreground/50 shrink-0" />
                              </button>
                            </Field>

                            {/* End time */}
                            <Field data-invalid={!!shiftErrors.end_time}>
                              <FieldLabel>Ends</FieldLabel>
                              <button
                                type="button"
                                onClick={() => openTimeModalFor(index, "end")}
                                className={cn(
                                  "flex h-12 w-full items-center justify-between gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none cursor-pointer",
                                  shift.end_time ? "text-foreground" : "text-muted-foreground",
                                  shiftErrors.end_time && "border-destructive ring-1 ring-destructive/40 bg-destructive/[0.03]"
                                )}
                              >
                                <span className="whitespace-nowrap text-sm font-medium">
                                  {displayEnd}
                                </span>
                                <ChevronDown className="size-4 text-muted-foreground/50 shrink-0" />
                              </button>
                              {shiftErrors.end_time && (
                                <FieldError errors={[{ message: shiftErrors.end_time }]} />
                              )}
                            </Field>
                          </div>

                          {/* Hourly rate & Break (min) */}
                          <div className="grid grid-cols-2 gap-3">
                            <Field data-invalid={!!shiftErrors.hourly_rate}>
                              <FieldLabel htmlFor={`rate-${index}`}>Hourly rate</FieldLabel>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base pointer-events-none">
                                  $
                                </span>
                                <Input
                                  id={`rate-${index}`}
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  value={shift.hourly_rate !== undefined && shift.hourly_rate !== null ? shift.hourly_rate : ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    onUpdateShift(index, {
                                      ...shift,
                                      hourly_rate: val === "" ? ('' as unknown as number) : parseFloat(val) || 0,
                                    })
                                  }}
                                  placeholder="0.00"
                                  className={cn(
                                    "h-12 bg-card rounded-full pl-8 pr-4 text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                    shiftErrors.hourly_rate && "border-destructive ring-1 ring-destructive/40 bg-destructive/[0.03]"
                                  )}
                                  aria-invalid={!!shiftErrors.hourly_rate}
                                />
                              </div>
                              {shiftErrors.hourly_rate && (
                                <FieldError errors={[{ message: shiftErrors.hourly_rate }]} />
                              )}
                            </Field>

                            <Field data-invalid={!!shiftErrors.break_duration}>
                              <FieldLabel htmlFor={`break-${index}`}>Break (min)</FieldLabel>
                              <Input
                                id={`break-${index}`}
                                type="number"
                                inputMode="numeric"
                                step="1"
                                value={shift.break_duration !== undefined && shift.break_duration !== null ? shift.break_duration : ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                  onUpdateShift(index, {
                                    ...shift,
                                    break_duration: val === "" ? ('' as unknown as number) : parseInt(val, 10) || 0,
                                  })
                                }}
                                placeholder="30"
                                className={cn(
                                  "h-12 bg-card rounded-full px-4 text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                  shiftErrors.break_duration && "border-destructive ring-1 ring-destructive/40 bg-destructive/[0.03]"
                                )}
                                aria-invalid={!!shiftErrors.break_duration}
                              />
                              {shiftErrors.break_duration && (
                                <FieldError errors={[{ message: shiftErrors.break_duration }]} />
                              )}
                            </Field>
                          </div>
                        </FieldGroup>

                        {/* Solid Red Destructive Delete Button */}
                        <div className="flex justify-end pt-2">
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              onDeleteShift(index)
                            }}
                            className="h-10 px-4 rounded-full text-sm font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
          })}
        </div>
      </SettingsCard>

      {/* ── Date Calendar Popover Modal ──────────────────── */}
      <CenterMorphModal open={dateModalOpen} onOpenChange={setDateModalOpen}>
        <CenterMorphModalContent
          ariaLabel="Select date"
          showCloseButton={false}
          dismissible={true}
          noMorph
          className="w-auto p-1 border-border/60 shadow-sm bg-card"
        >
          {activeDateIndex !== null && (
            <Calendar
              mode="single"
              className="bg-transparent"
              weekStartsOn={firstDayOfWeek === "Sunday" ? 0 : 1}
              selected={
                shifts[activeDateIndex]?.shift_date
                  ? new Date(`${shifts[activeDateIndex].shift_date}T00:00:00`)
                  : undefined
              }
              onSelect={(date) => {
                if (activeDateIndex !== null && date) {
                  onUpdateShift(activeDateIndex, {
                    ...shifts[activeDateIndex],
                    shift_date: dateToString(date),
                  })
                }
                setDateModalOpen(false)
              }}
            />
          )}
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Time Wheel Picker Popover Modal ────────────────── */}
      <CenterMorphModal open={timeModalOpen} onOpenChange={setTimeModalOpen}>
        <CenterMorphModalContent
          ariaLabel="Select time"
          showCloseButton={false}
          dismissible={true}
          noMorph
          className="w-[260px] p-2 border-border/60 shadow-sm bg-card"
        >
          <div className="flex items-stretch justify-center gap-1 px-4">
            <WheelPicker
              options={timeFormat === "12h" ? HOURS_12 : HOURS_24}
              value={tempHour}
              onValueChange={(val) => {
                setTempHour(val)
                handleConfirmTime(val, tempMin, tempAmpm)
              }}
              className="flex-1 border-0 bg-transparent rounded-full"
              visibleCount={5}
              itemHeight={38}
              sound
              aria-label="Hour"
            />

            <div className="flex items-center justify-center w-4 text-xl font-medium text-foreground pb-1">
              :
            </div>

            <WheelPicker
              options={MINUTES}
              value={tempMin}
              onValueChange={(val) => {
                setTempMin(val)
                handleConfirmTime(tempHour, val, tempAmpm)
              }}
              className="flex-1 border-0 bg-transparent rounded-full"
              visibleCount={5}
              itemHeight={38}
              sound
              aria-label="Minute"
            />

            {timeFormat === "12h" && (
              <>
                <div className="w-2" />
                <WheelPicker
                  options={AMPM}
                  value={tempAmpm}
                  onValueChange={(val) => {
                    setTempAmpm(val)
                    handleConfirmTime(tempHour, tempMin, val)
                  }}
                  className="flex-1 border-0 bg-transparent rounded-full"
                  visibleCount={5}
                  itemHeight={38}
                  sound
                  aria-label="AM/PM"
                />
              </>
            )}
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>
    </>
  )
}
