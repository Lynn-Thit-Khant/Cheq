
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 py-12 sm:py-16 bg-background text-foreground">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
