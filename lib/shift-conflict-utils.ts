import type { Shift, ShiftFormValues } from "@/lib/schemas/shift-form-schema"

export type ShiftConflictType = "exact_duplicate" | "pay_break_update" | "double_booking" | "time_overlap"

export interface ShiftConflictResult {
  hasConflict: boolean
  conflictType: ShiftConflictType | null
  conflictingShift: Shift | null
}

/**
 * Converts a time string "HH:mm" or "HH:mm:ss" to total minutes from midnight.
 */
export function parseTimeToMinutes(t: string): number {
  if (!t) return 0
  const parts = t.split(":")
  const hours = Number(parts[0]) || 0
  const minutes = Number(parts[1]) || 0
  return hours * 60 + minutes
}

/**
 * Checks an incoming shift payload against existing logged shifts on the same date.
 * Categorizes collisions into:
 * - exact_duplicate: Same date, same start & end time, same workplace, same rate & break.
 * - pay_break_update: Same date, same start & end time, same workplace, different rate or break.
 * - double_booking: Same date, same start & end time, different workplace.
 * - time_overlap: Same date, overlapping time window (start_A < end_B && end_A > start_B).
 */
export function detectShiftConflict(
  incoming: ShiftFormValues,
  existingShifts: Shift[],
  excludeShiftId?: string
): ShiftConflictResult {
  if (!incoming.shift_date || !incoming.start_time || !incoming.end_time) {
    return { hasConflict: false, conflictType: null, conflictingShift: null }
  }

  const targetDate = incoming.shift_date
  let incomingStart = parseTimeToMinutes(incoming.start_time)
  let incomingEnd = parseTimeToMinutes(incoming.end_time)

  // Handle overnight shift where end_time < start_time
  if (incomingEnd < incomingStart) {
    incomingEnd += 24 * 60
  }

  const incomingWorkplace = (incoming.workplace_name || "").trim().toLowerCase()

  for (const existing of existingShifts) {
    if (excludeShiftId && existing.id === excludeShiftId) continue
    if (existing.shift_date !== targetDate) continue

    let existingStart = parseTimeToMinutes(existing.start_time)
    let existingEnd = parseTimeToMinutes(existing.end_time)

    // Handle overnight shift for existing
    if (existingEnd < existingStart) {
      existingEnd += 24 * 60
    }

    const existingWorkplace = (existing.workplace_name || "").trim().toLowerCase()

    const isExactTime =
      existing.start_time.slice(0, 5) === incoming.start_time.slice(0, 5) &&
      existing.end_time.slice(0, 5) === incoming.end_time.slice(0, 5)

    const isOverlapping = incomingStart < existingEnd && incomingEnd > existingStart

    if (isExactTime) {
      if (existingWorkplace === incomingWorkplace) {
        const isSameRate = Number(incoming.hourly_rate ?? 0) === Number(existing.hourly_rate ?? 0)
        const isSameBreak = Number(incoming.break_duration ?? 0) === Number(existing.break_duration ?? 0)

        if (isSameRate && isSameBreak) {
          return {
            hasConflict: true,
            conflictType: "exact_duplicate",
            conflictingShift: existing,
          }
        } else {
          return {
            hasConflict: true,
            conflictType: "pay_break_update",
            conflictingShift: existing,
          }
        }
      } else {
        return {
          hasConflict: true,
          conflictType: "double_booking",
          conflictingShift: existing,
        }
      }
    } else if (isOverlapping) {
      return {
        hasConflict: true,
        conflictType: "time_overlap",
        conflictingShift: existing,
      }
    }
  }

  return { hasConflict: false, conflictType: null, conflictingShift: null }
}
