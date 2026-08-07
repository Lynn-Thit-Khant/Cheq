import { z } from "zod"

// ── Shared Zod schema for shift forms ──────────────────────────
// Used by both template creation (Settings → Templates) and
// manual shift entry (Home page).

export const shiftFormSchema = z.object({
  workplace_name: z.string().min(1, "Workplace name is required."),
  shift_date: z.string().min(1, "Date is required."),
  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
  hourly_rate: z.number().min(0, "Rate must be 0 or above.").optional(),
  break_duration: z.number().int().min(0, "Break must be 0 or above.").optional(),
})

export type ShiftFormValues = z.infer<typeof shiftFormSchema>

export const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required."),
  workplace_name: z.string().min(1, "Workplace name is required."),
  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
  hourly_rate: z.number().min(0, "Rate must be 0 or above.").optional(),
  break_duration: z.number().int().min(0, "Break must be 0 or above.").optional(),
})
export type TemplateFormValues = z.infer<typeof templateFormSchema>

// ── DB row types ────────────────────────────────────────────────
export interface Shift {
  id: string
  user_id: string
  workplace_name: string
  shift_date: string      // YYYY-MM-DD
  start_time: string      // HH:MM:SS or HH:MM
  end_time: string        // HH:MM:SS or HH:MM
  hourly_rate: number
  break_duration: number
  estimated_income?: number
  total_earned?: number
  created_at: string
  updated_at: string
}

export interface ShiftTemplate {
  id: string
  user_id: string
  name: string
  workplace_name: string
  start_time: string      // HH:MM:SS
  end_time: string        // HH:MM:SS
  hourly_rate: number
  break_duration: number
  created_at: string
  updated_at: string
}

