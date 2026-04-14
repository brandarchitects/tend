import { NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Du bist Tend AI, ein persönlicher Netzwerk-Assistent für Pascal.
Sprache: Immer Deutsch. Ton: Direkt, warm, klar — wie ein gut informierter Freund.
Schweizer Kontext beachten.

Du hast Zugriff auf Pascals Kontakte und Interaktionen (als JSON injiziert).
Antworte immer konkret mit Bezug auf echte Kontakte — keine generischen Ratschläge.
Wenn Infos fehlen, sag das klar.

Wenn der Chat gestartet wird und die erste Nachricht "START" ist: Begrüsse Pascal mit
1–2 konkreten Empfehlungen für heute, basierend auf den Kontaktdaten.

Formatiere Antworten mit Markdown wenn sinnvoll (fett, Listen).
Halte Antworten prägnant — max. 150 Wörter pro Antwort.`

export async function POST(req: NextRequest) {
  try {
    const { messages, contacts, interactions, strategy } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response("ANTHROPIC_API_KEY nicht konfiguriert", { status: 500 })
    }

    // Build context
    const contextParts = []

    if (strategy) {
      contextParts.push(`[NETZWERKSTRATEGIE]\n${strategy}`)
    }

    if (contacts?.length > 0) {
      contextParts.push(`[KONTAKTE (${contacts.length})]\n${JSON.stringify(contacts)}`)
    }

    if (interactions?.length > 0) {
      contextParts.push(`[LETZTE INTERAKTIONEN]\n${JSON.stringify(interactions)}`)
    }

    const today = new Date()
    const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
    contextParts.push(`[HEUTE] ${dayNames[today.getDay()]}, ${today.toLocaleDateString("de-CH")}`)

    const fullSystemPrompt = SYSTEM_PROMPT + "\n\n" + contextParts.join("\n\n")

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: fullSystemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    })

    // Stream the response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === "content_block_delta") {
            const delta = event.delta
            if ("text" in delta) {
              controller.enqueue(encoder.encode(delta.text))
            }
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    return new Response("Fehler beim KI-Chat", { status: 500 })
  }
}
