"use client"

import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Clock, ChevronDown } from "lucide-react"
import { templateFormSchema, type TemplateFormValues } from "@/lib/schemas/shift-form-schema"
import { WheelPicker } from "@/components/motion/wheel-picker"
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
  parseTime12, parseTime24,
  formatTime12, formatTime24,
  displayTime12, displayTime24,
} from "@/lib/time-utils"

// ── Props ──────────────────────────────────────────────────────
export interface TemplateFormProps {
  defaultValues?: Partial<TemplateFormValues>
  timeFormat?: "12h" | "24h"
  onSubmit: (data: TemplateFormValues) => Promise<void> | void
  isSaving?: boolean
}

export function TemplateForm({
  defaultValues,
  timeFormat = "12h",
  onSubmit,
  isSaving = false,
}: TemplateFormProps) {
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      workplace_name: defaultValues?.workplace_name ?? "",
      workplace_location: defaultValues?.workplace_location ?? "",
      start_time: defaultValues?.start_time ?? "",
      end_time: defaultValues?.end_time ?? "",
      hourly_rate: defaultValues?.hourly_rate,
      break_duration: defaultValues?.break_duration,
    },
  })


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
    await onSubmit(data)
  })

  // Display values
  const startDisplay = !startPicked ? "--:--" : (timeFormat === "12h"
    ? displayTime12(startHour, startMin, startAmpm)
    : displayTime24(startHour, startMin))
  const endDisplay = !endPicked ? "--:--" : (timeFormat === "12h"
    ? displayTime12(endHour, endMin, endAmpm)
    : displayTime24(endHour, endMin))

  const startTime24 = timeFormat === "12h"
    ? formatTime12(startHour, startMin, startAmpm)
    : formatTime24(startHour, startMin)
  const endTime24 = timeFormat === "12h"
    ? formatTime12(endHour, endMin, endAmpm)
    : formatTime24(endHour, endMin)

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="flex flex-col gap-5">
        {/* ── Template name as editable title ────────────── */}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <input
                {...field}
                type="text"
                placeholder="Template Name"
                className="w-full bg-transparent text-center text-lg font-semibold leading-none tracking-tight text-foreground placeholder:text-muted-foreground/50 outline-none border-none focus:outline-none px-8 truncate"
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <FieldGroup>
          {/* ── Workplace + Location (same row) ─────────── */}
          <div className="grid grid-cols-2 gap-3">
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
                    className="h-12 bg-card"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="workplace_location"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="workplace_location">Location</FieldLabel>
                  <Input
                    {...field}
                    id="workplace_location"
                    type="text"
                    placeholder="Downtown"
                    className="h-12 bg-card"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>


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

              <div className="grid grid-cols-2 gap-4">
                {/* Start time */}
                <Field>
                  <FieldLabel>Starts</FieldLabel>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTimeField("start");
                      setStartPicked(true);
                      setTimePickerOpen(true);
                    }}
                    className={cn(
                      "flex h-12 w-full items-center gap-3 rounded-full border border-border bg-card px-4 text-base md:text-sm text-foreground transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none",
                      activeTimeField === "start" && timePickerOpen && "border-ring ring-1 ring-ring"
                    )}
                  >
                    <Clock className="size-4 text-muted-foreground shrink-0" />
                    <span>{startDisplay}</span>
                    <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                  </button>
                  {form.formState.errors.start_time && (
                    <FieldError errors={[form.formState.errors.start_time]} />
                  )}
                </Field>

                {/* End time */}
                <Field>
                  <FieldLabel>Ends</FieldLabel>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTimeField("end");
                      setEndPicked(true);
                      setTimePickerOpen(true);
                    }}
                    className={cn(
                      "flex h-12 w-full items-center gap-3 rounded-full border border-border bg-card px-4 text-base md:text-sm text-foreground transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none",
                      activeTimeField === "end" && timePickerOpen && "border-ring ring-1 ring-ring"
                    )}
                  >
                    <Clock className="size-4 text-muted-foreground shrink-0" />
                    <span>
                      {endDisplay}
                    </span>
                    <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
                  </button>
                  {form.formState.errors.end_time && (
                    <FieldError errors={[form.formState.errors.end_time]} />
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
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="break_duration">Break (min)</FieldLabel>
                  <Input
                    {...field}
                    id="break_duration"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="30"
                    className="h-12 bg-card [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </FieldGroup>

        {/* ── Footer: Cancel + Save ─────────────────────── */}
        <div className="mt-2 flex justify-end gap-3">
          <CenterMorphModalClose>
            <Button variant="ghost" disabled={isSaving}>Cancel</Button>
          </CenterMorphModalClose>
          <Button type="submit" isLoading={isSaving} disabled={isSaving}>
            {isSaving ? "Saving" : "Save"}
          </Button>
        </div>
      </div>
    </form>
  )
}
