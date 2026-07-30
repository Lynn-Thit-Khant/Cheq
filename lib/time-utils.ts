// ── Shared time parsing, formatting and display helpers ─────────
// Used by ShiftForm, TemplateForm, and template listing pages.

// ── Constants ──────────────────────────────────────────────────
export const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
export const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
export const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))
export const AMPM = ["AM", "PM"]

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

// ── Date helpers ──────────────────────────────────────────────
export function dateToString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function stringToDate(str: string) {
  const [y, m, d] = str.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "Pick a date"
  const [y, m, d] = dateStr.split("-")
  return `${MONTHS_SHORT[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`
}

// ── Time parsing ──────────────────────────────────────────────
export function parseTime12(timeStr: string) {
  if (!timeStr) return { hour: "12", minute: "00", ampm: "AM" }
  const [hh, mm] = timeStr.split(":")
  let h = parseInt(hh, 10)
  const ampm = h >= 12 ? "PM" : "AM"
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return { hour: String(h).padStart(2, "0"), minute: mm.padStart(2, "0"), ampm }
}

export function parseTime24(timeStr: string) {
  if (!timeStr) return { hour: "00", minute: "00" }
  const [hh, mm] = timeStr.split(":")
  return { hour: hh.padStart(2, "0"), minute: mm.padStart(2, "0") }
}

// ── Time formatting (to HH:MM for storage) ────────────────────
export function formatTime12(hour: string, minute: string, ampm: string) {
  let h = parseInt(hour, 10)
  if (ampm === "PM" && h !== 12) h += 12
  if (ampm === "AM" && h === 12) h = 0
  return `${String(h).padStart(2, "0")}:${minute}`
}

export function formatTime24(hour: string, minute: string) {
  return `${hour}:${minute}`
}

// ── Time display (human-readable) ─────────────────────────────
export function displayTime12(hour: string, minute: string, ampm: string) {
  return `${parseInt(hour, 10)}:${minute} ${ampm}`
}

export function displayTime24(hour: string, minute: string) {
  return `${hour}:${minute}`
}

// ── Display time from raw HH:MM string ────────────────────────
export function formatDisplayTime(timeStr: string, format: "12h" | "24h") {
  if (!timeStr) return ""
  const [hh, mm] = timeStr.split(":")
  if (format === "24h") return `${hh}:${mm}`
  let h = parseInt(hh, 10)
  const ampm = h >= 12 ? "PM" : "AM"
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${mm} ${ampm}`
}
