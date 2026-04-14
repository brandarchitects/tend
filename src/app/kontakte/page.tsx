"use client"

import { AppShell } from "@/components/app-shell"
import { Users } from "lucide-react"

export default function KontaktePage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text-primary">Kontakte</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Verwalte dein professionelles Netzwerk
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-card border border-bg-subtle bg-bg-surface py-16">
        <Users size={48} className="mb-4 text-text-muted" />
        <p className="text-sm text-text-secondary">
          Noch keine Kontakte erfasst
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Importiere Kontakte via vCard oder erstelle sie manuell
        </p>
      </div>
    </AppShell>
  )
}
