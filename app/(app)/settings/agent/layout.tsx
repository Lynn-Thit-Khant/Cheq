import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Agent Settings",
}

export default function AgentSettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
