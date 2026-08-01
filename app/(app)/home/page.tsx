"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { List, Calendar, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react"
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
import type { Shift, ShiftFormValues } from "@/lib/schemas/shift-form-schema"
import { getUserPreferences, type UserPreferences } from "@/app/(app)/settings/defaults/actions"
import { getShifts, createShift, updateShift, deleteShift } from "@/app/(app)/home/actions"
import {
  formatDisplayDate,
  formatShiftDisplayDate,
  formatDisplayTime,
  calculateShiftIncome,
  calculateShiftDurationHours,
  formatCurrency,
} from "@/lib/time-utils"

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

  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
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
                <Calendar className="size-5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <motion.button
            type="button"
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            onClick={openCreate}
            className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors focus:outline-none shrink-0"
            aria-label="Add Shift"
          >
            Add
          </motion.button>
        </div>

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

          {/* Month Pagination Buttons */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.85, opacity: 0.7 }}
              onClick={prevMonth}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-xl transition-colors hover:bg-card/90 text-foreground cursor-pointer shadow-sm"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </motion.button>

            <span className="text-[15px] font-semibold text-foreground px-2 select-none">
              {monthLabel}
            </span>

            <motion.button
              type="button"
              whileTap={{ scale: 0.85, opacity: 0.7 }}
              onClick={nextMonth}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-xl transition-colors hover:bg-card/90 text-foreground cursor-pointer shadow-sm"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </motion.button>
          </div>
        </div>

        {/* Activity Section */}
        <div className="flex flex-col flex-1">
          <div className="px-2 mb-3">
            <h2 className="text-xl font-bold text-foreground">
              Activity
            </h2>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : !hasMonthlyShifts ? (
            /* ── Empty state ─────────────────────────────── */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center py-10">
              <div className="size-16 rounded-full bg-card/80 backdrop-blur-xl border border-border/40 flex items-center justify-center text-muted-foreground shadow-sm">
                <Clock className="size-7 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-xs">
                <p className="text-[17px] font-semibold text-foreground">No shifts in {monthLabel}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tap Add in the top right to record your shift and track your estimated earnings.
                </p>
              </div>
            </div>
          ) : (
            /* ── Shift List ── */
            <div className="flex flex-col gap-3 pb-24 overflow-y-auto">
              <SettingsCard>
                {monthlyShifts.map((shift, index) => {
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

                  return (
                    <div key={shift.id}>
                      {index > 0 && <div className="h-[1px] bg-border/40 mx-4" />}
                      <button
                        type="button"
                        onClick={() => openView(shift)}
                        className="flex h-16 w-full items-center justify-between px-6 transition-colors rounded-[28px] group relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 text-left"
                      >
                        {/* Left: Workplace (Top) + Date (Bottom) */}
                        <div className="flex flex-col gap-1 min-w-0 flex-1 pr-4">
                          <span className="text-[15px] font-medium text-foreground truncate">
                            {shift.workplace_name}
                          </span>
                          <span className="text-[13px] text-muted-foreground">
                            {formatShiftDisplayDate(shift.shift_date)}
                          </span>
                        </div>

                        {/* Right: Estimated Income + Chevron */}
                        <div className="flex items-center gap-3 shrink-0">
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
            </div>
          )}
        </div>
      </div>

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
