"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { History, ListChecks, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { StatusDot } from "@/components/status";
import { ThemeToggle } from "@/components/theme";

interface RecentExperiment {
  id: string;
  title: string;
  status: string;
}

const NAV = [
  { href: "/", label: "New comparison", icon: Plus, match: (p: string) => p === "/" },
  { href: "/experiments", label: "History", icon: History, match: (p: string) => p === "/experiments" },
  { href: "/settings", label: "Agents", icon: Settings2, match: (p: string) => p.startsWith("/settings") },
  { href: "/qa", label: "Design QA", icon: ListChecks, match: (p: string) => p.startsWith("/qa") },
];

/** The URL is request-time data in Next 16, so everything that reads it sits in Suspense. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Suspense fallback={<Sidebar pathname="" />}>
        <SidebarWithPath />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<MobileHeader pathname="" />}>
          <MobileHeaderWithPath />
        </Suspense>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarWithPath() {
  return <Sidebar pathname={usePathname()} />;
}

function MobileHeaderWithPath() {
  return <MobileHeader pathname={usePathname()} />;
}

function Sidebar({ pathname }: { pathname: string }) {
  const [recent, setRecent] = useState<RecentExperiment[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api<{ experiments: RecentExperiment[] }>("/api/experiments")
        .then((d) => alive && setRecent(d.experiments.slice(0, 8)))
        .catch(() => undefined);
    void load();
    const t = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pathname]);

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 md:flex">
        <Link href="/" className="mb-6 flex h-8 items-center gap-2 px-2">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">Agent Arena</span>
        </Link>
        <nav className="flex flex-col gap-0.5" aria-label="Main">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors [@media(hover:hover)]:hover:text-foreground",
                  active && "bg-sidebar-accent text-foreground",
                )}
              >
                <item.icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {recent.length > 0 && (
          <div className="mt-8 min-h-0 flex-1">
            <p className="mb-2 px-2 text-xs font-medium text-faint">Recent</p>
            <ul className="flex flex-col gap-0.5">
              {recent.map((e) => {
                const href = `/experiments/${e.id}`;
                const active = pathname === href;
                return (
                  <li key={e.id}>
                    <Link
                      href={href}
                      className={cn(
                        "flex h-8 min-w-0 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors [@media(hover:hover)]:hover:text-foreground",
                        active && "bg-sidebar-accent text-foreground",
                      )}
                    >
                      <StatusDot status={e.status} />
                      <span className="min-w-0 truncate">{e.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pl-2">
          <p className="min-w-0 truncate text-xs text-faint">Local only, nothing is pushed</p>
          <ThemeToggle />
        </div>
    </aside>
  );
}

function MobileHeader({ pathname }: { pathname: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-1 border-b border-hairline bg-background/80 px-4 backdrop-blur md:hidden">
      <Link href="/" className="mr-auto flex items-center gap-2">
        <Logo />
        <span className="text-sm font-semibold tracking-tight">Agent Arena</span>
      </Link>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          className={cn("grid size-11 place-items-center text-muted-foreground", item.match(pathname) && "text-foreground")}
        >
          <item.icon className="size-4" strokeWidth={1.75} />
        </Link>
      ))}
      <ThemeToggle className="size-11" />
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <rect x="1.5" y="1.5" width="7.5" height="17" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="11" y="1.5" width="7.5" height="17" rx="2" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
