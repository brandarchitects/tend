"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getContacts } from "@/lib/contacts"
import { getAllInteractions } from "@/lib/interactions"
import { getStrategy } from "@/lib/strategy"
import type { ChatMessage, Contact, Interaction } from "@/lib/types"
import { Send, Sparkles, User } from "lucide-react"
import ReactMarkdown from "react-markdown"

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [strategy, setStrategy] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Load contacts and start proactive greeting
  useEffect(() => {
    async function init() {
      const [c, i, s] = await Promise.all([getContacts(), getAllInteractions(), getStrategy()])
      setContacts(c)
      setInteractions(i.slice(0, 10))
      setStrategy(s?.content ?? null)

      if (c.length > 0) {
        // Send proactive greeting
        await sendMessage("START", c, i.slice(0, 10), s?.content ?? null, true)
      }
      setInitialized(true)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(
    content: string,
    contactsData?: Contact[],
    interactionsData?: Interaction[],
    strategyData?: string | null,
    isInit?: boolean
  ) {
    const userMsg: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    const currentMessages = isInit ? [] : messages
    const apiMessages = [...currentMessages, userMsg]
      .filter((m) => !(m.role === "user" && m.content === "START"))

    if (!isInit) {
      setMessages((prev) => [...prev, userMsg])
    }

    setStreaming(true)
    setInput("")

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: isInit
            ? [{ role: "user", content: "START" }]
            : apiMessages.map((m) => ({ role: m.role, content: m.content })),
          contacts: (contactsData ?? contacts).map((c) => ({
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
          strategy: strategyData !== undefined ? strategyData : strategy,
          interactions: (interactionsData ?? interactions).map((i) => ({
            contactId: i.contactId,
            channel: i.channel,
            note: i.note,
            date: i.date,
          })),
        }),
      })

      if (!res.ok) throw new Error("Fehler beim KI-Chat")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("Kein Stream")

      const decoder = new TextDecoder()
      let fullText = ""

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...assistantMsg, content: fullText }
          return updated
        })
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setStreaming(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || streaming) return
    sendMessage(input.trim(), undefined, undefined, undefined, false)
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-accent" />
          <h1 className="font-serif text-xl text-text-primary">Tend AI</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto rounded-card border border-bg-subtle bg-bg-surface p-4">
          {!initialized ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-text-muted">Lade Netzwerkdaten...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles size={32} className="mb-3 text-text-muted" />
              <p className="text-sm text-text-secondary">
                Stelle eine Frage zu deinem Netzwerk
              </p>
            </div>
          ) : (
            messages
              .filter((m) => !(m.role === "user" && m.content === "START"))
              .map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "assistant"
                        ? "bg-accent-subtle text-accent"
                        : "bg-bg-elevated text-text-secondary"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Sparkles size={14} />
                    ) : (
                      <User size={14} />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-card px-3 py-2 text-sm ${
                      msg.role === "assistant"
                        ? "bg-bg-elevated text-text-primary"
                        : "bg-accent-subtle text-text-primary"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                        }}
                      >
                        {msg.content || "..."}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
          )}

          {streaming && (
            <div className="flex items-center gap-1 px-3 py-1 text-text-muted">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht eingeben..."
            disabled={streaming}
            className="flex-1"
            aria-label="Chat-Nachricht"
          />
          <Button type="submit" disabled={streaming || !input.trim()} size="icon">
            <Send size={16} />
          </Button>
        </form>
      </div>
    </AppShell>
  )
}
