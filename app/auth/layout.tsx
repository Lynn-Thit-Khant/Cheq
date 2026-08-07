
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center px-4 py-12 sm:py-16 bg-background text-foreground overflow-y-auto">
      <div className="w-full max-w-sm my-auto">
        {children}
      </div>
    </div>
  )
}
