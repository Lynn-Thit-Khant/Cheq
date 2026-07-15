import { ModeToggle } from "@/components/mode-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
      {/* The Toggle stays locked to the top right across all auth pages */}
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>

      {/* Your specific auth pages (login, signup, etc.) render right here */}
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}
