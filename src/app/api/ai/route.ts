import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { contacts, type } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY nicht konfiguriert" },
        { status: 500 }
      )
    }

    let systemPrompt: string
    let userPrompt: string

    if (type === "recommendations") {
      systemPrompt = `Du bist ein persönlicher Netzwerk-Assistent. Du analysierst Kontaktdaten und gibst auf Deutsch konkrete, kurze Empfehlungen, wen der Nutzer als Nächstes kontaktieren sollte und warum. Antworte im JSON-Format als Array von Objekten mit den Feldern: contactId, contactName, reason, suggestedAction. Maximal 3 Empfehlungen. Priorisiere Kontakte die überfällig sind oder bei denen ein wichtiger Kontext besteht.`

      userPrompt = `Hier sind meine Kontakte:\n${JSON.stringify(contacts, null, 2)}\n\nWen sollte ich als Nächstes kontaktieren? Gib mir konkrete, persönliche Empfehlungen.`
    } else if (type === "summary") {
      systemPrompt = `Du bist ein persönlicher Netzwerk-Assistent. Du fasst die Beziehung zu einem Kontakt auf Deutsch in 2-3 Sätzen zusammen, basierend auf den vorhandenen Daten. Sei prägnant und persönlich.`

      userPrompt = `Fasse die Beziehung zu diesem Kontakt zusammen:\n${JSON.stringify(contacts, null, 2)}`
    } else {
      return NextResponse.json({ error: "Unbekannter Typ" }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    const content = message.content[0]
    const text = content.type === "text" ? content.text : ""

    return NextResponse.json({ result: text })
  } catch (error) {
    console.error("AI API Error:", error)
    return NextResponse.json(
      { error: "Fehler bei der KI-Analyse" },
      { status: 500 }
    )
  }
}
