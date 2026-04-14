"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Clock, Coffee, Mail, Phone, Link } from "lucide-react"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Guten Morgen"
  if (hour < 18) return "Guten Nachmittag"
  return "Guten Abend"
}

function formatDate(): string {
  return new Date().toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const channelIcons: Record<string, React.ReactNode> = {
  treffen: <Coffee size={14} />,
  mail: <Mail size={14} />,
  call: <Phone size={14} />,
  linkedin: <Link size={14} />,
}

// Placeholder data — will be replaced with Firestore data
const overdueContacts = [
  { id: "1", name: "Thomas Müller", company: "Swisscom", days: 95, context: "swisscom" as const },
  { id: "2", name: "Sarah Keller", company: "Visari", days: 78, context: "visari" as const },
  { id: "3", name: "Marco Bianchi", company: "Brand Architects", days: 62, context: "brandarchitects" as const },
]

const recentActivity = [
  { id: "1", name: "Lisa Weber", channel: "treffen", note: "Kaffee im Seefeld", time: "Vor 3 Tagen" },
  { id: "2", name: "Andreas Koch", channel: "mail", note: "Projektupdate NEO gesendet", time: "Vor 5 Tagen" },
  { id: "3", name: "Julia Meier", channel: "call", note: "Kurzes Telefonat zu Visari-Launch", time: "Vor 1 Woche" },
]

export default function DashboardPage() {
  return (
    <AppShell>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-text-primary">
          {getGreeting()}, Pascal
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{formatDate()}</p>
      </div>

      {/* KI Recommendations */}
      <Card className="mb-6 border-l-[3px] border-l-accent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <CardTitle className="text-lg">Heute empfohlen</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overdueContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-button px-3 py-2 transition-colors hover:bg-bg-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle font-serif text-sm text-accent">
                    {contact.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{contact.name}</p>
                    <p className="text-xs text-text-secondary">{contact.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={contact.context}>
                    {contact.context === "brandarchitects"
                      ? "Brand Architects"
                      : contact.context.charAt(0).toUpperCase() + contact.context.slice(1)}
                  </Badge>
                  <span className="text-xs text-status-red">{contact.days} Tage</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overdue Touchpoints */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-status-red" />
              <CardTitle className="text-lg">Überfällige Touchpoints</CardTitle>
            </div>
            <button className="text-xs text-accent hover:text-accent-hover">
              Alle anzeigen
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {overdueContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-button border border-bg-subtle px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse-subtle rounded-full bg-status-red" />
                  <span className="text-sm text-text-primary">{contact.name}</span>
                </div>
                <span className="font-mono text-xs text-text-muted">
                  {contact.days} Tage überfällig
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Letzte Aktivitäten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated text-text-secondary">
                  {channelIcons[activity.channel]}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{activity.name}</span>
                    {" — "}
                    {activity.note}
                  </p>
                  <p className="font-mono text-xs text-text-muted">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  )
}
