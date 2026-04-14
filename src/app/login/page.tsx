"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      router.push("/")
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      console.error("Login-Fehler:", firebaseError.code, firebaseError.message)

      switch (firebaseError.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("E-Mail oder Passwort ist falsch.")
          break
        case "auth/invalid-email":
          setError("Ungültige E-Mail-Adresse.")
          break
        case "auth/too-many-requests":
          setError("Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.")
          break
        case "auth/network-request-failed":
          setError("Netzwerkfehler. Prüfe deine Internetverbindung.")
          break
        case "auth/invalid-api-key":
          setError("Firebase ist nicht korrekt konfiguriert. Prüfe die API-Keys in den Vercel Environment Variables.")
          break
        default:
          setError(`Anmeldung fehlgeschlagen: ${firebaseError.code || firebaseError.message || "Unbekannter Fehler"}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      {/* Subtle radial gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(201,123,75,0.03) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-12 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/TREE.png" alt="" className="mx-auto mb-4 h-16 w-16" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
          <h1 className="font-serif text-display text-text-primary">Tend</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Dein Netzwerk. Gepflegt.
          </p>
        </div>

        {/* Config Warning */}
        {!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && (
          <div className="mb-6 rounded-card border border-status-yellow/30 bg-status-yellow/5 p-3">
            <p className="text-xs text-status-yellow">
              Firebase ist nicht konfiguriert. Setze die Environment Variables in Vercel
              (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
              NEXT_PUBLIC_FIREBASE_PROJECT_ID) und mache ein Redeploy.
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-text-secondary">
              E-Mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="pascal@example.ch"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="E-Mail-Adresse"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-text-secondary">
              Passwort
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Passwort"
            />
          </div>

          {error && (
            <p className="text-sm text-status-red" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Anmelden..." : "Anmelden"}
          </Button>
        </form>
      </div>
    </div>
  )
}
