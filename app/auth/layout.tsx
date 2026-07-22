
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-50 dark:bg-black text-foreground">
      {/* Your specific auth pages (login, signup, etc.) render right here */}
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}
