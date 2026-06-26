"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Receipt, Settings, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subscriptions", label: "Subscriptions", icon: Receipt },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight">Subsify</span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter() {
  const { data: session } = useSession();
  return (
    <div className="border-t border-sidebar-border pt-4">
      <div className="mb-3 px-3">
        <p className="truncate text-sm font-medium">
          {session?.user?.name ?? "Admin"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {session?.user?.email}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-3 text-muted-foreground"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
      <ThemeToggle />
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <Brand />
        <div className="mt-8 flex-1">
          <NavLinks />
        </div>
        <UserFooter />
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 lg:hidden">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar p-5">
              <div className="flex items-center justify-between">
                <Brand />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-8 flex-1">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <UserFooter />
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
