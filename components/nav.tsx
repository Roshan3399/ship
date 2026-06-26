"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Plus, Compass, User } from "lucide-react"

export function Nav() {
  const path = usePathname()
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/builds/new", label: "New Build", icon: Plus },
    { href: "/season", label: "Season", icon: Compass },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background md:top-0 md:bottom-auto md:border-t-0 md:border-b z-40">
      <div className="mx-auto flex max-w-2xl items-center justify-around h-14 px-4">
        {links.map((link) => {
          const Icon = link.icon
          const active = path === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
