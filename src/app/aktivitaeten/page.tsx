"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { getContacts } from "@/lib/contacts"
import { getAllInteractions } from "@/lib/interactions"
import { useDataStore } from "@/store/data"
import type { Interaction } from "@/lib/types"
import { Activity, Coffee, Mail, Phone, Link } from "lucide-react"

const channelIcons: Record<string, React.ReactNode> = {
  treffen: <Coffee size={14} />,
  mail: <Mail size={14} />,
  call: <Phone size={14} />,
  linkedin: <Link size={14} />,
}

const channelLabels: Record<string, string> = {
  treffen: "Treffen",
  mail: "E-Mail",
  call: "Anruf",
  linkedin: "LinkedIn",
}

export default function AktivitaetenPage() {
  const router = useRouter()
  const {
    contacts, contactsLoaded, setContacts: setCachedContacts,
    interactions, interactionsLoaded, setInteractions: setCachedInteractions,
  } = useDataStore()
  const [loading, setLoading] = useState(!interactionsLoaded)

  useEffect(() => {
    if (contactsLoaded && interactionsLoaded) return
    async function load() {
      try {
        const [i, c] = await Promise.all([getAllInteractions(), getContacts()])
        setCachedInteractions(i)
        setCachedContacts(c)
      } catch {
        // Continue with empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getContactName(contactId: string): string {
    const contact = contacts.find((c) => c.id === contactId)
    return contact ? `${contact.firstName} ${contact.lastName}` : "Unbekannt"
  }

  // Group interactions by date
  const grouped = interactions.reduce<Record<string, Interaction[]>>((acc, interaction) => {
    const date = new Date(interaction.date).toLocaleDateString("de-CH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(interaction)
    return acc
  }, {})

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text-primary">Aktivitäten</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Chronologischer Überblick aller Interaktionen
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-text-secondary">Laden...</div>
      ) : interactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-bg-subtle bg-bg-surface py-16">
          <Activity size={48} className="mb-4 text-text-muted" />
          <p className="text-sm text-text-secondary">
            Noch keine Aktivitäten vorhanden
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Öffne einen Kontakt und logge eine Interaktion
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                {date}
              </h2>
              <Card>
                <CardContent className="py-3">
                  <div className="space-y-3">
                    {items.map((interaction) => (
                      <div
                        key={interaction.id}
                        className="flex cursor-pointer items-start gap-3 rounded-button px-2 py-1.5 hover:bg-bg-elevated"
                        onClick={() => router.push(`/kontakte/${interaction.contactId}`)}
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-text-secondary">
                          {channelIcons[interaction.channel]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-text-primary">
                            <span className="font-medium">
                              {getContactName(interaction.contactId)}
                            </span>
                            {" — "}
                            {interaction.note}
                          </p>
                          <span className="text-xs text-text-muted">
                            {channelLabels[interaction.channel]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
