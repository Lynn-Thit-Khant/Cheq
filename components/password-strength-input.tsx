'use client'

import React, { useState, useMemo } from 'react'
import { Eye, EyeOff, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from "motion/react"

interface PasswordCriteria {
  label: string
  test: (password: string) => boolean
}

export const passwordCriteria: PasswordCriteria[] = [
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character (e.g. !?<>@#$%)', test: (p) => /[^A-Za-z0-9]/.test(p) },
  { label: '8 characters or more', test: (p) => p.length >= 8 },
]

interface PasswordStrengthInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  showStrengthIndicator?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const PasswordStrengthInput = React.forwardRef<HTMLInputElement, PasswordStrengthInputProps>(
  ({ id, name, value = '', onChange, onBlur, onFocus, placeholder, required, showStrengthIndicator = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const stringValue = String(value)

    const results = useMemo(
      () => passwordCriteria.map((c) => ({ ...c, met: c.test(stringValue) })),
      [stringValue]
    )

    const allMet = results.every((r) => r.met)

    return (
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            name={name}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              onBlur?.(e)
            }}
            className="pr-10"
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>

        {/* Show the checklist when focused or when there's input */}
        <AnimatePresence>
          {showStrengthIndicator && (isFocused || stringValue.length > 0) && (
            <motion.ul
              initial={{ opacity: 0, y: -10, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="flex flex-col gap-1.5 text-sm"
            >
              {results.map((r) => (
                <li key={r.label} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                      r.met
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40'
                    )}
                  >
                    {r.met && <Check className="size-2.5" strokeWidth={3} />}
                  </span>
                  <span
                    className={cn(
                      'transition-colors',
                      r.met ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {r.label}
                  </span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* Hidden native input to communicate validity to the form */}
        {showStrengthIndicator && (
          <input
            type="hidden"
            name={`${id}-strength`}
            value={allMet ? 'valid' : ''}
            required={required}
          />
        )}
      </div>
    )
  }
)
PasswordStrengthInput.displayName = 'PasswordStrengthInput'



export function validatePassword(password: string) {
  return passwordCriteria.every((c) => c.test(password))
}
