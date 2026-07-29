"use server"

import { createClient } from "@/lib/server"

export interface UserPreferences {
  time_format: '12h' | '24h'
  first_day_of_week: 'Monday' | 'Sunday'
  default_hourly_rate: number
  default_break_duration: number
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase 
    .from('user_preferences')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is fine, we'll return defaults
    console.error("Error fetching user preferences:", error)
    throw new Error("Failed to fetch preferences")
  }

  return {
    time_format: data?.time_format || '12h',
    first_day_of_week: data?.first_day_of_week || 'Monday',
    default_hourly_rate: data?.default_hourly_rate || 0,
    default_break_duration: data?.default_break_duration || 0,
  }
}

export async function updateUserPreferences(updates: Partial<UserPreferences>) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  // We use upsert to insert the row if it doesn't exist, or update if it does.
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      id: user.id,
      ...updates,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error("Error updating user preferences:", error)
    throw new Error("Failed to update preferences")
  }

  return { success: true }
}
