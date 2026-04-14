"use client"

import { Sparkles, X } from "lucide-react"
import { useUIStore } from "@/store/ui"
import { cn } from "@/lib/utils"

export function AiPanel() {
  const { aiPanelOpen, toggleAiPanel } = useUIStore()

  if (!aiPanelOpen) return null

  return (
    <aside
      className={cn(
        "flex h-screen w-80 flex-col border-l border-bg-subtle bg-bg-surface animate-fade-in"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-bg-subtle px-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <span className="text-sm font-medium text-text-primary">KI-Assistent</span>
        </div>
        <button
          onClick={toggleAiPanel}
          className="rounded-button p-1.5 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
          aria-label="KI-Panel schliessen"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-card border border-bg-subtle bg-bg-elevated p-4">
          <p className="text-sm italic text-text-secondary">
            Der KI-Assistent analysiert dein Netzwerk und gibt dir persönliche Empfehlungen,
            wen du als Nächstes kontaktieren solltest.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Empfehlungen werden geladen...
          </p>
        </div>
      </div>
    </aside>
  )
}
