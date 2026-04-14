import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Contact, ContactDoc, Context } from "./types"

const CONTACTS_COLLECTION = "contacts"

function contactsRef() {
  return collection(db, CONTACTS_COLLECTION)
}

function computeNextTouchpoint(lastInteraction: string | undefined, intervalDays: number): string | undefined {
  if (!lastInteraction) return undefined
  const date = new Date(lastInteraction)
  date.setDate(date.getDate() + intervalDays)
  return date.toISOString().split("T")[0]
}

export async function getContacts(contextFilter?: Context): Promise<Contact[]> {
  let q = query(contactsRef(), orderBy("lastName", "asc"))

  if (contextFilter) {
    q = query(contactsRef(), where("contexts", "array-contains", contextFilter), orderBy("lastName", "asc"))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Contact[]
}

export async function getContact(id: string): Promise<Contact | null> {
  const docRef = doc(db, CONTACTS_COLLECTION, id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Contact
}

// Remove undefined values — Firestore doesn't accept them
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T
}

export async function createContact(data: Omit<ContactDoc, "createdAt" | "updatedAt" | "nextTouchpointDate">): Promise<string> {
  const now = new Date().toISOString()
  const contactData = stripUndefined({
    ...data,
    nextTouchpointDate: computeNextTouchpoint(data.lastInteractionDate, data.touchpointIntervalDays),
    createdAt: now,
    updatedAt: now,
  })
  const docRef = await addDoc(contactsRef(), contactData)
  return docRef.id
}

export async function updateContact(id: string, data: Partial<ContactDoc>): Promise<void> {
  const docRef = doc(db, CONTACTS_COLLECTION, id)
  const updateData: Partial<ContactDoc> & { updatedAt: string } = {
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // Recompute next touchpoint if relevant fields changed
  if (data.lastInteractionDate !== undefined || data.touchpointIntervalDays !== undefined) {
    const current = await getContact(id)
    if (current) {
      const lastDate = data.lastInteractionDate ?? current.lastInteractionDate
      const interval = data.touchpointIntervalDays ?? current.touchpointIntervalDays
      updateData.nextTouchpointDate = computeNextTouchpoint(lastDate, interval)
    }
  }

  await updateDoc(docRef, stripUndefined(updateData))
}

export async function deleteContact(id: string): Promise<void> {
  const docRef = doc(db, CONTACTS_COLLECTION, id)
  await deleteDoc(docRef)
}

export async function searchContacts(searchTerm: string): Promise<Contact[]> {
  // Firestore doesn't support full-text search, so we fetch all and filter client-side
  // For a single user with < 1000 contacts this is fine
  const all = await getContacts()
  const term = searchTerm.toLowerCase()
  return all.filter(
    (c) =>
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      (c.company?.toLowerCase().includes(term) ?? false) ||
      (c.email?.toLowerCase().includes(term) ?? false) ||
      c.tags.some((t) => t.toLowerCase().includes(term))
  )
}

export function getContactStatus(contact: Contact): "green" | "yellow" | "red" | "none" {
  if (!contact.lastInteractionDate) return "none"
  const last = new Date(contact.lastInteractionDate)
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSince <= 30) return "green"
  if (daysSince <= 60) return "yellow"
  return "red"
}

export function getDaysOverdue(contact: Contact): number | null {
  if (!contact.nextTouchpointDate) return null
  const next = new Date(contact.nextTouchpointDate)
  const now = new Date()
  const days = Math.floor((now.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
  return days > 0 ? days : null
}
