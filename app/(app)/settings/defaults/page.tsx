"use client"

import { useEffect, useRef, useState } from "react"
import { BackButton } from "@/components/back-button"
import { ChevronRight, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { ConfirmModal } from "@/components/confirm-modal"
import { getUserPreferences, updateUserPreferences, UserPreferences } from "./actions"
import { 
  CenterMorphModal, 
  CenterMorphModalContent, 
  CenterMorphModalClose 
} from "@/components/motion/center-morph-modal"
import {
  MorphPopover,
  MorphPopoverContent,
  MorphPopoverTrigger,
} from "@/components/motion/popover-morph"
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { Button } from "@/components/motion/button/base"
import { Loader } from "@/components/motion/loader"
import { Input } from "@/components/ui/input"
import { SettingsCard } from "@/components/settings-card"
import { PopoverBackdrop } from "@/components/popover-backdrop"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

export default function DefaultsPage() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    time_format: '12h',
    first_day_of_week: 'Monday',
    default_hourly_rate: 0,
    default_break_duration: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const [hourlyRateModal, setHourlyRateModal] = useState(false)
  const [breakDurationModal, setBreakDurationModal] = useState(false)

  const [timeFormatOpen, setTimeFormatOpen] = useState(false)
  const [firstDayOpen, setFirstDayOpen] = useState(false)

  const [tempHourlyRate, setTempHourlyRate] = useState(0)
  const [tempBreakDuration, setTempBreakDuration] = useState(0)

  const [isSaving, setIsSaving] = useState(false)

  // Ref to suppress popover reopening after a successful save
  const justSavedRef = useRef(false)

  const [ratePopoverOpen, setRatePopoverOpen] = useState(false)
  const [breakPopoverOpen, setBreakPopoverOpen] = useState(false)

  const [removeRateConfirmOpen, setRemoveRateConfirmOpen] = useState(false)
  const [removeBreakConfirmOpen, setRemoveBreakConfirmOpen] = useState(false)

  const anyOpen = timeFormatOpen || firstDayOpen || ratePopoverOpen || breakPopoverOpen;
  const [backdropActive, setBackdropActive] = useState(false);

  useEffect(() => {
    if (anyOpen) {
      setBackdropActive(true);
    } else {
      const timer = setTimeout(() => {
        setBackdropActive(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [anyOpen]);

  useEffect(() => {
    getUserPreferences().then(data => {
      setPreferences(data)
      setIsLoading(false)
    })
  }, [])

  const handleAutoSaveTimeFormat = async (v: '12h'|'24h') => {
    setPreferences(prev => ({ ...prev, time_format: v }))
    await updateUserPreferences({ time_format: v })
  }

  const handleAutoSaveFirstDay = async (v: 'Monday'|'Sunday') => {
    setPreferences(prev => ({ ...prev, first_day_of_week: v }))
    await updateUserPreferences({ first_day_of_week: v })
  }

  const handleSaveHourlyRate = async () => {
    setIsSaving(true)
    try {
      await updateUserPreferences({ default_hourly_rate: tempHourlyRate })
      setPreferences(prev => ({ ...prev, default_hourly_rate: tempHourlyRate }))
      justSavedRef.current = true
      setHourlyRateModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBreakDuration = async () => {
    setIsSaving(true)
    try {
      await updateUserPreferences({ default_break_duration: tempBreakDuration })
      setPreferences(prev => ({ ...prev, default_break_duration: tempBreakDuration }))
      justSavedRef.current = true
      setBreakDurationModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveHourlyRate = async () => {
    setIsSaving(true)
    try {
      await updateUserPreferences({ default_hourly_rate: 0 })
      setPreferences(prev => ({ ...prev, default_hourly_rate: 0 }))
      setRatePopoverOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveBreakDuration = async () => {
    setIsSaving(true)
    try {
      await updateUserPreferences({ default_break_duration: 0 })
      setPreferences(prev => ({ ...prev, default_break_duration: 0 }))
      setBreakPopoverOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <PopoverBackdrop 
        isVisible={anyOpen}
        isActive={backdropActive}
        onDismiss={() => {
          setTimeFormatOpen(false); 
          setFirstDayOpen(false);
          setRatePopoverOpen(false);
          setBreakPopoverOpen(false);
        }}
      />

      <div className="flex flex-1 flex-col p-4 pt-6 sm:pt-8 w-full max-w-md mx-auto relative">
        <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
          <BackButton href="/settings" />
          <h1 className="text-2xl font-bold text-center">Defaults</h1>
          <div />
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader variant="ascii-braille" size={28} className="text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-start w-full gap-6 mt-6">
            <SettingsCard>
              <MorphPopover open={timeFormatOpen} onOpenChange={setTimeFormatOpen}>
                <MorphPopoverTrigger>
                  <button type="button" className={`flex h-14 w-full items-center justify-between px-6 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[28px] outline-none ${timeFormatOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}>
                    <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Time Format</span>
                    <span className="text-[15px] font-medium text-foreground text-right">{preferences.time_format === '12h' ? '12-Hour' : '24-Hour'}</span>
                  </button>
                </MorphPopoverTrigger>
                <MorphPopoverContent align="end" sideOffset={0} radius={999} unstyled className="w-auto p-4 -mr-4">
                  <Tabs 
                    id="time-format-tabs"
                    value={preferences.time_format} 
                    onValueChange={(v) => handleAutoSaveTimeFormat(v as '12h'|'24h')} 
                    variant="pill"
                  >
                    <TabsList className="bg-card/90 backdrop-blur-xl border border-border/50 p-1 rounded-full h-12 shadow-2xl">
                      <TabsTrigger value="12h" className="px-5 h-full text-[14px] rounded-full" indicatorClassName="bg-black/10 dark:bg-white/10">12-Hour</TabsTrigger>
                      <TabsTrigger value="24h" className="px-5 h-full text-[14px] rounded-full" indicatorClassName="bg-black/10 dark:bg-white/10">24-Hour</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </MorphPopoverContent>
              </MorphPopover>

              <MorphPopover open={firstDayOpen} onOpenChange={setFirstDayOpen}>
                <MorphPopoverTrigger>
                  <button type="button" className={`flex h-14 w-full items-center justify-between px-6 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[28px] outline-none ${firstDayOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}>
                    <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Start of Week</span>
                    <span className="text-[15px] font-medium text-foreground text-right">{preferences.first_day_of_week}</span>
                  </button>
                </MorphPopoverTrigger>
                <MorphPopoverContent align="end" sideOffset={0} radius={999} unstyled className="w-auto p-4 -mr-4">
                  <Tabs 
                    id="first-day-tabs"
                    value={preferences.first_day_of_week} 
                    onValueChange={(v) => handleAutoSaveFirstDay(v as 'Monday'|'Sunday')} 
                    variant="pill"
                  >
                    <TabsList className="bg-card/90 backdrop-blur-xl border border-border/50 p-1 rounded-full h-12 shadow-2xl">
                      <TabsTrigger value="Monday" className="px-5 h-full text-[14px] rounded-full" indicatorClassName="bg-black/10 dark:bg-white/10">Monday</TabsTrigger>
                      <TabsTrigger value="Sunday" className="px-5 h-full text-[14px] rounded-full" indicatorClassName="bg-black/10 dark:bg-white/10">Sunday</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </MorphPopoverContent>
              </MorphPopover>
            </SettingsCard>
              
            <SettingsCard>
              <MorphPopover open={ratePopoverOpen} onOpenChange={setRatePopoverOpen}>
                <MorphPopoverTrigger>
                  <button 
                    type="button" 
                    className={`flex w-full items-center justify-between h-14 px-6 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[28px] outline-none ${ratePopoverOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}
                  >
                    <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Default Hourly Rate</span>
                    {preferences.default_hourly_rate > 0 ? (
                      <span className="text-[15px] font-medium text-foreground text-right">${preferences.default_hourly_rate.toFixed(2)}</span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground/60">Not setup</span>
                    )}
                  </button>
                </MorphPopoverTrigger>
                <MorphPopoverContent align="end" sideOffset={0} radius={999} unstyled className="w-auto p-4 -mr-4">
                  <div className={cn(
                    "bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden flex flex-col",
                    preferences.default_hourly_rate > 0 ? "rounded-[32px] p-1.5 gap-0.5" : "rounded-full"
                  )}>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        setTempHourlyRate(preferences.default_hourly_rate)
                        setRatePopoverOpen(false)
                        setHourlyRateModal(true)
                      }}
                      className={cn(
                        "w-full justify-start font-medium text-foreground h-12 text-[15px]",
                        preferences.default_hourly_rate > 0 ? "rounded-[26px]" : ""
                      )}
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      {preferences.default_hourly_rate > 0 ? "Edit Rate" : "Set Default Rate"}
                    </Button>
                    {preferences.default_hourly_rate > 0 && (
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                          setRatePopoverOpen(false)
                          setRemoveRateConfirmOpen(true)
                        }}
                        disabled={isSaving}
                        className="w-full justify-start font-medium text-destructive hover:text-destructive hover:bg-destructive/10 rounded-[26px] h-12 text-[15px]"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        Clear Rate
                      </Button>
                    )}
                  </div>
                </MorphPopoverContent>
              </MorphPopover>

              <MorphPopover open={breakPopoverOpen} onOpenChange={setBreakPopoverOpen}>
                <MorphPopoverTrigger>
                  <button 
                    type="button" 
                    className={`flex w-full items-center justify-between h-14 px-6 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[28px] outline-none ${breakPopoverOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}
                  >
                    <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Default Break Duration</span>
                    {preferences.default_break_duration > 0 ? (
                      <span className="text-[15px] font-medium text-foreground text-right">{preferences.default_break_duration} min</span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground/60">Not setup</span>
                    )}
                  </button>
                </MorphPopoverTrigger>
                <MorphPopoverContent align="end" sideOffset={0} radius={999} unstyled className="w-auto p-4 -mr-4">
                  <div className={cn(
                    "bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden flex flex-col",
                    preferences.default_break_duration > 0 ? "rounded-[32px] p-1.5 gap-0.5" : "rounded-full"
                  )}>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        setTempBreakDuration(preferences.default_break_duration)
                        setBreakPopoverOpen(false)
                        setBreakDurationModal(true)
                      }}
                      className={cn(
                        "w-full justify-start font-medium text-foreground h-12 text-[15px]",
                        preferences.default_break_duration > 0 ? "rounded-[26px]" : ""
                      )}
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      {preferences.default_break_duration > 0 ? "Edit Break" : "Set Default Break"}
                    </Button>
                    {preferences.default_break_duration > 0 && (
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                          setBreakPopoverOpen(false)
                          setRemoveBreakConfirmOpen(true)
                        }}
                        disabled={isSaving}
                        className="w-full justify-start font-medium text-destructive hover:text-destructive hover:bg-destructive/10 rounded-[26px] h-12 text-[15px]"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        Clear Break
                      </Button>
                    )}
                  </div>
                </MorphPopoverContent>
              </MorphPopover>
            </SettingsCard>
          </div>
        )}
      </div>

      {/* Hourly Rate Modal */}
      <CenterMorphModal 
        open={hourlyRateModal} 
        onOpenChange={(open) => {
          setHourlyRateModal(open);
          if (!open) {
            if (justSavedRef.current) {
              justSavedRef.current = false
            } else {
              setRatePopoverOpen(true)
            }
          }
        }}
      >
        <CenterMorphModalContent ariaLabel="Edit Hourly Rate" className="w-full max-w-sm bg-card p-6 border-border/50">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">Set Default Rate</h2>
              <p className="text-sm text-muted-foreground">Automatically fills the hourly rate on new shifts.</p>
            </div>
            
            <FieldGroup>
              <Field>
                <FieldLabel>Hourly Rate ($)</FieldLabel>
                <Input 
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={tempHourlyRate !== undefined && tempHourlyRate !== null ? tempHourlyRate : ''}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') {
                      setTempHourlyRate('' as unknown as number)
                    } else {
                      const num = parseFloat(val)
                      setTempHourlyRate(isNaN(num) ? ('' as unknown as number) : num)
                    }
                  }}
                  placeholder="0.00"
                  className="w-full bg-card rounded-full h-12 px-5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </Field>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3 pt-2 w-full">
              <CenterMorphModalClose>
                <Button type="button" variant="outline" disabled={isSaving} className="h-11 rounded-full text-sm font-medium w-full border-border/60 cursor-pointer">
                  Cancel
                </Button>
              </CenterMorphModalClose>
              <Button onClick={handleSaveHourlyRate} isLoading={isSaving} disabled={isSaving || (typeof tempHourlyRate === 'number' && tempHourlyRate < 0)} className="h-11 rounded-full text-sm font-medium w-full cursor-pointer">
                {isSaving ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* Break Duration Modal */}
      <CenterMorphModal 
        open={breakDurationModal} 
        onOpenChange={(open) => {
          setBreakDurationModal(open);
          if (!open) {
            if (justSavedRef.current) {
              justSavedRef.current = false
            } else {
              setBreakPopoverOpen(true)
            }
          }
        }}
      >
        <CenterMorphModalContent ariaLabel="Edit Break Duration" className="w-full max-w-sm bg-card p-6 border-border/50">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-base font-semibold leading-normal text-foreground">Set Default Break</h2>
              <p className="text-sm text-muted-foreground">Automatically fills the break time on new shifts.</p>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel>Break Duration (minutes)</FieldLabel>
                <Input 
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  step="1"
                  value={tempBreakDuration !== undefined && tempBreakDuration !== null ? tempBreakDuration : ''}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') {
                      setTempBreakDuration('' as unknown as number)
                    } else {
                      const num = parseInt(val, 10)
                      setTempBreakDuration(isNaN(num) ? ('' as unknown as number) : num)
                    }
                  }}
                  placeholder="30"
                  className="w-full bg-card rounded-full h-12 px-5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </Field>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3 pt-2 w-full">
              <CenterMorphModalClose>
                <Button type="button" variant="outline" disabled={isSaving} className="h-11 rounded-full text-sm font-medium w-full border-border/60 cursor-pointer">
                  Cancel
                </Button>
              </CenterMorphModalClose>
              <Button onClick={handleSaveBreakDuration} isLoading={isSaving} disabled={isSaving || (typeof tempBreakDuration === 'number' && tempBreakDuration < 0)} className="h-11 rounded-full text-sm font-medium w-full cursor-pointer">
                {isSaving ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* Remove Rate Confirm Modal */}
      <ConfirmModal
        open={removeRateConfirmOpen}
        onOpenChange={setRemoveRateConfirmOpen}
        title="Clear default rate?"
        description="New shifts will start with an empty rate ($0.00)."
        confirmText="Clear"
        isLoading={isSaving}
        onConfirm={async () => {
          await handleRemoveHourlyRate()
          setRemoveRateConfirmOpen(false)
        }}
      />

      {/* Remove Break Confirm Modal */}
      <ConfirmModal
        open={removeBreakConfirmOpen}
        onOpenChange={setRemoveBreakConfirmOpen}
        title="Clear default break?"
        description="New shifts will start with no break duration."
        confirmText="Clear"
        isLoading={isSaving}
        onConfirm={async () => {
          await handleRemoveBreakDuration()
          setRemoveBreakConfirmOpen(false)
        }}
      />
    </>
  )
}
