"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import { List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Clock, Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { AnimatedNumber } from "@/components/motion/animated-number"
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalClose,
} from "@/components/motion/center-morph-modal"
import { Button } from "@/components/motion/button/base"
import { SettingsCard } from "@/components/settings-card"
import { ShiftForm } from "@/components/shift-form"
import { Calendar } from "@/components/ui/calendar"
import { WheelPicker } from "@/components/motion/wheel-picker"
import type { Shift, ShiftFormValues } from "@/lib/schemas/shift-form-schema"
import { getUserPreferences, type UserPreferences } from "@/app/(app)/settings/defaults/actions"
import { getShifts, createShift, updateShift, deleteShift } from "@/app/(app)/home/actions"
import {
  dateToString,
  formatDisplayDate,
  formatShiftDisplayDate,
  formatDisplayTime,
  calculateShiftIncome,
  calculateShiftDurationHours,
  formatCurrency,
} from "@/lib/time-utils"

const MONTH_OPTIONS = [
  { label: "January", value: "0" },
  { label: "February", value: "1" },
  { label: "March", value: "2" },
  { label: "April", value: "3" },
  { label: "May", value: "4" },
  { label: "June", value: "5" },
  { label: "July", value: "6" },
  { label: "August", value: "7" },
  { label: "September", value: "8" },
  { label: "October", value: "9" },
  { label: "November", value: "10" },
  { label: "December", value: "11" },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 21 }, (_, i) => {
  const y = String(CURRENT_YEAR - 10 + i)
  return { label: y, value: y }
})

function shiftToShiftFormValues(shift: Shift): ShiftFormValues {
  return {
    workplace_name: shift.workplace_name,
    workplace_location: shift.workplace_location,
    shift_date: shift.shift_date,
    start_time: shift.start_time.slice(0, 5),
    end_time: shift.end_time.slice(0, 5),
    hourly_rate: Number(shift.hourly_rate),
    break_duration: Number(shift.break_duration),
  }
}

