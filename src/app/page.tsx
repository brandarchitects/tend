"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getContacts, getContactStatus, getDaysOverdue } from "@/lib/contacts"
import { getAllInteractions } from "@/lib/interactions"
import type { Contact, Interaction, Context, AiSuggestion } from "@/lib/types"
import { Sparkles, Clock, Coffee, Mail, Phone, Link, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

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

const contextBadgeVariant: Record<Context, "swisscom" | "brandarchitects" | "visari" | "privat"> = {
  swisscom: "swisscom",
  brandarchitects: "brandarchitects",
  visari: "visari",
  privat: "privat",
}

const contextLabel: Record<Context, string> = {
  swisscom: "Swisscom",
  brandarchitects: "Brand Architects",
  visari: "Visari",
  privat: "Privat",
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Heute"
  if (diffDays === 1) return "Gestern"
  if (diffDays < 7) return `Vor ${diffDays} Tagen`
  if (diffDays < 30) return `Vor ${Math.floor(diffDays / 7)} Woche${Math.floor(diffDays / 7) > 1 ? "n" : ""}`
  return `Vor ${Math.floor(diffDays / 30)} Monat${Math.floor(diffDays / 30) > 1 ? "en" : ""}`
}

export default function DashboardPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [c, i] = await Promise.all([getContacts(), getAllInteractions()])
        setContacts(c)
        setInteractions(i.slice(0, 5)) // Last 5

        // Fetch AI recommendations if we have contacts
        if (c.length > 0) {
          setAiLoading(true)
          try {
            const res = await fetch("/api/ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "recommendations",
                contacts: c.map((contact) => ({
                  id: contact.id,
                  name: `${contact.firstName} ${contact.lastName}`,
                  company: contact.company,
                  contexts: contact.contexts,
                  lastInteraction: contact.lastInteractionDate,
                  daysSinceContact: contact.lastInteractionDate
                    ? Math.floor((Date.now() - new Date(contact.lastInteractionDate).getTime()) / 86400000)
                    : null,
                  touchpointInterval: contact.touchpointIntervalDays,
                  tags: contact.tags,
                })),
              }),
            })
            const data = await res.json()
            if (data.result) {
              try {
                const parsed = JSON.parse(data.result)
                setAiSuggestions(Array.isArray(parsed) ? parsed : [])
              } catch {
                setAiSuggestions([])
              }
            }
          } catch {
            // AI is optional, continue without
          } finally {
            setAiLoading(false)
          }
        }
      } catch {
        // Continue with empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const overdueContacts = contacts
    .filter((c) => getContactStatus(c) === "red")
    .sort((a, b) => (getDaysOverdue(b) ?? 0) - (getDaysOverdue(a) ?? 0))
    .slice(0, 5)

  if (loading) {
    return (
      <AppShell>
        <div className="py-16 text-center text-sm text-text-secondary">Laden...</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-text-primary">
          {getGreeting()}, Pascal
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{formatDate()}</p>
      </div>

      {contacts.length === 0 ? (
        /* Empty state for new users */
        <Card className="text-center">
          <CardContent className="py-12">
            <p className="text-sm text-text-secondary">
              Willkommen bei Nexus! Erstelle deinen ersten Kontakt um loszulegen.
            </p>
            <Button className="mt-4" onClick={() => router.push("/kontakte")}>
              <Plus size={14} className="mr-1" />
              Kontakte verwalten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KI Recommendations */}
          <Card className="mb-6 border-l-[3px] border-l-accent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <CardTitle className="text-lg">Heute empfohlen</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {aiLoading ? (
                <p className="text-sm italic text-text-muted animate-typewriter">
                  KI analysiert dein Netzwerk...
                </p>
              ) : aiSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-button px-3 py-2 transition-colors hover:bg-bg-elevated cursor-pointer"
                      onClick={() => suggestion.contactId && router.push(`/kontakte/${suggestion.contactId}`)}
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {suggestion.contactName}
                        </p>
                        <p className="text-xs text-text-secondary">{suggestion.reason}</p>
                      </div>
                      {suggestion.suggestedAction && (
                        <span className="text-xs text-accent">{suggestion.suggestedAction}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : overdueContacts.length > 0 ? (
                <div className="space-y-3">
                  {overdueContacts.slice(0, 3).map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between rounded-button px-3 py-2 transition-colors hover:bg-bg-elevated cursor-pointer"
                      onClick={() => router.push(`/kontakte/${contact.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle font-serif text-sm text-accent">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-xs text-text-secondary">{contact.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.contexts[0] && (
                          <Badge variant={contextBadgeVariant[contact.contexts[0]]}>
                            {contextLabel[contact.contexts[0]]}
                          </Badge>
                        )}
                        <span className="text-xs text-status-red">
                          {getDaysOverdue(contact)} Tage
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  Alle Kontakte sind auf dem aktuellen Stand.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Overdue Touchpoints */}
          {overdueContacts.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-status-red" />
                    <CardTitle className="text-lg">Überfällige Touchpoints</CardTitle>
                  </div>
                  <button
                    onClick={() => router.push("/kontakte")}
                    className="text-xs text-accent hover:text-accent-hover"
                  >
                    Alle anzeigen
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex cursor-pointer items-center justify-between rounded-button border border-bg-subtle px-3 py-2 hover:bg-bg-elevated"
                      onClick={() => router.push(`/kontakte/${contact.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 animate-pulse-subtle rounded-full bg-status-red" />
                        <span className="text-sm text-text-primary">
                          {contact.firstName} {contact.lastName}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-text-muted">
                        {getDaysOverdue(contact)} Tage überfällig
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Letzte Aktivitäten</CardTitle>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-sm text-text-muted">Noch keine Aktivitäten aufgezeichnet</p>
              ) : (
                <div className="space-y-3">
                  {interactions.map((interaction) => {
                    const contact = contacts.find((c) => c.id === interaction.contactId)
                    return (
                      <div key={interaction.id} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated text-text-secondary">
                          {channelIcons[interaction.channel]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-text-primary">
                            <span className="font-medium">
                              {contact
                                ? `${contact.firstName} ${contact.lastName}`
                                : "Unbekannt"}
                            </span>
                            {" — "}
                            {interaction.note}
                          </p>
                          <p className="font-mono text-xs text-text-muted">
                            {relativeTime(interaction.date)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  )
}
