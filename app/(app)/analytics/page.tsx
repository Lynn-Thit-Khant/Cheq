"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Download, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, Cell } from "recharts"

import { AnimatedNumber } from "@/components/motion/animated-number"
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/motion/radio"
import { getShifts } from "@/app/(app)/home/actions"
import type { Shift } from "@/lib/schemas/shift-form-schema"
import { calculateShiftDurationHours, calculateShiftIncome, formatCurrency, formatSmartCurrency, dateToString } from "@/lib/time-utils"
import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"

import { getUserPreferences, type UserPreferences } from "@/app/(app)/settings/defaults/actions"
import { useUser } from "@/components/user-provider"
import { downloadStatementPDF } from "@/lib/pdf-statement"
import {
  CenterMorphModal,
  CenterMorphModalTrigger,
  CenterMorphModalContent,
  CenterMorphModalClose,
} from "@/components/motion/center-morph-modal"
import { Button } from "@/components/motion/button/base"
import { WheelPicker } from "@/components/motion/wheel-picker"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const MONTH_OPTIONS = [
  { label: "Jan", value: "0" },
  { label: "Feb", value: "1" },
  { label: "Mar", value: "2" },
  { label: "Apr", value: "3" },
  { label: "May", value: "4" },
  { label: "Jun", value: "5" },
  { label: "Jul", value: "6" },
  { label: "Aug", value: "7" },
  { label: "Sep", value: "8" },
  { label: "Oct", value: "9" },
  { label: "Nov", value: "10" },
  { label: "Dec", value: "11" },
]

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const y = 2020 + i
  return { label: String(y), value: String(y) }
})

type Timeframe = "day" | "week" | "month" | "year"

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

// ── 0. Helper: Day View (7 Days of Target Week based on First Day of Week) ───────────────
function getDayViewData(
  shifts: Shift[],
  weekOffset: number,
  firstDayOfWeek: "Monday" | "Sunday" = "Monday"
) {
  const now = new Date()
  const currentDayOfWeek = now.getDay() // 0 = Sun, 1 = Mon, 2 = Tue...

  const isSundayStart = firstDayOfWeek === "Sunday"
  const distToStart = isSundayStart
    ? currentDayOfWeek
    : currentDayOfWeek === 0
    ? 6
    : currentDayOfWeek - 1

  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - distToStart + weekOffset * 7
  )

  const dayLabels = isSundayStart
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const days = []
  let currentDayIndex = 0

  for (let i = 0; i < 7; i++) {
    const d = new Date(
      startOfWeek.getFullYear(),
      startOfWeek.getMonth(),
      startOfWeek.getDate() + i
    )
    const dateStr = dateToString(d)
    const label = dayLabels[i]
    const fullRange = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })

    if (weekOffset === 0 && d.toDateString() === now.toDateString()) {
      currentDayIndex = i
    }

    days.push({
      dateStr,
      label,
      fullRange,
      d,
    })
  }

  const chartData = days.map((day) => {
    const dayShifts = shifts.filter((s) => s.shift_date === day.dateStr)

    const totalEarnings = dayShifts.reduce(
      (acc, s) =>
        acc + calculateShiftIncome(s.start_time, s.end_time, s.hourly_rate, s.break_duration),
      0
    )
    const totalHours = dayShifts.reduce(
      (acc, s) =>
        acc + calculateShiftDurationHours(s.start_time, s.end_time, s.break_duration),
      0
    )
    const distinctDays = dayShifts.length > 0 ? 1 : 0
    const avgRate = totalHours > 0 ? totalEarnings / totalHours : 0

    return {
      label: day.label,
      fullRange: day.fullRange,
      earnings: Number(totalEarnings.toFixed(2)),
      totalHours,
      daysWorked: distinctDays,
      avgRate,
    }
  })

  const startStr = days[0].d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const endStr = days[6].d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return {
    title: "Days",
    subtitle: `${startStr} – ${endStr}`,
    chartData,
    currentDayIndex,
  }
}

