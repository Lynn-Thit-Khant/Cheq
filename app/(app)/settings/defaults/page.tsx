import { BackButton } from "@/components/back-button"

export default function DefaultsPage() {
  return (
    <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
        <BackButton href="/settings" />
        <h1 className="text-2xl font-bold text-center">Defaults</h1>
        <div />
      </div>

      <div className="flex-1 flex flex-col justify-start w-full pb-24 gap-6 mt-6">

        <div className="bg-card/80 backdrop-blur-xl rounded-[28px] overflow-hidden border border-border/40 p-1">
          <div className="px-5 py-6 text-center">
            <p className="text-[15px] text-muted-foreground">Manage default currency, tax rates, payment terms, and automated reminders here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
