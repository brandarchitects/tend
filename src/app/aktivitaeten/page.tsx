"use client"

import { AppShell } from "@/components/app-shell"
import { Activity } from "lucide-react"

export default function AktivitaetenPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text-primary">Aktivitäten</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Chronologischer Überblick aller Interaktionen
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-card border border-bg-subtle bg-bg-surface py-16">
        <Activity size={48} className="mb-4 text-text-muted" />
        <p className="text-sm text-text-secondary">
          Noch keine Aktivitäten vorhanden
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Interaktionen werden hier chronologisch aufgelistet
        </p>
      </div>
    </AppShell>
  )
}
