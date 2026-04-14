import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore"
import { db } from "./firebase"
import { updateContact } from "./contacts"
import type { Interaction, InteractionDoc } from "./types"

const INTERACTIONS_COLLECTION = "interactions"

function interactionsRef() {
  return collection(db, INTERACTIONS_COLLECTION)
}

export async function getInteractions(contactId: string): Promise<Interaction[]> {
  const q = query(
    interactionsRef(),
    where("contactId", "==", contactId),
    orderBy("date", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interaction[]
}

export async function getAllInteractions(): Promise<Interaction[]> {
  const q = query(interactionsRef(), orderBy("date", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interaction[]
}

export async function addInteraction(
  data: Omit<InteractionDoc, "createdAt">
): Promise<string> {
  const now = new Date().toISOString()
  const interactionData: InteractionDoc = {
    ...data,
    createdAt: now,
  }
  const docRef = await addDoc(interactionsRef(), interactionData)

  // Update the contact's lastInteractionDate
  await updateContact(data.contactId, {
    lastInteractionDate: data.date,
  })

  return docRef.id
}