// ── 1. Helper: Week View (Weeks of target month) ──────────────────────────
function getWeekViewData(shifts: Shift[], monthOffset: number) {
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = targetDate.getFullYear()
  const monthIndex = targetDate.getMonth()
  const monthName = targetDate.toLocaleString("en-US", { month: "long" })

  // Total days in target month
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  // Define 5 week buckets: Days 1-7, 8-14, 15-21, 22-28, 29-end
  const weekBuckets = [
    { label: "W1", start: 1, end: 7 },
    { label: "W2", start: 8, end: 14 },
    { label: "W3", start: 15, end: 21 },
    { label: "W4", start: 22, end: 28 },
  ]
  if (daysInMonth > 28) {
    weekBuckets.push({ label: "W5", start: 29, end: daysInMonth })
  }

  // Calculate current week index if viewing the current month
  let currentWeekIndex = 0
  if (monthOffset === 0) {
    const today = now.getDate()
    const idx = weekBuckets.findIndex((w) => today >= w.start && today <= w.end)
    if (idx !== -1) currentWeekIndex = idx
  }

  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`

  const chartData = weekBuckets.map((bucket) => {
    const bucketShifts = shifts.filter((s) => {
      if (!s.shift_date || !s.shift_date.startsWith(monthPrefix)) return false
      const day = parseInt(s.shift_date.split("-")[2], 10)
      return day >= bucket.start && day <= bucket.end
    })

    const totalEarnings = bucketShifts.reduce(
      (acc, s) =>
        acc + calculateShiftIncome(s.start_time, s.end_time, s.hourly_rate, s.break_duration),
      0
    )
    const totalHours = bucketShifts.reduce(
      (acc, s) =>
        acc + calculateShiftDurationHours(s.start_time, s.end_time, s.break_duration),
      0
    )
    const distinctDays = new Set(bucketShifts.map((s) => s.shift_date)).size
    const avgRate = totalHours > 0 ? totalEarnings / totalHours : 0

    return {
      label: bucket.label,
      fullRange: `Week ${bucket.label.replace("W", "")} (${monthName.slice(0, 3)} ${bucket.start}-${bucket.end})`,
      earnings: Number(totalEarnings.toFixed(2)),
      totalHours,
      daysWorked: distinctDays,
      avgRate,
    }
  })

  return {
    title: "Weeks",
    subtitle: `${monthName} ${year}`,
    chartData,
    currentWeekIndex,
  }
}

// ── 2. Helper: Month View (Rolling 6 Months) ─────────────────────────────
function getMonthViewData(shifts: Shift[], sixMonthOffset: number) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const months = []
  for (let i = 0; i < 6; i++) {
    const monthDelta = (i - 2) + (sixMonthOffset * 6)
    const targetDate = new Date(currentYear, currentMonth + monthDelta, 1)
    const mIndex = targetDate.getMonth()
    const yr = targetDate.getFullYear()
    const mName = targetDate.toLocaleString("en-US", { month: "long" })
    const mShort = targetDate.toLocaleString("en-US", { month: "short" })

    months.push({
      mShort,
      mName,
      yr,
      key: `${yr}-${String(mIndex + 1).padStart(2, "0")}`,
    })
  }

  const chartData = months.map((m) => {
    const monthShifts = shifts.filter((s) => s.shift_date && s.shift_date.startsWith(m.key))
    const totalEarnings = monthShifts.reduce(
      (acc, s) =>
        acc + calculateShiftIncome(s.start_time, s.end_time, s.hourly_rate, s.break_duration),
      0
    )
    const totalHours = monthShifts.reduce(
      (acc, s) =>
        acc + calculateShiftDurationHours(s.start_time, s.end_time, s.break_duration),
      0
    )
    const distinctDays = new Set(monthShifts.map((s) => s.shift_date)).size
    const avgRate = totalHours > 0 ? totalEarnings / totalHours : 0

    return {
      label: m.mShort,
      fullRange: `${m.mName} ${m.yr}`,
      earnings: Number(totalEarnings.toFixed(2)),
      totalHours,
      daysWorked: distinctDays,
      avgRate,
    }
  })

  const start = months[0]
  const end = months[5]
  const subtitle =
    start.yr === end.yr
      ? `${start.mName} - ${end.mName} ${start.yr}`
      : `${start.mName} ${start.yr} - ${end.mName} ${end.yr}`

  return {
    title: "Months",
    subtitle,
    chartData,
  }
}

// ── 3. Helper: Year View (6-Year Span) ───────────────────────────────────
function getYearViewData(shifts: Shift[], sixYearOffset: number) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const years = []
  for (let i = 0; i < 6; i++) {
    // Current year is placed at index 2 (the 3rd column)
    const yearDelta = (i - 2) + (sixYearOffset * 6)
    years.push(currentYear + yearDelta)
  }

  const chartData = years.map((yr) => {
    const yearPrefix = String(yr)
    const yearShifts = shifts.filter((s) => s.shift_date && s.shift_date.startsWith(yearPrefix))
    const totalEarnings = yearShifts.reduce(
      (acc, s) =>
        acc + calculateShiftIncome(s.start_time, s.end_time, s.hourly_rate, s.break_duration),
      0
    )
    const totalHours = yearShifts.reduce(
      (acc, s) =>
        acc + calculateShiftDurationHours(s.start_time, s.end_time, s.break_duration),
      0
    )
    const distinctDays = new Set(yearShifts.map((s) => s.shift_date)).size
    const avgRate = totalHours > 0 ? totalEarnings / totalHours : 0

    return {
      label: String(yr),
      fullRange: `${yr} Total`,
      earnings: Number(totalEarnings.toFixed(2)),
      totalHours,
      daysWorked: distinctDays,
      avgRate,
    }
  })

  return {
    title: "Years",
    subtitle: `${years[0]} – ${years[5]}`,
    chartData,
  }
}

export function AnalyticsEarningsChart() {
  const { user } = useUser()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [timeframe, setTimeframe] = React.useState<Timeframe>("month")
  const [offset, setOffset] = React.useState(0)
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)
  const [shifts, setShifts] = React.useState<Shift[]>([])
  const [loading, setLoading] = React.useState(true)

  const [statementModalOpen, setStatementModalOpen] = React.useState(false)
  const [statementFormat, setStatementFormat] = React.useState<"pdf" | "csv">("pdf")
  const [statementScope, setStatementScope] = React.useState<"month" | "ytd" | "custom">("month")

  const [customFrom, setCustomFrom] = React.useState<{ month: number; year: number }>(() => {
    const d = new Date()
    return { month: d.getMonth(), year: d.getFullYear() }
  })
  const [customTo, setCustomTo] = React.useState<{ month: number; year: number }>(() => {
    const d = new Date()
    return { month: d.getMonth(), year: d.getFullYear() }
  })
  const [pickerTarget, setPickerTarget] = React.useState<"from" | "to" | null>(null)

  const [preferences, setPreferences] = React.useState<UserPreferences>({
    time_format: "12h",
    first_day_of_week: "Monday",
    default_hourly_rate: 0,
    default_break_duration: 0,
  })

  // Reset offset & selection when switching view mode
  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf)
    setOffset(0)
    setSelectedIndex(null)
  }

  React.useEffect(() => {
    async function loadData() {
      try {
        const [shiftsData, prefsData] = await Promise.all([
          getShifts(),
          getUserPreferences().catch(() => ({
            time_format: "12h" as const,
            first_day_of_week: "Monday" as const,
            default_hourly_rate: 0,
            default_break_duration: 0,
          })),
        ])
        setShifts(shiftsData)
        if (prefsData) setPreferences(prefsData)
      } catch (err) {
        console.error("Failed to load shifts for analytics:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const activeView = React.useMemo(() => {
    if (timeframe === "day") return getDayViewData(shifts, offset, preferences.first_day_of_week)
    if (timeframe === "week") return getWeekViewData(shifts, offset)
    if (timeframe === "year") return getYearViewData(shifts, offset)
    return getMonthViewData(shifts, offset)
  }, [timeframe, shifts, offset, preferences.first_day_of_week])

  const totalPeriodEarnings = React.useMemo(() => {
    return activeView.chartData.reduce((acc, d) => acc + d.earnings, 0)
  }, [activeView])

  const defaultIndex = React.useMemo(() => {
    if (timeframe === "day") {
      return (activeView as ReturnType<typeof getDayViewData>).currentDayIndex ?? 0
    }
    if (timeframe === "week") {
      return (activeView as ReturnType<typeof getWeekViewData>).currentWeekIndex ?? 0
    }
    return 2 // Column #3 (Current month or year)
  }, [timeframe, activeView])

  const effectiveIndex = selectedIndex !== null ? selectedIndex : defaultIndex

  const activeItem = React.useMemo(() => {
    if (effectiveIndex !== null && activeView.chartData[effectiveIndex]) {
      return activeView.chartData[effectiveIndex]
    }
    return null
  }, [effectiveIndex, activeView])

  const deltaInfo = React.useMemo(() => {
    if (effectiveIndex === null) return null
    const currentItem = activeView.chartData[effectiveIndex]
    const prevItem = effectiveIndex > 0 ? activeView.chartData[effectiveIndex - 1] : null
    if (!currentItem) return null

    // 1. Earnings Delta
    const currentVal = currentItem.earnings ?? 0
    const prevVal = prevItem?.earnings ?? 0
    const diffEarnings = currentVal - prevVal
    const pctEarnings = prevVal > 0 ? (diffEarnings / prevVal) * 100 : currentVal > 0 ? 100 : 0
    const earningsDelta = (prevVal === 0 && currentVal === 0) ? null : {
      isPositive: diffEarnings >= 0,
      formattedAmount: `${diffEarnings >= 0 ? "+" : "-"}${formatCurrency(Math.abs(diffEarnings))}`,
      formattedPercent: Math.abs(pctEarnings).toFixed(1),
    }

    // 2. Hours Delta
    const currentHrs = currentItem.totalHours ?? 0
    const prevHrs = prevItem?.totalHours ?? 0
    const diffHrs = currentHrs - prevHrs
    const pctHrs = prevHrs > 0 ? (diffHrs / prevHrs) * 100 : currentHrs > 0 ? 100 : 0
    const hoursDelta = (prevHrs === 0 && currentHrs === 0) ? null : {
      isPositive: diffHrs >= 0,
      formattedAmount: `${diffHrs >= 0 ? "+" : "-"}${Math.abs(diffHrs).toFixed(1)} hrs`,
      formattedPercent: Math.abs(pctHrs).toFixed(1),
    }

    // 3. Rate Delta
    const currentRate = currentItem.avgRate ?? 0
    const prevRate = prevItem?.avgRate ?? 0
    const diffRate = currentRate - prevRate
    const pctRate = prevRate > 0 ? (diffRate / prevRate) * 100 : currentRate > 0 ? 100 : 0
    const rateDelta = (prevRate === 0 && currentRate === 0) ? null : {
      isPositive: diffRate >= 0,
      formattedAmount: `${diffRate >= 0 ? "+" : "-"}$${Math.abs(diffRate).toFixed(2)}/hr`,
      formattedPercent: Math.abs(pctRate).toFixed(1),
    }

    // 4. Days Delta
    const currentDays = currentItem.daysWorked ?? 0
    const prevDays = prevItem?.daysWorked ?? 0
    const diffDays = currentDays - prevDays
    const pctDays = prevDays > 0 ? (diffDays / prevDays) * 100 : currentDays > 0 ? 100 : 0
    const daysDelta = (prevDays === 0 && currentDays === 0) ? null : {
      isPositive: diffDays >= 0,
      formattedAmount: `${diffDays >= 0 ? "+" : "-"}${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "day" : "days"}`,
      formattedPercent: Math.abs(pctDays).toFixed(1),
    }

    return {
      earningsDelta,
      hoursDelta,
      rateDelta,
      daysDelta,
    }
  }, [effectiveIndex, activeView])

  const handlePrev = () => {
    setOffset((prev) => prev - 1)
    setSelectedIndex(null)
  }
  const handleNext = () => {
    setOffset((prev) => prev + 1)
    setSelectedIndex(null)
  }

  const [isExporting, setIsExporting] = React.useState(false)

  const getFilteredShiftsForStatement = React.useCallback(() => {
    if (!shifts || shifts.length === 0) return []
    const now = new Date()

    if (statementScope === "month") {
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      return shifts.filter((s) => s.shift_date && s.shift_date.startsWith(monthPrefix))
    }

    if (statementScope === "ytd") {
      const yearPrefix = `${now.getFullYear()}`
      return shifts.filter((s) => s.shift_date && s.shift_date.startsWith(yearPrefix))
    }

    if (statementScope === "custom") {
      const fromStr = `${customFrom.year}-${String(customFrom.month + 1).padStart(2, "0")}-01`
      const lastDayTo = new Date(customTo.year, customTo.month + 1, 0).getDate()
      const toStr = `${customTo.year}-${String(customTo.month + 1).padStart(2, "0")}-${String(lastDayTo).padStart(2, "0")}`
      return shifts.filter((s) => s.shift_date && s.shift_date >= fromStr && s.shift_date <= toStr)
    }

    return shifts
  }, [shifts, statementScope, customFrom, customTo])

  const getScopeLabel = React.useCallback(() => {
    const now = new Date()
    if (statementScope === "month") {
      return now.toLocaleString("en-US", { month: "long", year: "numeric" })
    }
    if (statementScope === "ytd") {
      return `YTD ${now.getFullYear()}`
    }
    const fromName = MONTH_NAMES[customFrom.month]
    const toName = MONTH_NAMES[customTo.month]
    return `${fromName} ${customFrom.year} – ${toName} ${customTo.year}`
  }, [statementScope, customFrom, customTo])

  const handleExport = async () => {
    const exportShifts = getFilteredShiftsForStatement()
    if (!exportShifts || exportShifts.length === 0) return

    setIsExporting(true)
    try {
      if (statementFormat === "pdf") {
        const dateTag = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`
        const randomTag = Math.floor(1000 + Math.random() * 9000)
        const statementId = `CHQ-${dateTag}-${randomTag}`
        const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Account Holder"
        const userEmail = user?.email || ""
        const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/logo-dark.svg` : "/logo-dark.svg"

        await downloadStatementPDF({
          shifts: exportShifts,
          userName,
          userEmail,
          scopeLabel: getScopeLabel(),
          statementId,
          logoUrl,
          timeFormat: preferences.time_format,
        })
      } else {
        const csvHeader = "Shift Date,Workplace,Start Time,End Time,Hourly Rate ($),Break (mins),Hours Worked,Earnings ($)\n"
        const rows = exportShifts.map((s) => {
          const hrs = calculateShiftDurationHours(s.start_time, s.end_time, s.break_duration)
          const income = calculateShiftIncome(s.start_time, s.end_time, s.hourly_rate, s.break_duration)
          return `"${s.shift_date}","${s.workplace_name || "Shift"}","${s.start_time}","${s.end_time}",${s.hourly_rate},${s.break_duration},${hrs.toFixed(1)},${income.toFixed(2)}`
        })

        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvHeader + rows.join("\n"))
        const link = document.createElement("a")
        link.setAttribute("href", csvContent)
        link.setAttribute("download", `cheq-statement-${statementScope}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      console.error("Failed to export statement:", err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header with Title, Period Subtitle, and Export Button */}
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-0.5 text-left">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            {activeView.title}
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            {activeView.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={handlePrev}
            aria-label="Previous period"
            className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-foreground cursor-pointer"
          >
            <ChevronLeft className="size-5 text-muted-foreground stroke-[2.25]" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={handleNext}
            aria-label="Next period"
            className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-foreground cursor-pointer"
          >
            <ChevronRight className="size-5 text-muted-foreground stroke-[2.25]" />
          </motion.button>
        </div>
      </div>

      {/* Bar Chart Glass Card Container */}
      <div className="relative flex flex-col w-full">
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[28px] border border-border/40 pointer-events-none shadow-sm" />
        <div className="relative z-10 flex flex-col p-4 sm:p-5">
          <ChartContainer config={chartConfig} className="[&_*]:outline-none [&_.recharts-rectangle]:stroke-none [&_.recharts-sector]:stroke-none [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-transparent">
            <BarChart
              data={activeView.chartData}
              barCategoryGap="15%"
              onClick={(state) => {
                if (state && typeof state.activeTooltipIndex === "number") {
                  setSelectedIndex(state.activeTooltipIndex)
                }
              }}
              margin={{
                top: 24,
                left: 8,
                right: 8,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={(props: any) => {
                  const { x, y, payload, index } = props
                  const isSelected = index === effectiveIndex
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={10}
                        textAnchor="middle"
                        fontSize={13}
                        fontWeight={isSelected ? 700 : 500}
                        className={cn(
                          "transition-colors duration-200 tabular-nums",
                          isSelected
                            ? "fill-foreground opacity-100 font-bold"
                            : "fill-muted-foreground opacity-40 font-medium"
                        )}
                      >
                        {payload.value}
                      </text>
                    </g>
                  )
                }}
              />

              <Bar
                key={`${timeframe}-${offset}`}
                dataKey="earnings"
                maxBarSize={36}
                radius={8}
                isAnimationActive={true}
                animationDuration={500}
                animationEasing="ease-out"
                shape={(props: any) => {
                  const { x, y, width, height, index } = props
                  const isActive = index === effectiveIndex
                  const isDark = mounted && resolvedTheme === "dark"
                  const opacity = isActive ? (isDark ? 0.9 : 0.8) : 0.5
                  return (
                    <motion.rect
                      key={`bar-${index}`}
                      x={x}
                      width={width}
                      rx={8}
                      ry={8}
                      className="fill-[var(--chart-5)] dark:fill-[var(--chart-1)] cursor-pointer"
                      initial={false}
                      animate={{
                        y,
                        height,
                        opacity,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 26,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedIndex(index)
                      }}
                    />
                  )
                }}
              >
                <LabelList
                  dataKey="earnings"
                  position="top"
                  content={(props: any) => {
                    const { x, y, width, value } = props
                    if (value === undefined || value === null || Number(value) <= 0) return null
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 8}
                        fill="var(--foreground)"
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={600}
                        className="tabular-nums fill-foreground font-semibold"
                      >
                        {formatSmartCurrency(Number(value))}
                      </text>
                    )
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Animated Timeframe Toggle Pill */}
      <div className="flex items-center justify-center w-full pt-1">
        <Tabs
          value={timeframe}
          onValueChange={(v) => handleTimeframeChange(v as Timeframe)}
          variant="pill"
          className="w-full max-w-xs"
        >
          <TabsList className="bg-card/80 backdrop-blur-xl border border-border p-1 rounded-full flex items-center gap-1 shadow-sm w-full h-12">
            <TabsTrigger
              value="day"
              className="flex-1 h-full rounded-full text-xs sm:text-sm font-medium"
              indicatorClassName="bg-black/10 dark:bg-white/10"
            >
              Day
            </TabsTrigger>
            <TabsTrigger
              value="week"
              className="flex-1 h-full rounded-full text-xs sm:text-sm font-medium"
              indicatorClassName="bg-black/10 dark:bg-white/10"
            >
              Week
            </TabsTrigger>
            <TabsTrigger
              value="month"
              className="flex-1 h-full rounded-full text-xs sm:text-sm font-medium"
              indicatorClassName="bg-black/10 dark:bg-white/10"
            >
              Month
            </TabsTrigger>
            <TabsTrigger
              value="year"
              className="flex-1 h-full rounded-full text-xs sm:text-sm font-medium"
              indicatorClassName="bg-black/10 dark:bg-white/10"
            >
              Year
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 2×2 Metric Grid (Cheq Design System Card Architecture with All 4 Deltas) */}
      <div className="grid grid-cols-2 gap-3 w-full pt-1">
        {/* Card 1: Total earned */}
        <div className="relative flex flex-col w-full">
          <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[24px] border border-border/40 pointer-events-none shadow-sm" />
          <div className="relative z-10 flex flex-col gap-1 p-4 text-left">
            <span className="text-[13px] font-medium text-muted-foreground">
              Total earned
            </span>
            <span className="text-xl font-bold text-foreground tabular-nums">
              {loading ? (
                <span className="inline-block h-6 w-24 bg-muted/60 rounded animate-pulse my-0.5" />
              ) : (
                `$${(activeItem?.earnings ?? totalPeriodEarnings).toLocaleString()}`
              )}
            </span>
            {deltaInfo?.earningsDelta ? (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-semibold tabular-nums mt-0.5",
                  deltaInfo.earningsDelta.isPositive ? "text-emerald-500" : "text-rose-500"
                )}
              >
                <span>{deltaInfo.earningsDelta.formattedAmount}</span>
                <span>{deltaInfo.earningsDelta.isPositive ? "▲" : "▼"}</span>
                <span>{deltaInfo.earningsDelta.formattedPercent}%</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-normal mt-0.5 truncate">
                {activeItem?.fullRange || "Selected period"}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Total hours */}
        <div className="relative flex flex-col w-full">
          <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[24px] border border-border/40 pointer-events-none shadow-sm" />
          <div className="relative z-10 flex flex-col gap-1 p-4 text-left">
            <span className="text-[13px] font-medium text-muted-foreground">
              Total hours
            </span>
            <span className="text-xl font-bold text-foreground tabular-nums">
              {loading ? (
                <span className="inline-block h-6 w-20 bg-muted/60 rounded animate-pulse my-0.5" />
              ) : activeItem && activeItem.totalHours > 0 ? (
                `${activeItem.totalHours.toFixed(1)} hrs`
              ) : (
                "0 hrs"
              )}
            </span>
            {deltaInfo?.hoursDelta ? (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-semibold tabular-nums mt-0.5",
                  deltaInfo.hoursDelta.isPositive ? "text-emerald-500" : "text-rose-500"
                )}
              >
                <span>{deltaInfo.hoursDelta.formattedAmount}</span>
                <span>{deltaInfo.hoursDelta.isPositive ? "▲" : "▼"}</span>
                <span>{deltaInfo.hoursDelta.formattedPercent}%</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-normal mt-0.5">
                Shift duration
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Avg rate */}
        <div className="relative flex flex-col w-full">
          <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[24px] border border-border/40 pointer-events-none shadow-sm" />
          <div className="relative z-10 flex flex-col gap-1 p-4 text-left">
            <span className="text-[13px] font-medium text-muted-foreground">
              Avg rate
            </span>
            <span className="text-xl font-bold text-foreground tabular-nums">
              {loading ? (
                <span className="inline-block h-6 w-24 bg-muted/60 rounded animate-pulse my-0.5" />
              ) : (
                `$${(activeItem?.avgRate ?? 0).toFixed(2)}/hr`
              )}
            </span>
            {deltaInfo?.rateDelta ? (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-semibold tabular-nums mt-0.5",
                  deltaInfo.rateDelta.isPositive ? "text-emerald-500" : "text-rose-500"
                )}
              >
                <span>{deltaInfo.rateDelta.formattedAmount}</span>
                <span>{deltaInfo.rateDelta.isPositive ? "▲" : "▼"}</span>
                <span>{deltaInfo.rateDelta.formattedPercent}%</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-normal mt-0.5">
                Effective rate
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Days worked */}
        <div className="relative flex flex-col w-full">
          <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[24px] border border-border/40 pointer-events-none shadow-sm" />
          <div className="relative z-10 flex flex-col gap-1 p-4 text-left">
            <span className="text-[13px] font-medium text-muted-foreground">
              Days worked
            </span>
            <span className="text-xl font-bold text-foreground tabular-nums">
              {loading ? (
                <span className="inline-block h-6 w-16 bg-muted/60 rounded animate-pulse my-0.5" />
              ) : (
                `${activeItem?.daysWorked ?? 0} ${(activeItem?.daysWorked ?? 0) === 1 ? "day" : "days"}`
              )}
            </span>
            {deltaInfo?.daysDelta ? (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-semibold tabular-nums mt-0.5",
                  deltaInfo.daysDelta.isPositive ? "text-emerald-500" : "text-rose-500"
                )}
              >
                <span>{deltaInfo.daysDelta.formattedAmount}</span>
                <span>{deltaInfo.daysDelta.isPositive ? "▲" : "▼"}</span>
                <span>{deltaInfo.daysDelta.formattedPercent}%</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-normal mt-0.5">
                Recorded shifts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Statement Export CenterMorphModal ── */}
      <CenterMorphModal
        open={statementModalOpen}
        onOpenChange={(open) => {
          setStatementModalOpen(open)
          if (open) {
            setStatementScope("month")
            setStatementFormat("pdf")
          }
        }}
      >
        <CenterMorphModalTrigger>
          <div className="w-full pt-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98, opacity: 0.9 }}
              className="inline-flex items-center justify-center h-12 w-full rounded-full bg-primary text-primary-foreground text-[15px] font-medium hover:bg-primary/90 transition-colors focus:outline-none shrink-0 shadow-sm cursor-pointer"
              aria-label="Get Statement"
            >
              Get Statement
            </motion.button>
          </div>
        </CenterMorphModalTrigger>

        <CenterMorphModalContent ariaLabel="Get Statement Modal" className="w-full max-w-sm bg-card p-6 border-border/50">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">
                Get Statement
              </h2>
              <p className="text-xs text-muted-foreground">
                Export your earnings report
              </p>
            </div>

            {/* Form Fields with gap-6 between Format and Period */}
            <div className="flex flex-col gap-6">
              {/* Format Selection */}
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[13px] font-medium text-muted-foreground">
                  Format
                </span>
                <Tabs
                  value={statementFormat}
                  onValueChange={(v) => setStatementFormat(v as "pdf" | "csv")}
                  variant="pill"
                  className="w-full"
                >
                  <TabsList className="bg-card/80 backdrop-blur-xl border border-border p-1 rounded-full flex items-center gap-1 shadow-sm w-full h-12">
                    <TabsTrigger
                      value="pdf"
                      className="flex-1 h-full rounded-full text-xs sm:text-sm font-medium"
                      indicatorClassName="bg-black/10 dark:bg-white/10"
                    >
                      PDF
                    </TabsTrigger>
                    <TabsTrigger
                      value="csv"
                      className="flex-1 h-full rounded-full text-xs sm:text-sm font-medium"
                      indicatorClassName="bg-black/10 dark:bg-white/10"
                    >
                      CSV
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Period Selection */}
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[13px] font-medium text-muted-foreground">
                  Period
                </span>
                <div className="relative flex flex-col w-full">
                  <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[24px] border border-border/40 pointer-events-none shadow-sm" />
                  <RadioGroup
                    value={statementScope}
                    onValueChange={(v) => setStatementScope(v as "month" | "ytd" | "custom")}
                    className="relative z-10 p-1 gap-0"
                  >
                    <RadioGroupItem value="month" label="Current month" />
                    <div className="h-[1px] w-full bg-border/40 my-0.5" />
                    <RadioGroupItem value="ytd" label="Year-to-date" />
                    <div className="h-[1px] w-full bg-border/40 my-0.5" />
                    <RadioGroupItem value="custom" label="Custom" />
                  </RadioGroup>
                </div>

                {/* Collapsible Custom Date Range Dropdown (Password strength style spring expand) */}
                <AnimatePresence initial={false}>
                  {statementScope === "custom" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="overflow-hidden pt-2"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {/* From Month Trigger */}
                        <div className="flex flex-col gap-1 text-left">
                          <span className="text-sm font-medium text-foreground">
                            From
                          </span>
                          <button
                            type="button"
                            onClick={() => setPickerTarget("from")}
                            className="flex h-12 w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-ring outline-none cursor-pointer shadow-sm"
                          >
                            <Calendar className="size-4 text-muted-foreground shrink-0" />
                            <span className="whitespace-nowrap text-sm font-medium">
                              {MONTH_NAMES[customFrom.month]} {customFrom.year}
                            </span>
                            <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                          </button>
                        </div>

                        {/* To Month Trigger */}
                        <div className="flex flex-col gap-1 text-left">
                          <span className="text-sm font-medium text-foreground">
                            To
                          </span>
                          <button
                            type="button"
                            onClick={() => setPickerTarget("to")}
                            className="flex h-12 w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-ring outline-none cursor-pointer shadow-sm"
                          >
                            <Calendar className="size-4 text-muted-foreground shrink-0" />
                            <span className="whitespace-nowrap text-sm font-medium">
                              {MONTH_NAMES[customTo.month]} {customTo.year}
                            </span>
                            <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Buttons (50/50 Grid per Design System) */}
            <div className="grid grid-cols-2 gap-3 pt-2 w-full">
              <CenterMorphModalClose>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full text-sm font-medium border-border/60 w-full cursor-pointer"
                >
                  Cancel
                </Button>
              </CenterMorphModalClose>

              <Button
                type="button"
                isLoading={isExporting}
                disabled={isExporting}
                onClick={async () => {
                  await handleExport()
                  setStatementModalOpen(false)
                }}
                className="h-11 rounded-full text-sm font-medium w-full cursor-pointer"
              >
                {isExporting ? "Downloading" : "Download"}
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── WheelPicker Month & Year CenterMorphModal (Capped at Current Month/Year) ── */}
      <CenterMorphModal open={pickerTarget !== null} onOpenChange={(open) => !open && setPickerTarget(null)}>
        <CenterMorphModalContent
          ariaLabel="Select month and year"
          showCloseButton={false}
          dismissible={true}
          noMorph
          className="w-[280px] p-3 border-border/60 shadow-sm bg-card"
        >
          {(() => {
            const now = new Date()
            const currentYr = now.getFullYear()
            const currentMo = now.getMonth()

            const activeYr = pickerTarget === "from" ? customFrom.year : customTo.year
            const activeMo = pickerTarget === "from" ? customFrom.month : customTo.month

            // Capped Year options (2020 through currentYear)
            const filteredYears = Array.from({ length: currentYr - 2020 + 1 }, (_, i) => {
              const y = 2020 + i
              return { label: String(y), value: String(y) }
            })

            // Capped Month options (up to currentMonth if active year is currentYear)
            const filteredMonths = activeYr >= currentYr
              ? MONTH_OPTIONS.filter((m) => Number(m.value) <= currentMo)
              : MONTH_OPTIONS

            const safeMo = Math.min(activeMo, activeYr >= currentYr ? currentMo : activeMo)
            const safeYr = Math.min(activeYr, currentYr)

            return (
              <div className="flex items-stretch justify-center gap-2 px-2">
                <WheelPicker
                  options={filteredMonths}
                  value={String(safeMo)}
                  onValueChange={(val) => {
                    let m = Number(val)
                    if (activeYr >= currentYr && m > currentMo) m = currentMo
                    if (pickerTarget === "from") {
                      setCustomFrom((prev) => ({ ...prev, month: m }))
                    } else if (pickerTarget === "to") {
                      setCustomTo((prev) => ({ ...prev, month: m }))
                    }
                  }}
                  className="flex-1 border-0 bg-transparent rounded-full"
                  visibleCount={5}
                  itemHeight={38}
                  sound
                  aria-label="Month"
                />
                <WheelPicker
                  options={filteredYears}
                  value={String(safeYr)}
                  onValueChange={(val) => {
                    const y = Math.min(Number(val), currentYr)
                    if (pickerTarget === "from") {
                      setCustomFrom((prev) => ({
                        year: y,
                        month: y >= currentYr && prev.month > currentMo ? currentMo : prev.month,
                      }))
                    } else if (pickerTarget === "to") {
                      setCustomTo((prev) => ({
                        year: y,
                        month: y >= currentYr && prev.month > currentMo ? currentMo : prev.month,
                      }))
                    }
                  }}
                  className="w-24 border-0 bg-transparent rounded-full"
                  visibleCount={5}
                  itemHeight={38}
                  sound
                  aria-label="Year"
                />
              </div>
            )
          })()}
        </CenterMorphModalContent>
      </CenterMorphModal>

    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col p-4 pt-6 sm:pt-8 gap-6 w-full max-w-md mx-auto relative select-none">
      <AnalyticsEarningsChart />
    </div>
  )
}



