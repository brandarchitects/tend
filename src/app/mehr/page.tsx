"use client"

import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import {
  Activity,
  ArrowLeftRight,
  Settings,
  LogOut,
} from "lucide-react"

const menuItems = [
  { href: "/aktivitaeten", label: "Aktivitäten", icon: Activity, desc: "Chronologischer Überblick" },
  { href: "/import-export", label: "Import / Export", icon: ArrowLeftRight, desc: "vCard Import & Export" },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings, desc: "Konfiguration & Integrationen" },
]

export default function MehrPage() {
  const { logout } = useAuth()

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text-primary">Mehr</h1>
      </div>

      <div className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-card px-4 py-3 transition-colors hover:bg-bg-elevated"
          >
            <item.icon size={20} className="shrink-0 text-text-secondary" />
            <div>
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              <p className="text-xs text-text-muted">{item.desc}</p>
            </div>
          </Link>
        ))}

        <button
          onClick={logout}
          className="flex w-full items-center gap-4 rounded-card px-4 py-3 transition-colors hover:bg-bg-elevated"
        >
          <LogOut size={20} className="shrink-0 text-status-red" />
          <div className="text-left">
            <p className="text-sm font-medium text-status-red">Abmelden</p>
          </div>
        </button>
      </div>
    </AppShell>
  )
}
