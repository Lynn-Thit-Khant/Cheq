"use server"

import { createClient } from "@/lib/server"
import { templateFormSchema } from "@/lib/schemas/shift-form-schema"
import type { ShiftTemplate, TemplateFormValues } from "@/lib/schemas/shift-form-schema"

export async function getTemplates(): Promise<ShiftTemplate[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from('shift_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error("Error fetching templates:", error)
    throw new Error("Failed to fetch templates")
  }

  return (data ?? []) as ShiftTemplate[]
}

export async function createTemplate(values: TemplateFormValues): Promise<ShiftTemplate> {
  // Server-side validation
  const parsed = templateFormSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error("Invalid template data")
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from('shift_templates')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      workplace_name: parsed.data.workplace_name,
      shift_date: "1970-01-01",
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      hourly_rate: parsed.data.hourly_rate,
      break_duration: parsed.data.break_duration,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating template:", error)
    throw new Error("Failed to create template")
  }

  return data as ShiftTemplate
}

export async function updateTemplate(id: string, values: TemplateFormValues): Promise<ShiftTemplate> {
  // Server-side validation
  const parsed = templateFormSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error("Invalid template data")
  }

  if (!id || typeof id !== 'string') {
    throw new Error("Invalid template ID")
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from('shift_templates')
    .update({
      name: parsed.data.name,
      workplace_name: parsed.data.workplace_name,
      shift_date: "1970-01-01",
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      hourly_rate: parsed.data.hourly_rate,
      break_duration: parsed.data.break_duration,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating template:", error)
    throw new Error("Failed to update template")
  }

  return data as ShiftTemplate
}

export async function deleteTemplate(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from('shift_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error("Error deleting template:", error)
    throw new Error("Failed to delete template")
  }

  return { success: true }
}
