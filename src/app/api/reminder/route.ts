import { NextRequest, NextResponse } from "next/server"

// This endpoint is called by Vercel Cron daily to check for due touchpoints
// and send reminder emails via Resend

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Dynamic import to avoid issues when Firebase isn't configured
    const { initializeApp, getApps } = await import("firebase-admin/app")
    const { getFirestore } = await import("firebase-admin/firestore")

    // Initialize Firebase Admin (server-side)
    if (getApps().length === 0) {
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    }

    const db = getFirestore()
    const today = new Date().toISOString().split("T")[0]

    // Find contacts with overdue touchpoints
    const snapshot = await db
      .collection("contacts")
      .where("nextTouchpointDate", "<=", today)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ message: "Keine fälligen Touchpoints", count: 0 })
    }

    const overdueContacts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Send reminder email via Resend
    if (process.env.RESEND_API_KEY) {
      const emailBody = overdueContacts
        .map((c: Record<string, string>) => `• ${c.firstName} ${c.lastName} (${c.company || "–"})`)
        .join("\n")

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Nexus <noreply@nexus.app>",
          to: ["pascal@example.ch"], // TODO: Configure in settings
          subject: `Nexus: ${overdueContacts.length} Touchpoint${overdueContacts.length > 1 ? "s" : ""} fällig`,
          text: `Hallo Pascal,\n\nFolgende Kontakte warten auf ein Lebenszeichen:\n\n${emailBody}\n\nÖffne Nexus um Details zu sehen.\n\nDein Nexus-Assistent`,
        }),
      })
    }

    return NextResponse.json({
      message: `${overdueContacts.length} Reminder gesendet`,
      count: overdueContacts.length,
    })
  } catch (error) {
    console.error("Reminder Error:", error)
    return NextResponse.json({ error: "Fehler beim Reminder-Check" }, { status: 500 })
  }
}
