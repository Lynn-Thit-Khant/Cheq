"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar as CalendarIcon, Clock, ChevronDown } from "lucide-react"
import { shiftFormSchema, type ShiftFormValues } from "@/lib/schemas/shift-form-schema"
import { WheelPicker } from "@/components/motion/wheel-picker"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/motion/button/base"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalClose,
} from "@/components/motion/center-morph-modal"
import { cn } from "@/lib/utils"
import {
  HOURS_12, HOURS_24, MINUTES, AMPM,
  dateToString, stringToDate, formatDisplayDate,
  parseTime12, parseTime24,
  formatTime12, formatTime24,
  displayTime12, displayTime24,
} from "@/lib/time-utils"

// ── Props ──────────────────────────────────────────────────────
export interface ShiftFormProps {
  title?: string
  defaultValues?: Partial<ShiftFormValues>
  timeFormat?: "12h" | "24h"
  firstDayOfWeek?: "Monday" | "Sunday"
  onSubmit: (data: ShiftFormValues) => Promise<void> | void
  isSaving?: boolean
}

export function ShiftForm({
  title = "New Shift",
  defaultValues,
  timeFormat = "12h",
  firstDayOfWeek = "Monday",
  onSubmit,
  isSaving = false,
}: ShiftFormProps) {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      workplace_name: defaultValues?.workplace_name ?? "",
      shift_date: defaultValues?.shift_date ?? "",
      start_time: defaultValues?.start_time ?? "",
      end_time: defaultValues?.end_time ?? "",
      hourly_rate: defaultValues?.hourly_rate ?? undefined,
      break_duration: defaultValues?.break_duration ?? undefined,
    },
  })

  // ── Date picker ────────────────────────────────────────────
  const [dateOpen, setDateOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => (defaultValues?.shift_date ? stringToDate(defaultValues.shift_date) : undefined)
  )

  // ── Time picker shared state ─────────────────────────────
  const [timePickerOpen, setTimePickerOpen] = useState(false)
  const [activeTimeField, setActiveTimeField] = useState<"start" | "end">("start")

  const [startPicked, setStartPicked] = useState(!!defaultValues?.start_time)
  const [endPicked, setEndPicked] = useState(!!defaultValues?.end_time)

  // ── Start time picker state ────────────────────────────────
  const initStart = timeFormat === "12h"
    ? parseTime12(form.getValues("start_time") || "09:00")
    : parseTime24(form.getValues("start_time") || "09:00")

  const [startHour, setStartHour] = useState(initStart.hour)
  const [startMin, setStartMin] = useState(initStart.minute)
  const [startAmpm, setStartAmpm] = useState(
    timeFormat === "12h" ? (initStart as ReturnType<typeof parseTime12>).ampm : "AM"
  )

  useEffect(() => {
    if (!startPicked) return
    const val = timeFormat === "12h"
      ? formatTime12(startHour, startMin, startAmpm)
      : formatTime24(startHour, startMin)
    form.setValue("start_time", val, { shouldValidate: form.formState.isSubmitted })
  }, [startHour, startMin, startAmpm, timeFormat, form, startPicked])

  // ── End time picker state ──────────────────────────────────
  const initEnd = timeFormat === "12h"
    ? parseTime12(form.getValues("end_time") || "17:00")
    : parseTime24(form.getValues("end_time") || "17:00")

  const [endHour, setEndHour] = useState(initEnd.hour)
  const [endMin, setEndMin] = useState(initEnd.minute)
  const [endAmpm, setEndAmpm] = useState(
    timeFormat === "12h" ? (initEnd as ReturnType<typeof parseTime12>).ampm : "PM"
  )

  useEffect(() => {
    if (!endPicked) return
    const val = timeFormat === "12h"
      ? formatTime12(endHour, endMin, endAmpm)
      : formatTime24(endHour, endMin)
    form.setValue("end_time", val, { shouldValidate: form.formState.isSubmitted })
  }, [endHour, endMin, endAmpm, timeFormat, form, endPicked])

  const handleFormSubmit = form.handleSubmit(async (data) => {
    if (isSameTime || isBreakTooLong) return
    await onSubmit(data)
  })

  // Watch form values for real-time validation
  const startTimeVal = form.watch("start_time")
  const endTimeVal = form.watch("end_time")
  const breakDurationVal = form.watch("break_duration")

  const isSameTime = Boolean(startPicked && endPicked && startTimeVal && endTimeVal && startTimeVal === endTimeVal)

  let shiftSpanMinutes = 0
  if (startTimeVal && endTimeVal && !isSameTime) {
    const [sh, sm] = startTimeVal.split(":").map(Number)
    const [eh, em] = endTimeVal.split(":").map(Number)
    const sTotal = sh * 60 + (sm || 0)
    let eTotal = eh * 60 + (em || 0)
    if (eTotal < sTotal) eTotal += 24 * 60
    shiftSpanMinutes = eTotal - sTotal
  }

  const isBreakTooLong = Boolean(
    shiftSpanMinutes > 0 &&
    typeof breakDurationVal === "number" &&
    breakDurationVal >= shiftSpanMinutes
  )

  // Display values
  const dateDisplay = selectedDate ? formatDisplayDate(dateToString(selectedDate)) : "Choose date"
  const startDisplay = !startPicked ? "--:--" : (timeFormat === "12h"
    ? displayTime12(startHour, startMin, startAmpm)
    : displayTime24(startHour, startMin))
  const endDisplay = !endPicked ? "--:--" : (timeFormat === "12h"
    ? displayTime12(endHour, endMin, endAmpm)
    : displayTime24(endHour, endMin))

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="flex flex-col gap-6">
        {/* ── Modal Header ────────────── */}
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-base font-semibold leading-normal text-foreground">
            {title}
          </h2>
        </div>

        <FieldGroup>
          {/* ── Workplace (Full width) ─────────── */}
          <Controller
            name="workplace_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workplace_name">Workplace</FieldLabel>
                <Input
                  {...field}
                  id="workplace_name"
                  type="text"
                  placeholder="Cafe"
                  className="h-12 bg-card w-full"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* ── Shift date (calendar popover) ───────────── */}
          <Field data-invalid={!!form.formState.errors.shift_date}>
            <FieldLabel>Date</FieldLabel>
            <CenterMorphModal open={dateOpen} onOpenChange={setDateOpen}>
              <button
                type="button"
                onClick={() => setDateOpen(true)}
                className={cn(
                  "flex h-12 w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none",
                  selectedDate ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                <span className="whitespace-nowrap text-sm font-medium">{dateDisplay}</span>
                <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
              </button>
              <CenterMorphModalContent
                ariaLabel="Select date"
                showCloseButton={false}
                dismissible={true}
                noMorph
                className="w-auto p-1 border-border/60 shadow-sm bg-card"
              >
                <Calendar
                  mode="single"
                  className="bg-transparent"
                  weekStartsOn={firstDayOfWeek === "Sunday" ? 0 : 1}
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    if (date) {
                      form.setValue("shift_date", dateToString(date), { shouldValidate: form.formState.isSubmitted })
                    } else {
                      form.setValue("shift_date", "", { shouldValidate: form.formState.isSubmitted })
                    }
                    setDateOpen(false)
                  }}
                />
              </CenterMorphModalContent>
            </CenterMorphModal>
            {form.formState.errors.shift_date && (
              <FieldError errors={[form.formState.errors.shift_date]} />
            )}
          </Field>

          {/* ── Start + End time ────────────────────────── */}
          <div className="relative">
            {/* Single Shared CenterMorphModal for perfect centering */}
            <CenterMorphModal open={timePickerOpen} onOpenChange={setTimePickerOpen}>
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
                    value={activeTimeField === "start" ? startHour : endHour}
                    onValueChange={activeTimeField === "start" ? setStartHour : setEndHour}
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
                    value={activeTimeField === "start" ? startMin : endMin}
                    onValueChange={activeTimeField === "start" ? setStartMin : setEndMin}
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
                        value={activeTimeField === "start" ? startAmpm : endAmpm}
                        onValueChange={activeTimeField === "start" ? setStartAmpm : setEndAmpm}
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

            <div className="grid grid-cols-2 gap-3">
              {/* Start time */}
              <Field>
                <FieldLabel>Starts</FieldLabel>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTimeField("start")
                    setStartPicked(true)
                    setTimePickerOpen(true)
                  }}
                  className={cn(
                    "flex h-12 w-full items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none",
                    activeTimeField === "start" && timePickerOpen && "border-ring ring-1 ring-ring"
                  )}
                >
                  <Clock className="size-4 text-muted-foreground shrink-0" />
                  <span className="whitespace-nowrap text-sm font-medium">{startDisplay}</span>
                  <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                </button>
                {form.formState.errors.start_time && (
                  <FieldError errors={[form.formState.errors.start_time]} />
                )}
              </Field>

              {/* End time */}
              <Field data-invalid={isSameTime || !!form.formState.errors.end_time}>
                <FieldLabel>Ends</FieldLabel>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTimeField("end")
                    setEndPicked(true)
                    setTimePickerOpen(true)
                  }}
                  className={cn(
                    "flex h-12 w-full items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none",
                    activeTimeField === "end" && timePickerOpen && "border-ring ring-1 ring-ring",
                    (isSameTime || form.formState.errors.end_time) && "border-destructive ring-1 ring-destructive/40 bg-destructive/[0.03]"
                  )}
                >
                  <Clock className="size-4 text-muted-foreground shrink-0" />
                  <span className="whitespace-nowrap text-sm font-medium">{endDisplay}</span>
                  <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                </button>
                {(isSameTime || form.formState.errors.end_time) && (
                  <FieldError errors={[{ message: isSameTime ? "End time cannot be the same as start time" : form.formState.errors.end_time?.message }]} />
                )}
              </Field>
            </div>
          </div>

          {/* ── Hourly rate + Break ─────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="hourly_rate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hourly_rate">Hourly rate</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base pointer-events-none">$</span>
                    <Input
                      {...field}
                      id="hourly_rate"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={field.value !== undefined && field.value !== null ? field.value : ''}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '') {
                          field.onChange('')
                        } else {
                          const num = parseFloat(val)
                          field.onChange(isNaN(num) ? '' : num)
                        }
                      }}
                      placeholder="0.00"
                      className="h-12 bg-card pl-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="break_duration"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={isBreakTooLong || fieldState.invalid}>
                  <FieldLabel htmlFor="break_duration">Break (min)</FieldLabel>
                  <Input
                    {...field}
                    id="break_duration"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={field.value !== undefined && field.value !== null ? field.value : ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') {
                        field.onChange('')
                      } else {
                        const num = parseInt(val, 10)
                        field.onChange(isNaN(num) ? '' : num)
                      }
                    }}
                    placeholder="30"
                    className={cn(
                      "h-12 bg-card px-5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      (isBreakTooLong || fieldState.invalid) && "border-destructive ring-1 ring-destructive/40 bg-destructive/[0.03]"
                    )}
                    aria-invalid={isBreakTooLong || fieldState.invalid}
                  />
                  {(isBreakTooLong || fieldState.invalid) && (
                    <FieldError errors={[{ message: isBreakTooLong ? "Break must be shorter than shift length" : fieldState.error?.message }]} />
                  )}
                </Field>
              )}
            />
          </div>
        </FieldGroup>

        {/* ── Footer: Cancel + Save ─────────────────────── */}
        <div className="grid grid-cols-2 gap-3 pt-2 w-full">
          <CenterMorphModalClose>
            <Button type="button" variant="outline" disabled={isSaving} className="h-11 rounded-full text-sm font-medium w-full border-border/60 cursor-pointer">
              Cancel
            </Button>
          </CenterMorphModalClose>
          <Button type="submit" isLoading={isSaving} disabled={isSaving || isSameTime || isBreakTooLong} className="h-11 rounded-full text-sm font-medium w-full cursor-pointer">
            {isSaving ? "Saving" : "Save"}
          </Button>
        </div>
      </div>
    </form>
  )
}
