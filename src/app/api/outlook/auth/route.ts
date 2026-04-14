import { NextRequest, NextResponse } from "next/server"

// Redirect to Microsoft OAuth login
export async function GET(req: NextRequest) {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common"
  const redirectUri = `${req.nextUrl.origin}/api/outlook/callback`

  if (!clientId) {
    return NextResponse.json({ error: "MICROSOFT_CLIENT_ID nicht konfiguriert" }, { status: 500 })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "Calendars.ReadWrite offline_access",
    response_mode: "query",
  })

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`
  return NextResponse.redirect(authUrl)
}
