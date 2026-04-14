"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Activity,
  ArrowLeftRight,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/ui"
import { useAuth } from "@/lib/auth-context"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kontakte", label: "Kontakte", icon: Users },
  { href: "/aktivitaeten", label: "Aktivitäten", icon: Activity },
  { href: "/import-export", label: "Import/Export", icon: ArrowLeftRight },
]

const bottomItems = [
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuth()

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "PF"

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-bg-subtle bg-bg-surface transition-all duration-200 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4">
        {!sidebarCollapsed && (
          <span className="font-serif text-xl text-text-primary">Tend</span>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-button p-1.5 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
          aria-label={sidebarCollapsed ? "Sidebar öffnen" : "Sidebar schliessen"}
        >
          {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-button px-3 py-2 text-sm transition-colors duration-100",
                isActive
                  ? "bg-accent-subtle text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
              aria-label={item.label}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 px-2 pb-2">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-button px-3 py-2 text-sm transition-colors duration-100",
                isActive
                  ? "bg-accent-subtle text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
              aria-label={item.label}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        <div className="border-t border-bg-subtle pt-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle font-sans text-xs font-medium text-accent">
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-1 items-center justify-between">
                <span className="truncate text-sm text-text-primary">
                  {user?.email ?? "Pascal"}
                </span>
                <button
                  onClick={logout}
                  className="rounded-button p-1 text-text-muted hover:text-status-red"
                  aria-label="Abmelden"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
