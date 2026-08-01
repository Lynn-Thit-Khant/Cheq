"use server"

import { createClient } from "@/lib/server"
import { shiftFormSchema, type Shift, type ShiftFormValues } from "@/lib/schemas/shift-form-schema"

export async function getShifts(): Promise<Shift[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("user_id", user.id)
    .order("shift_date", { ascending: false })
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Error fetching shifts:", error)
    throw new Error("Failed to fetch shifts")
  }

  return (data ?? []) as Shift[]
}

export async function createShift(values: ShiftFormValues): Promise<Shift> {
  const parsed = shiftFormSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error("Invalid shift data")
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("shifts")
    .insert({
      user_id: user.id,
      workplace_name: parsed.data.workplace_name,
      workplace_location: parsed.data.workplace_location,
      shift_date: parsed.data.shift_date,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      hourly_rate: parsed.data.hourly_rate ?? 0,
      break_duration: parsed.data.break_duration ?? 0,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating shift:", error)
    throw new Error("Failed to create shift")
  }

  return data as Shift
}

export async function updateShift(id: string, values: ShiftFormValues): Promise<Shift> {
  const parsed = shiftFormSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error("Invalid shift data")
  }

  if (!id || typeof id !== "string") {
    throw new Error("Invalid shift ID")
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("shifts")
    .update({
      workplace_name: parsed.data.workplace_name,
      workplace_location: parsed.data.workplace_location,
      shift_date: parsed.data.shift_date,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      hourly_rate: parsed.data.hourly_rate ?? 0,
      break_duration: parsed.data.break_duration ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating shift:", error)
    throw new Error("Failed to update shift")
  }

  return data as Shift
}

export async function deleteShift(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("shifts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error deleting shift:", error)
    throw new Error("Failed to delete shift")
  }

  return { success: true }
}
