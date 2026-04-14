import { create } from "zustand"
import type { Contact, Interaction, PathPhase } from "@/lib/types"

interface DataState {
  // Contacts
  contacts: Contact[]
  contactsLoaded: boolean
  setContacts: (contacts: Contact[]) => void

  // Interactions
  interactions: Interaction[]
  interactionsLoaded: boolean
  setInteractions: (interactions: Interaction[]) => void

  // Path
  phases: PathPhase[]
  pathLoaded: boolean
  setPhases: (phases: PathPhase[]) => void

  // Strategy
  strategyContent: string | null
  strategyLoaded: boolean
  setStrategyContent: (content: string | null) => void

  // Invalidate specific caches
  invalidateContacts: () => void
  invalidateInteractions: () => void
  invalidatePath: () => void
  invalidateStrategy: () => void
}

export const useDataStore = create<DataState>((set) => ({
  contacts: [],
  contactsLoaded: false,
  setContacts: (contacts) => set({ contacts, contactsLoaded: true }),

  interactions: [],
  interactionsLoaded: false,
  setInteractions: (interactions) => set({ interactions, interactionsLoaded: true }),

  phases: [],
  pathLoaded: false,
  setPhases: (phases) => set({ phases, pathLoaded: true }),

  strategyContent: null,
  strategyLoaded: false,
  setStrategyContent: (content) => set({ strategyContent: content, strategyLoaded: true }),

  invalidateContacts: () => set({ contactsLoaded: false }),
  invalidateInteractions: () => set({ contactsLoaded: false, interactionsLoaded: false }),
  invalidatePath: () => set({ pathLoaded: false }),
  invalidateStrategy: () => set({ strategyLoaded: false }),
}))
