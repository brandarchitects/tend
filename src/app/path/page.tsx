"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { useDataStore } from "@/store/data"
import { getPath, updateActionStatus, getPhaseProgress, isPhaseUnlocked } from "@/lib/path"
import type { PathPhase, PathAction, ActionStatus } from "@/lib/types"
import {
  Map,
  Check,
  SkipForward,
  Clock,
  ChevronDown,
  ChevronRight,
  Lock,
  Zap,
} from "lucide-react"

const impactColors: Record<string, string> = {
  niedrig: "text-text-muted",
  mittel: "text-status-yellow",
  hoch: "text-status-green",
  "sehr hoch": "text-accent",
}

const impactArrows: Record<string, string> = {
  niedrig: "↑",
  mittel: "↑↑",
  hoch: "↑↑↑",
  "sehr hoch": "↑↑↑↑",
}

export default function PathPage() {
  const { toast } = useToast()
  const { phases: cachedPhases, pathLoaded, setPhases: setCachedPhases } = useDataStore()
  const [phases, setPhases] = useState<PathPhase[]>(cachedPhases)
  const [loading, setLoading] = useState(!pathLoaded)
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [deferActionId, setDeferActionId] = useState<string | null>(null)
  const [deferDate, setDeferDate] = useState("")

  const loadPath = useCallback(async () => {
    try {
      const data = await getPath()
      setPhases(data)
      setCachedPhases(data)
      // Auto-expand first non-completed unlocked phase
      const firstOpen = data.findIndex(
        (p, i) => isPhaseUnlocked(data, i) && getPhaseProgress(p).percent < 100
      )
      if (firstOpen >= 0 && !expandedPhase) setExpandedPhase(data[firstOpen].id)
    } catch (err) {
      console.error("Path laden Fehler:", err)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadPath() }, [loadPath])

  async function handleAction(phaseId: string, actionId: string, status: ActionStatus, note?: string) {
    try {
      await updateActionStatus(phaseId, actionId, status, note, status === "deferred" ? deferDate : undefined)
      const labels: Record<ActionStatus, string> = {
        done: "Erledigt!",
        skipped: "Übersprungen",
        deferred: "Verschoben",
        open: "",
      }
      toast(labels[status], "success")
      setDeferActionId(null)
      setDeferDate("")
      loadPath()
    } catch (err) {
      console.error("Aktion-Update Fehler:", err)
      toast("Fehler beim Aktualisieren", "error")
    }
  }

  const totalDone = phases.reduce((acc, p) => acc + p.actions.filter((a) => a.status === "done").length, 0)
  const totalActions = phases.reduce((acc, p) => acc + p.actions.length, 0)

  if (loading) {
    return (
      <AppShell>
        <div className="py-16 text-center text-sm text-text-secondary">Laden...</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Map size={20} className="text-accent" />
          <h1 className="font-serif text-2xl text-text-primary">Network Path</h1>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Dein geführter Entwicklungspfad — {totalDone} von {totalActions} Aktionen erledigt
        </p>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${totalActions > 0 ? (totalDone / totalActions) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {phases.map((phase, phaseIndex) => {
          const unlocked = isPhaseUnlocked(phases, phaseIndex)
          const progress = getPhaseProgress(phase)
          const isExpanded = expandedPhase === phase.id

          return (
            <Card key={phase.id} className={!unlocked ? "opacity-50" : ""}>
              {/* Phase Header */}
              <button
                onClick={() => unlocked && setExpandedPhase(isExpanded ? null : phase.id)}
                className="flex w-full items-center justify-between p-4 text-left"
                disabled={!unlocked}
              >
                <div className="flex items-center gap-3">
                  {unlocked ? (
                    isExpanded ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />
                  ) : (
                    <Lock size={16} className="text-text-muted" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Phase {phase.order} — {phase.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {progress.done}/{progress.total} erledigt
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-subtle">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted">{progress.percent}%</span>
                </div>
              </button>

              {/* Actions */}
              {isExpanded && unlocked && (
                <CardContent className="space-y-2 pt-0">
                  {phase.actions.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      phaseId={phase.id}
                      onAction={handleAction}
                      deferActionId={deferActionId}
                      setDeferActionId={setDeferActionId}
                      deferDate={deferDate}
                      setDeferDate={setDeferDate}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </AppShell>
  )
}

function ActionCard({
  action,
  phaseId,
  onAction,
  deferActionId,
  setDeferActionId,
  deferDate,
  setDeferDate,
}: {
  action: PathAction
  phaseId: string
  onAction: (phaseId: string, actionId: string, status: ActionStatus) => void
  deferActionId: string | null
  setDeferActionId: (id: string | null) => void
  deferDate: string
  setDeferDate: (date: string) => void
}) {
  const isDone = action.status === "done"
  const isSkipped = action.status === "skipped"
  const isDeferred = action.status === "deferred"
  const isOpen = action.status === "open"
  const showDefer = deferActionId === action.id

  return (
    <div
      className={`rounded-card border px-4 py-3 transition-colors ${
        isDone
          ? "border-status-green/20 bg-status-green/5"
          : isSkipped
          ? "border-bg-subtle bg-bg-base opacity-50"
          : isDeferred
          ? "border-status-yellow/20 bg-status-yellow/5"
          : "border-bg-subtle bg-bg-elevated"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          {isDone ? (
            <Check size={16} className="text-status-green" />
          ) : isSkipped ? (
            <SkipForward size={14} className="text-text-muted" />
          ) : isDeferred ? (
            <Clock size={14} className="text-status-yellow" />
          ) : (
            <Zap size={14} className="text-accent" />
          )}
        </div>

        <div className="flex-1">
          <p className={`text-sm font-medium ${isDone ? "text-status-green line-through" : isSkipped ? "text-text-muted line-through" : "text-text-primary"}`}>
            {action.title}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">{action.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {action.sphere && <Badge>{`Sphäre ${action.sphere}`}</Badge>}
            <span className="text-xs text-text-muted">{action.effort}</span>
            <span className={`text-xs ${impactColors[action.impact]}`}>
              {impactArrows[action.impact]} {action.impact}
            </span>
          </div>

          {isDeferred && action.deferredTo && (
            <p className="mt-1 text-xs text-status-yellow">
              Verschoben auf {new Date(action.deferredTo).toLocaleDateString("de-CH")}
            </p>
          )}

          {/* Action buttons */}
          {isOpen && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onAction(phaseId, action.id, "done")}>
                <Check size={12} className="mr-1" />
                Erledigt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeferActionId(showDefer ? null : action.id)}
              >
                <Clock size={12} className="mr-1" />
                Später
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAction(phaseId, action.id, "skipped")}
              >
                <SkipForward size={12} className="mr-1" />
                Überspringen
              </Button>
            </div>
          )}

          {/* Defer date picker */}
          {showDefer && (
            <div className="mt-2 flex gap-2">
              <Input
                type="date"
                value={deferDate}
                onChange={(e) => setDeferDate(e.target.value)}
                className="w-40"
              />
              <Button
                size="sm"
                disabled={!deferDate}
                onClick={() => onAction(phaseId, action.id, "deferred")}
              >
                Verschieben
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
