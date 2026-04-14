"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChatStore, type ChatMode } from "@/store/chat"
import { useDataStore } from "@/store/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, User, X, BrainCircuit } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

const MODES: { value: ChatMode; label: string; desc: string }[] = [
  { value: "network", label: "Netzwerk", desc: "Wen kontaktieren, wann, Touchpoints — basierend auf deinen Kontakten und Strategie." },
  { value: "bestpractice", label: "Best Practice", desc: "Wie Top-Networker, Recruiter und Führungskräfte es machen — faktisch, praxisnah." },
  { value: "career", label: "Karriere", desc: "Positionierung, internes Standing, Jobwechsel — wie Profis das strategisch angehen." },
  { value: "message", label: "Nachricht", desc: "Gib Kontakt + Anlass — AI formuliert einen fertigen Entwurf für dich." },
]

export function TendAIPanel() {
  const {
    messages, activeMode, isOpen, isThinking,
    addMessage, updateLastAssistant, setMode, setOpen, setThinking,
    currentScreen,
  } = useChatStore()

  const { contacts, strategyContent } = useDataStore()

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [initialized, setInitialized] = useState(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Proactive greeting on first open (if no messages yet)
  useEffect(() => {
    if (isOpen && !initialized && messages.length === 0 && contacts.length > 0) {
      setInitialized(true)
      sendToAI("START", true)
    } else if (isOpen) {
      setInitialized(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contacts.length])

  async function sendToAI(content: string, isInit?: boolean) {
    if (!isInit) {
      addMessage({
        role: "user",
        content,
        mode: activeMode,
        timestamp: new Date().toISOString(),
      })
    }

    setThinking(true)

    // Add placeholder assistant message
    addMessage({
      role: "assistant",
      content: "",
      mode: activeMode,
      timestamp: new Date().toISOString(),
    })

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          mode: activeMode,
          currentScreen,
          messages: messages.slice(-9).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          contacts: contacts.slice(0, 20).map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            company: c.company,
            contexts: c.contexts,
            lastInteraction: c.lastInteractionDate,
            daysSinceContact: c.lastInteractionDate
              ? Math.floor((Date.now() - new Date(c.lastInteractionDate).getTime()) / 86400000)
              : null,
            touchpointInterval: c.touchpointIntervalDays,
            tags: c.tags,
            sphere: c.sphere,
            zone: c.zone,
          })),
          strategy: strategyContent,
        }),
      })

      if (!res.ok) throw new Error("Chat-Fehler")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("Kein Stream")

      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        updateLastAssistant(fullText)
      }
    } catch {
      updateLastAssistant("Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.")
    } finally {
      setThinking(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isThinking) return
    const text = input.trim()
    setInput("")
    sendToAI(text)
  }

  if (!isOpen) return null

  const visibleMessages = messages.filter((m) => !(m.role === "user" && m.content === "START"))

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:absolute lg:inset-auto lg:bottom-0 lg:right-0 lg:top-0 lg:w-[380px]">
      {/* Backdrop on mobile */}
      <div className="fixed inset-0 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative z-50 flex h-[85dvh] w-full flex-col rounded-t-2xl border border-bg-subtle bg-bg-surface shadow-2xl lg:h-full lg:rounded-none lg:rounded-l-xl lg:border-l">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bg-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-subtle">
              <Sparkles size={14} className="text-accent" />
            </div>
            <span className="text-sm font-medium text-text-primary">Tend AI</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-button p-1.5 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Schliessen"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Ribbon */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-bg-subtle px-3 py-2 scrollbar-none">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setMode(mode.value)}
              className={cn(
                "shrink-0 rounded-pill px-3 py-1 text-[11px] font-medium transition-colors",
                activeMode === mode.value
                  ? "border border-accent bg-accent-subtle text-accent-hover"
                  : "border border-bg-subtle bg-bg-elevated text-text-secondary hover:text-text-primary"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Mode description */}
        <div className="border-b border-bg-subtle px-4 py-2">
          <p className="text-[11px] leading-relaxed text-text-muted">
            {MODES.find((m) => m.value === activeMode)?.desc}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {visibleMessages.length === 0 && !isThinking ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles size={28} className="mb-3 text-text-muted" />
              <p className="text-center text-sm text-text-secondary">
                Stelle eine Frage zu deinem Netzwerk
              </p>
            </div>
          ) : (
            visibleMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "assistant"
                      ? "bg-accent-subtle text-accent"
                      : "bg-bg-elevated text-text-secondary"
                  }`}
                >
                  {msg.role === "assistant" ? <Sparkles size={12} /> : <User size={12} />}
                </div>
                <div
                  className={`max-w-[85%] rounded-card px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-bg-elevated text-text-primary"
                      : "bg-accent-subtle text-text-primary"
                  }`}
                >
                  {msg.role === "assistant" && msg.content ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.role === "assistant" && !msg.content ? null : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent">
                <BrainCircuit size={12} className="animate-pulse" />
              </div>
              <div className="rounded-card bg-bg-elevated px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[11px] text-text-muted">Tend AI denkt nach...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-bg-subtle p-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nachricht eingeben..."
              disabled={isThinking}
              className="flex-1 text-sm"
              aria-label="Chat-Nachricht"
            />
            <Button type="submit" disabled={isThinking || !input.trim()} size="icon" className="shrink-0">
              <Send size={14} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
