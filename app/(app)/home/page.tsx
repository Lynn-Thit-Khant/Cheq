"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Clock, Check, Trash2, MapPin, Tag, Coffee, Building2, Sparkles, LayoutTemplate, Keyboard, FileText, Image } from "lucide-react"
import { ConfirmModal } from "@/components/confirm-modal"
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { AnimatedNumber } from "@/components/motion/animated-number"
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalClose,
} from "@/components/motion/center-morph-modal"
import { Button } from "@/components/motion/button/base"
import { SettingsCard } from "@/components/settings-card"
import { SettingsRow } from "@/components/settings-row"
import { ShiftForm } from "@/components/shift-form"
import { TemplateForm } from "@/components/template-form"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/ui/field"
import { WheelPicker } from "@/components/motion/wheel-picker"
import { useRouter } from "next/navigation"
import type { Shift, ShiftFormValues, ShiftTemplate, TemplateFormValues } from "@/lib/schemas/shift-form-schema"
import { Loader } from "@/components/motion/loader"
import { getUserPreferences, type UserPreferences } from "@/app/(app)/settings/defaults/actions"
import { getTemplates, createTemplate } from "@/app/(app)/settings/templates/actions"
import { getShifts, createShift, updateShift, deleteShift, bulkCreateShifts } from "@/app/(app)/home/actions"
import { extractShiftsFromText, type ExtractedShift } from "./ai-actions"
import { ExtractedShiftAccordion, type ExtractedShiftErrors } from "@/components/extracted-shift-accordion"
import { detectShiftConflict, type ShiftConflictType } from "@/lib/shift-conflict-utils"
import { ShiftConflictModal } from "@/components/shift-conflict-modal"
import { cn } from "@/lib/utils"
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

interface ShiftWeekGroup {
  weekKey: string
  label: string
  startDate: Date
  endDate: Date
  shifts: Shift[]
  totalEarned: number
}

function getWeekRangeLabel(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const startDay = startDate.getDate()
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const endDay = endDate.getDate()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}`
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`
}

function groupShiftsByWeek(
  shifts: Shift[],
  year: number,
  month: number,
  firstDayOfWeek: "Sunday" | "Monday"
): ShiftWeekGroup[] {
  if (shifts.length === 0) return []

  const targetDayOfWeek = firstDayOfWeek === "Sunday" ? 0 : 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const groupsMap = new Map<string, { startDate: Date; endDate: Date; shifts: Shift[] }>()

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    const currentDayOfWeek = d.getDay()
    let diffToStart = currentDayOfWeek - targetDayOfWeek
    if (diffToStart < 0) diffToStart += 7

    const weekStart = new Date(year, month, day - diffToStart)
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)

    const clampedStart = weekStart.getMonth() === month ? weekStart : new Date(year, month, 1)
    const clampedEnd = weekEnd.getMonth() === month ? weekEnd : new Date(year, month, daysInMonth)

    const weekKey = `${clampedStart.getFullYear()}-${clampedStart.getMonth()}-${clampedStart.getDate()}`

    if (!groupsMap.has(weekKey)) {
      groupsMap.set(weekKey, {
        startDate: clampedStart,
        endDate: clampedEnd,
        shifts: [],
      })
    }
  }

  for (const shift of shifts) {
    if (!shift.shift_date) continue
    const [y, m, d] = shift.shift_date.split("-").map(Number)
    const shiftDate = new Date(y, m - 1, d)

    const currentDayOfWeek = shiftDate.getDay()
    let diffToStart = currentDayOfWeek - targetDayOfWeek
    if (diffToStart < 0) diffToStart += 7

    const weekStart = new Date(y, m - 1, d - diffToStart)
    const clampedStart = weekStart.getMonth() === month ? weekStart : new Date(year, month, 1)
    const weekKey = `${clampedStart.getFullYear()}-${clampedStart.getMonth()}-${clampedStart.getDate()}`

    const group = groupsMap.get(weekKey)
    if (group) {
      group.shifts.push(shift)
    }
  }

  const result: ShiftWeekGroup[] = []

  for (const [weekKey, group] of groupsMap.entries()) {
    if (group.shifts.length === 0) continue

    group.shifts.sort((a, b) => {
      if (a.shift_date !== b.shift_date) {
        return b.shift_date.localeCompare(a.shift_date)
      }
      return b.start_time.localeCompare(a.start_time)
    })

    const totalEarned = group.shifts.reduce((sum, s) => {
      const income =
        s.total_earned !== undefined && s.total_earned !== null
          ? Number(s.total_earned)
          : s.estimated_income !== undefined && s.estimated_income !== null
          ? Number(s.estimated_income)
          : calculateShiftIncome(s.start_time, s.end_time, s.hourly_rate, s.break_duration)
      return sum + income
    }, 0)

    result.push({
      weekKey,
      label: getWeekRangeLabel(group.startDate, group.endDate),
      startDate: group.startDate,
      endDate: group.endDate,
      shifts: group.shifts,
      totalEarned,
    })
  }

  result.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())

  return result
}

