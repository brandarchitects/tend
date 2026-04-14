import type { Contact, ContactDoc } from "./types"

interface ParsedVCard {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  position?: string
}

export function parseVCardFile(content: string): ParsedVCard[] {
  const cards: ParsedVCard[] = []
  const entries = content.split("BEGIN:VCARD")

  for (const entry of entries) {
    if (!entry.includes("END:VCARD")) continue

    const lines = entry.split(/\r?\n/)
    const card: ParsedVCard = { firstName: "", lastName: "" }

    for (const line of lines) {
      // Handle N (structured name)
      if (line.startsWith("N:") || line.startsWith("N;")) {
        const value = line.substring(line.indexOf(":") + 1)
        const parts = value.split(";")
        card.lastName = parts[0]?.trim() || ""
        card.firstName = parts[1]?.trim() || ""
      }

      // Fallback to FN if N not parsed
      if ((line.startsWith("FN:") || line.startsWith("FN;")) && !card.firstName && !card.lastName) {
        const value = line.substring(line.indexOf(":") + 1).trim()
        const parts = value.split(" ")
        card.firstName = parts[0] || ""
        card.lastName = parts.slice(1).join(" ") || ""
      }

      // Email
      if (line.toUpperCase().startsWith("EMAIL")) {
        card.email = line.substring(line.indexOf(":") + 1).trim()
      }

      // Phone
      if (line.toUpperCase().startsWith("TEL")) {
        card.phone = line.substring(line.indexOf(":") + 1).trim()
      }

      // Organization
      if (line.startsWith("ORG:") || line.startsWith("ORG;")) {
        card.company = line.substring(line.indexOf(":") + 1).split(";")[0]?.trim()
      }

      // Title/Position
      if (line.startsWith("TITLE:") || line.startsWith("TITLE;")) {
        card.position = line.substring(line.indexOf(":") + 1).trim()
      }
    }

    // Only include if we have at least a name
    if (card.firstName || card.lastName) {
      cards.push(card)
    }
  }

  return cards
}

export function convertToContactData(parsed: ParsedVCard): Omit<ContactDoc, "createdAt" | "updatedAt" | "nextTouchpointDate"> {
  return {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.email,
    phone: parsed.phone,
    company: parsed.company,
    position: parsed.position,
    contexts: [],
    tags: [],
    touchpointIntervalDays: 60,
    lastInteractionDate: undefined,
    notes: undefined,
    linkedinUrl: undefined,
  }
}

export function exportToVCard(contacts: Contact[]): string {
  return contacts
    .map((c) => {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${c.lastName};${c.firstName};;;`,
        `FN:${c.firstName} ${c.lastName}`,
      ]

      if (c.email) lines.push(`EMAIL:${c.email}`)
      if (c.phone) lines.push(`TEL:${c.phone}`)
      if (c.company) lines.push(`ORG:${c.company}`)
      if (c.position) lines.push(`TITLE:${c.position}`)

      lines.push("END:VCARD")
      return lines.join("\r\n")
    })
    .join("\r\n")
}

export function findDuplicates(
  existing: Contact[],
  incoming: ParsedVCard[]
): { card: ParsedVCard; duplicate: boolean; existingId?: string }[] {
  return incoming.map((card) => {
    const match = existing.find(
      (c) =>
        (c.firstName.toLowerCase() === card.firstName.toLowerCase() &&
          c.lastName.toLowerCase() === card.lastName.toLowerCase()) ||
        (card.email && c.email?.toLowerCase() === card.email.toLowerCase())
    )
    return {
      card,
      duplicate: !!match,
      existingId: match?.id,
    }
  })
}
