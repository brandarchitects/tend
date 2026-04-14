export type Context = "swisscom" | "brandarchitects" | "visari" | "privat"

export type InteractionChannel = "treffen" | "mail" | "call" | "linkedin"

export type Sphere = "A" | "B" | "C" | "D" | "E"

export type ContactZone = "core" | "active" | "radar"

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
  touchpointIntervalDays: number
  lastInteractionDate?: string
  nextTouchpointDate?: string
  sphere?: Sphere
  zone?: ContactZone
  createdAt: string
  updatedAt: string
}

export interface Interaction {
  id: string
  contactId: string
  channel: InteractionChannel
  note: string
  date: string
  createdAt: string
}

export interface AiSuggestion {
  contactId: string
  contactName: string
  reason: string
  suggestedAction?: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

// Network Path
export type ActionStatus = "open" | "done" | "skipped" | "deferred"

export interface PathAction {
  id: string
  title: string
  description: string
  sphere?: Sphere
  effort: string
  impact: "niedrig" | "mittel" | "hoch" | "sehr hoch"
  status: ActionStatus
  deferredTo?: string
  completedAt?: string
  note?: string
}

export interface PathPhase {
  id: string
  title: string
  order: number
  actions: PathAction[]
}

// Nudges
export interface Nudge {
  id: string
  type: "touchpoint_overdue" | "weekly_post" | "phase_unlocked" | "thinking_of_you" | "path_reminder" | "action_done"
  message: string
  contactId?: string
  actionId?: string
  createdAt: string
  dismissedAt?: string
}

// Firestore document type (without id)
export type ContactDoc = Omit<Contact, "id">
export type InteractionDoc = Omit<Interaction, "id">
