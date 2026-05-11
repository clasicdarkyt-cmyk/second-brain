import { AppTopNav } from "@/components/layout/AppTopNav"
import { AIChatPanel } from "@/components/layout/AIChatPanel"
import { GreetingLoader } from "@/components/layout/GreetingLoader"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopNav />
      <main className="flex-1 overflow-auto pt-14">
        {children}
      </main>
      <AIChatPanel />
      <GreetingLoader />
    </div>
  )
}
