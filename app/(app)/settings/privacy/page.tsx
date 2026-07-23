import { ChevronRight } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { SharedLayoutBg } from "@/components/motion/shared-layout-bg"

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full relative">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
        <BackButton href="/settings" />
        <h1 className="text-2xl font-bold text-center">Privacy</h1>
        <div />
      </div>

      <div className="flex-1 flex flex-col justify-start w-full mt-6">

      <div className="flex flex-col gap-4 w-full">
        <div className="bg-card/80 backdrop-blur-xl rounded-[28px] overflow-hidden border border-border/40">
          <SharedLayoutBg pillClassName="bg-black/5 dark:bg-white/5 rounded-[24px]">
            <button className="flex min-h-[54px] w-full items-center justify-between px-5 py-2 group">
              <span className="text-[15px] font-medium text-foreground">Change password</span>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </button>

            <button className="flex min-h-[54px] w-full items-center justify-between px-5 py-2 group">
              <span className="text-[15px] font-medium text-foreground">Multi factor authenticator (MFA)</span>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </button>

            <button className="flex min-h-[54px] w-full items-center justify-between px-5 py-2 group">
              <span className="text-[15px] font-medium text-foreground">Passkey</span>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </button>
          </SharedLayoutBg>
        </div>
        </div>
      </div>
    </div>
  )
}
