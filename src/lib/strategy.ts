import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"

interface StrategyData {
  content: string
  filename: string
  uploadedAt: string
  characters: number
}

export async function getStrategy(): Promise<StrategyData | null> {
  const docRef = doc(db, "strategy", "current")
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return snapshot.data() as StrategyData
}

export async function saveStrategy(data: StrategyData): Promise<void> {
  const docRef = doc(db, "strategy", "current")
  await setDoc(docRef, data)
}
