import { NextRequest, NextResponse } from "next/server"

// Handle Microsoft OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/einstellungen?error=oauth_denied`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/einstellungen?error=no_code`
    )
  }

  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID!
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common"
    const redirectUri = `${req.nextUrl.origin}/api/outlook/callback`

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          scope: "Calendars.ReadWrite offline_access",
        }),
      }
    )

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/einstellungen?error=token_failed`
      )
    }

    const tokens = await tokenResponse.json()

    // Store tokens in a cookie (httpOnly for security)
    // In production, store refresh_token in Firestore
    const response = NextResponse.redirect(
      `${req.nextUrl.origin}/einstellungen?success=outlook_connected`
    )

    response.cookies.set("ms_access_token", tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    })

    if (tokens.refresh_token) {
      response.cookies.set("ms_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90, // 90 days
        path: "/",
      })
    }

    return response
  } catch {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/einstellungen?error=oauth_error`
    )
  }
}
