"use client"

import { useEffect, useState } from "react"
import { BackButton } from "@/components/back-button"
import { Briefcase, Plus, MapPin, Clock, DollarSign, Coffee, Calendar } from "lucide-react"
import { motion } from "motion/react"
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalClose,
} from "@/components/motion/center-morph-modal"
import { Button } from "@/components/motion/button/base"
import { TemplateForm } from "@/components/template-form"
import type { ShiftTemplate } from "@/lib/schemas/shift-form-schema"
import type { TemplateFormValues } from "@/lib/schemas/shift-form-schema"
import { getUserPreferences, type UserPreferences } from "../defaults/actions"
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "./actions"

// ── Helpers ────────────────────────────────────────────────────
import { SettingsCard } from "@/components/settings-card"
import { SettingsRow } from "@/components/settings-row"
import { formatDisplayTime } from "@/lib/time-utils"

function templateToTemplateFormValues(t: ShiftTemplate): TemplateFormValues {
  return {
    name: t.name,
    workplace_name: t.workplace_name,
    workplace_location: t.workplace_location,
    start_time: t.start_time.slice(0, 5), // HH:MM:SS → HH:MM
    end_time: t.end_time.slice(0, 5),
    hourly_rate: Number(t.hourly_rate),
    break_duration: t.break_duration,
  }
}

