# ⚡ Shift Conflict & Validation Specification

This document is the comprehensive specification for conflict detection, alert messaging, and resolution flows across **Smart Add (AI Batch)**, **Manual Add**, **Template Add**, and **Edit Shift** in the **Cheq** application.

---

## 1. Core Philosophy: `[ Edit ]` vs. `[ Replace ]`

The legacy system offered `"Keep Both"` on identical shifts, causing accidental duplicates and doubled earnings calculations. Cheq replaces this with a two-button resolution model:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          [ CONFLICT ALERT MODAL ]                           │
│                                                                             │
│   • Left Button:  [ Edit ]    (Secondary / Outline)                         │
│     The "Mistake Recovery" button. Dismisses the alert and preserves all    │
│     typed/parsed form inputs so the user can immediately fix the date/hours.│
│                                                                             │
│   • Right Button: [ Replace ] (Primary / Solid)                             │
│     The "Resolution" button. Overwrites the existing record, applies rate   │
│     updates, and keeps 1 clean shift to prevent doubled earnings.           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Smart Add (AI Batch) Conflict Matrix

Smart Add processes unstructured rosters (via WhatsApp, SMS, or OCR) into an editable [ExtractedShiftAccordion](file:///c:/Users/Lynn/cheq/components/extracted-shift-accordion.tsx). Conflicts are divided into **Intra-Batch (inside pasted text)** and **Database (against Supabase)**.

### 📂 A. Intra-Batch Conflicts (Within the Pasted Text Itself)

*These occur when the pasted roster contains multiple conflicting lines before saving to the database.*

| # | Conflict Scenario | Condition in Pasted Text | Alert Title & Subtitle | What `[ Edit ]` Does | What `[ Replace ]` Does |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Intra-Batch Exact Clone** | Text lists the exact same shift twice (e.g., `Mon 9–5 Cafe, $25` repeated). | **Duplicate Shift Detected**<br>*This shift is already listed earlier in your batch.* | Dismisses alert & auto-expands Row #2 in accordion so user can tap the red Trash icon to delete it. | Drops Row #1 and keeps only Row #2 in the batch (leaves 1 clean shift). |
| **2** | **Intra-Batch Rate / Break Diff** | Line 1: `Mon 9–5 Cafe, $20`<br>Line 2: `Mon 9–5 Cafe, $25 (OT)` | **Shift Already Exists**<br>*Update this shift with your new rate or break?* | Opens Row #2 in accordion to inspect or tweak the hours. | Keeps Row #2 with the updated $25 rate and drops Row #1. |
| **3** | **Intra-Batch Double Booking** | Line 1: `Mon 9–5 Cafe`<br>Line 2: `Mon 9–5 Republic Bar` | **Time Slot Already Taken**<br>*You already have a shift at another workplace for these hours.* | Auto-expands Row #2 in accordion so user can change the date or workplace. | Discards Cafe (Row #1) and keeps Republic Bar (Row #2). |
| **4** | **Intra-Batch Partial Overlap** | Line 1: `Mon 9am–5pm Cafe`<br>Line 2: `Mon 4pm–10pm Bar` *(1 hr overlap: 4–5pm)* | **Time Overlap in Pasted Text**<br>*Your pasted schedule contains 2 overlapping shifts on Monday.* | Auto-expands Row #2 so user can change `16:00` to `17:00` (5:00 PM) in 1 tap. | Discards Line 1 (9–5) and keeps Line 2 (4–10). |
| **5** | **Intra-Batch Enclosing Shift** | Line 1: `Mon 8am–8pm Double Shift`<br>Line 2: `Mon 12pm–4pm Lunch Cover` | **Time Overlap in Pasted Text**<br>*This shift is completely inside another shift in your batch.* | Focuses Row #2 in accordion to delete the sub-block or adjust hours. | Keeps the master 8–8 shift and discards the sub-block. |
| **6** | **Intra-Batch Overnight Spillover** | Line 1: `Mon 10pm–6am Bar` *(ends Tue 6am)*<br>Line 2: `Tue 5am–1pm Cafe` *(starts Tue 5am)* | **Time Overlap in Pasted Text**<br>*Monday's night shift overlaps with Tuesday's morning shift.* | Focuses Row #2 in accordion to fix the Tuesday start time (change 5am to 6:30am). | Replaces the Monday night shift with Tuesday's morning shift. |

---

### 📂 B. Database Conflicts (Pasted Text vs. Already Logged Shifts in DB)

*These occur when newly parsed shifts collide with shifts already saved in Supabase.*

| # | Conflict Scenario | Example Scenario | Alert Title & Subtitle | What `[ Edit ]` Does | What `[ Replace ]` Does |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **7** | **Pasted vs. DB Exact Duplicate** | Pasted: `Mon 9–5 Cafe`<br>DB: `Mon 9–5 Cafe` | **Duplicate Shift Detected**<br>*An identical shift is already in your schedule.* | Focuses row in accordion so user can delete it or change the date. | Skips creating a duplicate DB record; preserves existing one. |
| **8** | **Pasted vs. DB Rate / Break Update** | Pasted: `Mon 9–5 Cafe, $25`<br>DB: `Mon 9–5 Cafe, $20` | **Shift Already Exists**<br>*Update this shift with your new rate or break?* | Focuses row in accordion to verify pay. | Updates existing DB shift's hourly rate from $20 to $25. |
| **9** | **Pasted vs. DB Double Booking** | Pasted: `Mon 9–5 Bar`<br>DB: `Mon 9–5 Cafe` | **Time Slot Already Taken**<br>*You already have a shift logged at [Existing Workplace].* | Focuses row in accordion to adjust time/workplace. | Deletes old *Cafe* shift in DB and creates new *Bar* shift. |
| **10** | **Pasted vs. DB Partial Overlap** | Pasted: `Mon 4pm–11pm Bar`<br>DB: `Mon 9am–5pm Cafe` *(overlap 4–5pm)* | **Time Overlap Detected**<br>*This shift overlaps with your [Workplace] shift ([Start] – [End]).* | Focuses row in accordion so user can trim 4pm to 5pm. | Deletes old 9–5 Cafe shift in DB and inserts the 4–11 Bar shift. |
| **11** | **Pasted vs. DB Overnight Spillover** | Pasted: `Tue 5am–1pm Cafe`<br>DB: `Mon 10pm–6am Bar` *(spills into Tue)* | **Time Overlap Detected**<br>*This shift overlaps with your overnight shift from yesterday.* | Focuses Tuesday row in accordion to adjust start time. | Deletes yesterday's overnight shift from DB and logs Tuesday. |
| **12** | **Pasted 1-to-Many Collision** | Pasted: `Mon 8am–8pm Double`<br>DB: `Mon 9–1pm` & `Mon 4–7pm` (2 split shifts) | **Multiple Shifts Overlap**<br>*This shift overlaps with 2 existing shifts in your schedule.* | Focuses row in accordion to check hours. | Deletes **both** split shifts in DB and inserts the single full-day shift. |

---

## 3. Manual Add & Template Add Solutions

Manual Add and Template Add share the exact same single-shift entry flow via [ShiftForm](file:///c:/Users/Lynn/cheq/components/shift-form.tsx).

| Category | Input Condition | Alert Title & Subtitle | What `[ Edit ]` Does | What `[ Replace ]` Does |
| :--- | :--- | :--- | :--- | :--- |
| **1. 100% Identical Shift** | Workplace, Date, Time, Rate, and Break all 100% match an existing shift. | **Duplicate Shift Detected**<br>*An identical shift is already in your schedule.* | **Dismisses alert & keeps `ShiftForm` open** with all typed values preserved so user can change date/hours. | **Overwrites existing record**, keeps 1 clean shift, updates income, and closes form. |
| **2. Rate / Break Update** | Workplace, Date, and Time match, but Rate or Break is different. | **Shift Already Exists**<br>*Update this shift with your new rate or break?* | **Dismisses alert & keeps `ShiftForm` open** so user can adjust hours or rate. | **Updates existing shift** with new rate/break in DB & UI and closes form. |
| **3. Double Booking** | Different Workplace, but same Date and exact same Start & End time. | **Time Slot Already Taken**<br>*You already have a shift logged at [Workplace].* | **Dismisses alert & keeps `ShiftForm` open** so user can change workplace or time. | **Deletes old workplace shift**, saves new workplace shift to DB & UI, and closes form. |
| **4. Partial Time Overlap** | Same date, overlapping hours window *(e.g., 9am–5pm vs 4pm–10pm)*. | **Time Overlap Detected**<br>*This shift overlaps with your [Workplace] shift.* | **Dismisses alert & keeps `ShiftForm` open** so user can trim hours *(e.g., change 4pm to 5pm)*. | **Deletes overlapping shift**, saves new shift to DB & UI, and closes form. |

---

## 4. Edit Shift Mode Solutions

When editing an existing shift (`modalMode === "edit"`), conflict detection runs against all database shifts **excluding the shift currently being edited** (`excludeShiftId = selectedShift.id`).

| Category | Condition During Edit | Alert Title & Subtitle | What `[ Edit ]` Does | What `[ Replace ]` Does |
| :--- | :--- | :--- | :--- | :--- |
| **1. Identical Shift** | User edits Shift A's date/time so it now 100% matches another existing Shift B. | **Duplicate Shift Detected**<br>*An identical shift is already in your schedule.* | **Dismisses alert & keeps Edit modal open** so user can choose a different date or time. | **Deletes Shift B** and applies the updates to Shift A, leaving 1 clean record. Closes modal. |
| **2. Rate / Break Update** | Shift A is edited into Shift B's slot with a different rate or break. | **Shift Already Exists**<br>*A shift with these hours already exists with a different rate.* | **Dismisses alert & keeps Edit modal open** to adjust hours or rate. | **Deletes Shift B** and updates Shift A with the new rate/break. Closes modal. |
| **3. Double Booking** | Shift A is edited to the same date & time as Shift B at a different workplace. | **Time Slot Already Taken**<br>*You already have a shift logged at [Workplace].* | **Dismisses alert & keeps Edit modal open** so user can change time/workplace. | **Deletes conflicting Shift B** and updates Shift A with the new time/workplace. Closes modal. |
| **4. Partial Time Overlap** | Shift A's hours are expanded or moved such that they intersect with Shift B. | **Time Overlap Detected**<br>*This shift overlaps with your [Workplace] shift.* | **Dismisses alert & keeps Edit modal open** so user can adjust the time bounds. | **Deletes conflicting Shift B** and saves the new hours on Shift A. Closes modal. |

---

## 5. Technical Implementation Details

### 5.1 Expanded Conflict Types ([shift-conflict-utils.ts](file:///c:/Users/Lynn/cheq/lib/shift-conflict-utils.ts))

```ts
export type ShiftConflictType =
  | "exact_duplicate"   // 100% clone (workplace, date, time, rate, break match)
  | "pay_break_update"  // same workplace, date, time, BUT different rate or break
  | "double_booking"    // different workplace, same date & exact time
  | "time_overlap"      // same date, overlapping time window
  | "intra_batch_clone" // two identical shifts in the same pasted text
```

### 5.2 Normalization Rules
1. **Workplace Normalization**: `(name || "").trim().toLowerCase()` prevents false negatives from leading/trailing whitespace.
2. **Numeric Rates & Breaks**: Compared via `Number(val)`, avoiding string vs number mismatches (`25` vs `25.00`).
3. **Overnight Shifts**: Handled via `if (end < start) end += 24 * 60` and cross-day 48h comparison window.
4. **Self-Exclusion on Edit**: Always pass `excludeShiftId = selectedShift.id` when calling `detectShiftConflict` in Edit mode.

### 5.3 Button Layout & Physics
All conflict dialogs use [CenterMorphModal](file:///c:/Users/Lynn/cheq/components/motion/center-morph-modal.tsx) with a 50/50 split footer:

```tsx
<div className="grid grid-cols-2 gap-3 pt-2 w-full">
  <Button
    type="button"
    variant="outline"
    onClick={handleEditAction}
    className="h-11 rounded-full text-sm font-medium w-full border-border/60 cursor-pointer"
  >
    Edit
  </Button>
  <Button
    type="button"
    onClick={handleReplaceAction}
    className="h-11 rounded-full text-sm font-medium w-full cursor-pointer"
  >
    Replace
  </Button>
</div>
```
