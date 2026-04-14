"use client"

import { useState, useEffect } from "react"
import { Sparkles, X, RefreshCw } from "lucide-react"
import { useUIStore } from "@/store/ui"
import { getContacts } from "@/lib/contacts"
import type { AiSuggestion } from "@/lib/types"

export function AiPanel() {
  const { aiPanelOpen, toggleAiPanel } = useUIStore()
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function loadSuggestions() {
    setLoading(true)
    try {
      const contacts = await getContacts()
      if (contacts.length === 0) {
        setSuggestions([])
        setLoaded(true)
        return
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "recommendations",
          contacts: contacts.map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            company: c.company,
            contexts: c.contexts,
            lastInteraction: c.lastInteractionDate,
            daysSinceContact: c.lastInteractionDate
              ? Math.floor((Date.now() - new Date(c.lastInteractionDate).getTime()) / 86400000)
              : null,
            touchpointInterval: c.touchpointIntervalDays,
            tags: c.tags,
          })),
        }),
      })
      const data = await res.json()
      if (data.result) {
        try {
          const parsed = JSON.parse(data.result)
          setSuggestions(Array.isArray(parsed) ? parsed : [])
        } catch {
          setSuggestions([])
        }
      }
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }

  useEffect(() => {
    if (aiPanelOpen && !loaded) {
      loadSuggestions()
    }
  }, [aiPanelOpen, loaded])

  if (!aiPanelOpen) return null

  return (
    <aside className="hidden w-80 flex-col border-l border-bg-subtle bg-bg-surface animate-fade-in lg:flex">
      <div className="flex h-14 items-center justify-between border-b border-bg-subtle px-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <span className="text-sm font-medium text-text-primary">KI-Assistent</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setLoaded(false); loadSuggestions() }}
            className="rounded-button p-1.5 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Aktualisieren"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={toggleAiPanel}
            className="rounded-button p-1.5 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            aria-label="KI-Panel schliessen"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 rounded-card border border-bg-subtle bg-bg-elevated p-3">
          <p className="text-xs italic text-text-secondary">
            Der KI-Assistent analysiert dein Netzwerk und gibt dir persönliche Empfehlungen,
            wen du als Nächstes kontaktieren solltest.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Analysiere Netzwerk...
            </p>
            <div className="animate-pulse space-y-2">
              <div className="h-12 rounded-button bg-bg-elevated" />
              <div className="h-12 rounded-button bg-bg-elevated" />
              <div className="h-12 rounded-button bg-bg-elevated" />
            </div>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Empfehlungen
            </p>
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-card border border-bg-subtle p-3 transition-colors hover:border-accent/30"
              >
                <p className="text-sm font-medium text-text-primary">{s.contactName}</p>
                <p className="mt-1 text-xs text-text-secondary">{s.reason}</p>
                {s.suggestedAction && (
                  <p className="mt-2 text-xs text-accent">{s.suggestedAction}</p>
                )}
              </div>
            ))}
          </div>
        ) : loaded ? (
          <p className="text-sm text-text-muted">
            Keine Empfehlungen verfügbar. Erstelle Kontakte um KI-Vorschläge zu erhalten.
          </p>
        ) : null}
      </div>
    </aside>
  )
}
