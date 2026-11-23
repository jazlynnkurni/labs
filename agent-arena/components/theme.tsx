"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const KEY = "arena-theme";
const MEDIA = "(prefers-color-scheme: dark)";

/**
 * Runs in <head> before first paint, so the page never shows the wrong ground.
 * Storage can throw (private windows, blocked site data); then it follows the system.
 */
export const themeScript = `(function(){var d=document.documentElement,p="system";try{p=localStorage.getItem("${KEY}")||"system"}catch(e){}var dark=p==="dark"||(p!=="light"&&window.matchMedia("${MEDIA}").matches);d.classList.toggle("dark",dark)})()`;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(pref: ThemePref) {
  const root = document.documentElement;
  const dark = pref === "dark" || (pref === "system" && window.matchMedia(MEDIA).matches);
  if (root.classList.contains("dark") === dark) return;
  // A short colour-only transition while the theme flips; nothing moves.
  root.classList.add("theme-switching");
  root.classList.toggle("dark", dark);
  window.setTimeout(() => root.classList.remove("theme-switching"), 200);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia(MEDIA);
  const onSystem = () => {
    if (readPref() === "system") apply("system");
    notify();
  };
  media.addEventListener("change", onSystem);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystem);
  };
}

const snapshot = () => `${readPref()}:${document.documentElement.classList.contains("dark") ? "dark" : "light"}`;
const serverSnapshot = () => "system:dark";

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // Not remembered, but still applied for this visit.
  }
  apply(pref);
  notify();
}

export function useTheme(): { pref: ThemePref; resolved: ResolvedTheme } {
  const [pref, resolved] = useSyncExternalStore(subscribe, snapshot, serverSnapshot).split(":") as [ThemePref, ResolvedTheme];
  return { pref, resolved };
}

/**
 * One glyph, everywhere: sun in light, moon in dark. A press flips to the other theme and
 * the glyph morphs (scale 0.25 to 1, opacity, blur 4px to 0). Until pressed, it follows the system.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved } = useTheme();
  const next: ResolvedTheme = resolved === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      onClick={() => setThemePref(next)}
      className={cn(
        "theme-icon press grid size-10 place-items-center text-muted-foreground transition-colors [@media(pointer:coarse)]:size-11 [@media(hover:hover)]:hover:text-foreground",
        className,
      )}
    >
      <Sun className="theme-icon-sun size-4" strokeWidth={1.75} aria-hidden />
      <Moon className="theme-icon-moon size-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
