"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { ExternalLink } from "lucide-react"

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

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text-primary">Einstellungen</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Konfiguriere Tend nach deinen Bedürfnissen
        </p>
      </div>

      <div className="space-y-6">
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

        {/* API Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Integrationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: "Firebase", desc: "Datenbank & Authentifizierung" },
                { name: "Claude KI", desc: "Netzwerk-Empfehlungen" },
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
