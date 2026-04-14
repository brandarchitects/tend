"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { useDataStore } from "@/store/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ContactFormDialog } from "@/components/contact-form-dialog"
import { getContacts, searchContacts, getContactStatus } from "@/lib/contacts"
import { useUIStore } from "@/store/ui"
import { Users, Plus, Search } from "lucide-react"
import type { Contact, Context } from "@/lib/types"

const CONTEXT_FILTERS: { value: Context | null; label: string }[] = [
  { value: null, label: "Alle" },
  { value: "swisscom", label: "Swisscom" },
  { value: "brandarchitects", label: "Brand Architects" },
  { value: "visari", label: "Visari" },
  { value: "privat", label: "Privat" },
]

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

const statusDotColor: Record<string, string> = {
  green: "bg-status-green",
  yellow: "bg-status-yellow",
  red: "bg-status-red",
  none: "bg-text-muted",
}

// Generate a warm background color from initials
function initialBgColor(name: string): string {
  const colors = [
    "bg-[#3D2A1A]", "bg-[#2A1A3D]", "bg-[#1A3D2A]", "bg-[#3D1A1A]",
    "bg-[#1A2A3D]", "bg-[#3D3D1A]", "bg-[#2A3D1A]", "bg-[#1A3D3D]",
  ]
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export default function KontaktePage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const { activeContextFilter, setContextFilter } = useUIStore()
  const { contacts: cachedContacts, contactsLoaded, setContacts: setCachedContacts } = useDataStore()
  const debounceRef = useRef<NodeJS.Timeout>()

  const loadContacts = useCallback(async (search?: string, filter?: Context | null) => {
    const s = search ?? searchTerm
    const f = filter !== undefined ? filter : activeContextFilter
    setLoading(true)
    try {
      if (s) {
        const data = await searchContacts(s)
        setContacts(data)
      } else if (contactsLoaded && !f) {
        // Use cache when no filter and no search
        setContacts(cachedContacts)
      } else {
        const data = await getContacts(f as Context | undefined)
        setContacts(data)
        if (!f) setCachedContacts(data) // Cache unfiltered results
      }
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }, [activeContextFilter, searchTerm, contactsLoaded, cachedContacts, setCachedContacts])

  useEffect(() => {
    loadContacts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContextFilter])

  // Debounced search
  function handleSearch(value: string) {
    setSearchTerm(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadContacts(value)
    }, 300)
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl text-text-primary">Kontakte</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {contacts.length} Kontakt{contacts.length !== 1 ? "e" : ""} in deinem Netzwerk
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={16} className="mr-1" />
          Neuer Kontakt
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {CONTEXT_FILTERS.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setContextFilter(filter.value)}
            className={`rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
              activeContextFilter === filter.value
                ? "bg-accent text-white"
                : "bg-bg-elevated text-text-secondary hover:text-text-primary"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Kontakte durchsuchen..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
          aria-label="Kontakte suchen"
        />
      </div>

      {/* Contact List */}
      {loading ? (
        <div className="py-16 text-center text-sm text-text-secondary">Laden...</div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-bg-subtle bg-bg-surface py-16">
          <Users size={48} className="mb-4 text-text-muted" />
          <p className="text-sm text-text-secondary">
            {searchTerm
              ? `Keine Kontakte gefunden für «${searchTerm}»`
              : "Noch keine Kontakte in dieser Kategorie"}
          </p>
          <Button variant="ghost" className="mt-3" onClick={() => setDialogOpen(true)}>
            <Plus size={14} className="mr-1" />
            Kontakt erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {contacts.map((contact) => {
            const status = getContactStatus(contact)
            const initials = `${contact.firstName[0]}${contact.lastName[0]}`
            return (
              <button
                key={contact.id}
                onClick={() => router.push(`/kontakte/${contact.id}`)}
                className="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-left transition-colors hover:bg-bg-elevated"
              >
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm text-text-primary ${initialBgColor(contact.firstName + contact.lastName)}`}
                >
                  {initials}
                </div>

                {/* Name + Company */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {contact.firstName} {contact.lastName}
                  </p>
                  {contact.company && (
                    <p className="truncate text-xs text-text-secondary">{contact.company}</p>
                  )}
                </div>

                {/* Context Badges */}
                <div className="hidden gap-1 sm:flex">
                  {contact.contexts.map((ctx) => (
                    <Badge key={ctx} variant={contextBadgeVariant[ctx]}>
                      {contextLabel[ctx]}
                    </Badge>
                  ))}
                </div>

                {/* Status Dot */}
                <div className={`h-2 w-2 shrink-0 rounded-full ${statusDotColor[status]}`} />
              </button>
            )
          })}
        </div>
      )}

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => { useDataStore.getState().invalidateContacts(); loadContacts() }}
      />
    </AppShell>
  )
}
