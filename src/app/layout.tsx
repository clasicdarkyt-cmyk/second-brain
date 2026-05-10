import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { AIChatPanel } from "@/components/layout/AIChatPanel"
import { GreetingLoader } from "@/components/layout/GreetingLoader"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Second Brain",
  description: "Tu hub personal de productividad y conocimiento",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <AIChatPanel />
          <GreetingLoader />
        </div>
      </body>
    </html>
  )
}
