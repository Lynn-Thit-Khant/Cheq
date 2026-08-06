import { BackButton } from "@/components/back-button"
import { SettingsCard } from "@/components/settings-card"

export default function ConnectorsPage() {
  return (
    <div className="flex flex-1 flex-col p-4 pt-6 sm:pt-8 w-full max-w-md mx-auto relative">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
        <BackButton href="/settings" />
        <h1 className="text-2xl font-bold text-center">Connectors</h1>
        <div />
      </div>

      <div className="flex-1 flex flex-col justify-start w-full gap-6 mt-6">
        <SettingsCard>
          <div className="flex flex-col items-center justify-center text-center p-6 gap-2 select-none">
            <h3 className="text-[17px] font-semibold text-foreground tracking-tight">
              Connectors Coming Soon
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Integrations with bank feeds, external calendar apps, and payroll software will appear here.
            </p>
          </div>
        </SettingsCard>
      </div>
    </div>
  )
}