function shiftToShiftFormValues(shift: Shift): ShiftFormValues {
  return {
    workplace_name: shift.workplace_name,
    shift_date: shift.shift_date,
    start_time: shift.start_time.slice(0, 5),
    end_time: shift.end_time.slice(0, 5),
    hourly_rate: Number(shift.hourly_rate),
    break_duration: Number(shift.break_duration),
  }
}

export default function HomePage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<string>("list")
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(() => new Date())
  const [monthYearPickerOpen, setMonthYearPickerOpen] = useState(false)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [templates, setTemplates] = useState<ShiftTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalMode, setModalMode] = useState<"select-method" | "select-smart-add" | "smart-add-paste" | "smart-add-review" | "select-template" | "confirm-template" | "create-template" | "create-from-template" | "create" | "view" | "edit" | null>(null)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null)
  const [pastedText, setPastedText] = useState("")
  const [extractedShifts, setExtractedShifts] = useState<ExtractedShift[]>([])
  const [extractedShiftErrors, setExtractedShiftErrors] = useState<Record<number, ExtractedShiftErrors>>({})
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false)
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [conflictType, setConflictType] = useState<ShiftConflictType | null>(null)
  const [conflictingShift, setConflictingShift] = useState<Shift | null>(null)
  const [pendingShift, setPendingShift] = useState<ShiftFormValues | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)

  const [preferences, setPreferences] = useState<UserPreferences>({
    time_format: "12h",
    first_day_of_week: "Monday",
    default_hourly_rate: 0,
    default_break_duration: 0,
  })

  // Load preferences, shifts, and templates on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [prefs, shiftList, templateList] = await Promise.all([
          getUserPreferences(),
          getShifts(),
          getTemplates(),
        ])
        setPreferences(prefs)
        setShifts(shiftList)
        setTemplates(templateList)
      } catch (err) {
        console.error("Error loading home data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const [createDefaultDate, setCreateDefaultDate] = useState<Date | null>(null)

  // ── Modal handlers ──────────────────────────────────────────
  const openCreate = () => {
    setCreateDefaultDate(null)
    setSelectedShift(null)
    setModalMode("select-method")
  }

  const openCreateWithDate = (date: Date) => {
    setCreateDefaultDate(date)
    setSelectedShift(null)
    setModalMode("select-method")
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
    setPastedText("")
    setExtractedShifts([])
    setExtractedShiftErrors({})
  }

  const handleExtractShifts = async () => {
    if (!pastedText || !pastedText.trim()) return
    setIsExtracting(true)
    setExtractedShiftErrors({})
    try {
      const results = await extractShiftsFromText(pastedText, {
        default_hourly_rate: preferences.default_hourly_rate || 20,
        default_break_duration: preferences.default_break_duration || 0,
      })
      if (results.length > 0) {
        setExtractedShifts(results)
        setModalMode("smart-add-review")
      }
    } catch (err) {
      console.error("Failed to extract shifts:", err)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleUpdateExtractedShift = (index: number, updated: ExtractedShift) => {
    setExtractedShifts((prev) => {
      const next = [...prev]
      next[index] = updated
      return next
    })
    // Clear errors for this shift index when edited
    setExtractedShiftErrors((prev) => {
      if (!prev[index]) return prev
      const copy = { ...prev }
      delete copy[index]
      return copy
    })
  }

  const handleDeleteExtractedShift = (index: number) => {
    setExtractedShifts((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) {
        setModalMode("smart-add-paste")
      }
      return next
    })
    setExtractedShiftErrors((prev) => {
      if (!prev[index]) return prev
      const copy = { ...prev }
      delete copy[index]
      return copy
    })
  }

  const handleSaveExtractedShifts = async () => {
    if (extractedShifts.length === 0) return

    // Validate all extracted shifts
    const errorsMap: Record<number, ExtractedShiftErrors> = {}
    let hasError = false

    extractedShifts.forEach((shift, index) => {
      const itemErrors: ExtractedShiftErrors = {}
      if (!shift.workplace_name || !shift.workplace_name.trim()) {
        itemErrors.workplace_name = "Workplace is required"
        hasError = true
      }
      if (!shift.shift_date || !shift.shift_date.trim()) {
        itemErrors.shift_date = "Date is required"
        hasError = true
      }
      if (!shift.start_time || !shift.start_time.trim()) {
        itemErrors.start_time = "Start time is required"
        hasError = true
      }
      if (!shift.end_time || !shift.end_time.trim()) {
        itemErrors.end_time = "End time is required"
        hasError = true
      }

      if (Object.keys(itemErrors).length > 0) {
        errorsMap[index] = itemErrors
      }
    })

    if (hasError) {
      setExtractedShiftErrors(errorsMap)
      return
    }

    setExtractedShiftErrors({})

    setIsSaving(true)
    try {
      const created = await bulkCreateShifts(
        extractedShifts.map((s) => ({
          workplace_name: s.workplace_name,
          shift_date: s.shift_date,
          start_time: s.start_time,
          end_time: s.end_time,
          hourly_rate: s.hourly_rate ?? preferences.default_hourly_rate ?? 0,
          break_duration: s.break_duration ?? preferences.default_break_duration ?? 0,
        }))
      )
      setShifts((prev) => [...created, ...prev])
      closeModal()
    } catch (err) {
      console.error("Failed to save extracted shifts:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreate = async (data: ShiftFormValues) => {
    // Detect collision against existing shifts
    const conflictResult = detectShiftConflict(data, shifts)

    if (conflictResult.hasConflict) {
      setPendingShift(data)
      setConflictingShift(conflictResult.conflictingShift)
      setConflictType(conflictResult.conflictType)
      setConflictModalOpen(true)
      return
    }

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

  const handleConflictPrimaryAction = async () => {
    if (!pendingShift) return

    if (conflictType === "exact_duplicate") {
      // Primary CTA = Skip Duplicate -> Simply close modal and clear pending state
      setConflictModalOpen(false)
      setPendingShift(null)
      setConflictingShift(null)
      setConflictType(null)
      closeModal()
      return
    }

    // Primary CTA = Replace Shift -> Delete existing conflicting shift and save pending shift
    if (!conflictingShift) return
    setIsSaving(true)
    try {
      await deleteShift(conflictingShift.id)
      const created = await createShift(pendingShift)
      setShifts((prev) => [created, ...prev.filter((s) => s.id !== conflictingShift.id)])
      setConflictModalOpen(false)
      setPendingShift(null)
      setConflictingShift(null)
      setConflictType(null)
      closeModal()
    } catch (err) {
      console.error("Failed to replace shift:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleConflictSecondaryAction = async () => {
    if (!pendingShift) return

    // Secondary CTA = Keep Both -> Save pending shift as double shift / overlap
    setIsSaving(true)
    try {
      const created = await createShift(pendingShift)
      setShifts((prev) => [created, ...prev])
      setConflictModalOpen(false)
      setPendingShift(null)
      setConflictingShift(null)
      setConflictType(null)
      closeModal()
    } catch (err) {
      console.error("Failed to keep both shifts:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTemplate = async (data: TemplateFormValues) => {
    setIsSavingTemplate(true)
    try {
      const created = await createTemplate(data)
      setTemplates((prev) => [...prev, created])
      setModalMode("select-template")
    } catch (err) {
      console.error("Failed to create template:", err)
    } finally {
      setIsSavingTemplate(false)
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
      setSingleDeleteConfirmOpen(false)
      closeModal()
    } catch (err) {
      console.error("Failed to delete shift:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Select Mode Handlers ────────────────────────────────────
  const enterSelectMode = (shiftId: string) => {
    setIsSelectMode(true)
    setSelectedIds(new Set([shiftId]))
  }

  const exitSelectMode = () => {
    setIsSelectMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleLongPressStart = (shiftId: string) => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      enterSelectMode(shiftId)
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleBulkDelete = async () => {
    setIsDeletingBulk(true)
    try {
      await Promise.all([...selectedIds].map((id) => deleteShift(id)))
      setShifts((prev) => prev.filter((s) => !selectedIds.has(s.id)))
      setBulkDeleteConfirmOpen(false)
      exitSelectMode()
    } catch (err) {
      console.error("Failed to bulk delete shifts:", err)
    } finally {
      setIsDeletingBulk(false)
    }
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(monthlyShifts.map((s) => s.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
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

  const groupedWeeklyShifts = useMemo(() => {
    return groupShiftsByWeek(
      monthlyShifts,
      currentYear,
      currentMonth,
      preferences.first_day_of_week
    )
  }, [monthlyShifts, currentYear, currentMonth, preferences.first_day_of_week])

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

  // Previous month total earned & MoM delta
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const prevMonthNum = currentMonth === 0 ? 12 : currentMonth

  const prevMonthShifts = shifts.filter((shift) => {
    if (!shift.shift_date) return false
    const [y, m] = shift.shift_date.split("-").map(Number)
    return y === prevMonthYear && m === prevMonthNum
  })

  const prevMonthlyEarned = prevMonthShifts.reduce((sum, shift) => {
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

  const monthDelta = useMemo(() => {
    if (totalMonthlyEarned === 0 && prevMonthlyEarned === 0) return null
    const diff = totalMonthlyEarned - prevMonthlyEarned
    const pct = prevMonthlyEarned > 0 ? (diff / prevMonthlyEarned) * 100 : totalMonthlyEarned > 0 ? 100 : 0
    return {
      isPositive: diff >= 0,
      formattedAmount: `${diff >= 0 ? "+" : "-"}${formatCurrency(Math.abs(diff))}`,
      formattedPercent: Math.abs(pct).toFixed(1),
    }
  }, [totalMonthlyEarned, prevMonthlyEarned])

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

  const shortSelectedDayLabel = selectedCalendarDate
    ? selectedCalendarDate.toLocaleDateString("en-US", {
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
        const isSelected = selectedIds.has(shift.id)

        return (
          <div key={shift.id}>
            {index > 0 && <div className="h-[1px] bg-border/60 mx-4" />}
            <button
              type="button"
              onClick={() => {
                if (isLongPressRef.current) {
                  isLongPressRef.current = false
                  return
                }
                if (isSelectMode) {
                  toggleSelect(shift.id)
                } else {
                  openView(shift)
                }
              }}
              onPointerDown={() => {
                if (!isSelectMode) handleLongPressStart(shift.id)
              }}
              onPointerUp={handleLongPressEnd}
              onPointerLeave={handleLongPressEnd}
              onContextMenu={(e) => e.preventDefault()}
              className="flex h-[72px] w-full items-center justify-between px-4 sm:px-5 transition-colors rounded-full group relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 text-left gap-3 select-none"
            >
              {/* Left: Badge (Date or Checkbox) + Workplace & Time */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Badge: animates between date and checkbox */}
                <AnimatePresence mode="wait" initial={false}>
                  {isSelectMode ? (
                    <motion.div
                      key="checkbox"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className={[
                        "flex size-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isSelected
                          ? "bg-foreground border-foreground"
                          : "bg-transparent border-border/60",
                      ].join(" ")}
                    >
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <Check className="size-5 text-background stroke-[2.5]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="date-badge"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="flex size-12 shrink-0 flex-col items-center justify-center rounded-full bg-card/90 backdrop-blur-xl border border-border/60 text-center select-none shadow-sm"
                    >
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase leading-none">
                        {weekday}
                      </span>
                      <span className="text-[15px] font-bold text-foreground leading-none mt-0.5">
                        {dayNumber}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

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

              {/* Right: Income + Chevron (chevron hidden in select mode) */}
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[15px] font-semibold text-foreground">
                  {formatCurrency(income)}
                </span>
                <AnimatePresence>
                  {!isSelectMode && (
                    <motion.div
                      key="chevron"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>
          </div>
        )
      })}
    </SettingsCard>
  )

  return (
    <>
      <div className="flex flex-1 flex-col p-4 pt-6 sm:pt-8 w-full max-w-md mx-auto relative">
        {/* Header */}
        <div className="relative flex items-center justify-between w-full mb-4 shrink-0 min-h-[3rem] gap-4">
          <AnimatePresence mode="wait" initial={false}>
            {isSelectMode ? (
              /* ── Select Mode Toolbar ── */
              <motion.div
                key="select-toolbar"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative flex items-center w-full"
              >
                {/* Cancel — left */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85, opacity: 0.7 }}
                  onClick={exitSelectMode}
                  className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors focus:outline-none shrink-0 shadow-sm cursor-pointer z-10"
                  aria-label="Cancel selection"
                >
                  Cancel
                </motion.button>

                {/* Select All / Deselect All — absolutely centered text button */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.93, opacity: 0.7 }}
                  onClick={selectedIds.size === monthlyShifts.length ? handleDeselectAll : handleSelectAll}
                  className="absolute inset-0 flex items-center justify-center text-[15px] font-medium text-foreground hover:text-foreground/70 transition-colors focus:outline-none cursor-pointer"
                  aria-label={selectedIds.size === monthlyShifts.length ? "Deselect all shifts" : "Select all shifts"}
                >
                  {selectedIds.size === monthlyShifts.length ? "Deselect All" : "Select All"}
                </motion.button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Delete N — right, destructive */}
                <Button
                  variant={selectedIds.size > 0 ? "destructive" : "secondary"}
                  size="lg"
                  onClick={() => selectedIds.size > 0 && setBulkDeleteConfirmOpen(true)}
                  disabled={selectedIds.size === 0}
                  className={cn(
                    "h-12 px-5 text-[15px] font-medium z-10 shadow-sm rounded-full",
                    selectedIds.size === 0 && "opacity-40 text-muted-foreground/60 cursor-not-allowed bg-card/80 backdrop-blur-xl border border-border"
                  )}
                  aria-label="Delete selected shifts"
                >
                  {selectedIds.size > 0 ? `Delete ${selectedIds.size}` : "Delete"}
                </Button>
              </motion.div>
            ) : (
              /* ── Normal Toolbar ── */
              <motion.div
                key="normal-toolbar"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="flex items-center justify-between w-full gap-4"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── View Content (List vs Calendar) ────────────────── */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader variant="ascii-braille" size={28} className="text-muted-foreground" />
          </div>
        ) : viewMode === "list" ? (
          /* ── List View with Hero Section & Weekly Grouped Activity ── */
          <div className="flex flex-col flex-1">
            {/* Hero Section: Total Earned */}
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

              {/* Month-over-Month Performance Delta Tag */}
              {monthDelta && (
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-semibold tabular-nums leading-none mt-0.5 mb-1",
                    monthDelta.isPositive ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  <span>{monthDelta.formattedAmount}</span>
                  <span>{monthDelta.isPositive ? "▲" : "▼"}</span>
                  <span>{monthDelta.formattedPercent}%</span>
                </div>
              )}

              {/* Month Navigation Directly Below Total Earned */}
              <div className="flex items-center gap-0.5 mt-1">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={prevMonth}
                  className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-foreground cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-5 text-muted-foreground stroke-[2.25]" />
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setMonthYearPickerOpen(true)}
                  className="inline-flex items-center gap-1 px-1.5 py-1 rounded-full text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer select-none"
                  aria-label="Select month and year"
                >
                  <span>{calendarMonthYearLabel}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={nextMonth}
                  className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-foreground cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-5 text-muted-foreground stroke-[2.25]" />
                </motion.button>
              </div>
            </div>

            {!hasMonthlyShifts ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 my-auto select-none">
                <div className="flex flex-col gap-1.5 max-w-xs">
                  <h3 className="text-[19px] font-semibold text-foreground tracking-tight">
                    No shifts in {listMonthLabel}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Nothing logged for this month yet.
                  </p>
                </div>

                <motion.div whileTap={{ scale: 0.94 }} className="mt-6">
                  <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors shadow-sm cursor-pointer"
                  >
                    Add Shift
                  </button>
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {groupedWeeklyShifts.map((group) => (
                  <div key={group.weekKey} className="flex flex-col gap-2">
                    {/* Weekly Subheader: Range */}
                    <div className="px-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        {group.label}
                      </span>
                    </div>
                    {renderShiftList(group.shifts)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Calendar View ── */
          <div className="flex flex-col flex-1 mt-2">
            {/* Frameless Calendar Grid Container */}
            <div className="flex flex-col items-center w-full mx-auto mb-6">
              {/* Calendar Header with Centered Month/Year & Frameless Buttons */}
              <div className="w-full flex items-center justify-center gap-0.5 mb-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={prevMonth}
                  className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-foreground cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-5 text-muted-foreground stroke-[2.25]" />
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setMonthYearPickerOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-full text-lg font-bold text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer select-none text-center"
                  aria-label="Select month and year"
                >
                  <span>{calendarMonthYearLabel}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={nextMonth}
                  className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-foreground cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-5 text-muted-foreground stroke-[2.25]" />
                </motion.button>
              </div>

              {/* Native Frameless Calendar Component */}
              <Calendar
                mode="single"
                month={currentDate}
                weekStartsOn={preferences.first_day_of_week === "Sunday" ? 0 : 1}
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
                  weekdays: "flex justify-between gap-1 sm:gap-1.5",
                  weekday: "size-10 sm:size-11 text-[11px] font-medium text-muted-foreground/70 select-none flex items-center justify-center uppercase tracking-wider",
                  week: "mt-1 flex w-fit justify-between gap-1 sm:gap-1.5",
                  day: "group/day relative size-10 sm:size-11 p-0 text-center select-none flex items-center justify-center",
                }}
              />
            </div>

            {/* Selected Day Activity Section */}
            <div className="flex flex-col gap-3">
              {selectedDayShifts.length > 0 ? (
                renderShiftList(selectedDayShifts)
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 gap-2 select-none">
                  <div className="flex flex-col gap-1 max-w-xs">
                    <h3 className="text-[17px] font-semibold text-foreground tracking-tight">
                      No shifts scheduled
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Select another date to view shifts.
                    </p>
                  </div>
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

      {/* ── Add Shift Method Selector Modal ───────────────── */}
      <CenterMorphModal
        open={modalMode === "select-method"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="Add Shift Method"
          dismissible={true}
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">
                Add Shift
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Select how you&apos;d like to create your shift
              </p>
            </div>

            {/* Settings Card Cluster with Pill-Shape Hover Rows */}
            <SettingsCard>
              <SettingsRow onClick={() => setModalMode("select-smart-add")}>
                <div className="flex items-center gap-4">
                  <div className="grid h-7 w-7 place-items-center text-muted-foreground">
                    <Sparkles className="size-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Smart Add</span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-colors" />
              </SettingsRow>

              <SettingsRow onClick={() => setModalMode("select-template")}>
                <div className="flex items-center gap-4">
                  <div className="grid h-7 w-7 place-items-center text-muted-foreground">
                    <LayoutTemplate className="size-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Templates</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-colors" />
              </SettingsRow>

              <SettingsRow onClick={() => setModalMode("create")}>
                <div className="flex items-center gap-4">
                  <div className="grid h-7 w-7 place-items-center text-muted-foreground">
                    <Keyboard className="size-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Manual</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-colors" />
              </SettingsRow>
            </SettingsCard>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Smart Add Selector Modal ───────────────────────── */}
      <CenterMorphModal
        open={modalMode === "select-smart-add"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="Smart Add"
          dismissible={true}
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          <motion.button
            type="button"
            aria-label="Back to method selection"
            onClick={() => setModalMode("select-method")}
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            className="absolute left-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </motion.button>

          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">
                Smart Add
              </h2>
            </div>

            {/* Smart Add Options Card */}
            <SettingsCard>
              <SettingsRow onClick={() => setModalMode("smart-add-paste")}>
                <div className="flex items-center gap-4">
                  <div className="grid h-7 w-7 place-items-center text-muted-foreground">
                    <FileText className="size-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Paste Schedule</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-colors" />
              </SettingsRow>

              <div className="opacity-60 pointer-events-none">
                <SettingsRow>
                  <div className="flex items-center gap-4">
                    <div className="grid h-7 w-7 place-items-center text-muted-foreground">
                      <Image className="size-5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Upload Photo</span>
                  </div>
                  <span className="text-[13px] text-muted-foreground/60">Coming soon</span>                </SettingsRow>
              </div>
            </SettingsCard>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Paste Schedule Modal (Smart Add Step 3) ──────────── */}
      <CenterMorphModal
        open={modalMode === "smart-add-paste"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="Paste Schedule"
          dismissible={true}
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          <motion.button
            type="button"
            aria-label="Back to Smart Add selection"
            onClick={() => setModalMode("select-smart-add")}
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            className="absolute left-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </motion.button>

          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">
                Paste Schedule
              </h2>
            </div>

            {/* Textarea Form */}
            <Field>
              <Textarea
                placeholder="e.g. Mon 9am - 5pm at Cafe..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={isExtracting}
              />
            </Field>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2 w-full">
              <CenterMorphModalClose>
                <Button type="button" variant="outline" disabled={isExtracting} className="h-11 rounded-full text-sm font-medium w-full border-border/60 cursor-pointer">
                  Cancel
                </Button>
              </CenterMorphModalClose>
              <Button
                type="button"
                disabled={!pastedText.trim() || isExtracting}
                isLoading={isExtracting}
                onClick={handleExtractShifts}
                className="h-11 rounded-full text-sm font-medium w-full cursor-pointer"
              >
                {isExtracting ? "Extracting" : "Extract"}
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Review Extracted Shifts Modal (Smart Add Step 4) ──── */}
      <CenterMorphModal
        open={modalMode === "smart-add-review"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="Review Extracted Shifts"
          dismissible={true}
          className="w-full max-w-md bg-card p-6 border-border/50"
        >
          <motion.button
            type="button"
            aria-label="Back to Paste Schedule"
            onClick={() => setModalMode("smart-add-paste")}
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            className="absolute left-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </motion.button>

          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">
                Review Shifts
              </h2>
              <p className="text-[13px] text-muted-foreground">
                {extractedShifts.length} shift{extractedShifts.length > 1 ? "s" : ""} extracted
              </p>
            </div>

            {/* Accordion List */}
            <div className="max-h-[380px] overflow-y-auto pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <ExtractedShiftAccordion
                shifts={extractedShifts}
                errors={extractedShiftErrors}
                onUpdateShift={handleUpdateExtractedShift}
                onDeleteShift={handleDeleteExtractedShift}
                timeFormat={preferences.time_format}
                firstDayOfWeek={preferences.first_day_of_week}
              />
            </div>

            {/* Footer Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2 w-full">
              <CenterMorphModalClose>
                <Button type="button" variant="outline" disabled={isSaving} className="h-11 rounded-full text-sm font-medium w-full border-border/60 cursor-pointer">
                  Cancel
                </Button>
              </CenterMorphModalClose>
              <Button
                type="button"
                isLoading={isSaving}
                disabled={isSaving || extractedShifts.length === 0}
                onClick={handleSaveExtractedShifts}
                className="h-11 rounded-full text-sm font-medium w-full cursor-pointer"
              >
                Save All ({extractedShifts.length})
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Select Template Modal ──────────────────────────── */}
      <CenterMorphModal
        open={modalMode === "select-template"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="Select Template"
          dismissible={true}
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          <motion.button
            type="button"
            aria-label="Back to method selection"
            onClick={() => setModalMode("select-method")}
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            className="absolute left-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </motion.button>

          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">
                Select Template
              </h2>
            </div>

            {/* Template List OR Empty State */}
            {templates.length > 0 ? (
              <SettingsCard>
                {templates.map((template) => (
                  <SettingsRow
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template)
                      setModalMode("create-from-template")
                    }}
                  >
                    <div className="flex items-center gap-3 text-left min-w-0 flex-1 pr-4">
                      <div className="w-1 h-5 rounded-full bg-primary/80 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {template.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[13px] text-muted-foreground font-medium">
                        {formatDisplayTime(template.start_time, preferences.time_format)} – {formatDisplayTime(template.end_time, preferences.time_format)}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </div>
                  </SettingsRow>
                ))}
              </SettingsCard>
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-6 py-6 select-none">
                <div className="flex flex-col gap-1.5 max-w-xs">
                  <h3 className="text-[19px] font-semibold text-foreground tracking-tight">
                    No templates yet
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Save your regular shifts as templates so you can add them with a single tap.
                  </p>
                </div>

                <motion.div whileTap={{ scale: 0.94 }} className="mt-6">
                  <button
                    type="button"
                    onClick={() => setModalMode("create-template")}
                    className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors shadow-sm cursor-pointer"
                  >
                    Create Template
                  </button>
                </motion.div>
              </div>
            )}
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Create Template Modal ──────────────────────────── */}
      <CenterMorphModal
        open={modalMode === "create-template"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="New Template"
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          <motion.button
            type="button"
            aria-label="Back to template selection"
            onClick={() => setModalMode("select-template")}
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            className="absolute left-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </motion.button>

          <TemplateForm
            onSubmit={handleCreateTemplate}
            isSaving={isSavingTemplate}
            timeFormat={preferences.time_format}
            defaultValues={{
              hourly_rate: preferences.default_hourly_rate || undefined,
              break_duration: preferences.default_break_duration || undefined,
            }}
          />
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Create Shift from Template Modal ───────────────── */}
      <CenterMorphModal
        open={modalMode === "create-from-template"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="New Shift from Template"
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          <motion.button
            type="button"
            aria-label="Back to template selection"
            onClick={() => setModalMode("select-template")}
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            className="absolute left-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </motion.button>

          <ShiftForm
            title="New Shift"
            onSubmit={handleCreate}
            isSaving={isSaving}
            timeFormat={preferences.time_format}
            firstDayOfWeek={preferences.first_day_of_week}
            defaultValues={
              selectedTemplate
                ? {
                    workplace_name: selectedTemplate.workplace_name,
                    shift_date: createDefaultDate ? dateToString(createDefaultDate) : undefined,
                    start_time: selectedTemplate.start_time,
                    end_time: selectedTemplate.end_time,
                    hourly_rate: Number(selectedTemplate.hourly_rate),
                    break_duration: Number(selectedTemplate.break_duration),
                  }
                : undefined
            }
          />
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
          <motion.button
            type="button"
            aria-label="Back to method selection"
            onClick={() => setModalMode("select-method")}
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            className="absolute left-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </motion.button>

          <ShiftForm
            title="New Shift"
            onSubmit={handleCreate}
            isSaving={isSaving}
            timeFormat={preferences.time_format}
            firstDayOfWeek={preferences.first_day_of_week}
            defaultValues={{
              shift_date: createDefaultDate ? dateToString(createDefaultDate) : undefined,
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
          dismissible={true}
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          {selectedShift && (
            <div className="flex flex-col gap-6">
              {/* Header: Workplace Name & Date */}
              <div className="flex flex-col gap-2 text-center">
                <h2 className="text-base font-semibold leading-normal text-foreground truncate">
                  {selectedShift.workplace_name}
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  {formatDisplayDate(selectedShift.shift_date)}
                </p>
              </div>

              {/* Clean Single Details List */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-foreground font-medium">
                    {formatDisplayTime(selectedShift.start_time, preferences.time_format)}
                    {" – "}
                    {formatDisplayTime(selectedShift.end_time, preferences.time_format)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="text-foreground font-medium">
                    ${Number(selectedShift.hourly_rate).toFixed(2)} / hr
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Break</span>
                  <span className="text-foreground font-medium">
                    {selectedShift.break_duration} min
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/40">
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

                <div className="flex items-center justify-between text-sm py-2.5">
                  <span className="text-muted-foreground font-medium">Estimated Income</span>
                  <span className="text-foreground font-semibold text-[15px]">
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

              {/* Actions: Delete + Edit (Full-Width Side-by-Side) */}
              <div className="grid grid-cols-2 gap-3 pt-2 w-full">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setSingleDeleteConfirmOpen(true)}
                  disabled={isDeleting}
                  className="h-11 rounded-full text-sm font-medium w-full cursor-pointer"
                >
                  Delete
                </Button>
                <Button
                  type="button"
                  onClick={openEdit}
                  disabled={isDeleting}
                  className="h-11 rounded-full text-sm font-medium w-full cursor-pointer"
                >
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
              firstDayOfWeek={preferences.first_day_of_week}
              defaultValues={shiftToShiftFormValues(selectedShift)}
            />
          )}
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Single Shift Delete Confirm Modal ───────────── */}
      <ConfirmModal
        open={singleDeleteConfirmOpen}
        onOpenChange={setSingleDeleteConfirmOpen}
        title="Delete shift?"
        description="This will permanently remove this shift log."
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      {/* ── Bulk Delete Confirm Modal ─────────────────────── */}
      <ConfirmModal
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title={selectedIds.size === 1 ? "Delete 1 shift?" : `Delete ${selectedIds.size} shifts?`}
        description="This will permanently remove the selected shift logs."
        confirmText="Delete"
        isLoading={isDeletingBulk}
        onConfirm={handleBulkDelete}
      />

      {/* ── Shift Conflict Warning Modal ────────────────────── */}
      <ShiftConflictModal
        open={conflictModalOpen}
        onOpenChange={(open) => {
          setConflictModalOpen(open)
          if (!open) {
            setPendingShift(null)
            setConflictingShift(null)
            setConflictType(null)
          }
        }}
        conflictType={conflictType}
        conflictingShift={conflictingShift}
        pendingShift={pendingShift}
        timeFormat={preferences.time_format}
        defaultHourlyRate={preferences.default_hourly_rate}
        defaultBreakDuration={preferences.default_break_duration}
        isSaving={isSaving}
        onPrimaryAction={handleConflictPrimaryAction}
        onSecondaryAction={handleConflictSecondaryAction}
      />
    </>
  )
}
