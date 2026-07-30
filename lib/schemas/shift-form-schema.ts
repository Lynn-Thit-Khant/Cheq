import { z } from "zod"

// ── Shared Zod schema for shift forms ──────────────────────────
// Used by both template creation (Settings → Templates) and
// manual shift entry (Home page).

export const shiftFormSchema = z.object({
  name: z.string().min(1, "Template name is required."),
  workplace_name: z.string().min(1, "Workplace name is required."),
  workplace_location: z.string().min(1, "Location is required."),
  shift_date: z.string().min(1, "Date is required."),
  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
  hourly_rate: z.number().min(0, "Rate must be 0 or above."),
  break_duration: z.number().int().min(0, "Break must be 0 or above."),
})

export type ShiftFormValues = z.infer<typeof shiftFormSchema>

export const templateFormSchema = shiftFormSchema.omit({ shift_date: true })
export type TemplateFormValues = z.infer<typeof templateFormSchema>

// ── DB row type ────────────────────────────────────────────────
export interface ShiftTemplate {
  id: string
  user_id: string
  name: string
  workplace_name: string
  workplace_location: string
  shift_date: string      // YYYY-MM-DD
  start_time: string      // HH:MM:SS
  end_time: string        // HH:MM:SS
  hourly_rate: number
  break_duration: number
  created_at: string
  updated_at: string
}
