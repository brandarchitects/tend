"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { ContactFormDialog } from "@/components/contact-form-dialog"
import { useToast } from "@/components/ui/toast"
import { getContact, deleteContact, getContactStatus, getDaysOverdue } from "@/lib/contacts"
import { getInteractions, addInteraction } from "@/lib/interactions"
import type { Contact, Interaction, InteractionChannel, Context } from "@/lib/types"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Coffee,
  Mail,
  Phone,
  Link,
  Calendar,
  Tag,
  Clock,
  Plus,
  ExternalLink,
} from "lucide-react"

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

const channelIcons: Record<InteractionChannel, React.ReactNode> = {
  treffen: <Coffee size={14} />,
  mail: <Mail size={14} />,
  call: <Phone size={14} />,
  linkedin: <Link size={14} />,
}

const channelLabels: Record<InteractionChannel, string> = {
  treffen: "Treffen",
  mail: "E-Mail",
  call: "Anruf",
  linkedin: "LinkedIn",
}

function initialBgColor(name: string): string {
  const colors = [
    "bg-[#3D2A1A]", "bg-[#2A1A3D]", "bg-[#1A3D2A]", "bg-[#3D1A1A]",
    "bg-[#1A2A3D]", "bg-[#3D3D1A]", "bg-[#2A3D1A]", "bg-[#1A3D3D]",
  ]
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export default function KontaktProfilPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const contactId = params.id as string

  const [contact, setContact] = useState<Contact | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  // New interaction form
  const [showNewInteraction, setShowNewInteraction] = useState(false)
  const [newChannel, setNewChannel] = useState<InteractionChannel>("treffen")
  const [newNote, setNewNote] = useState("")
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0])
  const [savingInteraction, setSavingInteraction] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [c, i] = await Promise.all([
        getContact(contactId),
        getInteractions(contactId),
      ])
      setContact(c)
      setInteractions(i)
    } catch {
      toast("Fehler beim Laden des Kontakts", "error")
    } finally {
      setLoading(false)
    }
  }, [contactId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDelete() {
    if (!contact) return
    if (!window.confirm(`${contact.firstName} ${contact.lastName} wirklich löschen?`)) return
    try {
      await deleteContact(contact.id)
      toast("Kontakt gelöscht", "success")
      router.push("/kontakte")
    } catch {
      toast("Fehler beim Löschen", "error")
    }
  }

  async function handleAddInteraction(e: React.FormEvent) {
    e.preventDefault()
    if (!newNote.trim()) return
    setSavingInteraction(true)
    try {
      await addInteraction({
        contactId,
        channel: newChannel,
        note: newNote,
        date: newDate,
      })
      toast("Interaktion hinzugefügt", "success")
      setNewNote("")
      setShowNewInteraction(false)
      loadData()
    } catch {
      toast("Fehler beim Speichern", "error")
    } finally {
      setSavingInteraction(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="py-16 text-center text-sm text-text-secondary">Laden...</div>
      </AppShell>
    )
  }

  if (!contact) {
    return (
      <AppShell>
        <div className="py-16 text-center">
          <p className="text-sm text-text-secondary">Kontakt nicht gefunden</p>
          <Button variant="ghost" className="mt-3" onClick={() => router.push("/kontakte")}>
            Zurück zur Kontaktliste
          </Button>
        </div>
      </AppShell>
    )
  }

  const status = getContactStatus(contact)
  const overdueDays = getDaysOverdue(contact)
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`

  return (
    <AppShell>
      {/* Back button */}
      <button
        onClick={() => router.push("/kontakte")}
        className="mb-4 flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={14} />
        Zurück
      </button>

      {/* Hero Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full font-serif text-2xl text-text-primary ${initialBgColor(contact.firstName + contact.lastName)}`}
          >
            {initials}
          </div>
          <div>
            <h1 className="font-serif text-xl text-text-primary">
              {contact.firstName} {contact.lastName}
            </h1>
            {contact.company && (
              <p className="text-sm text-text-secondary">
                {contact.position ? `${contact.position} bei ` : ""}
                {contact.company}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {contact.contexts.map((ctx) => (
                <Badge key={ctx} variant={contextBadgeVariant[ctx]}>
                  {contextLabel[ctx]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={14} className="mr-1" />
            Bearbeiten
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 size={14} className="mr-1 text-status-red" />
          </Button>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Timeline + Interactions */}
        <div className="space-y-6">
          {/* New Interaction */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Interaktionen</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewInteraction(!showNewInteraction)}
                >
                  <Plus size={14} className="mr-1" />
                  Neue Interaktion
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showNewInteraction && (
                <form onSubmit={handleAddInteraction} className="mb-4 rounded-card border border-bg-subtle bg-bg-elevated p-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Select
                      value={newChannel}
                      onChange={(e) => setNewChannel(e.target.value as InteractionChannel)}
                    >
                      <option value="treffen">Treffen</option>
                      <option value="mail">E-Mail</option>
                      <option value="call">Anruf</option>
                      <option value="linkedin">LinkedIn</option>
                    </Select>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <Input
                    placeholder="Was wurde besprochen?"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewInteraction(false)}
                    >
                      Abbrechen
                    </Button>
                    <Button type="submit" size="sm" disabled={savingInteraction}>
                      {savingInteraction ? "Speichern..." : "Speichern"}
                    </Button>
                  </div>
                </form>
              )}

              {interactions.length === 0 ? (
                <p className="text-sm text-text-muted">Noch keine Interaktionen aufgezeichnet</p>
              ) : (
                <div className="space-y-3">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-text-secondary">
                        {channelIcons[interaction.channel]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary">{interaction.note}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs text-text-muted">
                            {channelLabels[interaction.channel]}
                          </span>
                          <span className="font-mono text-xs text-text-muted">
                            {new Date(interaction.date).toLocaleDateString("de-CH")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {contact.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-text-secondary">{contact.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Contact details */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Kontaktdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-text-muted" />
                  <a href={`mailto:${contact.email}`} className="text-accent hover:text-accent-hover">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-text-muted" />
                  <a href={`tel:${contact.phone}`} className="text-text-primary">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.linkedinUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink size={14} className="text-text-muted" />
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-hover"
                  >
                    LinkedIn-Profil
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {contact.tags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-text-muted" />
                  <CardTitle className="text-lg">Tags</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Touchpoint Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-text-muted" />
                <CardTitle className="text-lg">Touchpoint</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Intervall</span>
                <span className="text-text-primary">Alle {contact.touchpointIntervalDays} Tage</span>
              </div>
              {contact.lastInteractionDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Letzter Kontakt</span>
                  <span className="font-mono text-text-primary">
                    {new Date(contact.lastInteractionDate).toLocaleDateString("de-CH")}
                  </span>
                </div>
              )}
              {contact.nextTouchpointDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Nächster Touchpoint</span>
                  <span className={`font-mono ${overdueDays ? "text-status-red" : "text-text-primary"}`}>
                    {new Date(contact.nextTouchpointDate).toLocaleDateString("de-CH")}
                    {overdueDays ? ` (${overdueDays}d überfällig)` : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <div className={`h-2 w-2 rounded-full ${
                  status === "green" ? "bg-status-green" :
                  status === "yellow" ? "bg-status-yellow" :
                  status === "red" ? "bg-status-red animate-pulse-subtle" :
                  "bg-text-muted"
                }`} />
                <span className="text-xs text-text-secondary">
                  {status === "green" ? "Aktiv gepflegt" :
                   status === "yellow" ? "Bald fällig" :
                   status === "red" ? "Überfällig" :
                   "Kein Kontakt erfasst"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Outlook Booking - Placeholder */}
          <Button className="w-full">
            <Calendar size={16} className="mr-2" />
            Termin buchen
          </Button>
        </div>
      </div>

      <ContactFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
        onSaved={loadData}
      />
    </AppShell>
  )
}
