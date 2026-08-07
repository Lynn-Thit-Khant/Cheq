
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-start pt-14 pb-8 sm:py-16 sm:justify-center bg-background text-foreground overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col flex-1 sm:flex-initial sm:my-auto">
        {children}
      </div>
    </div>
  )
}
