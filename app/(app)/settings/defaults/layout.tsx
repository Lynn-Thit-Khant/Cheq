import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Defaults",
}

export default function DefaultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
