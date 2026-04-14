export type Context = "swisscom" | "brandarchitects" | "visari" | "privat"

export type InteractionChannel = "treffen" | "mail" | "call" | "linkedin"

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  position?: string
  contexts: Context[]
  tags: string[]
  notes?: string
  linkedinUrl?: string
  touchpointIntervalDays: number // e.g. 60
  lastInteractionDate?: string // ISO date
  nextTouchpointDate?: string // ISO date (computed)
  createdAt: string
  updatedAt: string
}

export interface Interaction {
  id: string
  contactId: string
  channel: InteractionChannel
  note: string
  date: string // ISO date
  createdAt: string
}

export interface AiSuggestion {
  contactId: string
  contactName: string
  reason: string
  suggestedAction?: string
}

// Firestore document type (without id)
export type ContactDoc = Omit<Contact, "id">
export type InteractionDoc = Omit<Interaction, "id">
