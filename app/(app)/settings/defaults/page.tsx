import { BackButton } from "@/components/back-button"
import { ChevronRight } from "lucide-react"

export default function DefaultsPage() {
  return (
    <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
        <BackButton href="/settings" />
        <h1 className="text-2xl font-bold text-center">Defaults</h1>
        <div />
      </div>
      <div className="flex-1 flex flex-col justify-start w-full gap-6 mt-6">
        <div className="bg-card/80 backdrop-blur-xl rounded-[28px] overflow-hidden border border-border/40 p-1 flex flex-col">
          <div className="flex h-14 w-full items-center justify-between px-4 group transition-colors active:bg-black/10 dark:active:bg-white/10 rounded-[24px] cursor-pointer">
            <span className="text-[15px] font-medium text-foreground">Time Format</span>
            <ChevronRight className="size-4 text-muted-foreground transition-colors" />
          </div>

          <div className="flex h-14 w-full items-center justify-between px-4 group transition-colors active:bg-black/10 dark:active:bg-white/10 rounded-[24px] cursor-pointer">
            <span className="text-[15px] font-medium text-foreground">First Day of Week</span>
            <ChevronRight className="size-4 text-muted-foreground transition-colors" />
          </div>
        </div>
          
        <div className="bg-card/80 backdrop-blur-xl rounded-[28px] overflow-hidden border border-border/40 p-1 flex flex-col">
          <div className="flex h-14 w-full items-center justify-between px-4 group transition-colors active:bg-black/10 dark:active:bg-white/10 rounded-[24px] cursor-pointer">
            <span className="text-[15px] font-medium text-foreground">Standard Hourly Rate</span>
            <ChevronRight className="size-4 text-muted-foreground transition-colors" />
          </div>

          <div className="flex h-14 w-full items-center justify-between px-4 group transition-colors active:bg-black/10 dark:active:bg-white/10 rounded-[24px] cursor-pointer">
            <span className="text-[15px] font-medium text-foreground">Default Break Duration</span>
            <ChevronRight className="size-4 text-muted-foreground transition-colors" />
          </div>
        </div>

      </div>
    </div>
  )
}
