"use server"

import Groq from "groq-sdk"
import { z } from "zod"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const extractedShiftSchema = z.object({
  workplace_name: z.string().default("Workplace"),
  workplace_location: z.string().optional().default(""),
  shift_date: z.string(), // YYYY-MM-DD
  start_time: z.string(), // HH:mm
  end_time: z.string(),   // HH:mm
  hourly_rate: z.number().optional(),
  break_duration: z.number().optional(),
})

export type ExtractedShift = z.infer<typeof extractedShiftSchema>

export async function extractShiftsFromText(
  rawText: string,
  userDefaults: { default_hourly_rate: number; default_break_duration: number }
): Promise<ExtractedShift[]> {
  if (!rawText || !rawText.trim()) {
    return []
  }

  const today = new Date().toISOString().split("T")[0]
  const currentYear = new Date().getFullYear()

  const systemPrompt = `
You are an expert AI schedule parser for a part time jobs tracking app.
Your task is to extract all shift work events from raw user input text (e.g. WhatsApp messages, emails, roster lists, shorthand schedules) and return them in a JSON object.

Today's date is: ${today}.
Current year is: ${currentYear}. 
CRITICAL PARSING RULES:
1. WORKPLACE NAME: If a header or title is mentioned at top (e.g. "*Republic Bar*"), apply that workplace name to all shift lines listed under it. Remove formatting like asterisks. If no workplace name is mentioned, use "Workplace".
2. WORKPLACE LOCATION: If location is NOT explicitly mentioned in the text, leave "workplace_location" as an empty string (""). DO NOT guess or invent a location.
3. DATES & YEAR: Convert dates without years (e.g. "15 Apr", "Wed 14/8", "this Mon") to absolute ISO dates "YYYY-MM-DD" using current year ${currentYear}. If the month/day has passed in ${currentYear}, resolve to the upcoming year.
4. TIMES (24-HOUR "HH:mm"): Convert times into 24-hour format "HH:mm" (e.g. "5pm" -> "17:00", "12am" -> "00:00", "1am" -> "01:00", "2pm" -> "14:00", "10pm" -> "22:00").
5. HOURLY RATE: If hourly rate is NOT mentioned in text, use default rate: ${userDefaults.default_hourly_rate || 20}.
6. BREAK DURATION: If break duration is NOT mentioned in text, use default break: ${userDefaults.default_break_duration || 0}.
7. IGNORE CHATTER: Completely ignore non-shift chat lines (e.g. "Do let me know if you are able to work the allocated timings.").

EXAMPLE INPUT:
"*Republic Bar*
15 Apr, Wed - 5pm - 12am 
16 Apr, Thurs - 5pm - 12am
17 Apr, Fri - 6pm - 1am
19 Apr, Sun - 2pm - 10pm 
Do let me know if you are able to work the allocated timings."

EXPECTED JSON OUTPUT:
{
  "shifts": [
    {
      "workplace_name": "Republic Bar",
      "workplace_location": "",
      "shift_date": "${currentYear}-04-15",
      "start_time": "17:00",
      "end_time": "00:00",
      "hourly_rate": ${userDefaults.default_hourly_rate || 20},
      "break_duration": ${userDefaults.default_break_duration || 0}
    },
    {
      "workplace_name": "Republic Bar",
      "workplace_location": "",
      "shift_date": "${currentYear}-04-16",
      "start_time": "17:00",
      "end_time": "00:00",
      "hourly_rate": ${userDefaults.default_hourly_rate || 20},
      "break_duration": ${userDefaults.default_break_duration || 0}
    },
    {
      "workplace_name": "Republic Bar",
      "workplace_location": "",
      "shift_date": "${currentYear}-04-17",
      "start_time": "18:00",
      "end_time": "01:00",
      "hourly_rate": ${userDefaults.default_hourly_rate || 20},
      "break_duration": ${userDefaults.default_break_duration || 0}
    },
    {
      "workplace_name": "Republic Bar",
      "workplace_location": "",
      "shift_date": "${currentYear}-04-19",
      "start_time": "14:00",
      "end_time": "22:00",
      "hourly_rate": ${userDefaults.default_hourly_rate || 20},
      "break_duration": ${userDefaults.default_break_duration || 0}
    }
  ]
}
`

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: rawText },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  })

  const content = completion.choices[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(content)
  const shiftsArray = Array.isArray(parsed.shifts) ? parsed.shifts : []

  return z.array(extractedShiftSchema).parse(shiftsArray)
}
