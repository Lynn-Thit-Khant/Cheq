import { BackButton } from "@/components/back-button"

export default function ConnectorsPage() {
  return (
    <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
        <BackButton href="/settings" />
        <h1 className="text-2xl font-bold text-center">Connectors</h1>
        <div />
      </div>

      <div className="flex-1 flex flex-col justify-center w-full pb-24 gap-6">

      <div className="bg-card/80 backdrop-blur-xl shadow-sm rounded-[28px] overflow-hidden border border-border/40 p-6 text-center">
        <p className="text-muted-foreground">Manage integrations with third-party APIs, bank feeds, and external data services here.</p>
      </div>
      </div>
    </div>
  )
}
