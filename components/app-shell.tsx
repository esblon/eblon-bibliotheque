"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { NAV_ITEMS } from "@/components/nav-items"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { BookMarked, LogOut, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

type AppUser = {
  name: string
  email: string
  role: "ADMIN" | "ENSEIGNANT" | "BIBLIOTHECAIRE" | "LECTEUR"
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BookMarked className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground">Bibliothèque Ebene BLON</p>
        <p className="text-xs text-muted-foreground">Gestion de la Bibliothèque</p>
      </div>
    </div>
  )
}

export function AppShell({
  user,
  children,
}: {
  user: AppUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  const roleLabel = {
    ADMIN: "Administrateur",
    ENSEIGNANT: "Enseignant",
    BIBLIOTHECAIRE: "Bibliothécaire",
    LECTEUR: "Lecteur",
  }[user.role]

  const UserFooter = (
    <div className="border-t border-border p-3">
      <div className="mb-2 px-2">
        <p className="truncate text-sm font-medium text-foreground">
          {user.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {roleLabel}
          </Badge>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="w-full justify-start text-muted-foreground"
      >
        <LogOut className="size-4" />
        Se déconnecter
      </Button>
    </div>
  )

  return (
    <div className="min-h-svh bg-muted">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b border-border">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks pathname={pathname} />
        </div>
        {UserFooter}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-sidebar px-4 md:hidden">
        <Brand />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" aria-label="Ouvrir le menu" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <div className="flex h-16 items-center border-b border-border">
              <Brand />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            </div>
            {UserFooter}
          </SheetContent>
        </Sheet>
      </header>

      {/* Main content */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
