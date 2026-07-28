"use client"

import { useEffect, useState } from "react"
import { BackButton } from "@/components/back-button"
import { ChevronRight } from "lucide-react"
import { getUserPreferences, updateUserPreferences, UserPreferences } from "./actions"
import { 
  CenterMorphModal, 
  CenterMorphModalContent, 
  CenterMorphModalClose 
} from "@/components/motion/center-morph-modal"
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { Button } from "@/components/motion/button/base"
import { Input } from "@/components/ui/input"
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

  const [timeFormatModal, setTimeFormatModal] = useState(false)
  const [firstDayModal, setFirstDayModal] = useState(false)
  const [hourlyRateModal, setHourlyRateModal] = useState(false)
  const [breakDurationModal, setBreakDurationModal] = useState(false)

  const [tempTimeFormat, setTempTimeFormat] = useState<'12h'|'24h'>('12h')
  const [tempFirstDay, setTempFirstDay] = useState<'Monday'|'Sunday'>('Monday')
  const [tempHourlyRate, setTempHourlyRate] = useState(0)
  const [tempBreakDuration, setTempBreakDuration] = useState(0)

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getUserPreferences().then(data => {
      setPreferences(data)
      setIsLoading(false)
    })
  }, [])

  const handleSaveTimeFormat = async () => {
    setIsSaving(true)
    try {
      await updateUserPreferences({ time_format: tempTimeFormat })
      setPreferences(prev => ({ ...prev, time_format: tempTimeFormat }))
      setTimeFormatModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveFirstDay = async () => {
    setIsSaving(true)
    try {
      await updateUserPreferences({ first_day_of_week: tempFirstDay })
      setPreferences(prev => ({ ...prev, first_day_of_week: tempFirstDay }))
      setFirstDayModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveHourlyRate = async () => {
    setIsSaving(true)
    try {
      await updateUserPreferences({ default_hourly_rate: tempHourlyRate })
      setPreferences(prev => ({ ...prev, default_hourly_rate: tempHourlyRate }))
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
      setBreakDurationModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
        <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
          <BackButton href="/settings" />
          <h1 className="text-2xl font-bold text-center">Defaults</h1>
          <div />
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
             <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-start w-full gap-6 mt-6">
            <div className="bg-card/80 backdrop-blur-xl rounded-[28px] overflow-hidden border border-border/40 p-1 flex flex-col">
              <div 
                onClick={() => {
                  setTempTimeFormat(preferences.time_format)
                  setTimeFormatModal(true)
                }}
                className="flex h-14 w-full items-center justify-between px-4 group transition-colors active:bg-black/10 dark:active:bg-white/10 rounded-[28px] cursor-pointer"
              >
                <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Time Format</span>
                <span className="text-[15px] font-medium text-foreground text-right">{preferences.time_format === '12h' ? '12 hr' : '24 hr'}</span>
              </div>

              <div 
                onClick={() => {
                  setTempFirstDay(preferences.first_day_of_week)
                  setFirstDayModal(true)
                }}
                className="flex h-14 w-full items-center justify-between px-4 group transition-colors active:bg-black/10 dark:active:bg-white/10 rounded-[28px] cursor-pointer"
              >
                <span className="text-[15px] leading-6 text-muted-foreground shrink-0">First Day of Week</span>
                <span className="text-[15px] font-medium text-foreground text-right">{preferences.first_day_of_week}</span>
              </div>
            </div>
              
            <div className="bg-card/80 backdrop-blur-xl rounded-[28px] overflow-hidden border border-border/40 p-1 flex flex-col">
              <div 
                onClick={() => {
                  setTempHourlyRate(preferences.default_hourly_rate)
                  setHourlyRateModal(true)
                }}
                className="flex h-14 w-full items-center justify-between px-4 group transition-colors active:bg-black/10 dark:active:bg-white/10 rounded-[28px] cursor-pointer"
              >
                <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Default Hourly Rate</span>
                <span className="text-[15px] font-medium text-foreground text-right">${preferences.default_hourly_rate.toFixed(2)}</span>
              </div>

              <div 
                onClick={() => {
                  setTempBreakDuration(preferences.default_break_duration)
                  setBreakDurationModal(true)
                }}
                className="flex h-14 w-full items-center justify-between px-4 group transition-colors active:bg-black/10 dark:active:bg-white/10 rounded-[28px] cursor-pointer"
              >
                <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Default Break Duration</span>
                <span className="text-[15px] font-medium text-foreground text-right">{preferences.default_break_duration} min</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Time Format Modal */}
      <CenterMorphModal open={timeFormatModal} onOpenChange={setTimeFormatModal}>
        <CenterMorphModalContent ariaLabel="Edit Time Format" className="w-full max-w-sm bg-card p-6 border-border/50">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Time Format</h2>
              <p className="text-sm text-muted-foreground">Select your preferred time display.</p>
            </div>
            
            <Tabs 
              value={tempTimeFormat} 
              onValueChange={(v) => setTempTimeFormat(v as '12h'|'24h')} 
              variant="pill"
            >
              <TabsList className="w-full bg-black/5 dark:bg-white/5">
                <TabsTrigger value="12h" className="flex-1 py-2">12-Hour</TabsTrigger>
                <TabsTrigger value="24h" className="flex-1 py-2">24-Hour</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-2 flex justify-end gap-3">
              <CenterMorphModalClose>
                <Button variant="ghost" disabled={isSaving}>Cancel</Button>
              </CenterMorphModalClose>
              <Button onClick={handleSaveTimeFormat} isLoading={isSaving} disabled={isSaving}>
                {isSaving ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* First Day Modal */}
      <CenterMorphModal open={firstDayModal} onOpenChange={setFirstDayModal}>
        <CenterMorphModalContent ariaLabel="Edit First Day" className="w-full max-w-sm bg-card p-6 border-border/50">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">First Day of Week</h2>
              <p className="text-sm text-muted-foreground">Choose which day starts your calendar week.</p>
            </div>
            
            <Tabs 
              value={tempFirstDay} 
              onValueChange={(v) => setTempFirstDay(v as 'Monday'|'Sunday')} 
              variant="pill"
            >
              <TabsList className="w-full bg-black/5 dark:bg-white/5">
                <TabsTrigger value="Monday" className="flex-1 py-2">Monday</TabsTrigger>
                <TabsTrigger value="Sunday" className="flex-1 py-2">Sunday</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-2 flex justify-end gap-3">
              <CenterMorphModalClose>
                <Button variant="ghost" disabled={isSaving}>Cancel</Button>
              </CenterMorphModalClose>
              <Button onClick={handleSaveFirstDay} isLoading={isSaving} disabled={isSaving}>
                {isSaving ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* Hourly Rate Modal */}
      <CenterMorphModal open={hourlyRateModal} onOpenChange={setHourlyRateModal}>
        <CenterMorphModalContent ariaLabel="Edit Hourly Rate" className="w-full max-w-sm bg-card p-6 border-border/50">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Default Hourly Rate</h2>
              <p className="text-sm text-muted-foreground">Enter your standard pay rate per hour.</p>
            </div>
            
            <FieldGroup>
              <Field>
                <FieldLabel>Hourly Rate ($)</FieldLabel>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={tempHourlyRate || ''}
                  onChange={(e) => setTempHourlyRate(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-card [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </Field>
            </FieldGroup>

            <div className="mt-2 flex justify-end gap-3">
              <CenterMorphModalClose>
                <Button variant="ghost" disabled={isSaving}>Cancel</Button>
              </CenterMorphModalClose>
              <Button onClick={handleSaveHourlyRate} isLoading={isSaving} disabled={isSaving || tempHourlyRate < 0}>
                {isSaving ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* Break Duration Modal */}
      <CenterMorphModal open={breakDurationModal} onOpenChange={setBreakDurationModal}>
        <CenterMorphModalContent ariaLabel="Edit Break Duration" className="w-full max-w-sm bg-card p-6 border-border/50">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Default Break Duration</h2>
              <p className="text-sm text-muted-foreground">Enter your standard unpaid break time per shift.</p>
            </div>
            
            <FieldGroup>
              <Field>
                <FieldLabel>Break Duration (minutes)</FieldLabel>
                <Input 
                  type="number"
                  min="0"
                  step="1"
                  value={tempBreakDuration || ''}
                  onChange={(e) => setTempBreakDuration(parseInt(e.target.value) || 0)}
                  placeholder="30"
                  className="w-full bg-card [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </Field>
            </FieldGroup>

            <div className="mt-2 flex justify-end gap-3">
              <CenterMorphModalClose>
                <Button variant="ghost" disabled={isSaving}>Cancel</Button>
              </CenterMorphModalClose>
              <Button onClick={handleSaveBreakDuration} isLoading={isSaving} disabled={isSaving || tempBreakDuration < 0}>
                {isSaving ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>
    </>
  )
}
