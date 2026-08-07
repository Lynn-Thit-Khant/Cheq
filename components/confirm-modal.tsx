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
      ? "Deleting"
      : confirmText === "Sign Out"
      ? "Signing out"
      : confirmText === "Remove"
      ? "Removing"
      : `${confirmText}ing`)

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
            <h2 className="text-base font-semibold leading-normal text-foreground">{title}</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{description}</p>
          </div>

          {/* Footer Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2 w-full">
            <CenterMorphModalClose>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full text-sm font-medium w-full border-border/60 cursor-pointer"
                disabled={isLoading}
              >
                {cancelText}
              </Button>
            </CenterMorphModalClose>
            <Button
              type="button"
              variant={variant}
              className="h-11 rounded-full text-sm font-medium w-full cursor-pointer"
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
