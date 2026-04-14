"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { TendAIPanel } from "@/components/tend-ai-panel"
import { Sparkles } from "lucide-react"
import { useChatStore } from "@/store/chat"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { isOpen, setOpen } = useChatStore()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg-base">
        <div className="text-text-secondary">Laden...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-[100dvh] bg-bg-base">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — desktop only */}
        <header className="hidden h-14 items-center justify-end border-b border-bg-subtle px-6 lg:flex">
          <button
            onClick={() => setOpen(!isOpen)}
            className={`flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-all duration-150 ${
              isOpen
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "border border-bg-subtle bg-bg-elevated text-text-secondary hover:border-accent/30 hover:text-accent"
            }`}
            aria-label="KI-Assistent öffnen"
          >
            <Sparkles size={16} />
            <span>Tend AI</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "var(--bottom-nav-height, 0px)" }}>
          <div className="mx-auto max-w-[900px] p-4 animate-fade-in md:p-6">
            {children}
          </div>
        </div>
      </main>

      {/* Desktop AI Panel — in layout flow, not overlay */}
      {isOpen && <TendAIPanel />}

      {/* Mobile AI Panel handled inside TendAIPanel (fullscreen overlay) */}

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