// ── Page ───────────────────────────────────────────────────────
type ModalMode = "idle" | "create" | "view" | "edit"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [modalMode, setModalMode] = useState<ModalMode>("idle")
  const [selected, setSelected] = useState<ShiftTemplate | null>(null)

  const [preferences, setPreferences] = useState<UserPreferences>({
    time_format: "12h",
    first_day_of_week: "Monday",
    default_hourly_rate: 0,
    default_break_duration: 0,
  })

  // Load templates + preferences
  useEffect(() => {
    Promise.all([getTemplates(), getUserPreferences()]).then(
      ([temps, prefs]) => {
        setTemplates(temps)
        setPreferences(prefs)
        setIsLoading(false)
      },
    )
  }, [])

  const openCreate = () => {
    setSelected(null)
    setModalMode("create")
  }

  const openView = (t: ShiftTemplate) => {
    setSelected(t)
    setModalMode("view")
  }

  const openEdit = () => {
    setModalMode("edit")
  }

  const closeModal = () => {
    setModalMode("idle")
    setSelected(null)
  }

  const handleCreate = async (data: TemplateFormValues) => {
    setIsSaving(true)
    try {
      const created = await createTemplate(data)
      setTemplates((prev) => [created, ...prev])
      closeModal()
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (data: TemplateFormValues) => {
    if (!selected) return
    setIsSaving(true)
    try {
      const updated = await updateTemplate(selected.id, data)
      setTemplates((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      )
      closeModal()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    setIsDeleting(true)
    try {
      await deleteTemplate(selected.id)
      setTemplates((prev) => prev.filter((t) => t.id !== selected.id))
      closeModal()
    } finally {
      setIsDeleting(false)
    }
  }

  const hasTemplates = templates.length > 0
  const canCreate = templates.length < 3

  return (
    <>
      <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
        {/* Header */}
        <div className="grid grid-cols-[3rem_1fr_auto] items-center w-full mb-2 shrink-0">
          <BackButton href="/settings" />
          <h1 className="text-2xl font-bold text-center">Templates</h1>
          {hasTemplates && !isLoading && canCreate ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.85, opacity: 0.7 }}
              onClick={openCreate}
              className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-muted-foreground hover:text-foreground hover:bg-card/90 transition-colors ml-auto"
              aria-label="Create template"
            >
              Add
            </motion.button>
          ) : (
            <div />
          )}
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : !hasTemplates ? (
          /* ── Empty state ─────────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-sm text-muted-foreground">
              Create templates to quickly log recurring shifts.
            </p>
            <motion.div whileTap={{ scale: 0.85, opacity: 0.7 }}>
              <button
                type="button"
                onClick={openCreate}
                className="rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-card/90 text-foreground px-6 h-12 text-sm font-medium inline-flex items-center justify-center"
              >
                Create Template
              </button>
            </motion.div>
          </div>
        ) : (
          /* ── Template list ───────────────────────────── */
          <div className="flex-1 flex flex-col justify-start w-full gap-6 mt-6">
            <SettingsCard>
              {templates.map((template) => (
                <SettingsRow
                  key={template.id}
                  onClick={() => openView(template)}
                >
                  <div className="flex items-center gap-3 text-left min-w-0 flex-1 pr-4">
                    <div className="w-1 h-5 rounded-full bg-primary/80 shrink-0" />
                    <span className="text-[15px] font-medium text-foreground tracking-tight truncate">
                      {template.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13px] text-muted-foreground font-medium">
                      {formatDisplayTime(template.start_time, preferences.time_format)} – {formatDisplayTime(template.end_time, preferences.time_format)}
                    </span>
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="text-muted-foreground shrink-0">
                      <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </SettingsRow>
              ))}
            </SettingsCard>
            
            {!canCreate && (
              <p className="text-center text-[13px] text-muted-foreground mt-2">
                You've reached the maximum limit of 3 templates.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Create Modal ────────────────────────────────── */}
      <CenterMorphModal
        open={modalMode === "create"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="Create Template"
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          <TemplateForm
            onSubmit={handleCreate}
            isSaving={isSaving}
            timeFormat={preferences.time_format}
            defaultValues={{
              hourly_rate: preferences.default_hourly_rate,
              break_duration: preferences.default_break_duration,
            }}
          />
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── View Modal ──────────────────────────────────── */}
      <CenterMorphModal
        open={modalMode === "view"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <CenterMorphModalContent
          ariaLabel="View Template"
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          {selected && (
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col gap-1 text-center px-8">
                <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground truncate">
                  {selected.name}
                </h2>
              </div>

              {/* Details */}
              <div className="flex flex-col mt-2">
                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40 gap-4">
                  <span className="text-muted-foreground shrink-0">Workplace</span>
                  <span className="text-foreground font-medium truncate max-w-[60%] text-right">{selected.workplace_name}</span>
                </div>
                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40 gap-4">
                  <span className="text-muted-foreground shrink-0">Location</span>
                  <span className="text-foreground font-medium truncate max-w-[60%] text-right">{selected.workplace_location}</span>
                </div>

                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-foreground font-medium">
                    {formatDisplayTime(selected.start_time, preferences.time_format)}
                    {" – "}
                    {formatDisplayTime(selected.end_time, preferences.time_format)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="text-foreground font-medium">${Number(selected.hourly_rate).toFixed(2)} / hr</span>
                </div>
                <div className="flex items-center justify-between text-[15px] py-3.5">
                  <span className="text-muted-foreground">Break</span>
                  <span className="text-foreground font-medium">{selected.break_duration} min</span>
                </div>
              </div>

              {/* Footer: Delete + Edit */}
              <div className="mt-2 flex justify-end gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting" : "Delete"}
                </Button>
                <Button
                  onClick={openEdit}
                  disabled={isDeleting}
                >
                  Edit
                </Button>
              </div>
            </div>
          )}
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* ── Edit Modal ──────────────────────────────────── */}
      <CenterMorphModal
        open={modalMode === "edit"}
        onOpenChange={(open) => !open && setModalMode("view")}
      >
        <CenterMorphModalContent
          ariaLabel="Edit Template"
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          {selected && (
            <TemplateForm
              key={selected.id}
              onSubmit={handleUpdate}
              isSaving={isSaving}
              timeFormat={preferences.time_format}
              defaultValues={templateToTemplateFormValues(selected)}
            />
          )}
        </CenterMorphModalContent>
      </CenterMorphModal>
    </>
  )
}
