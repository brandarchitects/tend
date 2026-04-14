"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { getStrategy, saveStrategy } from "@/lib/strategy"
import { ExternalLink, Upload, FileText, Check, RefreshCw } from "lucide-react"

export default function EinstellungenPage() {
  return (
    <Suspense>
      <EinstellungenContent />
    </Suspense>
  )
}

function EinstellungenContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [strategyInfo, setStrategyInfo] = useState<{
    filename: string
    uploadedAt: string
    characters: number
  } | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    if (success === "outlook_connected") {
      toast("Microsoft-Account erfolgreich verbunden", "success")
    }
    if (error) {
      toast("Fehler bei der Microsoft-Verbindung", "error")
    }
  }, [searchParams, toast])

  const loadStrategy = useCallback(async () => {
    try {
      const data = await getStrategy()
      if (data) {
        setStrategyInfo({
          filename: data.filename,
          uploadedAt: data.uploadedAt,
          characters: data.characters,
        })
      }
    } catch {
      // No strategy yet
    }
  }, [])

  useEffect(() => { loadStrategy() }, [loadStrategy])

  async function handleStrategyUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".docx")) {
      toast("Nur .docx Dateien werden unterstützt", "error")
      return
    }

    setUploading(true)
    try {
      // Send file to API for text extraction
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/strategy", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Save extracted text to Firestore
      const now = new Date().toISOString()
      await saveStrategy({
        content: data.text,
        filename: data.filename,
        uploadedAt: now,
        characters: data.characters,
      })

      setStrategyInfo({
        filename: data.filename,
        uploadedAt: now,
        characters: data.characters,
      })

      toast("Netzwerkstrategie aktualisiert", "success")
    } catch (err) {
      console.error("Upload Fehler:", err)
      toast("Fehler beim Hochladen der Strategie", "error")
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text-primary">Einstellungen</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Konfiguriere Tend nach deinen Bedürfnissen
        </p>
      </div>

      <div className="space-y-6">
        {/* Strategy Upload */}
        <Card className="border-l-[3px] border-l-accent">
          <CardHeader>
            <CardTitle className="text-lg">Netzwerkstrategie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-text-secondary">
              Lade deine Netzwerkstrategie als .docx Datei hoch. Der KI-Assistent nutzt
              sie als Kontext für personalisierte Empfehlungen. Du kannst jederzeit eine
              neue Version hochladen.
            </p>

            {strategyInfo && (
              <div className="mb-4 flex items-start gap-3 rounded-card bg-bg-elevated p-3">
                <FileText size={16} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{strategyInfo.filename}</p>
                  <p className="text-xs text-text-muted">
                    {strategyInfo.characters.toLocaleString("de-CH")} Zeichen ·
                    Hochgeladen am{" "}
                    {new Date(strategyInfo.uploadedAt).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Check size={14} className="shrink-0 text-status-green" />
              </div>
            )}

            <label>
              <span className={`inline-flex cursor-pointer items-center gap-2 rounded-button px-4 py-2 text-sm font-medium transition-colors ${
                strategyInfo
                  ? "border border-bg-subtle text-text-primary hover:bg-bg-elevated"
                  : "bg-accent text-white hover:bg-accent-hover"
              } ${uploading ? "pointer-events-none opacity-50" : ""}`}>
                {uploading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploading
                  ? "Verarbeiten..."
                  : strategyInfo
                  ? "Neue Version hochladen"
                  : "Strategie hochladen"}
              </span>
              <input
                type="file"
                accept=".docx"
                className="hidden"
                onChange={handleStrategyUpload}
                disabled={uploading}
                aria-label="Strategie-Datei auswählen"
              />
            </label>
          </CardContent>
        </Card>

        {/* Microsoft Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Microsoft-Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-text-secondary">
              Verbinde deinen Outlook-Kalender, um Termine direkt aus Tend zu buchen.
            </p>
            <Button
              variant="outline"
              onClick={() => { window.location.href = "/api/outlook/auth" }}
            >
              <ExternalLink size={14} className="mr-2" />
              Mit Microsoft verbinden
            </Button>
          </CardContent>
        </Card>

        {/* Reminder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">E-Mail-Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Du erhältst täglich eine E-Mail wenn Touchpoints fällig werden.
              Der Reminder wird automatisch über Vercel Cron ausgelöst.
            </p>
            <div className="mt-3 rounded-button bg-bg-elevated px-3 py-2">
              <p className="font-mono text-xs text-text-muted">
                Cron-Schedule: Täglich um 08:00 UTC
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contexts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontexte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-text-secondary">
              Deine aktiven Business-Kontexte für die Kontakt-Kategorisierung.
            </p>
            <div className="space-y-2">
              {[
                { name: "Swisscom", color: "var(--ctx-swisscom)" },
                { name: "Brand Architects", color: "var(--ctx-brandarchitects)" },
                { name: "Visari", color: "var(--ctx-visari)" },
                { name: "Privat", color: "var(--ctx-privat)" },
              ].map((ctx) => (
                <div key={ctx.name} className="flex items-center gap-3 rounded-button px-3 py-2 hover:bg-bg-elevated">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: ctx.color }}
                  />
                  <span className="text-sm text-text-primary">{ctx.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Integrationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: "Firebase", desc: "Datenbank & Authentifizierung" },
                { name: "Claude KI", desc: "Netzwerk-Empfehlungen & Chat" },
                { name: "Resend", desc: "E-Mail-Benachrichtigungen" },
                { name: "Microsoft Graph", desc: "Outlook-Kalender" },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between rounded-button px-3 py-2">
                  <div>
                    <p className="text-sm text-text-primary">{integration.name}</p>
                    <p className="text-xs text-text-muted">{integration.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
