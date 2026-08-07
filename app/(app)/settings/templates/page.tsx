"use client"

import { useEffect, useRef, useState } from "react"
import { BackButton } from "@/components/back-button"
import { Briefcase, ChevronRight, Check, Trash2, Plus, Building2, MapPin, Clock, Tag, Coffee } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { ConfirmModal } from "@/components/confirm-modal"
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalClose,
} from "@/components/motion/center-morph-modal"
import { Button } from "@/components/motion/button/base"
import { Loader } from "@/components/motion/loader"
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
import { formatDisplayTime, calculateShiftIncome, calculateShiftDurationHours, formatCurrency } from "@/lib/time-utils"
import { cn } from "@/lib/utils"

function templateToTemplateFormValues(t: ShiftTemplate): TemplateFormValues {
  return {
    name: t.name,
    workplace_name: t.workplace_name,
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
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)

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
      setSingleDeleteConfirmOpen(false)
      closeModal()
    } catch (err) {
      console.error("Failed to delete template:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Select Mode Handlers ────────────────────────────────────
  const enterSelectMode = (templateId: string) => {
    setIsSelectMode(true)
    setSelectedIds(new Set([templateId]))
  }

  const exitSelectMode = () => {
    setIsSelectMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleLongPressStart = (templateId: string) => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      enterSelectMode(templateId)
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleBulkDelete = async () => {
    setIsDeletingBulk(true)
    try {
      await Promise.all([...selectedIds].map((id) => deleteTemplate(id)))
      setTemplates((prev) => prev.filter((t) => !selectedIds.has(t.id)))
      setBulkDeleteConfirmOpen(false)
      exitSelectMode()
    } catch (err) {
      console.error("Failed to bulk delete templates:", err)
    } finally {
      setIsDeletingBulk(false)
    }
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(templates.map((t) => t.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const hasTemplates = templates.length > 0
  const canCreate = templates.length < 5

  return (
    <>
      <div className="flex flex-1 flex-col p-4 pt-6 sm:pt-8 w-full max-w-md mx-auto relative">
        {/* Header */}
        <div className="relative flex items-center justify-between w-full mb-2 shrink-0 min-h-[3rem]">
          <AnimatePresence mode="wait" initial={false}>
            {isSelectMode ? (
              <motion.div
                key="select-toolbar"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative flex items-center w-full"
              >
                {/* Cancel — left */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85, opacity: 0.7 }}
                  onClick={exitSelectMode}
                  className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors focus:outline-none shrink-0 shadow-sm cursor-pointer z-10"
                  aria-label="Cancel selection"
                >
                  Cancel
                </motion.button>

                {/* Select All / Deselect All — centered text button */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.93, opacity: 0.7 }}
                  onClick={selectedIds.size === templates.length ? handleDeselectAll : handleSelectAll}
                  className="absolute inset-0 flex items-center justify-center text-[15px] font-medium text-foreground hover:text-foreground/70 transition-colors focus:outline-none cursor-pointer"
                  aria-label={selectedIds.size === templates.length ? "Deselect all templates" : "Select all templates"}
                >
                  {selectedIds.size === templates.length ? "Deselect All" : "Select All"}
                </motion.button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Delete N — right, destructive */}
                <Button
                  variant={selectedIds.size > 0 ? "destructive" : "secondary"}
                  size="lg"
                  onClick={() => selectedIds.size > 0 && setBulkDeleteConfirmOpen(true)}
                  disabled={selectedIds.size === 0}
                  className={cn(
                    "h-12 px-5 text-[15px] font-medium z-10 shadow-sm rounded-full",
                    selectedIds.size === 0 && "opacity-40 text-muted-foreground/60 cursor-not-allowed bg-card/80 backdrop-blur-xl border border-border"
                  )}
                  aria-label="Delete selected templates"
                >
                  {selectedIds.size > 0 ? `Delete ${selectedIds.size}` : "Delete"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="normal-toolbar"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative flex items-center justify-center w-full min-h-[3rem]"
              >
                <div className="absolute left-0">
                  <BackButton href="/settings" />
                </div>
                <h1 className="text-2xl font-bold text-center">Templates</h1>
                <div className="absolute right-0">
                  {hasTemplates && !isLoading && (
                    canCreate ? (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85, opacity: 0.7 }}
                        onClick={openCreate}
                        className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors shadow-sm"
                        aria-label="Create template"
                      >
                        Add
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85, opacity: 0.7 }}
                        onClick={() => setIsSelectMode(true)}
                        className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors shadow-sm"
                        aria-label="Select templates"
                      >
                        Select
                      </motion.button>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader variant="ascii-braille" size={28} className="text-muted-foreground" />
          </div>
        ) : !hasTemplates ? (
          /* ── Clean Empty state: Title + Text + Content-Fit Button ── */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8 my-auto select-none">
            <div className="flex flex-col gap-1.5 max-w-xs">
              <h3 className="text-[19px] font-semibold text-foreground tracking-tight">
                No templates yet
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Save your regular shifts as templates so you can add them with a single tap.
              </p>
            </div>

            <motion.div whileTap={{ scale: 0.94 }} className="mt-6">
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
              {templates.map((template) => {
                const isSelected = selectedIds.has(template.id)
                return (
                  <SettingsRow
                    key={template.id}
                    onClick={() => {
                      if (isLongPressRef.current) {
                        isLongPressRef.current = false
                        return
                      }
                      if (isSelectMode) {
                        toggleSelect(template.id)
                      } else {
                        openView(template)
                      }
                    }}
                    onPointerDown={() => {
                      if (!isSelectMode) handleLongPressStart(template.id)
                    }}
                    onPointerUp={handleLongPressEnd}
                    onPointerLeave={handleLongPressEnd}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-3 text-left min-w-0 flex-1 pr-4">
                      <AnimatePresence mode="wait" initial={false}>
                        {isSelectMode ? (
                          <motion.div
                            key="checkbox"
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.6, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                              isSelected
                                ? "bg-foreground border-foreground"
                                : "bg-transparent border-border/60"
                            )}
                          >
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                >
                                  <Check className="size-3.5 text-background stroke-[2.5]" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ) : (
                          <div className="w-1 h-5 rounded-full bg-primary/80 shrink-0" />
                        )}
                      </AnimatePresence>
                      <span className="text-[15px] font-medium text-foreground truncate">
                        {template.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[13px] text-muted-foreground font-medium">
                        {formatDisplayTime(template.start_time, preferences.time_format)} – {formatDisplayTime(template.end_time, preferences.time_format)}
                      </span>
                      <AnimatePresence>
                        {!isSelectMode && (
                          <motion.div
                            key="chevron"
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.15 }}
                          >
                            <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </SettingsRow>
                )
              })}
            </SettingsCard>

            {!canCreate && (
              <p className="text-center text-[13px] text-muted-foreground mt-2">
                You've reached the maximum limit of 5 templates.
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
          dismissible={true}
          className="w-full max-w-sm bg-card p-6 border-border/50"
        >
          {selected && (
            <div className="flex flex-col gap-6">
              {/* Header: Template Name & Workplace/Location Subtitle */}
              <div className="flex flex-col gap-2 text-center">
                <h2 className="text-base font-semibold leading-normal text-foreground truncate">
                  {selected.name}
                </h2>
                <p className="text-[13px] text-muted-foreground truncate">
                  {selected.workplace_name}
                </p>
              </div>

              {/* Clean Single Details List (Shift Parameters) */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-foreground font-medium">
                    {formatDisplayTime(selected.start_time, preferences.time_format)}
                    {" – "}
                    {formatDisplayTime(selected.end_time, preferences.time_format)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="text-foreground font-medium">
                    ${Number(selected.hourly_rate).toFixed(2)} / hr
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Break</span>
                  <span className="text-foreground font-medium">
                    {selected.break_duration} min
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Total Worked</span>
                  <span className="text-foreground font-medium">
                    {calculateShiftDurationHours(
                      selected.start_time,
                      selected.end_time,
                      selected.break_duration
                    ).toFixed(2)}{" "}
                    hrs
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-2.5">
                  <span className="text-muted-foreground font-medium">Estimated Income</span>
                  <span className="text-foreground font-semibold text-[15px]">
                    {formatCurrency(
                      calculateShiftIncome(
                        selected.start_time,
                        selected.end_time,
                        selected.hourly_rate,
                        selected.break_duration
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Actions: Delete + Edit (Right-Aligned) */}
              <div className="mt-1 flex justify-end gap-3">
                <Button
                  variant="destructive"
                  onClick={() => setSingleDeleteConfirmOpen(true)}
                  disabled={isDeleting}
                >
                  Delete
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

      {/* ── Single Template Delete Confirm Modal ─────────── */}
      <ConfirmModal
        open={singleDeleteConfirmOpen}
        onOpenChange={setSingleDeleteConfirmOpen}
        title="Delete template?"
        description="This will permanently remove this shift template."
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      {/* ── Bulk Delete Confirm Modal ─────────────────────── */}
      <ConfirmModal
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title={selectedIds.size === 1 ? "Delete 1 template?" : `Delete ${selectedIds.size} templates?`}
        description="This will permanently remove the selected templates."
        confirmText="Delete"
        isLoading={isDeletingBulk}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}
