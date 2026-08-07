
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center p-4 py-8 sm:py-12 bg-background text-foreground">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