export default function HomePage() {
  const [viewMode, setViewMode] = useState<string>("list")
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(() => new Date())
  const [monthYearPickerOpen, setMonthYearPickerOpen] = useState(false)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalMode, setModalMode] = useState<"create" | "view" | "edit" | null>(null)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [preferences, setPreferences] = useState<UserPreferences>({
    time_format: "12h",
    first_day_of_week: "Monday",
    default_hourly_rate: 0,
    default_break_duration: 0,
  })

  // Load preferences and shifts on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [prefs, shiftList] = await Promise.all([
          getUserPreferences(),
          getShifts(),
        ])
        setPreferences(prefs)
        setShifts(shiftList)
      } catch (err) {
        console.error("Error loading home data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // ── Modal handlers ──────────────────────────────────────────
  const openCreate = () => {
    setSelectedShift(null)
    setModalMode("create")
  }

  const openView = (shift: Shift) => {
    setSelectedShift(shift)
    setModalMode("view")
  }

  const openEdit = () => {
    setModalMode("edit")
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedShift(null)
  }

  // ── CRUD Handlers ───────────────────────────────────────────
  const handleCreate = async (data: ShiftFormValues) => {
    setIsSaving(true)
    try {
      const created = await createShift(data)
      setShifts((prev) => [created, ...prev])
      closeModal()
    } catch (err) {
      console.error("Failed to create shift:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (data: ShiftFormValues) => {
    if (!selectedShift) return
    setIsSaving(true)
    try {
      const updated = await updateShift(selectedShift.id, data)
      setShifts((prev) =>
        prev.map((s) => (s.id === selectedShift.id ? updated : s))
      )
      closeModal()
    } catch (err) {
      console.error("Failed to update shift:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedShift) return
    setIsDeleting(true)
    try {
      await deleteShift(selectedShift.id)
      setShifts((prev) => prev.filter((s) => s.id !== selectedShift.id))
      closeModal()
    } catch (err) {
      console.error("Failed to delete shift:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const changeMonth = (targetYear: number, targetMonth: number) => {
    const newDate = new Date(targetYear, targetMonth, 1)
    setCurrentDate(newDate)

    // Synchronize selected calendar day to the new month
    const today = new Date()
    if (today.getFullYear() === targetYear && today.getMonth() === targetMonth) {
      setSelectedCalendarDate(today)
    } else {
      const prevDay = selectedCalendarDate ? selectedCalendarDate.getDate() : 1
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
      const targetDay = Math.min(prevDay, daysInMonth)
      setSelectedCalendarDate(new Date(targetYear, targetMonth, targetDay))
    }
  }

  const prevMonth = () => {
    changeMonth(currentDate.getFullYear(), currentDate.getMonth() - 1)
  }

  const nextMonth = () => {
    changeMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
  }

  const listMonthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
  })

  const calendarMonthYearLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const monthlyShifts = shifts.filter((shift) => {
    if (!shift.shift_date) return false
    const [y, m] = shift.shift_date.split("-").map(Number)
    return y === currentYear && m === currentMonth + 1
  })

  const totalMonthlyEarned = monthlyShifts.reduce((sum, shift) => {
    const income =
      shift.total_earned !== undefined && shift.total_earned !== null
        ? Number(shift.total_earned)
        : shift.estimated_income !== undefined && shift.estimated_income !== null
        ? Number(shift.estimated_income)
        : calculateShiftIncome(
            shift.start_time,
            shift.end_time,
            shift.hourly_rate,
            shift.break_duration
          )
    return sum + income
  }, 0)

  const hasMonthlyShifts = monthlyShifts.length > 0

  // Dates with shifts for Calendar dots
  const shiftDates = useMemo(() => {
    return shifts.map((s) => {
      const [y, m, d] = (s.shift_date || "").split("-").map(Number)
      return new Date(y, m - 1, d)
    })
  }, [shifts])

  // Selected date shifts in Calendar view
  const selectedDateStr = selectedCalendarDate
    ? dateToString(selectedCalendarDate)
    : ""

  const selectedDayShifts = useMemo(() => {
    if (!selectedDateStr) return []
    return shifts.filter((s) => s.shift_date === selectedDateStr)
  }, [shifts, selectedDateStr])

  const selectedDayEarned = useMemo(() => {
    return selectedDayShifts.reduce((sum, shift) => {
      const income =
        shift.total_earned !== undefined && shift.total_earned !== null
          ? Number(shift.total_earned)
          : shift.estimated_income !== undefined && shift.estimated_income !== null
          ? Number(shift.estimated_income)
          : calculateShiftIncome(
              shift.start_time,
              shift.end_time,
              shift.hourly_rate,
              shift.break_duration
            )
      return sum + income
    }, 0)
  }, [selectedDayShifts])

  const selectedDayLabel = selectedCalendarDate
    ? selectedCalendarDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : ""

  const renderShiftList = (shiftList: Shift[]) => (
    <SettingsCard>
      {shiftList.map((shift, index) => {
        const income =
          shift.total_earned !== undefined && shift.total_earned !== null
            ? Number(shift.total_earned)
            : shift.estimated_income !== undefined && shift.estimated_income !== null
            ? Number(shift.estimated_income)
            : calculateShiftIncome(
                shift.start_time,
                shift.end_time,
                shift.hourly_rate,
                shift.break_duration
              )

        const [y, m, d] = (shift.shift_date || "").split("-").map(Number)
        const shiftDate = y && m && d ? new Date(y, m - 1, d) : new Date()
        const weekday = shiftDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
        const dayNumber = shiftDate.getDate()

        return (
          <div key={shift.id}>
            {index > 0 && <div className="h-[1px] bg-border/40 mx-4" />}
            <button
              type="button"
              onClick={() => openView(shift)}
              className="flex h-[72px] w-full items-center justify-between px-4 sm:px-5 transition-colors rounded-full group relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 text-left gap-3"
            >
              {/* Left: Circular Date Badge + (Workplace & Time) */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Circular Glass Calendar Badge */}
                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-full bg-card/90 backdrop-blur-xl border border-border/60 text-center select-none shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase leading-none">
                    {weekday}
                  </span>
                  <span className="text-[15px] font-bold text-foreground leading-none mt-0.5">
                    {dayNumber}
                  </span>
                </div>

                {/* Workplace & Time Range */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-[15px] font-medium text-foreground truncate">
                    {shift.workplace_name}
                  </span>
                  <span className="text-[13px] text-muted-foreground truncate">
                    {formatDisplayTime(shift.start_time, preferences.time_format)} – {formatDisplayTime(shift.end_time, preferences.time_format)}
                  </span>
                </div>
              </div>

              {/* Right: Income + Chevron */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-[15px] font-semibold text-foreground">
                  {formatCurrency(income)}
                </span>
                <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        )
      })}
    </SettingsCard>
  )

  return (
    <>
      <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
        {/* Header */}
        <div className="relative flex items-center justify-between w-full mb-4 shrink-0 min-h-[3rem] gap-4">
          <Tabs
            id="home-view-mode-tabs"
            value={viewMode}
            onValueChange={setViewMode}
            variant="pill"
          >
            <TabsList className="bg-card/80 backdrop-blur-xl border border-border p-1 rounded-full h-12 flex items-center gap-1 shadow-sm">
              <TabsTrigger
                value="list"
                aria-label="List view"
                className="h-full aspect-square rounded-full flex items-center justify-center"
                buttonClassName="px-0"
                indicatorClassName="bg-black/10 dark:bg-white/10"
              >
                <List className="size-5" />
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                aria-label="Calendar view"
                className="h-full aspect-square rounded-full flex items-center justify-center"
                buttonClassName="px-0"
                indicatorClassName="bg-black/10 dark:bg-white/10"
              >
                <CalendarIcon className="size-5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <motion.button
            type="button"
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            onClick={openCreate}
            className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors focus:outline-none shrink-0 shadow-sm cursor-pointer"
            aria-label="Add Shift"
          >
            Add
          </motion.button>
        </div>

        {/* ── View Content (List vs Calendar) ────────────────── */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : viewMode === "list" ? (
          /* ── Original List View with Hero Section ── */
          <div className="flex flex-col flex-1 pb-24">
            {/* Hero Section: Total Earned + Month Navigation */}
            <div className="flex flex-col items-center justify-center text-center gap-1 my-4 mb-6">
              <span className="text-[13px] font-medium text-muted-foreground">
                Total earned
              </span>
              <div className="text-4xl font-bold text-foreground tabular-nums my-0.5">
                <AnimatedNumber
                  value={totalMonthlyEarned}
                  format={(n) => formatCurrency(n)}
                />
              </div>

              {/* Month Pagination (Frameless Typography Centered) */}
              <div className="w-full flex items-center justify-center gap-1.5 mt-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={prevMonth}
                  className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setMonthYearPickerOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-full text-[14px] font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer select-none text-center"
                  aria-label="Select month and year"
                >
                  <span>{calendarMonthYearLabel}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={nextMonth}
                  className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </motion.button>
              </div>
            </div>

            {/* Activity Section */}
            <div className="px-2 mb-3">
              <h2 className="text-xl font-bold text-foreground">
                Activity
              </h2>
            </div>

            {!hasMonthlyShifts ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center py-10">
                <div className="size-16 rounded-full bg-card/80 backdrop-blur-xl border border-border/40 flex items-center justify-center text-muted-foreground shadow-sm">
                  <Clock className="size-7 stroke-[1.5]" />
                </div>
                <div className="flex flex-col gap-1.5 max-w-xs">
                  <p className="text-[17px] font-semibold text-foreground">No shifts in {listMonthLabel}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tap Add in the top right to record your shift and track your estimated earnings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {renderShiftList(monthlyShifts)}
              </div>
            )}
          </div>
        ) : (
          /* ── Calendar View ── */
          <div className="flex flex-col flex-1 pb-24 mt-2">
            {/* Frameless Calendar Grid Container */}
            <div className="flex flex-col items-center w-full mx-auto mb-6">
              {/* Calendar Header with < Month/Year Dropdown > Layout */}
              <div className="w-full flex items-center justify-center gap-1.5 mb-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={prevMonth}
                  className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setMonthYearPickerOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-full text-[14px] font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer select-none text-center"
                  aria-label="Select month and year"
                >
                  <span>{calendarMonthYearLabel}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={nextMonth}
                  className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </motion.button>
              </div>

              {/* Native Frameless Calendar Component */}
              <Calendar
                mode="single"
                month={currentDate}
                onMonthChange={(newMonth) => {
                  changeMonth(newMonth.getFullYear(), newMonth.getMonth())
                }}
                selected={selectedCalendarDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedCalendarDate(date)
                    if (
                      date.getMonth() !== currentDate.getMonth() ||
                      date.getFullYear() !== currentDate.getFullYear()
                    ) {
                      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1))
                    }
                  }
                }}
                modifiers={{
                  hasShift: shiftDates,
                }}
                className="bg-transparent p-0"
                classNames={{
                  root: "w-fit",
                  months: "flex flex-col gap-2",
                  month: "flex flex-col gap-2",
                  nav: "hidden",
                  month_caption: "hidden",
                  month_grid: "w-fit border-collapse",
                  weekdays: "flex justify-between gap-1.5",
                  weekday: "size-9 text-[11px] font-medium text-muted-foreground/70 select-none flex items-center justify-center uppercase tracking-wider",
                  week: "mt-1 flex w-fit justify-between gap-1.5",
                  day: "group/day relative size-9 p-0 text-center select-none flex items-center justify-center",
                }}
              />
            </div>

            {/* Selected Day Activity Section */}
            <div className="flex flex-col gap-3">
              <div className="px-2 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  Activity
                </h2>
                {selectedDayLabel && (
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {selectedDayLabel}
                  </span>
                )}
              </div>

              {selectedDayShifts.length > 0 ? (
                renderShiftList(selectedDayShifts)
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-card/80 backdrop-blur-xl rounded-[28px] border border-border/40 shadow-sm gap-2">
                  <p className="text-[15px] font-medium text-foreground">
                    No shifts on this day
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    Tap Add in the top right to record a shift for {selectedDayLabel || "this date"}.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Month & Year Wheel Picker Modal ─────────────────── */}
      <CenterMorphModal
        open={monthYearPickerOpen}
        onOpenChange={setMonthYearPickerOpen}
      >
        <CenterMorphModalContent
          ariaLabel="Select month and year"
          showCloseButton={false}
          dismissible={true}
          noMorph
          className="w-[280px] p-3 border-border/60 shadow-sm bg-card"
        >
          <div className="flex items-stretch justify-center gap-2 px-2">
            <WheelPicker
              options={MONTH_OPTIONS}
              value={String(currentDate.getMonth())}
              onValueChange={(val) => {
                const newMonth = Number(val)
                changeMonth(currentDate.getFullYear(), newMonth)
              }}
              className="flex-1 border-0 bg-transparent rounded-full"
              visibleCount={5}
              itemHeight={38}
              sound
              aria-label="Month"
            />
            <WheelPicker
              options={YEAR_OPTIONS}
              value={String(currentDate.getFullYear())}
              onValueChange={(val) => {
                const newYear = Number(val)
                changeMonth(newYear, currentDate.getMonth())
              }}
              className="w-24 border-0 bg-transparent rounded-full"
              visibleCount={5}
              itemHeight={38}
              sound
              aria-label="Year"
            />
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Create Shift Modal ──────────────────────────── */}
      <CenterMorphModal
        open={modalMode === "create"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="New Shift"
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          <ShiftForm
            title="New Shift"
            onSubmit={handleCreate}
            isSaving={isSaving}
            timeFormat={preferences.time_format}
            defaultValues={{
              hourly_rate: preferences.default_hourly_rate || undefined,
              break_duration: preferences.default_break_duration || undefined,
            }}
          />
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── View Shift Modal ────────────────────────────── */}
      <CenterMorphModal
        open={modalMode === "view"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="Shift Details"
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          {selectedShift && (
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col gap-2 text-center px-4">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {selectedShift.workplace_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatDisplayDate(selectedShift.shift_date)}
                </p>
              </div>

              {/* Details Breakdown */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40 gap-4">
                  <span className="text-muted-foreground shrink-0">Location</span>
                  <span className="text-foreground font-medium truncate max-w-[60%] text-right">
                    {selectedShift.workplace_location}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-foreground font-medium">
                    {formatDisplayTime(selectedShift.start_time, preferences.time_format)}
                    {" – "}
                    {formatDisplayTime(selectedShift.end_time, preferences.time_format)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="text-foreground font-medium">
                    ${Number(selectedShift.hourly_rate).toFixed(2)} / hr
                  </span>
                </div>

                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40">
                  <span className="text-muted-foreground">Break</span>
                  <span className="text-foreground font-medium">
                    {selectedShift.break_duration} min
                  </span>
                </div>

                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40">
                  <span className="text-muted-foreground">Total Worked</span>
                  <span className="text-foreground font-medium">
                    {calculateShiftDurationHours(
                      selectedShift.start_time,
                      selectedShift.end_time,
                      selectedShift.break_duration
                    ).toFixed(2)}{" "}
                    hrs
                  </span>
                </div>

                <div className="flex items-center justify-between text-[15px] py-3.5">
                  <span className="text-muted-foreground font-semibold">Estimated Income</span>
                  <span className="text-primary font-bold text-base">
                    {formatCurrency(
                      selectedShift.estimated_income !== undefined && selectedShift.estimated_income !== null
                        ? Number(selectedShift.estimated_income)
                        : calculateShiftIncome(
                            selectedShift.start_time,
                            selectedShift.end_time,
                            selectedShift.hourly_rate,
                            selectedShift.break_duration
                          )
                    )}
                  </span>
                </div>
              </div>

              {/* Actions: Delete + Edit */}
              <div className="mt-2 flex justify-end gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting" : "Delete"}
                </Button>
                <Button onClick={openEdit} disabled={isDeleting}>
                  Edit
                </Button>
              </div>
            </div>
          )}
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Edit Shift Modal ────────────────────────────── */}
      <CenterMorphModal
        open={modalMode === "edit"}
        onOpenChange={(open) => !open && setModalMode("view")}
      >
        <CenterMorphModalContent
          ariaLabel="Edit Shift"
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          {selectedShift && (
            <ShiftForm
              key={selectedShift.id}
              title="Edit Shift"
              onSubmit={handleUpdate}
              isSaving={isSaving}
              timeFormat={preferences.time_format}
              defaultValues={shiftToShiftFormValues(selectedShift)}
            />
          )}
        </CenterMorphModalContent>
      </CenterMorphModal>
    </>
  )
}
