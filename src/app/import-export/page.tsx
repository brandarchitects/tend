"use client"

import { useState, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { getContacts, createContact } from "@/lib/contacts"
import { parseVCardFile, convertToContactData, exportToVCard, findDuplicates } from "@/lib/vcard"
import { Upload, Download, FileUp, AlertTriangle } from "lucide-react"

interface ImportPreview {
  firstName: string
  lastName: string
  email?: string
  company?: string
  duplicate: boolean
  selected: boolean
}

export default function ImportExportPage() {
  const { toast } = useToast()
  const [previews, setPreviews] = useState<ImportPreview[]>([])
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".vcf")) {
      toast("Bitte eine .vcf Datei auswählen", "error")
      return
    }

    const text = await file.text()
    const parsed = parseVCardFile(text)

    if (parsed.length === 0) {
      toast("Keine Kontakte in der Datei gefunden", "error")
      return
    }

    const existing = await getContacts()
    const results = findDuplicates(existing, parsed)

    setPreviews(
      results.map((r) => ({
        firstName: r.card.firstName,
        lastName: r.card.lastName,
        email: r.card.email,
        company: r.card.company,
        duplicate: r.duplicate,
        selected: !r.duplicate,
      }))
    )

    toast(`${parsed.length} Kontakte gefunden`, "info")
  }, [toast])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function togglePreview(index: number) {
    setPreviews((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    )
  }

  function toggleAll(selected: boolean) {
    setPreviews((prev) => prev.map((p) => ({ ...p, selected })))
  }

  async function handleImport() {
    const selected = previews.filter((p) => p.selected)
    if (selected.length === 0) {
      toast("Keine Kontakte zum Import ausgewählt", "error")
      return
    }

    setImporting(true)
    let imported = 0

    for (const preview of selected) {
      try {
        const data = convertToContactData({
          firstName: preview.firstName,
          lastName: preview.lastName,
          email: preview.email,
          company: preview.company,
        })
        await createContact(data)
        imported++
      } catch {
        // Continue with next contact
      }
    }

    toast(`${imported} Kontakt${imported !== 1 ? "e" : ""} importiert`, "success")
    setPreviews([])
    setImporting(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const contacts = await getContacts()
      if (contacts.length === 0) {
        toast("Keine Kontakte zum Exportieren vorhanden", "error")
        setExporting(false)
        return
      }

      const vcf = exportToVCard(contacts)
      const blob = new Blob([vcf], { type: "text/vcard" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "nexus-kontakte.vcf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast(`${contacts.length} Kontakte exportiert`, "success")
    } catch {
      toast("Fehler beim Export", "error")
    } finally {
      setExporting(false)
    }
  }

  const selectedCount = previews.filter((p) => p.selected).length
  const duplicateCount = previews.filter((p) => p.duplicate).length

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text-primary">Import / Export</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Kontakte via vCard (.vcf) importieren und exportieren
        </p>
      </div>

      {/* Import Zone */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-accent" />
            <CardTitle className="text-lg">Import</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {previews.length === 0 ? (
            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed py-12 transition-colors ${
                dragOver
                  ? "border-accent bg-accent-subtle"
                  : "border-bg-subtle hover:border-text-muted"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <FileUp size={40} className="mb-3 text-text-muted" />
              <p className="text-sm text-text-secondary">
                .vcf Datei hierhin ziehen oder klicken zum Auswählen
              </p>
              <p className="mt-1 text-xs text-text-muted">
                iPhone: Einstellungen → Kontakte → Alle exportieren
              </p>
              <input
                type="file"
                accept=".vcf"
                className="hidden"
                onChange={handleFileInput}
                aria-label="vCard-Datei auswählen"
              />
            </label>
          ) : (
            <div>
              {/* Summary */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary">
                    {previews.length} Kontakte gefunden, {selectedCount} ausgewählt
                  </span>
                  {duplicateCount > 0 && (
                    <Badge variant="status_yellow">
                      <AlertTriangle size={10} className="mr-1" />
                      {duplicateCount} Duplikate
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
                    Alle
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
                    Keine
                  </Button>
                </div>
              </div>

              {/* Preview table */}
              <div className="max-h-64 overflow-y-auto rounded-card border border-bg-subtle">
                {previews.map((preview, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 border-b border-bg-subtle px-3 py-2 last:border-b-0 ${
                      preview.duplicate ? "bg-status-yellow/5" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={preview.selected}
                      onChange={() => togglePreview(i)}
                      className="accent-accent"
                      aria-label={`${preview.firstName} ${preview.lastName} auswählen`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text-primary">
                        {preview.firstName} {preview.lastName}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {[preview.email, preview.company].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {preview.duplicate && (
                      <Badge variant="status_yellow">Duplikat</Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPreviews([])}>
                  Abbrechen
                </Button>
                <Button onClick={handleImport} disabled={importing || selectedCount === 0}>
                  {importing ? "Importieren..." : `${selectedCount} Kontakte importieren`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download size={16} className="text-accent" />
            <CardTitle className="text-lg">Export</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-text-secondary">
            Exportiere alle Kontakte als vCard-Datei (.vcf). Die Datei kann in iPhone-Kontakte,
            Outlook oder andere Programme importiert werden.
          </p>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download size={14} className="mr-2" />
            {exporting ? "Exportieren..." : "Alle Kontakte exportieren"}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  )
}
