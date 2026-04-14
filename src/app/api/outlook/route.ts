import { NextRequest, NextResponse } from "next/server"

// Microsoft Graph API - Create Outlook Calendar Event

export async function POST(req: NextRequest) {
  try {
    const { accessToken, contactName, contactEmail, date, time, duration, subject } = await req.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Kein Access Token" }, { status: 401 })
    }

    const startDateTime = `${date}T${time}:00`
    const endDate = new Date(`${date}T${time}:00`)
    endDate.setMinutes(endDate.getMinutes() + (duration || 30))
    const endDateTime = endDate.toISOString().replace("Z", "")

    const event = {
      subject: subject || `Treffen mit ${contactName}`,
      start: {
        dateTime: startDateTime,
        timeZone: "Europe/Zurich",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "Europe/Zurich",
      },
      attendees: contactEmail
        ? [
            {
              emailAddress: { address: contactEmail, name: contactName },
              type: "required",
            },
          ]
        : [],
    }

    const response = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: "Fehler beim Erstellen des Termins", details: error },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json({ success: true, eventId: result.id })
  } catch (error) {
    console.error("Outlook API Error:", error)
    return NextResponse.json({ error: "Fehler beim Outlook-API-Aufruf" }, { status: 500 })
  }
}
