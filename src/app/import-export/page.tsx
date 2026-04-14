"use client"

import { AppShell } from "@/components/app-shell"
import { ArrowLeftRight } from "lucide-react"

export default function ImportExportPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text-primary">Import / Export</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Kontakte via vCard (.vcf) importieren und exportieren
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-bg-subtle bg-bg-surface py-16">
        <ArrowLeftRight size={48} className="mb-4 text-text-muted" />
        <p className="text-sm text-text-secondary">
          .vcf Datei hierhin ziehen oder klicken zum Auswählen
        </p>
        <p className="mt-1 text-xs text-text-muted">
          iPhone-Kontakte als vCard exportieren und hier importieren
        </p>
      </div>
    </AppShell>
  )
}
