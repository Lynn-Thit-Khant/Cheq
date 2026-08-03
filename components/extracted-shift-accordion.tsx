"use client"

import { useState } from "react"
import { Calendar as CalendarIcon, Clock, ChevronDown, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { ExtractedShift } from "@/app/(app)/home/ai-actions"
import { SettingsCard } from "@/components/settings-card"
import {
  formatDisplayTime,
  dateToString,
  formatDisplayDate,
} from "@/lib/time-utils"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
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
  workplace_location?: string
  shift_date?: string
  start_time?: string
  end_time?: string
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
  const [openIndex, setOpenIndex] = useState<number | null>(0)

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
            let selectedDateObj: Date | undefined = undefined

            if (shift.shift_date) {
              const dateObj = new Date(`${shift.shift_date}T00:00:00`)
              if (!isNaN(dateObj.getTime())) {
                selectedDateObj = dateObj
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
                  className={cn(
                    "flex h-14 w-full items-center justify-between px-4 sm:px-6 transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 rounded-[24px] cursor-pointer outline-none select-none gap-3",
                    hasError && "ring-1 ring-destructive/50 bg-destructive/5"
                  )}
                >
                  {/* Left: Date Circle Badge + Workplace Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-full bg-foreground/[0.05] border border-border/50 text-center select-none shadow-sm">
                      <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase leading-none">
                        {weekday}
                      </span>
                      <span className="text-[12px] font-bold text-foreground leading-none mt-0.5">
                        {dayNumber}
                      </span>
                    </div>

                    <span className="text-sm font-medium text-foreground truncate text-left">
                      {shift.workplace_name || "Workplace"}
                    </span>
                  </div>

                  {/* Right: Shift Timing + Chevron Arrow */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[13px] text-muted-foreground font-medium">
                      {displayStart} – {displayEnd}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    >
                      <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    </motion.div>
                  </div>
                </button>

                {/* Bouncy Spring Expanded Body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 pt-2 sm:px-6 flex flex-col gap-4">
                        <FieldGroup>
                          {/* Workplace & Location */}
                          <div className="grid grid-cols-2 gap-3">
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
                                className="h-12 bg-card rounded-full px-4"
                                aria-invalid={!!shiftErrors.workplace_name}
                              />
                              {shiftErrors.workplace_name && (
                                <FieldError errors={[{ message: shiftErrors.workplace_name }]} />
                              )}
                            </Field>

                            <Field data-invalid={!!shiftErrors.workplace_location}>
                              <FieldLabel>Location</FieldLabel>
                              <Input
                                type="text"
                                value={shift.workplace_location || ""}
                                onChange={(e) =>
                                  onUpdateShift(index, {
                                    ...shift,
                                    workplace_location: e.target.value,
                                  })
                                }
                                placeholder="Downtown"
                                className="h-12 bg-card rounded-full px-4"
                                aria-invalid={!!shiftErrors.workplace_location}
                              />
                              {shiftErrors.workplace_location && (
                                <FieldError errors={[{ message: shiftErrors.workplace_location }]} />
                              )}
                            </Field>
                          </div>

                          {/* Date Field (Custom Trigger with Left Calendar Icon) */}
                          <Field data-invalid={!!shiftErrors.shift_date}>
                            <FieldLabel>Date</FieldLabel>
                            <button
                              type="button"
                              onClick={() => openDateModalFor(index)}
                              className={cn(
                                "flex h-12 w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none cursor-pointer",
                                shift.shift_date ? "text-foreground" : "text-muted-foreground",
                                shiftErrors.shift_date && "border-destructive"
                              )}
                            >
                              <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                              <span className="whitespace-nowrap text-sm font-medium">
                                {dateDisplay}
                              </span>
                              <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                            </button>
                            {shiftErrors.shift_date && (
                              <FieldError errors={[{ message: shiftErrors.shift_date }]} />
                            )}
                          </Field>

                          {/* Starts & Ends Time Pickers (Custom Triggers with Left Clock Icon) */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Start time */}
                            <Field data-invalid={!!shiftErrors.start_time}>
                              <FieldLabel>Starts</FieldLabel>
                              <button
                                type="button"
                                onClick={() => openTimeModalFor(index, "start")}
                                className={cn(
                                  "flex h-12 w-full items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none cursor-pointer",
                                  shift.start_time ? "text-foreground" : "text-muted-foreground",
                                  shiftErrors.start_time && "border-destructive"
                                )}
                              >
                                <Clock className="size-4 text-muted-foreground shrink-0" />
                                <span className="whitespace-nowrap text-sm font-medium">
                                  {displayStart}
                                </span>
                                <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                              </button>
                              {shiftErrors.start_time && (
                                <FieldError errors={[{ message: shiftErrors.start_time }]} />
                              )}
                            </Field>

                            {/* End time */}
                            <Field data-invalid={!!shiftErrors.end_time}>
                              <FieldLabel>Ends</FieldLabel>
                              <button
                                type="button"
                                onClick={() => openTimeModalFor(index, "end")}
                                className={cn(
                                  "flex h-12 w-full items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none cursor-pointer",
                                  shift.end_time ? "text-foreground" : "text-muted-foreground",
                                  shiftErrors.end_time && "border-destructive"
                                )}
                              >
                                <Clock className="size-4 text-muted-foreground shrink-0" />
                                <span className="whitespace-nowrap text-sm font-medium">
                                  {displayEnd}
                                </span>
                                <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                              </button>
                              {shiftErrors.end_time && (
                                <FieldError errors={[{ message: shiftErrors.end_time }]} />
                              )}
                            </Field>
                          </div>

                          {/* Hourly rate & Break (min) */}
                          <div className="grid grid-cols-2 gap-3">
                            <Field>
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
                                  value={shift.hourly_rate ?? 0}
                                  onChange={(e) =>
                                    onUpdateShift(index, {
                                      ...shift,
                                      hourly_rate: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="h-12 bg-card rounded-full pl-8 pr-4 text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </Field>

                            <Field>
                              <FieldLabel htmlFor={`break-${index}`}>Break (min)</FieldLabel>
                              <Input
                                id={`break-${index}`}
                                type="number"
                                inputMode="numeric"
                                step="1"
                                value={shift.break_duration ?? 0}
                                onChange={(e) =>
                                  onUpdateShift(index, {
                                    ...shift,
                                    break_duration: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="h-12 bg-card rounded-full px-4 text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
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
                              if (openIndex === index) setOpenIndex(null)
                            }}
                            className="h-10 px-4 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
