import { WifiOff } from 'lucide-react'

export const metadata = { title: 'Offline' }

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 p-8">
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[28px] border border-border/40 pointer-events-none shadow-sm" />
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <WifiOff className="size-5 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">You&apos;re Offline</h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Cheq needs an internet connection to sync your shifts.
            Please reconnect and try again.
          </p>
        </div>
      </div>
    </div>
  )
}
