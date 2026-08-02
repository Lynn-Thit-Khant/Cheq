"use client"

import { useEffect, useState } from "react"
import { BackButton } from "@/components/back-button"
import { Briefcase, ChevronRight } from "lucide-react"
import { motion } from "motion/react"
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal"
import { Button } from "@/components/motion/button/base"
import { TemplateForm } from "@/components/template-form"
import type { ShiftTemplate, TemplateFormValues } from "@/lib/schemas/shift-form-schema"
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
  const [modalMode, setModalMode] = useState<ModalMode>("idle")
  const [selected, setSelected] = useState<ShiftTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [preferences, setPreferences] = useState<UserPreferences>({
    time_format: "12h",
    first_day_of_week: "Monday",
    default_hourly_rate: 0,
    default_break_duration: 0,
  })

  // Load templates & preferences on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [prefs, userTemplates] = await Promise.all([
          getUserPreferences(),
          getTemplates(),
        ])
        setPreferences(prefs)
        setTemplates(userTemplates)
      } catch (err) {
        console.error("Error loading templates page:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // ── Modal handlers ──────────────────────────────────────────
  const openCreate = () => {
    setSelected(null)
    setModalMode("create")
  }

  const openView = (template: ShiftTemplate) => {
    setSelected(template)
    setModalMode("view")
  }

  const openEdit = () => {
    setModalMode("edit")
  }

  const closeModal = () => {
    setModalMode("idle")
    setSelected(null)
  }

  // ── CRUD Handlers ───────────────────────────────────────────
  const handleCreate = async (values: TemplateFormValues) => {
    setIsSaving(true)
    try {
      const created = await createTemplate(values)
      setTemplates((prev) => [...prev, created])
      closeModal()
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (values: TemplateFormValues) => {
    if (!selected) return
    setIsSaving(true)
    try {
      const updated = await updateTemplate(selected.id, values)
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setSelected(updated)
      setModalMode("view")
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
        <div className="relative flex items-center justify-center w-full mb-2 shrink-0 min-h-[3rem]">
          <div className="absolute left-0">
            <BackButton href="/settings" />
          </div>
          <h1 className="text-2xl font-bold text-center">Templates</h1>
          <div className="absolute right-0">
            {hasTemplates && !isLoading && canCreate && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.85, opacity: 0.7 }}
                onClick={openCreate}
                className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors shadow-sm"
                aria-label="Create template"
              >
                Add
              </motion.button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : !hasTemplates ? (
          /* ── Empty state ─────────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="size-16 rounded-full bg-card/80 backdrop-blur-xl border border-border/40 flex items-center justify-center text-muted-foreground shadow-sm">
              <Briefcase className="size-7 stroke-[1.5]" />
            </div>
            <div className="flex flex-col gap-1.5 max-w-xs">
              <p className="text-[17px] font-semibold text-foreground">No templates yet</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Save your regular shifts as templates so you can add them with a single tap.
              </p>
            </div>
            <motion.div whileTap={{ scale: 0.85, opacity: 0.7 }} className="mt-2">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors shadow-sm"
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
                    <span className="text-[15px] font-medium text-foreground truncate">
                      {template.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13px] text-muted-foreground font-medium">
                      {formatDisplayTime(template.start_time, preferences.time_format)} – {formatDisplayTime(template.end_time, preferences.time_format)}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
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
              hourly_rate: preferences.default_hourly_rate || undefined,
              break_duration: preferences.default_break_duration || undefined,
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
                <h2 className="text-lg font-semibold leading-none text-foreground truncate">
                  {selected.name}
                </h2>
              </div>

              {/* Details */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40 gap-4">
                  <span className="text-muted-foreground shrink-0">Workplace</span>
                  <span className="text-foreground font-medium truncate max-w-[60%] text-right">
                    {selected.workplace_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-border/40 gap-4">
                  <span className="text-muted-foreground shrink-0">Location</span>
                  <span className="text-foreground font-medium truncate max-w-[60%] text-right">
                    {selected.workplace_location}
                  </span>
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
                  <span className="text-foreground font-medium">
                    ${Number(selected.hourly_rate).toFixed(2)} / hr
                  </span>
                </div>
                <div className="flex items-center justify-between text-[15px] py-3.5">
                  <span className="text-muted-foreground">Break</span>
                  <span className="text-foreground font-medium">
                    {selected.break_duration} min
                  </span>
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
                <Button onClick={openEdit} disabled={isDeleting}>
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
