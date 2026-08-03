"use client"

import { AlertTriangle } from "lucide-react"
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalClose,
} from "@/components/motion/center-morph-modal"
import { Button } from "@/components/motion/button/base"

export interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  loadingText?: string
  cancelText?: string
  variant?: "destructive" | "primary"
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Delete",
  loadingText,
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false,
  onConfirm,
}: ConfirmModalProps) {
  const displayLoadingText =
    loadingText ||
    (confirmText === "Delete"
      ? "Deleting…"
      : confirmText === "Sign Out"
      ? "Signing out…"
      : confirmText === "Remove"
      ? "Removing…"
      : `${confirmText}ing…`)

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent
        ariaLabel={title}
        className="w-full max-w-sm bg-card p-6 border-border/50"
      >
        <div className="flex flex-col items-center text-center gap-4">
          {/* Single Alert Icon for all modals */}
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 shrink-0">
            <AlertTriangle className="size-6 stroke-[1.75]" />
          </div>

          {/* Header & Body */}
          <div className="flex flex-col gap-1.5 px-2">
            <h2 className="text-lg font-semibold leading-normal text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>

          {/* Footer Buttons */}
          <div className="mt-2 flex justify-end gap-3 w-full">
            <CenterMorphModalClose>
              <Button
                variant="ghost"
                className="rounded-full h-11 px-5 text-foreground"
                disabled={isLoading}
              >
                {cancelText}
              </Button>
            </CenterMorphModalClose>
            <Button
              variant={variant}
              className="rounded-full h-11 px-5"
              onClick={onConfirm}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? displayLoadingText : confirmText}
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
