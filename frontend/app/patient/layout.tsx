"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  BarChart3,
  MessageSquare,
  Mic,
  Leaf,
  BookOpen,
  Calendar,
  Home,
  Menu,
  LogOut,
  Settings,
  X,
} from "lucide-react"
import { useState } from "react"
import AuthGuard from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"

const sidebarItems = [
  { name: "Dashboard", href: "/patient", icon: BarChart3 },
  { name: "AI Companion", href: "/patient/companion", icon: MessageSquare },
  { name: "Listening Agent", href: "/patient/listening", icon: Mic },
  { name: "Wellness", href: "/patient/wellness", icon: Leaf },
  { name: "Journal", href: "/patient/journal", icon: BookOpen },
  { name: "Appointments", href: "/patient/appointments", icon: Calendar },
]

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <AuthGuard requiredRole="patient">
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
          <div className="flex h-14 items-center gap-2.5 border-b border-border px-6">
            <div className="relative w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4 text-background"
              >
                <path
                  d="M12 21C12 21 4 15.5 4 10C4 7.5 6 5 8.5 5C10 5 11.5 6 12 7.5C12.5 6 14 5 15.5 5C18 5 20 7.5 20 10C20 15.5 12 21 12 21Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 12H10L11 10L13 14L14 12H16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">BeWell</span>
            <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Patient
            </span>
          </div>

          <ScrollArea className="flex-1 py-4">
            <nav className="flex flex-col gap-1 px-3">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          <div className="border-t border-border p-3 flex flex-col gap-1">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile Header + Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="md:hidden flex h-14 items-center justify-between border-b border-border px-4 bg-card">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 text-background"
                >
                  <path
                    d="M12 21C12 21 4 15.5 4 10C4 7.5 6 5 8.5 5C10 5 11.5 6 12 7.5C12.5 6 14 5 15.5 5C18 5 20 7.5 20 10C20 15.5 12 21 12 21Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 12H10L11 10L13 14L14 12H16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">
                BeWell
              </span>
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-14 items-center justify-between border-b border-border px-4">
                  <span className="text-sm font-semibold text-foreground">
                    Navigation
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="flex flex-col gap-1 p-3">
                  {sidebarItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
                <div className="border-t border-border p-3 mt-auto">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    Back to Home
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
