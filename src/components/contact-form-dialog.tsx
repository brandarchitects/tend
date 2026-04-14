"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { createContact, updateContact } from "@/lib/contacts"
import type { Contact, Context } from "@/lib/types"

const CONTEXTS: { value: Context; label: string }[] = [
  { value: "swisscom", label: "Swisscom" },
  { value: "brandarchitects", label: "Brand Architects" },
  { value: "visari", label: "Visari" },
  { value: "privat", label: "Privat" },
]

interface ContactFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact | null
  onSaved: () => void
}

export function ContactFormDialog({ open, onOpenChange, contact, onSaved }: ContactFormDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [contexts, setContexts] = useState<Context[]>([])
  const [tags, setTags] = useState("")
  const [notes, setNotes] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [touchpointInterval, setTouchpointInterval] = useState("60")

  useEffect(() => {
    if (contact) {
      setFirstName(contact.firstName)
      setLastName(contact.lastName)
      setEmail(contact.email ?? "")
      setPhone(contact.phone ?? "")
      setCompany(contact.company ?? "")
      setPosition(contact.position ?? "")
      setContexts(contact.contexts)
      setTags(contact.tags.join(", "))
      setNotes(contact.notes ?? "")
      setLinkedinUrl(contact.linkedinUrl ?? "")
      setTouchpointInterval(String(contact.touchpointIntervalDays))
    } else {
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setCompany("")
      setPosition("")
      setContexts([])
      setTags("")
      setNotes("")
      setLinkedinUrl("")
      setTouchpointInterval("60")
    }
  }, [contact, open])

  function toggleContext(ctx: Context) {
    setContexts((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const data = {
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      position: position || undefined,
      contexts,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: notes || undefined,
      linkedinUrl: linkedinUrl || undefined,
      touchpointIntervalDays: parseInt(touchpointInterval) || 60,
      lastInteractionDate: contact?.lastInteractionDate,
    }

    try {
      if (contact) {
        await updateContact(contact.id, data)
        toast("Kontakt aktualisiert", "success")
      } else {
        await createContact(data)
        toast("Kontakt erstellt", "success")
      }
      onSaved()
      onOpenChange(false)
    } catch {
      toast("Fehler beim Speichern", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle>{contact ? "Kontakt bearbeiten" : "Neuer Kontakt"}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Vorname *</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Nachname *</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">E-Mail</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Telefon</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          {/* Company + Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Firma</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Position</label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
          </div>

          {/* Contexts */}
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Kontext</label>
            <div className="flex flex-wrap gap-2">
              {CONTEXTS.map((ctx) => (
                <button
                  key={ctx.value}
                  type="button"
                  onClick={() => toggleContext(ctx.value)}
                  className={`rounded-pill px-3 py-1 text-xs font-medium transition-colors ${
                    contexts.includes(ctx.value)
                      ? "bg-accent text-white"
                      : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {ctx.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Tags (kommagetrennt)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="z.B. Investor, Design, AI"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">LinkedIn URL</label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          {/* Touchpoint Interval */}
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Touchpoint-Intervall (Tage)</label>
            <Input
              type="number"
              min="7"
              max="365"
              value={touchpointInterval}
              onChange={(e) => setTouchpointInterval(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Notizen</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Persönliche Notizen zu diesem Kontakt..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Speichern..." : contact ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
