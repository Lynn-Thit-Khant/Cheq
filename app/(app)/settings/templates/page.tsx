import { BackButton } from "@/components/back-button"

export default function TemplatesPage() {
  return (
    <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
        <BackButton href="/settings" />
        <h1 className="text-2xl font-bold text-center">Templates</h1>
        <div />
      </div>

      <div className="flex-1 flex flex-col justify-start w-full gap-6 mt-6">

      <div className="bg-card/80 backdrop-blur-xl rounded-[28px] overflow-hidden border border-border/40 p-6 text-center">
        <p className="text-muted-foreground">Configure default document templates, invoice presets, and custom themes here.</p>
      </div>
      </div>
    </div>
  )
}
