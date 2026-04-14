import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { db } from "./firebase"
import { DEFAULT_PATH } from "./path-data"
import type { PathPhase, ActionStatus } from "./types"

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T
}

export async function getPath(): Promise<PathPhase[]> {
  const docRef = doc(db, "networkPath", "default")
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) {
    // Initialize with default path
    await setDoc(docRef, { phases: DEFAULT_PATH })
    return DEFAULT_PATH
  }

  return (snapshot.data().phases as PathPhase[]) ?? DEFAULT_PATH
}

export async function updateActionStatus(
  phaseId: string,
  actionId: string,
  status: ActionStatus,
  note?: string,
  deferredTo?: string
): Promise<void> {
  const phases = await getPath()
  const now = new Date().toISOString()

  const updatedPhases = phases.map((phase) => {
    if (phase.id !== phaseId) return phase
    return {
      ...phase,
      actions: phase.actions.map((action) => {
        if (action.id !== actionId) return action
        return stripUndefined({
          ...action,
          status,
          completedAt: status === "done" ? now : action.completedAt,
          note: note ?? action.note,
          deferredTo: status === "deferred" ? deferredTo : undefined,
        })
      }),
    }
  })

  const docRef = doc(db, "networkPath", "default")
  await updateDoc(docRef, { phases: updatedPhases })
}

export function getPhaseProgress(phase: PathPhase): { done: number; total: number; percent: number } {
  const total = phase.actions.length
  const done = phase.actions.filter((a) => a.status === "done").length
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
}

export function isPhaseUnlocked(phases: PathPhase[], phaseIndex: number): boolean {
  if (phaseIndex === 0) return true
  const prevPhase = phases[phaseIndex - 1]
  const progress = getPhaseProgress(prevPhase)
  return progress.percent >= 60
}
