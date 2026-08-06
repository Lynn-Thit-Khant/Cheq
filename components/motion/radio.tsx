"use client"

import * as React from "react"
import { motion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"

type RadioGroupContextType = {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  name?: string
  layoutId: string
}

const RadioGroupContext = React.createContext<RadioGroupContextType | null>(null)

function useRadioGroup() {
  const context = React.useContext(RadioGroupContext)
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup")
  }
  return context
}

const transition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 28,
}

export interface RadioGroupProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  name?: string
  className?: string
  orientation?: "horizontal" | "vertical"
  children?: React.ReactNode
  id?: string
}

export function RadioGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  disabled,
  name,
  className,
  orientation = "vertical",
  children,
  id,
}: RadioGroupProps) {
  const [value, setValue] = React.useState(defaultValue ?? "")
  const reactId = React.useId()
  const layoutId = id ?? reactId
  const isControlled = valueProp !== undefined
  const currentValue = isControlled ? valueProp : value

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [isControlled, onValueChange]
  )

  const contextValue = React.useMemo(
    () => ({
      value: currentValue,
      onValueChange: handleValueChange,
      disabled,
      name,
      layoutId,
    }),
    [currentValue, handleValueChange, disabled, name, layoutId]
  )

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div
        role="radiogroup"
        data-orientation={orientation}
        className={cn(
          "flex gap-1",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className
        )}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export interface RadioGroupItemProps {
  value: string
  label?: React.ReactNode
  disabled?: boolean
  className?: string
  id?: string
  children?: React.ReactNode
}

export function RadioGroupItem({
  value,
  label,
  disabled: itemDisabled,
  className,
  id: idProp,
  children,
}: RadioGroupItemProps) {
  const { value: groupValue, onValueChange, disabled: groupDisabled, layoutId } = useRadioGroup()
  const isChecked = groupValue === value
  const isDisabled = groupDisabled || itemDisabled

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={isChecked}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={() => {
        if (!isDisabled && onValueChange) {
          onValueChange(value)
        }
      }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      className={cn(
        "flex h-12 w-full items-center justify-between px-4 rounded-full transition-colors cursor-pointer select-none outline-none text-left",
        isChecked
          ? "bg-black/5 dark:bg-white/10 text-foreground font-semibold"
          : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground font-medium",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {label ? (
        <span className="text-[15px]">{label}</span>
      ) : (
        children
      )}

      <div className={cn(
        "relative size-5 rounded-full border-2 transition-colors flex items-center justify-center shrink-0",
        isChecked ? "border-foreground" : "border-muted-foreground/30"
      )}>
        {isChecked && (
          <motion.div
            layoutId={`${layoutId}-indicator`}
            transition={transition}
            className="size-2.5 rounded-full bg-foreground"
          />
        )}
      </div>
    </motion.button>
  )
}
