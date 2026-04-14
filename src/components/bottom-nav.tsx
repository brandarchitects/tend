"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Sparkles, Map, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/kontakte", label: "Kontakte", icon: Users },
  { href: "/assistant", label: "AI", icon: Sparkles },
  { href: "/path", label: "Path", icon: Map },
  { href: "/mehr", label: "Mehr", icon: MoreHorizontal },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-bg-subtle bg-bg-surface md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[48px] flex-col items-center gap-0.5 rounded-button px-3 py-2 transition-colors",
                isActive
                  ? "text-accent"
                  : "text-text-muted"
              )}
              aria-label={item.label}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for iPhone notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
