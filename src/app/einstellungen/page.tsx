"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EinstellungenPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text-primary">Einstellungen</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Konfiguriere Nexus nach deinen Bedürfnissen
        </p>
      </div>

      <div className="space-y-6">
        {/* Microsoft Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Microsoft-Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Verbinde deinen Outlook-Kalender, um Termine direkt aus Nexus zu buchen.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-status-red" />
              <span className="text-sm text-text-secondary">Nicht verbunden</span>
            </div>
          </CardContent>
        </Card>

        {/* Reminder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">E-Mail-Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Erhalte tägliche E-Mail-Benachrichtigungen wenn Touchpoints fällig werden.
            </p>
          </CardContent>
        </Card>

        {/* Contexts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontexte verwalten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: "Swisscom", color: "var(--ctx-swisscom)" },
                { name: "Brand Architects", color: "var(--ctx-brandarchitects)" },
                { name: "Visari", color: "var(--ctx-visari)" },
                { name: "Privat", color: "var(--ctx-privat)" },
              ].map((ctx) => (
                <div key={ctx.name} className="flex items-center gap-3 rounded-button px-3 py-2">
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
      </div>
    </AppShell>
  )
}
