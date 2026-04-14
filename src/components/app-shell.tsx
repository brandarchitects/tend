"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AiPanel } from "@/components/ai-panel"
import { Sparkles, Menu } from "lucide-react"
import { useUIStore } from "@/store/ui"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { aiPanelOpen, toggleAiPanel } = useUIStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="text-text-secondary">Laden...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-bg-base">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 h-full w-60">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-bg-subtle px-4 md:justify-end md:px-6">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-button p-1.5 text-text-secondary hover:bg-bg-elevated hover:text-text-primary md:hidden"
            aria-label="Menü öffnen"
          >
            <Menu size={20} />
          </button>

          <button
            onClick={toggleAiPanel}
            className={`flex items-center gap-2 rounded-button px-3 py-1.5 text-sm transition-colors duration-100 ${
              aiPanelOpen
                ? "bg-accent-subtle text-accent"
                : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            }`}
            aria-label="KI-Assistent öffnen"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">KI-Assistent</span>
          </button>
        </header>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[900px] p-4 animate-fade-in md:p-6">
              {children}
            </div>
          </div>
          <AiPanel />
        </div>
      </main>
    </div>
  )
}
