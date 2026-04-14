import { NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const BASE_PROMPT = `Du bist Tend AI, der persönliche Netzwerk-Assistent von Pascal.

PERSÖNLICHER KONTEXT:
Pascal ist Creative Director bei Swisscom + Gründer von Brand Architects und Visari.
Er positioniert sich als «Branding-Unternehmer» — Corporate, KMU und AI-Branding.

SPRACHE UND TON:
- Immer Deutsch, Hochdeutsch (kein Schweizerdeutsch)
- Schweizer Kontext beachten (Firmen, Regionen, Netzwerke)
- Direkt, warm, konkret — kein Business-Jargon
- Beim Chat-Start mit aktuellem Kontext begrüssen
- Maximal 150 Wörter pro Antwort ausser explizit mehr gewünscht

WICHTIG:
- Nur Aussagen auf Basis vorhandener Daten — keine Erfindungen
- Bei fehlenden Infos klar sagen: «Dazu habe ich keine Daten»`

const MODE_PROMPTS: Record<string, string> = {
  network: `AKTIVER MODUS: Netzwerk
Fokus: Netzwerkpflege basierend auf Pascals Kontaktdaten und Strategie.
Priorisiere: Überfällige Kontakte, bald fällige Touchpoints, Wochenplan-Aktionen.
Beim Chat-Start (Message "START"): Begrüsse mit 1–2 konkreten Kontakt-Empfehlungen für heute.
Zeige: Welcher Kontakt, welche Zone, wann letzter Kontakt war.`,

  bestpractice: `AKTIVER MODUS: Best Practice
Fokus: Faktisches Expertenwissen zu Networking, Beziehungsaufbau, Kommunikation.
Keine persönlichen Ratschläge, keine Coaching-Fragen.
Format: Konkret, umsetzbar, 3–5 Punkte max. Kein Fliesstext-Essay.
Beispiele nennen wie Profis (Headhunter, CMOs, Top-Networker) es machen.
Beim Chat-Start (Message "START"): Kurzer Tipp des Tages zum Networking.`,

  career: `AKTIVER MODUS: Karriere
Fokus: Karrierestrategie, Positionierung als Experte, internes Stakeholder-Management.
Kontext: Creative Director Swisscom + Gründer — dieser Dualität bewusst sein.
Faktisch: Wie machen es Führungskräfte die erfolgreich gewechselt haben?
Beim Chat-Start (Message "START"): Ein kurzer Karriere-Impuls basierend auf Pascals Situation.`,

  message: `AKTIVER MODUS: Nachricht
Fokus: Nachrichten-Entwürfe für konkrete Kontakte.
Stil: Kurz (3–5 Sätze), persönlich, kein Verkaufscharakter, authentisch.
Kontakt-Daten nutzen: Name, letzte Interaktion, gemeinsame Themen.
Immer: Einen Entwurf liefern + kurzen Hinweis was man anpassen kann.
Format: Entwurf in Anführungszeichen, danach 1 Satz Erklärung.
Beim Chat-Start (Message "START"): Frage nach Kontakt und Anlass.`,
}

const WEEKDAY_MAP: Record<string, string> = {
  Montag: "LinkedIn-Post veröffentlichen (Branding/AI-Pillar)",
  Dienstag: "Tägliches Engagement: 3–5 Kommentare auf Zielpersonen",
  Mittwoch: "«Thinking of you»-Nachricht ohne Agenda senden",
  Donnerstag: "Zweiter LinkedIn-Post (Frage/Beobachtung/Behind-Scenes)",
  Freitag: "Neue Verbindungsanfrage + Cold-to-Warm-Aktion",
  Samstag: "Optional: Posts für nächste Woche vorbereiten",
  Sonntag: "Optional: Posts für nächste Woche vorbereiten",
}

export async function POST(req: NextRequest) {
  try {
    const { message, mode, currentScreen, messages, contacts, strategy } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response("ANTHROPIC_API_KEY nicht konfiguriert", { status: 500 })
    }

    // Build smart context
    const contextParts: string[] = []

    // Date + weekday
    const today = new Date()
    const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
    const weekday = dayNames[today.getDay()]
    const dateStr = today.toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    const weekdayHint = WEEKDAY_MAP[weekday] ?? ""
    contextParts.push(`HEUTIGE SITUATION:\nDatum: ${dateStr}\nWochentag-Aktion: ${weekdayHint}`)

    // Screen awareness
    if (currentScreen && currentScreen !== "dashboard") {
      contextParts.push(`Aktueller Screen: ${currentScreen}`)
    }

    // Strategy (compressed if provided)
    if (strategy) {
      // Take first 2000 chars of strategy to stay within token budget
      const compressed = strategy.length > 2000 ? strategy.slice(0, 2000) + "..." : strategy
      contextParts.push(`NETZWERKSTRATEGIE (komprimiert):\n${compressed}`)
    }

    // Contacts snapshot — only overdue and due-soon
    if (contacts?.length > 0) {
      const overdue = contacts.filter((c: { daysSinceContact: number | null }) => c.daysSinceContact && c.daysSinceContact > 60).slice(0, 5)
      const dueSoon = contacts.filter((c: { daysSinceContact: number | null }) => c.daysSinceContact && c.daysSinceContact > 30 && c.daysSinceContact <= 60).slice(0, 5)

      if (overdue.length > 0) {
        contextParts.push(`ÜBERFÄLLIGE KONTAKTE (>60 Tage):\n${JSON.stringify(overdue)}`)
      }
      if (dueSoon.length > 0) {
        contextParts.push(`BALD FÄLLIGE KONTAKTE (30–60 Tage):\n${JSON.stringify(dueSoon)}`)
      }

      // Compact all contacts summary
      const summary = contacts.map((c: { name: string; company?: string; daysSinceContact?: number | null }) =>
        `${c.name}${c.company ? ` (${c.company})` : ""}${c.daysSinceContact ? ` · ${c.daysSinceContact}d` : ""}`
      ).join(", ")
      contextParts.push(`ALLE KONTAKTE (Übersicht): ${summary}`)
    }

    // Mode-specific prompt
    const modePrompt = MODE_PROMPTS[mode] ?? MODE_PROMPTS.network

    const fullSystemPrompt = [BASE_PROMPT, modePrompt, ...contextParts].join("\n\n")

    // Build messages array
    const apiMessages = [
      ...(messages ?? []),
      { role: "user" as const, content: message },
    ]

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: fullSystemPrompt,
      messages: apiMessages,
    })

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
